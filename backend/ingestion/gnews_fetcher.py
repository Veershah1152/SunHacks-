"""
GNews Fetcher — pulls articles from the GNews REST API (free tier).
Requires GNEWS_API_KEY in .env; returns empty list if not set.
Free tier allows 100 requests/day. Falls back gracefully.
"""

import os
import requests
from langchain_core.documents import Document


GNEWS_BASE_URL = "https://gnews.io/api/v4/search"


def fetch_gnews(query: str, max_results: int = 10) -> list[Document]:
    """
    Fetch news articles from GNews for a given query keyword.

    Args:
        query:       Search keyword (e.g. "Gaza", "Ukraine war")
        max_results: Maximum articles to fetch (default 10, max 10 for free tier)

    Returns:
        List of LangChain Documents with source metadata.
    """
    api_key = os.getenv("GNEWS_API_KEY", "").strip()
    if not api_key:
        print("[GNews] No API key set — skipping GNews ingestion.")
        return []

    params = {
        "q": query,
        "token": api_key,
        "lang": "en",
        "max": min(max_results, 10),  # free tier hard cap
        "sortby": "publishedAt",
    }

    try:
        resp = requests.get(GNEWS_BASE_URL, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        docs: list[Document] = []
        for article in data.get("articles", []):
            # Combine title + description + content for richer context
            title = article.get("title", "")
            desc = article.get("description", "")
            body = article.get("content", "")
            full_text = f"{title}. {desc} {body}".strip()

            if len(full_text) < 40:
                continue

            docs.append(
                Document(
                    page_content=full_text,
                    metadata={
                        "source": "gnews",
                        "url": article.get("url", ""),
                        "title": title,
                        "published_at": article.get("publishedAt", ""),
                    },
                )
            )

        print(f"[GNews] Fetched {len(docs)} articles for '{query}'")
        return docs

    except requests.exceptions.Timeout:
        print("[GNews] Request timed out")
        return []
    except requests.exceptions.HTTPError as e:
        print(f"[GNews] HTTP error: {e}")
        return []
    except Exception as e:
        print(f"[GNews] Unexpected error: {e}")
        return []
