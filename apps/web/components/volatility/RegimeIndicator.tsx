"use client";

import { cn } from "@/lib/utils";
import type { VolatilityRegime } from "@/lib/volatility/types";

interface RegimeIndicatorProps {
  currentVix: number;
  regime: VolatilityRegime;
  percentile: number;
  vixChange?: number;
  historicalVol20d?: number;
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
  historicalVol20d,
}: RegimeIndicatorProps): React.ReactElement {
  const config = regimeConfig[regime];

  // Calculate bar position (0-100 scale mapped to VIX 0-50)
  const barPosition = Math.min(100, (currentVix / 50) * 100);

  return (
    <div className="bg-card rounded-lg border p-4 h-full flex flex-col">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 shrink-0">
        VOLATILITY REGIME
      </h3>

      <div className="flex items-center justify-between mb-4 flex-1">
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
          {historicalVol20d !== undefined && (
            <div className="text-sm text-muted-foreground">
              20D Vol: {historicalVol20d.toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Regime Bar */}
      <div className="relative h-4 bg-muted rounded-full overflow-hidden shrink-0 mt-auto">
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
      <div className="flex justify-between text-xs text-muted-foreground mt-1 shrink-0">
        <span>LOW</span>
        <span>NORMAL</span>
        <span>ELEVATED</span>
        <span>EXTREME</span>
      </div>
    </div>
  );
}
