"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SignalCardProps {
  title: string;
  icon: ReactNode;
  available: boolean;
  children: ReactNode;
}

export function SignalCard({
  title,
  icon,
  available,
  children,
}: SignalCardProps): React.ReactElement {
  return (
    <Card className={!available ? "opacity-60" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </div>
          {!available && (
            <Badge variant="outline" className="text-xs">
              No Data
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {available ? (
          children
        ) : (
          <p className="text-sm text-muted-foreground">
            Signal data not available for this ticker.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
