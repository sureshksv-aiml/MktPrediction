import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { fetchAllSignals } from "@/lib/bigquery/queries";
import { MOCK_SIGNALS } from "@/lib/signals/mock-data";

/**
 * GET /api/signals - Get market signals for dashboard
 *
 * Fetches real-time signal data from BigQuery:
 * - Market signals from stock_prices table (z-score anomalies)
 * - News signals from GDELT public dataset (sentiment analysis)
 *
 * Falls back to mock data if BigQuery is not configured.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if BigQuery is configured (project ID is required)
    // Will use service account key if provided, otherwise falls back to ADC
    const hasGoogleConfig = !!process.env.GOOGLE_CLOUD_PROJECT;

    if (hasGoogleConfig) {
      try {
        // Fetch real data from BigQuery
        const signals = await fetchAllSignals();

        return NextResponse.json({
          signals,
          timestamp: new Date().toISOString(),
          source: "bigquery",
        });
      } catch (bigqueryError) {
        console.error("BigQuery fetch failed, falling back to mock:", bigqueryError);
        // Fall back to mock data on BigQuery error
        return NextResponse.json({
          signals: MOCK_SIGNALS,
          timestamp: new Date().toISOString(),
          source: "mock",
          warning: "BigQuery unavailable, showing mock data",
        });
      }
    }

    // Return mock data if BigQuery not configured
    return NextResponse.json({
      signals: MOCK_SIGNALS,
      timestamp: new Date().toISOString(),
      source: "mock",
    });
  } catch (error) {
    console.error("Failed to fetch signals:", error);
    return NextResponse.json(
      { error: "Failed to fetch signals" },
      { status: 500 }
    );
  }
}
