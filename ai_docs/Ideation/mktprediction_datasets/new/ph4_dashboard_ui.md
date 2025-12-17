# Phase 4: Dashboard UI

**Previous Phase:** Phase 3 - Root Orchestrator (COMPLETE)
**Current Phase:** Phase 4 - Dashboard UI
**Next Phase:** Phase 5 - API Endpoints
**Estimated Time:** 60 minutes
**Status:** PENDING

---

## Project Context (Read First)

> **Before starting this phase, review:**
>
> - [00_system_architecture.md](00_system_architecture.md) - UI mockups and component structure
> - [01_project_plan.md](01_project_plan.md) - Project overview

---

## Phase Objectives

1. Create volatility dashboard components
2. Build the volatility page at `/volatility`
3. Integrate with existing 3-panel layout
4. Use mock data initially (API integration in Phase 5)

---

## What This Phase Creates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 4 OUTPUT                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  apps/web/
  ├── app/(protected)/volatility/
  │   └── page.tsx                      ← Volatility dashboard page
  │
  └── components/volatility/
      ├── index.ts                      ← Barrel export
      ├── VolatilityDashboard.tsx       ← Main container
      ├── RegimeIndicator.tsx           ← VIX regime bar
      ├── ForecastTable.tsx             ← 1d/5d forecasts table
      ├── AnomalyList.tsx               ← Z-score anomalies
      └── AlertsPanel.tsx               ← VIX threshold alerts

  Component Hierarchy:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  VolatilityDashboard                                                    │
  │  ├── RegimeIndicator (VIX level + regime bar)                          │
  │  ├── ForecastTable (SPX, NDX, DJI, RUT forecasts)                      │
  │  ├── AnomalyList (detected anomalies)                                   │
  │  └── AlertsPanel (active alerts - collapsible)                         │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- [ ] Phase 3 completed (agent system working)
- [ ] Existing app structure with (protected) layout
- [ ] shadcn/ui components available
- [ ] Tailwind CSS configured

---

## Mock Data Types

**File:** `apps/web/lib/volatility/types.ts`

```typescript
// Volatility data types

export type VolatilityRegime = "low" | "normal" | "elevated" | "extreme";

export interface VolatilityForecast {
  symbol: string;
  volatility_1d: number;
  volatility_5d: number;
  confidence: number;
}

export interface VolatilityData {
  current_vix: number;
  vix_percentile: number;
  regime: VolatilityRegime;
  forecasts: VolatilityForecast[];
  last_updated: string;
}

export interface Anomaly {
  symbol: string;
  type: "price" | "volume";
  zscore: number;
  status: "ANOMALY" | "NORMAL";
}

export interface Alert {
  id: string;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  symbol: string | null;
  message: string;
  vix_value: number | null;
  triggered_at: string;
  is_active: boolean;
}

export interface AlertsData {
  alerts: Alert[];
  has_critical: boolean;
  has_warning: boolean;
}
```

---

## Tasks

### Task 4.1: Create Types File

**File:** `apps/web/lib/volatility/types.ts`

```typescript
// Volatility data types

export type VolatilityRegime = "low" | "normal" | "elevated" | "extreme";

export interface VolatilityForecast {
  symbol: string;
  volatility_1d: number;
  volatility_5d: number;
  confidence: number;
}

export interface VolatilityData {
  current_vix: number;
  vix_percentile: number;
  regime: VolatilityRegime;
  forecasts: VolatilityForecast[];
  last_updated: string;
}

export interface Anomaly {
  symbol: string;
  type: "price" | "volume";
  zscore: number;
  status: "ANOMALY" | "NORMAL";
}

export interface Alert {
  id: string;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  symbol: string | null;
  message: string;
  vix_value: number | null;
  triggered_at: string;
  is_active: boolean;
}

export interface AlertsData {
  alerts: Alert[];
  has_critical: boolean;
  has_warning: boolean;
}

// Mock data for initial development
export const MOCK_VOLATILITY_DATA: VolatilityData = {
  current_vix: 24.5,
  vix_percentile: 78,
  regime: "elevated",
  forecasts: [
    { symbol: "SPX", volatility_1d: 12.5, volatility_5d: 14.2, confidence: 0.82 },
    { symbol: "NDX", volatility_1d: 15.2, volatility_5d: 17.1, confidence: 0.78 },
    { symbol: "DJI", volatility_1d: 10.1, volatility_5d: 11.8, confidence: 0.85 },
    { symbol: "RUT", volatility_1d: 18.3, volatility_5d: 20.5, confidence: 0.74 },
  ],
  last_updated: new Date().toISOString(),
};

export const MOCK_ANOMALIES: Anomaly[] = [
  { symbol: "SPX", type: "volume", zscore: 2.3, status: "ANOMALY" },
  { symbol: "NDX", type: "price", zscore: 0.5, status: "NORMAL" },
  { symbol: "RUT", type: "volume", zscore: -1.8, status: "NORMAL" },
];

export const MOCK_ALERTS: AlertsData = {
  alerts: [
    {
      id: "1",
      alert_type: "vix_elevated",
      severity: "warning",
      symbol: null,
      message: "HIGH volatility - VIX at 24.5, above 20",
      vix_value: 24.5,
      triggered_at: new Date().toISOString(),
      is_active: true,
    },
    {
      id: "2",
      alert_type: "anomaly",
      severity: "info",
      symbol: "SPX",
      message: "SPX volume: 2.3σ above average",
      vix_value: null,
      triggered_at: new Date().toISOString(),
      is_active: true,
    },
  ],
  has_critical: false,
  has_warning: true,
};
```

### Task 4.2: Create RegimeIndicator Component

**File:** `apps/web/components/volatility/RegimeIndicator.tsx`

```typescript
"use client";

import { cn } from "@/lib/utils";
import type { VolatilityRegime } from "@/lib/volatility/types";

interface RegimeIndicatorProps {
  currentVix: number;
  regime: VolatilityRegime;
  percentile: number;
  vixChange?: number;
}

const regimeConfig: Record<
  VolatilityRegime,
  { label: string; color: string; bgColor: string; threshold: string }
> = {
  low: {
    label: "LOW",
    color: "text-green-600",
    bgColor: "bg-green-500",
    threshold: "<15",
  },
  normal: {
    label: "NORMAL",
    color: "text-blue-600",
    bgColor: "bg-blue-500",
    threshold: "15-20",
  },
  elevated: {
    label: "ELEVATED",
    color: "text-yellow-600",
    bgColor: "bg-yellow-500",
    threshold: "20-30",
  },
  extreme: {
    label: "EXTREME",
    color: "text-red-600",
    bgColor: "bg-red-500",
    threshold: ">30",
  },
};

export function RegimeIndicator({
  currentVix,
  regime,
  percentile,
  vixChange,
}: RegimeIndicatorProps): React.ReactElement {
  const config = regimeConfig[regime];

  // Calculate bar position (0-100 scale mapped to VIX 0-50)
  const barPosition = Math.min(100, (currentVix / 50) * 100);

  return (
    <div className="bg-card rounded-lg border p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        VOLATILITY REGIME
      </h3>

      <div className="flex items-center justify-between mb-4">
        <div>
          <span className={cn("text-2xl font-bold", config.color)}>
            {config.label}
          </span>
          <span className="ml-2 text-sm text-muted-foreground">
            ({config.threshold})
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            VIX: {currentVix.toFixed(1)}
            {vixChange !== undefined && (
              <span
                className={cn(
                  "text-sm ml-2",
                  vixChange >= 0 ? "text-red-500" : "text-green-500"
                )}
              >
                {vixChange >= 0 ? "+" : ""}
                {vixChange.toFixed(1)}
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {percentile.toFixed(0)}th Percentile
          </div>
        </div>
      </div>

      {/* Regime Bar */}
      <div className="relative h-4 bg-muted rounded-full overflow-hidden">
        {/* Colored segments */}
        <div className="absolute inset-0 flex">
          <div className="w-[30%] bg-green-200" /> {/* 0-15 */}
          <div className="w-[10%] bg-blue-200" /> {/* 15-20 */}
          <div className="w-[20%] bg-yellow-200" /> {/* 20-30 */}
          <div className="w-[40%] bg-red-200" /> {/* 30-50 */}
        </div>

        {/* Current position indicator */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-foreground"
          style={{ left: `${barPosition}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>LOW</span>
        <span>NORMAL</span>
        <span>ELEVATED</span>
        <span>EXTREME</span>
      </div>
    </div>
  );
}
```

### Task 4.3: Create ForecastTable Component

**File:** `apps/web/components/volatility/ForecastTable.tsx`

```typescript
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import type { VolatilityForecast } from "@/lib/volatility/types";

interface ForecastTableProps {
  forecasts: VolatilityForecast[];
  lastUpdated: string;
}

const symbolNames: Record<string, string> = {
  SPX: "S&P 500",
  NDX: "Nasdaq 100",
  DJI: "Dow Jones",
  RUT: "Russell 2000",
};

export function ForecastTable({
  forecasts,
  lastUpdated,
}: ForecastTableProps): React.ReactElement {
  return (
    <div className="bg-card rounded-lg border">
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-muted-foreground">
          VOLATILITY FORECASTS
        </h3>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead className="text-right">1-Day</TableHead>
            <TableHead className="text-right">5-Day</TableHead>
            <TableHead className="text-right">Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {forecasts.map((forecast) => (
            <TableRow key={forecast.symbol}>
              <TableCell>
                <div>
                  <span className="font-medium">{forecast.symbol}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {symbolNames[forecast.symbol] || forecast.symbol}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {forecast.volatility_1d.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right font-mono">
                {forecast.volatility_5d.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Progress
                    value={forecast.confidence * 100}
                    className="w-16 h-2"
                  />
                  <span className="text-sm font-mono w-12">
                    {(forecast.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="p-3 border-t text-xs text-muted-foreground">
        Last Updated: {new Date(lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}
```

### Task 4.4: Create AnomalyList Component

**File:** `apps/web/components/volatility/AnomalyList.tsx`

```typescript
"use client";

import { AlertCircle, CheckCircle, TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Anomaly } from "@/lib/volatility/types";

interface AnomalyListProps {
  anomalies: Anomaly[];
}

export function AnomalyList({ anomalies }: AnomalyListProps): React.ReactElement {
  const getStatusColor = (status: string, zscore: number): string => {
    if (status === "ANOMALY") {
      return zscore > 0 ? "text-red-500" : "text-orange-500";
    }
    return "text-green-500";
  };

  const getIcon = (type: string): React.ReactElement => {
    return type === "price" ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <BarChart3 className="h-4 w-4" />
    );
  };

  const getStatusIcon = (status: string): React.ReactElement => {
    return status === "ANOMALY" ? (
      <AlertCircle className="h-4 w-4" />
    ) : (
      <CheckCircle className="h-4 w-4" />
    );
  };

  return (
    <div className="bg-card rounded-lg border">
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-muted-foreground">
          ANOMALIES DETECTED
        </h3>
      </div>

      <div className="divide-y">
        {anomalies.map((anomaly, index) => (
          <div
            key={`${anomaly.symbol}-${anomaly.type}-${index}`}
            className="p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "p-1.5 rounded",
                  anomaly.status === "ANOMALY"
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                )}
              >
                {getStatusIcon(anomaly.status)}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{anomaly.symbol}</span>
                  <span className="text-muted-foreground flex items-center gap-1 text-sm">
                    {getIcon(anomaly.type)}
                    {anomaly.type}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {anomaly.status === "ANOMALY"
                    ? `${Math.abs(anomaly.zscore).toFixed(1)}σ ${
                        anomaly.zscore > 0 ? "above" : "below"
                      } average`
                    : "Normal trading patterns"}
                </div>
              </div>
            </div>
            <span
              className={cn(
                "text-sm font-mono",
                getStatusColor(anomaly.status, anomaly.zscore)
              )}
            >
              z={anomaly.zscore.toFixed(2)}
            </span>
          </div>
        ))}

        {anomalies.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            No anomalies detected
          </div>
        )}
      </div>
    </div>
  );
}
```

### Task 4.5: Create AlertsPanel Component

**File:** `apps/web/components/volatility/AlertsPanel.tsx`

```typescript
"use client";

import { AlertTriangle, Info, XCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Alert, AlertsData } from "@/lib/volatility/types";

interface AlertsPanelProps {
  alertsData: AlertsData;
}

const severityConfig = {
  critical: {
    icon: XCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    iconColor: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-700",
    iconColor: "text-yellow-500",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    iconColor: "text-blue-500",
  },
};

export function AlertsPanel({ alertsData }: AlertsPanelProps): React.ReactElement {
  const { alerts, has_critical, has_warning } = alertsData;

  const activeAlerts = alerts.filter((a) => a.is_active);

  return (
    <div className="bg-card rounded-lg border">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">
            ACTIVE ALERTS
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {has_critical && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
              Critical
            </span>
          )}
          {has_warning && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">
              Warning
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            ({activeAlerts.length})
          </span>
        </div>
      </div>

      <div className="divide-y max-h-64 overflow-y-auto">
        {activeAlerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={cn(
                "p-3 border-l-4",
                config.bgColor,
                config.borderColor
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn("h-5 w-5 mt-0.5", config.iconColor)} />
                <div className="flex-1 min-w-0">
                  <div className={cn("font-medium text-sm", config.textColor)}>
                    {alert.severity.toUpperCase()}
                    {alert.symbol && (
                      <span className="ml-2 font-normal">({alert.symbol})</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {alert.message}
                  </p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(alert.triggered_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {activeAlerts.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No active alerts</p>
            <p className="text-xs mt-1">Market conditions are normal</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Task 4.6: Create VolatilityDashboard Component

**File:** `apps/web/components/volatility/VolatilityDashboard.tsx`

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegimeIndicator } from "./RegimeIndicator";
import { ForecastTable } from "./ForecastTable";
import { AnomalyList } from "./AnomalyList";
import { AlertsPanel } from "./AlertsPanel";
import {
  MOCK_VOLATILITY_DATA,
  MOCK_ANOMALIES,
  MOCK_ALERTS,
  type VolatilityData,
  type Anomaly,
  type AlertsData,
} from "@/lib/volatility/types";

export function VolatilityDashboard(): React.ReactElement {
  const [volatilityData, setVolatilityData] = useState<VolatilityData>(
    MOCK_VOLATILITY_DATA
  );
  const [anomalies, setAnomalies] = useState<Anomaly[]>(MOCK_ANOMALIES);
  const [alertsData, setAlertsData] = useState<AlertsData>(MOCK_ALERTS);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls in Phase 5
      // const [forecasts, alerts] = await Promise.all([
      //   fetch('/api/volatility/forecasts').then(r => r.json()),
      //   fetch('/api/volatility/alerts').then(r => r.json()),
      // ]);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Using mock data for now
      setVolatilityData({
        ...MOCK_VOLATILITY_DATA,
        last_updated: new Date().toISOString(),
      });
      setAnomalies(MOCK_ANOMALIES);
      setAlertsData(MOCK_ALERTS);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch volatility data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-4 pb-2">
        <div className="bg-muted rounded-lg px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Market Volatility Forecast</h2>
            <p className="text-sm text-muted-foreground">
              Real-time volatility analysis and predictions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 pt-2">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main Column (2/3 width on lg) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Regime Indicator */}
            <RegimeIndicator
              currentVix={volatilityData.current_vix}
              regime={volatilityData.regime}
              percentile={volatilityData.vix_percentile}
              vixChange={2.3} // TODO: Calculate from API
            />

            {/* Forecast Table */}
            <ForecastTable
              forecasts={volatilityData.forecasts}
              lastUpdated={volatilityData.last_updated}
            />

            {/* Anomaly List */}
            <AnomalyList anomalies={anomalies} />
          </div>

          {/* Sidebar Column (1/3 width on lg) */}
          <div className="space-y-4">
            {/* Alerts Panel */}
            <AlertsPanel alertsData={alertsData} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Task 4.7: Create Barrel Export

**File:** `apps/web/components/volatility/index.ts`

```typescript
export { VolatilityDashboard } from "./VolatilityDashboard";
export { RegimeIndicator } from "./RegimeIndicator";
export { ForecastTable } from "./ForecastTable";
export { AnomalyList } from "./AnomalyList";
export { AlertsPanel } from "./AlertsPanel";
```

### Task 4.8: Create Volatility Page

**File:** `apps/web/app/(protected)/volatility/page.tsx`

```typescript
import { Suspense } from "react";
import { VolatilityDashboard } from "@/components/volatility";

export const dynamic = "force-dynamic";

export default function VolatilityPage(): React.ReactElement {
  return (
    <div className="h-full flex flex-col">
      <header className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Market Volatility Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          VIX analysis, volatility forecasts, and market alerts
        </p>
      </header>
      <Suspense fallback={<VolatilitySkeleton />}>
        <VolatilityDashboard />
      </Suspense>
    </div>
  );
}

function VolatilitySkeleton(): React.ReactElement {
  return (
    <div className="flex-1 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
        <div className="h-48 bg-muted rounded-lg" />
      </div>
    </div>
  );
}
```

### Task 4.9: Add Navigation Link (Optional)

Update `AppSidebar.tsx` to add volatility link:

```typescript
// In the navigation items array, add:
{
  title: "Volatility",
  url: "/volatility",
  icon: TrendingUp, // from lucide-react
}
```

---

## Verification Checklist

- [ ] lib/volatility/types.ts created with types and mock data
- [ ] RegimeIndicator.tsx with VIX bar visualization
- [ ] ForecastTable.tsx with 1d/5d forecasts
- [ ] AnomalyList.tsx with z-score anomalies
- [ ] AlertsPanel.tsx with severity-colored alerts
- [ ] VolatilityDashboard.tsx main container
- [ ] components/volatility/index.ts barrel export
- [ ] app/(protected)/volatility/page.tsx created
- [ ] Page renders without errors
- [ ] Mock data displays correctly
- [ ] Refresh button works

---

## Handoff to Phase 5

**What's Ready:**
- Complete UI components with mock data
- Volatility dashboard at /volatility
- RegimeIndicator, ForecastTable, AnomalyList, AlertsPanel
- Types defined for API integration

**What's Next:**
- Create API routes (/api/volatility/*)
- Connect dashboard to real API
- Replace mock data with BigQuery queries

---

## Prompt for Next Session (Phase 5)

```
`ph5_api_endpoints.md`
Reference: `00_system_architecture.md`, `01_project_plan.md`

I'm continuing the Market Volatility Prediction Agent project.

## Phase 4 (Dashboard UI) is COMPLETE

**What was created:**
- lib/volatility/types.ts with TypeScript types and mock data
- components/volatility/:
  - RegimeIndicator.tsx (VIX regime bar)
  - ForecastTable.tsx (1d/5d forecasts)
  - AnomalyList.tsx (z-score anomalies)
  - AlertsPanel.tsx (severity alerts)
  - VolatilityDashboard.tsx (main container)
- app/(protected)/volatility/page.tsx (dashboard page)

## Now Starting: Phase 5 - API Endpoints

Please read:
1. `ai_docs/Ideation/mktprediction_datasets/new/ph5_api_endpoints.md` - Phase 5 tasks
2. `ai_docs/Ideation/mktprediction_datasets/new/00_system_architecture.md` - API specs

## Key Tasks for Phase 5:
1. Create /api/volatility/forecasts endpoint
2. Create /api/volatility/alerts endpoint
3. Create /api/volatility/events endpoint
4. Create /api/volatility/refresh endpoint
5. Update dashboard to use real API

Please start by reading the phase document.
```
