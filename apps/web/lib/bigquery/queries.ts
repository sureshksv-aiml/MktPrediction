/**
 * BigQuery queries for market signals dashboard
 * Fetches real-time data from stock_prices and GDELT tables
 */

import { getBigQueryClient, getBigQueryConfig } from "./client";
import type { MarketSignal, NewsSignal, SpeechSignal } from "@/lib/signals/types";

// Ticker to company name mapping
const COMPANY_NAMES: Record<string, string> = {
  TSLA: "Tesla Inc.",
  AAPL: "Apple Inc.",
  NVDA: "NVIDIA Corporation",
  MSFT: "Microsoft Corporation",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.",
  META: "Meta Platforms Inc.",
  BTC: "Bitcoin",
  ETH: "Ethereum",
};

// Ticker to GDELT search keywords mapping
const TICKER_KEYWORDS: Record<string, string> = {
  TSLA: "tesla|tsla|elon musk",
  AAPL: "apple|aapl|iphone|ipad|macbook",
  NVDA: "nvidia|nvda|geforce|cuda",
  MSFT: "microsoft|msft|azure|windows",
  GOOGL: "google|alphabet|googl|android|chrome",
  AMZN: "amazon|amzn|aws|prime",
  META: "meta|facebook|instagram|whatsapp|zuckerberg",
  BTC: "bitcoin|btc|crypto",
  ETH: "ethereum|eth|crypto",
};

export interface RawMarketSignal {
  symbol: string;
  date: string;
  close_price: number;
  volume: number | null;
  avg_30d: number | null;
  z_score: number | null;
  is_anomaly: boolean;
}

export interface RawNewsSignal {
  symbol: string;
  avg_tone: number;
  article_count: number;
  positive_pct: number;
}

export interface RawSpeechSignal {
  symbol: string;
  event: string;
  tone: "bullish" | "bearish" | "neutral";
  guidance: string | null;
  topics: string[];
  risks: string[];
  processed_at: string;
}

/**
 * Fetch market signals for all tickers from BigQuery stock_prices table
 * Calculates z-score for anomaly detection
 */
export async function getMarketSignals(): Promise<Map<string, MarketSignal>> {
  const client = getBigQueryClient();
  const { project, dataset } = getBigQueryConfig();

  const query = `
    WITH latest_date AS (
      SELECT MAX(date) as max_date
      FROM \`${project}.${dataset}.stock_prices\`
    ),
    stats AS (
      SELECT
        symbol,
        date,
        close_price,
        volume,
        AVG(close_price) OVER (
          PARTITION BY symbol
          ORDER BY date
          ROWS BETWEEN 30 PRECEDING AND 1 PRECEDING
        ) AS avg_30d,
        STDDEV(close_price) OVER (
          PARTITION BY symbol
          ORDER BY date
          ROWS BETWEEN 30 PRECEDING AND 1 PRECEDING
        ) AS stddev_30d
      FROM \`${project}.${dataset}.stock_prices\`
    )
    SELECT
      symbol,
      FORMAT_DATE('%Y-%m-%d', date) as date,
      close_price,
      volume,
      ROUND(avg_30d, 2) AS avg_30d,
      ROUND(SAFE_DIVIDE(close_price - avg_30d, stddev_30d), 2) AS z_score,
      ABS(SAFE_DIVIDE(close_price - avg_30d, stddev_30d)) > 2.0 AS is_anomaly
    FROM stats
    WHERE date = (SELECT max_date FROM latest_date)
    ORDER BY symbol
  `;

  try {
    const [rows] = await client.query({ query });

    const signals = new Map<string, MarketSignal>();

    for (const row of rows as RawMarketSignal[]) {
      signals.set(row.symbol, {
        symbol: row.symbol,
        date: row.date,
        close_price: row.close_price,
        z_score: row.z_score ?? 0,
        volume: row.volume,
        avg_30d: row.avg_30d,
        is_anomaly: row.is_anomaly,
      });
    }

    return signals;
  } catch (error) {
    console.error("Failed to fetch market signals from BigQuery:", error);
    throw error;
  }
}

/**
 * Fetch news sentiment signals from GDELT for all tickers
 * Uses 7-day lookback window
 */
export async function getNewsSignals(): Promise<Map<string, NewsSignal>> {
  const client = getBigQueryClient();

  // Build CASE statement for ticker mapping
  const tickerCases = Object.entries(TICKER_KEYWORDS)
    .map(
      ([ticker, keywords]) =>
        `WHEN REGEXP_CONTAINS(LOWER(DocumentIdentifier), r'${keywords}') THEN '${ticker}'`
    )
    .join("\n      ");

  const query = `
    WITH ticker_articles AS (
      SELECT
        CASE
          ${tickerCases}
          ELSE NULL
        END as symbol,
        CAST(SPLIT(V2Tone, ',')[OFFSET(0)] AS FLOAT64) as tone
      FROM \`gdelt-bq.gdeltv2.gkg\`
      WHERE DATE >= CAST(FORMAT_TIMESTAMP('%Y%m%d000000',
        TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)) AS INT64)
    )
    SELECT
      symbol,
      ROUND(AVG(tone), 2) AS avg_tone,
      COUNT(*) AS article_count,
      ROUND(COUNTIF(tone > 0) / COUNT(*) * 100, 1) AS positive_pct
    FROM ticker_articles
    WHERE symbol IS NOT NULL
    GROUP BY symbol
    ORDER BY symbol
  `;

  try {
    const [rows] = await client.query({ query });

    const signals = new Map<string, NewsSignal>();

    for (const row of rows as RawNewsSignal[]) {
      signals.set(row.symbol, {
        symbol: row.symbol,
        date: new Date().toISOString(),
        avg_tone: row.avg_tone,
        article_count: row.article_count,
        positive_pct: row.positive_pct,
        sample_headlines: [], // GDELT doesn't provide headlines in gkg table
      });
    }

    return signals;
  } catch (error) {
    console.error("Failed to fetch news signals from GDELT:", error);
    // Return empty map on error - news is optional
    return new Map();
  }
}

/**
 * Fetch speech signals (earnings calls) from BigQuery speech_signals table
 * Uses 90-day lookback window
 */
export async function getSpeechSignals(): Promise<Map<string, SpeechSignal>> {
  const client = getBigQueryClient();
  const { project, dataset } = getBigQueryConfig();

  const query = `
    SELECT
      symbol,
      event,
      tone,
      guidance,
      topics,
      risks,
      processed_at
    FROM \`${project}.${dataset}.speech_signals\`
    WHERE processed_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
    ORDER BY processed_at DESC
  `;

  try {
    const [rows] = await client.query({ query });

    const signals = new Map<string, SpeechSignal>();

    for (const row of rows as RawSpeechSignal[]) {
      // Only keep the most recent speech signal per symbol
      if (!signals.has(row.symbol)) {
        signals.set(row.symbol, {
          symbol: row.symbol,
          event: row.event,
          tone: row.tone,
          guidance: row.guidance,
          topics: row.topics || [],
          risks: row.risks || [],
          processed_at: row.processed_at,
        });
      }
    }

    return signals;
  } catch (error) {
    console.error("Failed to fetch speech signals from BigQuery:", error);
    // Return empty map on error - speech is optional
    return new Map();
  }
}

/**
 * Get all unique tickers from stock_prices table
 */
export async function getAvailableTickers(): Promise<string[]> {
  const client = getBigQueryClient();
  const { project, dataset } = getBigQueryConfig();

  const query = `
    SELECT DISTINCT symbol
    FROM \`${project}.${dataset}.stock_prices\`
    ORDER BY symbol
  `;

  try {
    const [rows] = await client.query({ query });
    return (rows as Array<{ symbol: string }>).map((r) => r.symbol);
  } catch (error) {
    console.error("Failed to fetch available tickers:", error);
    return [];
  }
}

/**
 * Get company name for a ticker symbol
 */
export function getCompanyName(symbol: string): string | undefined {
  return COMPANY_NAMES[symbol];
}

/**
 * Merge market, news, and speech signals into combined signal data
 */
export interface CombinedSignalData {
  symbol: string;
  company_name?: string;
  market: MarketSignal | null;
  news: NewsSignal | null;
  speech: SpeechSignal | null;
}

export async function fetchAllSignals(): Promise<CombinedSignalData[]> {
  // Fetch all signals in parallel
  const [marketSignals, newsSignals, speechSignals] = await Promise.all([
    getMarketSignals(),
    getNewsSignals(),
    getSpeechSignals(),
  ]);

  // Get all tickers that have market data
  const tickers = Array.from(marketSignals.keys());

  // Combine signals for each ticker
  const signals: CombinedSignalData[] = tickers.map((symbol) => ({
    symbol,
    company_name: getCompanyName(symbol),
    market: marketSignals.get(symbol) ?? null,
    news: newsSignals.get(symbol) ?? null,
    speech: speechSignals.get(symbol) ?? null,
  }));

  // Sort by symbol
  signals.sort((a, b) => a.symbol.localeCompare(b.symbol));

  return signals;
}
