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
    <div className="bg-card rounded-lg border h-full flex flex-col overflow-hidden">
      <div className="shrink-0 p-3 border-b">
        <h3 className="text-sm font-medium text-muted-foreground">
          VOLATILITY FORECASTS
        </h3>
      </div>

      <div className="flex-1 overflow-auto">
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
      </div>

      <div className="shrink-0 p-2 border-t text-xs text-muted-foreground" suppressHydrationWarning>
        Updated: {new Date(lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}
