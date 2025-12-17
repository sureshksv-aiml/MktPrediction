import { NextResponse } from "next/server";
import { AdkSessionService } from "@/lib/adk/session-service";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(): Promise<NextResponse> {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create new ADK session with user_id in initial state
    // This ensures user_id is available in agent callbacks for report persistence
    const newSession = await AdkSessionService.createSession(userId, {
      user_id: userId,
    });

    return NextResponse.json({
      sessionId: newSession.id,
      success: true,
    });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
