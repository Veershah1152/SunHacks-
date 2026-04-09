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

    # ── Fetch ──────────────────────────────────────────────────────────────
    gnews_docs = fetch_gnews(query)
    rss_docs   = fetch_rss(query)
    all_docs   = gnews_docs + rss_docs

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
        description="Region or conflict topic to analyse (e.g. 'Sudan', 'Gaza ceasefire')",
    )
):
    """
    Run the 4-agent CrewAI conflict analysis pipeline for a given query.

    Pipeline:
      1. IngestionAgent  → extract facts from retrieved FAISS documents
      2. DetectionAgent  → detect signals + risk + confidence
      3. SimulationAgent → generate 3 scenarios
      4. ReportAgent     → compile strict JSON report

    Retrieves top-5 documents from FAISS (vector similarity search).
    Target response time: < 60 seconds (LLM-bound).
    """
    print(f"\n[/analyze] Query: '{query}'")

    if not store.is_ready():
        raise HTTPException(
            status_code=503,
            detail=(
                "Vector store is empty. "
                "Call POST /update first to ingest OSINT data."
            ),
        )

    # ── Retrieve relevant documents ────────────────────────────────────────
    docs = store.search(query, k=5)

    if not docs:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No documents found for '{query}'. "
                "Try a broader query or call POST /update to refresh data."
            ),
        )

    print(f"[/analyze] Retrieved {len(docs)} documents from FAISS")

    # ── Run multi-agent pipeline ───────────────────────────────────────────
    source_urls = [d.metadata.get("link", "") for d in docs]
    
    try:
        print(f"[/analyze] Starting CrewAI pipeline for: {query}")
        result = run_analysis(query, docs, source_urls)
        
        # ── Save outcome for trend tracking ────────────────────────────────────
        store.sqlite.add_analysis_record(
            query=query,
            risk=result.get("risk", "MEDIUM"),
            confidence=result.get("confidence", 0.5),
            location=result.get("location", "unknown"),
            lat=result.get("latitude", 0.0),
            lng=result.get("longitude", 0.0)
        )
        return result
    except Exception as e:
        import traceback
        print(f"\n[CRITICAL ERROR] Analysis failed: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI Pipeline Error: {str(e)}")



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
