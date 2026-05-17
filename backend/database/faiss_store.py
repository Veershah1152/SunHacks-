"""
FAISSStore — Persistent FAISS vector store.
Embeddings: HuggingFace sentence-transformers (all-MiniLM-L6-v2)
No Ollama dependency — runs entirely on Render/cloud.
"""

import os
import shutil
from pathlib import Path

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document


_FAISS_INDEX_DIR = Path(__file__).parent.parent / "vector_store" / "faiss_index"
_EMBED_MODEL     = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")


class FAISSStore:
    """
    Persistent FAISS vector store with HuggingFace embeddings.
    No Ollama required — embeddings run locally on the server.

    Usage:
        store = FAISSStore()
        store.load()
        store.add_documents(chunks)
        results = store.similarity_search("conflict in Sudan", k=5)
    """

    def __init__(self) -> None:
        self.index_dir = _FAISS_INDEX_DIR
        self.index_dir.mkdir(parents=True, exist_ok=True)

        print(f"[FAISS] Loading HuggingFace embeddings: {_EMBED_MODEL}")
        self.embeddings = HuggingFaceEmbeddings(
            model_name=_EMBED_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        self._index: FAISS | None = None

    # ─── Persistence ────────────────────────────────────────────────────────

    def load(self) -> bool:
        index_file = self.index_dir / "index.faiss"
        if not index_file.exists():
            print("[FAISS] No existing index — starting fresh.")
            return False
        try:
            self._index = FAISS.load_local(
                str(self.index_dir),
                self.embeddings,
                allow_dangerous_deserialization=True,
            )
            print(f"[FAISS] Loaded index ({self._index.index.ntotal} vectors)")
            return True
        except Exception as e:
            print(f"[FAISS] Failed to load index: {e}")
            self._index = None
            return False

    def save(self) -> None:
        if self._index is None:
            return
        self._index.save_local(str(self.index_dir))
        print(f"[FAISS] Saved ({self._index.index.ntotal} vectors)")

    # ─── Write ──────────────────────────────────────────────────────────────

    def add_documents(self, documents: list[Document]) -> None:
        if not documents:
            print("[FAISS] No new documents to embed.")
            return
        print(f"[FAISS] Embedding {len(documents)} chunks...")
        if self._index is None:
            self._index = FAISS.from_documents(documents, self.embeddings)
        else:
            new_store = FAISS.from_documents(documents, self.embeddings)
            self._index.merge_from(new_store)
        self.save()
        print(f"[FAISS] Index now has {self._index.index.ntotal} vectors")

    # ─── Read ────────────────────────────────────────────────────────────────

    def similarity_search(self, query: str, k: int = 5) -> list[Document]:
        if self._index is None:
            return []
        return self._index.similarity_search(query, k=k)

    def similarity_search_with_score(self, query: str, k: int = 5) -> list[tuple[Document, float]]:
        if self._index is None:
            return []
        return self._index.similarity_search_with_score(query, k=k)

    # ─── Status ─────────────────────────────────────────────────────────────

    def is_ready(self) -> bool:
        return self._index is not None and self._index.index.ntotal > 0

    def vector_count(self) -> int:
        return self._index.index.ntotal if self._index else 0

    # ─── Maintenance ────────────────────────────────────────────────────────

    def clear(self) -> None:
        self._index = None
        if self.index_dir.exists():
            shutil.rmtree(self.index_dir)
            self.index_dir.mkdir(parents=True, exist_ok=True)
        print("[FAISS] Index cleared")
