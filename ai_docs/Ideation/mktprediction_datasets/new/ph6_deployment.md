# Phase 6: Deployment

**Previous Phase:** Phase 5 - API Endpoints (COMPLETE)
**Current Phase:** Phase 6 - Deployment
**Next Phase:** None (FINAL PHASE)
**Estimated Time:** 60 minutes
**Status:** PENDING

---

## Project Context (Read First)

> **Before starting this phase, review:**
>
> - [00_system_architecture.md](00_system_architecture.md) - Deployment architecture
> - [01_project_plan.md](01_project_plan.md) - Project overview

---

## Phase Objectives

1. Create Dockerfile for ADK agent
2. Deploy ADK agent to Cloud Run
3. Deploy Next.js frontend to Cloud Run
4. Configure production environment
5. End-to-end verification

---

## What This Phase Creates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 6 OUTPUT                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  Cloud Run Services:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                          │
  │  market-signal-agent                market-signal-web           │
  │  (ADK Python Agent)                     (Next.js Frontend)              │
  │                                                                          │
  │  URL: https://market-volatility-       URL: https://market-volatility-  │
  │       agent-xxxxx.run.app                   web-xxxxx.run.app           │
  │                                                                          │
  │  Dockerfile                            Next.js build                     │
  │  ├── Python 3.11                       ├── Node.js 20                    │
  │  ├── uv package manager                ├── npm ci                        │
  │  └── google-adk                        └── npm run build                 │
  │                                                                          │
  └─────────────────────────────────────────────────────────────────────────┘

  Environment Variables:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  ADK Agent:                                                              │
  │  - GOOGLE_CLOUD_PROJECT                                                  │
  │  - BIGQUERY_DATASET=market_volatility                                   │
  │                                                                          │
  │  Frontend:                                                               │
  │  - GOOGLE_CLOUD_PROJECT                                                  │
  │  - BIGQUERY_DATASET=market_volatility                                   │
  │  - ADK_AGENT_URL=https://market-signal-agent-xxxxx.run.app          │
  │  - NEXT_PUBLIC_SITE_URL=https://market-signal-web-xxxxx.run.app     │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- [ ] Phase 5 completed (API endpoints working locally)
- [ ] Google Cloud project with billing enabled
- [ ] `gcloud` CLI authenticated
- [ ] Cloud Run API enabled
- [ ] Artifact Registry API enabled

---

## Tasks

### Task 6.1: Verify GCP Setup

```bash
# Set project
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable bigquery.googleapis.com

# Verify authentication
gcloud auth list
```

### Task 6.2: Create ADK Agent Dockerfile

**File:** `apps/market-signal-agent/Dockerfile`

```dockerfile
# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
RUN pip install uv

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies
RUN uv pip install --system -e .

# Copy application code
COPY market_signal_agent/ ./market_signal_agent/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Expose port
EXPOSE 8080

# Run the ADK server
CMD ["python", "-m", "google.adk.cli", "api_server", "--host", "0.0.0.0", "--port", "8080", "market_signal_agent"]
```

### Task 6.3: Create .dockerignore for Agent

**File:** `apps/market-signal-agent/.dockerignore`

```
__pycache__
*.pyc
*.pyo
.git
.gitignore
.env
.venv
venv
*.egg-info
.pytest_cache
.mypy_cache
README.md
tests/
```

### Task 6.4: Deploy ADK Agent to Cloud Run

```bash
cd apps/market-signal-agent

# Build and deploy using Cloud Build
gcloud run deploy market-signal-agent \
    --source . \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID,BIGQUERY_DATASET=market_volatility"

# Get the service URL
gcloud run services describe market-signal-agent \
    --region us-central1 \
    --format 'value(status.url)'
```

Save the agent URL (e.g., `https://market-signal-agent-xxxxx-uc.a.run.app`)

### Task 6.5: Test Agent Deployment

```bash
# Test the agent endpoint
AGENT_URL=$(gcloud run services describe market-signal-agent --region us-central1 --format 'value(status.url)')

# Health check
curl -X GET "$AGENT_URL/health"

# Test agent
curl -X POST "$AGENT_URL/run" \
    -H "Content-Type: application/json" \
    -d '{"message": "What is the current VIX level?", "sessionId": "test-123"}'
```

### Task 6.6: Update Frontend Environment

**File:** `apps/web/.env.production`

```env
# Production environment variables
GOOGLE_CLOUD_PROJECT=your-project-id
BIGQUERY_DATASET=market_volatility
ADK_AGENT_URL=https://market-signal-agent-xxxxx-uc.a.run.app
NEXT_PUBLIC_SITE_URL=https://market-signal-web-xxxxx-uc.a.run.app
```

### Task 6.7: Create Frontend Dockerfile (Optional)

If not using Cloud Run source deployment:

**File:** `apps/web/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 8080

CMD ["node", "server.js"]
```

### Task 6.8: Deploy Frontend to Cloud Run

```bash
cd apps/web

# Option A: Source deployment (simpler)
gcloud run deploy market-signal-web \
    --source . \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID,BIGQUERY_DATASET=market_volatility,ADK_AGENT_URL=$AGENT_URL"

# Get the frontend URL
gcloud run services describe market-signal-web \
    --region us-central1 \
    --format 'value(status.url)'
```

### Task 6.9: Configure Service Account Permissions

```bash
# Get the Cloud Run service account
SA_EMAIL=$(gcloud run services describe market-signal-web \
    --region us-central1 \
    --format 'value(spec.template.spec.serviceAccountName)')

# Grant BigQuery access
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/bigquery.jobUser"

# Grant same permissions to agent service account
AGENT_SA=$(gcloud run services describe market-signal-agent \
    --region us-central1 \
    --format 'value(spec.template.spec.serviceAccountName)')

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$AGENT_SA" \
    --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$AGENT_SA" \
    --role="roles/bigquery.jobUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$AGENT_SA" \
    --role="roles/bigquery.dataEditor"
```

### Task 6.10: End-to-End Testing

```bash
# Get frontend URL
FRONTEND_URL=$(gcloud run services describe market-signal-web \
    --region us-central1 \
    --format 'value(status.url)')

# Test API endpoints
curl "$FRONTEND_URL/api/volatility/forecasts"
curl "$FRONTEND_URL/api/volatility/alerts"
curl "$FRONTEND_URL/api/volatility/events"

# Test refresh (triggers agent)
curl -X POST "$FRONTEND_URL/api/volatility/refresh"

# Open in browser
echo "Frontend URL: $FRONTEND_URL/volatility"
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All local tests passing
- [ ] Environment variables documented
- [ ] Dockerfiles created
- [ ] .dockerignore files created

### ADK Agent Deployment
- [ ] Cloud Run service created
- [ ] Agent responds to health check
- [ ] Agent can query BigQuery
- [ ] Agent can write to BigQuery

### Frontend Deployment
- [ ] Cloud Run service created
- [ ] Frontend loads successfully
- [ ] API endpoints return data
- [ ] Refresh triggers agent

### Post-Deployment
- [ ] Service account permissions configured
- [ ] End-to-end flow working
- [ ] Dashboard displays real data
- [ ] Alerts showing correctly

---

## Troubleshooting

### Agent Not Responding
```bash
# Check logs
gcloud run logs read market-signal-agent --region us-central1 --limit 50

# Check service status
gcloud run services describe market-signal-agent --region us-central1
```

### BigQuery Permission Errors
```bash
# Verify service account
gcloud run services describe market-signal-agent \
    --region us-central1 \
    --format 'value(spec.template.spec.serviceAccountName)'

# Check IAM bindings
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.role:bigquery"
```

### Frontend Build Failures
```bash
# Check build logs
gcloud builds list --limit 5

# View specific build
gcloud builds log BUILD_ID
```

---

## Production URLs

After deployment, your services will be available at:

| Service | URL |
|---------|-----|
| ADK Agent | `https://market-signal-agent-xxxxx-uc.a.run.app` |
| Frontend | `https://market-signal-web-xxxxx-uc.a.run.app` |
| Dashboard | `https://market-signal-web-xxxxx-uc.a.run.app/volatility` |

---

## Verification Checklist

- [ ] ADK agent deployed to Cloud Run
- [ ] Agent health check passes
- [ ] Frontend deployed to Cloud Run
- [ ] Dashboard page loads
- [ ] Forecasts API returns data
- [ ] Alerts API returns data
- [ ] Events API returns data
- [ ] Refresh triggers agent
- [ ] End-to-end flow works

---

## Project Complete!

Congratulations! The Market Volatility Prediction Agent is now deployed and running.

### What Was Built

1. **ADK Agent System**
   - Root orchestrator with 2 sub-agents
   - Sequential workflow with 5 specialized agents
   - BigQuery integration for data and persistence
   - Chat agent for Q&A

2. **Next.js Dashboard**
   - Volatility regime indicator
   - Forecast table with confidence
   - Anomaly detection display
   - Alert panel with severity

3. **REST API**
   - GET /api/volatility/forecasts
   - GET /api/volatility/alerts
   - GET /api/volatility/events
   - POST /api/volatility/refresh

4. **GCP Infrastructure**
   - BigQuery dataset with 8 tables
   - Cloud Run services (agent + frontend)
   - GCS bucket for raw data

### Demo Script

1. Open dashboard: `$FRONTEND_URL/volatility`
2. Show VIX regime indicator (elevated/normal)
3. Show volatility forecasts (SPX, NDX, DJI, RUT)
4. Show active alerts
5. Click Refresh to trigger agent
6. Ask chat: "Why is volatility elevated?"

---

## Future Enhancements (Post-Hackathon)

1. **Real-time Data**
   - WebSocket for live VIX updates
   - External market data API integration

2. **Advanced Forecasting**
   - Machine learning models
   - Longer forecast horizons (30d, 90d)

3. **Scenario Simulation**
   - "What if VIX reaches 40?"
   - Historical event replay

4. **Authentication**
   - User accounts
   - Role-based access

5. **Notifications**
   - Email alerts
   - Slack integration
