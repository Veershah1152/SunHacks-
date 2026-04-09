"""
FAISSStore — Enhanced FAISS vector store wrapper with:
  - Disk persistence: index saved to backend/vector_store/faiss_index/
  - Lazy loading: index loaded from disk on startup (no rebuild needed)
  - Incremental merge: new docs merged into existing index without full rebuild
  - Scored search: returns (Document, similarity_score) pairs when needed

Why not plain FAISS.from_documents() on every /update?
  → That throws away all previously indexed data.
  → Instead: load existing index → merge new vectors → save.
"""

import os
import shutil
from pathlib import Path

from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings
from langchain_core.documents import Document


_FAISS_INDEX_DIR = Path(__file__).parent.parent / "vector_store" / "faiss_index"


class FAISSStore:
    """
    Persistent FAISS vector store that supports incremental document addition.

    Usage:
        store = FAISSStore()
        store.load()            # try to load existing index
        store.add_documents(chunks)  # embed + merge (or create)
        store.save()            # persist to disk
        results = store.similarity_search("conflict in Sudan", k=5)
    """

    def __init__(self) -> None:
        self.index_dir = _FAISS_INDEX_DIR
        self.index_dir.mkdir(parents=True, exist_ok=True)

        ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        embed_model = os.getenv("EMBEDDING_MODEL", "llama3.2")

        self.embeddings = OllamaEmbeddings(
            model=embed_model,
            base_url=ollama_url,
        )
        self._index: FAISS | None = None

    # ─── Persistence ───────────────────────────────────────────────────────

    def load(self) -> bool:
        """
        Attempt to load an existing FAISS index from disk.
        Returns True on success, False if no index exists.
        """
        index_file = self.index_dir / "index.faiss"
        if not index_file.exists():
            print("[FAISS] No existing index found — starting fresh.")
            return False

        try:
            self._index = FAISS.load_local(
                str(self.index_dir),
                self.embeddings,
                allow_dangerous_deserialization=True,
            )
            doc_count = self._index.index.ntotal
            print(f"[FAISS] Loaded existing index ({doc_count} vectors) from {self.index_dir}")
            return True
        except Exception as e:
            print(f"[FAISS] Failed to load index: {e} — will rebuild on next /update")
            self._index = None
            return False

    def save(self) -> None:
        """Persist the current FAISS index to disk."""
        if self._index is None:
            return
        self._index.save_local(str(self.index_dir))
        count = self._index.index.ntotal
        print(f"[FAISS] Saved index ({count} vectors) to {self.index_dir}")

    # ─── Write operations ──────────────────────────────────────────────────

    def add_documents(self, documents: list[Document]) -> None:
        """
        Embed documents and add them to the FAISS index.

        Strategy:
          - If no index exists: create a new one from scratch.
          - If index exists:   create a temporary store from the new docs,
                               then merge it into the existing index.
          This avoids re-embedding already-indexed documents.

        Args:
            documents: New (deduplicated) LangChain Documents to index.
        """
        if not documents:
            print("[FAISS] No new documents to embed.")
            return

        print(f"[FAISS] Embedding {len(documents)} new chunks...")

        if self._index is None:
            # Cold start — build the index from scratch
            self._index = FAISS.from_documents(documents, self.embeddings)
        else:
            # Incremental update — embed only new docs and merge
            new_store = FAISS.from_documents(documents, self.embeddings)
            self._index.merge_from(new_store)

        self.save()
        print(f"[FAISS] Index now contains {self._index.index.ntotal} vectors")

    # ─── Read operations ───────────────────────────────────────────────────

    def similarity_search(self, query: str, k: int = 5) -> list[Document]:
        """
        Retrieve the top-k most relevant documents for a query.

        Args:
            query: Natural-language search query.
            k:     Number of results to return.

        Returns:
            List of Documents ordered by relevance (descending).
        """
        if self._index is None:
            print("[FAISS] Index not initialized — returning empty results.")
            return []
        return self._index.similarity_search(query, k=k)

    def similarity_search_with_score(
        self, query: str, k: int = 5
    ) -> list[tuple[Document, float]]:
        """
        Retrieve top-k documents with their L2 distance scores.
        Lower score = higher similarity for FAISS (L2 distance).
        """
        if self._index is None:
            return []
        return self._index.similarity_search_with_score(query, k=k)

    # ─── Status ────────────────────────────────────────────────────────────

    def is_ready(self) -> bool:
        """Returns True if the index is loaded and has at least one vector."""
        return self._index is not None and self._index.index.ntotal > 0

    def vector_count(self) -> int:
        """Total number of vectors in the index."""
        if self._index is None:
            return 0
        return self._index.index.ntotal

    # ─── Maintenance ───────────────────────────────────────────────────────

    def clear(self) -> None:
        """Delete the persisted index and reset in-memory state."""
        self._index = None
        if self.index_dir.exists():
            shutil.rmtree(self.index_dir)
            self.index_dir.mkdir(parents=True, exist_ok=True)
        print("[FAISS] Index cleared")
