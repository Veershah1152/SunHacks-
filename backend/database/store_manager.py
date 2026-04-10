"""
StoreManager — Unified interface orchestrating FAISSStore + SQLiteStore + MongoStore.

This is THE single database abstraction used by main.py and the pipeline.

Key improvements over a raw FAISS wrapper:
──────────────────────────────────────────
1. Dual-layer deduplication
   - SQLite checks URL hash + content hash BEFORE calling the (slow) embedder.
   - Only genuinely new documents touch Ollama / FAISS.

2. Incremental updates
   - FAISS index is MERGED with new vectors, not rebuilt from scratch.
   - /update is fast even as the corpus grows.

3. Triple persistence (SQLite + FAISS + MongoDB Atlas)
   - FAISS index is saved to disk after every update.
   - SQLite metadata survives server restarts.
   - MongoDB Atlas provides cloud backup and cross-device sync.
   - All Atlas writes are ASYNC (fire-and-forget) — never blocks the pipeline.

4. Rich statistics
   - Combined stats from both SQLite and FAISS for monitoring and the /health endpoint.

5. Clean separation of concerns
   - SQLite handles: dedup, metadata, stats, URL tracking (local).
   - FAISS handles: embedding storage, similarity search.
   - MongoStore handles: cloud backup, text-search fallback for GNews misses.
   - StoreManager handles: coordination, error handling, logging.
"""

from datetime import datetime, timezone
from langchain_core.documents import Document

from .sqlite_store import SQLiteStore
from .faiss_store import FAISSStore
from .mongo_store import MongoStore


class StoreManager:
    """
    Unified database interface for the Conflict Intelligence System.

    Typical lifecycle:
        manager = StoreManager()
        manager.initialize()          # Load existing stores on startup

        # On /update:
        result = manager.add_documents(chunks)

        # On /analyze:
        docs = manager.search("Sudan conflict", k=5)
        urls = manager.get_recent_urls()
    """

    def __init__(self) -> None:
        self.sqlite = SQLiteStore()
        self.faiss  = FAISSStore()
        self.mongo  = MongoStore()   # Atlas: disabled if MONGO_URI not set
        self._initialized = False

    # ─── Lifecycle ─────────────────────────────────────────────────────────

    def initialize(self) -> bool:
        """
        Load existing stores on application startup.
        Called once from FastAPI lifespan context.
        Returns True if an existing index was found and loaded.
        """
        loaded = self.faiss.load()
        self._initialized = True

        # MongoDB Atlas — optional, non-blocking
        atlas_ok = self.mongo.initialize()

        stats = self.sqlite.get_stats()
        vectors = self.faiss.vector_count()
        print(
            f"[StoreManager] Ready | "
            f"Articles: {stats['total_articles']} | "
            f"Chunks: {stats['total_chunks']} | "
            f"Vectors: {vectors} | "
            f"Atlas: {'✓ connected' if atlas_ok else '✗ disabled'}"
        )
        return loaded

    # ─── Write ─────────────────────────────────────────────────────────────

    def add_documents(self, documents: list[Document]) -> dict:
        """
        Ingest a batch of chunked Documents with full deduplication.

        Per-document flow:
          1. Compute URL hash + content hash (fast, in-process).
          2. Check SQLite — if duplicate, skip entirely.
          3. Collect genuinely new docs → embed in FAISS (one batch call).
          4. Record new docs in SQLite for future dedup.

        Args:
            documents: Chunked, cleaned LangChain Documents.

        Returns:
            Ingestion summary dict with counts.
        """
        if not documents:
            return {"added": 0, "skipped": 0, "total": 0}

        new_docs:  list[Document] = []
        skipped_count = 0

        for doc in documents:
            url     = doc.metadata.get("url", "") or ""
            content = doc.page_content

            if url and self.sqlite.is_duplicate(url, content):
                skipped_count += 1
                continue

            new_docs.append(doc)

        print(
            f"[StoreManager] {len(new_docs)} new / "
            f"{skipped_count} duplicates skipped out of {len(documents)} total"
        )

        if new_docs:
            # ── Step 1: Embed and store in FAISS ──────────────────────────
            self.faiss.add_documents(new_docs)

            # ── Step 2: Record metadata in SQLite + Atlas (dual write) ────
            # Group chunks by source URL to track per-article chunk counts.
            by_url: dict[str, list[Document]] = {}
            no_url_docs: list[Document] = []

            for doc in new_docs:
                url = doc.metadata.get("url", "").strip()
                if url:
                    by_url.setdefault(url, []).append(doc)
                else:
                    no_url_docs.append(doc)

            for url, url_docs in by_url.items():
                first = url_docs[0]
                title      = first.metadata.get("title", "")
                source     = first.metadata.get("source", "unknown")
                pub_at     = first.metadata.get("published_at", "")
                content    = first.page_content
                chunk_cnt  = len(url_docs)

                # SQLite (local — synchronous)
                self.sqlite.add_article(
                    url=url, title=title, source=source,
                    published_at=pub_at, content=content,
                    chunk_count=chunk_cnt,
                )
                # Atlas (cloud — async, non-blocking)
                self.mongo.add_article(
                    url=url, title=title, source=source,
                    published_at=pub_at, content=content,
                    chunk_count=chunk_cnt,
                )

            # Record any chunks without URLs (RSS entries without links)
            for doc in no_url_docs:
                synthetic_url = f"no-url-{hash(doc.page_content[:100])}"
                title   = doc.metadata.get("title", "")
                source  = doc.metadata.get("source", "unknown")
                pub_at  = doc.metadata.get("published_at", "")

                self.sqlite.add_article(
                    url=synthetic_url, title=title, source=source,
                    published_at=pub_at, content=doc.page_content, chunk_count=1,
                )
                self.mongo.add_article(
                    url=synthetic_url, title=title, source=source,
                    published_at=pub_at, content=doc.page_content, chunk_count=1,
                )

            # Update last-update timestamp in meta table
            self.sqlite.set_meta(
                "last_update", datetime.now(timezone.utc).isoformat()
            )

        return {
            "added":   len(new_docs),
            "skipped": skipped_count,
            "total":   len(documents),
        }

    # ─── Read ──────────────────────────────────────────────────────────────

    def search(self, query: str, k: int = 5) -> list[Document]:
        """
        Retrieve the top-k most relevant documents for a query.

        Args:
            query: Natural-language search string.
            k:     Number of results.

        Returns:
            List of Documents ordered by relevance.
        """
        return self.faiss.similarity_search(query, k=k)

    def search_with_scores(
        self, query: str, k: int = 5
    ) -> list[tuple[Document, float]]:
        """Retrieve top-k documents with L2 distance scores."""
        return self.faiss.similarity_search_with_score(query, k=k)

    def get_recent_urls(self, limit: int = 20) -> list[str]:
        """Return the most recently indexed article URLs."""
        return self.sqlite.get_recent_urls(limit=limit)

    # ─── Status ────────────────────────────────────────────────────────────

    def is_ready(self) -> bool:
        """True when the FAISS index is loaded and has at least one vector."""
        return self.faiss.is_ready()

    def get_stats(self) -> dict:
        """Combined statistics from both SQLite and FAISS."""
        sql_stats = self.sqlite.get_stats()
        return {
            **sql_stats,
            "vector_count":     self.faiss.vector_count(),
            "faiss_ready":      self.faiss.is_ready(),
        }

    # ─── Maintenance ───────────────────────────────────────────────────────

    def clear(self) -> None:
        """Wipe FAISS index and SQLite metadata (Atlas data is kept as backup)."""
        self.faiss.clear()
        self.sqlite.clear()
        print("[StoreManager] Local stores cleared (Atlas data preserved)")

    def close(self) -> None:
        """Gracefully close all connections."""
        self.sqlite.close()
        self.mongo.close()
