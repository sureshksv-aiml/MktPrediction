"""Function tools for volatility forecasting."""

import uuid
from datetime import datetime, timezone
from typing import Any

from google.adk.tools import FunctionTool


def generate_forecast_id() -> str:
    """Generate a unique forecast ID."""
    return str(uuid.uuid4())


def calculate_volatility_forecast(
    current_vix: float,
    historical_vol: float,
    regime: str,
    has_upcoming_event: bool = False,
) -> dict[str, Any]:
    """
    Calculate 1-day and 5-day volatility forecasts.

    Args:
        current_vix: Current VIX level
        historical_vol: 20-day historical volatility
        regime: Current volatility regime (low, normal, elevated, extreme)
        has_upcoming_event: Whether there's an upcoming high-impact event

    Returns:
        Dict with volatility forecasts and confidence
    """
    # Base forecast on current VIX with mean reversion tendency
    vix_long_term_avg = 20.0  # Historical VIX average

    # 1-day forecast: mostly current VIX with slight mean reversion
    volatility_1d = current_vix * 0.95 + vix_long_term_avg * 0.05

    # 5-day forecast: more mean reversion
    volatility_5d = current_vix * 0.85 + vix_long_term_avg * 0.15

    # Adjust for upcoming events (increase forecast by 10%)
    if has_upcoming_event:
        volatility_1d *= 1.10
        volatility_5d *= 1.15

    # Calculate confidence based on regime stability
    confidence_map = {
        "low": 0.85,
        "normal": 0.80,
        "elevated": 0.70,
        "extreme": 0.55,
    }
    confidence = confidence_map.get(regime, 0.70)

    # Lower confidence if historical vol differs significantly from VIX
    if current_vix > 0:
        vol_diff = abs(current_vix - historical_vol) / current_vix
        if vol_diff > 0.3:
            confidence *= 0.9

    return {
        "volatility_1d": round(volatility_1d, 2),
        "volatility_5d": round(volatility_5d, 2),
        "confidence": round(confidence, 2),
        "forecast_id": generate_forecast_id(),
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }


# Create FunctionTool wrappers
calculate_forecast_tool = FunctionTool(func=calculate_volatility_forecast)
generate_id_tool = FunctionTool(func=generate_forecast_id)
