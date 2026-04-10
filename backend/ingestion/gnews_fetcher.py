"""
GNews Fetcher — pulls articles from the GNews REST API (free tier).
Requires GNEWS_API_KEY in .env; returns empty list if not set.
Free tier allows 100 requests/day. Falls back gracefully.
"""

import os
import requests
from langchain_core.documents import Document


GNEWS_BASE_URL = "https://gnews.io/api/v4/search"


def fetch_gnews(query: str, max_results: int = 10, lang: str = "en") -> list[Document]:
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
        "lang": lang,

        "max": min(max_results, 10),  # free tier hard cap
        "sortby": "publishedAt",
    }

    # Retry config: up to 2 retries with exponential backoff
    MAX_RETRIES = 2
    CONNECT_TIMEOUT = 10   # seconds to establish connection
    READ_TIMEOUT    = 30   # seconds to wait for response body

    import time
    session = requests.Session()
    session.headers.update({"User-Agent": "IntelligenceBot/1.0"})

    for attempt in range(1, MAX_RETRIES + 2):  # attempts: 1, 2, 3
        try:
            print(f"[GNews] Fetching '{query}' (attempt {attempt}/{MAX_RETRIES + 1})...")
            resp = session.get(
                GNEWS_BASE_URL,
                params=params,
                timeout=(CONNECT_TIMEOUT, READ_TIMEOUT),
            )
            resp.raise_for_status()
            data = resp.json()

            docs: list[Document] = []
            for article in data.get("articles", []):
                title     = article.get("title", "")
                desc      = article.get("description", "")
                body      = article.get("content", "")
                full_text = f"{title}. {desc} {body}".strip()

                if len(full_text) < 40:
                    continue

                docs.append(
                    Document(
                        page_content=full_text,
                        metadata={
                            "source":       "gnews",
                            "url":          article.get("url", ""),
                            "title":        title,
                            "published_at": article.get("publishedAt", ""),
                        },
                    )
                )

            print(f"[GNews] Fetched {len(docs)} articles for '{query}'")
            return docs

        except requests.exceptions.Timeout:
            wait = 2 ** (attempt - 1)  # 1s, 2s
            if attempt <= MAX_RETRIES:
                print(f"[GNews] Timeout on attempt {attempt} — retrying in {wait}s...")
                time.sleep(wait)
            else:
                print(f"[GNews] Timed out after {MAX_RETRIES + 1} attempts — skipping (RSS will cover).")
                return []

        except requests.exceptions.ConnectionError as e:
            print(f"[GNews] Connection error: {e} — skipping.")
            return []

        except requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response is not None else "?"
            if status == 429:
                print("[GNews] Rate limited (429) — daily quota likely exhausted. Skipping.")
            elif status == 403:
                print("[GNews] Forbidden (403) — check your GNEWS_API_KEY in .env.")
            else:
                print(f"[GNews] HTTP {status} error: {e}")
            return []

        except Exception as e:
            print(f"[GNews] Unexpected error: {e}")
            return []

    return []
