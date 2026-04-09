"""
Text Chunker — splits cleaned documents into overlapping chunks suitable
for embedding. Uses RecursiveCharacterTextSplitter so sentence boundaries
are respected when possible.
"""

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document


def chunk_documents(
    docs: list[Document],
    chunk_size: int = 800,
    chunk_overlap: int = 120,
) -> list[Document]:
    """
    Split documents into fixed-size overlapping chunks.

    Chunk size 800 chars (~150-200 tokens) balances context window
    with embedding quality for llama3.2.

    Args:
        docs:          Cleaned LangChain Documents
        chunk_size:    Target character count per chunk
        chunk_overlap: Characters of overlap between adjacent chunks

    Returns:
        List of chunked Documents (metadata preserved from parent).
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        # Prefer natural break points
        separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
        length_function=len,
    )

    chunks = splitter.split_documents(docs)
    print(f"[Chunker] {len(docs)} docs → {len(chunks)} chunks")
    return chunks
