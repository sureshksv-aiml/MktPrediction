# Market Volatility Prediction Agent - Project Plan

## Project Overview

**Project Name:** Market Volatility Prediction Agent
**Timeline:** 8-9 hours (single hackathon session, extended for additional datasets)
**Team:** Solo developer with Claude AI assistance

---

## Use Case

Financial institutions and investors struggle to anticipate market volatility around major events. This agent will:

| Feature | Status | Description |
|---------|--------|-------------|
| Analyze historical market data | Included | Z-score detection for anomalies |
| Event calendar | Included | Fed meetings, M&A events, analyst rating changes ★UPDATED |
| Earnings sentiment | ★NEW | Bullish/bearish signals from 10 major tech company earnings (2016-2020) |
| Forecast volatility | Included | 1-day and 5-day forecasts |
| Simulate scenarios | EXCLUDED | Needs more time |
| Simple alerts | Included | Polling-based, VIX threshold alerts |
| Confidence scores | Included | Simple percentage (0-100%) |
| API-ready outputs | Included | Basic REST, no authentication |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data Source | BigQuery ONLY | No external real-time fetching - hackathon time constraint |
| Alerts | Simple polling | No WebSocket complexity |
| API Auth | None | Hackathon scope - not production |
| Event Calendar | Load from existing CSVs | communications.csv, acquisitions.csv, analyst_ratings.csv ★UPDATED |
| Earnings Sentiment | Gemini batch processing | 200 transcripts processed via existing pipeline ★NEW |
| Timeline | 8-9 hours TOTAL | Extended for analyst ratings + earnings transcripts ★UPDATED |

---

## Implementation Timeline

| Hour | Phase | Tasks | Output |
|------|-------|-------|--------|
| 0:00-0:45 | Phase 0: Setup + Data | Project structure, GCS bucket, BigQuery tables | 8 tables loaded ★UPDATED |
| 0:45-1:00 | Phase 0.5: Transcript Processing | Batch process 200 earnings transcripts via Gemini | speech_signals table ★NEW |
| 1:00-2:00 | Phase 1: Technical Agents | BigQuery queries, z-score, VIX, event calendar, speech signals | technical_signals, event_calendar, speech_signals ★UPDATED |
| 2:00-2:45 | Phase 2: Synthesis + Alerts | Volatility forecasting logic (uses 3 signal sources), VIX threshold checks | volatility_forecasts, alerts |
| 2:45-3:15 | Phase 3: Orchestrator | Root agent, workflow wiring (6 sub-agents) | Agent functional ★UPDATED |
| 3:15-4:15 | Phase 4: Dashboard | React components (Regime, Forecasts, Alerts) | UI working |
| 4:15-4:45 | Phase 5: API | REST endpoints, chat wiring | API functional |
| 4:45-5:45 | Phase 6: Deploy | Deploy agent to Cloud Run, Deploy frontend | Live system |
| 5:45-6:15 | Testing | End-to-end verification | Demo ready |

**Buffer:** 30-60 min for unexpected issues (total 8-9 hours)

---

## Technology Stack

### Backend (ADK Agent)
- **Framework:** Google Agent Development Kit (ADK)
- **Language:** Python 3.10+ with uv package management
- **Agent Types:** LlmAgent, SequentialAgent
- **Models:** Gemini 2.0 Flash
- **Tools:** BigQuery tools, Function tools
- **Deployment:** Google Cloud Run

### Frontend (Dashboard)
- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Layout:** 3-pane design (Sidebar + Dashboard + Chat/Alerts)

### Data Layer
- **Storage:** Google Cloud Storage (GCS)
- **Database:** BigQuery
- **Tables:** 8 input + 2 output ★UPDATED

---

## Data Sources

### Input Data Files (from ai_docs/Ideation/mktprediction_datasets/data/)

| File | Rows | Purpose | Loaded |
|------|------|---------|--------|
| 30_yr_stock_market_data.csv | 7,754 | VIX, indices, commodities | ✅ |
| indexData.csv | 112,457 | OHLCV for technical analysis | ✅ |
| sp500_companies.csv | 503 | Company fundamentals | ❌ NOT LOADED |
| US_Economic_Indicators.csv | 44 | GDP, inflation, unemployment | ✅ |
| stock_news.csv | 26,000 | News headlines + sentiment | ✅ |
| communications.csv | 65,019 | Fed FOMC communications | ✅ |
| acquisitions_update_2021.csv | 1,454 | M&A events | ✅ |
| analyst_ratings_processed.csv | ~5,000 | Analyst ratings, price targets | ✅ ★NEW |
| earnings-call-transcripts/ | ~200 | Earnings call text transcripts (10 tech companies, 2016-2020) | ✅ ★NEW |

**Companies in earnings transcripts:** AAPL, AMD, AMZN, ASML, CSCO, GOOGL, INTC, MSFT, MU, NVDA
(These 10 companies represent ~25-30% of S&P 500 by weight)

### BigQuery Tables

**Input Tables (8 total):**
1. `market_30yr` - VIX and price data (PRIMARY)
2. `index_data` - OHLCV for indices
3. `economic_indicators` - Macro context
4. `stock_news` - News sentiment (optional)
5. `fed_communications` - Fed meeting calendar
6. `acquisitions` - M&A event calendar
7. `analyst_ratings` - Analyst rating changes ★NEW
8. `speech_signals` - Earnings call sentiment (processed via Gemini) ★NEW

**Output Tables (2 total):**
1. `volatility_forecasts` - 1d/5d forecasts with confidence
2. `alerts` - VIX threshold alerts

---

## Agent Architecture

### Agent Hierarchy
```
root_agent (Market Volatility Orchestrator)
├── volatility_workflow (SequentialAgent) - 6 sub-agents ★UPDATED
│   ├── technical_agent → output_key: "technical_signals"
│   ├── event_calendar_agent → output_key: "event_calendar" (includes analyst ratings) ★UPDATED
│   ├── speech_signal_agent → output_key: "speech_signals" ★NEW
│   ├── volatility_synthesis_agent → output_key: "volatility_forecasts"
│   ├── alert_agent → output_key: "alerts"
│   └── persistence_agent → writes to BigQuery
└── chat_agent → answers volatility questions
```

### Session State Flow
```
technical_agent
     │ {current_vix, regime, anomalies}
     ▼
event_calendar_agent
     │ {fed_meetings, mna_events, analyst_ratings} ★UPDATED
     ▼
speech_signal_agent ★NEW
     │ {earnings: [{symbol, tone, guidance, topics, risks}]}
     ▼
volatility_synthesis_agent
     │ reads: {technical_signals}, {event_calendar}, {speech_signals} ★UPDATED
     │ {forecasts: [{symbol, 1d, 5d, confidence}]}
     ▼
alert_agent
     │ {alerts: [{type, severity, message}]}
     ▼
persistence_agent → BigQuery
```

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

## UI Components

### Dashboard Components (Panel 2)
1. **RegimeIndicator** - Shows current VIX level and regime
2. **ForecastTable** - 1d/5d forecasts for SPX, NDX, DJI, RUT
3. **EventCalendar** - Recent Fed meetings and M&A events
4. **AnomalyList** - Z-score anomalies detected

### Chat/Alerts Panel (Panel 3)
1. **AlertsPanel** - Active VIX threshold alerts
2. **ChatPanel** - Reuse existing chat component

---

## Files to Create

### ADK Agent
```
apps/market-signal-agent/
├── market_signal_agent/
│   ├── __init__.py
│   ├── agent.py
│   ├── config.py
│   ├── models.py
│   ├── sub_agents/
│   │   ├── technical_agent/agent.py
│   │   ├── event_calendar_agent/agent.py       ← queries analyst_ratings ★UPDATED
│   │   ├── speech_signal_agent/agent.py        ★NEW
│   │   ├── synthesis_agent/agent.py
│   │   ├── alert_agent/agent.py
│   │   └── persistence_agent/agent.py
│   └── tools/bigquery_tools.py
├── scripts/
│   └── process_transcripts.py                   ★NEW (batch process earnings transcripts)
├── pyproject.toml
└── Dockerfile
```

### Frontend
```
apps/web/
├── app/(protected)/volatility/page.tsx
├── app/api/volatility/
│   ├── forecasts/route.ts
│   ├── alerts/route.ts
│   ├── events/route.ts
│   └── refresh/route.ts
└── components/volatility/
    ├── VolatilityDashboard.tsx
    ├── RegimeIndicator.tsx
    ├── ForecastTable.tsx
    ├── EventCalendar.tsx
    ├── AnomalyList.tsx
    └── AlertsPanel.tsx
```

---

## Phased Implementation

| Phase | Document | Duration | Creates |
|-------|----------|----------|---------|
| 0 | `ph0_setup_data.md` | 45 min | GCS bucket, 8 BigQuery tables, transcript processing ★UPDATED |
| 1 | `ph1_technical_agents.md` | 60 min | technical_agent, event_calendar_agent, speech_signal_agent ★UPDATED |
| 2 | `ph2_synthesis_alerts.md` | 45 min | synthesis_agent (uses 3 signal sources), alert_agent |
| 3 | `ph3_orchestrator.md` | 30 min | root_agent, workflow wiring (6 sub-agents) ★UPDATED |
| 4 | `ph4_dashboard_ui.md` | 60 min | 6 React components |
| 5 | `ph5_api_endpoints.md` | 30 min | 4 API routes |
| 6 | `ph6_deployment.md` | 60 min | Cloud Run deployment |

---

## Success Criteria

### Minimum Viable Product (MVP)
- [ ] 8 BigQuery tables loaded with data ★UPDATED
- [ ] 200 earnings transcripts processed via Gemini ★NEW
- [ ] Technical agent returns VIX level and regime
- [ ] Event calendar agent returns Fed meetings, M&A, analyst ratings ★UPDATED
- [ ] Speech signal agent returns earnings sentiment ★NEW
- [ ] Synthesis agent generates 1d/5d forecasts (uses 3 signal sources) ★UPDATED
- [ ] Alert agent triggers on VIX thresholds
- [ ] Dashboard displays forecasts and alerts
- [ ] API endpoints functional
- [ ] Deployed to Cloud Run

### Demo Requirements
- [ ] Show VIX regime indicator
- [ ] Show volatility forecasts table
- [ ] Show alerts panel with VIX threshold alerts
- [ ] Show analyst rating events in calendar ★NEW
- [ ] Show earnings sentiment influence ★NEW
- [ ] Demonstrate chat asking "Why is volatility elevated?"
- [ ] Show API response format

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| BigQuery setup takes too long | Pre-prepare SQL scripts, use bq CLI |
| Agent debugging issues | Start with simple agents, add complexity |
| UI takes too long | Use existing components, minimal custom styling |
| Deployment fails | Have local demo fallback ready |
| Time overrun | Prioritize core features, skip optional items |

---

## Reference Documents

- `00_system_architecture.md` - All system diagrams and schemas
- `ph0_setup_data.md` through `ph6_deployment.md` - Implementation phases
- `ai_docs/dev_templates/adk_task_template.md` - ADK patterns
