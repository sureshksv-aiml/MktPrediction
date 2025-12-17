/**
 * GET /api/volatility/anomalies
 * Returns z-score anomalies for all indices
 */

import { NextResponse } from "next/server";
import { getAnomalies } from "@/lib/bigquery/volatility-queries";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const anomalies = await getAnomalies();
    return NextResponse.json({ anomalies });
  } catch (error) {
    console.error("Error fetching anomalies:", error);
    return NextResponse.json(
      { error: "Failed to fetch anomalies" },
      { status: 500 }
    );
  }
}
