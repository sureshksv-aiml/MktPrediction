"use client";

import { useState, useCallback, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/contexts/UserContext";
import { getSessionEvents } from "@/app/actions/sessions";
import { convertAdkEventsToMessages } from "@/lib/utils/message-converter";

interface MiniChatProps {
  ticker: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_ATTEMPTS = 30; // 60 seconds max wait

export function MiniChat({ ticker }: MiniChatProps): React.ReactElement {
  const { id: userId } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  // Create a session for this mini chat (lazy initialization)
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

  // Poll for agent response
  const pollForResponse = useCallback(
    async (sessionId: string): Promise<string | null> => {
      let attempts = 0;

      while (attempts < MAX_POLL_ATTEMPTS) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

        try {
          const result = await getSessionEvents(userId, sessionId);

          if (!result.success || !result.data) {
            continue;
          }

          const { messages: serverMessages } = convertAdkEventsToMessages(
            result.data.events
          );

          // Find new model messages (more than we had before)
          const modelMessages = serverMessages.filter(
            (msg) => msg.type === "model"
          );

          if (modelMessages.length > lastMessageCountRef.current) {
            // Get the latest model message
            const latestResponse = modelMessages[modelMessages.length - 1];
            lastMessageCountRef.current = modelMessages.length;
            return latestResponse.content;
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }

      return null; // Timeout
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
      // Get or create session
      const sessionId = await getOrCreateSession();
      if (!sessionId) {
        throw new Error("No session available");
      }

      // Prepend ticker context to the message
      const contextualMessage = `Regarding ${ticker}: ${userMessage}`;

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
        // Poll for the agent response
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
  }, [input, loading, ticker, userId, getOrCreateSession, pollForResponse]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  if (!userId) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ask about {ticker}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please log in to use the chat feature.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Ask about {ticker}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Messages */}
        {messages.length > 0 && (
          <div className="max-h-48 overflow-auto space-y-2 text-sm">
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
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder={`Ask about ${ticker} signals...`}
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
      </CardContent>
    </Card>
  );
}
