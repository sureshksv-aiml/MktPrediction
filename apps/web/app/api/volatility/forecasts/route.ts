/**
 * GET /api/volatility/forecasts
 * Returns volatility forecasts for major indices (SPX, NDX, DJI, RUT)
 */

import { NextResponse } from "next/server";
import { getVolatilityForecasts } from "@/lib/bigquery/volatility-queries";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const data = await getVolatilityForecasts();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching volatility forecasts:", error);
    return NextResponse.json(
      { error: "Failed to fetch volatility forecasts" },
      { status: 500 }
    );
  }
}
