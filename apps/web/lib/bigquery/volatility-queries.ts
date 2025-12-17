/**
 * BigQuery queries for volatility dashboard
 * Uses direct SQL to fetch VIX, forecasts, anomalies, events, and alerts
 */

import { getBigQueryClient, getBigQueryConfig } from "./client";

// VIX thresholds for regime classification
const VIX_THRESHOLDS = {
  low: 15,
  normal: 20,
  elevated: 25,
  high: 30,
};

// Index multipliers for forecast calculation
const INDEX_MULTIPLIERS: Record<string, number> = {
  SPX: 1.0, // Baseline
  NDX: 1.15, // Tech premium
  DJI: 0.95, // Blue chip discount
  RUT: 1.35, // Small cap premium
};

// Z-score threshold for anomaly detection
const ZSCORE_THRESHOLD = 2.0;

export type VolatilityRegime = "low" | "normal" | "elevated" | "extreme";

export interface VolatilityMetrics {
  data_date: string;
  current_vix: number;
  vix_change: number;
  vix_percentile: number;
  regime: VolatilityRegime;
  historical_vol_20d: number;
}

export interface VolatilityForecast {
  symbol: string;
  volatility_1d: number;
  volatility_5d: number;
  confidence: number;
}

export interface Anomaly {
  symbol: string;
  date: string;
  close_price: number;
  price_zscore: number;
  volume_zscore: number;
  price_status: "ANOMALY" | "NORMAL";
  volume_status: "ANOMALY" | "NORMAL";
}

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

export interface Alert {
  id: string;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  symbol: string | null;
  message: string;
  vix_value: number | null;
  triggered_at: string;
}

/**
 * Get current VIX level, regime, and percentile
 */
export async function getVolatilityMetrics(): Promise<VolatilityMetrics> {
  const client = getBigQueryClient();
  const { project, dataset } = getBigQueryConfig();

  const query = `
    WITH ranked AS (
      SELECT
        date,
        vix,
        LAG(vix) OVER (ORDER BY date) as prev_vix,
        PERCENT_RANK() OVER (ORDER BY vix) * 100 AS vix_percentile
      FROM \`${project}.${dataset}.market_30yr_v\`
      WHERE vix IS NOT NULL
    ),
    price_changes AS (
      SELECT
        date,
        sp500,
        (sp500 - LAG(sp500) OVER (ORDER BY date)) /
          NULLIF(LAG(sp500) OVER (ORDER BY date), 0) AS daily_return
      FROM (
        SELECT date, sp500
        FROM \`${project}.${dataset}.market_30yr_v\`
        WHERE sp500 IS NOT NULL
        ORDER BY date DESC
        LIMIT 21
      )
    ),
    historical_vol AS (
      SELECT STDDEV(daily_return) * SQRT(252) * 100 AS vol_20d
      FROM price_changes
      WHERE daily_return IS NOT NULL
    )
    SELECT
      FORMAT_DATE('%Y-%m-%d', r.date) as data_date,
      r.vix as current_vix,
      ROUND(r.vix - COALESCE(r.prev_vix, r.vix), 2) as vix_change,
      ROUND(r.vix_percentile, 1) as vix_percentile,
      CASE
        WHEN r.vix < ${VIX_THRESHOLDS.low} THEN 'low'
        WHEN r.vix < ${VIX_THRESHOLDS.normal} THEN 'normal'
        WHEN r.vix < ${VIX_THRESHOLDS.high} THEN 'elevated'
        ELSE 'extreme'
      END AS regime,
      ROUND(h.vol_20d, 2) as historical_vol_20d
    FROM ranked r
    CROSS JOIN historical_vol h
    ORDER BY r.date DESC
    LIMIT 1
  `;

  try {
    const [rows] = await client.query({ query });
    const row = rows[0] as VolatilityMetrics;
    return row;
  } catch (error) {
    console.error("Failed to fetch volatility metrics:", error);
    throw error;
  }
}

/**
 * Calculate volatility forecasts using VIX and historical vol
 */
export async function getVolatilityForecasts(): Promise<{
  forecasts: VolatilityForecast[];
  current_vix: number;
  regime: VolatilityRegime;
  data_date: string;
}> {
  const client = getBigQueryClient();
  const { project, dataset } = getBigQueryConfig();

  const query = `
    WITH latest_data AS (
      SELECT
        date,
        vix,
        CASE
          WHEN vix < ${VIX_THRESHOLDS.low} THEN 'low'
          WHEN vix < ${VIX_THRESHOLDS.normal} THEN 'normal'
          WHEN vix < ${VIX_THRESHOLDS.high} THEN 'elevated'
          ELSE 'extreme'
        END AS regime
      FROM \`${project}.${dataset}.market_30yr_v\`
      WHERE vix IS NOT NULL
      ORDER BY date DESC
      LIMIT 1
    ),
    price_changes AS (
      SELECT
        date,
        sp500,
        (sp500 - LAG(sp500) OVER (ORDER BY date)) /
          NULLIF(LAG(sp500) OVER (ORDER BY date), 0) AS daily_return
      FROM (
        SELECT date, sp500
        FROM \`${project}.${dataset}.market_30yr_v\`
        WHERE sp500 IS NOT NULL
        ORDER BY date DESC
        LIMIT 21
      )
    ),
    historical_vol AS (
      SELECT STDDEV(daily_return) * SQRT(252) * 100 AS vol_20d
      FROM price_changes
      WHERE daily_return IS NOT NULL
    )
    SELECT
      FORMAT_DATE('%Y-%m-%d', l.date) as data_date,
      l.vix as current_vix,
      l.regime,
      h.vol_20d as historical_vol_20d
    FROM latest_data l
    CROSS JOIN historical_vol h
  `;

  try {
    const [rows] = await client.query({ query });
    const data = rows[0] as {
      data_date: string;
      current_vix: number;
      regime: VolatilityRegime;
      historical_vol_20d: number;
    };

    // Calculate forecasts for each index using the formulas
    const forecasts: VolatilityForecast[] = Object.entries(INDEX_MULTIPLIERS).map(
      ([symbol, multiplier]) => {
        const vol1d = data.current_vix * multiplier;
        const vol5d = data.historical_vol_20d * multiplier * 1.1; // 10% uncertainty premium

        // Confidence based on regime
        let baseConfidence: number;
        switch (data.regime) {
          case "low":
            baseConfidence = 0.9;
            break;
          case "normal":
            baseConfidence = 0.85;
            break;
          case "elevated":
            baseConfidence = 0.75;
            break;
          case "extreme":
            baseConfidence = 0.6;
            break;
        }

        // Small adjustments per index
        const confidenceAdjustment: Record<string, number> = {
          SPX: 0,
          NDX: -0.03,
          DJI: 0.02,
          RUT: -0.05,
        };

        return {
          symbol,
          volatility_1d: Math.round(vol1d * 10) / 10,
          volatility_5d: Math.round(vol5d * 10) / 10,
          confidence: Math.round((baseConfidence + (confidenceAdjustment[symbol] || 0)) * 100) / 100,
        };
      }
    );

    return {
      forecasts,
      current_vix: data.current_vix,
      regime: data.regime,
      data_date: data.data_date,
    };
  } catch (error) {
    console.error("Failed to calculate volatility forecasts:", error);
    throw error;
  }
}

/**
 * Get z-score anomalies for all indices
 */
export async function getAnomalies(): Promise<Anomaly[]> {
  const client = getBigQueryClient();
  const { project, dataset } = getBigQueryConfig();

  const query = `
    WITH stats AS (
      SELECT
        symbol,
        AVG(close) AS avg_price,
        STDDEV(close) AS std_price,
        AVG(volume) AS avg_volume,
        STDDEV(volume) AS std_volume
      FROM \`${project}.${dataset}.index_data_v\`
      WHERE date >= DATE_SUB((SELECT MAX(date) FROM \`${project}.${dataset}.index_data_v\`), INTERVAL 90 DAY)
        AND close IS NOT NULL
      GROUP BY symbol
    ),
    latest AS (
      SELECT symbol, date, close, volume
      FROM \`${project}.${dataset}.index_data_v\`
      WHERE date = (SELECT MAX(date) FROM \`${project}.${dataset}.index_data_v\`)
        AND close IS NOT NULL
    )
    SELECT
      l.symbol,
      FORMAT_DATE('%Y-%m-%d', l.date) as date,
      ROUND(l.close, 2) AS close_price,
      ROUND((l.close - s.avg_price) / NULLIF(s.std_price, 0), 2) AS price_zscore,
      ROUND((l.volume - s.avg_volume) / NULLIF(s.std_volume, 0), 2) AS volume_zscore,
      CASE
        WHEN ABS((l.close - s.avg_price) / NULLIF(s.std_price, 0)) > ${ZSCORE_THRESHOLD} THEN 'ANOMALY'
        ELSE 'NORMAL'
      END AS price_status,
      CASE
        WHEN ABS((l.volume - s.avg_volume) / NULLIF(s.std_volume, 0)) > ${ZSCORE_THRESHOLD} THEN 'ANOMALY'
        ELSE 'NORMAL'
      END AS volume_status
    FROM latest l
    JOIN stats s ON l.symbol = s.symbol
    ORDER BY ABS((l.close - s.avg_price) / NULLIF(s.std_price, 0)) DESC
  `;

  try {
    const [rows] = await client.query({ query });
    return rows as Anomaly[];
  } catch (error) {
    console.error("Failed to fetch anomalies:", error);
    throw error;
  }
}

/**
 * Get event calendar data (Fed meetings, analyst ratings, M&A)
 * Each query is handled separately to gracefully handle missing tables
 */
export async function getEventCalendar(): Promise<EventCalendarData> {
  const client = getBigQueryClient();
  const { project, dataset } = getBigQueryConfig();

  // Helper to safely run a query and return empty array on error
  async function safeQuery<T>(query: string, name: string): Promise<T[]> {
    try {
      const [rows] = await client.query({ query });
      return rows as T[];
    } catch (error) {
      console.warn(`Failed to fetch ${name}:`, error);
      return [];
    }
  }

  // Fed meetings query - using correct column names from fed_communications_v view
  const fedQuery = `
    SELECT
      FORMAT_DATE('%Y-%m-%d', date) as date,
      FORMAT_DATE('%Y-%m-%d', release_date) as release_date,
      type,
      SUBSTR(text, 1, 200) as summary
    FROM \`${project}.${dataset}.fed_communications_v\`
    WHERE type IN ('Minutes', 'Statement', 'Minute')
    ORDER BY date DESC
    LIMIT 10
  `;

  // Analyst ratings query - CSV import has inconsistent column mapping
  // string_field_1 appears to have title, string_field_2 has date, string_field_3 has stock
  // But data shows mixed content. Using heuristic: date contains digits.
  const ratingsQuery = `
    SELECT
      CASE
        WHEN REGEXP_CONTAINS(string_field_2, r'^\\d{4}-') THEN string_field_2
        WHEN REGEXP_CONTAINS(string_field_1, r'^\\d{4}-') THEN string_field_1
        ELSE string_field_2
      END as date,
      CASE
        WHEN REGEXP_CONTAINS(string_field_1, r'^\\d{4}-') THEN string_field_2
        ELSE string_field_1
      END as title,
      string_field_3 as stock
    FROM \`${project}.${dataset}.analyst_ratings\`
    WHERE string_field_1 IS NOT NULL OR string_field_2 IS NOT NULL
    ORDER BY
      CASE
        WHEN REGEXP_CONTAINS(string_field_2, r'^\\d{4}-') THEN string_field_2
        WHEN REGEXP_CONTAINS(string_field_1, r'^\\d{4}-') THEN string_field_1
        ELSE string_field_2
      END DESC
    LIMIT 10
  `;

  // M&A query - column names have spaces, use backticks
  const mnaQuery = `
    SELECT
      SAFE_CAST(\`Acquisition Year\` AS INT64) as year,
      \`Acquisition Month\` as month,
      \`Parent Company\` as parent_company,
      \`Acquired Company\` as acquired_company,
      SAFE_CAST(REGEXP_REPLACE(\`Acquisition Price\`, r'[^0-9.]', '') AS FLOAT64) as price,
      \`Category\` as category
    FROM \`${project}.${dataset}.acquisitions\`
    WHERE \`Acquisition Year\` IS NOT NULL
    ORDER BY \`Acquisition Year\` DESC, \`Acquisition Month\` DESC
    LIMIT 10
  `;

  const [fedRows, ratingsRows, mnaRows] = await Promise.all([
    safeQuery<FedEvent>(fedQuery, "fed_meetings"),
    safeQuery<AnalystRating>(ratingsQuery, "analyst_ratings"),
    safeQuery<MnAEvent>(mnaQuery, "mna_events"),
  ]);

  return {
    fed_meetings: fedRows,
    analyst_ratings: ratingsRows,
    mna_events: mnaRows,
  };
}

/**
 * Generate alerts based on current VIX thresholds and anomalies
 */
export async function getAlerts(): Promise<{
  alerts: Alert[];
  has_critical: boolean;
  has_warning: boolean;
}> {
  // Get current metrics and anomalies
  const [metrics, anomalies] = await Promise.all([
    getVolatilityMetrics(),
    getAnomalies(),
  ]);

  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  // VIX-based alerts
  if (metrics.current_vix > VIX_THRESHOLDS.high) {
    alerts.push({
      id: `vix-critical-${Date.now()}`,
      alert_type: "vix_extreme",
      severity: "critical",
      symbol: null,
      message: `EXTREME volatility - VIX at ${metrics.current_vix.toFixed(1)}, above ${VIX_THRESHOLDS.high}`,
      vix_value: metrics.current_vix,
      triggered_at: now,
    });
  } else if (metrics.current_vix > VIX_THRESHOLDS.elevated) {
    alerts.push({
      id: `vix-warning-${Date.now()}`,
      alert_type: "vix_high",
      severity: "warning",
      symbol: null,
      message: `HIGH volatility - VIX at ${metrics.current_vix.toFixed(1)}, above ${VIX_THRESHOLDS.elevated}`,
      vix_value: metrics.current_vix,
      triggered_at: now,
    });
  } else if (metrics.current_vix > VIX_THRESHOLDS.normal) {
    alerts.push({
      id: `vix-info-${Date.now()}`,
      alert_type: "vix_elevated",
      severity: "info",
      symbol: null,
      message: `ELEVATED volatility - VIX at ${metrics.current_vix.toFixed(1)}, above ${VIX_THRESHOLDS.normal}`,
      vix_value: metrics.current_vix,
      triggered_at: now,
    });
  }

  // Anomaly-based alerts
  for (const anomaly of anomalies) {
    if (anomaly.price_status === "ANOMALY") {
      alerts.push({
        id: `anomaly-price-${anomaly.symbol}-${Date.now()}`,
        alert_type: "price_anomaly",
        severity: "info",
        symbol: anomaly.symbol,
        message: `${anomaly.symbol} price anomaly: ${Math.abs(anomaly.price_zscore).toFixed(1)}σ ${anomaly.price_zscore > 0 ? "above" : "below"} average`,
        vix_value: null,
        triggered_at: now,
      });
    }
    if (anomaly.volume_status === "ANOMALY") {
      alerts.push({
        id: `anomaly-volume-${anomaly.symbol}-${Date.now()}`,
        alert_type: "volume_anomaly",
        severity: "info",
        symbol: anomaly.symbol,
        message: `${anomaly.symbol} volume anomaly: ${Math.abs(anomaly.volume_zscore).toFixed(1)}σ ${anomaly.volume_zscore > 0 ? "above" : "below"} average`,
        vix_value: null,
        triggered_at: now,
      });
    }
  }

  return {
    alerts,
    has_critical: alerts.some((a) => a.severity === "critical"),
    has_warning: alerts.some((a) => a.severity === "warning"),
  };
}
