"""Sequential agent for complete volatility analysis workflow.

Runs the full analysis pipeline in order:
1. Parallel data fetch (Phase 1)
2. Synthesis (Phase 2)
3. Alert generation (Phase 2)
4. Persistence to BigQuery (Phase 2)
"""

from google.adk.agents import SequentialAgent

from .parallel_data_agent import parallel_data_agent
from .synthesis_agent import synthesis_agent
from .alert_agent import alert_agent
from .persistence_agent import persistence_agent

# Sequential Analysis Agent
# Complete volatility analysis workflow:
# 1. parallel_data_fetch -> Fetches technical_signals, event_calendar, speech_signals concurrently
# 2. synthesis_agent -> Generates volatility_forecasts from collected data
# 3. alert_agent -> Generates alerts based on technical_signals and volatility_forecasts
# 4. persistence_agent -> Saves forecasts and alerts to BigQuery
sequential_analysis_agent = SequentialAgent(
    name="sequential_analysis",
    sub_agents=[
        parallel_data_agent,
        synthesis_agent,
        alert_agent,
        persistence_agent,
    ],
)
