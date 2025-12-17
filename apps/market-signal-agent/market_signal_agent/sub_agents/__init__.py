"""Sub-agents for Market Signal Agent."""

from .initializer_agent import initializer_agent
from .technical_agent import technical_agent
from .event_calendar_agent import event_calendar_agent
from .speech_signal_agent import speech_signal_agent
from .synthesis_agent import synthesis_agent
from .alert_agent import alert_agent
from .persistence_agent import persistence_agent

# Workflow agents
from .parallel_data_agent import parallel_data_agent
from .sequential_analysis_agent import sequential_analysis_agent

__all__ = [
    # Individual agents
    "initializer_agent",
    "technical_agent",
    "event_calendar_agent",
    "speech_signal_agent",
    "synthesis_agent",
    "alert_agent",
    "persistence_agent",
    # Workflow agents
    "parallel_data_agent",
    "sequential_analysis_agent",
]
