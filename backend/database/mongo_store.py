"""
MongoStore — Cloud-persistence layer using MongoDB Atlas.

Responsibilities:
  1. Mirror article metadata to Atlas (same schema as SQLiteStore).
  2. Mirror analysis_history records to Atlas for cross-device persistence.
  3. Provide a text-search fallback: search_articles(query) returns
     LangChain Documents from the Atlas cache when GNews is unavailable.

Design principles:
  - ALWAYS non-blocking: every write is fire-and-forget (background thread).
    A network failure to Atlas NEVER crashes the analysis pipeline.
  - Graceful degradation: if MONGO_URI is empty or connection fails,
    MongoStore silently disables itself. SQLite/FAISS continue normally.
  - Idempotent writes: upsert_one on url_hash prevents duplicates.
"""

import os
import threading
from datetime import datetime, timezone
from typing import Optional

from langchain_core.documents import Document


# ── MongoDB import — optional dep ──────────────────────────────────────────

try:
    from pymongo import MongoClient, ASCENDING, TEXT
    from pymongo.errors import (
        ConnectionFailure,
        OperationFailure,
        ServerSelectionTimeoutError,
    )
    _PYMONGO_AVAILABLE = True
except Exception as e:
    import traceback
    print(f"[MongoDB] Import failed: {e}")
    # traceback.print_exc()
    _PYMONGO_AVAILABLE = False


_DB_NAME = "sentinel_intelligence"


class MongoStore:
    """
    Non-blocking MongoDB Atlas wrapper.

    Usage:
        mongo = MongoStore()
        mongo.initialize()               # call once at startup

        # Fire-and-forget writes (non-blocking):
        mongo.add_article(url, title, source, published_at, content, chunks)
        mongo.add_analysis_record(query, risk, risk_numerical, confidence,
                                  location, lat, lng)

        # Blocking read (for fallback):
        docs = mongo.search_articles("Sudan conflict", limit=10)
    """

    def __init__(self) -> None:
        self._client  = None
        self._db      = None
        self._enabled = False   # False until initialize() succeeds

    # ── Lifecycle ──────────────────────────────────────────────────────────

    def initialize(self) -> bool:
        """
        Connect to Atlas and ensure indexes exist.
        Returns True if connection succeeded, False otherwise.
        """
        if not _PYMONGO_AVAILABLE:
            print("[MongoDB] pymongo not installed — Atlas sync disabled.")
            return False
        
        uri = os.getenv("MONGO_URI", "").strip()
        if not uri:
            return False

        try:
            self._client = MongoClient(
                uri,
                serverSelectionTimeoutMS=5_000,   # 5 s connection timeout
                connectTimeoutMS=10_000,
                socketTimeoutMS=30_000,
            )
            # Ping to verify the connection is actually live
            self._client.admin.command("ping")
            self._db = self._client[_DB_NAME]
            self._ensure_indexes()
            self._enabled = True
            print(f"[MongoDB] Connected to Atlas — database: '{_DB_NAME}'")
            return True

        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            print(f"[MongoDB] Connection failed: {e} — continuing without Atlas.")
            return False
        except Exception as e:
            print(f"[MongoDB] Unexpected init error: {e} — Atlas disabled.")
            return False

    def _ensure_indexes(self) -> None:
        """Create indexes if they don't already exist."""
        try:
            articles = self._db["articles"]
            articles.create_index([("url_hash", ASCENDING)], unique=True, background=True)
            articles.create_index([("content_hash", ASCENDING)], background=True)
            articles.create_index([("source", ASCENDING)], background=True)
            articles.create_index([("indexed_at", ASCENDING)], background=True)
            # Full-text search on title + page_content for fallback search
            articles.create_index(
                [("title", TEXT), ("page_content", TEXT)],
                name="text_search_idx",
                background=True,
            )

            history = self._db["analysis_history"]
            history.create_index([("query", ASCENDING)], background=True)
            history.create_index([("timestamp", ASCENDING)], background=True)

            users = self._db["users"]
            users.create_index([("google_id", ASCENDING)], unique=True, background=True)
            users.create_index([("email", ASCENDING)], unique=True, background=True)
        except Exception as e:
            print(f"[MongoDB] Index creation warning: {e}")

    @property
    def is_enabled(self) -> bool:
        return self._enabled

    # ── Fire-and-forget helpers ────────────────────────────────────────────

    def _run_async(self, fn, *args, **kwargs) -> None:
        """Run fn(*args, **kwargs) in a daemon thread (non-blocking)."""
        t = threading.Thread(target=self._safe_call, args=(fn, args, kwargs), daemon=True)
        t.start()

    @staticmethod
    def _safe_call(fn, args, kwargs) -> None:
        """Execute fn; swallow all exceptions so pipeline is never blocked."""
        try:
            fn(*args, **kwargs)
        except Exception as e:
            print(f"[MongoDB] Background write error (non-fatal): {e}")

    # ── Write operations — non-blocking ────────────────────────────────────

    def add_article(
        self,
        url: str,
        title: str,
        source: str,
        published_at: str,
        content: str,
        chunk_count: int,
        url_hash: Optional[str] = None,
        content_hash: Optional[str] = None,
    ) -> None:
        """
        Upsert an article document into Atlas.articles (async / non-blocking).
        """
        if not self._enabled:
            return

        import hashlib
        u_hash = url_hash or hashlib.md5(url.encode("utf-8", errors="replace")).hexdigest()
        c_hash = content_hash or hashlib.md5(content[:512].encode("utf-8", errors="replace")).hexdigest()

        doc = {
            "url_hash":     u_hash,
            "content_hash": c_hash,
            "url":          url,
            "title":        title,
            "source":       source,
            "published_at": published_at,
            "page_content": content[:2000],   # store first 2 KB for text-search
            "chunk_count":  chunk_count,
            "indexed_at":   datetime.now(timezone.utc).isoformat(),
        }

        self._run_async(self._upsert_article, doc, u_hash)

    def _upsert_article(self, doc: dict, url_hash: str) -> None:
        self._db["articles"].update_one(
            {"url_hash": url_hash},
            {"$setOnInsert": doc},
            upsert=True,
        )

    def add_analysis_record(
        self,
        query: str,
        risk: str,
        risk_numerical: int,
        confidence: float,
        location: str,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
    ) -> None:
        """
        Insert an analysis result into Atlas.analysis_history (async / non-blocking).
        """
        if not self._enabled:
            return

        record = {
            "query":          query,
            "risk":           risk,
            "risk_numerical": risk_numerical,
            "confidence":     confidence,
            "location":       location,
            "latitude":       lat,
            "longitude":      lng,
            "timestamp":      datetime.now(timezone.utc).isoformat(),
        }
        self._run_async(self._insert_history, record)

    def _insert_history(self, record: dict) -> None:
        self._db["analysis_history"].insert_one(record)

    # ── Read operations — SYNCHRONOUS (only called as fallback) ────────────

    def search_articles(self, query: str, limit: int = 10) -> list[Document]:
        """
        Text-search Atlas articles that match the query keyword.
        Called ONLY when GNews is unavailable. Returns LangChain Documents.
        """
        if not self._enabled:
            return []

        try:
            cursor = self._db["articles"].find(
                {"$text": {"$search": query}},
                {"score": {"$meta": "textScore"}, "title": 1, "page_content": 1,
                 "url": 1, "source": 1, "published_at": 1},
            ).sort([("score", {"$meta": "textScore"})]).limit(limit)

            docs = []
            for art in cursor:
                content = art.get("page_content", art.get("title", ""))
                if not content:
                    continue
                docs.append(
                    Document(
                        page_content=content,
                        metadata={
                            "source":       art.get("source", "mongodb_cache"),
                            "url":          art.get("url", ""),
                            "title":        art.get("title", ""),
                            "published_at": art.get("published_at", ""),
                        },
                    )
                )

            print(f"[MongoDB] Fallback search for '{query}' → {len(docs)} cached articles")
            return docs

        except Exception as e:
            print(f"[MongoDB] Fallback search error: {e}")
            return []

    def get_query_trends(self, query: str, limit: int = 10) -> list[dict]:
        """
        Return historical analysis records for a query (chronological order).
        """
        if not self._enabled:
            return []

        try:
            cursor = (
                self._db["analysis_history"]
                .find({"query": query}, {"_id": 0, "risk": 1, "risk_numerical": 1,
                                         "confidence": 1, "timestamp": 1})
                .sort("timestamp", ASCENDING)
                .limit(limit)
            )
            return [
                {
                    "risk":           r.get("risk", "MEDIUM"),
                    "risk_numerical": r.get("risk_numerical", 50),
                    "confidence":     r.get("confidence", 0.5),
                    "ts":             r.get("timestamp", ""),
                }
                for r in cursor
            ]
        except Exception as e:
            print(f"[MongoDB] Trends read error: {e}")
            return []
    # ── User management ───────────────────────────────────────────────────

    def upsert_user(self, google_id: str, email: str, name: str, picture: str) -> dict:
        """
        Create or update user record. Synchronously, as it's for authentication.
        """
        if not self._enabled:
            return {}

        user_data = {
            "google_id": google_id,
            "email":     email,
            "name":      name,
            "picture":   picture,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        # Upsert user record
        self._db["users"].update_one(
            {"google_id": google_id},
            {"$set": user_data, "$setOnInsert": {"created_at": user_data["updated_at"]}},
            upsert=True,
        )
        return user_data

    def get_user_by_google_id(self, google_id: str) -> Optional[dict]:
        if not self._enabled:
            return None
        return self._db["users"].find_one({"google_id": google_id}, {"_id": 0})

    # ── Maintenance ────────────────────────────────────────────────────────

    def close(self) -> None:
        """Close the Atlas connection cleanly on shutdown."""
        if self._client:
            try:
                self._client.close()
                print("[MongoDB] Connection closed.")
            except Exception:
                pass
