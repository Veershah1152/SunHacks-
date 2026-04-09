"""
Civilian Impact Agent — models casualties, displacement risk, and resource shortages.
"""

import os
from crewai import Agent, LLM

def create_civilian_impact_agent() -> Agent:
    llm = LLM(model="ollama/llama3.2", base_url="http://localhost:11434")

    return Agent(
        role='Humanitarian Impact Analyst',
        goal='Estimate casualty risk, displacement volume, and resource shortages (food, water, medicine).',
        backstory=(
            "You are a specialist in human security. You project humanitarian needs by analyzing "
            "population density and conflict intensity. Your mission is to provide an early warning "
            "for civilian suffering before it occurs."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False
    )
