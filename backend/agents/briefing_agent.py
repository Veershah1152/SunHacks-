"""
Briefing Agent — compiles all analysis into a commander-grade intelligence brief (JSON).
Final agent in the 8-agent autonomous pipeline.
"""

import os
from crewai import Agent, LLM

def create_briefing_agent() -> Agent:
    """
    Agent: Chief Intelligence Briefing Officer
    Goal: Synthesise all upstream analysis into a validated, information-dense JSON intelligence brief.
    """
    return Agent(
        role="Chief Intelligence Briefing Officer",
        goal=(
            "Synthesise Situation Summary, Threat Level, Key Signals, Trend Analysis, "
            "Predicted Scenarios, Civilian Impact, and Strategic Recommendations into a "
            "single, valid JSON document. Output ONLY the JSON."
        ),
        backstory=(
            "You are a top-tier intelligence official who briefs heads of state. "
            "Your reports are concise (readable in 60 seconds), evidence-based, "
            "and prioritize actionable insights over speculation."
        ),
        llm=LLM(model="ollama/llama3.2", base_url="http://localhost:11434"),
        verbose=True,
        allow_delegation=False,
    )
