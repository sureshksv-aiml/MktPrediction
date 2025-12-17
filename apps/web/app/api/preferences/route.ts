import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/drizzle/db";
import { userPreferences } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import type { CustomProfile } from "@/lib/drizzle/schema/user-preferences";

const BUILT_IN_PROFILES = ["quant", "fundamental", "news", "balanced"];

/**
 * GET /api/preferences - Get user preferences
 *
 * Returns the user's signal profile and watched tickers.
 * Falls back to defaults if no preferences exist.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await db
      .select({
        signal_profile: userPreferences.signal_profile,
        watched_tickers: userPreferences.watched_tickers,
        custom_profiles: userPreferences.custom_profiles,
      })
      .from(userPreferences)
      .where(eq(userPreferences.user_id, userId))
      .limit(1);

    // Return existing preferences or defaults
    if (preferences.length > 0) {
      return NextResponse.json({
        signal_profile: preferences[0].signal_profile,
        watched_tickers: preferences[0].watched_tickers ?? [],
        custom_profiles: (preferences[0].custom_profiles as CustomProfile[]) ?? [],
      });
    }

    // Return defaults if no preferences exist
    return NextResponse.json({
      signal_profile: "balanced",
      watched_tickers: [],
      custom_profiles: [],
    });
  } catch (error) {
    console.error("Failed to get preferences:", error);
    return NextResponse.json(
      { error: "Failed to get preferences" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/preferences - Update user preferences
 *
 * Updates the user's signal profile and/or watched tickers.
 * Uses atomic UPSERT (insert or update in single query).
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate signal_profile if provided
    if (body.signal_profile !== undefined) {
      const isBuiltIn = BUILT_IN_PROFILES.includes(body.signal_profile);
      const isCustom = body.signal_profile.startsWith("custom_");
      if (!isBuiltIn && !isCustom) {
        return NextResponse.json(
          {
            error: `Invalid signal_profile. Must be one of: ${BUILT_IN_PROFILES.join(", ")} or a custom profile ID`,
          },
          { status: 400 }
        );
      }
    }

    // Validate watched_tickers if provided
    if (body.watched_tickers !== undefined) {
      if (!Array.isArray(body.watched_tickers)) {
        return NextResponse.json(
          { error: "watched_tickers must be an array" },
          { status: 400 }
        );
      }
      if (!body.watched_tickers.every((t: unknown) => typeof t === "string")) {
        return NextResponse.json(
          { error: "watched_tickers must be an array of strings" },
          { status: 400 }
        );
      }
    }

    // Validate custom_profiles if provided
    if (body.custom_profiles !== undefined) {
      if (!Array.isArray(body.custom_profiles)) {
        return NextResponse.json(
          { error: "custom_profiles must be an array" },
          { status: 400 }
        );
      }
      for (const profile of body.custom_profiles) {
        if (!profile.id || !profile.name || !profile.weights) {
          return NextResponse.json(
            { error: "Each custom profile must have id, name, and weights" },
            { status: 400 }
          );
        }
        const { market, news, speech } = profile.weights;
        if (typeof market !== "number" || typeof news !== "number" || typeof speech !== "number") {
          return NextResponse.json(
            { error: "Profile weights must be numbers" },
            { status: 400 }
          );
        }
        const total = market + news + speech;
        if (Math.abs(total - 100) > 0.01) {
          return NextResponse.json(
            { error: "Profile weights must sum to 100%" },
            { status: 400 }
          );
        }
      }
    }

    // Atomic UPSERT: Insert if not exists, update if exists
    const result = await db
      .insert(userPreferences)
      .values({
        user_id: userId,
        signal_profile: body.signal_profile ?? "balanced",
        watched_tickers: body.watched_tickers ?? [],
        custom_profiles: body.custom_profiles ?? [],
      })
      .onConflictDoUpdate({
        target: userPreferences.user_id,
        set: {
          ...(body.signal_profile !== undefined && {
            signal_profile: body.signal_profile,
          }),
          ...(body.watched_tickers !== undefined && {
            watched_tickers: body.watched_tickers,
          }),
          ...(body.custom_profiles !== undefined && {
            custom_profiles: body.custom_profiles,
          }),
          updated_at: new Date(),
        },
      })
      .returning({
        signal_profile: userPreferences.signal_profile,
        watched_tickers: userPreferences.watched_tickers,
        custom_profiles: userPreferences.custom_profiles,
      });

    return NextResponse.json({
      signal_profile: result[0].signal_profile,
      watched_tickers: result[0].watched_tickers ?? [],
      custom_profiles: (result[0].custom_profiles as CustomProfile[]) ?? [],
    });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
