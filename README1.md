<div align="center">

# Market Pulse

<img src="apps/web/public/logo.png" alt="Market Pulse" width="140" />

### AI-Powered Volatility Prediction Platform

*Built with Google Agent Development Kit (ADK) for the Google Cloud AI/ML Hackathon*

[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/)
[![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [Deployment](#-deployment) · [Demo](#-demo)

---

</div>

## Overview

**Market Pulse** is a production-ready multi-agent AI system for volatility prediction and market analysis:

| Signal Type | Source | Technology |
|-------------|--------|------------|
| **Volatility Forecasts** | VIX & Index data | BigQuery z-score anomaly detection |
| **News Signals** | Global news | GDELT sentiment analysis |
| **Speech Signals** | Earnings calls | Cloud Speech-to-Text + Gemini |

> **Hackathon Theme:** *"Building Low-Latency ML Pipeline That Extracts Signals From Multi-Source Time Series Data"*

---

## Architecture

<p align="center">
  <img src="ai_docs/mkt_plan_folder/diagrams/System_Arch.png" alt="System Architecture" width="800" />
</p>

### Agent Hierarchy

```
Root Orchestrator Agent
├── Market Data Agent    → BigQuery z-score anomaly detection
├── News Signal Agent    → GDELT sentiment analysis
├── Speech Signal Agent  → Earnings call transcript analysis
└── Synthesis Agent      → Weighted signal fusion & scoring
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Multi-Agent Architecture** | Specialized agents orchestrated by Google ADK |
| **Real-Time Anomaly Detection** | BigQuery ML z-score calculations |
| **GDELT News Integration** | Free global news sentiment via BigQuery |
| **Speech-to-Text Analysis** | Cloud Speech-to-Text v2 (Chirp 2) |
| **Configurable Profiles** | Quant, Fundamental, News, Balanced |
| **Interactive Dashboard** | Two-pane layout with AI chat |
| **Production Ready** | Deployed on GCP (Agent Engine + Cloud Run) |

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
- **Cloud STT v2** - Transcription

</td>
<td width="33%" valign="top">

### Infrastructure
- **Vertex AI Agent Engine**
- **Cloud Run**
- **Cloud Functions**
- **Cloud Storage**
- **Supabase** (Auth + DB)

</td>
</tr>
</table>

---

## Quick Start

### Prerequisites

- Node.js 20+ · Python 3.10+ · [uv](https://github.com/astral-sh/uv) · gcloud CLI · Supabase account

### Installation

```bash
# Clone and install
git clone https://github.com/sureshksv-aiml/adk-gcp-mq-bkt.git
cd adk-gcp-mq-bkt
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

## Signal Profiles

| Profile | Market | News | Speech | Best For |
|:--------|:------:|:----:|:------:|:---------|
| **Quant** | 60% | 30% | 10% | Technical traders |
| **Fundamental** | 30% | 20% | 50% | Long-term investors |
| **News** | 20% | 50% | 30% | News-driven trading |
| **Balanced** | 33% | 33% | 34% | General analysis |

---

## Deployment

### Production Environment

| Component | URL / Location |
|-----------|----------------|
| **Frontend** | https://gcp-bq-reports-web-prod-l627dbs7ja-uc.a.run.app |
| **Agent Engine** | Vertex AI Agent Engine (us-central1) |
| **GCP Project** | adk-mkt-signal |

### Deploy Commands

```bash
npm run deploy:adk   # Deploy agent to Agent Engine
npm run deploy:web   # Deploy frontend to Cloud Run
```

---

## Project Structure

```
apps/
├── web/                        # Next.js frontend
│   ├── app/(protected)/        # Dashboard, Chat, History
│   ├── components/             # React components
│   └── lib/                    # Utilities
│
└── market-signal-agent/        # ADK agent system
    ├── market_signal_agent/
    │   ├── agent.py            # Root orchestrator
    │   └── sub_agents/         # Market, News, Speech, Synthesis
    └── cloud_functions/        # Audio processing
```

---

## Data Sources

| Source | Provider | Cost |
|--------|----------|:----:|
| Stock Prices | yfinance → BigQuery | Free |
| Crypto Prices | BigQuery Public | Free |
| News Sentiment | GDELT | Free |
| Earnings Calls | User uploads | Free* |

<sub>*Cloud Speech-to-Text usage fees apply</sub>

---

## Demo

> *"Welcome to Market Signal Intelligence - a multi-source signal analysis platform built with Google's Agent Development Kit.*
>
> *The dashboard shows all tracked tickers with computed risk scores, combining market data from BigQuery, news sentiment from GDELT, and earnings call analysis.*
>
> *For Tesla, we see a high risk score due to a +2.1 sigma price deviation. When switching to the Quant profile, the score increases because this profile weights market signals at 60%.*
>
> *Ask natural language questions like 'Why is TSLA high risk despite positive news?' and generate reports to share with your team."*

---

## Cost Estimate

| Service | Monthly |
|---------|--------:|
| Cloud Run | $5-10 |
| Agent Engine | $10-20 |
| BigQuery | $5-10 |
| Cloud Functions | $1-2 |
| Speech-to-Text | $2-5 |
| Gemini API | $10-20 |
| **Total** | **~$35-70** |

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all development servers |
| `npm run build` | Build for production |
| `npm run type-check` | TypeScript checking |
| `npm run deploy:adk` | Deploy agent |
| `npm run deploy:web` | Deploy frontend |

---

<div align="center">

### Built With

[![Google ADK](https://img.shields.io/badge/Google%20ADK-4285F4?style=flat-square&logo=google&logoColor=white)](https://google.github.io/adk-docs/)
[![GDELT](https://img.shields.io/badge/GDELT-333333?style=flat-square)](https://www.gdeltproject.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=flat-square)](https://ui.shadcn.com/)

---

*Created for the Google Cloud AI/ML Hackathon*

</div>
