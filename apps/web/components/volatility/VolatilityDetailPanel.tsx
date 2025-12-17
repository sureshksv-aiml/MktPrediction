"use client";

import { useState, useCallback, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertsPanel } from "./AlertsPanel";
import { useUser } from "@/contexts/UserContext";
import { getSessionEvents } from "@/app/actions/sessions";
import { convertAdkEventsToMessages } from "@/lib/utils/message-converter";
import {
  MOCK_ALERTS,
  type AlertsData,
} from "@/lib/volatility/types";

interface VolatilityDetailPanelProps {
  alertsData?: AlertsData;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const POLL_INTERVAL = 2000;
const MAX_POLL_ATTEMPTS = 30;

export function VolatilityDetailPanel({ alertsData = MOCK_ALERTS }: VolatilityDetailPanelProps): React.ReactElement {
  const { id: userId } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  const getOrCreateSession = useCallback(async (): Promise<string | null> => {
    if (sessionIdRef.current) {
      return sessionIdRef.current;
    }

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error("Failed to create session");
      }

      const data = await res.json();
      sessionIdRef.current = data.sessionId;
      return data.sessionId;
    } catch (error) {
      console.error("Failed to create session:", error);
      return null;
    }
  }, []);

  const pollForResponse = useCallback(
    async (sessionId: string): Promise<string | null> => {
      let attempts = 0;
      let lastEventCount = 0;
      let stableCount = 0;

      while (attempts < MAX_POLL_ATTEMPTS) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

        try {
          const result = await getSessionEvents(userId, sessionId);

          if (!result.success || !result.data) {
            continue;
          }

          const events = result.data.events;
          const { messages: serverMessages } = convertAdkEventsToMessages(events);

          // Debug: log all agent names
          const modelMessages = serverMessages.filter((msg) => msg.type === "model");
          const agents = modelMessages.map((msg) => msg.agent);
          console.log("[POLL] Agents found:", [...new Set(agents)]);
          console.log("[POLL] Event count:", events.length, "Model messages:", modelMessages.length);

          // Wait for event count to stabilize (pipeline complete)
          if (events.length === lastEventCount && events.length > 0) {
            stableCount++;
            // After 2 stable polls (4 seconds), return the last model message
            if (stableCount >= 2 && modelMessages.length > lastMessageCountRef.current) {
              const latestResponse = modelMessages[modelMessages.length - 1];
              lastMessageCountRef.current = modelMessages.length;
              console.log("[POLL] Returning response from:", latestResponse.agent);
              return latestResponse.content;
            }
          } else {
            stableCount = 0;
            lastEventCount = events.length;
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }

      return null;
    },
    [userId]
  );

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading || !userId) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const sessionId = await getOrCreateSession();
      if (!sessionId) {
        throw new Error("No session available");
      }

      // Add volatility context to the message
      const contextualMessage = `Regarding market volatility: ${userMessage}`;

      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          message: contextualMessage,
          sessionId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const data = await res.json();

      if (data.success) {
        const response = await pollForResponse(sessionId);

        if (response) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: response },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Response is taking longer than expected. Please check the main chat.",
            },
          ]);
        }
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, an error occurred. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, userId, getOrCreateSession, pollForResponse]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Alerts Panel */}
      <div className="shrink-0 p-4 pb-2">
        <AlertsPanel alertsData={alertsData} />
      </div>

      {/* Chat Panel */}
      <div className="flex-1 p-4 pt-2 min-h-0">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-base">Ask about Volatility</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 space-y-3">
            {!userId ? (
              <p className="text-sm text-muted-foreground">
                Please log in to use the chat feature.
              </p>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-auto space-y-2 text-sm min-h-0">
                  {messages.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Ask questions like &quot;Why is VIX elevated?&quot;
                    </p>
                  )}
                  {messages.slice(-5).map((msg, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground ml-4"
                          : "bg-muted mr-4"
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="flex gap-2 shrink-0">
                  <Input
                    placeholder="Ask about volatility..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                  />
                  <Button size="icon" onClick={sendMessage} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
