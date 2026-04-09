"""
Impact Analysis Agent — evaluates infrastructure damage and economic disruption.
"""

import os
from crewai import Agent, LLM

def create_impact_analysis_agent() -> Agent:
    llm = LLM(model="ollama/llama3.2", base_url="http://localhost:11434")

    return Agent(
        role='Infrastructure & Economic Intelligence Specialist',
        goal='Analyze and predict damage to critical infrastructure (power, water, transport) and supply chains.',
        backstory=(
            "You are an expert in critical infrastructure. You identify 'choke points' and predict how "
            "conflict will disrupt the flow of goods and services. Your focus is on long-term structural impact."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False
    )
