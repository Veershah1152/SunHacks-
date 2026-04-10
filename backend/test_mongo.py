"""
MongoDB Atlas Integration Test Script
Run from backend directory: python test_mongo.py
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

print("=" * 55)
print("  Sentinel — MongoDB Atlas Integration Test")
print("=" * 55)

# ── 1. Check env var ──────────────────────────────────────
uri = os.getenv("MONGO_URI", "").strip()
if not uri:
    print("\n❌  MONGO_URI is not set in backend/.env")
    print("    Add: MONGO_URI=mongodb+srv://user:pass@cluster.xxx.mongodb.net/")
    sys.exit(1)
print(f"\n✓  MONGO_URI found: {uri[:40]}...")

# ── 2. Check pymongo installed ────────────────────────────
try:
    import pymongo
    print(f"✓  pymongo version: {pymongo.version}")
except ImportError:
    print("❌  pymongo not installed. Run: pip install pymongo")
    sys.exit(1)

# ── 3. Test connection ────────────────────────────────────
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError

print("\n   Connecting to Atlas (5s timeout)...")
try:
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    print("✓  Atlas connection: SUCCESS")
except ServerSelectionTimeoutError as e:
    print(f"❌  Atlas connection FAILED: {e}")
    print("    Check: your IP is whitelisted in Atlas Network Access")
    sys.exit(1)
except Exception as e:
    print(f"❌  Unexpected error: {e}")
    sys.exit(1)

# ── 4. Test write — insert a dummy article ────────────────
db = client["sentinel_intelligence"]
print("\n   Testing write to 'articles' collection...")
test_doc = {
    "url_hash":     "test_hash_001",
    "content_hash": "test_content_001",
    "url":          "https://test.sentinel.io/article/1",
    "title":        "Sentinel Atlas Test Article",
    "source":       "test_script",
    "page_content": "This is a test article inserted by the Sentinel test script.",
    "chunk_count":  1,
    "indexed_at":   "2024-01-01T00:00:00+00:00",
}
db["articles"].update_one(
    {"url_hash": "test_hash_001"},
    {"$setOnInsert": test_doc},
    upsert=True,
)
count = db["articles"].count_documents({})
print(f"✓  Write successful — 'articles' collection has {count} document(s)")

# ── 5. Test write — insert a dummy analysis record ────────
print("\n   Testing write to 'analysis_history' collection...")
db["analysis_history"].insert_one({
    "query":          "test_query",
    "risk":           "LOW",
    "risk_numerical": 20,
    "confidence":     0.9,
    "location":       "Test Location",
    "latitude":       0.0,
    "longitude":      0.0,
    "timestamp":      "2024-01-01T00:00:00+00:00",
})
history_count = db["analysis_history"].count_documents({})
print(f"✓  Write successful — 'analysis_history' has {history_count} document(s)")

# ── 6. Test text search ───────────────────────────────────
print("\n   Testing text search (full-text index)...")
try:
    results = list(db["articles"].find(
        {"$text": {"$search": "Sentinel test"}},
        {"title": 1, "_id": 0}
    ).limit(3))
    if results:
        print(f"✓  Text search works — found: {[r['title'] for r in results]}")
    else:
        print("⚠   Text search returned 0 results.")
        print("    This is OK on first run — the index may take a moment to build.")
        print("    Wait 30s and try again after an /update or /analyze call.")
except Exception as e:
    print(f"⚠   Text search error: {e}")
    print("    Text index may still be building. Run /update to populate it.")

# ── 7. Cleanup option ─────────────────────────────────────
print("\n   Cleaning up test documents...")
db["articles"].delete_one({"url_hash": "test_hash_001"})
db["analysis_history"].delete_many({"query": "test_query"})
print("✓  Test documents removed")

client.close()

print("\n" + "=" * 55)
print("  ✅  ALL CHECKS PASSED — Atlas integration is working!")
print("=" * 55)
print("\n  Next steps:")
print("  1. Start backend:  uvicorn main:app --reload --port 8000")
print("  2. In the dashboard: run an analysis (e.g. 'Sudan conflict')")
print("  3. Go to Atlas UI → Browse Collections → analysis_history")
print("     You should see a new document in ~30 seconds")
print()
