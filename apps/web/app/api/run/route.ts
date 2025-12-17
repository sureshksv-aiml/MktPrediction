import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { UnifiedRequestHandler } from "@/lib/adk/request-handler";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Step 1: Get user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Step 2: Extract and validate request data
    const { userId: requestUserId, message, sessionId, profile } = await request.json();

    console.log("[ADK CHAT] 📋 Processing request:", {
      requestUserId,
      message: message?.substring(0, 50),
      sessionId,
      profile,
    });

    if (!requestUserId || !message || !sessionId) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Include profile in the message context
    const contextualMessage = profile
      ? `[Signal Profile: ${profile}] ${message}`
      : message;

    console.log("[ADK CHAT] 🚀 Triggering ADK agent for session:", sessionId);

    // Step 3: Use UnifiedRequestHandler for proper backend handling
    // Fire-and-forget: don't await the result
    const handler = new UnifiedRequestHandler();
    handler.processAgentRequest(sessionId, contextualMessage, requestUserId)
      .then((result) => {
        if (!result.success) {
          console.error("[ADK CHAT] Agent trigger failed:", result.error);
        } else {
          console.log("[ADK CHAT] Agent successfully triggered");
        }
      })
      .catch((error) => {
        console.error("[ADK CHAT] Agent trigger error:", error);
      });

    // Step 4: Return success response immediately
    return Response.json({
      success: true,
      message: "Message sent successfully",
      session_id: sessionId,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[ADK CHAT] Chat request error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return new Response(errorMessage, { status: 500 });
  }
}
