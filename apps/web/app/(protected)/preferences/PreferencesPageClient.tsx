"use client";

import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// VIX Forecast Calculation Constants (from forecast_tools.py)
const FORECAST_WEIGHTS = {
  oneDay: { currentVix: 0.95, meanReversion: 0.05, eventAdjustment: 0.10 },
  fiveDay: { currentVix: 0.85, meanReversion: 0.15, eventAdjustment: 0.15 },
  longTermMean: 20.0,
};

// Index Volatility Multipliers (from synthesis_agent)
const INDEX_MULTIPLIERS = [
  { symbol: "SPX", multiplier: 1.0, description: "Baseline" },
  { symbol: "NDX", multiplier: 1.15, description: "Tech premium" },
  { symbol: "DJI", multiplier: 0.95, description: "Blue chip" },
  { symbol: "RUT", multiplier: 1.35, description: "Small cap" },
];

// Confidence by Regime
const REGIME_CONFIDENCE = [
  { regime: "Low", confidence: 85, color: "bg-green-500" },
  { regime: "Normal", confidence: 80, color: "bg-blue-500" },
  { regime: "Elevated", confidence: 70, color: "bg-yellow-500" },
  { regime: "Extreme", confidence: 55, color: "bg-red-500" },
];

// Input Sources
const INPUT_SOURCES = [
  { name: "Technical", desc: "VIX, regime, historical vol" },
  { name: "Events", desc: "Fed, M&A, ratings" },
  { name: "Speech", desc: "Earnings sentiment" },
];

export default function PreferencesPageClient(): React.ReactElement {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 py-3 border-b">
        <h1 className="text-lg font-bold">Preferences</h1>
        <p className="text-xs text-muted-foreground">
          Volatility forecast calculation methodology
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-5xl">
          {/* VIX Forecast Weights */}
          <Card className="h-fit">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">VIX Forecast Weights</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-xs">Horizon</TableHead>
                    <TableHead className="h-8 text-xs text-center">VIX</TableHead>
                    <TableHead className="h-8 text-xs text-center">Mean Rev.</TableHead>
                    <TableHead className="h-8 text-xs text-center">Event Adj.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="py-1.5 text-xs font-medium">1-Day</TableCell>
                    <TableCell className="py-1.5 text-xs text-center font-mono">
                      {(FORECAST_WEIGHTS.oneDay.currentVix * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="py-1.5 text-xs text-center font-mono">
                      {(FORECAST_WEIGHTS.oneDay.meanReversion * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="py-1.5 text-xs text-center font-mono">
                      +{(FORECAST_WEIGHTS.oneDay.eventAdjustment * 100).toFixed(0)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-1.5 text-xs font-medium">5-Day</TableCell>
                    <TableCell className="py-1.5 text-xs text-center font-mono">
                      {(FORECAST_WEIGHTS.fiveDay.currentVix * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="py-1.5 text-xs text-center font-mono">
                      {(FORECAST_WEIGHTS.fiveDay.meanReversion * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="py-1.5 text-xs text-center font-mono">
                      +{(FORECAST_WEIGHTS.fiveDay.eventAdjustment * 100).toFixed(0)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="text-[10px] text-muted-foreground mt-2">
                Long-term mean: {FORECAST_WEIGHTS.longTermMean} (historical VIX avg)
              </p>
            </CardContent>
          </Card>

          {/* Index Multipliers */}
          <Card className="h-fit">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">Index Multipliers</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-xs">Index</TableHead>
                    <TableHead className="h-8 text-xs text-center">Mult.</TableHead>
                    <TableHead className="h-8 text-xs">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INDEX_MULTIPLIERS.map((idx) => (
                    <TableRow key={idx.symbol}>
                      <TableCell className="py-1.5 text-xs font-mono font-medium">{idx.symbol}</TableCell>
                      <TableCell className="py-1.5 text-xs text-center font-mono">{idx.multiplier.toFixed(2)}x</TableCell>
                      <TableCell className="py-1.5 text-xs text-muted-foreground">{idx.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Regime Confidence */}
          <Card className="h-fit">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">Regime Confidence</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="grid grid-cols-4 gap-2">
                {REGIME_CONFIDENCE.map((item) => (
                  <div key={item.regime} className="text-center">
                    <div className="text-xs font-medium mb-1">{item.regime}</div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.confidence}%` }} />
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{item.confidence}%</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                -10% if historical vol differs &gt;30% from VIX
              </p>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card className="h-fit">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">Data Sources</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="space-y-1.5">
                {INPUT_SOURCES.map((source, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-medium shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium">{source.name}:</span>
                    <span className="text-muted-foreground">{source.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formula Note */}
        <div className="max-w-5xl mt-3 flex items-start gap-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          <span className="font-mono">Forecast = (VIX × Weight) + (Mean × (1-Weight)) × IndexMultiplier</span>
        </div>
      </div>
    </div>
  );
}
