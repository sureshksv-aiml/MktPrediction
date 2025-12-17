"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader2, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/contexts/UserContext";
import { getSessionEvents } from "@/app/actions/sessions";
import { convertAdkEventsToMessages } from "@/lib/utils/message-converter";
import type { SignalProfile } from "@/lib/signals/types";

interface ChatPanelProps {
  ticker: string | null;
  isCollapsed: boolean;
  onToggle: () => void;
  profile: SignalProfile;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const POLL_INTERVAL = 2000;
const MAX_POLL_ATTEMPTS = 30;

export function ChatPanel({ ticker, isCollapsed, onToggle, profile }: ChatPanelProps): React.ReactElement {
  const { id: userId } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

          const modelMessages = serverMessages.filter(
            (msg) => msg.type === "model"
          );

          if (modelMessages.length > lastMessageCountRef.current) {
            const latestResponse = modelMessages[modelMessages.length - 1];
            lastMessageCountRef.current = modelMessages.length;
            return latestResponse.content;
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

      const contextualMessage = ticker
        ? `Regarding ${ticker}: ${userMessage}`
        : userMessage;

      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          message: contextualMessage,
          sessionId,
          profile,
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
              content: "Response is taking longer than expected. Please try again.",
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
  }, [input, loading, ticker, userId, profile, getOrCreateSession, pollForResponse]);

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
    return <></>;
  }

  // Collapsed state - just show toggle button
  if (isCollapsed) {
    return (
      <div className="p-4 pl-0">
        <div className="w-12 bg-muted/50 rounded-lg border border-border/80 flex flex-col items-center py-4 h-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="hover:bg-muted"
            title="Open chat"
          >
            <PanelRightOpen className="h-5 w-5" />
          </Button>
          <div className="mt-4 writing-mode-vertical text-xs text-muted-foreground">
            Chat
          </div>
        </div>
      </div>
    );
  }

  // Expanded state - full chat panel
  return (
    <div className="p-4 pl-0">
      <div className="w-80 flex flex-col bg-muted/50 rounded-lg border border-border/80 h-full">
      {/* Header */}
      <div className="p-3 border-b border-border/50 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <div>
            <h3 className="font-medium text-sm">
              {ticker ? `Ask about ${ticker}` : "Signal Assistant"}
            </h3>
            <p className="text-xs text-muted-foreground">
              AI-powered market insights
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
          title="Collapse chat"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">
              {ticker
                ? `Ask a question about ${ticker}`
                : "Select a ticker to ask questions"}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-lg text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground ml-4"
                  : "bg-muted mr-4"
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
        {loading && (
          <div className="bg-muted p-2.5 rounded-lg mr-4 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs text-muted-foreground">Analyzing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border/50 rounded-b-lg">
        <div className="flex gap-2">
          <Input
            placeholder={ticker ? `Ask about ${ticker}...` : "Ask a question..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1 text-sm h-9"
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            size="sm"
            className="h-9 w-9 p-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
