/**
 * Mock signal data for development
 * TODO: Replace with actual agent call in Phase 8
 */

import type { MarketSignal, NewsSignal, SpeechSignal } from "./types";

export interface RawMockSignal {
  symbol: string;
  company_name: string;
  market: MarketSignal | null;
  news: NewsSignal | null;
  speech: SpeechSignal | null;
}

export const MOCK_SIGNALS: RawMockSignal[] = [
  {
    symbol: "TSLA",
    company_name: "Tesla Inc.",
    market: {
      symbol: "TSLA",
      date: new Date().toISOString(),
      close_price: 248.5,
      z_score: 2.1,
      volume: 45200000,
      avg_30d: 241.2,
      is_anomaly: true,
    },
    news: {
      symbol: "TSLA",
      date: new Date().toISOString(),
      avg_tone: 2.5,
      article_count: 127,
      positive_pct: 68.5,
      sample_headlines: [
        "Tesla Q3 beats expectations",
        "Cybertruck production ramps up",
      ],
    },
    speech: {
      symbol: "TSLA",
      event: "Q3 2024 Earnings Call",
      tone: "bullish",
      guidance: "Revenue +15% YoY guidance",
      topics: ["AI/FSD", "Cybertruck", "Energy Storage"],
      risks: ["Competition", "Regulatory challenges"],
      processed_at: new Date().toISOString(),
    },
  },
  {
    symbol: "AAPL",
    company_name: "Apple Inc.",
    market: {
      symbol: "AAPL",
      date: new Date().toISOString(),
      close_price: 175.2,
      z_score: -1.2,
      volume: 32100000,
      avg_30d: 178.5,
      is_anomaly: false,
    },
    news: {
      symbol: "AAPL",
      date: new Date().toISOString(),
      avg_tone: 1.8,
      article_count: 95,
      positive_pct: 62.1,
      sample_headlines: [
        "iPhone sales remain steady",
        "Apple Vision Pro receives updates",
      ],
    },
    speech: null,
  },
  {
    symbol: "NVDA",
    company_name: "NVIDIA Corporation",
    market: {
      symbol: "NVDA",
      date: new Date().toISOString(),
      close_price: 485.6,
      z_score: 0.8,
      volume: 28500000,
      avg_30d: 478.3,
      is_anomaly: false,
    },
    news: {
      symbol: "NVDA",
      date: new Date().toISOString(),
      avg_tone: 4.2,
      article_count: 156,
      positive_pct: 78.2,
      sample_headlines: [
        "AI chip demand surges globally",
        "NVIDIA announces next-gen GPU architecture",
      ],
    },
    speech: {
      symbol: "NVDA",
      event: "Q3 2024 Earnings Call",
      tone: "bullish",
      guidance: "Data center revenue +50% expected",
      topics: ["AI Infrastructure", "Data Centers", "Gaming"],
      risks: ["Supply chain constraints", "China export restrictions"],
      processed_at: new Date().toISOString(),
    },
  },
  {
    symbol: "MSFT",
    company_name: "Microsoft Corporation",
    market: {
      symbol: "MSFT",
      date: new Date().toISOString(),
      close_price: 378.9,
      z_score: 0.3,
      volume: 18200000,
      avg_30d: 375.4,
      is_anomaly: false,
    },
    news: {
      symbol: "MSFT",
      date: new Date().toISOString(),
      avg_tone: 3.1,
      article_count: 82,
      positive_pct: 71.3,
      sample_headlines: [
        "Azure cloud growth continues",
        "Copilot AI integration expands",
      ],
    },
    speech: {
      symbol: "MSFT",
      event: "Q3 2024 Earnings Call",
      tone: "neutral",
      guidance: "Cloud revenue guidance maintained",
      topics: ["Azure", "AI Copilot", "Enterprise"],
      risks: ["Regulatory scrutiny", "Competition"],
      processed_at: new Date().toISOString(),
    },
  },
  {
    symbol: "GOOGL",
    company_name: "Alphabet Inc.",
    market: {
      symbol: "GOOGL",
      date: new Date().toISOString(),
      close_price: 142.8,
      z_score: -0.5,
      volume: 22300000,
      avg_30d: 145.2,
      is_anomaly: false,
    },
    news: {
      symbol: "GOOGL",
      date: new Date().toISOString(),
      avg_tone: -1.2,
      article_count: 110,
      positive_pct: 45.2,
      sample_headlines: [
        "Antitrust concerns weigh on Alphabet",
        "Gemini AI receives mixed reviews",
      ],
    },
    speech: null,
  },
];
