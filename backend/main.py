"""
Conflict Intelligence System — FastAPI Backend
==============================================
Endpoints:
  GET  /health          → health check + store stats
  POST /update          → ingest OSINT (GNews + RSS) → FAISS + SQLite
  GET  /analyze?query=  → run 4-agent CrewAI analysis pipeline
  POST /clear           → wipe all stored data (dev/reset use)
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database.store_manager  import StoreManager
from ingestion.gnews_fetcher import fetch_gnews
from ingestion.rss_fetcher   import fetch_rss
from processing.cleaner      import clean_documents
from processing.chunker      import chunk_documents
from pipeline.crew_runner    import run_analysis

# ─── Global Store (singleton) ────────────────────────────────────────────────
store = StoreManager()


# ─── Lifespan (startup / shutdown) ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print("  Conflict Intelligence System — Starting Up")
    print("=" * 60)
    store.initialize()
    yield
    print("[Shutdown] Closing database connections...")
    store.sqlite.close()


# ─── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Conflict Intelligence System",
    description=(
        "AI-powered OSINT conflict early-warning system. "
        "Uses CrewAI multi-agent pipeline + Ollama/llama3.2 + FAISS + SQLite."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Vite dev server and any localhost origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    """
    Returns system health status and database statistics.
    Use this to verify the backend is running and the store is loaded.
    """
    stats = store.get_stats()
    return {
        "status": "ok",
        "store_ready": store.is_ready(),
        "ollama_url": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        "model": os.getenv("LLM_MODEL", "llama3.2"),
        "stats": stats,
    }


@app.post("/update", tags=["Ingestion"])
async def update_data(
    query: str = Query(
        default="conflict war military protest violence",
        description="Keyword to guide news ingestion",
    )
):
    """
    Ingest fresh OSINT data from GNews API and BBC/Reuters/AJ RSS feeds.

    - Deduplication: articles already in the store are skipped (SQLite check)
    - Incremental: new vectors are MERGED into the existing FAISS index
    - No full rebuild: existing indexed data is preserved

    Returns ingestion summary and current store statistics.
    """
    print(f"\n[/update] Query: '{query}'")

    # ── Fetch in Parallel ──────────────────────────────────────────────────
    import asyncio
    
    gnews_task = asyncio.to_thread(fetch_gnews, query)
    rss_task   = asyncio.to_thread(fetch_rss, query)
    
    gnews_docs, rss_docs = await asyncio.gather(gnews_task, rss_task)
    all_docs = gnews_docs + rss_docs

    print(
        f"[/update] Fetched: {len(gnews_docs)} GNews + "
        f"{len(rss_docs)} RSS = {len(all_docs)} total"
    )

    if not all_docs:
        return {
            "status": "warning",
            "message": "No articles fetched. Check API key or network.",
            "ingestion": {"added": 0, "skipped": 0, "total": 0},
            "store_stats": store.get_stats(),
        }

    # ── Clean → Chunk → Store ──────────────────────────────────────────────
    cleaned = clean_documents(all_docs)
    chunks  = chunk_documents(cleaned)
    result  = store.add_documents(chunks)

    return {
        "status": "ok",
        "query": query,
        "ingestion": result,
        "store_stats": store.get_stats(),
    }


@app.get("/analyze", tags=["Analysis"])
async def analyze(
    query: str = Query(
        ...,
        description="Any topic or conflict to analyse (e.g. 'Epstein files', 'Gaza ceasefire')",
    )
):
    """
    Run the fast single-shot intelligence analysis pipeline for any query.
    Automatically fetches fresh news articles for the specific topic before analysis.
    """
    print(f"\n[/analyze] Query: '{query}'")

    # ── Step 1: Fetch fresh topic-specific news in parallel ───────────────────
    import asyncio
    from processing.cleaner import clean_documents
    from processing.chunker import chunk_documents

    print(f"[/analyze] Fetching fresh news for: '{query}'")
    gnews_task = asyncio.to_thread(fetch_gnews, query, 10)
    rss_task   = asyncio.to_thread(fetch_rss,   query)

    gnews_docs, rss_docs = await asyncio.gather(gnews_task, rss_task)
    fresh_docs = gnews_docs + rss_docs
    print(f"[/analyze] Fresh fetch: {len(gnews_docs)} GNews + {len(rss_docs)} RSS = {len(fresh_docs)} docs")

    # ── Step 2: Decide which documents to use ─────────────────────────────────
    if fresh_docs:
        # Use fresh fetched docs directly (most relevant to the query)
        cleaned    = clean_documents(fresh_docs)
        chunks     = chunk_documents(cleaned)
        docs_to_analyze = chunks[:10] if chunks else fresh_docs[:10]
        print(f"[/analyze] Using {len(docs_to_analyze)} fresh documents for analysis")

        # Also store them in FAISS for future searches
        try:
            store.add_documents(chunks)
        except Exception as e:
            print(f"[/analyze] FAISS store warning (non-fatal): {e}")

    elif store.is_ready():
        # Fallback: search existing FAISS index
        docs_to_analyze = store.search(query, k=8)
        print(f"[/analyze] Fallback: using {len(docs_to_analyze)} FAISS documents")

        if not docs_to_analyze:
            raise HTTPException(
                status_code=404,
                detail=f"No articles found for '{query}'. Check your internet connection or try a different query."
            )
    else:
        raise HTTPException(
            status_code=503,
            detail="No data available. The news fetcher returned no results and the vector store is empty."
        )

    # ── Step 3: Run the analysis pipeline ────────────────────────────────────
    source_urls = [d.metadata.get("url", d.metadata.get("link", "")) for d in docs_to_analyze]

    try:
        print(f"[/analyze] Starting single-shot pipeline for: '{query}'")
        result = run_analysis(query, docs_to_analyze, source_urls)

        # ── Save to trends DB — type-safe coercion to prevent SQLite errors ──
        def _safe_str(v, default="unknown"):
            return str(v) if not isinstance(v, (dict, list)) else default

        def _safe_float(v, default=0.0):
            try: return float(v) if not isinstance(v, (dict, list)) else default
            except: return default

        def _safe_int(v, default=50):
            try: return int(float(v)) if not isinstance(v, (dict, list)) else default
            except: return default

        try:
            store.sqlite.add_analysis_record(
                query=query,
                risk=_safe_str(result.get("risk"), "MEDIUM"),
                risk_numerical=_safe_int(result.get("risk_numerical"), 50),
                confidence=_safe_float(result.get("confidence"), 0.5),
                location=_safe_str(result.get("location"), "unknown"),
                lat=_safe_float(result.get("latitude"), 0.0),
                lng=_safe_float(result.get("longitude"), 0.0)
            )
        except Exception as db_err:
            # DB write failure is non-fatal — still return the analysis
            print(f"[/analyze] DB record warning (non-fatal): {db_err}")

        return result
    except Exception as e:
        import traceback
        print(f"\n[CRITICAL ERROR] Analysis failed: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis Pipeline Error: {str(e)}")




@app.get("/trends", tags=["Analysis"])
async def get_trends(
    query: str = Query(..., description="Query to fetch trends for")
):
    """
    Fetch historical risk/confidence data for a specific query to visualize trends.
    """
    trends = store.sqlite.get_query_trends(query)
    return {"query": query, "trends": trends}



@app.post("/clear", tags=["System"])
async def clear_store():
    """
    Wipe all stored data (FAISS index + SQLite metadata).
    Use for development / data reset. Irreversible.
    """
    store.clear()
    return {"status": "ok", "message": "All data cleared. Call /update to re-ingest."}
