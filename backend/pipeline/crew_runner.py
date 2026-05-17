"""
FastPipeline — Single-shot LLM analysis via local Ollama.
Embeddings handled separately by HuggingFace (faiss_store.py).
"""

import json
import re
import os
import sys
import requests
from langchain_core.documents import Document
from pipeline.cache_manager import analysis_cache

_MAX_CONTEXT_CHARS = 6000
_OLLAMA_BASE_URL   = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
_LLM_MODEL         = os.getenv("LLM_MODEL", "llama3.2:latest")


# ─── Ollama Caller ────────────────────────────────────────────────────────────

def _call_ollama(prompt: str, timeout: int = 180) -> str:
    """Direct Ollama API call with streaming."""
    try:
        url = f"{_OLLAMA_BASE_URL}/api/generate"
        print(f"[Pipeline] Calling Ollama at {url} (model: {_LLM_MODEL})...")

        response = requests.post(
            url,
            json={
                "model": _LLM_MODEL,
                "prompt": prompt,
                "stream": True,
                "options": {
                    "temperature": 0.1,
                    "num_predict": 1500,
                    "top_p": 0.9,
                    "repeat_penalty": 1.1,
                }
            },
            stream=True,
            timeout=timeout
        )

        if response.status_code != 200:
            print(f"[Pipeline] Ollama HTTP {response.status_code}: {response.text[:200]}")
            return ""

        full_text = []
        has_started = False
        print("\n=== [ OLLAMA STREAM ] ===", flush=True)

        for line in response.iter_lines():
            if line:
                try:
                    data  = json.loads(line)
                    token = data.get("response", "")
                    if token:
                        has_started = True
                        sys.stdout.write(token)
                        sys.stdout.flush()
                        full_text.append(token)
                    if data.get("done"):
                        break
                except Exception:
                    continue

        if not has_started:
            print("\n[Pipeline] WARNING: Ollama stream was empty!")
        else:
            print("\n=== [ STREAM DONE ] ===\n", flush=True)

        return "".join(full_text)

    except requests.exceptions.Timeout:
        print(f"[Pipeline] Ollama timed out after {timeout}s")
        return ""
    except requests.exceptions.ConnectionError:
        print(f"[Pipeline] Cannot connect to Ollama at {_OLLAMA_BASE_URL}. Is it running?")
        return ""
    except Exception as e:
        print(f"[Pipeline] Ollama call failed: {e}")
        import traceback; traceback.print_exc()
        return ""


# ─── Prompt Builder ───────────────────────────────────────────────────────────

def _build_master_prompt(query: str, context: str, lang_name: str = "English") -> str:
    return f"""You are an intelligence analyst. Read the articles below about "{query}" and produce a JSON analysis.

CRITICAL INSTRUCTION: All text values in your JSON output (summary, reasoning, description, status, casualties, etc.) MUST be written in {lang_name}. Keep the JSON keys in English.

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
2. Do NOT copy the example values. Use real analysis of "{query}" from the articles.
3. risk_numerical must be a NUMBER between 0 and 100.
4. confidence must be a NUMBER between 0.0 and 1.0.
5. latitude and longitude must be real coordinates for the primary location.
6. All text must describe "{query}" specifically."""


# ─── Emergency regex fallback ─────────────────────────────────────────────────

def _extract_numbers_from_text(text: str, query: str) -> dict:
    result = {}
    for pat, key, cast in [
        (r'"risk_numerical"\s*:\s*(\d+)',                           "risk_numerical", int),
        (r'"confidence"\s*:\s*([\d.]+)',                            "confidence",     float),
        (r'"risk"\s*:\s*"(HIGH|MEDIUM|LOW)"',                      "risk",           str),
        (r'"trajectory"\s*:\s*"(ESCALATING|STABLE|DE-ESCALATING)"',"trajectory",     str),
        (r'"location"\s*:\s*"([^"]+)"',                            "location",       str),
        (r'"summary"\s*:\s*"([^"]+)"',                             "summary",        str),
        (r'"reasoning"\s*:\s*"([^"]+)"',                           "reasoning",      str),
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                result[key] = cast(m.group(1))
            except Exception:
                pass
    return result


# ─── Main Entry Point ─────────────────────────────────────────────────────────

def run_analysis(
    query: str,
    retrieved_docs: list[Document],
    source_urls: list[str],
    lang: str = "en"
) -> dict:
    """Run the single-shot conflict analysis pipeline using Ollama."""

    # Build context from docs
    context_parts = []
    for i, doc in enumerate(retrieved_docs[:8], start=1):
        src   = doc.metadata.get("source", doc.metadata.get("url", "unknown"))
        title = doc.metadata.get("title", "")
        context_parts.append(f"[Article {i} | {src} | {title}]\n{doc.page_content[:500]}")
    context = "\n\n".join(context_parts)[:_MAX_CONTEXT_CHARS]

    if not context.strip():
        print("[Pipeline] No context available — returning fallback")
        return _fallback(source_urls, query)

    lang_map  = {"en": "English", "es": "Spanish (Español)", "hi": "Hindi (हिन्दी)", "fr": "French", "de": "German"}
    lang_name = lang_map.get(lang, "English")
    prompt    = _build_master_prompt(query, context, lang_name=lang_name)

    print(f"[Pipeline] Sending prompt for: '{query}' ({len(context)} chars context)")
    raw_output = _call_ollama(prompt)

    if not raw_output.strip():
        print("[Pipeline] CRITICAL: Ollama returned nothing.")
        return _fallback(source_urls, query, overrides={
            "summary":   "The AI engine (Ollama) failed to respond.",
            "reasoning": (
                f"Connection to Ollama at {_OLLAMA_BASE_URL} returned an empty stream. "
                "Ensure Ollama is running and OLLAMA_BASE_URL is set to a reachable address "
                "(use a Cloudflare Tunnel if the backend is hosted on Render)."
            )
        })

    print(f"[Pipeline] Raw output ({len(raw_output)} chars):\n{raw_output[:300]}...")
    result = _parse_and_validate(raw_output, source_urls, query)

    is_real = (
        result.get("risk_numerical", 50) != 50 or
        result.get("confidence", 0.5) != 0.5 or
        result.get("location", "unknown") not in ("unknown", "United States")
    )
    if is_real:
        analysis_cache.set(query, result)
    else:
        print("[Pipeline] Result looks like defaults — NOT caching")

    return result


# ─── JSON Parsing ─────────────────────────────────────────────────────────────

def _parse_and_validate(raw: str, source_urls: list[str], query: str = "") -> dict:
    raw  = raw.strip()
    data = None

    # Strategy 1: direct parse
    try:
        data = json.loads(raw)
    except Exception:
        pass

    # Strategy 2: strip markdown fences
    if data is None:
        try:
            stripped = re.sub(r'```(?:json)?', '', raw).strip().rstrip('`').strip()
            data = json.loads(stripped)
        except Exception:
            pass

    # Strategy 3: first { } block
    if data is None:
        m = re.search(r'\{[\s\S]*\}', raw)
        if m:
            try:
                data = json.loads(m.group())
            except Exception:
                pass

    # Strategy 4: fix trailing commas / single quotes
    if data is None:
        fixed = re.sub(r',\s*([}\]])', r'\1', raw).replace("'", '"')
        m = re.search(r'\{[\s\S]*\}', fixed)
        if m:
            try:
                data = json.loads(m.group())
            except Exception:
                pass

    if data is None:
        print("[Pipeline] All JSON strategies failed — extracting values by regex")
        scraped = _extract_numbers_from_text(raw, query)
        return _fallback(source_urls, query, overrides=scraped)

    return _validate_schema(data, source_urls)


def _validate_schema(data: dict, source_urls: list[str]) -> dict:
    # Risk numerical
    try:
        rn = int(float(str(data.get("risk_numerical", -1)).replace('%', '')))
        data["risk_numerical"] = rn if 0 <= rn <= 100 else 50
    except (TypeError, ValueError):
        data["risk_numerical"] = 50

    # Risk label
    risk_raw = str(data.get("risk", "")).upper().strip()
    if risk_raw not in ("HIGH", "MEDIUM", "LOW"):
        n = data["risk_numerical"]
        risk_raw = "HIGH" if n >= 70 else ("LOW" if n <= 30 else "MEDIUM")
    data["risk"] = risk_raw

    # Confidence
    try:
        c = float(str(data.get("confidence", 0.5)).replace('%', ''))
        data["confidence"] = max(0.1, min(1.0, c / 100 if c > 1.0 else c))
    except (TypeError, ValueError):
        data["confidence"] = 0.5

    # Trajectory
    traj_map = {
        "UNSTABLE": "ESCALATING", "ESCALATING": "ESCALATING",
        "STABLE": "STABLE", "DE-ESCALATING": "DE-ESCALATING",
        "DEESCALATING": "DE-ESCALATING", "DECLINING": "DE-ESCALATING",
        "IMPROVING": "DE-ESCALATING", "WORSENING": "ESCALATING", "INCREASING": "ESCALATING",
    }
    data["trajectory"] = traj_map.get(str(data.get("trajectory", "")).upper().strip(), "STABLE")

    # Location & coordinates
    loc = data.get("location", "Global")
    if isinstance(loc, dict):
        coords = loc.get("coordinates", [])
        if len(coords) >= 2:
            data["longitude"] = float(coords[0])
            data["latitude"]  = float(coords[1])
        data["location"] = loc.get("name", loc.get("city", loc.get("country", "Global")))
    else:
        data["location"] = str(loc) if loc else "Global"

    try:
        data["latitude"]  = float(data.get("latitude",  0.0) if not isinstance(data.get("latitude"),  dict) else 0.0)
        data["longitude"] = float(data.get("longitude", 0.0) if not isinstance(data.get("longitude"), dict) else 0.0)
    except (TypeError, ValueError):
        data["latitude"] = data["longitude"] = 0.0

    data.setdefault("summary",   "")
    data.setdefault("reasoning", "Analysis based on available intelligence.")

    # Hotspots
    clean = []
    for h in (data.get("hotspots") or []):
        if isinstance(h, dict) and "lat" in h and "lng" in h:
            try:
                clean.append({
                    "name":      str(h.get("name", "unknown")),
                    "lat":       float(h["lat"]),
                    "lng":       float(h["lng"]),
                    "intensity": min(10, max(1, int(h.get("intensity", 5))))
                })
            except (ValueError, TypeError):
                pass
    data["hotspots"] = clean

    if not isinstance(data.get("signals"), list):
        data["signals"] = []

    data.setdefault("civilian_impact", {"casualties": "LOW", "displacement": "Monitoring required", "shortages": []})
    data.setdefault("infrastructure",  {"status": "Unknown", "chokepoints": []})
    data.setdefault("scenarios", {
        "best":   {"description": "Positive resolution",      "probability": "25%"},
        "likely": {"description": "Status quo continues",     "probability": "55%"},
        "worst":  {"description": "Significant deterioration","probability": "20%"},
    })
    data.setdefault("sources", [{"name": url, "title": "Source Document", "type": "OSINT"} for url in source_urls[:5]])
    return data


def _fallback(source_urls: list[str], query: str = "", overrides: dict = None) -> dict:
    base = {
        "risk": "MEDIUM", "risk_numerical": 50, "confidence": 0.4, "trajectory": "STABLE",
        "location": "Unknown", "latitude": 0.0, "longitude": 0.0,
        "summary":   f"Analysis of '{query}' could not be completed. Please try again.",
        "reasoning": "Insufficient data to produce a reliable assessment.",
        "hotspots": [], "signals": [],
        "scenarios": {
            "best":   {"description": "Situation resolves without escalation", "probability": "30%"},
            "likely": {"description": "Current trajectory continues",          "probability": "50%"},
            "worst":  {"description": "Significant negative development",      "probability": "20%"},
        },
        "civilian_impact": {"casualties": "UNKNOWN", "displacement": "Monitoring required", "shortages": []},
        "infrastructure":  {"status": "Unknown", "chokepoints": []},
        "sources": [{"name": url, "title": "Source Document", "type": "OSINT"} for url in source_urls[:5]]
    }
    if overrides:
        base.update({k: v for k, v in overrides.items() if v is not None})
    return base
