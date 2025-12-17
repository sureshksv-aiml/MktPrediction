/**
 * Type definitions for Market Signal Intelligence Dashboard
 * Mirrors backend Pydantic models from market_signal_agent/models.py
 */

// Re-export from existing schema to avoid duplication
export {
  type SignalProfile,
  SIGNAL_PROFILES,
} from "@/lib/drizzle/schema/user-preferences";

import type { SignalProfile } from "@/lib/drizzle/schema/user-preferences";

// Risk level types
export type RiskLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

/**
 * Get risk level from a normalized score (0-1)
 */
export function getRiskLevel(score: number | null): RiskLevel {
  if (score === null) return "UNKNOWN";
  if (score >= 0.7) return "HIGH";
  if (score >= 0.4) return "MEDIUM";
  return "LOW";
}

/**
 * Get Tailwind color class for risk level
 */
export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "HIGH":
      return "text-red-500";
    case "MEDIUM":
      return "text-yellow-500";
    case "LOW":
      return "text-green-500";
    default:
      return "text-muted-foreground";
  }
}

/**
 * Get background color class for risk level badges
 */
export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case "HIGH":
      return "bg-red-500";
    case "MEDIUM":
      return "bg-yellow-500";
    case "LOW":
      return "bg-green-500";
    default:
      return "bg-muted";
  }
}

// Individual signal types - mirror backend Pydantic models

export interface MarketSignal {
  symbol: string;
  date: string;
  close_price: number;
  z_score: number;
  volume: number | null;
  avg_30d: number | null;
  is_anomaly: boolean;
}

export interface NewsSignal {
  symbol: string;
  date: string;
  avg_tone: number;
  article_count: number;
  positive_pct?: number;
  sample_headlines: string[];
}

export interface SpeechSignal {
  symbol: string;
  event: string;
  tone: "bullish" | "bearish" | "neutral";
  guidance: string | null;
  topics: string[];
  risks: string[];
  processed_at: string | null;
}

// Combined ticker signals
export interface TickerSignals {
  symbol: string;
  company_name?: string;
  market: MarketSignal | null;
  news: NewsSignal | null;
  speech: SpeechSignal | null;
  overall_score: number | null;
  confidence: number;
  risk_level: RiskLevel;
  profile: SignalProfile;
}

// API response types
export interface SignalsApiResponse {
  signals: TickerSignals[];
  timestamp: string;
  profile: SignalProfile;
}

export interface PreferencesApiResponse {
  signal_profile: SignalProfile;
  watched_tickers: string[];
}

// Profile weights type
interface ProfileWeights {
  market: number;
  news: number;
  speech: number;
}

/**
 * Calculate overall risk score based on available signals and profile weights
 * Normalizes weights when some signals are missing
 */
export function calculateOverallScore(
  ticker: {
    market: MarketSignal | null;
    news: NewsSignal | null;
    speech: SpeechSignal | null;
  },
  weights: ProfileWeights
): { score: number | null; confidence: number } {
  const signals: { key: keyof ProfileWeights; risk: number }[] = [];

  // Normalize market signal (z-score to 0-1)
  if (ticker.market) {
    const marketRisk = Math.min(Math.abs(ticker.market.z_score) / 3.0, 1.0);
    signals.push({ key: "market", risk: marketRisk });
  }

  // Normalize news signal (tone to 0-1, inverted - positive tone = low risk)
  if (ticker.news) {
    const normalized = (ticker.news.avg_tone + 10) / 20; // -10 to +10 -> 0 to 1
    const newsRisk = 1.0 - normalized; // Invert: positive = low risk
    signals.push({ key: "news", risk: newsRisk });
  }

  // Normalize speech signal
  if (ticker.speech) {
    const toneMap: Record<string, number> = {
      bullish: 0.3,
      neutral: 0.5,
      bearish: 0.8,
    };
    const speechRisk = toneMap[ticker.speech.tone] ?? 0.5;
    signals.push({ key: "speech", risk: speechRisk });
  }

  if (signals.length === 0) {
    return { score: null, confidence: 0 };
  }

  // Calculate weighted average with normalized weights
  const totalWeight = signals.reduce((sum, s) => sum + weights[s.key], 0);
  const weightedSum = signals.reduce(
    (sum, s) => sum + s.risk * weights[s.key],
    0
  );

  return {
    score: Math.round((weightedSum / totalWeight) * 1000) / 1000,
    confidence: Math.round((signals.length / 3) * 100) / 100,
  };
}
