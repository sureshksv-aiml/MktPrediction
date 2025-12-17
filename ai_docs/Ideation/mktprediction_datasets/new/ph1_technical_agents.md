# Phase 1: Technical Agents

**Previous Phase:** Phase 0 - Setup + Data Loading (COMPLETE)
**Current Phase:** Phase 1 - Technical Agents
**Next Phase:** Phase 2 - Synthesis + Alert Agents
**Estimated Time:** 60 minutes ★UPDATED (was 45 min)
**Status:** PENDING

---

## Project Context (Read First)

> **Before starting this phase, review:**
>
> - [00_system_architecture.md](00_system_architecture.md) - Agent architecture and session state flow
> - [01_project_plan.md](01_project_plan.md) - Project overview

---

## Phase Objectives

1. Create project structure for `market-signal-agent`
2. Create `technical_agent` - VIX analysis, z-score anomaly detection
3. Create `event_calendar_agent` - Fed meetings, M&A events, analyst ratings ★UPDATED
4. Create `speech_signal_agent` - Earnings call sentiment ★NEW
5. Test agents with `adk web`

---

## What This Phase Creates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 1 OUTPUT                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  apps/market-signal-agent/
  ├── market_signal_agent/
  │   ├── __init__.py
  │   ├── config.py                         ← BigQuery config, VIX thresholds
  │   ├── sub_agents/
  │   │   ├── __init__.py
  │   │   ├── technical_agent/
  │   │   │   ├── __init__.py
  │   │   │   └── agent.py                  ← VIX, z-score analysis
  │   │   ├── event_calendar_agent/
  │   │   │   ├── __init__.py
  │   │   │   └── agent.py                  ← Fed meetings, M&A, analyst ratings ★UPDATED
  │   │   └── speech_signal_agent/          ★NEW
  │   │       ├── __init__.py
  │   │       └── agent.py                  ← Earnings call sentiment
  │   └── tools/
  │       ├── __init__.py
  │       └── bigquery_tools.py             ← BigQuery toolset setup
  └── pyproject.toml

  Session State Flow:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  technical_agent       → output_key: "technical_signals"                │
  │  event_calendar_agent  → output_key: "event_calendar" (includes ratings)│
  │  speech_signal_agent   → output_key: "speech_signals"              ★NEW │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- [ ] Phase 0 completed (BigQuery tables loaded)
- [ ] `market_30yr` table has VIX data
- [ ] `index_data` table has OHLCV data
- [ ] `fed_communications` table has Fed meeting data
- [ ] `acquisitions` table has M&A data
- [ ] `analyst_ratings` table has analyst rating data ★NEW
- [ ] `speech_signals` table has earnings call sentiment (~200 rows) ★NEW

---

## ADK Agent Constraints

> **CRITICAL: ONE Built-in Tool Per Agent**
>
> ADK agents can only have ONE "built-in" tool (BigQueryToolset, google_search, code_execution) per agent.
>
> | Tool Type | Examples | Limit Per Agent |
> |-----------|----------|-----------------|
> | Built-in | BigQueryToolset, google_search, code_execution | **1 maximum** |
> | Function tools | Custom Python functions via `FunctionTool` | Unlimited |

---

## Tasks

### Task 1.1: Create Project Structure

```bash
# Create directory structure
mkdir -p apps/market-signal-agent/market_signal_agent/sub_agents/technical_agent
mkdir -p apps/market-signal-agent/market_signal_agent/sub_agents/event_calendar_agent
mkdir -p apps/market-signal-agent/market_signal_agent/sub_agents/speech_signal_agent  # ★NEW
mkdir -p apps/market-signal-agent/market_signal_agent/tools

# Create __init__.py files
touch apps/market-signal-agent/market_signal_agent/__init__.py
touch apps/market-signal-agent/market_signal_agent/sub_agents/__init__.py
touch apps/market-signal-agent/market_signal_agent/sub_agents/technical_agent/__init__.py
touch apps/market-signal-agent/market_signal_agent/sub_agents/event_calendar_agent/__init__.py
touch apps/market-signal-agent/market_signal_agent/sub_agents/speech_signal_agent/__init__.py  # ★NEW
touch apps/market-signal-agent/market_signal_agent/tools/__init__.py
```

### Task 1.2: Create pyproject.toml

**File:** `apps/market-signal-agent/pyproject.toml`

```toml
[project]
name = "market-signal-agent"
version = "0.1.0"
description = "Market Volatility Prediction Agent using Google ADK"
requires-python = ">=3.10"
dependencies = [
    "google-adk>=0.3.0",
    "google-cloud-bigquery>=3.0.0",
    "pydantic>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-asyncio>=0.21.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

### Task 1.3: Create Config

**File:** `apps/market-signal-agent/market_signal_agent/config.py`

```python
"""Configuration for Market Volatility Agent."""

import os


class Config:
    """Configuration settings for the agent."""

    # BigQuery settings
    BIGQUERY_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "your-project-id")
    BIGQUERY_DATASET: str = "market_volatility"

    # VIX thresholds for alerts
    VIX_LOW: float = 15.0
    VIX_NORMAL: float = 20.0
    VIX_ELEVATED: float = 25.0
    VIX_HIGH: float = 30.0

    # Z-score anomaly threshold
    ZSCORE_THRESHOLD: float = 2.0

    # Model settings
    MODEL_NAME: str = "gemini-2.0-flash"


config = Config()
```

### Task 1.4: Create BigQuery Tools

**File:** `apps/market-signal-agent/market_signal_agent/tools/bigquery_tools.py`

```python
"""BigQuery toolset for market volatility agents."""

from google.adk.tools.bigquery_toolset import BigQueryToolset

from ..config import config


def create_bigquery_toolset() -> BigQueryToolset:
    """Create a BigQuery toolset for querying market data."""
    return BigQueryToolset(
        project_id=config.BIGQUERY_PROJECT,
    )


# Export a shared instance
bigquery_toolset = create_bigquery_toolset()
```

**File:** `apps/market-signal-agent/market_signal_agent/tools/__init__.py`

```python
"""Tools for Market Volatility Agent."""

from .bigquery_tools import bigquery_toolset, create_bigquery_toolset

__all__ = ["bigquery_toolset", "create_bigquery_toolset"]
```

### Task 1.5: Create Technical Agent

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/technical_agent/agent.py`

```python
"""Technical Agent - Analyzes VIX and market data for volatility signals."""

from google.adk.agents import LlmAgent

from ...config import config
from ...tools import bigquery_toolset

technical_agent = LlmAgent(
    name="technical_agent",
    model=config.MODEL_NAME,
    output_key="technical_signals",
    instruction=f"""You are the Technical Signal Agent analyzing market volatility data.

## Your Role
Analyze VIX levels and market data to determine the current volatility regime and detect anomalies.

## Data Sources
Query BigQuery tables in project `{config.BIGQUERY_PROJECT}`, dataset `{config.BIGQUERY_DATASET}`:

1. **market_30yr** - 30 years of market data including VIX
   - Columns: date, vix, sp500, nasdaq, dow, treasury_10y, gold, oil_wti

2. **index_data** - OHLCV data for major indices
   - Columns: date, symbol, open, high, low, close, volume

## Analysis Steps

### Step 1: Get Current VIX and Regime
```sql
SELECT
    date,
    vix AS current_vix,
    CASE
        WHEN vix < {config.VIX_LOW} THEN 'low'
        WHEN vix < {config.VIX_NORMAL} THEN 'normal'
        WHEN vix < {config.VIX_HIGH} THEN 'elevated'
        ELSE 'extreme'
    END AS volatility_regime,
    PERCENT_RANK() OVER (ORDER BY vix) * 100 AS vix_percentile
FROM `{config.BIGQUERY_PROJECT}.{config.BIGQUERY_DATASET}.market_30yr`
WHERE vix IS NOT NULL
ORDER BY date DESC
LIMIT 1;
```

### Step 2: Calculate Historical Volatility
```sql
WITH recent_data AS (
    SELECT date, sp500,
        LAG(sp500) OVER (ORDER BY date) AS prev_sp500
    FROM `{config.BIGQUERY_PROJECT}.{config.BIGQUERY_DATASET}.market_30yr`
    WHERE sp500 IS NOT NULL
    ORDER BY date DESC
    LIMIT 21
)
SELECT
    STDDEV((sp500 - prev_sp500) / prev_sp500) * SQRT(252) * 100 AS historical_vol_20d
FROM recent_data
WHERE prev_sp500 IS NOT NULL;
```

### Step 3: Z-Score Anomaly Detection
```sql
WITH stats AS (
    SELECT
        symbol,
        AVG(close) AS avg_price,
        STDDEV(close) AS std_price,
        AVG(volume) AS avg_volume,
        STDDEV(volume) AS std_volume
    FROM `{config.BIGQUERY_PROJECT}.{config.BIGQUERY_DATASET}.index_data`
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
    GROUP BY symbol
),
latest AS (
    SELECT symbol, close, volume, date
    FROM `{config.BIGQUERY_PROJECT}.{config.BIGQUERY_DATASET}.index_data`
    WHERE date = (SELECT MAX(date) FROM `{config.BIGQUERY_PROJECT}.{config.BIGQUERY_DATASET}.index_data`)
)
SELECT
    l.symbol,
    l.close,
    (l.close - s.avg_price) / NULLIF(s.std_price, 0) AS price_zscore,
    (l.volume - s.avg_volume) / NULLIF(s.std_volume, 0) AS volume_zscore
FROM latest l
JOIN stats s ON l.symbol = s.symbol;
```

## Output Format
Return a JSON object with this structure:
```json
{{
    "current_vix": 24.5,
    "vix_percentile": 78,
    "volatility_regime": "elevated",
    "historical_vol_20d": 15.2,
    "anomalies": [
        {{"symbol": "SPX", "type": "volume", "zscore": 2.3, "status": "ANOMALY"}},
        {{"symbol": "NDX", "type": "price", "zscore": 0.5, "status": "NORMAL"}}
    ],
    "analysis_date": "2024-01-29"
}}
```

## Regime Interpretation
| VIX Level | Regime | Market Condition |
|-----------|--------|------------------|
| < {config.VIX_LOW} | low | Market calm, low fear |
| {config.VIX_LOW}-{config.VIX_NORMAL} | normal | Normal conditions |
| {config.VIX_NORMAL}-{config.VIX_HIGH} | elevated | Increased uncertainty |
| > {config.VIX_HIGH} | extreme | High fear, crisis mode |

## Anomaly Detection
- Z-score > {config.ZSCORE_THRESHOLD} or < -{config.ZSCORE_THRESHOLD}: ANOMALY
- Otherwise: NORMAL
""",
    tools=[bigquery_toolset],
)
```

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/technical_agent/__init__.py`

```python
"""Technical Agent for VIX and market analysis."""

from .agent import technical_agent

__all__ = ["technical_agent"]
```

### Task 1.6: Create Event Calendar Agent ★UPDATED

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/event_calendar_agent/agent.py`

```python
"""Event Calendar Agent - Retrieves Fed meetings, M&A events, and analyst ratings."""

from google.adk.agents import LlmAgent

from ...config import config
from ...tools import bigquery_toolset

event_calendar_agent = LlmAgent(
    name="event_calendar_agent",
    model=config.MODEL_NAME,
    output_key="event_calendar",
    instruction=f"""You are the Event Calendar Agent retrieving market-moving events.

## Your Role
Query BigQuery to retrieve recent Fed communications, M&A events, and analyst rating changes that may impact market volatility.

## Data Sources
Query BigQuery tables in project `{config.BIGQUERY_PROJECT}`, dataset `{config.BIGQUERY_DATASET}`:

1. **fed_communications** - Federal Reserve FOMC meeting communications
   - Columns: date, release_date, type, text

2. **acquisitions** - M&A events
   - Columns: id, parent_company, acquisition_year, acquisition_month, acquired_company, business, country, acquisition_price, category

3. **analyst_ratings** - Analyst rating changes ★NEW
   - Columns: id, title, date, stock

## Analysis Steps

### Step 1: Get Recent Fed Communications
```sql
SELECT DISTINCT
    date AS event_date,
    type AS event_type,
    'Fed FOMC' AS event_category,
    SUBSTR(text, 1, 200) AS summary
FROM `{config.BIGQUERY_PROJECT}.{config.BIGQUERY_DATASET}.fed_communications`
WHERE type = 'Minute'
ORDER BY date DESC
LIMIT 10;
```

### Step 2: Get Recent M&A Events
```sql
SELECT
    CONCAT(acquisition_year, '-', acquisition_month) AS event_date,
    parent_company,
    acquired_company,
    acquisition_price,
    category,
    business
FROM `{config.BIGQUERY_PROJECT}.{config.BIGQUERY_DATASET}.acquisitions`
WHERE acquisition_price > 1000000000  -- Major deals > $1B
ORDER BY acquisition_year DESC, acquisition_month DESC
LIMIT 10;
```

### Step 3: Get Recent Analyst Ratings ★NEW
```sql
SELECT
    date AS event_date,
    stock AS symbol,
    title AS rating_action,
    'Analyst Rating' AS event_type
FROM `{config.BIGQUERY_PROJECT}.{config.BIGQUERY_DATASET}.analyst_ratings`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
ORDER BY date DESC
LIMIT 20;
```

### Step 4: Identify High-Impact Events
Fed meetings, major M&A events, and analyst rating changes tend to increase market volatility. Flag:
- FOMC meeting minutes within 7 days
- M&A deals > $10B
- Analyst upgrades/downgrades on major tech stocks

## Output Format
Return a JSON object with this structure:
```json
{{
    "fed_meetings": [
        {{
            "date": "2024-10-29",
            "type": "Minute",
            "category": "Fed FOMC",
            "summary": "The Federal Open Market Committee met..."
        }}
    ],
    "mna_events": [
        {{
            "date": "2021-03",
            "parent_company": "Microsoft",
            "acquired_company": "Nuance",
            "value_usd": 19700000000,
            "category": "Technology"
        }}
    ],
    "analyst_ratings": [
        {{
            "date": "2024-01-15",
            "symbol": "AAPL",
            "rating_action": "B of A Securities Maintains Buy on Apple..."
        }}
    ],
    "upcoming_high_impact": [
        {{
            "event": "FOMC Meeting",
            "expected_date": "2024-01-31",
            "volatility_impact": "high"
        }}
    ],
    "total_fed_meetings": 10,
    "total_mna_events": 10,
    "total_analyst_ratings": 20
}}
```

## Event Impact on Volatility
| Event Type | Typical VIX Impact |
|------------|-------------------|
| FOMC Rate Decision | +2 to +5 points |
| Fed Minutes Release | +1 to +2 points |
| Major M&A Announcement | +1 to +3 points (sector) |
| Fed Chair Speech | +1 to +3 points |
| Analyst Downgrade (major stock) | +0.5 to +2 points (sector) | ★NEW
| Multiple Analyst Actions | +1 to +3 points (if correlated) | ★NEW
""",
    tools=[bigquery_toolset],
)
```

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/event_calendar_agent/__init__.py`

```python
"""Event Calendar Agent for Fed and M&A events."""

from .agent import event_calendar_agent

__all__ = ["event_calendar_agent"]
```

### Task 1.7: Create Speech Signal Agent ★NEW

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/speech_signal_agent/agent.py`

```python
"""Speech Signal Agent - Queries BigQuery for earnings call sentiment."""

import json

from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from google.cloud import bigquery

from ...config import config


def query_speech_signals(
    symbols: str,
    days: int = 90,
) -> str:
    """Get speech signals (earnings calls) for stocks.

    Handles: earnings, calls, guidance, management tone, transcripts, forward outlook.
    Maps company names: Apple->AAPL, Nvidia->NVDA, Microsoft->MSFT,
    Google/Alphabet->GOOGL, Amazon->AMZN, Intel->INTC, etc.

    Args:
        symbols: Ticker symbols (e.g., "AAPL" or "AAPL,NVDA,MSFT")
        days: Lookback period, default 90

    Returns:
        JSON with tone, guidance, topics, risks, risk_score for each symbol
    """
    # Parse symbols
    symbol_list = [s.strip().upper() for s in symbols.split(",")]

    # Build query
    project = config.BIGQUERY_PROJECT
    dataset = config.BIGQUERY_DATASET
    table = f"`{project}.{dataset}.speech_signals`"

    query = f"""
    SELECT
        symbol,
        event,
        tone,
        guidance,
        topics,
        risks,
        processed_at
    FROM {table}
    WHERE symbol IN UNNEST(@symbols)
        AND processed_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @days DAY)
    ORDER BY processed_at DESC
    """

    # Execute query with parameters
    client = bigquery.Client()
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ArrayQueryParameter("symbols", "STRING", symbol_list),
            bigquery.ScalarQueryParameter("days", "INT64", days),
        ]
    )

    results = client.query(query, job_config=job_config).result()

    # Process results
    output: dict[str, dict] = {}
    for row in results:
        # Calculate risk_score from tone
        tone_risk_map = {"bullish": 0.3, "neutral": 0.5, "bearish": 0.8}
        risk_score = tone_risk_map.get(row.tone, 0.5)

        output[row.symbol] = {
            "symbol": row.symbol,
            "event": row.event,
            "tone": row.tone,
            "guidance": row.guidance,
            "topics": list(row.topics) if row.topics else [],
            "risks": list(row.risks) if row.risks else [],
            "processed_at": row.processed_at.isoformat() if row.processed_at else None,
            "risk_score": risk_score,
        }

    if not output:
        return json.dumps({
            "message": "No speech signals found for the requested symbols.",
            "symbols_queried": symbol_list,
        })

    return json.dumps(output, indent=2)


# Create the FunctionTool
speech_signal_tool = FunctionTool(func=query_speech_signals)

# Supported tickers from earnings transcripts
SUPPORTED_TICKERS = "AAPL, AMD, AMZN, ASML, CSCO, GOOGL, INTC, MSFT, MU, NVDA"

# Speech Signal Agent with BigQuery tool
speech_signal_agent = LlmAgent(
    name="speech_signal_agent",
    model=config.MODEL_NAME,
    description="Earnings call analysis: management tone, guidance, key topics, risk factors from transcribed earnings calls.",
    tools=[speech_signal_tool],
    output_key="speech_signals",
    instruction=f"""You analyze earnings call transcripts for market signals.

## TOOL USAGE (MANDATORY)
You MUST call `query_speech_signals` for EVERY query. Never just describe what you would do.

## SUPPORTED TICKERS
{SUPPORTED_TICKERS}

## TICKER MAPPING
Apple->AAPL, Nvidia->NVDA, Microsoft->MSFT, Google/Alphabet->GOOGL, Amazon->AMZN,
Intel->INTC, Cisco->CSCO, AMD->AMD, Micron->MU, ASML->ASML

## EXAMPLES
- "Apple earnings" -> query_speech_signals(symbols="AAPL")
- "Nvidia guidance" -> query_speech_signals(symbols="NVDA")
- "Compare Microsoft and Google earnings" -> query_speech_signals(symbols="MSFT,GOOGL")
- "What did management say about AI?" -> query_speech_signals(symbols="NVDA,MSFT,GOOGL")

## OUTPUT INTERPRETATION
- tone: "bullish", "bearish", or "neutral" - management sentiment
- guidance: Forward-looking statements and forecasts
- topics: Key themes discussed (AI, expansion, margins, etc.)
- risks: Risk factors mentioned (supply chain, competition, etc.)
- risk_score: 0 (low risk) to 1 (high risk) derived from tone

## BEHAVIOR
- Always call the tool, even if unsure about the ticker
- Summarize key findings with tone and guidance
- Highlight notable risks or opportunities mentioned
- For multiple tickers, compare management outlooks
""",
)
```

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/speech_signal_agent/__init__.py`

```python
"""Speech Signal Agent for earnings call sentiment analysis."""

from .agent import speech_signal_agent

__all__ = ["speech_signal_agent"]
```

### Task 1.8: Update Sub-Agents __init__.py ★RENUMBERED

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/__init__.py`

```python
"""Sub-agents for Market Volatility Agent."""

from .technical_agent import technical_agent
from .event_calendar_agent import event_calendar_agent
from .speech_signal_agent import speech_signal_agent  # ★NEW

__all__ = [
    "technical_agent",
    "event_calendar_agent",
    "speech_signal_agent",  # ★NEW
]
```

### Task 1.9: Create Temporary Root Agent for Testing ★RENUMBERED

**File:** `apps/market-signal-agent/market_signal_agent/agent.py`

```python
"""Temporary root agent for testing Phase 1 agents."""

from google.adk.agents import LlmAgent

from .config import config
from .sub_agents import technical_agent, event_calendar_agent, speech_signal_agent  # ★UPDATED

# Temporary root agent for testing individual sub-agents
# Will be replaced with proper orchestrator in Phase 3
root_agent = LlmAgent(
    name="market_volatility_test_agent",
    model=config.MODEL_NAME,
    instruction="""You are a test orchestrator for the Market Volatility Agent.

You have access to three sub-agents:
1. technical_agent - Analyzes VIX and market data
2. event_calendar_agent - Retrieves Fed meetings, M&A events, analyst ratings
3. speech_signal_agent - Analyzes earnings call sentiment ★NEW

When asked about:
- VIX, volatility, market regime, anomalies → delegate to technical_agent
- Fed meetings, FOMC, M&A, events, analyst ratings → delegate to event_calendar_agent
- Earnings calls, guidance, management tone → delegate to speech_signal_agent ★NEW
- Overall market outlook → call all three agents

Summarize the results for the user.
""",
    sub_agents=[technical_agent, event_calendar_agent, speech_signal_agent],  # ★UPDATED
)
```

### Task 1.10: Create Package __init__.py ★RENUMBERED

**File:** `apps/market-signal-agent/market_signal_agent/__init__.py`

```python
"""Market Volatility Prediction Agent."""

from .agent import root_agent

__all__ = ["root_agent"]
```

### Task 1.11: Test with ADK Web ★RENUMBERED

```bash
cd apps/market-signal-agent

# Install dependencies
uv sync

# Start ADK web interface
uv run adk web .
```

Test prompts:
1. "What is the current VIX level and volatility regime?"
2. "Are there any market anomalies detected?"
3. "Show me recent Fed FOMC meetings"
4. "What major M&A events have occurred recently?"
5. "Show recent analyst rating changes" ★NEW
6. "What is the sentiment from Apple's earnings calls?" ★NEW
7. "Compare Nvidia and Microsoft management guidance" ★NEW

---

## Session State Dependencies

| Agent | Writes to Session | Read by |
|-------|-------------------|---------|
| technical_agent | `technical_signals` | synthesis_agent (Phase 2) |
| event_calendar_agent | `event_calendar` | synthesis_agent (Phase 2) |
| speech_signal_agent | `speech_signals` | synthesis_agent (Phase 2) | ★NEW

---

## Verification Checklist

- [ ] Project structure created
- [ ] pyproject.toml configured
- [ ] config.py with BigQuery settings
- [ ] bigquery_tools.py with toolset
- [ ] technical_agent created with VIX queries
- [ ] event_calendar_agent created with Fed/M&A/analyst rating queries ★UPDATED
- [ ] speech_signal_agent created with earnings call queries ★NEW
- [ ] sub_agents/__init__.py exports all three agents ★UPDATED
- [ ] Temporary root agent for testing (includes all 3 agents) ★UPDATED
- [ ] `uv sync` succeeds
- [ ] `adk web` starts without errors
- [ ] Technical agent returns VIX data
- [ ] Event calendar agent returns Fed meetings and analyst ratings ★UPDATED
- [ ] Speech signal agent returns earnings sentiment ★NEW

---

## Handoff to Phase 2

**What's Ready:**
- Project structure established
- technical_agent outputs `technical_signals`:
  - current_vix, volatility_regime, vix_percentile
  - historical_vol_20d
  - anomalies array with z-scores
- event_calendar_agent outputs `event_calendar`:
  - fed_meetings array
  - mna_events array
  - analyst_ratings array ★NEW
  - upcoming_high_impact array
- speech_signal_agent outputs `speech_signals`: ★NEW
  - earnings call sentiment for each symbol
  - tone (bullish/bearish/neutral)
  - guidance, topics, risks arrays
  - risk_score

**What's Next:**
- Create synthesis_agent (reads technical_signals + event_calendar + speech_signals) ★UPDATED
- Create alert_agent (checks VIX thresholds)

---

## Prompt for Next Session (Phase 2)

```
`ph2_synthesis_alerts.md`
Reference: `00_system_architecture.md`, `01_project_plan.md`

I'm continuing the Market Volatility Prediction Agent project.

## Phase 1 (Technical Agents) is COMPLETE

**What was created:**
- Project structure: apps/market-signal-agent/
- config.py with BigQuery settings and VIX thresholds
- bigquery_tools.py with BigQueryToolset
- technical_agent → output_key: "technical_signals"
  - Queries market_30yr for VIX
  - Queries index_data for z-score anomalies
- event_calendar_agent → output_key: "event_calendar"
  - Queries fed_communications for FOMC meetings
  - Queries acquisitions for M&A events
  - Queries analyst_ratings for rating changes ★NEW
- speech_signal_agent → output_key: "speech_signals" ★NEW
  - Queries speech_signals for earnings call sentiment
  - Returns tone, guidance, topics, risks, risk_score

## Now Starting: Phase 2 - Synthesis + Alert Agents

Please read:
1. `ai_docs/Ideation/mktprediction_datasets/new/ph2_synthesis_alerts.md` - Phase 2 tasks
2. `ai_docs/Ideation/mktprediction_datasets/new/00_system_architecture.md` - Architecture

## Key Tasks for Phase 2:
1. Create synthesis_agent (reads {technical_signals}, {event_calendar}, {speech_signals}) ★UPDATED
2. Create alert_agent (checks VIX thresholds)
3. Create persistence_agent (writes to BigQuery)
4. Test agents with adk web

Please start by reading the phase document.
```
