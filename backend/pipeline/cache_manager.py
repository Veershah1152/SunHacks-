import json
import os
import hashlib
from datetime import datetime, timedelta

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "cache")
CACHE_EXPIRY_HOURS = 24  # Results cached for 24 hours

class AnalysisCache:
    def __init__(self):
        if not os.path.exists(CACHE_DIR):
            os.makedirs(CACHE_DIR)

    def _get_hash(self, query: str) -> str:
        return hashlib.md5(query.lower().strip().encode()).hexdigest()

    def get(self, query: str):
        cache_file = os.path.join(CACHE_DIR, f"{self._get_hash(query)}.json")
        if not os.path.exists(cache_file):
            return None
        
        try:
            with open(cache_file, "r") as f:
                data = json.load(f)
            
            # Check expiry
            cached_at = datetime.fromisoformat(data.get("cached_at"))
            if datetime.utcnow() - cached_at > timedelta(hours=CACHE_EXPIRY_HOURS):
                return None
            
            return data.get("result")
        except Exception:
            return None

    def set(self, query: str, result: dict):
        cache_file = os.path.join(CACHE_DIR, f"{self._get_hash(query)}.json")
        data = {
            "query": query,
            "cached_at": datetime.utcnow().isoformat(),
            "result": result
        }
        try:
            with open(cache_file, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"[Cache] Failed to save cache: {e}")

analysis_cache = AnalysisCache()
