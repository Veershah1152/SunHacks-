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
from auth_utils import verify_google_token, create_access_token, get_current_user_payload
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends


security = HTTPBearer()


# ─── Global Store (singleton) ────────────────────────────────────────────────
store = StoreManager()


# ─── Lifespan (startup / shutdown) ──────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"  Store Ready: {store.is_ready()}")
    print("  Registered Vectors: ", store.get_stats().get("total_vectors", 0))
    print("  Routes Active: ", [r.path for r in app.routes])
    print("=" * 60)
    store.initialize()

    yield
    print("[Shutdown] Closing database connections...")
    store.close()   # closes both SQLite and MongoDB Atlas


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

# CORS configuration
# Note: allow_origins cannot be ["*"] when allow_credentials=True
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
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
        "version": "1.0.1-auth-fix",
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

    # ── Step 2: Decide which documents to use ────────────────────────────────
    if fresh_docs:
        # Use fresh fetched docs directly (most relevant to the query)
        cleaned    = clean_documents(fresh_docs)
        chunks     = chunk_documents(cleaned)
        docs_to_analyze = chunks[:10] if chunks else fresh_docs[:10]
        print(f"[/analyze] Using {len(docs_to_analyze)} fresh documents for analysis")

        # Also store them in FAISS for future searches
        try:
            store.add_documents(chunks)   # also dual-writes to Atlas
        except Exception as e:
            print(f"[/analyze] FAISS store warning (non-fatal): {e}")

    elif store.mongo.is_enabled:
        # ── Atlas fallback: GNews failed but we have cached articles in cloud ──
        atlas_docs = store.mongo.search_articles(query, limit=10)
        if atlas_docs:
            print(f"[/analyze] GNews unavailable — using {len(atlas_docs)} Atlas cached articles")
            docs_to_analyze = atlas_docs
        elif store.is_ready():
            # Final fallback: local FAISS index
            docs_to_analyze = store.search(query, k=8)
            print(f"[/analyze] Atlas empty for topic — using {len(docs_to_analyze)} FAISS docs")
        else:
            raise HTTPException(
                status_code=404,
                detail=f"No articles found for '{query}'. GNews unavailable and Atlas cache is empty."
            )

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
            # Mirror to Atlas (non-blocking — fire-and-forget)
            store.mongo.add_analysis_record(
                query=query,
                risk=_safe_str(result.get("risk"), "MEDIUM"),
                risk_numerical=_safe_int(result.get("risk_numerical"), 50),
                confidence=_safe_float(result.get("confidence"), 0.5),
                location=_safe_str(result.get("location"), "unknown"),
                lat=_safe_float(result.get("latitude"), 0.0),
                lng=_safe_float(result.get("longitude"), 0.0),
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


# ─── Authentication ──────────────────────────────────────────────────────────

@app.post("/auth/login/google", tags=["Auth"])
async def google_login(payload: dict):
    """
    Verifies Google ID Token, upserts user in MongoDB, and returns local JWT.
    """
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing Google token")

    user_info = verify_google_token(token)
    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    # Save/Update user in MongoDB
    user = store.mongo.upsert_user(
        google_id=user_info["google_id"],
        email=user_info["email"],
        name=user_info["name"],
        picture=user_info["picture"]
    )

    # Handle case where MongoDB might be disabled or upsert failed
    uid = user.get("google_id") if user else user_info["google_id"]
    email = user.get("email") if user else user_info.get("email")
    name = user.get("name") if user else user_info.get("name")
    picture = user.get("picture") if user else user_info.get("picture")

    # Create local JWT with all essential profile details
    access_token = create_access_token(data={
        "sub": uid, 
        "email": email,
        "name": name,
        "picture": picture
    })
    
    return {
        "status": "ok",
        "token": access_token,
        "user": user or user_info # Fallback to user_info if MongoDB disabled
    }

@app.post("/auth/login/bypass", tags=["Auth"])
async def bypass_login():
    """
    Emergency Dev/Bypass login when Google Identity Services is broken via CORS.
    """
    mock_id = "command-center-bypass"
    mock_email = "commander@vertex.sys"
    mock_name = "Commander (Bypass)"

    # Save/Update user in MongoDB
    user = store.mongo.upsert_user(
        google_id=mock_id,
        email=mock_email,
        name=mock_name,
        picture="https://api.dicebear.com/7.x/bottts/svg?seed=commander"
    )

    uid = user.get("google_id") if user else mock_id
    email = user.get("email") if user else mock_email

    # Create local JWT
    access_token = create_access_token(data={
        "sub": uid, 
        "email": email,
        "name": mock_name,
        "picture": "https://api.dicebear.com/7.x/bottts/svg?seed=commander"
    })
    
    return {
        "status": "ok",
        "token": access_token,
        "user": user or {
            "google_id": mock_id,
            "email": mock_email,
            "name": mock_name,
            "picture": "https://api.dicebear.com/7.x/bottts/svg?seed=commander"
        }
    }


# --- In-memory fallback for local credentials ---
_LOCAL_USERS = {}

@app.post("/auth/register", tags=["Auth"])
async def register_user(payload: dict):
    email = payload.get("email")
    password = payload.get("password")
    name = payload.get("name", "Strategic Analyst")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing email or password")
    
    if email in _LOCAL_USERS:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    _LOCAL_USERS[email] = {
        "password": password, # In production this MUST be hashed
        "name": name,
        "email": email,
        "google_id": f"local_{email}"
    }

    # Save to MongoDB if available
    store.mongo.upsert_user(
        google_id=f"local_{email}",
        email=email,
        name=name,
        picture="https://api.dicebear.com/7.x/bottts/svg?seed=" + email
    )
    
    return {"status": "ok", "message": "User registered successfully"}

@app.post("/auth/login/credentials", tags=["Auth"])
async def credentials_login(payload: dict):
    email = payload.get("email")
    password = payload.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing email or password")
        
    user = _LOCAL_USERS.get(email)
    
    if not user or user["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    uid = user["google_id"]
    name = user["name"]

    access_token = create_access_token(data={
        "sub": uid, 
        "email": email,
        "name": name,
        "picture": "https://api.dicebear.com/7.x/bottts/svg?seed=" + email
    })
    
    return {
        "status": "ok",
        "token": access_token,
        "user": user
    }

@app.get("/auth/me", tags=["Auth"])
async def get_me(auth: HTTPAuthorizationCredentials = Depends(security)):
    """
    Returns current user info from MongoDB using local JWT.
    """
    payload = get_current_user_payload(auth.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid session")

    google_id = payload.get("sub")
    user = store.mongo.get_user_by_google_id(google_id)
    
    # If not in MongoDB (because it's disabled or bypassed), recreate from payload
    if not user:
        return {
            "google_id": google_id,
            "email": payload.get("email", "unknown@cps.sys"),
            "name": payload.get("name", "Strategic Analyst"),
            "picture": payload.get("picture", "https://api.dicebear.com/7.x/bottts/svg?seed=analyst")
        }

    return user

