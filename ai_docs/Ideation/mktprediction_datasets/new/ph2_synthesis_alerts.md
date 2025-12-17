# Phase 2: Synthesis + Alert Agents

**Previous Phase:** Phase 1 - Technical Agents (COMPLETE)
**Current Phase:** Phase 2 - Synthesis + Alert Agents
**Next Phase:** Phase 3 - Root Orchestrator
**Estimated Time:** 45 minutes
**Status:** PENDING

---

## Project Context (Read First)

> **Before starting this phase, review:**
>
> - [00_system_architecture.md](00_system_architecture.md) - Agent architecture and session state flow
> - [01_project_plan.md](01_project_plan.md) - Project overview

---

## Phase Objectives

1. Create `volatility_synthesis_agent` - generates 1d/5d forecasts
2. Create `alert_agent` - checks VIX thresholds
3. Create `persistence_agent` - writes results to BigQuery
4. Test full agent pipeline with `adk web`

---

## What This Phase Creates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 2 OUTPUT                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  apps/market-signal-agent/market_signal_agent/sub_agents/
  ├── synthesis_agent/
  │   ├── __init__.py
  │   └── agent.py              ← Reads {technical_signals}, {event_calendar},
  │                                      {speech_signals} ★UPDATED
  │                                Outputs volatility_forecasts
  │
  ├── alert_agent/
  │   ├── __init__.py
  │   └── agent.py              ← Reads {technical_signals}, {volatility_forecasts}
  │                                Outputs alerts
  │
  └── persistence_agent/
      ├── __init__.py
      └── agent.py              ← Reads {volatility_forecasts}, {alerts}
                                   Writes to BigQuery tables

  Session State Flow:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  {technical_signals}    ─┐                                               │
  │                          │                                               │
  │  {event_calendar}       ─┼──▶ synthesis_agent → "volatility_forecasts"  │
  │                          │                                               │
  │  {speech_signals}       ─┘    ★UPDATED (now 3 signal sources)           │
  │                                                                          │
  │  {technical_signals}    ─┐                                               │
  │                          ├──▶ alert_agent → "alerts"                     │
  │  {volatility_forecasts} ─┘                                               │
  │                                                                          │
  │  {volatility_forecasts} ─┐                                               │
  │                          ├──▶ persistence_agent → BigQuery               │
  │  {alerts}               ─┘                                               │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- [ ] Phase 1 completed (technical_agent, event_calendar_agent, speech_signal_agent working) ★UPDATED
- [ ] `technical_signals` output verified
- [ ] `event_calendar` output verified
- [ ] `speech_signals` output verified ★NEW
- [ ] BigQuery output tables exist (volatility_forecasts, alerts)

---

## Tasks

### Task 2.1: Create Directory Structure

```bash
mkdir -p apps/market-signal-agent/market_signal_agent/sub_agents/synthesis_agent
mkdir -p apps/market-signal-agent/market_signal_agent/sub_agents/alert_agent
mkdir -p apps/market-signal-agent/market_signal_agent/sub_agents/persistence_agent

touch apps/market-signal-agent/market_signal_agent/sub_agents/synthesis_agent/__init__.py
touch apps/market-signal-agent/market_signal_agent/sub_agents/alert_agent/__init__.py
touch apps/market-signal-agent/market_signal_agent/sub_agents/persistence_agent/__init__.py
```

### Task 2.2: Create Function Tools for Synthesis

**File:** `apps/market-signal-agent/market_signal_agent/tools/forecast_tools.py`

```python
"""Function tools for volatility forecasting."""

import uuid
from datetime import datetime
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

    # Mean reversion factor (stronger when VIX is far from average)
    reversion_factor = 0.1

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
    vol_diff = abs(current_vix - historical_vol) / current_vix
    if vol_diff > 0.3:
        confidence *= 0.9

    return {
        "volatility_1d": round(volatility_1d, 2),
        "volatility_5d": round(volatility_5d, 2),
        "confidence": round(confidence, 2),
        "forecast_id": generate_forecast_id(),
        "computed_at": datetime.utcnow().isoformat(),
    }


# Create FunctionTool wrappers
calculate_forecast_tool = FunctionTool(func=calculate_volatility_forecast)
generate_id_tool = FunctionTool(func=generate_forecast_id)
```

### Task 2.3: Create Alert Tools

**File:** `apps/market-signal-agent/market_signal_agent/tools/alert_tools.py`

```python
"""Function tools for alert generation."""

import uuid
from datetime import datetime
from typing import Any

from google.adk.tools import FunctionTool


def check_vix_threshold(
    current_vix: float,
    vix_low: float = 15.0,
    vix_normal: float = 20.0,
    vix_elevated: float = 25.0,
    vix_high: float = 30.0,
) -> dict[str, Any]:
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
            "triggered_at": datetime.utcnow().isoformat(),
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
            "triggered_at": datetime.utcnow().isoformat(),
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
            "triggered_at": datetime.utcnow().isoformat(),
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
            "message": f"{symbol} {anomaly_type}: {abs(zscore):.1f}σ {direction} average",
            "vix_value": None,
            "triggered_at": datetime.utcnow().isoformat(),
            "is_active": True,
        }
    return None


# Create FunctionTool wrappers
check_vix_tool = FunctionTool(func=check_vix_threshold)
check_anomaly_tool = FunctionTool(func=check_anomaly_alert)
```

### Task 2.4: Update Tools __init__.py

**File:** `apps/market-signal-agent/market_signal_agent/tools/__init__.py`

```python
"""Tools for Market Volatility Agent."""

from .bigquery_tools import bigquery_toolset, create_bigquery_toolset
from .forecast_tools import calculate_forecast_tool, generate_id_tool
from .alert_tools import check_vix_tool, check_anomaly_tool

__all__ = [
    "bigquery_toolset",
    "create_bigquery_toolset",
    "calculate_forecast_tool",
    "generate_id_tool",
    "check_vix_tool",
    "check_anomaly_tool",
]
```

### Task 2.5: Create Synthesis Agent

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/synthesis_agent/agent.py`

```python
"""Volatility Synthesis Agent - Generates volatility forecasts."""

from google.adk.agents import LlmAgent

from ...config import config
from ...tools import calculate_forecast_tool

synthesis_agent = LlmAgent(
    name="volatility_synthesis_agent",
    model=config.MODEL_NAME,
    output_key="volatility_forecasts",
    instruction="""You are the Volatility Synthesis Agent generating volatility forecasts.

## Your Role
Combine technical signals, event calendar data, and earnings call sentiment to generate volatility forecasts for major indices.

## Input Data ★UPDATED
Read from session state:
- **{technical_signals}**: Contains current_vix, volatility_regime, historical_vol_20d, anomalies
- **{event_calendar}**: Contains fed_meetings, mna_events, analyst_ratings, upcoming_high_impact
- **{speech_signals}**: Contains earnings call sentiment (tone, guidance, topics, risks, risk_score) ★NEW

## Forecast Logic

### 1. Extract Key Inputs
From technical_signals:
- current_vix: Current VIX level
- volatility_regime: low, normal, elevated, extreme
- historical_vol_20d: 20-day realized volatility

From event_calendar:
- Check if any upcoming_high_impact events exist
- Fed meetings within 7 days increase expected volatility
- Analyst rating changes (upgrades/downgrades) ★NEW

From speech_signals: ★NEW
- Aggregate sentiment from major tech earnings (AAPL, MSFT, NVDA, GOOGL, etc.)
- If majority bearish → increase volatility forecast by 5-10%
- If majority bullish → decrease volatility forecast by 5%
- Check for consensus risk factors across companies

### 2. Generate Forecasts
Use the `calculate_volatility_forecast` tool for each major index:
- SPX (S&P 500)
- NDX (Nasdaq 100)
- DJI (Dow Jones)
- RUT (Russell 2000)

Small-caps (RUT) typically have 1.3-1.5x the volatility of large-caps (SPX).

### 3. Apply Index-Specific Multipliers
| Index | Volatility Multiplier |
|-------|----------------------|
| SPX | 1.0 (baseline) |
| NDX | 1.15 (tech premium) |
| DJI | 0.95 (blue chip discount) |
| RUT | 1.35 (small cap premium) |

## Output Format
Return a JSON object:
```json
{{
    "forecasts": [
        {{
            "symbol": "SPX",
            "volatility_1d": 12.5,
            "volatility_5d": 14.2,
            "confidence": 0.82
        }},
        {{
            "symbol": "NDX",
            "volatility_1d": 14.4,
            "volatility_5d": 16.3,
            "confidence": 0.78
        }},
        {{
            "symbol": "DJI",
            "volatility_1d": 11.9,
            "volatility_5d": 13.5,
            "confidence": 0.85
        }},
        {{
            "symbol": "RUT",
            "volatility_1d": 16.9,
            "volatility_5d": 19.2,
            "confidence": 0.74
        }}
    ],
    "regime": "elevated",
    "current_vix": 24.5,
    "forecast_date": "2024-01-29",
    "has_upcoming_events": true,
    "earnings_sentiment": "mixed",
    "earnings_risk_score": 0.45
}}
```

## Important Notes
- Forecasts are annualized volatility percentages
- Confidence decreases during extreme regimes
- Upcoming events increase forecast uncertainty
- Earnings sentiment affects tech-heavy indices (NDX) more strongly ★NEW
- Bearish earnings tone from major tech can add 5-10% to NDX volatility forecast ★NEW
""",
    tools=[calculate_forecast_tool],
)
```

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/synthesis_agent/__init__.py`

```python
"""Volatility Synthesis Agent."""

from .agent import synthesis_agent

__all__ = ["synthesis_agent"]
```

### Task 2.6: Create Alert Agent

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/alert_agent/agent.py`

```python
"""Alert Agent - Checks thresholds and generates alerts."""

from google.adk.agents import LlmAgent

from ...config import config
from ...tools import check_vix_tool, check_anomaly_tool

alert_agent = LlmAgent(
    name="alert_agent",
    model=config.MODEL_NAME,
    output_key="alerts",
    instruction=f"""You are the Alert Agent checking VIX thresholds and generating alerts.

## Your Role
Analyze technical signals and volatility forecasts to generate appropriate alerts.

## Input Data
Read from session state:
- **{{technical_signals}}**: Contains current_vix, volatility_regime, anomalies
- **{{volatility_forecasts}}**: Contains forecasts with confidence scores

## Alert Thresholds

### VIX Thresholds
| VIX Level | Severity | Alert Type |
|-----------|----------|------------|
| > {config.VIX_HIGH} | critical | vix_extreme |
| > {config.VIX_ELEVATED} | warning | vix_high |
| > {config.VIX_NORMAL} | info | vix_elevated |
| < {config.VIX_NORMAL} | none | (no alert) |

### Anomaly Thresholds
- Z-score > {config.ZSCORE_THRESHOLD} or < -{config.ZSCORE_THRESHOLD}: Generate anomaly alert

## Steps

### 1. Check VIX Threshold
Use the `check_vix_threshold` tool with current_vix value.

### 2. Check Anomalies
For each anomaly in technical_signals.anomalies where status == "ANOMALY":
Use the `check_anomaly_alert` tool.

### 3. Compile Alerts
Collect all generated alerts into a list.

## Output Format
Return a JSON object:
```json
{{
    "alerts": [
        {{
            "id": "uuid-here",
            "alert_type": "vix_elevated",
            "severity": "warning",
            "symbol": null,
            "message": "HIGH volatility - VIX at 26.5, above 25",
            "vix_value": 26.5,
            "triggered_at": "2024-01-29T14:30:00Z",
            "is_active": true
        }},
        {{
            "id": "uuid-here",
            "alert_type": "anomaly",
            "severity": "info",
            "symbol": "SPX",
            "message": "SPX volume: 2.3σ above average",
            "vix_value": null,
            "triggered_at": "2024-01-29T14:30:00Z",
            "is_active": true
        }}
    ],
    "has_critical": false,
    "has_warning": true,
    "alert_count": 2
}}
```

## Alert Priority
1. CRITICAL (vix_extreme): Immediate attention required
2. WARNING (vix_high): Close monitoring recommended
3. INFO (vix_elevated, anomaly): Awareness level
""",
    tools=[check_vix_tool, check_anomaly_tool],
)
```

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/alert_agent/__init__.py`

```python
"""Alert Agent for threshold checking."""

from .agent import alert_agent

__all__ = ["alert_agent"]
```

### Task 2.7: Create Persistence Agent

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/persistence_agent/agent.py`

```python
"""Persistence Agent - Writes results to BigQuery."""

from google.adk.agents import LlmAgent

from ...config import config
from ...tools import bigquery_toolset

persistence_agent = LlmAgent(
    name="persistence_agent",
    model=config.MODEL_NAME,
    output_key="persistence_result",
    instruction=f"""You are the Persistence Agent writing results to BigQuery.

## Your Role
Save volatility forecasts and alerts to BigQuery tables for dashboard consumption.

## Input Data
Read from session state:
- **{{volatility_forecasts}}**: Contains forecasts array with symbol, volatility_1d, volatility_5d, confidence
- **{{alerts}}**: Contains alerts array with alert details

## Target Tables
Project: `{config.BIGQUERY_PROJECT}`
Dataset: `{config.BIGQUERY_DATASET}`

### 1. volatility_forecasts table
Schema:
- id: STRING (UUID)
- symbol: STRING
- forecast_date: DATE
- volatility_1d: FLOAT64
- volatility_5d: FLOAT64
- current_vix: FLOAT64
- volatility_regime: STRING
- confidence: FLOAT64
- computed_at: TIMESTAMP

### 2. alerts table
Schema:
- id: STRING (UUID)
- alert_type: STRING
- severity: STRING
- symbol: STRING (nullable)
- message: STRING
- vix_value: FLOAT64 (nullable)
- triggered_at: TIMESTAMP
- is_active: BOOLEAN

## Steps

### 1. Insert Forecasts
For each forecast in volatility_forecasts.forecasts:
```sql
INSERT INTO `{config.BIGQUERY_PROJECT}.{config.BIGQUERY_DATASET}.volatility_forecasts`
(id, symbol, forecast_date, volatility_1d, volatility_5d, current_vix, volatility_regime, confidence, computed_at)
VALUES
('{{forecast_id}}', '{{symbol}}', CURRENT_DATE(), {{volatility_1d}}, {{volatility_5d}}, {{current_vix}}, '{{regime}}', {{confidence}}, CURRENT_TIMESTAMP())
```

### 2. Insert Alerts
For each alert in alerts.alerts:
```sql
INSERT INTO `{config.BIGQUERY_PROJECT}.{config.BIGQUERY_DATASET}.alerts`
(id, alert_type, severity, symbol, message, vix_value, triggered_at, is_active)
VALUES
('{{id}}', '{{alert_type}}', '{{severity}}', '{{symbol}}', '{{message}}', {{vix_value}}, TIMESTAMP('{{triggered_at}}'), {{is_active}})
```

## Output Format
Return a JSON object:
```json
{{
    "forecasts_inserted": 4,
    "alerts_inserted": 2,
    "success": true,
    "errors": []
}}
```

## Important Notes
- Use CURRENT_DATE() for forecast_date
- Use CURRENT_TIMESTAMP() for computed_at
- Handle NULL values for nullable fields
- Report any errors in the errors array
""",
    tools=[bigquery_toolset],
)
```

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/persistence_agent/__init__.py`

```python
"""Persistence Agent for BigQuery writes."""

from .agent import persistence_agent

__all__ = ["persistence_agent"]
```

### Task 2.8: Update Sub-Agents __init__.py

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/__init__.py`

```python
"""Sub-agents for Market Volatility Agent."""

from .technical_agent import technical_agent
from .event_calendar_agent import event_calendar_agent
from .speech_signal_agent import speech_signal_agent  # ★NEW (from Phase 1)
from .synthesis_agent import synthesis_agent
from .alert_agent import alert_agent
from .persistence_agent import persistence_agent

__all__ = [
    "technical_agent",
    "event_calendar_agent",
    "speech_signal_agent",  # ★NEW
    "synthesis_agent",
    "alert_agent",
    "persistence_agent",
]
```

### Task 2.9: Test with ADK Web

```bash
cd apps/market-signal-agent
uv run adk web .
```

Test the full pipeline:
1. "Analyze current market volatility and generate forecasts"
2. "What alerts are triggered based on current conditions?"
3. "Generate a complete volatility report with forecasts and alerts"

---

## Verification Checklist

- [ ] synthesis_agent created with calculate_forecast_tool
- [ ] alert_agent created with check_vix_tool, check_anomaly_tool
- [ ] persistence_agent created with bigquery_toolset
- [ ] All agents export from sub_agents/__init__.py
- [ ] forecast_tools.py with calculation functions
- [ ] alert_tools.py with threshold check functions
- [ ] tools/__init__.py exports all tools
- [ ] `uv sync` succeeds
- [ ] `adk web` starts without errors
- [ ] Synthesis agent generates forecasts
- [ ] Alert agent generates alerts based on thresholds

---

## Handoff to Phase 3

**What's Ready:**
- 6 sub-agents complete: ★UPDATED
  - technical_agent → `technical_signals`
  - event_calendar_agent → `event_calendar` (includes analyst ratings)
  - speech_signal_agent → `speech_signals` ★NEW
  - synthesis_agent → `volatility_forecasts` (uses all 3 signal sources)
  - alert_agent → `alerts`
  - persistence_agent → BigQuery writes
- Function tools for forecasting and alerts
- Session state flow established

**What's Next:**
- Create root_agent orchestrator
- Wire SequentialAgent workflow (6 agents) ★UPDATED
- Add chat_agent for Q&A

---

## Prompt for Next Session (Phase 3)

```
`ph3_orchestrator.md`
Reference: `00_system_architecture.md`, `01_project_plan.md`

I'm continuing the Market Volatility Prediction Agent project.

## Phase 2 (Synthesis + Alert Agents) is COMPLETE

**What was created:**
- synthesis_agent → output_key: "volatility_forecasts"
  - Uses calculate_forecast_tool for volatility predictions
  - Reads {technical_signals}, {event_calendar}, and {speech_signals} ★UPDATED
- alert_agent → output_key: "alerts"
  - Uses check_vix_tool and check_anomaly_tool
  - Generates alerts based on VIX thresholds
- persistence_agent → writes to BigQuery
  - Inserts forecasts and alerts to output tables
- Function tools: forecast_tools.py, alert_tools.py

## Now Starting: Phase 3 - Root Orchestrator

Please read:
1. `ai_docs/Ideation/mktprediction_datasets/new/ph3_orchestrator.md` - Phase 3 tasks
2. `ai_docs/Ideation/mktprediction_datasets/new/00_system_architecture.md` - Architecture

## Key Tasks for Phase 3:
1. Create SequentialAgent workflow (volatility_workflow with 6 agents) ★UPDATED
2. Create root_agent orchestrator
3. Add chat_agent for Q&A
4. Test full pipeline with adk web

Please start by reading the phase document.
```
