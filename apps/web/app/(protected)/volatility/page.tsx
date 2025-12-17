"use client";

import { useState, useEffect, useCallback } from "react";
import { VolatilityDashboard, VolatilityDetailPanel } from "@/components/volatility";
import {
  MOCK_ALERTS,
  type VolatilityData,
  type Anomaly,
  type AlertsData,
} from "@/lib/volatility/types";

export default function VolatilityPage(): React.ReactElement {
  const [alertsData, setAlertsData] = useState<AlertsData>(MOCK_ALERTS);

  // Fetch alerts from API
  const fetchAlerts = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/volatility/alerts");
      if (res.ok) {
        const data = await res.json() as AlertsData;
        setAlertsData(data);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      // Keep using mock data on error
    }
  }, []);

  // Fetch alerts on mount
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Re-fetch alerts when dashboard data updates
  const handleDataUpdate = (_data: { volatilityData: VolatilityData; anomalies: Anomaly[] }): void => {
    fetchAlerts();
  };

  return (
    <div className="h-full flex">
      {/* Panel 2: Main Dashboard */}
      <div className="flex-1 border-r overflow-hidden">
        <VolatilityDashboard onDataUpdate={handleDataUpdate} />
      </div>

      {/* Panel 3: Detail Panel (Alerts + Chat) */}
      <div className="w-80 lg:w-96 shrink-0 overflow-hidden hidden md:block">
        <VolatilityDetailPanel alertsData={alertsData} />
      </div>
    </div>
  );
}
