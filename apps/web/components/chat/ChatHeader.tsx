"use client";

import { useTopic } from "@/contexts/TopicContext";
import { MessageSquare } from "lucide-react";

export function ChatHeader(): React.ReactElement {
  const { selectedTopic } = useTopic();

  return (
    <div className="h-14 border-b bg-background px-4 flex items-center">
      <div className="max-w-4xl mx-auto flex items-center gap-2 w-full">
        <MessageSquare className="h-5 w-5 text-primary" strokeWidth={2.5} />
        <h1 className="text-lg font-semibold">
          {selectedTopic.name} Report Analytics Chat Assistant
        </h1>
      </div>
    </div>
  );
}
