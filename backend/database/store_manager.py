"""
StoreManager — Unified interface orchestrating FAISSStore + SQLiteStore.

This is THE single database abstraction used by main.py and the pipeline.

Key improvements over a raw FAISS wrapper:
──────────────────────────────────────────
1. Dual-layer deduplication
   - SQLite checks URL hash + content hash BEFORE calling the (slow) embedder.
   - Only genuinely new documents touch Ollama / FAISS.

2. Incremental updates
   - FAISS index is MERGED with new vectors, not rebuilt from scratch.
   - /update is fast even as the corpus grows.

3. Persistent across restarts
   - FAISS index is saved to disk after every update.
   - SQLite metadata survives server restarts.
   - /analyze works immediately after restart without re-ingesting data.

4. Rich statistics
   - Combined stats from both stores for monitoring and the /health endpoint.

5. Clean separation of concerns
   - SQLite handles: dedup, metadata, stats, URL tracking.
   - FAISS handles: embedding storage, similarity search.
   - StoreManager handles: coordination, error handling, logging.
"""

from datetime import datetime, timezone
from langchain_core.documents import Document

from .sqlite_store import SQLiteStore
from .faiss_store import FAISSStore


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

        stats = self.sqlite.get_stats()
        vectors = self.faiss.vector_count()
        print(
            f"[StoreManager] Ready | "
            f"Articles: {stats['total_articles']} | "
            f"Chunks: {stats['total_chunks']} | "
            f"Vectors: {vectors}"
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

            # ── Step 2: Record metadata in SQLite ─────────────────────────
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
                self.sqlite.add_article(
                    url=url,
                    title=first.metadata.get("title", ""),
                    source=first.metadata.get("source", "unknown"),
                    published_at=first.metadata.get("published_at", ""),
                    content=first.page_content,
                    chunk_count=len(url_docs),
                )

            # Record any chunks without URLs (RSS entries without links)
            for doc in no_url_docs:
                self.sqlite.add_article(
                    url=f"no-url-{hash(doc.page_content[:100])}",
                    title=doc.metadata.get("title", ""),
                    source=doc.metadata.get("source", "unknown"),
                    published_at=doc.metadata.get("published_at", ""),
                    content=doc.page_content,
                    chunk_count=1,
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
        """Wipe both FAISS index and SQLite metadata."""
        self.faiss.clear()
        self.sqlite.clear()
        print("[StoreManager] All stores cleared")
