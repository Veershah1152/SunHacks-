"""
SQLiteStore — Persistent metadata store using SQLite (Python built-in, zero deps).

Responsibilities:
  1. Deduplication: track every indexed article by URL hash AND content hash
     so the same article from different sources is never embedded twice.
  2. Metadata: store title, source, published_at, indexed_at, chunk count.
  3. Statistics: expose store-level counters for the /health endpoint.
  4. Key-value meta table: store arbitrary config values (e.g. last_updated).

Why SQLite instead of a simple in-memory set?
  - Survives server restarts: dedup persists across sessions
  - Zero external dependencies
  - Fast indexed lookups on url_hash / content_hash
"""

import sqlite3
import hashlib
from datetime import datetime, timezone
from pathlib import Path


# Default DB location: backend/vector_store/metadata.db
_DEFAULT_DB = Path(__file__).parent.parent / "vector_store" / "metadata.db"


class SQLiteStore:
    """Thread-safe SQLite wrapper for article metadata and deduplication."""

    def __init__(self, db_path: Path | str = _DEFAULT_DB):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        # check_same_thread=False is safe here because FastAPI uses a single
        # process and we wrap mutations in explicit commits.
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self.conn.execute("PRAGMA journal_mode=WAL")   # concurrent-read safe
        self.conn.execute("PRAGMA synchronous=NORMAL")  # faster writes
        self._init_schema()
        print(f"[SQLite] Database at {self.db_path}")

    # ─── Schema ────────────────────────────────────────────────────────────

    def _init_schema(self) -> None:
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS articles (
                url_hash     TEXT PRIMARY KEY,
                content_hash TEXT NOT NULL,
                url          TEXT,
                title        TEXT,
                source       TEXT,
                published_at TEXT,
                indexed_at   TEXT NOT NULL,
                chunk_count  INTEGER DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_content_hash
                ON articles(content_hash);

            CREATE INDEX IF NOT EXISTS idx_source
                ON articles(source);

            CREATE INDEX IF NOT EXISTS idx_indexed_at
                ON articles(indexed_at);

            CREATE TABLE IF NOT EXISTS store_meta (
                key   TEXT PRIMARY KEY,
                value TEXT
            );

            CREATE TABLE IF NOT EXISTS analysis_history (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                query          TEXT NOT NULL,
                risk           TEXT NOT NULL,
                risk_numerical INTEGER DEFAULT 50,
                confidence     REAL NOT NULL,
                location       TEXT,
                latitude       REAL,
                longitude      REAL,
                timestamp      TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_history_query ON analysis_history(query);
            CREATE INDEX IF NOT EXISTS idx_history_ts    ON analysis_history(timestamp);

        """)
        self.conn.commit()

    # ─── Hashing helpers ───────────────────────────────────────────────────

    @staticmethod
    def _url_hash(url: str) -> str:
        """MD5 of URL string — used as primary key."""
        return hashlib.md5(url.encode("utf-8", errors="replace")).hexdigest()

    @staticmethod
    def _content_hash(content: str) -> str:
        """MD5 of first 512 chars — catches reformatted duplicates."""
        return hashlib.md5(content[:512].encode("utf-8", errors="replace")).hexdigest()

    # ─── Deduplication ─────────────────────────────────────────────────────

    def is_duplicate(self, url: str, content: str) -> bool:
        """
        Return True if this article is already indexed.
        Checks both URL hash (exact URL match) and content hash
        (same article, different URL / source).
        """
        url_h = self._url_hash(url)
        content_h = self._content_hash(content)

        row = self.conn.execute(
            """
            SELECT 1 FROM articles
            WHERE url_hash = ? OR content_hash = ?
            LIMIT 1
            """,
            (url_h, content_h),
        ).fetchone()

        return row is not None

    # ─── Write operations ──────────────────────────────────────────────────

    def add_article(
        self,
        url: str,
        title: str,
        source: str,
        published_at: str,
        content: str,
        chunk_count: int,
    ) -> None:
        """
        Record a newly indexed article. Silently ignores if already present
        (INSERT OR IGNORE) so concurrent requests are safe.
        """
        now = datetime.now(timezone.utc).isoformat()
        self.conn.execute(
            """
            INSERT OR IGNORE INTO articles
                (url_hash, content_hash, url, title, source, published_at, indexed_at, chunk_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                self._url_hash(url),
                self._content_hash(content),
                url,
                title,
                source,
                published_at,
                now,
                chunk_count,
            ),
        )
        self.conn.commit()

    def set_meta(self, key: str, value: str) -> None:
        """Upsert a key-value pair in store_meta."""
        self.conn.execute(
            "INSERT OR REPLACE INTO store_meta(key, value) VALUES (?, ?)",
            (key, value),
        )
        self.conn.commit()

    def add_analysis_record(
        self,
        query: str,
        risk: str,
        risk_numerical: int,
        confidence: float,
        location: str,
        lat: float | None = None,
        lng: float | None = None,
    ) -> None:
        """Save a conflict analysis result to the history table."""
        now = datetime.now(timezone.utc).isoformat()
        # Add column if it doesn't exist yet (migration for existing DBs)
        try:
            self.conn.execute("ALTER TABLE analysis_history ADD COLUMN risk_numerical INTEGER DEFAULT 50")
            self.conn.commit()
        except Exception:
            pass  # Column already exists
        self.conn.execute(
            """
            INSERT INTO analysis_history (query, risk, risk_numerical, confidence, location, latitude, longitude, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (query, risk, risk_numerical, confidence, location, lat, lng, now),
        )
        self.conn.commit()


    # ─── Read operations ───────────────────────────────────────────────────

    def get_meta(self, key: str) -> str | None:
        """Retrieve a value from store_meta table."""
        row = self.conn.execute(
            "SELECT value FROM store_meta WHERE key = ?", (key,)
        ).fetchone()
        return row[0] if row else None

    def get_stats(self) -> dict:
        """Return aggregate statistics about the indexed corpus."""
        total_articles = self.conn.execute(
            "SELECT COUNT(*) FROM articles"
        ).fetchone()[0]

        total_chunks_row = self.conn.execute(
            "SELECT SUM(chunk_count) FROM articles"
        ).fetchone()[0]
        total_chunks = int(total_chunks_row or 0)

        sources = dict(
            self.conn.execute(
                "SELECT source, COUNT(*) FROM articles GROUP BY source"
            ).fetchall()
        )

        last_updated = self.conn.execute(
            "SELECT MAX(indexed_at) FROM articles"
        ).fetchone()[0]

        return {
            "total_articles": total_articles,
            "total_chunks": total_chunks,
            "sources_breakdown": sources,
            "last_updated": last_updated,
        }

    def get_recent_urls(self, limit: int = 20) -> list[str]:
        """Return the most recently indexed article URLs."""
        rows = self.conn.execute(
            "SELECT url FROM articles WHERE url != '' ORDER BY indexed_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [r[0] for r in rows]

    def get_query_trends(self, query: str, limit: int = 10) -> list[dict]:
        """Return historical risk/confidence for a specific query."""
        rows = self.conn.execute(
            """
            SELECT risk, risk_numerical, confidence, timestamp FROM analysis_history
            WHERE query = ?
            ORDER BY timestamp DESC
            LIMIT ?
            """,
            (query, limit),
        ).fetchall()
        
        # Reverse to get chronological order
        return [{"risk": r[0], "risk_numerical": r[1] or 50, "confidence": r[2], "ts": r[3]} for r in reversed(rows)]


    # ─── Maintenance ───────────────────────────────────────────────────────

    def clear(self) -> None:
        """Wipe all article records and metadata."""
        self.conn.executescript("DELETE FROM articles; DELETE FROM store_meta;")
        self.conn.commit()
        print("[SQLite] All records cleared")

    def close(self) -> None:
        self.conn.close()
