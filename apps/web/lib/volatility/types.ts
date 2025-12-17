// Volatility data types for dashboard

export type VolatilityRegime = "low" | "normal" | "elevated" | "extreme";

// API Response: /api/volatility/metrics
export interface VolatilityMetrics {
  data_date: string;
  current_vix: number;
  vix_change: number;
  vix_percentile: number;
  regime: VolatilityRegime;
  historical_vol_20d: number;
}

// API Response: /api/volatility/forecasts
export interface VolatilityForecast {
  symbol: string;
  volatility_1d: number;
  volatility_5d: number;
  confidence: number;
}

export interface ForecastsResponse {
  forecasts: VolatilityForecast[];
  current_vix: number;
  regime: VolatilityRegime;
  data_date: string;
}

// Combined data for dashboard display
export interface VolatilityData {
  current_vix: number;
  vix_change: number;
  vix_percentile: number;
  regime: VolatilityRegime;
  forecasts: VolatilityForecast[];
  last_updated: string;
  data_date: string;
  historical_vol_20d?: number;
}

// API Response: /api/volatility/anomalies (raw from BigQuery)
export interface RawAnomaly {
  symbol: string;
  date: string;
  close_price: number;
  price_zscore: number;
  volume_zscore: number;
  price_status: "ANOMALY" | "NORMAL";
  volume_status: "ANOMALY" | "NORMAL";
}

export interface AnomaliesResponse {
  anomalies: RawAnomaly[];
}

// Simplified anomaly for display
export interface Anomaly {
  symbol: string;
  type: "price" | "volume";
  zscore: number;
  status: "ANOMALY" | "NORMAL";
}

// API Response: /api/volatility/alerts
export interface Alert {
  id: string;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  symbol: string | null;
  message: string;
  vix_value: number | null;
  triggered_at: string;
}

export interface AlertsData {
  alerts: Alert[];
  has_critical: boolean;
  has_warning: boolean;
}

// API Response: /api/volatility/events
export interface FedEvent {
  date: string;
  release_date: string | null;
  type: string;
  summary: string;
}

export interface AnalystRating {
  date: string;
  title: string;
  stock: string;
}

export interface MnAEvent {
  year: number;
  month: string;
  parent_company: string;
  acquired_company: string;
  price: number | null;
  category: string;
}

export interface EventCalendarData {
  fed_meetings: FedEvent[];
  analyst_ratings: AnalystRating[];
  mna_events: MnAEvent[];
}

// Mock data for fallback (kept for development/testing)
export const MOCK_VOLATILITY_DATA: VolatilityData = {
  current_vix: 24.5,
  vix_change: 2.3,
  vix_percentile: 78,
  regime: "elevated",
  forecasts: [
    { symbol: "SPX", volatility_1d: 12.5, volatility_5d: 14.2, confidence: 0.82 },
    { symbol: "NDX", volatility_1d: 15.2, volatility_5d: 17.1, confidence: 0.78 },
    { symbol: "DJI", volatility_1d: 10.1, volatility_5d: 11.8, confidence: 0.85 },
    { symbol: "RUT", volatility_1d: 18.3, volatility_5d: 20.5, confidence: 0.74 },
  ],
  last_updated: new Date().toISOString(),
  data_date: "2023-11-29",
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
    },
    {
      id: "2",
      alert_type: "anomaly",
      severity: "info",
      symbol: "SPX",
      message: "SPX volume: 2.3σ above average",
      vix_value: null,
      triggered_at: new Date().toISOString(),
    },
  ],
  has_critical: false,
  has_warning: true,
};

// Helper function to convert API anomalies to display format
export function convertAnomalies(rawAnomalies: RawAnomaly[]): Anomaly[] {
  const result: Anomaly[] = [];

  for (const a of rawAnomalies) {
    // Add price anomaly entry
    result.push({
      symbol: a.symbol,
      type: "price",
      zscore: a.price_zscore,
      status: a.price_status,
    });
    // Add volume anomaly entry
    result.push({
      symbol: a.symbol,
      type: "volume",
      zscore: a.volume_zscore,
      status: a.volume_status,
    });
  }

  // Sort by anomaly status first (ANOMALY first), then by absolute z-score
  result.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "ANOMALY" ? -1 : 1;
    }
    return Math.abs(b.zscore) - Math.abs(a.zscore);
  });

  return result;
}
