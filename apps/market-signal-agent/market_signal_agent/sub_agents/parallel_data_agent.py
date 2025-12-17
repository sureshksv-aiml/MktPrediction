"""Parallel agent for concurrent data fetching - Phase 1.

Runs all three data collection agents concurrently to minimize latency.
"""

from google.adk.agents import ParallelAgent

from .technical_agent import technical_agent
from .event_calendar_agent import event_calendar_agent
from .speech_signal_agent import speech_signal_agent

# Parallel Data Fetch Agent
# Runs Phase 1 data agents concurrently:
# - technical_agent -> technical_signals
# - event_calendar_agent -> event_calendar
# - speech_signal_agent -> speech_signals
parallel_data_agent = ParallelAgent(
    name="parallel_data_fetch",
    sub_agents=[
        technical_agent,
        event_calendar_agent,
        speech_signal_agent,
    ],
)
