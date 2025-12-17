# Market Activity Prediction Agent - Demo Presentation

## Use Case Problem Statement

Financial institutions and investors struggle to anticipate market volatility around major events (i.e. earnings announcements, Fed Reserve decisions, macroeconomic releases, etc.)

**Key Challenges:**
- Existing predictive tools rely on static models or narrow datasets
- Failure to capture dynamic, multi-factor relationships
- Reactive strategies lead to missed alpha opportunities
- Heightened risk exposure in volatile scenarios
- Market reactions are complex - influenced by news sentiment, macro indicators, and liquidity conditions
- Decisions need to be made in milliseconds; latency kills opportunity

---

## Solution Approach

1. **Multi-Agent AI Architecture** - 6 specialized Google ADK agents orchestrated to analyze, synthesize, and alert on market conditions in real-time.

2. **Multi-Source Signal Fusion** - Integrates 8 data sources (VIX, indices, Fed communications, M&A events, analyst ratings, earnings transcripts) for comprehensive analysis.

3. **Low-Latency Pipeline** - ParallelAgent fetches 3 data sources concurrently; pre-processed BigQuery tables enable instant SQL queries on 30 years of data.

4. **Predictive Forecasting** - Generates 1-day and 5-day volatility forecasts with confidence scores using Gemini-powered synthesis across all signal sources.

5. **Transparent Alerting** - VIX threshold-based alerts (LOW/NORMAL/ELEVATED/EXTREME) with z-score anomaly detection and full audit trail via session state.

---

## Expected Outcomes

### 1. Volatility Forecasts with Confidence

| Index | 1-Day Forecast | 5-Day Forecast | Confidence |
|-------|----------------|----------------|------------|
| SPX | 12.5% | 14.2% | 82% |
| NDX | 15.2% | 17.1% | 78% |
| DJI | 10.1% | 11.8% | 85% |
| RUT | 18.3% | 20.5% | 74% |

### 2. Real-Time Alerting System

| VIX Level | Alert | Severity |
|-----------|-------|----------|
| > 30 | EXTREME volatility | Critical |
| 25-30 | HIGH volatility | Warning |
| 20-25 | ELEVATED volatility | Info |
| < 20 | Normal conditions | None |

### 3. Interactive 3-Panel Dashboard

- **Panel 1**: Navigation sidebar
- **Panel 2**: Volatility dashboard (regime indicator, forecasts, events, anomalies)
- **Panel 3**: Chat assistant + alerts

### 4. Conversational AI Chat Assistant

- Natural language queries: "Why is VIX elevated today?" or "Analyze current market volatility"
- Real-time streaming responses from multi-agent pipeline
- Context-aware answers using session state from all 6 agents
- Chat history persistence for session continuity

### 5. API-Ready Outputs

```
GET /api/volatility/forecasts  → Trading platform integration
GET /api/volatility/alerts     → Risk dashboard feeds
GET /api/volatility/events     → Event calendar API
GET /api/volatility/metrics    → Real-time VIX monitoring
```

### 6. Key Differentiators

| Challenge | Our Solution |
|-----------|--------------|
| Static models | **Multi-agent AI** with dynamic reasoning |
| Narrow datasets | **8 data sources** (market, events, speech) |
| Reactive strategies | **Predictive forecasts** with confidence scores |
| Black-box predictions | **Transparent rationale** via session state |
| Manual monitoring | **Automated alerts** at configurable thresholds |

---

## Demo Flow Summary

```
User Query: "Analyze current market volatility"
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. Parallel Data Fetch (3 agents simultaneously)               │
│    • Technical signals: VIX 24.5, ELEVATED regime              │
│    • Event calendar: 2 Fed meetings, 5 analyst changes         │
│    • Speech signals: Mixed sentiment from earnings calls       │
├─────────────────────────────────────────────────────────────────┤
│ 2. Synthesis → Forecasts with confidence scores                │
├─────────────────────────────────────────────────────────────────┤
│ 3. Alert Check → 1 warning (VIX > 25)                          │
├─────────────────────────────────────────────────────────────────┤
│ 4. Persist to BigQuery + Return to Dashboard                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hackathon Theme Alignment

**Theme:** "AI ML Power - Building Low-Latency ML Pipeline That Extracts Signals From Multi-Source Time Series Data"

| Requirement | How We Address It |
|-------------|-------------------|
| **Multi-Source** | Market data, Fed communications, M&A events, analyst ratings, earnings transcripts |
| **Time Series** | 30 years of VIX/market data, event calendars, historical transcripts |
| **Signal Extraction** | VIX regime detection, z-score anomalies, sentiment analysis |
| **Low-Latency** | Pre-processed data in BigQuery, parallel agent execution |
| **ML Pipeline** | BigQuery queries, Gemini transcript processing, volatility forecasting |

---

## Technology Stack

### Google Cloud Services

| Service | Purpose |
|---------|---------|
| **Google ADK** | Multi-agent orchestration |
| **Vertex AI / Gemini** | LLM reasoning + transcript processing |
| **BigQuery** | Market data, forecasts, alerts storage |
| **Cloud Storage (GCS)** | Raw CSV files + transcripts |
| **Cloud Run** | ADK Agent + Frontend deployment |

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS + shadcn/ui** | UI components |
| **Supabase** | Authentication + session storage |

---

## Live Application

**Frontend URL**:https://gcp-bq-reports-web-prod-lnl6duvora-uc.a.run.app/

---

## Data Sources Summary

### Input Sources (8)

| Source | Records | Purpose |
|--------|---------|---------|
| market_30yr | 7,754 | VIX, indices, commodities (30 years daily) |
| index_data | 112,457 | OHLCV for z-score calculation |
| fed_communications | 42,845 | Fed FOMC meetings calendar |
| acquisitions | 1,455 | M&A event calendar |
| analyst_ratings | 1,401,123 | Analyst upgrades/downgrades |
| economic_indicators | 44 | GDP, inflation, unemployment |
| stock_news | 26,000 | News headlines with sentiment |
| earnings-call-transcripts | 188 files | 10 tech companies (2016-2020) |

### Output Tables (3)

| Table | Generated By | Purpose |
|-------|--------------|---------|
| speech_signals | Gemini processing | Earnings call sentiment |
| volatility_forecasts | Synthesis agent | 1d/5d volatility predictions |
| alerts | Alert agent | VIX threshold alerts |

---

## Agent Architecture Diagram

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

---

## Success Metrics

- 8 BigQuery input tables loaded with data
- 188 earnings transcripts processed via Gemini
- Technical agent returns VIX level and regime
- Event calendar agent returns Fed meetings, M&A, analyst ratings
- Speech signal agent returns earnings sentiment
- Synthesis agent generates 1d/5d forecasts with confidence scores
- Alert agent triggers on VIX thresholds
- Dashboard displays forecasts and alerts in real-time
- Conversational chat assistant answers natural language queries
- API endpoints functional for trading platform integration
- Deployed to Cloud Run with production URL
