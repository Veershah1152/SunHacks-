"""
Text Cleaner — removes HTML, normalises whitespace, deduplicates documents
before they enter the chunking & embedding pipeline.
"""

import re
from bs4 import BeautifulSoup
from langchain_core.documents import Document


def clean_text(raw: str) -> str:
    """
    Strip HTML tags, normalise whitespace, and remove non-printable characters.

    Args:
        raw: Raw article text (may contain HTML)

    Returns:
        Clean plain-text string.
    """
    # Remove HTML
    text = BeautifulSoup(raw, "html.parser").get_text(separator=" ")

    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()

    # Remove excessively repeated punctuation / noise
    text = re.sub(r"[^\w\s.,!?:;\-'\"()%&]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text


def clean_documents(docs: list[Document]) -> list[Document]:
    """
    Clean a list of raw Documents:
      - Strip HTML in page_content
      - Drop very short / empty documents
      - Deduplicate by content fingerprint (first 200 chars)

    Args:
        docs: Raw ingested documents

    Returns:
        Cleaned, deduplicated list of Documents.
    """
    cleaned: list[Document] = []
    seen_fingerprints: set[int] = set()

    for doc in docs:
        text = clean_text(doc.page_content)

        # Drop documents that are too short to be useful
        if len(text) < 50:
            continue

        # Deduplicate by content fingerprint
        fingerprint = hash(text[:200].lower())
        if fingerprint in seen_fingerprints:
            continue
        seen_fingerprints.add(fingerprint)

        cleaned.append(Document(page_content=text, metadata=doc.metadata))

    removed = len(docs) - len(cleaned)
    print(f"[Cleaner] {len(docs)} → {len(cleaned)} docs (removed {removed} duplicates/junk)")
    return cleaned
