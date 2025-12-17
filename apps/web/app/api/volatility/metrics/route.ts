/**
 * GET /api/volatility/metrics
 * Returns current VIX level, regime, percentile, and historical volatility
 */

import { NextResponse } from "next/server";
import { getVolatilityMetrics } from "@/lib/bigquery/volatility-queries";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const metrics = await getVolatilityMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching volatility metrics:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch volatility metrics", details: errorMessage },
      { status: 500 }
    );
  }
}
