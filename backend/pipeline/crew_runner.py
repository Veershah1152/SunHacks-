"""
FastPipeline — Single-shot LLM analysis.
Optimized for local Ollama (llama3.2) to reliably produce structured JSON.
"""

import json
import re
import os
import requests
from langchain_core.documents import Document
from pipeline.cache_manager import analysis_cache

_MAX_CONTEXT_CHARS = 3000
_OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
_LLM_MODEL = os.getenv("LLM_MODEL", "llama3.2")


import sys

def _call_ollama(prompt: str, timeout: int = 180) -> str:
    """Direct Ollama API call — bypasses CrewAI overhead. Streams to terminal."""
    try:
        response = requests.post(
            f"{_OLLAMA_BASE_URL}/api/generate",
            json={
                "model": _LLM_MODEL,
                "prompt": prompt,
                "stream": True,
                "options": {
                    "temperature": 0.05,   # Very low for deterministic JSON
                    "num_predict": 1500,
                    "top_p": 0.9,
                    "repeat_penalty": 1.1,
                    "stop": ["\n\nNote:", "\n\nExplanation:", "```"]
                }
            },
            stream=True,
            timeout=timeout
        )
        response.raise_for_status()
        
        full_text = []
        print("\n\n=== [ OLLAMA ANALYSIS DATA STREAM ] ===", flush=True)
        for line in response.iter_lines():
            if line:
                data = json.loads(line)
                token = data.get("response", "")
                sys.stdout.write(token)
                sys.stdout.flush()
                full_text.append(token)
                
        print("\n=== [ STREAM TERMINATED ] ===\n", flush=True)
        return "".join(full_text)
        
    except requests.exceptions.Timeout:
        print(f"\n[Pipeline] LLM call timed out after {timeout}s")
        return ""
    except Exception as e:
        print(f"\n[Pipeline] LLM call failed: {e}")
        return ""


def _build_master_prompt(query: str, context: str, lang_name: str = "English") -> str:
    """
    Build a tight, example-driven prompt that local LLMs can follow reliably.
    """
    return f"""You are an intelligence analyst. Read the articles below about "{query}" and produce a JSON analysis.

CRITICAL INSTRUCTION: All text values in your JSON output (summary, reasoning, description, status, casualties, etc.) MUST be written in {lang_name}. Do NOT use English for these values. Keep the JSON keys exactly as shown in English.

ARTICLES:
{context}


Based ONLY on the articles above, fill in this JSON template. Replace every value with your real analysis of "{query}":

{{
  "risk": "MEDIUM",
  "risk_numerical": 55,
  "confidence": 0.72,
  "trajectory": "STABLE",
  "location": "United States",
  "latitude": 37.09,
  "longitude": -95.71,
  "summary": "Write 2-3 sentences summarizing the key findings from the articles about {query}.",
  "reasoning": "Explain in 1-2 sentences why you assigned this risk level.",
  "hotspots": [
    {{"name": "Key Location", "lat": 40.71, "lng": -74.00, "intensity": 6}}
  ],
  "signals": [
    {{"source": "Source Name", "text": "Key event or development from the articles", "intensity": 0.7}}
  ],
  "scenarios": {{
    "best": {{"description": "Most optimistic realistic outcome", "probability": "25%"}},
    "likely": {{"description": "Most probable outcome based on current trends", "probability": "55%"}},
    "worst": {{"description": "Worst realistic outcome", "probability": "20%"}}
  }},
  "civilian_impact": {{
    "casualties": "LOW",
    "displacement": "Minimal displacement expected",
    "shortages": ["Information", "Legal Access"]
  }},
  "infrastructure": {{
    "status": "Institutional systems under pressure",
    "chokepoints": ["Legal system", "Media access"]
  }},
  "sources": [
    {{"name": "Publisher", "title": "Article headline", "type": "OSINT"}}
  ]
}}

CRITICAL RULES:
1. Output ONLY the JSON. No text before or after it.
2. Do NOT copy the example values. Use values that reflect "{query}" from the articles.
3. risk_numerical must be a NUMBER between 0 and 100. Use 70-100 for HIGH risk, 31-69 for MEDIUM, 0-30 for LOW.
4. confidence must be a NUMBER between 0.0 and 1.0.
5. latitude and longitude must be real coordinates for the primary location.
6. All text must describe "{query}" specifically, not generic conflicts."""


def _extract_numbers_from_text(text: str, query: str) -> dict:
    """
    Emergency fallback: scrape any numeric risk/confidence values
    directly from the LLM text if JSON parsing fails completely.
    """
    result = {}

    # Try to find risk_numerical
    risk_num_match = re.search(r'"risk_numerical"\s*:\s*(\d+)', text)
    if risk_num_match:
        result['risk_numerical'] = int(risk_num_match.group(1))

    # Try to find confidence
    conf_match = re.search(r'"confidence"\s*:\s*([\d.]+)', text)
    if conf_match:
        result['confidence'] = float(conf_match.group(1))

    # Try to find risk level
    risk_match = re.search(r'"risk"\s*:\s*"(HIGH|MEDIUM|LOW)"', text, re.IGNORECASE)
    if risk_match:
        result['risk'] = risk_match.group(1).upper()

    # Try to find trajectory
    traj_match = re.search(r'"trajectory"\s*:\s*"(ESCALATING|STABLE|DE-ESCALATING)"', text, re.IGNORECASE)
    if traj_match:
        result['trajectory'] = traj_match.group(1).upper()

    # Try to find location
    loc_match = re.search(r'"location"\s*:\s*"([^"]+)"', text)
    if loc_match:
        result['location'] = loc_match.group(1)

    # Try to find summary
    sum_match = re.search(r'"summary"\s*:\s*"([^"]+)"', text)
    if sum_match:
        result['summary'] = sum_match.group(1)

    return result


def run_analysis(
    query: str,
    retrieved_docs: list[Document],
    source_urls: list[str],
    lang: str = "en"
) -> dict:

    """
    Run the fast single-shot conflict analysis pipeline.
    """
    # ── Check Cache (DISABLED for Live Demonstration) ───────────────
    # cached_result = analysis_cache.get(query)
    # if cached_result:
    #     print(f"[Cache] Hit for query: '{query}'")
    #     return cached_result

    # ── Build context from retrieved docs ───────────────────────────────────
    context_parts = []
    for i, doc in enumerate(retrieved_docs[:8], start=1):
        src   = doc.metadata.get("source", doc.metadata.get("url", "unknown"))
        title = doc.metadata.get("title", "")
        header = f"[Article {i} | {src} | {title}]"
        context_parts.append(f"{header}\n{doc.page_content[:400]}")

    context = "\n\n".join(context_parts)[:_MAX_CONTEXT_CHARS]

    if not context.strip():
        print("[Pipeline] No context available — returning fallback")
        return _fallback(source_urls, query)

    # ── Single LLM Call ─────────────────────────────────────────────────────
    lang_map = {
        "en": "English",
        "es": "Spanish (Español)",
        "hi": "Hindi (हिन्दी)",
        "fr": "French",
        "de": "German"
    }
    lang_name = lang_map.get(lang, "English")
    
    prompt = _build_master_prompt(query, context, lang_name=lang_name)

    print(f"[Pipeline] Sending prompt for: '{query}' ({len(context)} chars context)")

    raw_output = _call_ollama(prompt)
    print(f"[Pipeline] Raw output ({len(raw_output)} chars):\n{raw_output[:300]}...")

    # ── Parse & Validate ────────────────────────────────────────────────────
    result = _parse_and_validate(raw_output, source_urls, query)

    # ── Save to Cache (only if it looks real, not all defaults) ─────────────
    is_real = (
        result.get("risk_numerical", 50) != 50 or
        result.get("confidence", 0.5) != 0.5 or
        result.get("location", "unknown") not in ("unknown", "United States")
    )
    if is_real:
        analysis_cache.set(query, result)
    else:
        print(f"[Pipeline] Result looks like defaults — NOT caching to force re-analysis")

    return result


# ─── Output parsing ──────────────────────────────────────────────────────────

def _parse_and_validate(raw: str, source_urls: list[str], query: str = "") -> dict:
    """Extract and validate JSON from the LLM output with multiple fallback strategies."""
    raw = raw.strip()

    data = None

    # Strategy 1: direct parse
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        pass

    # Strategy 2: strip markdown code blocks then parse
    if data is None:
        stripped = re.sub(r'```(?:json)?', '', raw).strip().rstrip('`').strip()
        try:
            data = json.loads(stripped)
        except (json.JSONDecodeError, ValueError):
            pass

    # Strategy 3: extract first { ... } block (handles extra text)
    if data is None:
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            try:
                data = json.loads(match.group())
            except (json.JSONDecodeError, ValueError):
                pass

    # Strategy 4: fix common LLM JSON mistakes (trailing commas, single quotes)
    if data is None:
        fixed = re.sub(r',\s*([}\]])', r'\1', raw)       # Remove trailing commas
        fixed = fixed.replace("'", '"')                    # Single → double quotes
        match = re.search(r'\{[\s\S]*\}', fixed)
        if match:
            try:
                data = json.loads(match.group())
            except (json.JSONDecodeError, ValueError):
                pass

    if data is None:
        print("[Pipeline] All JSON parsing strategies failed — using text extraction")
        # Strategy 5: scrape individual values from text
        scraped = _extract_numbers_from_text(raw, query)
        print(f"[Pipeline] Scraped values: {scraped}")
        return _fallback(source_urls, query, overrides=scraped)

    return _validate_schema(data, source_urls)


def _validate_schema(data: dict, source_urls: list[str]) -> dict:
    """Normalize and fill missing keys with contextual defaults."""

    # ── Risk validation ──────────────────────────────────────────────────────
    # Try to parse risk_numerical first
    try:
        rn = int(float(str(data.get("risk_numerical", -1)).replace('%', '')))
        if 0 <= rn <= 100:
            data["risk_numerical"] = rn
        else:
            data.pop("risk_numerical", None)
    except (TypeError, ValueError):
        data.pop("risk_numerical", None)

    # Normalize risk label
    risk_raw = str(data.get("risk", "")).upper().strip()
    if risk_raw not in ("HIGH", "MEDIUM", "LOW"):
        risk_raw = None

    # Cross-derive risk label ↔ numerical
    if "risk_numerical" in data and not risk_raw:
        n = data["risk_numerical"]
        risk_raw = "HIGH" if n >= 70 else ("LOW" if n <= 30 else "MEDIUM")
    elif risk_raw and "risk_numerical" not in data:
        data["risk_numerical"] = {"HIGH": 75, "MEDIUM": 50, "LOW": 25}[risk_raw]

    data["risk"] = risk_raw or "MEDIUM"
    data.setdefault("risk_numerical", 50)

    # ── Confidence ──────────────────────────────────────────────────────────
    try:
        c = float(str(data.get("confidence", 0.5)).replace('%', ''))
        # If model output it as percentage (e.g. 72 instead of 0.72)
        if c > 1.0:
            c = c / 100.0
        data["confidence"] = max(0.1, min(1.0, c))
    except (TypeError, ValueError):
        data.setdefault("confidence", 0.5)

    # ── Trajectory normalization ─────────────────────────────────────────────
    traj_raw = str(data.get("trajectory", "")).upper().strip()
    # Map common non-standard values to valid ones
    traj_map = {
        "UNSTABLE": "ESCALATING",
        "ESCALATING": "ESCALATING",
        "STABLE": "STABLE",
        "DE-ESCALATING": "DE-ESCALATING",
        "DEESCALATING": "DE-ESCALATING",
        "DECLINING": "DE-ESCALATING",
        "IMPROVING": "DE-ESCALATING",
        "WORSENING": "ESCALATING",
        "INCREASING": "ESCALATING",
    }
    data["trajectory"] = traj_map.get(traj_raw, "STABLE")

    # ── Location & Coordinates ────────────────────────────────────────────────
    # Handle GeoJSON dict: {"type": "Point", "coordinates": [lng, lat]}
    loc = data.get("location", "Global")
    if isinstance(loc, dict):
        coords = loc.get("coordinates", [])
        if len(coords) >= 2:
            # GeoJSON is [lng, lat]
            data["longitude"] = float(coords[0])
            data["latitude"]  = float(coords[1])
        data["location"] = loc.get("name", loc.get("city", loc.get("country", "Global")))
    else:
        data["location"] = str(loc) if loc else "Global"

    # Handle coordinates that may also be returned as dicts or lists
    raw_lat = data.get("latitude", 0.0)
    raw_lng = data.get("longitude", 0.0)

    if isinstance(raw_lat, dict):
        raw_lat = raw_lat.get("value", 0.0)
    if isinstance(raw_lng, dict):
        raw_lng = raw_lng.get("value", 0.0)

    try:
        data["latitude"]  = float(raw_lat)
        data["longitude"] = float(raw_lng)
    except (TypeError, ValueError):
        data["latitude"]  = 0.0
        data["longitude"] = 0.0

    data.setdefault("summary", "")
    data.setdefault("reasoning", "Analysis based on available intelligence.")

    # ── Hotspots ─────────────────────────────────────────────────────────────
    if not isinstance(data.get("hotspots"), list):
        data["hotspots"] = []
    clean_hotspots = []
    for h in data["hotspots"]:
        if isinstance(h, dict) and "lat" in h and "lng" in h:
            try:
                clean_hotspots.append({
                    "name":      str(h.get("name", "unknown")),
                    "lat":       float(h["lat"]),
                    "lng":       float(h["lng"]),
                    "intensity": min(10, max(1, int(h.get("intensity", 5))))
                })
            except (ValueError, TypeError):
                continue
    data["hotspots"] = clean_hotspots

    # ── Signals ──────────────────────────────────────────────────────────────
    if not isinstance(data.get("signals"), list):
        data["signals"] = []

    # ── Defaults for complex nested fields ──────────────────────────────────
    data.setdefault("civilian_impact", {
        "casualties": "LOW",
        "displacement": "Monitoring required",
        "shortages": []
    })
    data.setdefault("infrastructure", {
        "status": "Unknown",
        "chokepoints": []
    })
    data.setdefault("scenarios", {
        "best":   {"description": "Positive resolution", "probability": "25%"},
        "likely": {"description": "Status quo continues", "probability": "55%"},
        "worst":  {"description": "Significant deterioration", "probability": "20%"},
    })
    data.setdefault("sources", [
        {"name": url, "title": "Source Document", "type": "OSINT"}
        for url in source_urls[:5]
    ])

    return data


def _fallback(source_urls: list[str], query: str = "", overrides: dict = None) -> dict:
    """Return a safe fallback structure, with any scraped values merged in."""
    base = {
        "risk":             "MEDIUM",
        "risk_numerical":   50,
        "confidence":       0.4,
        "trajectory":       "STABLE",
        "location":         "Unknown",
        "latitude":         0.0,
        "longitude":        0.0,
        "summary":          f"Analysis of '{query}' could not be completed. Please try again.",
        "reasoning":        "Insufficient data to produce a reliable assessment.",
        "hotspots":         [],
        "signals":          [],
        "scenarios": {
            "best":   {"description": "Situation resolves without escalation", "probability": "30%"},
            "likely": {"description": "Current trajectory continues",          "probability": "50%"},
            "worst":  {"description": "Significant negative development",      "probability": "20%"},
        },
        "civilian_impact": {
            "casualties":   "UNKNOWN",
            "displacement": "Monitoring required",
            "shortages":    []
        },
        "infrastructure": {
            "status":      "Unknown",
            "chokepoints": []
        },
        "sources": [
            {"name": url, "title": "Source Document", "type": "OSINT"}
            for url in source_urls[:5]
        ]
    }
    if overrides:
        base.update({k: v for k, v in overrides.items() if v is not None})
    return base
