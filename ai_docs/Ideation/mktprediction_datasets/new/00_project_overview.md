# Market Volatility Prediction Agent - Project Overview

**Project Type:** Google ADK Multi-Agent Platform
**Created:** December 2024
**Estimated Total Time:** 8-9 hours
**Base Template:** Traffic Anomaly Agent (existing in `apps/traffic-anomaly-agent/`)

---

## Executive Summary

Build a **Market Volatility Prediction System** that forecasts volatility using multiple data sources:
- **Technical Signals**: VIX analysis, z-score anomaly detection on indices
- **Event Calendar**: Fed FOMC meetings, M&A events, analyst rating changes
- **Speech Signals**: Earnings call sentiment from 10 major tech companies (2016-2020)

Exposed via **ADK multi-agent architecture** with **Next.js 3-pane dashboard UI**.

> **IMPORTANT:** If anything is unclear during implementation, **ask questions before proceeding**. It's better to clarify requirements upfront than to build the wrong thing.

---

## Hackathon Theme Alignment

**Theme:** "AI ML Power - Building Low-Latency ML Pipeline That Extracts Signals From Multi-Source Time Series Data"

**How We Address It:**
1. **Multi-Source**: Market data, Fed communications, M&A events, analyst ratings, earnings transcripts
2. **Time Series**: 30 years of VIX/market data, event calendars, historical transcripts
3. **Signal Extraction**: VIX regime detection, z-score anomalies, sentiment analysis
4. **Low-Latency**: Pre-processed data in BigQuery, sequential agent execution
5. **ML Pipeline**: BigQuery queries, Gemini transcript processing, volatility forecasting

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE SYSTEM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                              FRONTEND LAYER                                  ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             ││
│  │  │   Dashboard     │  │  Volatility     │  │   Chat +        │             ││
│  │  │   (Sidebar)     │  │  Forecasts      │  │   Alerts Panel  │             ││
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             ││
│  │           └───────────────────┬┴───────────────────┬┘                       ││
│  │                               ▼                                              ││
│  │                    ┌─────────────────────┐                                  ││
│  │                    │   Next.js API       │                                  ││
│  │                    │   /api/volatility/* │                                  ││
│  │                    └──────────┬──────────┘                                  ││
│  └───────────────────────────────┼──────────────────────────────────────────────┘│
│                                  │                                               │
│  ┌───────────────────────────────┼──────────────────────────────────────────────┐│
│  │                         ADK AGENT LAYER                                      ││
│  │                               ▼                                              ││
│  │           ┌───────────────────────────────────────┐                         ││
│  │           │      Root Orchestrator Agent          │                         ││
│  │           │   • Intent detection & routing        │                         ││
│  │           │   • Session state management          │                         ││
│  │           └───────────────────┬───────────────────┘                         ││
│  │                               │                                              ││
│  │                     ┌─────────┴─────────┐                                   ││
│  │                     ▼                   ▼                                   ││
│  │        ┌──────────────────────┐ ┌──────────────────┐                       ││
│  │        │ volatility_workflow  │ │   chat_agent     │                       ││
│  │        │ (SequentialAgent)    │ │   (Q&A)          │                       ││
│  │        │   6 sub-agents       │ │                  │                       ││
│  │        └──────────────────────┘ └──────────────────┘                       ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
│                                  │                                               │
│  ┌───────────────────────────────┼──────────────────────────────────────────────┐│
│  │                         DATA LAYER                                           ││
│  │                               │                                              ││
│  │     ┌─────────────────────────┼─────────────────────────┐                   ││
│  │     ▼                         ▼                         ▼                   ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             ││
│  │  │   Cloud Storage │  │   BigQuery      │  │   Supabase      │             ││
│  │  │   • Raw CSVs    │  │   • 8 input     │  │   • Auth        │             ││
│  │  │   • Transcripts │  │   • 2 output    │  │   • Sessions    │             ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## UI Design: 3-Panel Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           3-PANEL LAYOUT                                                 │
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
│              │   │  EventCalendar (Fed + M&A + Ratings)    │   │   │ Based on...  │   │
│              │   │  Oct 29: FOMC Minute released           │   │   │              │   │
│              │   │  Sep 18: Analyst downgrade - NVDA       │   │   │ [Input]      │   │
│              │   └─────────────────────────────────────────┘   │   └──────────────┘   │
│              │                                                   │                      │
│              │   ┌─────────────────────────────────────────┐   │                      │
│              │   │  AnomalyList                             │   │                      │
│              │   │  🔴 SPX Volume: 2.3σ above average      │   │                      │
│              │   │  🟡 VIX: Elevated but stable            │   │                      │
│              │   └─────────────────────────────────────────┘   │                      │
│              │                                                   │                      │
└──────────────┴───────────────────────────────────────────────────┴──────────────────────┘
```

---

## Services Stack

### Google Cloud Services

| Service | Purpose | Cost Estimate |
|---------|---------|---------------|
| **Google ADK** | Multi-agent orchestration | Free (open source) |
| **Vertex AI / Gemini** | LLM reasoning + transcript processing | ~$5-10 |
| **BigQuery** | Market data, forecasts, alerts | ~$5 (free tier covers most) |
| **Cloud Storage (GCS)** | Raw CSV files + transcripts | ~$1 |
| **Cloud Run** | ADK Agent + Frontend deployment | ~$5-10 |

### Supabase Services

| Service | Purpose |
|---------|---------|
| **Supabase Auth** | Google Sign-In authentication |
| **Supabase Postgres** | ADK session tables (auto-created) |

**Total Budget:** ~$20-30

---

## Data Sources

| Source | Type | Rows | Purpose |
|--------|------|------|---------|
| **market_30yr** | Market | 7,754 | VIX, indices, commodities (PRIMARY) |
| **index_data** | Market | 112,457 | OHLCV for z-score calculation |
| **fed_communications** | Events | 65,019 | Fed FOMC meetings calendar |
| **acquisitions** | Events | 1,454 | M&A event calendar |
| **analyst_ratings** | Events | ~5,000 | Analyst upgrades/downgrades |
| **speech_signals** | Speech | ~200 | Earnings call sentiment (Gemini processed) |
| **economic_indicators** | Macro | 44 | GDP, inflation, unemployment |
| **stock_news** | News | 26,000 | News sentiment (optional) |

**Earnings Transcript Companies:** AAPL, AMD, AMZN, ASML, CSCO, GOOGL, INTC, MSFT, MU, NVDA (2016-2020)

---

## Agent Architecture

### Agent Hierarchy

```
market_signal_orchestrator (Root LlmAgent)
│
└── sequential_analysis (SequentialAgent)
        │
        ├── [PHASE 1: PARALLEL DATA FETCH]
        │   parallel_data_fetch (ParallelAgent)
        │       ├── technical_agent        → technical_signals
        │       ├── event_calendar_agent   → event_calendar
        │       └── speech_signal_agent    → speech_signals
        │
        └── [PHASE 2: SEQUENTIAL PROCESSING]
            ├── synthesis_agent            → volatility_forecasts
            ├── alert_agent                → alerts
            └── persistence_agent          → BigQuery writes
```

### Orchestration Agents

| Agent | Type | Purpose |
|-------|------|---------|
| **market_signal_orchestrator** | LlmAgent (Root) | Coordinates all sub-agents, handles user queries |
| **sequential_analysis** | SequentialAgent | Runs the full analysis pipeline in order |
| **parallel_data_fetch** | ParallelAgent | Fetches data from 3 agents concurrently |

### Data Collection Agents (Phase 1 - Parallel)

| Agent | Input Data Sources | Output Key | Purpose |
|-------|-------------------|------------|---------|
| **technical_agent** | market_30yr_v, index_data_v | `technical_signals` | VIX level, regime, z-score anomalies |
| **event_calendar_agent** | fed_communications_v, acquisitions, analyst_ratings | `event_calendar` | Fed meetings, M&A, analyst ratings |
| **speech_signal_agent** | speech_signals (BQ table) | `speech_signals` | Earnings call sentiment (tone, guidance, risks) |

### Processing Agents (Phase 2 - Sequential)

| Agent | Input Data Sources | Output Key | Purpose |
|-------|-------------------|------------|---------|
| **synthesis_agent** | Session: technical_signals, event_calendar, speech_signals | `volatility_forecasts` | Generate 1d/5d volatility forecasts |
| **alert_agent** | Session: technical_signals, volatility_forecasts | `alerts` | Check VIX thresholds, generate alerts |
| **persistence_agent** | Session: volatility_forecasts, alerts | `persistence_result` | Write to BigQuery tables |

### Session State Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    SESSION STATE FLOW                                                │
├─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                      │
│  [PHASE 1: PARALLEL DATA FETCH]                                                                     │
│                                                                                                      │
│  ┌───────────────────────────┐  ┌───────────────────────────┐  ┌─────────────────────────────────┐  │
│  │  technical_agent          │  │ event_calendar_agent      │  │ speech_signal_agent             │  │
│  │  ───────────────────────  │  │  ───────────────────────  │  │  ─────────────────────────────  │  │
│  │  Input:                   │  │  Input:                   │  │  Input:                         │  │
│  │  • market_30yr_v          │  │  • fed_comms_v            │  │  • speech_signals (BQ table)    │  │
│  │  • index_data_v           │  │  • acquisitions           │  │                                 │  │
│  │                           │  │  • analyst_ratings        │  │                                 │  │
│  │  Output:                  │  │  Output:                  │  │  Output:                        │  │
│  │  technical_signals        │  │  event_calendar           │  │  speech_signals                 │  │
│  │  (VIX level, regime,      │  │  (Fed meetings, M&A,      │  │  (Earnings call sentiment:      │  │
│  │   z-score anomalies)      │  │   analyst ratings)        │  │   tone, guidance, risks)        │  │
│  └─────────────┬─────────────┘  └─────────────┬─────────────┘  └───────────────┬─────────────────┘  │
│                │                              │                                │                     │
│                └──────────────────────────────┼────────────────────────────────┘                     │
│                                               ▼                                                      │
│  [PHASE 2: SEQUENTIAL PROCESSING]                                                                   │
│                                               │                                                      │
│                ┌──────────────────────────────┼──────────────────────────────┐                       │
│                ▼                              ▼                              ▼                       │
│  ┌───────────────────────────┐  ┌───────────────────────────┐  ┌───────────────────────────┐        │
│  │  synthesis_agent          │  │    alert_agent            │  │ persistence_agent         │        │
│  │  ───────────────────────  │  │  ───────────────────────  │  │  ───────────────────────  │        │
│  │  Input (session):         │  │  Input (session):         │  │  Input (session):         │        │
│  │  • technical_signals      │  │  • technical_signals      │  │  • volatility_forecasts   │        │
│  │  • event_calendar         │  │  • volatility_forecasts   │  │  • alerts                 │        │
│  │  • speech_signals         │  │                           │  │                           │        │
│  │                           │  │                           │  │                           │        │
│  │  Output:                  │  │  Output:                  │  │  Output:                  │        │
│  │  volatility_forecasts     │  │  alerts                   │  │  persistence_result       │        │
│  │  (1d/5d volatility        │  │  (VIX threshold checks,   │  │  (writes to BigQuery      │        │
│  │   predictions)            │  │   generated alerts)       │  │   tables)                 │        │
│  └───────────────────────────┘  └───────────────────────────┘  └───────────────────────────┘        │
│                                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Agent Logic Summary

| Agent | Input | Output | Logic (What It Does) |
|-------|-------|--------|----------------------|
| **technical_agent** | market_30yr_v, index_data_v | technical_signals (VIX level, regime, z-score anomalies) | **Step 1:** Query `market_30yr_v` to get the latest VIX value (e.g., 24.5). **Step 2:** Calculate historical mean (~19.2) and standard deviation (~7.8) from 30 years of VIX data. **Step 3:** Compute z-score = (current_vix - mean) / std_dev → e.g., (24.5 - 19.2) / 7.8 = +0.68. **Step 4:** Classify regime: z < -1 = "low", -1 to +1 = "normal", +1 to +2 = "elevated", > +2 = "extreme". **Step 5:** Query `index_data_v` for index prices, compute rolling z-scores to detect anomalies (e.g., SPX volume 2.3σ above average). |
| **event_calendar_agent** | fed_comms_v, acquisitions, analyst_ratings | event_calendar (Fed meetings, M&A, analyst ratings) | **Step 1:** Query `fed_communications_v` for FOMC meeting dates and types (Minutes, Statements). **Step 2:** Query `acquisitions` for M&A announcements in the relevant time window. **Step 3:** Query `analyst_ratings` for recent upgrades/downgrades/price target changes. **Step 4:** Merge and sort all events by date into a unified timeline. **Step 5:** Flag high-impact events (FOMC decisions, major acquisitions, significant rating changes). |
| **speech_signal_agent** | speech_signals (BQ table) | speech_signals (Earnings call sentiment: tone, guidance, risks) | **Step 1:** Query pre-processed `speech_signals` table (188 transcripts already analyzed by Gemini). **Step 2:** Retrieve sentiment scores: overall tone (bullish/neutral/bearish), forward guidance strength, and identified risk factors. **Step 3:** Filter for the most recent earnings calls from the 10 tracked companies (AAPL, NVDA, MSFT, etc.). **Step 4:** Aggregate sentiment trends across companies to identify sector-wide confidence shifts. |
| **synthesis_agent** | technical_signals, event_calendar, speech_signals | volatility_forecasts (1d/5d predictions) | **Step 1:** Take current VIX level and regime classification from technical_signals. **Step 2:** Factor in upcoming events — if FOMC meeting in next 5 days, increase volatility estimate. **Step 3:** Incorporate speech sentiment — bearish earnings tone suggests higher volatility. **Step 4:** Apply weighted formula: `forecast = base_vix × (1 + event_impact + sentiment_adjustment)`. **Step 5:** Generate 1-day and 5-day predictions with confidence scores based on signal agreement. |
| **alert_agent** | technical_signals, volatility_forecasts | alerts (VIX threshold checks, generated alerts) | **Step 1:** Check current VIX against thresholds: <15 (low), 15-20 (normal), 20-25 (elevated/info), 25-30 (high/warning), >30 (extreme/critical). **Step 2:** Check if forecasted VIX crosses a threshold boundary (e.g., current 24 → forecast 26 triggers warning). **Step 3:** Check z-score anomalies from technical_signals for outliers (>2σ triggers alert). **Step 4:** Generate alert objects with severity, message, and recommended action. |
| **persistence_agent** | volatility_forecasts, alerts | persistence_result (writes to BigQuery) | **Step 1:** Format volatility_forecasts into BigQuery row schema (date, symbol, vix, regime, forecast_1d, forecast_5d, confidence). **Step 2:** Format alerts into schema (timestamp, severity, type, message, threshold, current_value). **Step 3:** Insert rows into `volatility_forecasts` and `alerts` output tables. **Step 4:** Return success/failure status with row counts. |

---

## VIX Alert Thresholds

| VIX Level | Regime | Alert Severity | Action |
|-----------|--------|----------------|--------|
| < 15 | LOW | No alert | Market calm |
| 15-20 | NORMAL | No alert | Normal conditions |
| 20-25 | ELEVATED | info | Monitor closely |
| 25-30 | HIGH | warning | Caution advised |
| > 30 | EXTREME | critical | High risk |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/volatility/forecasts` | Get latest volatility forecasts |
| GET | `/api/volatility/alerts` | Get active alerts |
| GET | `/api/volatility/events` | Get event calendar |
| POST | `/api/volatility/refresh` | Trigger forecast refresh |

---

## Implementation Phases

| Phase | Name | Duration | Description |
|-------|------|----------|-------------|
| **0** | Setup + Data Loading | 45 min | GCS bucket, 8 BigQuery tables, transcript processing |
| **1** | Technical Agents | 60 min | technical_agent, event_calendar_agent, speech_signal_agent |
| **2** | Synthesis + Alerts | 45 min | synthesis_agent (3 signal sources), alert_agent, persistence_agent |
| **3** | Root Orchestrator | 30 min | root_agent, workflow wiring (6 sub-agents) |
| **4** | Dashboard UI | 60 min | 6 React components |
| **5** | API Endpoints | 30 min | 4 API routes |
| **6** | Deployment | 60 min | Cloud Run deployment |

**Total:** ~8-9 hours

---

## Phase Status Tracking

| Phase | Status | Handoff Doc |
|-------|--------|-------------|
| Phase 0 | PENDING | `ph0_setup_data.md` |
| Phase 1 | PENDING | `ph1_technical_agents.md` |
| Phase 2 | PENDING | `ph2_synthesis_alerts.md` |
| Phase 3 | PENDING | `ph3_orchestrator.md` |
| Phase 4 | PENDING | `ph4_dashboard_ui.md` |
| Phase 5 | PENDING | `ph5_api_endpoints.md` |
| Phase 6 | PENDING | `ph6_deployment.md` |

---

## Directory Structure

### ADK Agent Files
```
apps/market-volatility-agent/
├── market_volatility_agent/
│   ├── __init__.py
│   ├── agent.py                    # Root orchestrator
│   ├── config.py                   # VIX thresholds, BigQuery config
│   ├── models.py                   # Pydantic models
│   ├── sub_agents/
│   │   ├── technical_agent/
│   │   │   └── agent.py            # VIX, z-score analysis
│   │   ├── event_calendar_agent/
│   │   │   └── agent.py            # Fed meetings, M&A, analyst ratings
│   │   ├── speech_signal_agent/
│   │   │   └── agent.py            # Earnings call sentiment
│   │   ├── synthesis_agent/
│   │   │   └── agent.py            # Volatility forecasting
│   │   ├── alert_agent/
│   │   │   └── agent.py            # VIX threshold alerts
│   │   └── persistence_agent/
│   │       └── agent.py            # BigQuery writes
│   ├── workflows/
│   │   └── volatility_workflow.py  # SequentialAgent pipeline
│   └── tools/
│       └── bigquery_tools.py       # BigQuery toolset
├── scripts/
│   └── process_transcripts.py      # Batch process earnings transcripts
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
        ├── EventCalendar.tsx       # Fed meetings, M&A, ratings
        ├── AnomalyList.tsx         # Z-score anomalies
        └── AlertsPanel.tsx         # VIX alerts
```

---

## Environment Variables

```bash
# Google Cloud
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=True

# BigQuery
BIGQUERY_PROJECT=your-project-id
BIGQUERY_DATASET=market_volatility

# Cloud Storage
GCS_BUCKET=your-project-id-market-volatility-data

# Supabase (for Auth + ADK persistence)
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# ADK Agent (for frontend to call)
ADK_AGENT_URL=http://localhost:8000
```

---

## Guidelines for Each Session

> **CRITICAL: Ask questions if anything is unclear!**
>
> Before implementing, verify:
> - Do you understand the requirements?
> - Is the scope clear?
> - Are there multiple valid approaches? If so, ask which to use.

1. **Read the handoff document** for that phase first
2. **Reference this overview** for architecture context
3. **Use existing patterns** from `apps/traffic-anomaly-agent/`
4. **Ask questions upfront** before implementing - don't assume!
5. **Update phase status** when complete
6. **Each phase is sized** for one Claude session without context exhaustion

---

## Success Criteria

- [ ] 8 BigQuery input tables loaded with data
- [ ] 200 earnings transcripts processed via Gemini
- [ ] Technical agent returns VIX level and regime
- [ ] Event calendar agent returns Fed meetings, M&A, analyst ratings
- [ ] Speech signal agent returns earnings sentiment
- [ ] Synthesis agent generates 1d/5d forecasts (uses 3 signal sources)
- [ ] Alert agent triggers on VIX thresholds
- [ ] Dashboard displays forecasts and alerts
- [ ] API endpoints functional
- [ ] Deployed to Cloud Run
- [ ] Full demo flow completes successfully

---

## Project Change Log

> **High-level summary of significant changes from the original plan.**

### Major Changes from Initial Design

| Change | Original | Revised | Rationale |
|--------|----------|---------|-----------|
| Input tables | 6 tables | 8 tables | Added analyst_ratings, speech_signals |
| Sub-agents | 5 agents | 6 agents | Added speech_signal_agent |
| Timeline | 6-7 hours | 8-9 hours | Extended for new datasets |
| Signal sources | 2 sources | 3 sources | Added earnings sentiment |

### Lessons Learned

| Phase | Lesson | Recommendation |
|-------|--------|----------------|
| | | |

---

## Questions to Clarify Before Starting

Before each phase, consider asking:

1. **Scope**: "Should I implement X, Y, and Z, or just X for now?"
2. **Approach**: "There are two ways to do this. Which do you prefer?"
3. **Dependencies**: "This requires X to be set up first. Is it ready?"
4. **Trade-offs**: "Option A is faster but less flexible. Option B is more work but extensible. Which fits better?"
5. **Edge cases**: "How should I handle the case where X fails?"

**It's always better to ask than to build the wrong thing!**

---

## Source Data Files Reference

The raw data files are located in `ai_docs/Ideation/mktprediction_datasets/data/`.

### CSV Files

| File | Rows | Description |
|------|------|-------------|
| **30_yr_stock_market_data.csv** | 7,754 | **30 years of daily market data (1993-2023)**. Contains: US indices (Dow Jones, Nasdaq, S&P 500, NYSE, Russell 2000), VIX volatility index, international indices (DAX, FTSE 100, Hang Seng), commodities (cocoa, coffee, corn, cotton, cattle, OJ, soybeans, sugar, wheat, ethanol), energy (heating oil, natural gas, Brent crude, WTI crude), metals (copper, gold, palladium, platinum, silver), and Treasury yields (5yr, 13wk, 10yr, 30yr). |
| **indexData.csv** | 112,457 | **Historical OHLCV data for major indices** (1965-2021). Columns: Index, Date, Open, High, Low, Close, Adj Close, Volume. Used for z-score anomaly detection calculations. |
| **acquisitions_update_2021.csv** | 1,455 | **M&A event calendar**. Contains: ID, Parent Company, Acquisition Year, Acquisition Month, Acquired Company, Business description, Country, Acquisition Price, Category, Derived Products. Tracks major tech acquisitions (Apple, etc.) from 1988-2021. |
| **analyst_ratings_processed.csv** | 1,401,123 | **Analyst rating changes & news**. Columns: title (headline), date, stock (ticker). Contains: "52-week highs", analyst upgrades/downgrades, price target changes, stock movers. Large dataset covering 2020 data. |
| **communications.csv** | 42,845 | **Fed FOMC communications**. Columns: Date, Release Date, Type, Text. Contains: FOMC meeting minutes, statements, and full text content. Key source for event calendar and Fed policy analysis. |
| **stock_news.csv** | 26,000 | **News headlines with sentiment labels**. Columns: headline, label (Positive/Negative/Neutral). Used for news sentiment analysis as a volatility indicator. |
| **sp500_companies.csv** | 503 | **S&P 500 company fundamentals**. Contains: Exchange, Symbol, Company Name, Sector, Industry, Current Price, Market Cap, EBITDA, Revenue Growth, City, State, Country, Employees, Business Summary, Index Weight. Detailed company profiles. |
| **symbols_valid_meta.csv** | 8,049 | **Ticker metadata**. Columns: Nasdaq Traded, Symbol, Security Name, Listing Exchange, Market Category, ETF flag, Round Lot Size, Test Issue, Financial Status, CQS Symbol, NASDAQ Symbol, NextShares. Reference data for ticker symbols. |
| **US_Economic_Indicators.csv** | 44 | **Macro economic indicators (1980-2023)**. Columns: year, inflation_rate, gdp_growth, unemployment_rate. Annual data for economic context. |
| **dataset_summary.csv** | 7,786 | **Per-symbol data coverage summary**. Columns: symbol, total_prices, stock_from_date, stock_to_date, total_earnings, earnings_from_date, earnings_to_date. Shows data availability for each ticker. |

### ZIP File

| File | Contents | Description |
|------|----------|-------------|
| **earnings-call-transcripts-dataset-main.zip** | **188 transcript files** | Earnings call transcripts for **10 major tech companies** (2016-2020): AAPL, AMD, AMZN, ASML, CSCO, GOOGL, INTC, MSFT, MU, NVDA. Each file is ~50-65KB of text containing full Q&A sessions with executives and analysts. Format: Thomson Reuters StreetEvents transcripts with Corporate Participants, Conference Call Participants, and full discussion content. |

### Data Usage by Category

| Category | Files | Purpose |
|----------|-------|---------|
| **Market Data** | 30_yr_stock_market_data.csv, indexData.csv | VIX analysis, z-score anomaly detection |
| **Event Calendar** | communications.csv, acquisitions_update_2021.csv, analyst_ratings_processed.csv | Fed meetings, M&A events, rating changes |
| **Speech Signals** | earnings-call-transcripts ZIP | Earnings call sentiment analysis via Gemini |
| **Reference** | sp500_companies.csv, symbols_valid_meta.csv, dataset_summary.csv | Company info, ticker metadata |
| **Macro Context** | US_Economic_Indicators.csv | GDP, inflation, unemployment context |
| **News Sentiment** | stock_news.csv | News headlines with pre-labeled sentiment |

### Datasets NOT Used

These CSV files are available but not implemented in the current project:

| File | Reason |
|------|--------|
| **sp500_companies.csv** | Reference data only, not queried by agents |
| **symbols_valid_meta.csv** | Ticker metadata only, not queried by agents |
| **dataset_summary.csv** | Metadata file, not loaded to BigQuery |

### BigQuery Tables Summary

#### Input Sources (8) - Loaded to BigQuery

| Table/Folder | Source File | Rows/Files |
|--------------|-------------|------------|
| **earnings-call-transcripts** | ZIP (188 .txt files) | 188 files |
| **market_30yr** | 30_yr_stock_market_data.csv | 7,754 |
| **index_data** | indexData.csv | 112,457 |
| **fed_communications** | communications.csv | 42,845 |
| **acquisitions** | acquisitions_update_2021.csv | 1,455 |
| **analyst_ratings** | analyst_ratings_processed.csv | 1,401,123 |
| **economic_indicators** | US_Economic_Indicators.csv | 44 |
| **stock_news** | stock_news.csv | 26,000 |

#### Views (3) - Created for Cleaner Querying

| View | Base Table | Purpose |
|------|------------|---------|
| **market_30yr_v** | market_30yr | Clean column names, filtered nulls for VIX analysis |
| **index_data_v** | index_data | Clean column names for z-score calculations |
| **fed_communications_v** | fed_communications | Clean column names for event calendar |

#### Output Tables (3) - Generated by Processing

| Table | Generated By | Input Sources | Purpose |
|-------|--------------|---------------|---------|
| **speech_signals** | Gemini transcript processing | earnings-call-transcripts ZIP (188 files) | Earnings call sentiment (tone, guidance, topics, risks) |
| **volatility_forecasts** | persistence_agent | market_30yr_v, index_data_v, fed_communications_v, acquisitions, analyst_ratings, speech_signals | 1d/5d volatility predictions per index |
| **alerts** | alert_agent | market_30yr_v (VIX), index_data_v (z-scores) | VIX threshold alerts, anomaly alerts |

#### Data Flow Diagram

```
INPUT (8 sources)          VIEWS (3)               OUTPUT (3 tables)
─────────────────          ─────────               ─────────────────
earnings-call-transcripts  ─────────────────────→  speech_signals
market_30yr         →      market_30yr_v      ─┬→  volatility_forecasts
index_data          →      index_data_v       ─┤
fed_communications  →      fed_communications_v│
acquisitions        ───────────────────────────┤
analyst_ratings     ───────────────────────────┘
economic_indicators                               alerts
stock_news
```
