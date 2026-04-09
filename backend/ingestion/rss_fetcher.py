"""
RSS Fetcher — pulls articles from free public RSS feeds (BBC, Reuters, Al Jazeera).
No API key required. Optionally filters by query keyword.
"""

import feedparser
from datetime import datetime
from langchain_core.documents import Document


# Publicly available, no-auth RSS feeds
RSS_FEEDS: dict[str, str] = {
    "bbc_world":   "http://feeds.bbci.co.uk/news/world/rss.xml",
    "bbc_tech":    "http://feeds.bbci.co.uk/news/technology/rss.xml",
    "al_jazeera":  "https://www.aljazeera.com/xml/rss/all.xml",
    "reuters":     "https://feeds.reuters.com/reuters/worldNews",
    "un_news":     "https://news.un.org/feed/subscribe/en/news/all/rss.xml",
}


def fetch_rss(query: str = "", max_per_feed: int = 15) -> list[Document]:
    """
    Fetch articles from all configured RSS feeds.

    Args:
        query:        Optional keyword filter (case-insensitive). Empty = no filter.
        max_per_feed: Maximum entries to read per feed.

    Returns:
        List of LangChain Documents with source metadata.
    """
    docs: list[Document] = []
    query_lower = query.lower() if query else ""

    for source_name, feed_url in RSS_FEEDS.items():
        try:
            feed = feedparser.parse(feed_url)

            if feed.bozo and not feed.entries:
                print(f"[RSS:{source_name}] Failed to parse feed: {feed.bozo_exception}")
                continue

            count = 0
            for entry in feed.entries[:max_per_feed]:
                title   = entry.get("title", "").strip()
                summary = entry.get("summary", "").strip()
                link    = entry.get("link", "")
                pub     = entry.get("published", str(datetime.utcnow().isoformat()))

                full_text = f"{title}. {summary}".strip()

                if len(full_text) < 30:
                    continue

                # Apply query filter when specified
                if query_lower and query_lower not in full_text.lower():
                    continue

                docs.append(
                    Document(
                        page_content=full_text,
                        metadata={
                            "source": source_name,
                            "url": link,
                            "title": title,
                            "published_at": pub,
                        },
                    )
                )
                count += 1

            print(f"[RSS:{source_name}] Collected {count} articles")

        except Exception as e:
            print(f"[RSS:{source_name}] Error: {e}")

    print(f"[RSS] Total RSS docs: {len(docs)}")
    return docs
