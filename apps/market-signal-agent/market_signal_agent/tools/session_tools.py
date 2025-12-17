"""Session state initialization tools."""

from typing import Any

from google.adk.tools import FunctionTool, ToolContext


def initialize_session_state(tool_context: ToolContext) -> dict[str, Any]:
    """Initialize all session state keys with default pending values.

    This tool writes directly to session state using ToolContext,
    ensuring downstream agents can detect missing data via status="pending".

    Args:
        tool_context: ADK tool context with access to session state.

    Returns:
        Status of initialization with list of keys initialized.
    """
    # Default values for all session state keys
    defaults = {
        "technical_signals": {
            "status": "pending",
            "current_vix": None,
            "volatility_regime": None,
            "historical_vol_20d": None,
            "anomalies": [],
        },
        "event_calendar": {
            "status": "pending",
            "fed_meetings": [],
            "mna_events": [],
            "analyst_ratings": [],
            "upcoming_high_impact": False,
        },
        "speech_signals": {
            "status": "pending",
            "earnings": [],
            "aggregate_sentiment": None,
        },
        "volatility_forecasts": {
            "status": "pending",
            "forecasts": [],
            "regime": None,
            "current_vix": None,
        },
        "alerts": {
            "status": "pending",
            "alerts": [],
            "has_critical": False,
            "alert_count": 0,
        },
    }

    # Write each default to session state
    initialized_keys = []
    for key, value in defaults.items():
        tool_context.state[key] = value
        initialized_keys.append(key)

    return {
        "initialized": True,
        "keys_initialized": initialized_keys,
        "message": "Session state initialized with default pending values. Ready for data collection agents.",
    }


# Create FunctionTool wrapper
initialize_state_tool = FunctionTool(func=initialize_session_state)
