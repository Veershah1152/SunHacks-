"""
Ingestion Agent — curates and summarises raw retrieved intelligence documents.
First agent in the sequential CrewAI pipeline.
"""

import os
from crewai import Agent, LLM



def create_ingestion_agent() -> Agent:
    """
    Agent: Intelligence Data Curator
    Goal: Extract structured facts (locations, actors, events) from raw news text.
    """

    llm = LLM(model="ollama/llama3.2", base_url="http://localhost:11434")

    return Agent(
        role="Intelligence Fusion Specialist",
        goal=(
            "Aggregate multi-source news, reports, and social signals into a unified, "
            "normalized intelligence layer. Identify confirming signals across disparate sources."
        ),
        backstory=(
            "You are a senior analyst specialized in cross-source correlation. "
            "You identify when different sources (news vs. social) are describing the "
            "same event to build a high-credibility foundation for the pipeline."
        ),

        llm=llm,
        verbose=True,
        allow_delegation=False,
    )

