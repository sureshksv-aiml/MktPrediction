"use client";

import { TrendingUp, Newspaper, Mic } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignalCard } from "./SignalCard";
import {
  type TickerSignals,
  getRiskColor,
  SIGNAL_PROFILES,
} from "@/lib/signals/types";

interface DetailPanelProps {
  signal: TickerSignals;
}

export function DetailPanel({
  signal,
}: DetailPanelProps): React.ReactElement {
  // Only show profile config for built-in profiles
  const profileConfig = signal.profile in SIGNAL_PROFILES
    ? SIGNAL_PROFILES[signal.profile as keyof typeof SIGNAL_PROFILES]
    : null;

  return (
    <div className="flex flex-col bg-muted/50 rounded-lg border border-border/80">
      {/* Compact Header - Ticker info + Score in one row */}
      <div className="px-4 py-2 flex items-center gap-4 flex-wrap">
        {/* Ticker Info */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">{signal.symbol}</h2>
          {signal.company_name && (
            <span className="text-sm text-muted-foreground">{signal.company_name}</span>
          )}
        </div>

        {/* Score Summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Score:</span>
            <span className={`text-lg font-bold ${getRiskColor(signal.risk_level)}`}>
              {signal.overall_score !== null ? signal.overall_score.toFixed(2) : "N/A"}
            </span>
          </div>
          <Badge
            variant={
              signal.risk_level === "HIGH"
                ? "destructive"
                : signal.risk_level === "MEDIUM"
                  ? "secondary"
                  : "default"
            }
            className="text-xs"
          >
            {signal.risk_level}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {Math.round(signal.confidence * 100)}%
          </span>
        </div>

        {/* Profile Info */}
        {profileConfig && (
          <span className="text-xs text-muted-foreground hidden lg:inline ml-auto">
            {profileConfig.name} (M:{Math.round(profileConfig.weights.market * 100)}% N:{Math.round(profileConfig.weights.news * 100)}% S:{Math.round(profileConfig.weights.speech * 100)}%)
          </span>
        )}
      </div>

      {/* Signal Cards Content */}
      <div className="p-3">
        {/* 3-Column Grid for Signal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Market Signal Card */}
          <SignalCard
            title="Market"
            icon={<TrendingUp className="h-3 w-3" />}
            available={!!signal.market}
          >
            {signal.market && (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Z-Score</span>
                  <span className={signal.market.is_anomaly ? "text-red-500 font-bold" : ""}>
                    {signal.market.z_score > 0 ? "+" : ""}{signal.market.z_score.toFixed(2)}σ
                    {signal.market.is_anomaly && " ⚠"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span>${signal.market.close_price.toFixed(2)}</span>
                </div>
                {signal.market.avg_30d && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">30D Avg</span>
                    <span>${signal.market.avg_30d.toFixed(2)}</span>
                  </div>
                )}
                {signal.market.volume && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vol</span>
                    <span>{(signal.market.volume / 1000000).toFixed(1)}M</span>
                  </div>
                )}
              </div>
            )}
          </SignalCard>

          {/* News Signal Card */}
          <SignalCard
            title="News"
            icon={<Newspaper className="h-3 w-3" />}
            available={!!signal.news}
          >
            {signal.news && (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tone</span>
                  <span className={signal.news.avg_tone > 0 ? "text-green-500" : signal.news.avg_tone < 0 ? "text-red-500" : ""}>
                    {signal.news.avg_tone > 0 ? "+" : ""}{signal.news.avg_tone.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Articles</span>
                  <span>{signal.news.article_count}</span>
                </div>
                {signal.news.positive_pct !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Positive</span>
                    <span>{signal.news.positive_pct.toFixed(0)}%</span>
                  </div>
                )}
                {signal.news.sample_headlines.length > 0 && (
                  <div className="pt-1 border-t mt-1">
                    <ul className="space-y-0.5">
                      {signal.news.sample_headlines.slice(0, 2).map((h, i) => (
                        <li key={i} className="truncate text-muted-foreground">• {h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </SignalCard>

          {/* Speech Signal Card */}
          <SignalCard
            title="Speech"
            icon={<Mic className="h-3 w-3" />}
            available={!!signal.speech}
          >
            {signal.speech && (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tone</span>
                  <Badge
                    variant={signal.speech.tone === "bullish" ? "default" : signal.speech.tone === "bearish" ? "destructive" : "secondary"}
                    className="text-[10px] px-1 py-0"
                  >
                    {signal.speech.tone.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event</span>
                  <span className="truncate max-w-[60%]">{signal.speech.event}</span>
                </div>
                {signal.speech.guidance && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guide</span>
                    <span className="truncate max-w-[60%]">{signal.speech.guidance}</span>
                  </div>
                )}
                {signal.speech.topics.length > 0 && (
                  <div className="pt-1 border-t mt-1 flex flex-wrap gap-0.5">
                    {signal.speech.topics.slice(0, 3).map((t, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] px-1 py-0">{t}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </SignalCard>
        </div>
      </div>
    </div>
  );
}
