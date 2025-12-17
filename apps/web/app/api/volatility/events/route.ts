/**
 * GET /api/volatility/events
 * Returns event calendar (Fed meetings, analyst ratings, M&A)
 */

import { NextResponse } from "next/server";
import { getEventCalendar } from "@/lib/bigquery/volatility-queries";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const events = await getEventCalendar();
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching event calendar:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch event calendar", details: errorMessage },
      { status: 500 }
    );
  }
}
