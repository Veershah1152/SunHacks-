"""
Detection Agent — identifies conflict escalation signals and assigns risk level.
Second agent in the sequential CrewAI pipeline.
"""

import os
from crewai import Agent, LLM



def create_detection_agent() -> Agent:
    """
    Agent: Conflict Risk Analyst
    Goal: Detect escalation indicators and assign LOW / MEDIUM / HIGH risk.
    """

    return Agent(
        role="Conflict Risk Analyst",
        goal=(
            "Detect early conflict escalation signals from curated intelligence. "
            "Assign a risk level (LOW, MEDIUM, or HIGH) with a confidence score "
            "between 0.0 and 1.0, and list all specific signals found."
        ),
        backstory=(
            "You are a conflict early-warning specialist trained on historical "
            "escalation patterns from academic conflict datasets (ACLED, UCDP). "
            "You identify: military troop movements, protest mobilisation, "
            "political breakdown, sanctions, refugee flows, and media suppression "
            "as primary early-warning indicators. Your assessments are concise, "
            "evidence-based, and always reference the specific signals found."
        ),
        llm=LLM(model="ollama/llama3.2", base_url="http://localhost:11434"),
        verbose=True,
        allow_delegation=False,
    )
