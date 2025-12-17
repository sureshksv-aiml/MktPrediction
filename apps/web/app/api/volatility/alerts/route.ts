/**
 * GET /api/volatility/alerts
 * Returns alerts based on VIX thresholds and anomalies
 */

import { NextResponse } from "next/server";
import { getAlerts } from "@/lib/bigquery/volatility-queries";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const alertsData = await getAlerts();
    return NextResponse.json(alertsData);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
