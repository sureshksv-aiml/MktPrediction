"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { type TickerSignals, getRiskColor, getRiskBgColor } from "@/lib/signals/types";

interface TickerTableProps {
  signals: TickerSignals[];
  selectedTicker: string | null;
  onSelect: (ticker: string) => void;
  loading: boolean;
}

export function TickerTable({
  signals,
  selectedTicker,
  onSelect,
  loading,
}: TickerTableProps): React.ReactElement {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No signals available. Try refreshing or check your connection.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-lg border border-border/80 bg-card overflow-hidden">
      {/* Fixed Table Header */}
      <div className="shrink-0 border-b bg-muted/50">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px] bg-muted/50">Symbol</TableHead>
              <TableHead className="w-[100px] text-right bg-muted/50">Overall Score</TableHead>
              <TableHead className="w-[100px] text-right bg-muted/50">Market Pulse</TableHead>
              <TableHead className="w-[110px] text-right bg-muted/50">News Sentiment</TableHead>
              <TableHead className="w-[100px] text-right bg-muted/50">Speech Signal</TableHead>
              <TableHead className="w-[120px] text-right bg-muted/50">Confidence</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Scrollable Table Body */}
      <div className="flex-1 overflow-auto min-h-0">
        <Table className="table-fixed">
          <TableBody>
          {signals.map((signal) => (
            <TableRow
              key={signal.symbol}
              className={`cursor-pointer transition-colors ${
                selectedTicker === signal.symbol
                  ? "bg-primary/10 border-l-2 border-l-primary"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => onSelect(signal.symbol)}
            >
              <TableCell className="w-[180px] font-medium">
                <div className="flex items-center gap-2">
                  <RiskIndicator level={signal.risk_level} />
                  <div>
                    <div>{signal.symbol}</div>
                    {signal.company_name && (
                      <div className="text-xs text-muted-foreground">
                        {signal.company_name}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="w-[100px] text-right">
                <span className={getRiskColor(signal.risk_level)}>
                  {signal.overall_score !== null
                    ? signal.overall_score.toFixed(2)
                    : "—"}
                </span>
              </TableCell>
              <TableCell className="w-[100px] text-right">
                {signal.market ? (
                  <span
                    className={
                      signal.market.is_anomaly
                        ? "text-red-500 font-medium"
                        : ""
                    }
                  >
                    {signal.market.z_score > 0 ? "+" : ""}
                    {signal.market.z_score.toFixed(1)}σ
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="w-[110px] text-right">
                {signal.news ? (
                  <span
                    className={
                      signal.news.avg_tone > 0
                        ? "text-green-500"
                        : signal.news.avg_tone < 0
                          ? "text-red-500"
                          : ""
                    }
                  >
                    {signal.news.avg_tone > 0 ? "+" : ""}
                    {signal.news.avg_tone.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="w-[100px] text-right">
                {signal.speech ? (
                  <Badge
                    variant={
                      signal.speech.tone === "bullish"
                        ? "default"
                        : signal.speech.tone === "bearish"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {signal.speech.tone}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="w-[120px] text-right">
                <ConfidenceBar value={signal.confidence} />
              </TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </div>

      {/* Fixed Footer */}
      <div className="shrink-0 px-4 py-2 border-t text-sm text-muted-foreground bg-muted/50">
        Click any row to see detailed signal breakdown
      </div>
    </div>
  );
}

function RiskIndicator({ level }: { level: string }): React.ReactElement {
  return (
    <div
      className={`w-2 h-2 rounded-full ${getRiskBgColor(level as "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN")}`}
    />
  );
}

function ConfidenceBar({ value }: { value: number }): React.ReactElement {
  const percentage = Math.round(value * 100);
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-right w-8">{percentage}%</span>
    </div>
  );
}
