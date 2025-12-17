"use client";

import { AlertCircle, CheckCircle, TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Anomaly } from "@/lib/volatility/types";

interface AnomalyListProps {
  anomalies: Anomaly[];
}

export function AnomalyList({ anomalies }: AnomalyListProps): React.ReactElement {
  const getStatusColor = (status: string, zscore: number): string => {
    if (status === "ANOMALY") {
      return zscore > 0 ? "text-red-500" : "text-orange-500";
    }
    return "text-green-500";
  };

  const getIcon = (type: string): React.ReactElement => {
    return type === "price" ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <BarChart3 className="h-4 w-4" />
    );
  };

  const getStatusIcon = (status: string): React.ReactElement => {
    return status === "ANOMALY" ? (
      <AlertCircle className="h-4 w-4" />
    ) : (
      <CheckCircle className="h-4 w-4" />
    );
  };

  return (
    <div className="bg-card rounded-lg border h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b shrink-0">
        <h3 className="text-sm font-medium text-muted-foreground">
          ANOMALIES DETECTED
        </h3>
      </div>

      <div className="divide-y flex-1 overflow-auto">
        {anomalies.map((anomaly, index) => (
          <div
            key={`${anomaly.symbol}-${anomaly.type}-${index}`}
            className="p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "p-1.5 rounded",
                  anomaly.status === "ANOMALY"
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                )}
              >
                {getStatusIcon(anomaly.status)}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{anomaly.symbol}</span>
                  <span className="text-muted-foreground flex items-center gap-1 text-sm">
                    {getIcon(anomaly.type)}
                    {anomaly.type}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {anomaly.status === "ANOMALY"
                    ? `${Math.abs(anomaly.zscore).toFixed(1)}σ ${
                        anomaly.zscore > 0 ? "above" : "below"
                      } average`
                    : "Normal trading patterns"}
                </div>
              </div>
            </div>
            <span
              className={cn(
                "text-sm font-mono",
                getStatusColor(anomaly.status, anomaly.zscore)
              )}
            >
              z={anomaly.zscore.toFixed(2)}
            </span>
          </div>
        ))}

        {anomalies.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            No anomalies detected
          </div>
        )}
      </div>
    </div>
  );
}
