"""
Report Agent — compiles all analysis into a strict JSON intelligence report.
Fourth (final) agent in the sequential CrewAI pipeline.
"""

import os
from crewai import Agent, LLM



def create_report_agent() -> Agent:
    """
    Agent: Intelligence Report Officer
    Goal: Synthesise all upstream analysis into a validated JSON document.
    """


    return Agent(
        role="Intelligence Report Officer",
        goal=(
            "Synthesise all previous analysis into a single, valid JSON object "
            "matching the exact prescribed schema. Output ONLY the JSON — no "
            "markdown, no explanation, no code fences."
        ),
        backstory=(
            "You are a senior intelligence officer responsible for producing "
            "machine-readable reports consumed directly by government dashboards. "
            "Your output must be syntactically valid JSON at all times. "
            "You aggregate facts from previous analysts without adding speculation."
        ),
        llm=LLM(model="ollama/llama3.2", base_url="http://localhost:11434"),
        verbose=True,
        allow_delegation=False,
    )
