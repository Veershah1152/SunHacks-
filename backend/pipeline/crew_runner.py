"""
CrewRunner — orchestrates the 4-agent CrewAI pipeline.

Pipeline flow (sequential):
  1. IngestionAgent    → extract facts + fuse multi-source signals
  2. DetectionAgent    → identify hotspots + spatial coordinates
  3. RiskScoringAgent  → assign 0-100 score + reasoning
  4. TrendAnalysisAgent → evaluate trajectory (Escalating/Stable/De-escalating)
  5. SimulationAgent   → generate probabilistic "what-if" scenarios
  6. CivilianImpactAgent → model casualties, displacement & resource risk
  7. ImpactAnalysisAgent → evaluate infrastructure & economic damage
  8. BriefingAgent      → compile all into a Commander-Grade Brief (JSON)

The final output is parsed and validated.  A robust fallback is returned
if JSON parsing fails (LLM hallucinated formatting).
"""

import json
import re
from langchain_core.documents import Document
from crewai import Task, Crew, Process, LLM

from agents.ingestion_agent      import create_ingestion_agent
from agents.detection_agent      import create_detection_agent
from agents.risk_scoring_agent   import create_risk_scoring_agent
from agents.trend_analysis_agent import create_trend_analysis_agent
from agents.simulation_agent     import create_simulation_agent
from agents.civilian_impact_agent import create_civilian_impact_agent
from agents.impact_analysis_agent import create_impact_analysis_agent
from agents.briefing_agent       import create_briefing_agent


# Maximum characters of retrieved context passed to the LLM
# (keeps latency within the 10-second target)
_MAX_CONTEXT_CHARS = 4000


def run_analysis(
    query: str,
    retrieved_docs: list[Document],
    source_urls: list[str],
) -> dict:
    """
    Run the 4-agent sequential conflict analysis pipeline.

    Args:
        query:         The user's search query (region / topic).
        retrieved_docs: Top-k documents from FAISS similarity search.
        source_urls:   Recent indexed URLs for the sources field.

    Returns:
        Validated dict matching the intelligence report schema.
    """

    # ── Build context string from retrieved docs ────────────────────────────
    context_parts = []
    for i, doc in enumerate(retrieved_docs, start=1):
        src   = doc.metadata.get("source", "unknown")
        title = doc.metadata.get("title", "")
        header = f"[Doc {i} | Source: {src} | {title}]"
        context_parts.append(f"{header}\n{doc.page_content}")

    context = "\n\n---\n\n".join(context_parts)[:_MAX_CONTEXT_CHARS]
    urls_json = json.dumps(source_urls[:5])

    # ── Create agents ───────────────────────────────────────────────────────
    ing_agent    = create_ingestion_agent()
    det_agent    = create_detection_agent()
    risk_agent   = create_risk_scoring_agent()
    trend_agent  = create_trend_analysis_agent()
    sim_agent    = create_simulation_agent()
    civ_agent    = create_civilian_impact_agent()
    infra_agent  = create_impact_analysis_agent()
    brief_agent  = create_briefing_agent()

    # ── Define tasks ────────────────────────────────────────────────────────

    task1 = Task(
        description=(
            f'Analyze news articles about "{query}". Focus on Intelligence Fusion: '
            f"cross-reference facts between different sources to confirm events. "
            f"Extract locations, primary actors, and credible time-sequences.\n\n"
            f"ARTICLES:\n{context}"
        ),
        agent=ing_agent,
        expected_output="A normalized intelligence summary with cross-referenced actors and events."
    )

    task2 = Task(
        description=(
            f"From the fused intelligence, identify specific conflict coordinates. "
            f"Locate high-intensity hotspots and assign spatial metadata (lat/lng/intensity). "
            f"Focus on precision for tactical mapping."
        ),
        agent=det_agent,
        expected_output="A list of coordinates, names, and intensity ratings for hotspots."
    )

    task3 = Task(
        description=(
            f"Evaluate the probability of further escalation for '{query}'. "
            f"Assign a numerical risk score (0-100) and provide a 'reasoning' block "
            f"explaining the score based on signal frequency and source weight."
        ),
        agent=risk_agent,
        expected_output="A numerical risk score and a detailed logical reasoning statement."
    )

    task4 = Task(
        description=(
            f"Analyze the trajectory of signals. Is the situation: ESCALATING, STABLE, or DE-ESCALATING? "
            f"Compare current events to the broader query context to identify momentum."
        ),
        agent=trend_agent,
        expected_output="A trajectory status and a brief time-series analysis."
    )

    task5 = Task(
        description=(
            f"Generate three probabilistic scenarios for '{query}': "
            f"BEST CASE (Diplomatic path), WORST CASE (Full escalation), and MOST LIKELY. "
            f"Include a 'probability' percentage for each scenario."
        ),
        agent=sim_agent,
        expected_output="Three detailed scenarios with associated probability percentages."
    )

    task6 = Task(
        description=(
            f"Model the humanitarian cost. Estimate casualty risk level (LOW/MED/HIGH), "
            f"forced displacement risk, and specific resource shortages (Food, Water, Medical)."
        ),
        agent=civ_agent,
        expected_output="A humanitarian impact profile including displacement and resource risk."
    )

    task7 = Task(
        description=(
            f"Predict infrastructure and economic disruption. Identify critical choke points: "
            f"power grids, transport hubs, or supply chains impacted by the conflict."
        ),
        agent=infra_agent,
        expected_output="A damage assessment for critical infrastructure components."
    )

    task8 = Task(
        description=(
            f"Compile ALL previous analysis into ONE 'Commander-Grade' JSON brief.\n"
            f"Required JSON keys:\n"
            f"- 'risk_numerical' (0-100)\n"
            f"- 'confidence' (0.0-1.0)\n"
            f"- 'trajectory' (ESCALATING/STABLE/DE-ESCALATING)\n"
            f"- 'location' & 'hotspots' (as before)\n"
            f"- 'scenarios' (with probability values)\n"
            f"- 'civilian_impact' (casualties, displacement, shortages)\n"
            f"- 'infrastructure' (damage assessment)\n"
            f"- 'reasoning' (overall strategic logic)\n"
            f"- 'sources' (attribution)\n\n"
            f"Output ONLY valid JSON."
        ),
        agent=brief_agent,
        expected_output="A complete, information-dense JSON intelligence brief."
    )






    # ── Run the crew ────────────────────────────────────────────────────────
    crew = Crew(
        agents=[ing_agent, det_agent, risk_agent, trend_agent, sim_agent, civ_agent, infra_agent, brief_agent],
        tasks=[task1, task2, task3, task4, task5, task6, task7, task8],
        verbose=True,
        process=Process.sequential,
    )



    raw_output = str(crew.kickoff())
    print(f"[Crew] Raw output length: {len(raw_output)} chars")

    return _parse_and_validate(raw_output, source_urls)


# ─── Output parsing ─────────────────────────────────────────────────────────

def _parse_and_validate(raw: str, source_urls: list[str]) -> dict:
    """
    Extract and validate JSON from the LLM output string.

    Tries two strategies:
      1. Direct JSON parse of the entire string.
      2. Regex extraction of the outermost {...} block.
    Falls back to a safe default structure if both fail.
    """

    # Strategy 1: direct parse
    try:
        data = json.loads(raw.strip())
        return _validate_schema(data, source_urls)
    except (json.JSONDecodeError, ValueError):
        pass

    # Strategy 2: extract first {...} block
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group())
            return _validate_schema(data, source_urls)
        except (json.JSONDecodeError, ValueError):
            pass

    # Fallback
    print("[Crew] JSON parsing failed — returning fallback structure")
    return _fallback(source_urls)


def _validate_schema(data: dict, source_urls: list[str]) -> dict:
    """Ensure all required keys are present; fill missing ones with defaults."""
    required_keys = {"risk_numerical", "confidence", "trajectory", "location", "scenarios", "civilian_impact"}
    missing = required_keys - set(data.keys())

    for key in missing:
        print(f"[Crew] Missing key in output: '{key}' — using default")

    data.setdefault("risk_numerical", 50)
    data.setdefault("confidence", 0.5)
    data.setdefault("risk", "MEDIUM")

    data.setdefault("trajectory", "STABLE")
    data.setdefault("location", "unknown")
    data.setdefault("latitude", 0.0)
    data.setdefault("longitude", 0.0)
    data.setdefault("hotspots", [])
    data.setdefault("reasoning", "Consensus derived from multiple intelligence streams.")
    
    data.setdefault("civilian_impact", {
        "casualties": "LOW",
        "displacement": "Rising",
        "shortages": ["Food", "Medicine"]
    })
    
    data.setdefault("infrastructure", {
        "status": "Partially Degraded",
        "chokepoints": ["N/A"]
    })

    data.setdefault("scenarios", {
        "best":   {"description": "Diplomatic path", "probability": "30%"},
        "worst":  {"description": "Full escalation", "probability": "20%"},
        "likely": {"description": "Continuing tensions", "probability": "50%"},
    })
    data.setdefault("sources", source_urls[:5])


    # Normalise risk
    if isinstance(data.get("risk"), str):
        data["risk"] = data["risk"].upper()

    # Clamp confidence
    try:
        data["confidence"] = max(0.0, min(1.0, float(data["confidence"])))
    except (TypeError, ValueError):
        data["confidence"] = 0.5

    # Clamp coords
    try:
        data["latitude"]  = float(data.get("latitude", 0.0))
        data["longitude"] = float(data.get("longitude", 0.0))
    except (TypeError, ValueError):
        data["latitude"] = 0.0
        data["longitude"] = 0.0

    # Validate hotspots
    if not isinstance(data.get("hotspots"), list):
        data["hotspots"] = []
    
    clean_hotspots = []
    for h in data["hotspots"]:
        if isinstance(h, dict) and "lat" in h and "lng" in h:
            try:
                clean_hotspots.append({
                    "name": str(h.get("name", "unknown")),
                    "lat": float(h["lat"]),
                    "lng": float(h["lng"]),
                    "intensity": int(h.get("intensity", 5))
                })
            except (ValueError, TypeError):
                continue
    data["hotspots"] = clean_hotspots

    return data




def _fallback(source_urls: list[str]) -> dict:
    return {
        "risk":       "MEDIUM",
        "confidence": 0.5,
        "signals":    ["analysis output could not be parsed"],
        "location":   "unknown",
        "latitude":   0.0,
        "longitude":  0.0,
        "hotspots":   [],
        "scenarios":  {
            "best":   "De-escalation is possible with international mediation.",
            "worst":  "Full-scale conflict with significant civilian displacement.",
            "likely": "Continued low-level tensions with periodic incidents.",
        },
        "sources": source_urls[:5],
    }


