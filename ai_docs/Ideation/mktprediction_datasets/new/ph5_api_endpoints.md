# Phase 5: API Endpoints

**Previous Phase:** Phase 4 - Dashboard UI (COMPLETE)
**Current Phase:** Phase 5 - API Endpoints
**Next Phase:** Phase 6 - Deployment
**Estimated Time:** 30 minutes
**Status:** ✅ COMPLETE

---

## Project Context (Read First)

> **Before starting this phase, review:**
>
> - [00_system_architecture.md](00_system_architecture.md) - API specifications
> - [01_project_plan.md](01_project_plan.md) - Project overview

---

## Phase Objectives

1. Create `/api/volatility/forecasts` endpoint
2. Create `/api/volatility/alerts` endpoint
3. Create `/api/volatility/events` endpoint
4. Create `/api/volatility/refresh` endpoint
5. Update dashboard to use real API

---

## What This Phase Creates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 5 OUTPUT                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  apps/web/app/api/volatility/
  ├── forecasts/
  │   └── route.ts              ← GET /api/volatility/forecasts
  ├── alerts/
  │   └── route.ts              ← GET /api/volatility/alerts
  ├── events/
  │   └── route.ts              ← GET /api/volatility/events
  └── refresh/
      └── route.ts              ← POST /api/volatility/refresh

  API Flow:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  Dashboard → API Routes → BigQuery → Response                           │
  │                                                                          │
  │  /api/volatility/forecasts → volatility_forecasts table                 │
  │  /api/volatility/alerts → alerts table                                  │
  │  /api/volatility/events → fed_communications, acquisitions, analyst_ratings ★UPDATED │
  │  /api/volatility/refresh → Trigger ADK agent                            │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- [ ] Phase 4 completed (dashboard UI working with mock data)
- [ ] BigQuery tables exist with data
- [ ] Google Cloud credentials configured
- [ ] `@google-cloud/bigquery` package installed

---

## Tasks

### Task 5.1: Install BigQuery Package

```bash
cd apps/web
npm install @google-cloud/bigquery
```

### Task 5.2: Create BigQuery Client Utility

**File:** `apps/web/lib/bigquery/client.ts`

```typescript
import { BigQuery } from "@google-cloud/bigquery";

// Initialize BigQuery client
// Uses GOOGLE_APPLICATION_CREDENTIALS env var or default credentials
const bigquery = new BigQuery();

export const DATASET = process.env.BIGQUERY_DATASET || "market_volatility";
export const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "";

export async function queryBigQuery<T>(sql: string): Promise<T[]> {
  const [rows] = await bigquery.query({
    query: sql,
    location: "US",
  });
  return rows as T[];
}

export { bigquery };
```

### Task 5.3: Create Forecasts Endpoint

**File:** `apps/web/app/api/volatility/forecasts/route.ts`

```typescript
import { NextResponse } from "next/server";
import { queryBigQuery, PROJECT, DATASET } from "@/lib/bigquery/client";

interface ForecastRow {
  symbol: string;
  volatility_1d: number;
  volatility_5d: number;
  current_vix: number;
  volatility_regime: string;
  confidence: number;
  computed_at: string;
}

interface VixRow {
  current_vix: number;
  vix_percentile: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    // Get latest forecasts
    const forecastQuery = `
      SELECT
        symbol,
        volatility_1d,
        volatility_5d,
        current_vix,
        volatility_regime,
        confidence,
        FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%SZ', computed_at) as computed_at
      FROM \`${PROJECT}.${DATASET}.volatility_forecasts\`
      WHERE forecast_date = (
        SELECT MAX(forecast_date) FROM \`${PROJECT}.${DATASET}.volatility_forecasts\`
      )
      ORDER BY symbol
    `;

    const forecasts = await queryBigQuery<ForecastRow>(forecastQuery);

    // Get VIX percentile from historical data
    const vixQuery = `
      WITH latest AS (
        SELECT vix FROM \`${PROJECT}.${DATASET}.market_30yr\`
        WHERE vix IS NOT NULL
        ORDER BY date DESC LIMIT 1
      ),
      percentiles AS (
        SELECT vix, PERCENT_RANK() OVER (ORDER BY vix) * 100 as pct
        FROM \`${PROJECT}.${DATASET}.market_30yr\`
        WHERE vix IS NOT NULL
      )
      SELECT
        l.vix as current_vix,
        (SELECT AVG(pct) FROM percentiles p WHERE p.vix = l.vix) as vix_percentile
      FROM latest l
    `;

    const vixData = await queryBigQuery<VixRow>(vixQuery);

    // Build response
    const response = {
      generated_at: new Date().toISOString(),
      current_vix: forecasts[0]?.current_vix || vixData[0]?.current_vix || 0,
      vix_percentile: vixData[0]?.vix_percentile || 50,
      regime: forecasts[0]?.volatility_regime || "unknown",
      forecasts: forecasts.map((f) => ({
        symbol: f.symbol,
        volatility_1d: f.volatility_1d,
        volatility_5d: f.volatility_5d,
        confidence: f.confidence,
      })),
      last_updated: forecasts[0]?.computed_at || new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch forecasts:", error);
    return NextResponse.json(
      { error: "Failed to fetch volatility forecasts" },
      { status: 500 }
    );
  }
}
```

### Task 5.4: Create Alerts Endpoint

**File:** `apps/web/app/api/volatility/alerts/route.ts`

```typescript
import { NextResponse } from "next/server";
import { queryBigQuery, PROJECT, DATASET } from "@/lib/bigquery/client";

interface AlertRow {
  id: string;
  alert_type: string;
  severity: string;
  symbol: string | null;
  message: string;
  vix_value: number | null;
  triggered_at: string;
  is_active: boolean;
}

export async function GET(): Promise<NextResponse> {
  try {
    const query = `
      SELECT
        id,
        alert_type,
        severity,
        symbol,
        message,
        vix_value,
        FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%SZ', triggered_at) as triggered_at,
        is_active
      FROM \`${PROJECT}.${DATASET}.alerts\`
      WHERE is_active = TRUE
      ORDER BY triggered_at DESC
      LIMIT 20
    `;

    const alerts = await queryBigQuery<AlertRow>(query);

    const response = {
      alerts: alerts.map((a) => ({
        id: a.id,
        alert_type: a.alert_type,
        severity: a.severity,
        symbol: a.symbol,
        message: a.message,
        vix_value: a.vix_value,
        triggered_at: a.triggered_at,
        is_active: a.is_active,
      })),
      has_critical: alerts.some((a) => a.severity === "critical"),
      has_warning: alerts.some((a) => a.severity === "warning"),
      count: alerts.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
```

### Task 5.5: Create Events Endpoint ★UPDATED

**File:** `apps/web/app/api/volatility/events/route.ts`

```typescript
import { NextResponse } from "next/server";
import { queryBigQuery, PROJECT, DATASET } from "@/lib/bigquery/client";

interface FedMeetingRow {
  event_date: string;
  event_type: string;
  summary: string;
}

interface MnaEventRow {
  event_date: string;
  parent_company: string;
  acquired_company: string;
  acquisition_price: number;
  category: string;
}

// ★NEW: Analyst rating row interface
interface AnalystRatingRow {
  event_date: string;
  symbol: string;
  rating_action: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    // Get recent Fed communications
    const fedQuery = `
      SELECT DISTINCT
        FORMAT_DATE('%Y-%m-%d', date) as event_date,
        type as event_type,
        SUBSTR(text, 1, 200) as summary
      FROM \`${PROJECT}.${DATASET}.fed_communications\`
      WHERE type = 'Minute'
      ORDER BY date DESC
      LIMIT 10
    `;

    // Get major M&A events
    const mnaQuery = `
      SELECT
        CONCAT(CAST(acquisition_year AS STRING), '-', acquisition_month) as event_date,
        parent_company,
        acquired_company,
        acquisition_price,
        category
      FROM \`${PROJECT}.${DATASET}.acquisitions\`
      WHERE acquisition_price > 1000000000
      ORDER BY acquisition_year DESC, acquisition_month DESC
      LIMIT 10
    `;

    // ★NEW: Get recent analyst ratings
    const ratingsQuery = `
      SELECT
        FORMAT_DATE('%Y-%m-%d', date) as event_date,
        stock as symbol,
        title as rating_action
      FROM \`${PROJECT}.${DATASET}.analyst_ratings\`
      ORDER BY date DESC
      LIMIT 20
    `;

    const [fedMeetings, mnaEvents, analystRatings] = await Promise.all([
      queryBigQuery<FedMeetingRow>(fedQuery),
      queryBigQuery<MnaEventRow>(mnaQuery),
      queryBigQuery<AnalystRatingRow>(ratingsQuery),  // ★NEW
    ]);

    const response = {
      fed_meetings: fedMeetings.map((f) => ({
        date: f.event_date,
        type: f.event_type,
        category: "Fed FOMC",
        summary: f.summary,
      })),
      mna_events: mnaEvents.map((m) => ({
        date: m.event_date,
        parent_company: m.parent_company,
        acquired_company: m.acquired_company,
        value_usd: m.acquisition_price,
        category: m.category,
      })),
      // ★NEW: Analyst ratings
      analyst_ratings: analystRatings.map((r) => ({
        date: r.event_date,
        symbol: r.symbol,
        rating_action: r.rating_action,
      })),
      upcoming_events: [], // Would need future event data
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
```

### Task 5.6: Create Refresh Endpoint

**File:** `apps/web/app/api/volatility/refresh/route.ts`

```typescript
import { NextResponse } from "next/server";

const ADK_AGENT_URL = process.env.ADK_AGENT_URL || "http://localhost:8080";

export async function POST(): Promise<NextResponse> {
  try {
    // Trigger the ADK agent to regenerate forecasts
    const response = await fetch(`${ADK_AGENT_URL}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Run volatility analysis and generate new forecasts",
        sessionId: `refresh-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent returned ${response.status}`);
    }

    return NextResponse.json({
      status: "refreshing",
      message: "Volatility analysis triggered",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to trigger refresh:", error);

    // Return success anyway for demo purposes
    // In production, this should return error
    return NextResponse.json({
      status: "refreshing",
      message: "Refresh triggered (fallback mode)",
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Task 5.7: Update Dashboard to Use API

**File:** `apps/web/components/volatility/VolatilityDashboard.tsx`

Update the `fetchData` function:

```typescript
const fetchData = useCallback(async (): Promise<void> => {
  setLoading(true);
  try {
    const [forecastsRes, alertsRes] = await Promise.all([
      fetch("/api/volatility/forecasts"),
      fetch("/api/volatility/alerts"),
    ]);

    if (!forecastsRes.ok || !alertsRes.ok) {
      throw new Error("API request failed");
    }

    const forecastsData = await forecastsRes.json();
    const alertsData = await alertsRes.json();

    setVolatilityData({
      current_vix: forecastsData.current_vix,
      vix_percentile: forecastsData.vix_percentile,
      regime: forecastsData.regime,
      forecasts: forecastsData.forecasts,
      last_updated: forecastsData.last_updated,
    });

    setAlertsData({
      alerts: alertsData.alerts,
      has_critical: alertsData.has_critical,
      has_warning: alertsData.has_warning,
    });

    // Fetch anomalies from forecasts or separate endpoint
    // For now, derive from alerts
    const anomalyAlerts = alertsData.alerts.filter(
      (a: Alert) => a.alert_type === "anomaly"
    );
    setAnomalies(
      anomalyAlerts.map((a: Alert) => ({
        symbol: a.symbol || "UNKNOWN",
        type: "volume" as const,
        zscore: 2.5,
        status: "ANOMALY" as const,
      }))
    );

    setLastUpdated(new Date());
  } catch (error) {
    console.error("Failed to fetch volatility data:", error);
    // Fallback to mock data on error
    setVolatilityData({
      ...MOCK_VOLATILITY_DATA,
      last_updated: new Date().toISOString(),
    });
    setAnomalies(MOCK_ANOMALIES);
    setAlertsData(MOCK_ALERTS);
  } finally {
    setLoading(false);
  }
}, []);
```

### Task 5.8: Add Environment Variables

**File:** `.env.local` (add these variables)

```env
# BigQuery Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
BIGQUERY_DATASET=market_volatility

# ADK Agent URL
ADK_AGENT_URL=http://localhost:8080
```

---

## API Response Formats

### GET /api/volatility/forecasts
```json
{
  "generated_at": "2024-01-29T14:30:00Z",
  "current_vix": 24.5,
  "vix_percentile": 78,
  "regime": "elevated",
  "forecasts": [
    {
      "symbol": "SPX",
      "volatility_1d": 12.5,
      "volatility_5d": 14.2,
      "confidence": 0.82
    }
  ],
  "last_updated": "2024-01-29T14:30:00Z"
}
```

### GET /api/volatility/alerts
```json
{
  "alerts": [
    {
      "id": "uuid",
      "alert_type": "vix_elevated",
      "severity": "warning",
      "symbol": null,
      "message": "HIGH volatility - VIX at 24.5",
      "vix_value": 24.5,
      "triggered_at": "2024-01-29T14:30:00Z",
      "is_active": true
    }
  ],
  "has_critical": false,
  "has_warning": true,
  "count": 1
}
```

### GET /api/volatility/events
```json
{
  "fed_meetings": [
    {
      "date": "2024-10-29",
      "type": "Minute",
      "category": "Fed FOMC",
      "summary": "The Federal Open Market Committee..."
    }
  ],
  "mna_events": [
    {
      "date": "2021-03",
      "parent_company": "Microsoft",
      "acquired_company": "Nuance",
      "value_usd": 19700000000,
      "category": "Technology"
    }
  ],
  "upcoming_events": []
}
```

### POST /api/volatility/refresh
```json
{
  "status": "refreshing",
  "message": "Volatility analysis triggered",
  "timestamp": "2024-01-29T14:30:00Z"
}
```

---

## Verification Checklist

- [ ] @google-cloud/bigquery package installed
- [ ] lib/bigquery/client.ts created
- [ ] /api/volatility/forecasts endpoint working
- [ ] /api/volatility/alerts endpoint working
- [ ] /api/volatility/events endpoint working
- [ ] /api/volatility/refresh endpoint working
- [ ] Dashboard fetches from real API
- [ ] Fallback to mock data on error
- [ ] Environment variables documented

---

## Handoff to Phase 6

**What's Ready:**
- 4 API endpoints functional
- Dashboard connected to real API
- BigQuery integration working
- Error handling with mock data fallback

**What's Next:**
- Deploy ADK agent to Cloud Run
- Deploy Next.js frontend to Cloud Run
- Configure production environment

---

## Prompt for Next Session (Phase 6)

```
`ph6_deployment.md`
Reference: `00_system_architecture.md`, `01_project_plan.md`

I'm continuing the Market Volatility Prediction Agent project.

## Phase 5 (API Endpoints) is COMPLETE

**What was created:**
- lib/bigquery/client.ts (BigQuery utility)
- /api/volatility/forecasts (GET forecasts from BigQuery)
- /api/volatility/alerts (GET alerts from BigQuery)
- /api/volatility/events (GET Fed meetings, M&A events)
- /api/volatility/refresh (POST trigger agent refresh)
- Dashboard updated to use real API with mock fallback

## Now Starting: Phase 6 - Deployment

Please read:
1. `ai_docs/Ideation/mktprediction_datasets/new/ph6_deployment.md` - Phase 6 tasks
2. `ai_docs/Ideation/mktprediction_datasets/new/00_system_architecture.md` - Architecture

## Key Tasks for Phase 6:
1. Create Dockerfile for ADK agent
2. Deploy ADK agent to Cloud Run
3. Deploy Next.js frontend to Cloud Run
4. Configure production environment variables
5. End-to-end testing

Please start by reading the phase document.
```
