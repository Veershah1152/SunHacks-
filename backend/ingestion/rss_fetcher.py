"""
RSS Fetcher — pulls articles from working public RSS feeds.
No API key required.

Feed strategy:
- Use broad/reliable RSS sources that actually work in 2025+
- Keyword filter is RELAXED: match any word from the query, not the full phrase
- Dead feeds (reuters.com, old UN) replaced with working alternatives
"""

import feedparser
from datetime import datetime
from langchain_core.documents import Document


# ── Working RSS feeds (verified 2025) ──────────────────────────────────────
# NOTE: AP News & Yahoo News do not provide official public RSS feeds.
# Google News RSS is an official Atom feed that is reliably available.
RSS_FEEDS: dict[str, str] = {
    "bbc_world":      "http://feeds.bbci.co.uk/news/world/rss.xml",
    "bbc_tech":       "http://feeds.bbci.co.uk/news/technology/rss.xml",
    "al_jazeera":     "https://www.aljazeera.com/xml/rss/all.xml",
    "guardian_world": "https://www.theguardian.com/world/rss",
    "guardian_us":    "https://www.theguardian.com/us-news/rss",
    "npr_news":       "https://feeds.npr.org/1001/rss.xml",
    # Google News official Atom feeds — reliably available, no API key needed
    "google_world":   "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB",
    "google_intl":    "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en",
    "reuters_world":  "https://feeds.reuters.com/reuters/worldNews",
    "abc_intl":       "https://abcnews.go.com/abcnews/internationalheadlines",
}


def fetch_rss(query: str = "", max_per_feed: int = 20) -> list[Document]:
    """
    Fetch articles from all configured RSS feeds.

    Keyword matching is relaxed — any individual word from the query
    must appear in the article, not the full phrase.

    Returns:
        List of LangChain Documents with source metadata.
    """
    docs: list[Document] = []

    # Build a list of individual query words for matching (strip short words)
    query_words = [w.lower() for w in query.split() if len(w) > 2] if query else []

    for source_name, feed_url in RSS_FEEDS.items():
        try:
            feed = feedparser.parse(feed_url, request_headers={
                'User-Agent': 'Mozilla/5.0 (compatible; IntelligenceBot/1.0)'
            })

            # Skip completely broken feeds (no entries at all)
            if feed.bozo and not feed.entries:
                print(f"[RSS:{source_name}] Skipping broken feed ({feed_url}): {feed.bozo_exception}")
                continue
            elif feed.bozo:
                # bozo but has some entries — log a warning and continue
                print(f"[RSS:{source_name}] Partial parse warning ({feed_url}): {feed.bozo_exception}")

            count = 0
            for entry in feed.entries[:max_per_feed]:
                title   = entry.get("title", "").strip()
                summary = entry.get("summary", entry.get("description", "")).strip()
                link    = entry.get("link", "")
                pub     = entry.get("published", datetime.utcnow().isoformat())

                full_text = f"{title}. {summary}".strip()
                if len(full_text) < 30:
                    continue

                # Relaxed filter: match if ANY query word appears in the text
                if query_words:
                    text_lower = full_text.lower()
                    if not any(w in text_lower for w in query_words):
                        continue

                docs.append(Document(
                    page_content=full_text,
                    metadata={
                        "source": source_name,
                        "url":    link,
                        "title":  title,
                        "published_at": pub,
                    },
                ))
                count += 1

            print(f"[RSS:{source_name}] Collected {count} articles")

        except Exception as e:
            print(f"[RSS:{source_name}] Error: {e}")

    print(f"[RSS] Total RSS docs: {len(docs)}")
    return docs
