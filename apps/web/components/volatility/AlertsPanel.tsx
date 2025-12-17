"use client";

import { AlertTriangle, Info, XCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Alert, AlertsData } from "@/lib/volatility/types";

interface AlertsPanelProps {
  alertsData: AlertsData;
}

const severityConfig = {
  critical: {
    icon: XCircle,
    bgColor: "bg-red-50 dark:bg-red-950",
    borderColor: "border-red-200 dark:border-red-800",
    textColor: "text-red-700 dark:text-red-300",
    iconColor: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    textColor: "text-yellow-700 dark:text-yellow-300",
    iconColor: "text-yellow-500",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50 dark:bg-blue-950",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-700 dark:text-blue-300",
    iconColor: "text-blue-500",
  },
};

export function AlertsPanel({ alertsData }: AlertsPanelProps): React.ReactElement {
  const { alerts, has_critical, has_warning } = alertsData;

  // All alerts from the API are active (generated in real-time from SQL)
  const activeAlerts = alerts;

  return (
    <div className="bg-card rounded-lg border">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">
            ACTIVE ALERTS
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {has_critical && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              Critical
            </span>
          )}
          {has_warning && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
              Warning
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            ({activeAlerts.length})
          </span>
        </div>
      </div>

      <div className="divide-y max-h-64 overflow-y-auto">
        {activeAlerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={cn(
                "p-3 border-l-4",
                config.bgColor,
                config.borderColor
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn("h-5 w-5 mt-0.5", config.iconColor)} />
                <div className="flex-1 min-w-0">
                  <div className={cn("font-medium text-sm", config.textColor)}>
                    {alert.severity.toUpperCase()}
                    {alert.symbol && (
                      <span className="ml-2 font-normal">({alert.symbol})</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {alert.message}
                  </p>
                  <div className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                    {new Date(alert.triggered_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {activeAlerts.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No active alerts</p>
            <p className="text-xs mt-1">Market conditions are normal</p>
          </div>
        )}
      </div>
    </div>
  );
}
