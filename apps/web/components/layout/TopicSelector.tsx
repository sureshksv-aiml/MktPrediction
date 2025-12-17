"use client";

import { useTopic } from "@/contexts/TopicContext";
import { ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { getLastActiveSession } from "@/contexts/ChatStateContext";

export function TopicSelector(): React.ReactElement {
  const { topics, selectedTopic, selectTopic } = useTopic();
  const { open, isMobile, toggleSidebar } = useSidebar();
  const router = useRouter();

  const renderContentAsOpen = open || isMobile;

  if (!renderContentAsOpen) {
    // Collapsed state - just show the icon for selected topic
    return (
      <div className="py-2 px-2 flex justify-center">
        <div
          className="h-9 w-9 flex items-center justify-center rounded-md bg-primary/10 text-primary"
          title={selectedTopic.name}
        >
          <Activity className="h-5 w-5" strokeWidth={2.5} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Topic
      </p>
      <div className="space-y-1">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => {
              selectTopic(topic.id);
              // Navigate to last active session if available, otherwise start fresh
              const lastSession = getLastActiveSession();
              if (lastSession) {
                router.push(`/chat/${lastSession}`);
              } else {
                router.push("/chat");
              }
              // Close mobile sidebar after navigation
              if (isMobile) {
                toggleSidebar();
              }
            }}
            disabled={!topic.isActive}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors",
              topic.id === selectedTopic.id
                ? "bg-primary/10 text-primary font-medium"
                : topic.isActive
                  ? "hover:bg-accent text-foreground"
                  : "text-muted-foreground/50 cursor-not-allowed"
            )}
          >
            <Activity className="h-4 w-4" strokeWidth={2.5} />
            <span className="flex-1 text-left">{topic.name}</span>
            {topic.id === selectedTopic.id && (
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
