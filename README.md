<div align="center">

# Market Volatility Prediction Agent

<img src="apps/web/public/logo.png" alt="Market Volatility Prediction" width="140" />

### AI-Powered Volatility Forecasting Platform

*Built with Google Agent Development Kit (ADK) for the Google Cloud AI/ML Hackathon*

[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/)
[![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)

[Live Demo](https://market-signal-web-1081159775716.us-central1.run.app) · [Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API](#-api-endpoints)

---

</div>
<div align="center">

# Usecase Details
Financial institutions and investors struggle to anticipate market volatility around major events (i.e. earnings announcements, Fed Reserve decisions, macroeconomic releases, etc.)

Existing predictive tools often rely on static models or narrow datasets, failing to capture dynamic, multi-factor relationships. This results in reactive strategies, missed alpha opportunities, and heightened risk exposure in scenarios.

Market reactions are complex and influenced by multiple factors: news sentiment, macro indicators, and liquidity conditions. where decisions need to be made in milliseconds; latency kills opportunity.

Develop a Market Activity Prediction Agent that:

  Analyzes historical market data to detect patterns and anomalies.
  Models event impacts by correlating financial events (e.g., earnings releases, Fed announcements) with historical market reactions.
  Forecasts volatility (short-term and long-term) using statistical and machine learning models.
  Simulates scenarios for upcoming events based on historical behavior.
  Provides real-time alerts for predicted high-volatility periods or significant market shifts.
  Contains predictions should include confidence scores and rationale for transparency.
  Provides API-ready outputs for trading platforms and risk dashboards would be a PLUS.
</div>
## Overview

**Market Volatility Prediction Agent** is a production-ready multi-agent AI system that forecasts market volatility using multiple data sources:

| Signal Type | Source | Technology |
|-------------|--------|------------|
| **Technical Signals** | VIX & Index Data | BigQuery z-score anomaly detection |
| **Event Calendar** | Fed FOMC, M&A, Analyst Ratings | BigQuery event analysis |
| **Speech Signals** | Earnings Call Transcripts | Gemini sentiment processing |

> **Hackathon Theme:** *"AI ML Power - Building Low-Latency ML Pipeline That Extracts Signals From Multi-Source Time Series Data"*

### How We Address the Theme

1. **Multi-Source**: Market data, Fed communications, M&A events, analyst ratings, earnings transcripts
2. **Time Series**: 30 years of VIX/market data, event calendars, historical transcripts
3. **Signal Extraction**: VIX regime detection, z-score anomalies, sentiment analysis
4. **Low-Latency**: Pre-processed data in BigQuery, sequential agent execution
5. **ML Pipeline**: BigQuery queries, Gemini transcript processing, volatility forecasting

---

## Architecture

### System Architecture

<p align="center">
  <img src="ai_docs/Ideation/mktprediction_datasets/diagrams/Sys_arch.png" alt="System Architecture" width="800" />
</p>

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE SYSTEM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                              FRONTEND LAYER                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │  │
│  │  │   Dashboard     │  │  Volatility     │  │   Chat +        │           │  │
│  │  │   (Sidebar)     │  │  Forecasts      │  │   Alerts Panel  │           │  │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘           │  │
│  │           └───────────────────┬┴───────────────────┬┘                     │  │
│  │                               ▼                                            │  │
│  │                    ┌─────────────────────┐                                │  │
│  │                    │   Next.js API       │                                │  │
│  │                    │   /api/volatility/* │                                │  │
│  │                    └──────────┬──────────┘                                │  │
│  └───────────────────────────────┼────────────────────────────────────────────┘  │
│                                  │                                               │
│  ┌───────────────────────────────┼────────────────────────────────────────────┐  │
│  │                         ADK AGENT LAYER                                    │  │
│  │                               ▼                                            │  │
│  │           ┌───────────────────────────────────────┐                       │  │
│  │           │      Root Orchestrator Agent          │                       │  │
│  │           │   • Intent detection & routing        │                       │  │
│  │           │   • Session state management          │                       │  │
│  │           └───────────────────┬───────────────────┘                       │  │
│  │                               │                                            │  │
│  │                     ┌─────────┴─────────┐                                 │  │
│  │                     ▼                   ▼                                 │  │
│  │        ┌──────────────────────┐ ┌──────────────────┐                     │  │
│  │        │ volatility_workflow  │ │   chat_agent     │                     │  │
│  │        │ (SequentialAgent)    │ │   (Q&A)          │                     │  │
│  │        │   6 sub-agents       │ │                  │                     │  │
│  │        └──────────────────────┘ └──────────────────┘                     │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                  │                                               │
│  ┌───────────────────────────────┼────────────────────────────────────────────┐  │
│  │                         DATA LAYER                                         │  │
│  │     ┌─────────────────────────┼─────────────────────────┐                 │  │
│  │     ▼                         ▼                         ▼                 │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │  │
│  │  │   Cloud Storage │  │   BigQuery      │  │   Supabase      │           │  │
│  │  │   • Raw CSVs    │  │   • 8 input     │  │   • Auth        │           │  │
│  │  │   • Transcripts │  │   • 2 output    │  │   • Sessions    │           │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘           │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

<details>
<summary><strong>Frontend Visuals</strong> (click to expand)</summary>

### Landing Page
<p align="center">
  <img src="ai_docs/Ideation/mktprediction_datasets/diagrams/Landing.png" alt="Landing Page" width="800" />
</p>

### Sign In
<p align="center">
  <img src="ai_docs/Ideation/mktprediction_datasets/diagrams/Signin.png" alt="Sign In" width="800" />
</p>

### Dashboard
<p align="center">
  <img src="ai_docs/Ideation/mktprediction_datasets/diagrams/Dashboard.png" alt="Dashboard" width="800" />
</p>

### Preferences
<p align="center">
  <img src="ai_docs/Ideation/mktprediction_datasets/diagrams/Preferences.png" alt="Preferences" width="800" />
</p>

</details>

## Agent Hierarchy & Data Flow

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

### Agent Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AGENT WORKFLOW                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  market_signal_orchestrator (Root LlmAgent)                                     │
│  │                                                                               │
│  └─→ sequential_analysis (SequentialAgent)                                      │
│      │                                                                           │
│      ├─→ [PHASE 1: PARALLEL DATA FETCH]                                         │
│      │   parallel_data_fetch (ParallelAgent)                                    │
│      │   ├── technical_agent        → technical_signals                         │
│      │   │   └─ market_30yr_v, index_data_v                                     │
│      │   ├── event_calendar_agent   → event_calendar                            │
│      │   │   └─ fed_communications_v, acquisitions, analyst_ratings             │
│      │   └── speech_signal_agent    → speech_signals                            │
│      │       └─ speech_signals table                                            │
│      │                                                                           │
│      └─→ [PHASE 2: SEQUENTIAL PROCESSING]                                       │
│          ├── synthesis_agent        → volatility_forecasts                      │
│          │   └─ uses: technical_signals, event_calendar, speech_signals         │
│          ├── alert_agent            → alerts                                    │
│          │   └─ uses: technical_signals, volatility_forecasts                   │
│          └── persistence_agent      → BigQuery writes                           │
│              └─ writes: volatility_forecasts, alerts tables                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

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

## Features

| Feature | Description |
|---------|-------------|
| **Multi-Agent Architecture** | 6 specialized agents orchestrated by Google ADK |
| **VIX Regime Detection** | Low, Normal, Elevated, Extreme classifications |
| **Z-Score Anomaly Detection** | BigQuery-powered statistical analysis |
| **Event Calendar Integration** | Fed FOMC, M&A, analyst rating changes |
| **Earnings Call Analysis** | Gemini-processed transcripts (10 tech companies) |
| **Volatility Forecasting** | 1-day and 5-day predictions |
| **Real-Time Alerts** | VIX threshold-based alert system |
| **3-Panel Dashboard** | Sidebar + Main Dashboard + Chat/Alerts |
| **Production Ready** | Deployed on GCP Cloud Run |

---

## Tech Stack

<table>
<tr>
<td width="33%" valign="top">

### Frontend
- **Next.js 15** - App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Components
- **Drizzle ORM** - Database

</td>
<td width="33%" valign="top">

### Backend
- **Google ADK** - Agent orchestration
- **Python 3.10+** - Agent logic
- **Gemini 2.0 Flash** - LLM
- **BigQuery** - Data warehouse
- **uv** - Package management

</td>
<td width="33%" valign="top">

### Infrastructure
- **Cloud Run** - Deployment
- **Cloud Storage** - Raw data
- **BigQuery** - Analytics
- **Supabase** - Auth + Sessions
- **Vertex AI** - Gemini models

</td>
</tr>
</table>

---

## Data Sources

### Input Sources (8) - Loaded to BigQuery

| Table/Folder | Source File | Rows/Files | Purpose |
|--------------|-------------|------------|---------|
| **earnings-call-transcripts** | ZIP (188 .txt files) | 188 files | Earnings call transcripts → processed to speech_signals |
| **market_30yr** | 30_yr_stock_market_data.csv | 7,754 | VIX, indices, commodities (PRIMARY) |
| **index_data** | indexData.csv | 112,457 | OHLCV for z-score calculation |
| **fed_communications** | communications.csv | 42,845 | Fed FOMC meetings calendar |
| **acquisitions** | acquisitions_update_2021.csv | 1,455 | M&A event calendar |
| **analyst_ratings** | analyst_ratings_processed.csv | 1,401,123 | Analyst upgrades/downgrades |
| **economic_indicators** | US_Economic_Indicators.csv | 44 | GDP, inflation, unemployment |
| **stock_news** | stock_news.csv | 26,000 | News sentiment (optional) |

### Views (3) - Created for Cleaner Querying

| View | Base Table | Purpose |
|------|------------|---------|
| **market_30yr_v** | market_30yr | Clean column names, filtered nulls for VIX analysis |
| **index_data_v** | index_data | Clean column names for z-score calculations |
| **fed_communications_v** | fed_communications | Clean column names for event calendar |

### Output Tables (3) - Generated by Processing

| Table | Generated By | Input Sources | Purpose |
|-------|--------------|---------------|---------|
| **speech_signals** | Gemini transcript processing | earnings-call-transcripts ZIP (188 files) | Earnings call sentiment |
| **volatility_forecasts** | persistence_agent | market_30yr_v, index_data_v, speech_signals | 1d/5d volatility predictions |
| **alerts** | alert_agent | market_30yr_v (VIX), index_data_v (z-scores) | VIX threshold & anomaly alerts |

### Data Flow

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

**Earnings Transcript Companies:** AAPL, AMD, AMZN, ASML, CSCO, GOOGL, INTC, MSFT, MU, NVDA (2016-2020)

---

## VIX Alert Thresholds

| VIX Level | Regime | Alert Severity | Description |
|-----------|--------|----------------|-------------|
| < 15 | LOW | No alert | Market calm |
| 15-20 | NORMAL | No alert | Normal conditions |
| 20-25 | ELEVATED | `info` | Monitor closely |
| 25-30 | HIGH | `warning` | Caution advised |
| > 30 | EXTREME | `critical` | High risk |

---

## Quick Start

### Prerequisites

- Node.js 20+ · Python 3.10+ · [uv](https://github.com/astral-sh/uv) · gcloud CLI · Supabase account

### Installation

```bash
# Clone and install
git clone <repository-url>
cd gcp-wells-hackathon
npm run install

# Configure environment
cp apps/web/.env.local.example apps/web/.env.local
cp apps/market-signal-agent/.env.example apps/market-signal-agent/.env
```

### Development

```bash
npm run dev          # Start frontend + agent
npm run dev:frontend # Next.js only (localhost:3000)
npm run dev:api      # ADK agent only (localhost:8000)
npm run adk:web      # ADK web interface
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/volatility/metrics` | Current VIX level, regime, percentile |
| GET | `/api/volatility/forecasts` | 1d/5d volatility forecasts for indices |
| GET | `/api/volatility/anomalies` | Z-score anomalies for all indices |
| GET | `/api/volatility/events` | Event calendar (Fed, M&A, ratings) |
| GET | `/api/volatility/alerts` | Active alerts based on thresholds |

### Sample Response: `/api/volatility/forecasts`

```json
{
  "data_date": "2023-12-29",
  "current_vix": 12.89,
  "regime": "low",
  "forecasts": [
    { "symbol": "SPX", "volatility_1d": 12.9, "volatility_5d": 12.6, "confidence": 0.90 },
    { "symbol": "NDX", "volatility_1d": 14.8, "volatility_5d": 14.5, "confidence": 0.87 },
    { "symbol": "DJI", "volatility_1d": 12.2, "volatility_5d": 12.0, "confidence": 0.92 },
    { "symbol": "RUT", "volatility_1d": 17.4, "volatility_5d": 17.0, "confidence": 0.85 }
  ]
}
```

---

## UI Design: 3-Panel Layout

```
┌──────────────┬───────────────────────────────────────────────────┬──────────────────────┐
│              │                                                   │                      │
│   SIDEBAR    │         VOLATILITY DASHBOARD (Main)               │    CHAT + ALERTS     │
│   (Panel 1)  │                (Panel 2)                          │      (Panel 3)       │
│              │                                                   │                      │
│  ┌────────┐  │   ┌─────────────────────────────────────────┐   │   ┌──────────────┐   │
│  │New Chat│  │   │  RegimeIndicator                        │   │   │ ALERTS (2)   │   │
│  │History │  │   │  Regime: ELEVATED    VIX: 24.5         │   │   │ ⚠ VIX > 25   │   │
│  │────────│  │   │  ████████████░░░░    78th %ile         │   │   │ ℹ Anomaly    │   │
│  │Volatil.│  │   └─────────────────────────────────────────┘   │   └──────────────┘   │
│  │Profile │  │                                                   │                      │
│  │Settings│  │   ┌─────────────────────────────────────────┐   │   ┌──────────────┐   │
│  └────────┘  │   │  ForecastTable                          │   │   │ Volatility   │   │
│              │   │  SPX | 12.5% | 14.2% | 82%             │   │   │ Assistant    │   │
│              │   │  NDX | 15.2% | 17.1% | 78%             │   │   │              │   │
│              │   │  DJI | 10.1% | 11.8% | 85%             │   │   │ "Why is VIX  │   │
│              │   │  RUT | 18.3% | 20.5% | 74%             │   │   │  elevated?"  │   │
│              │   └─────────────────────────────────────────┘   │   └──────────────┘   │
│              │                                                   │                      │
│              │   ┌─────────────────────────────────────────┐   │                      │
│              │   │  EventCalendar (Fed + M&A + Ratings)    │   │                      │
│              │   │  Oct 29: FOMC Minute released           │   │                      │
│              │   │  Sep 18: Analyst downgrade - NVDA       │   │                      │
│              │   └─────────────────────────────────────────┘   │                      │
│              │                                                   │                      │
│              │   ┌─────────────────────────────────────────┐   │                      │
│              │   │  AnomalyList                             │   │                      │
│              │   │  🔴 SPX Volume: 2.3σ above average      │   │                      │
│              │   │  🟡 VIX: Elevated but stable            │   │                      │
│              │   └─────────────────────────────────────────┘   │                      │
└──────────────┴───────────────────────────────────────────────────┴──────────────────────┘
```

---

## Project Structure

```
apps/
├── web/                           # Next.js frontend
│   ├── app/
│   │   ├── (protected)/
│   │   │   └── volatility/        # Volatility dashboard page
│   │   └── api/volatility/        # REST API endpoints
│   │       ├── metrics/route.ts
│   │       ├── forecasts/route.ts
│   │       ├── anomalies/route.ts
│   │       ├── events/route.ts
│   │       └── alerts/route.ts
│   └── components/volatility/     # React components
│       ├── VolatilityDashboard.tsx
│       ├── RegimeIndicator.tsx
│       ├── ForecastTable.tsx
│       ├── EventCalendar.tsx
│       ├── AnomalyList.tsx
│       └── AlertsPanel.tsx
│
└── market-signal-agent/           # ADK agent system
    ├── market_signal_agent/
    │   ├── agent.py               # Root orchestrator
    │   ├── config.py              # VIX thresholds, BigQuery config
    │   ├── models.py              # Pydantic models
    │   ├── sub_agents/
    │   │   ├── technical_agent/
    │   │   ├── event_calendar_agent/
    │   │   ├── speech_signal_agent/
    │   │   ├── synthesis_agent/
    │   │   ├── alert_agent/
    │   │   └── persistence_agent/
    │   └── tools/
    │       └── bigquery_tools.py
    ├── scripts/
    │   └── process_transcripts.py
    ├── pyproject.toml
    └── Dockerfile
```

---

## Deployment

### Production Environment

| Component | URL / Location |
|-----------|----------------|
| **Frontend** | https://gcp-bq-reports-web-prod-lnl6duvora-uc.a.run.app/ |
| **Agent** | Cloud Run (us-central1) |
| **Region** | us-central1 |

### Deploy Commands

```bash
# Deploy ADK agent
cd apps/market-signal-agent
gcloud run deploy market-signal-agent \
    --source . \
    --region us-central1 \
    --allow-unauthenticated

# Deploy frontend
cd apps/web
gcloud run deploy market-signal-web \
    --source . \
    --region us-central1 \
    --allow-unauthenticated
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

## Cost Estimate

| Service | Purpose | Monthly |
|---------|---------|--------:|
| Google ADK | Agent orchestration | Free |
| Vertex AI / Gemini | LLM reasoning | $5-10 |
| BigQuery | Data warehouse | $5-10 |
| Cloud Storage | Raw data | $1 |
| Cloud Run | Deployment | $5-10 |
| **Total** | | **~$20-30** |

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run install` | Install dependencies for both apps |
| `npm run dev` | Start all development servers |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:api` | Start ADK agent only |
| `npm run adk:web` | Start ADK web interface |
| `npm run build` | Build for production |
| `npm run type-check` | TypeScript checking |

---

<div align="center">

### Built With

[![Google ADK](https://img.shields.io/badge/Google%20ADK-4285F4?style=flat-square&logo=google&logoColor=white)](https://google.github.io/adk-docs/)
[![BigQuery](https://img.shields.io/badge/BigQuery-4285F4?style=flat-square&logo=google-cloud&logoColor=white)](https://cloud.google.com/bigquery)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=flat-square)](https://ui.shadcn.com/)

---

*Created for the Google Cloud AI/ML Hackathon*

</div>
