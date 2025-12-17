"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { useChatState } from "@/contexts/ChatStateContext";
import { useSidebar } from "@/components/ui/sidebar";

export function ChatContainer(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useChatState();
  const { isMobile, state: sidebarState } = useSidebar();

  // Handle URL error parameters
  useEffect(() => {
    const error = searchParams.get("error");

    if (error) {
      toast.error("AI Request Failed", {
        description: error,
        duration: 8000,
      });

      // Clean up URL parameters
      if (session?.id) {
        router.replace(`/chat/${session.id}`);
      }
    }
  }, [searchParams, router, session?.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <ChatHeader />

      {/* Messages Area - Scrollable with fixed bottom padding for input */}
      <div className="flex-1 overflow-y-auto pb-40 sm:pb-48">
        <div className="w-full max-w-4xl mx-auto">
          <MessageList />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div
        className={cn(
          "fixed bottom-0 right-0 z-40 transition-[left] duration-200 ease-linear",
          isMobile
            ? "left-0"
            : sidebarState === "collapsed"
              ? "left-16"
              : "left-64"
        )}
      >
        <div
          className={cn(
            "w-full px-4 bg-background",
            isMobile ? "pb-2" : "pb-4"
          )}
        >
          <div className="max-w-4xl mx-auto">
            <ChatInput />
          </div>
        </div>
      </div>
    </div>
  );
}
