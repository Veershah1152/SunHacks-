"""
Simulation Agent — generates three future scenarios: best, worst, most likely.
Third agent in the sequential CrewAI pipeline.
"""

import os
from crewai import Agent, LLM



def create_simulation_agent() -> Agent:
    """
    Agent: Geopolitical Scenario Planner
    Goal: Project three plausible future scenarios from current conflict trajectory.
    """


    return Agent(
        role="Geopolitical Scenario Planner",
        goal=(
            "Generate three distinct, plausible future scenarios based on the "
            "detected conflict signals and risk assessment. Each scenario must be "
            "grounded in the intelligence provided, specific about timeline and actors, "
            "and include estimated civilian impact."
        ),
        backstory=(
            "You are a senior geopolitical simulation expert who has produced "
            "scenario analyses for the UN, NATO, and leading think-tanks. "
            "You construct structured BEST / WORST / MOST LIKELY scenarios that "
            "policymakers use for preparedness planning. Your scenarios are "
            "realistic, specific, and never vague — they name actors, timelines, "
            "and consequences."
        ),
        llm=LLM(model="ollama/llama3.2", base_url="http://localhost:11434"),
        verbose=True,
        allow_delegation=False,
    )
