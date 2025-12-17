"""Function tools for alert generation."""

import uuid
from datetime import datetime, timezone
from typing import Any

from google.adk.tools import FunctionTool


def check_vix_threshold(
    current_vix: float,
    vix_low: float = 15.0,
    vix_normal: float = 20.0,
    vix_elevated: float = 25.0,
    vix_high: float = 30.0,
) -> dict[str, Any] | None:
    """
    Check VIX against thresholds and generate appropriate alert.

    Args:
        current_vix: Current VIX level
        vix_low: Low threshold (default 15)
        vix_normal: Normal threshold (default 20)
        vix_elevated: Elevated threshold (default 25)
        vix_high: High/extreme threshold (default 30)

    Returns:
        Dict with alert details if threshold exceeded, None otherwise
    """
    if current_vix > vix_high:
        return {
            "id": str(uuid.uuid4()),
            "alert_type": "vix_extreme",
            "severity": "critical",
            "symbol": None,
            "message": f"EXTREME volatility detected - VIX at {current_vix:.1f}, above {vix_high}",
            "vix_value": current_vix,
            "triggered_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True,
        }
    elif current_vix > vix_elevated:
        return {
            "id": str(uuid.uuid4()),
            "alert_type": "vix_high",
            "severity": "warning",
            "symbol": None,
            "message": f"HIGH volatility - VIX at {current_vix:.1f}, above {vix_elevated}",
            "vix_value": current_vix,
            "triggered_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True,
        }
    elif current_vix > vix_normal:
        return {
            "id": str(uuid.uuid4()),
            "alert_type": "vix_elevated",
            "severity": "info",
            "symbol": None,
            "message": f"ELEVATED volatility - VIX at {current_vix:.1f}, above {vix_normal}",
            "vix_value": current_vix,
            "triggered_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True,
        }
    return None


def check_anomaly_alert(
    symbol: str,
    anomaly_type: str,
    zscore: float,
    threshold: float = 2.0,
) -> dict[str, Any] | None:
    """
    Check if z-score exceeds threshold and generate alert.

    Args:
        symbol: Ticker symbol (e.g., SPX, NDX)
        anomaly_type: Type of anomaly (price, volume)
        zscore: Calculated z-score
        threshold: Z-score threshold (default 2.0)

    Returns:
        Dict with alert details if anomaly detected, None otherwise
    """
    if abs(zscore) > threshold:
        direction = "above" if zscore > 0 else "below"
        return {
            "id": str(uuid.uuid4()),
            "alert_type": "anomaly",
            "severity": "info",
            "symbol": symbol,
            "message": f"{symbol} {anomaly_type}: {abs(zscore):.1f} sigma {direction} average",
            "vix_value": None,
            "triggered_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True,
        }
    return None


# Create FunctionTool wrappers
check_vix_tool = FunctionTool(func=check_vix_threshold)
check_anomaly_tool = FunctionTool(func=check_anomaly_alert)
