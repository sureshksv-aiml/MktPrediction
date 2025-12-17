"use client";

import { useUser } from "@/contexts/UserContext";
import { User } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function UserDisplay(): React.ReactElement {
  const { full_name, email } = useUser();
  const { open, isMobile } = useSidebar();

  const displayName = full_name || email || "User";
  const renderContentAsOpen = open || isMobile;

  // Match nav item structure for consistent alignment
  return (
    <div className={cn("flex justify-center", renderContentAsOpen && "px-2")}>
      <div
        className={cn(
          "flex items-center w-full rounded-lg text-muted-foreground",
          renderContentAsOpen ? "px-3 py-2 gap-3" : "h-9 w-9 justify-center p-0"
        )}
        title={displayName}
      >
        <User className="h-5 w-5 flex-shrink-0" strokeWidth={2.5} />
        {renderContentAsOpen && (
          <span className="text-sm truncate">{displayName}</span>
        )}
      </div>
    </div>
  );
}
