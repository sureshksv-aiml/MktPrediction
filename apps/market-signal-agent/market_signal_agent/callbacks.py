"""Callbacks for the Market Signal Agent system."""

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from google.adk.agents import CallbackContext


def initialize_session_state_callback(
    callback_context: "CallbackContext",
) -> None:
    """Initialize session state with default pending values.

    This callback runs before the root agent processes any requests,
    ensuring all session state keys exist for placeholder resolution.

    Args:
        callback_context: ADK callback context with access to session state.
    """
    state = callback_context.state

    # Default values for all session state keys
    defaults: dict[str, dict[str, Any]] = {
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

    # Only initialize if not already set (preserve existing state)
    for key, value in defaults.items():
        if not state.get(key):
            state[key] = value
