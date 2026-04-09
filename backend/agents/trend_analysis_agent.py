"""
Trend Analysis Agent — identifies trajectory (Escalating/Stable/De-escalating) using time-series logic.
"""

import os
from crewai import Agent, LLM

def create_trend_analysis_agent() -> Agent:
    llm = LLM(model="ollama/llama3.2", base_url="http://localhost:11434")

    return Agent(
        role='Geopolitical Trend Strategist',
        goal='Determine the trajectory of the situation: Escalating, Stable, or De-escalating.',
        backstory=(
            "You focus on time-series indicators. You compare today's signals with recent historical patterns "
            "to identify shifts in momentum. Your output must lead with a clear 'Trajectory' status."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False
    )
