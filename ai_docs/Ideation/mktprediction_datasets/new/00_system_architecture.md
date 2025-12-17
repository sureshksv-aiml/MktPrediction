# Market Volatility Prediction Agent - System Architecture

## Overview

This document contains all system diagrams, data flow, and UI mockups for the Market Volatility Prediction Agent hackathon project.

---

## End-to-End Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              END-TO-END DATA FLOW                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
  │   GCS BUCKET     │      │    BIGQUERY      │      │   ADK AGENTS     │
  │   (Raw Data)     │ ───▶ │   (Tables)       │ ───▶ │   (Analysis)     │
  └──────────────────┘      └──────────────────┘      └──────────────────┘
         │                         │                         │
         │                         │                         │
         ▼                         ▼                         ▼
  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
  │  12 CSV Files    │      │  Feature Queries │      │  Volatility      │
  │  (Historical)    │      │  (SQL)           │      │  Forecasts       │
  └──────────────────┘      └──────────────────┘      └──────────────────┘
                                   │                         │
                                   │                         │
                                   ▼                         ▼
                            ┌──────────────────┐      ┌──────────────────┐
                            │  Output Tables   │ ◀─── │  Persistence     │
                            │  (Forecasts)     │      │  Agent           │
                            └──────────────────┘      └──────────────────┘
                                   │
                                   │
                                   ▼
                            ┌──────────────────┐      ┌──────────────────┐
                            │   REST API       │ ───▶ │   DASHBOARD      │
                            │   (Next.js)      │      │   (React)        │
                            └──────────────────┘      └──────────────────┘
```

---

## Layer 1: GCS Bucket (Raw Data Storage)

### Bucket Structure
```
gs://[PROJECT_ID]-market-volatility-data/
├── raw/
│   ├── 30_yr_stock_market_data.csv        (7,754 rows)   ← VIX, indices, commodities
│   ├── indexData.csv                       (112,457 rows) ← OHLCV for indices
│   ├── sp500_companies.csv                 (503 rows)     ← Company fundamentals (NOT LOADED)
│   ├── US_Economic_Indicators.csv          (44 rows)      ← GDP, inflation, unemployment
│   ├── stock_news.csv                      (26,000 rows)  ← News headlines + sentiment
│   ├── communications.csv                  (65,019 rows)  ← Fed communications
│   ├── acquisitions_update_2021.csv        (1,454 rows)   ← M&A events
│   ├── analyst_ratings_processed.csv       (~5,000 rows)  ← Analyst ratings, price targets ★NEW
│   ├── earnings-call-transcripts/          (~200 files)   ← Text transcripts (10 companies, 2016-2020) ★NEW
│   │   ├── AAPL/                           ← Apple transcripts
│   │   ├── MSFT/                           ← Microsoft transcripts
│   │   ├── NVDA/                           ← Nvidia transcripts
│   │   ├── GOOGL/                          ← Alphabet transcripts
│   │   ├── AMZN/                           ← Amazon transcripts
│   │   ├── AMD/                            ← AMD transcripts
│   │   ├── INTC/                           ← Intel transcripts
│   │   ├── CSCO/                           ← Cisco transcripts
│   │   ├── MU/                             ← Micron transcripts
│   │   └── ASML/                           ← ASML transcripts
│   ├── dataset_summary.csv                 (metadata)     ← NOT LOADED
│   └── symbols_valid_meta.csv              (8,000 rows)   ← Ticker metadata (NOT LOADED)
└── processed/
    └── (empty - BigQuery handles processing)
```

### Source Files Location
```
Local: ai_docs/Ideation/mktprediction_datasets/data/
├── datasets_uc4-market-activity-prediction-agent_30_yr_stock_market_data.csv
├── datasets_uc4-market-activity-prediction-agent_indexData.csv
├── datasets_uc4-market-activity-prediction-agent_sp500_companies.csv          ← NOT LOADED
├── datasets_uc4-market-activity-prediction-agent_US_Economic_Indicators.csv
├── datasets_uc4-market-activity-prediction-agent_stock_news.csv
├── datasets_uc4-market-activity-prediction-agent_communications.csv
├── datasets_uc4-market-activity-prediction-agent_acquisitions_update_2021.csv
├── datasets_uc4-market-activity-prediction-agent_analyst_ratings_processed.csv  ★NEW
├── datasets_uc4-market-activity-prediction-agent_earnings-call-transcripts/      ★NEW (folder)
│   ├── AAPL/                              ← ~20 transcripts per company
│   ├── AMD/
│   ├── AMZN/
│   ├── ASML/
│   ├── CSCO/
│   ├── GOOGL/
│   ├── INTC/
│   ├── MSFT/
│   ├── MU/
│   └── NVDA/
├── datasets_uc4-market-activity-prediction-agent_dataset_summary.csv            ← NOT LOADED
└── datasets_uc4-market-activity-prediction-agent_symbols_valid_meta.csv         ← NOT LOADED
```

---

## Layer 2: BigQuery Tables & Schema

### Dataset: `market_volatility`

### INPUT TABLES (8 Tables)

#### Table 1: `market_30yr` (PRIMARY - VIX & Price Data)
```sql
CREATE TABLE market_volatility.market_30yr (
    date DATE,
    -- US Indices
    sp500 FLOAT64,           -- S&P 500
    nasdaq FLOAT64,          -- Nasdaq Composite
    dow FLOAT64,             -- Dow Jones
    russell_2000 FLOAT64,    -- Russell 2000
    -- Volatility
    vix FLOAT64,             -- CBOE VIX (KEY FOR VOLATILITY)
    -- Treasuries
    treasury_10y FLOAT64,    -- 10-Year Treasury Yield
    treasury_5y FLOAT64,     -- 5-Year Treasury Yield
    -- Commodities
    gold FLOAT64,
    oil_wti FLOAT64,
    -- Calculated fields (added during load)
    sp500_return FLOAT64,    -- Daily return %
    sp500_volatility_20d FLOAT64  -- 20-day rolling volatility
);
-- Rows: ~7,754 (30 years daily data)
-- Used by: Technical Agent, Volatility Synthesis
```

#### Table 2: `index_data` (OHLCV for Technical Analysis)
```sql
CREATE TABLE market_volatility.index_data (
    date DATE,
    symbol STRING,           -- SPX, NDX, DJI, RUT
    open FLOAT64,
    high FLOAT64,
    low FLOAT64,
    close FLOAT64,
    adj_close FLOAT64,
    volume INT64
);
-- Rows: ~112,457
-- Used by: Technical Agent (z-score calculation)
```

#### Table 3: `economic_indicators` (Macro Context)
```sql
CREATE TABLE market_volatility.economic_indicators (
    year INT64,
    inflation_rate FLOAT64,
    gdp_growth FLOAT64,
    unemployment_rate FLOAT64
);
-- Rows: 44 (1980-2023)
-- Used by: Macro context in synthesis
```

#### Table 4: `stock_news` (News Sentiment - Optional)
```sql
CREATE TABLE market_volatility.stock_news (
    id STRING,
    headline STRING,
    sentiment STRING          -- "Positive", "Negative", "Neutral"
);
-- Rows: ~26,000
-- Used by: News volume as volatility indicator (if time permits)
```

#### Table 5: `fed_communications` (Event Calendar - Fed)
```sql
CREATE TABLE market_volatility.fed_communications (
    date DATE,                -- Meeting date
    release_date DATE,        -- Minutes release date
    type STRING,              -- "Minute", "Statement", etc.
    text STRING               -- Full text content
);
-- Source: communications.csv (65,019 rows)
-- Used by: Event calendar, upcoming Fed meetings
```

#### Table 6: `acquisitions` (Event Calendar - M&A)
```sql
CREATE TABLE market_volatility.acquisitions (
    id INT64,
    parent_company STRING,
    acquisition_year INT64,
    acquisition_month STRING,
    acquired_company STRING,
    business STRING,
    country STRING,
    acquisition_price FLOAT64,
    category STRING
);
-- Source: acquisitions_update_2021.csv (1,454 rows)
-- Used by: Event calendar, M&A events
```

#### Table 7: `analyst_ratings` (Analyst Rating Changes) ★NEW
```sql
CREATE TABLE market_volatility.analyst_ratings (
    id STRING,
    title STRING,               -- "B of A Securities Maintains Neutral on Agilent, Raises PT to $88"
    date DATE,
    stock STRING                -- Ticker symbol (e.g., "A", "AAPL", "MSFT")
);
-- Source: analyst_ratings_processed.csv (~5,000 rows)
-- Used by: Event calendar agent (rating changes as volatility catalysts)
-- Content: Analyst upgrades, downgrades, price target changes
```

#### Table 8: `speech_signals` (Earnings Call Sentiment) ★NEW
```sql
CREATE TABLE market_volatility.speech_signals (
    id STRING,
    symbol STRING,              -- AAPL, MSFT, NVDA, GOOGL, AMZN, AMD, INTC, CSCO, MU, ASML
    event STRING,               -- "Q3 2019 Earnings Call"
    transcript STRING,          -- Full text (truncated to 100KB)
    tone STRING,                -- "bullish", "bearish", "neutral"
    guidance STRING,            -- Forward-looking statements summary
    topics ARRAY<STRING>,       -- Key themes: ["AI", "margins", "growth"]
    risks ARRAY<STRING>,        -- Risk factors: ["supply chain", "competition"]
    processed_at TIMESTAMP
);
-- Source: earnings-call-transcripts/ (200 text files, processed via Gemini)
-- Used by: Speech signal agent
-- Companies: AAPL, AMD, AMZN, ASML, CSCO, GOOGL, INTC, MSFT, MU, NVDA
-- Period: 2016-2020 (these 10 companies = ~25-30% of S&P 500 weight)
```

### OUTPUT TABLES (2 Tables)

#### Table: `volatility_forecasts` (Main Output)
```sql
CREATE TABLE market_volatility.volatility_forecasts (
    id STRING,                          -- UUID
    symbol STRING,                      -- SPX, NDX, DJI, RUT
    forecast_date DATE,                 -- Date forecast was made
    -- Forecasts (6-hour scope: 1d and 5d only)
    volatility_1d FLOAT64,              -- 1-day forecast (annualized %)
    volatility_5d FLOAT64,              -- 5-day forecast (annualized %)
    -- Regime
    current_vix FLOAT64,                -- VIX at time of forecast
    volatility_regime STRING,           -- low, normal, elevated, extreme
    -- Confidence
    confidence FLOAT64,                 -- 0.0 to 1.0
    -- Metadata
    computed_at TIMESTAMP
);
```

#### Table: `alerts` (Simple Alerts Output)
```sql
CREATE TABLE market_volatility.alerts (
    id STRING,                          -- UUID
    alert_type STRING,                  -- "vix_elevated", "vix_extreme", "anomaly", "event_upcoming"
    severity STRING,                    -- "info", "warning", "critical"
    symbol STRING,                      -- SPX, NDX, etc. or NULL for market-wide
    message STRING,                     -- Human-readable alert message
    vix_value FLOAT64,                  -- VIX at time of alert (if applicable)
    triggered_at TIMESTAMP,
    is_active BOOLEAN                   -- TRUE if still active, FALSE if resolved
);
```

### VIX Alert Thresholds
| VIX Level | Regime | Alert Severity |
|-----------|--------|----------------|
| < 15 | LOW | No alert |
| 15-20 | NORMAL | No alert |
| 20-25 | ELEVATED | info |
| 25-30 | HIGH | warning |
| > 30 | EXTREME | critical |

---

## Layer 3: BigQuery Feature Queries

### Query 1: Current Volatility Metrics (Technical Agent)
```sql
-- Get latest VIX and calculate regime
SELECT
    date,
    vix AS current_vix,
    CASE
        WHEN vix < 15 THEN 'low'
        WHEN vix < 20 THEN 'normal'
        WHEN vix < 30 THEN 'elevated'
        ELSE 'extreme'
    END AS volatility_regime,
    -- 20-day historical volatility
    STDDEV(sp500_return) OVER (
        ORDER BY date
        ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
    ) * SQRT(252) * 100 AS historical_vol_20d,
    -- VIX percentile (where are we vs history)
    PERCENT_RANK() OVER (ORDER BY vix) * 100 AS vix_percentile
FROM market_volatility.market_30yr
ORDER BY date DESC
LIMIT 1;
```

### Query 2: Z-Score Anomaly Detection (Technical Agent)
```sql
-- Detect anomalies using z-score
WITH stats AS (
    SELECT
        symbol,
        AVG(close) AS avg_price,
        STDDEV(close) AS std_price,
        AVG(volume) AS avg_volume,
        STDDEV(volume) AS std_volume
    FROM market_volatility.index_data
    WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
    GROUP BY symbol
),
latest AS (
    SELECT symbol, close, volume, date
    FROM market_volatility.index_data
    WHERE date = (SELECT MAX(date) FROM market_volatility.index_data)
)
SELECT
    l.symbol,
    l.close,
    (l.close - s.avg_price) / NULLIF(s.std_price, 0) AS price_zscore,
    (l.volume - s.avg_volume) / NULLIF(s.std_volume, 0) AS volume_zscore,
    CASE
        WHEN ABS((l.close - s.avg_price) / NULLIF(s.std_price, 0)) > 2 THEN 'ANOMALY'
        ELSE 'NORMAL'
    END AS price_status,
    CASE
        WHEN ABS((l.volume - s.avg_volume) / NULLIF(s.std_volume, 0)) > 2 THEN 'ANOMALY'
        ELSE 'NORMAL'
    END AS volume_status
FROM latest l
JOIN stats s ON l.symbol = s.symbol;
```

### Query 3: Volatility Forecast Features (Synthesis Agent)
```sql
-- Features for volatility forecasting
SELECT
    -- Current state
    vix AS current_vix,
    -- Recent volatility trend
    AVG(vix) OVER (ORDER BY date ROWS BETWEEN 4 PRECEDING AND CURRENT ROW) AS vix_5d_avg,
    AVG(vix) OVER (ORDER BY date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS vix_20d_avg,
    -- VIX momentum
    vix - LAG(vix, 5) OVER (ORDER BY date) AS vix_5d_change,
    -- Historical volatility
    STDDEV(sp500_return) OVER (ORDER BY date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) * SQRT(252) * 100 AS realized_vol_20d,
    -- VIX term structure proxy (VIX vs recent avg)
    vix / NULLIF(AVG(vix) OVER (ORDER BY date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW), 0) AS vix_term_structure
FROM market_volatility.market_30yr
ORDER BY date DESC
LIMIT 1;
```

### Query 4: Event Calendar (Fed Meetings)
```sql
-- Get recent and upcoming Fed communications
SELECT DISTINCT
    date AS event_date,
    type AS event_type,
    'Fed FOMC' AS event_category,
    SUBSTR(text, 1, 200) AS summary
FROM market_volatility.fed_communications
WHERE type = 'Minute'
ORDER BY date DESC
LIMIT 10;
```

### Query 5: Alert Check (VIX Thresholds)
```sql
-- Check if VIX exceeds alert thresholds
SELECT
    date,
    vix,
    CASE
        WHEN vix > 30 THEN 'critical'
        WHEN vix > 25 THEN 'warning'
        WHEN vix > 20 THEN 'info'
        ELSE 'none'
    END AS alert_severity,
    CASE
        WHEN vix > 30 THEN 'EXTREME volatility detected - VIX above 30'
        WHEN vix > 25 THEN 'HIGH volatility - VIX above 25'
        WHEN vix > 20 THEN 'ELEVATED volatility - VIX above 20'
        ELSE 'Normal market conditions'
    END AS alert_message
FROM market_volatility.market_30yr
ORDER BY date DESC
LIMIT 1;
```

---

## Layer 4: ADK Agent Architecture

### Agent Hierarchy
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           AGENT HIERARCHY (8-HOUR SCOPE)                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  root_agent (Market Volatility Orchestrator)
  │
  ├── volatility_workflow (SequentialAgent) - 6 sub-agents
  │   │
  │   ├── technical_agent (LlmAgent)
  │   │   ├── Tool: BigQueryToolset (read-only)
  │   │   ├── Queries: market_30yr, index_data
  │   │   ├── Calculates: VIX level, z-scores, regime
  │   │   └── Output Key: technical_signals
  │   │
  │   ├── event_calendar_agent (LlmAgent)
  │   │   ├── Tool: BigQueryToolset (read-only)
  │   │   ├── Queries: fed_communications, acquisitions, analyst_ratings ★UPDATED
  │   │   ├── Retrieves: Fed meetings, M&A events, analyst rating changes
  │   │   └── Output Key: event_calendar
  │   │
  │   ├── speech_signal_agent (LlmAgent) ★NEW
  │   │   ├── Tool: BigQueryToolset (read-only)
  │   │   ├── Queries: speech_signals
  │   │   ├── Retrieves: Earnings call sentiment (bullish/bearish/neutral)
  │   │   ├── Companies: AAPL, AMD, AMZN, ASML, CSCO, GOOGL, INTC, MSFT, MU, NVDA
  │   │   └── Output Key: speech_signals
  │   │
  │   ├── volatility_synthesis_agent (LlmAgent)
  │   │   ├── Tool: FunctionTools (normalize, calculate)
  │   │   ├── Reads: {technical_signals}, {event_calendar}, {speech_signals} ★UPDATED
  │   │   ├── Generates: 1d and 5d volatility forecasts
  │   │   └── Output Key: volatility_forecasts
  │   │
  │   ├── alert_agent (LlmAgent)
  │   │   ├── Tool: FunctionTools (check_vix_threshold)
  │   │   ├── Reads: {technical_signals}, {volatility_forecasts}
  │   │   ├── Checks: VIX > 20 (info), > 25 (warning), > 30 (critical)
  │   │   └── Output Key: alerts
  │   │
  │   └── persistence_agent (LlmAgent)
  │       ├── Tool: BigQueryToolset (write)
  │       ├── Reads: {volatility_forecasts}, {alerts}
  │       └── Writes to: volatility_forecasts, alerts tables
  │
  └── chat_agent (LlmAgent)
      ├── Tool: google_search (for additional context)
      ├── Answers: "Why is volatility high?" questions
      └── Uses: Session state for context
```

### Session State Flow
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SESSION STATE FLOW                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  technical_agent
       │
       │ output_key: "technical_signals"
       │ {current_vix, regime, anomalies, historical_vol}
       ▼
  event_calendar_agent
       │
       │ output_key: "event_calendar"
       │ {fed_meetings, mna_events, analyst_ratings, upcoming_events} ★UPDATED
       ▼
  speech_signal_agent ★NEW
       │
       │ output_key: "speech_signals"
       │ {earnings: [{symbol, tone, guidance, topics, risks}], aggregate_sentiment}
       ▼
  volatility_synthesis_agent
       │
       │ reads: {technical_signals}, {event_calendar}, {speech_signals} ★UPDATED
       │ output_key: "volatility_forecasts"
       │ {forecasts: [{symbol, 1d, 5d, confidence}], regime, vix}
       ▼
  alert_agent
       │
       │ reads: {technical_signals}, {volatility_forecasts}
       │ output_key: "alerts"
       │ {alerts: [{type, severity, message}], has_critical, has_warning}
       ▼
  persistence_agent
       │
       │ reads: {volatility_forecasts}, {alerts}
       └──▶ BigQuery: volatility_forecasts, alerts tables
```

### Orchestration Agents

| Agent | Type | Purpose |
|-------|------|---------|
| **market_signal_orchestrator** | LlmAgent (Root) | Coordinates all sub-agents, handles user queries |
| **sequential_analysis** | SequentialAgent | Runs the full analysis pipeline in order |
| **parallel_data_fetch** | ParallelAgent | Fetches data from 3 agents concurrently |

### Data Collection Agents (Phase 1 - Parallel)

| Agent | Input Data Source | Output Key | Purpose |
|-------|-------------------|------------|---------|
| **technical_agent** | market_30yr_v, index_data_v | `technical_signals` | VIX level, regime, z-score anomalies |
| **event_calendar_agent** | fed_communications_v, acquisitions, analyst_ratings | `event_calendar` | Fed meetings, M&A, analyst ratings |
| **speech_signal_agent** | speech_signals table | `speech_signals` | Earnings call sentiment (tone, guidance, risks) |

### Processing Agents (Phase 2 - Sequential)

| Agent | Input Data Source | Output Key | Purpose |
|-------|-------------------|------------|---------|
| **synthesis_agent** | technical_signals, event_calendar, speech_signals (session state) | `volatility_forecasts` | Generate 1d/5d volatility forecasts |
| **alert_agent** | technical_signals, volatility_forecasts (session state) | `alerts` | Check VIX thresholds, generate alerts |
| **persistence_agent** | volatility_forecasts, alerts (session state) | `persistence_result` | Write to BigQuery tables |

---

## Layer 5: REST API Endpoints

### API Structure
```
apps/web/app/api/volatility/
├── forecasts/route.ts    # GET /api/volatility/forecasts
├── alerts/route.ts       # GET /api/volatility/alerts
├── events/route.ts       # GET /api/volatility/events
└── refresh/route.ts      # POST /api/volatility/refresh
```

### Endpoint Details

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/api/volatility/forecasts` | Get latest volatility forecasts | `{regime, vix_current, forecasts[]}` |
| GET | `/api/volatility/alerts` | Get active alerts | `{alerts[], has_critical, count}` |
| GET | `/api/volatility/events` | Get event calendar | `{fed_meetings[], upcoming_events[]}` |
| POST | `/api/volatility/refresh` | Trigger forecast refresh | `{status: "refreshing"}` |

---

## Layer 6: Dashboard UI (3-Panel Layout)

### 3-Panel Layout Structure
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           3-PANEL LAYOUT (PRESERVED)                                     │
├──────────────┬───────────────────────────────────────────────────┬──────────────────────┤
│              │                                                   │                      │
│   SIDEBAR    │         VOLATILITY DASHBOARD (Main)               │    CHAT + ALERTS     │
│   (Panel 1)  │                (Panel 2)                          │      (Panel 3)       │
│              │                                                   │                      │
│  AppSidebar  │   VolatilityDashboard.tsx                        │   ChatPanel.tsx      │
│  (unchanged) │                                                   │   (reuse existing)   │
│              │   ┌─────────────────────────────────────────┐   │                      │
│  ┌────────┐  │   │  RegimeIndicator                        │   │   ┌──────────────┐   │
│  │New Chat│  │   │  Regime: ELEVATED    VIX: 24.5         │   │   │ ALERTS (2)   │   │
│  │History │  │   │  ████████████░░░░    78th %ile         │   │   │ ⚠ VIX > 25   │   │
│  │────────│  │   └─────────────────────────────────────────┘   │   │ ℹ Anomaly    │   │
│  │Volatil.│  │                                                   │   └──────────────┘   │
│  │Profile │  │   ┌─────────────────────────────────────────┐   │                      │
│  │Settings│  │   │  ForecastTable                          │   │   ┌──────────────┐   │
│  └────────┘  │   │  SPX | 12.5% | 14.2% | 82%             │   │   │ Volatility   │   │
│              │   │  NDX | 15.2% | 17.1% | 78%             │   │   │ Assistant    │   │
│              │   │  DJI | 10.1% | 11.8% | 85%             │   │   │              │   │
│              │   │  RUT | 18.3% | 20.5% | 74%             │   │   │ "Why is VIX  │   │
│              │   └─────────────────────────────────────────┘   │   │  elevated?"  │   │
│              │                                                   │   │              │   │
│              │   ┌─────────────────────────────────────────┐   │   │ Agent:       │   │
│              │   │  EventCalendar (Recent Fed Meetings)     │   │   │ Based on...  │   │
│              │   │  Oct 29: FOMC Minute released           │   │   │              │   │
│              │   │  Sep 18: FOMC Meeting                   │   │   │ [Input]      │   │
│              │   └─────────────────────────────────────────┘   │   └──────────────┘   │
│              │                                                   │                      │
│              │   ┌─────────────────────────────────────────┐   │   Collapsible       │
│              │   │  AnomalyList                             │   │   (can hide)        │
│              │   │  🔴 SPX Volume: 2.3σ above average      │   │                      │
│              │   │  🟡 VIX: Elevated but stable            │   │                      │
│              │   └─────────────────────────────────────────┘   │                      │
│              │                                                   │                      │
└──────────────┴───────────────────────────────────────────────────┴──────────────────────┘
```

### Volatility Dashboard Panel (Panel 2 Detail)
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  MARKET VOLATILITY FORECAST                                              [⟳ Refresh]   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐│
│  │                         VOLATILITY REGIME                                            ││
│  │  ══════════════════════════════════════════════════════════════════════════════════ ││
│  │                                                                                      ││
│  │    Current Regime: ELEVATED                    VIX: 24.5 (+2.3 today)              ││
│  │                                                                                      ││
│  │    ████████████████████████████░░░░░░░░░░      78th Percentile                      ││
│  │    |         |         |         |         |                                         ││
│  │   LOW      NORMAL   ELEVATED   EXTREME                                              ││
│  │   (<15)    (15-20)   (20-30)    (>30)                                               ││
│  │                                                                                      ││
│  └─────────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐│
│  │                       VOLATILITY FORECASTS                                           ││
│  │  ────────────────────────────────────────────────────────────────────────────────── ││
│  │                                                                                      ││
│  │   Symbol    │    1-Day Forecast    │    5-Day Forecast    │    Confidence           ││
│  │   ──────────┼──────────────────────┼──────────────────────┼─────────────────────    ││
│  │   SPX       │       12.5%          │       14.2%          │    ████████░░  82%      ││
│  │   NDX       │       15.2%          │       17.1%          │    ███████░░░  78%      ││
│  │   DJI       │       10.1%          │       11.8%          │    █████████░  85%      ││
│  │   RUT       │       18.3%          │       20.5%          │    ███████░░░  74%      ││
│  │                                                                                      ││
│  │   Last Updated: 2024-01-29 14:30:00 UTC                                             ││
│  │                                                                                      ││
│  └─────────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐│
│  │                       ANOMALIES DETECTED                                             ││
│  │  ────────────────────────────────────────────────────────────────────────────────── ││
│  │                                                                                      ││
│  │   🔴  SPX Volume: 2.3σ above average (unusual activity)                             ││
│  │   🟡  VIX: Elevated but stable (no sudden spikes)                                   ││
│  │   🟢  NDX: Normal trading patterns                                                   ││
│  │                                                                                      ││
│  └─────────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### React Components Structure
```
apps/web/components/volatility/
├── VolatilityDashboard.tsx      # Main container (Panel 2)
├── RegimeIndicator.tsx          # Regime bar with VIX
├── ForecastTable.tsx            # Symbol/1d/5d/Confidence table
├── EventCalendar.tsx            # Fed meetings, M&A events
├── AnomalyList.tsx              # Z-score anomalies display
├── AlertsPanel.tsx              # VIX threshold alerts (in Panel 3)
└── ApiPreview.tsx               # API endpoint preview (optional)
```

---

## Layer 7: Deployment Architecture

### GCP Resources
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              GCP DEPLOYMENT                                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────┐      ┌──────────────────┐
  │  Cloud Storage   │      │    BigQuery      │
  │  (GCS Bucket)    │      │   (Dataset)      │
  │                  │      │                  │
  │  gs://[PROJECT]- │      │ market_volatility│
  │  market-vol-data │      │ - market_30yr    │
  └──────────────────┘      │ - index_data     │
                            │ - fed_comms      │
                            │ - acquisitions   │
                            │ - vol_forecasts  │
                            │ - alerts         │
                            └──────────────────┘
                                    │
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         │                                                      │
         ▼                                                      ▼
  ┌──────────────────┐                               ┌──────────────────┐
  │   Cloud Run      │                               │   Cloud Run      │
  │   (ADK Agent)    │◀──────── REST ───────────────▶│   (Next.js)      │
  │                  │                               │                  │
  │ market-volatility│                               │ market-vol-web   │
  │ -agent           │                               │                  │
  └──────────────────┘                               └──────────────────┘
         │                                                      │
         │                                                      │
         └──────────────────────┬───────────────────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │    User Browser  │
                        │                  │
                        │  Dashboard UI    │
                        └──────────────────┘
```

### Deployment Commands

#### ADK Agent
```bash
cd apps/market-signal-agent
gcloud run deploy market-signal-agent \
    --source . \
    --region us-central1 \
    --allow-unauthenticated
```

#### Frontend
```bash
cd apps/web
gcloud run deploy market-signal-web \
    --source . \
    --region us-central1 \
    --allow-unauthenticated
```

---

## File Structure Summary

### ADK Agent Files
```
apps/market-signal-agent/
├── market_signal_agent/
│   ├── __init__.py
│   ├── agent.py                    # Root orchestrator
│   ├── config.py                   # VIX thresholds, BigQuery config
│   ├── models.py                   # Pydantic models
│   ├── sub_agents/
│   │   ├── technical_agent/
│   │   │   └── agent.py            # VIX, z-score analysis
│   │   ├── event_calendar_agent/
│   │   │   └── agent.py            # Fed meetings, M&A events, analyst ratings ★UPDATED
│   │   ├── speech_signal_agent/    ★NEW
│   │   │   └── agent.py            # Earnings call sentiment analysis
│   │   ├── synthesis_agent/
│   │   │   └── agent.py            # Volatility forecasting
│   │   ├── alert_agent/
│   │   │   └── agent.py            # VIX threshold alerts
│   │   └── persistence_agent/
│   │       └── agent.py            # BigQuery writes
│   └── tools/
│       └── bigquery_tools.py       # BigQuery toolset
├── scripts/
│   └── process_transcripts.py      # Batch process earnings transcripts ★NEW
├── pyproject.toml
└── Dockerfile
```

### Frontend Files
```
apps/web/
├── app/
│   ├── (protected)/
│   │   └── volatility/
│   │       └── page.tsx            # Volatility dashboard page
│   └── api/
│       └── volatility/
│           ├── forecasts/route.ts  # GET forecasts
│           ├── alerts/route.ts     # GET alerts
│           ├── events/route.ts     # GET event calendar
│           └── refresh/route.ts    # POST refresh
└── components/
    └── volatility/
        ├── VolatilityDashboard.tsx # Main container
        ├── RegimeIndicator.tsx     # VIX regime bar
        ├── ForecastTable.tsx       # 1d/5d forecasts
        ├── EventCalendar.tsx       # Fed meetings
        ├── AnomalyList.tsx         # Z-score anomalies
        └── AlertsPanel.tsx         # VIX alerts
```

---

## Session State Flow Explained

In Google ADK, agents communicate through **session state** - a shared dictionary that persists across agent calls. Here's how it works:

### The Pattern: `output_key` -> `{placeholder}`

Each agent has an `output_key` parameter that specifies where its output gets stored in session state. Other agents can read this value using `{placeholder}` syntax in their instructions.

---

### Phase 1 Agents (Data Collection)

```
┌──────────────────────┐
│   technical_agent    │  Queries: market_30yr_v, index_data_v
│   output_key:        │
│   "technical_signals"│──────► session["technical_signals"] = {
└──────────────────────┘           "current_vix": 24.5,
                                   "volatility_regime": "elevated",
                                   "historical_vol_20d": 18.2,
                                   "anomalies": [...]
                                 }

┌──────────────────────┐
│ event_calendar_agent │  Queries: fed_communications_v, acquisitions, analyst_ratings
│   output_key:        │
│   "event_calendar"   │──────► session["event_calendar"] = {
└──────────────────────┘           "fed_meetings": [...],
                                   "mna_events": [...],
                                   "analyst_ratings": [...],
                                   "upcoming_high_impact": true
                                 }

┌──────────────────────┐
│ speech_signal_agent  │  Queries: speech_signals (earnings transcripts)
│   output_key:        │
│   "speech_signals"   │──────► session["speech_signals"] = {
└──────────────────────┘           "earnings": [{symbol, tone, guidance, risks}],
                                   "aggregate_sentiment": "mixed"
                                 }
```

---

### Phase 2 Agents (Processing)

**Synthesis Agent** - Reads 3 inputs, produces forecasts:
```
session["technical_signals"]  ──┐
session["event_calendar"]     ──┼──► synthesis_agent reads {technical_signals},
session["speech_signals"]     ──┘    {event_calendar}, {speech_signals}
                                              │
                                              ▼
                                     session["volatility_forecasts"] = {
                                       "forecasts": [
                                         {symbol: "SPX", volatility_1d: 12.5, ...},
                                         {symbol: "NDX", volatility_1d: 14.4, ...}
                                       ],
                                       "regime": "elevated",
                                       "current_vix": 24.5
                                     }
```

**Alert Agent** - Checks thresholds:
```
session["technical_signals"]     ──┐
session["volatility_forecasts"]  ──┼──► alert_agent reads {technical_signals},
                                   │    {volatility_forecasts}
                                   ▼
                                  session["alerts"] = {
                                    "alerts": [
                                      {type: "vix_elevated", severity: "warning", ...}
                                    ],
                                    "has_critical": false,
                                    "alert_count": 1
                                  }
```

**Persistence Agent** - Writes to BigQuery:
```
session["volatility_forecasts"]  ──┐
session["alerts"]                ──┼──► persistence_agent reads {volatility_forecasts},
                                   │    {alerts}
                                   ▼
                                  INSERT INTO BigQuery tables
                                  session["persistence_result"] = {
                                    "forecasts_inserted": 4,
                                    "alerts_inserted": 1,
                                    "success": true
                                  }
```

---

### SequentialAgent Workflow (Phase 3)

The `SequentialAgent` runs agents in order, accumulating session state:
```python
volatility_workflow = SequentialAgent(
    name="volatility_workflow",
    sub_agents=[
        technical_agent,        # 1. Collects VIX, z-scores
        event_calendar_agent,   # 2. Collects Fed meetings, M&A
        speech_signal_agent,    # 3. Collects earnings sentiment
        synthesis_agent,        # 4. Generates forecasts (reads 1,2,3)
        alert_agent,            # 5. Checks thresholds (reads 1,4)
        persistence_agent,      # 6. Writes to BigQuery (reads 4,5)
    ]
)
```

Each agent runs in sequence, and the session state accumulates data as it flows through the pipeline:

```
Step 1: technical_agent runs
        └── session["technical_signals"] = {...}

Step 2: event_calendar_agent runs
        └── session["event_calendar"] = {...}

Step 3: speech_signal_agent runs
        └── session["speech_signals"] = {...}

Step 4: synthesis_agent runs (reads steps 1,2,3)
        └── session["volatility_forecasts"] = {...}

Step 5: alert_agent runs (reads steps 1,4)
        └── session["alerts"] = {...}

Step 6: persistence_agent runs (reads steps 4,5)
        └── session["persistence_result"] = {...}
        └── BigQuery tables updated
```

### Key Points

1. **`output_key`**: Defines where agent output is stored in session state
2. **`{placeholder}`**: In agent instructions, references session state values
3. **SequentialAgent**: Ensures agents run in order so dependencies are satisfied
4. **Session State**: Persists across all agent calls in the workflow

---

## REST API Documentation

This section documents the REST API endpoints that serve data from BigQuery to the dashboard.

### API Base URL
- **Local Development:** `http://localhost:3000/api/volatility`
- **Production:** `https://[CLOUD_RUN_URL]/api/volatility`

### Endpoints Overview

| Method | Endpoint | Description | Data Source |
|--------|----------|-------------|-------------|
| GET | `/api/volatility/metrics` | Current VIX level, regime, and percentile | BigQuery: `market_30yr_v` |
| GET | `/api/volatility/forecasts` | Volatility forecasts for all indices | BigQuery: `market_30yr_v` + calculation |
| GET | `/api/volatility/anomalies` | Z-score anomalies for all indices | BigQuery: `index_data_v` |
| GET | `/api/volatility/events` | Event calendar (Fed, M&A, ratings) | BigQuery: Multiple tables |
| GET | `/api/volatility/alerts` | Active alerts based on thresholds | Computed from metrics + anomalies |

---

### 1. GET `/api/volatility/metrics`

**Description:** Returns the current VIX level, volatility regime classification, historical percentile, and 20-day realized volatility. This is the primary endpoint for understanding current market conditions.

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `data_date` | string | Date of the data (YYYY-MM-DD) |
| `current_vix` | number | Current VIX index value |
| `vix_change` | number | Change from previous day |
| `vix_percentile` | number | Percentile rank vs 30-year history (0-100) |
| `regime` | string | Volatility regime: `low`, `normal`, `elevated`, `extreme` |
| `historical_vol_20d` | number | 20-day realized volatility (annualized %) |

**Sample Response:**
```json
{
  "data_date": "2023-12-29",
  "current_vix": 12.89,
  "vix_change": -0.32,
  "vix_percentile": 17.2,
  "regime": "low",
  "historical_vol_20d": 11.45
}
```

**Regime Thresholds:**
| VIX Range | Regime |
|-----------|--------|
| < 15 | `low` |
| 15-20 | `normal` |
| 20-30 | `elevated` |
| > 30 | `extreme` |

---

### 2. GET `/api/volatility/forecasts`

**Description:** Returns calculated volatility forecasts for major indices (SPX, NDX, DJI, RUT). Forecasts use the current VIX and historical volatility with index-specific multipliers.

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `data_date` | string | Date of the underlying data |
| `current_vix` | number | Current VIX used in calculation |
| `regime` | string | Current volatility regime |
| `forecasts` | array | Array of forecast objects per index |
| `forecasts[].symbol` | string | Index symbol (SPX, NDX, DJI, RUT) |
| `forecasts[].volatility_1d` | number | 1-day volatility forecast (%) |
| `forecasts[].volatility_5d` | number | 5-day volatility forecast (%) |
| `forecasts[].confidence` | number | Forecast confidence (0.0-1.0) |

**Sample Response:**
```json
{
  "data_date": "2023-12-29",
  "current_vix": 12.89,
  "regime": "low",
  "forecasts": [
    {
      "symbol": "SPX",
      "volatility_1d": 12.9,
      "volatility_5d": 12.6,
      "confidence": 0.90
    },
    {
      "symbol": "NDX",
      "volatility_1d": 14.8,
      "volatility_5d": 14.5,
      "confidence": 0.87
    },
    {
      "symbol": "DJI",
      "volatility_1d": 12.2,
      "volatility_5d": 12.0,
      "confidence": 0.92
    },
    {
      "symbol": "RUT",
      "volatility_1d": 17.4,
      "volatility_5d": 17.0,
      "confidence": 0.85
    }
  ]
}
```

**Index Multipliers:**
| Index | Multiplier | Reasoning |
|-------|------------|-----------|
| SPX | 1.00x | Baseline (S&P 500) |
| NDX | 1.15x | Tech sector premium |
| DJI | 0.95x | Blue-chip discount |
| RUT | 1.35x | Small-cap premium |

---

### 3. GET `/api/volatility/anomalies`

**Description:** Returns z-score anomaly detection results for price and volume across all tracked indices. Anomalies are detected when z-score exceeds ±2.0 standard deviations from the 90-day average.

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `anomalies` | array | Array of anomaly objects |
| `anomalies[].symbol` | string | Index symbol |
| `anomalies[].date` | string | Date of observation |
| `anomalies[].close_price` | number | Closing price |
| `anomalies[].price_zscore` | number | Price z-score (std deviations from mean) |
| `anomalies[].volume_zscore` | number | Volume z-score |
| `anomalies[].price_status` | string | `ANOMALY` or `NORMAL` |
| `anomalies[].volume_status` | string | `ANOMALY` or `NORMAL` |

**Sample Response:**
```json
{
  "anomalies": [
    {
      "symbol": "N225",
      "date": "2023-12-29",
      "close_price": 33464.17,
      "price_zscore": -0.06,
      "volume_zscore": -3.39,
      "price_status": "NORMAL",
      "volume_status": "ANOMALY"
    },
    {
      "symbol": "SPX",
      "date": "2023-12-29",
      "close_price": 4769.83,
      "price_zscore": 1.45,
      "volume_zscore": 0.82,
      "price_status": "NORMAL",
      "volume_status": "NORMAL"
    },
    {
      "symbol": "NDX",
      "date": "2023-12-29",
      "close_price": 16825.93,
      "price_zscore": 1.23,
      "volume_zscore": 0.54,
      "price_status": "NORMAL",
      "volume_status": "NORMAL"
    }
  ]
}
```

---

### 4. GET `/api/volatility/events`

**Description:** Returns the event calendar containing Fed communications, analyst rating changes, and M&A events. Each category is fetched independently, so partial data is returned even if one table fails.

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `fed_meetings` | array | Recent Fed FOMC communications |
| `fed_meetings[].date` | string | Meeting/statement date |
| `fed_meetings[].release_date` | string | Minutes release date (if applicable) |
| `fed_meetings[].type` | string | Type: `Minutes`, `Statement` |
| `fed_meetings[].summary` | string | First 200 chars of text |
| `analyst_ratings` | array | Recent analyst rating changes |
| `analyst_ratings[].date` | string | Rating date |
| `analyst_ratings[].title` | string | Full rating headline |
| `analyst_ratings[].stock` | string | Ticker symbol |
| `mna_events` | array | Major M&A transactions |
| `mna_events[].year` | number | Acquisition year |
| `mna_events[].month` | string | Acquisition month |
| `mna_events[].parent_company` | string | Acquiring company |
| `mna_events[].acquired_company` | string | Target company |
| `mna_events[].price` | number | Deal value (USD) |
| `mna_events[].category` | string | Industry category |

**Sample Response:**
```json
{
  "fed_meetings": [
    {
      "date": "2023-11-01",
      "release_date": "2023-11-21",
      "type": "Minutes",
      "summary": "The Federal Open Market Committee voted to maintain the federal funds rate..."
    },
    {
      "date": "2023-09-20",
      "release_date": "2023-10-11",
      "type": "Minutes",
      "summary": "Participants noted that inflation remained elevated but showed signs..."
    }
  ],
  "analyst_ratings": [
    {
      "date": "2023-12-28",
      "title": "Morgan Stanley Upgrades NVDA to Overweight, PT $650",
      "stock": "NVDA"
    },
    {
      "date": "2023-12-27",
      "title": "Goldman Sachs Maintains Buy on AAPL, Raises PT to $210",
      "stock": "AAPL"
    }
  ],
  "mna_events": [
    {
      "year": 2023,
      "month": "October",
      "parent_company": "Microsoft",
      "acquired_company": "Activision Blizzard",
      "price": 68700000000,
      "category": "Gaming"
    },
    {
      "year": 2022,
      "month": "April",
      "parent_company": "Elon Musk",
      "acquired_company": "Twitter",
      "price": 44000000000,
      "category": "Social Media"
    }
  ]
}
```

---

### 5. GET `/api/volatility/alerts`

**Description:** Returns currently active alerts based on VIX thresholds and detected anomalies. Alerts are generated dynamically by evaluating current metrics against predefined thresholds.

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `alerts` | array | Array of active alert objects |
| `alerts[].id` | string | Unique alert identifier |
| `alerts[].alert_type` | string | Type: `vix_extreme`, `vix_high`, `vix_elevated`, `price_anomaly`, `volume_anomaly` |
| `alerts[].severity` | string | Severity: `critical`, `warning`, `info` |
| `alerts[].symbol` | string | Affected symbol (null for market-wide) |
| `alerts[].message` | string | Human-readable alert message |
| `alerts[].vix_value` | number | VIX value at trigger (if applicable) |
| `alerts[].triggered_at` | string | ISO timestamp |
| `has_critical` | boolean | True if any critical alerts exist |
| `has_warning` | boolean | True if any warning alerts exist |

**Sample Response (Low Volatility - No VIX Alerts):**
```json
{
  "alerts": [
    {
      "id": "anomaly-volume-N225-1703894400000",
      "alert_type": "volume_anomaly",
      "severity": "info",
      "symbol": "N225",
      "message": "N225 volume anomaly: 3.4σ below average",
      "vix_value": null,
      "triggered_at": "2023-12-29T18:30:00.000Z"
    }
  ],
  "has_critical": false,
  "has_warning": false
}
```

**Sample Response (Elevated Volatility):**
```json
{
  "alerts": [
    {
      "id": "vix-warning-1703894400000",
      "alert_type": "vix_high",
      "severity": "warning",
      "symbol": null,
      "message": "HIGH volatility - VIX at 26.5, above 25",
      "vix_value": 26.5,
      "triggered_at": "2023-12-29T18:30:00.000Z"
    },
    {
      "id": "anomaly-price-SPX-1703894400001",
      "alert_type": "price_anomaly",
      "severity": "info",
      "symbol": "SPX",
      "message": "SPX price anomaly: 2.3σ below average",
      "vix_value": null,
      "triggered_at": "2023-12-29T18:30:00.000Z"
    }
  ],
  "has_critical": false,
  "has_warning": true
}
```

**Alert Thresholds:**
| VIX Level | Alert Type | Severity |
|-----------|------------|----------|
| > 30 | `vix_extreme` | `critical` |
| 25-30 | `vix_high` | `warning` |
| 20-25 | `vix_elevated` | `info` |
| < 20 | (no VIX alert) | - |
| Z-score > 2.0 | `price_anomaly` / `volume_anomaly` | `info` |

---

### Error Responses

All endpoints return a consistent error format when something goes wrong:

**Error Response Format:**
```json
{
  "error": "Failed to fetch [resource]",
  "details": "Specific error message (optional)"
}
```

**HTTP Status Codes:**
| Status | Meaning |
|--------|---------|
| 200 | Success |
| 500 | Server error (BigQuery connection, query failure) |

**Sample Error Response:**
```json
{
  "error": "Failed to fetch volatility metrics",
  "details": "BigQuery request failed: Table not found"
}
```

---

### Using the API

**Frontend Integration Example:**
```typescript
// Fetch all dashboard data in parallel
const [metrics, forecasts, anomalies] = await Promise.all([
  fetch("/api/volatility/metrics").then(r => r.json()),
  fetch("/api/volatility/forecasts").then(r => r.json()),
  fetch("/api/volatility/anomalies").then(r => r.json()),
]);

// Display current regime
console.log(`VIX: ${metrics.current_vix} | Regime: ${metrics.regime}`);

// Display forecasts
forecasts.forecasts.forEach(f => {
  console.log(`${f.symbol}: ${f.volatility_1d}% (1d), ${f.confidence * 100}% confidence`);
});
```

**cURL Examples:**
```bash
# Get current VIX metrics
curl http://localhost:3000/api/volatility/metrics

# Get forecasts
curl http://localhost:3000/api/volatility/forecasts

# Get event calendar
curl http://localhost:3000/api/volatility/events

# Get alerts
curl http://localhost:3000/api/volatility/alerts
```
