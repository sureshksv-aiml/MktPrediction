"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegimeIndicator } from "./RegimeIndicator";
import { ForecastTable } from "./ForecastTable";
import { AnomalyList } from "./AnomalyList";
import { EventsCalendar } from "./EventsCalendar";
import {
  MOCK_VOLATILITY_DATA,
  MOCK_ANOMALIES,
  convertAnomalies,
  type VolatilityData,
  type Anomaly,
  type ForecastsResponse,
  type AnomaliesResponse,
  type VolatilityMetrics,
} from "@/lib/volatility/types";

interface VolatilityDashboardProps {
  onDataUpdate?: (data: { volatilityData: VolatilityData; anomalies: Anomaly[] }) => void;
}

export function VolatilityDashboard({ onDataUpdate }: VolatilityDashboardProps): React.ReactElement {
  const [volatilityData, setVolatilityData] = useState<VolatilityData>(MOCK_VOLATILITY_DATA);
  const [anomalies, setAnomalies] = useState<Anomaly[]>(MOCK_ANOMALIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Fetch data from all APIs in parallel
      const [metricsRes, forecastsRes, anomaliesRes] = await Promise.all([
        fetch("/api/volatility/metrics"),
        fetch("/api/volatility/forecasts"),
        fetch("/api/volatility/anomalies"),
      ]);

      // Check for errors
      if (!metricsRes.ok || !forecastsRes.ok || !anomaliesRes.ok) {
        throw new Error("Failed to fetch data from one or more APIs");
      }

      const [metrics, forecasts, anomaliesData] = await Promise.all([
        metricsRes.json() as Promise<VolatilityMetrics>,
        forecastsRes.json() as Promise<ForecastsResponse>,
        anomaliesRes.json() as Promise<AnomaliesResponse>,
      ]);

      // Combine metrics and forecasts into VolatilityData
      const newVolatilityData: VolatilityData = {
        current_vix: metrics.current_vix,
        vix_change: metrics.vix_change,
        vix_percentile: metrics.vix_percentile,
        regime: metrics.regime,
        forecasts: forecasts.forecasts,
        last_updated: new Date().toISOString(),
        data_date: metrics.data_date,
        historical_vol_20d: metrics.historical_vol_20d,
      };

      // Convert raw anomalies to display format
      const displayAnomalies = convertAnomalies(anomaliesData.anomalies);

      setVolatilityData(newVolatilityData);
      setAnomalies(displayAnomalies);
      setLastUpdated(new Date());

      // Notify parent of data update
      if (onDataUpdate) {
        onDataUpdate({ volatilityData: newVolatilityData, anomalies: displayAnomalies });
      }
    } catch (err) {
      console.error("Failed to fetch volatility data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");

      // Use mock data as fallback
      const mockData = {
        ...MOCK_VOLATILITY_DATA,
        last_updated: new Date().toISOString(),
      };
      setVolatilityData(mockData);
      setAnomalies(MOCK_ANOMALIES);

      if (onDataUpdate) {
        onDataUpdate({ volatilityData: mockData, anomalies: MOCK_ANOMALIES });
      }
    } finally {
      setLoading(false);
    }
  }, [onDataUpdate]);

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
              {volatilityData.data_date
                ? `Data as of ${volatilityData.data_date} (Historical)`
                : "Real-time volatility analysis and predictions"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline" suppressHydrationWarning>
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

        {/* Error Banner */}
        {error && (
          <div className="mt-2 bg-destructive/10 text-destructive rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error} - Showing mock data</span>
          </div>
        )}
      </div>

      {/* Main Content - 2-Column Layout */}
      <div className="flex-1 p-4 pt-2 min-h-0 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Left Column */}
          <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
            {/* Regime Indicator - Compact */}
            <div className="shrink-0">
              <RegimeIndicator
                currentVix={volatilityData.current_vix}
                regime={volatilityData.regime}
                percentile={volatilityData.vix_percentile}
                vixChange={volatilityData.vix_change}
                historicalVol20d={volatilityData.historical_vol_20d}
              />
            </div>

            {/* Forecast Table - Expands */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ForecastTable
                forecasts={volatilityData.forecasts}
                lastUpdated={volatilityData.last_updated}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
            {/* Anomaly List - Compact */}
            <div className="shrink-0">
              <AnomalyList anomalies={anomalies} />
            </div>

            {/* Events Calendar - Expands */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <EventsCalendar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
