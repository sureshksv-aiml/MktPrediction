"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Building2, TrendingUp, Landmark, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EventCalendarData, FedEvent, AnalystRating, MnAEvent } from "@/lib/volatility/types";

export function EventsCalendar(): React.ReactElement {
  const [eventsData, setEventsData] = useState<EventCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/volatility/events");
      if (!res.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await res.json() as EventCalendarData;
      setEventsData(data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (loading) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">EVENTS CALENDAR</h3>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !eventsData) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">EVENTS CALENDAR</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchEvents}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{error || "No events data available"}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border h-full flex flex-col overflow-hidden">
      <div className="shrink-0 p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-muted-foreground">EVENTS CALENDAR</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchEvents} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Tabs defaultValue="fed" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="shrink-0 w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="fed"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-1.5 text-xs"
          >
            <Landmark className="h-3 w-3 mr-1" />
            Fed ({eventsData.fed_meetings.length})
          </TabsTrigger>
          <TabsTrigger
            value="ratings"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-1.5 text-xs"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Ratings ({eventsData.analyst_ratings.length})
          </TabsTrigger>
          <TabsTrigger
            value="mna"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-1.5 text-xs"
          >
            <Building2 className="h-3 w-3 mr-1" />
            M&A ({eventsData.mna_events.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fed" className="flex-1 mt-0 overflow-hidden">
          <div className="divide-y h-full overflow-y-auto">
            {eventsData.fed_meetings.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No Fed communications available
              </div>
            ) : (
              eventsData.fed_meetings.slice(0, 3).map((event, idx) => (
                <FedEventRow key={`${event.date}-${idx}`} event={event} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="ratings" className="flex-1 mt-0 overflow-hidden">
          <div className="divide-y h-full overflow-y-auto">
            {eventsData.analyst_ratings.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No analyst ratings available
              </div>
            ) : (
              eventsData.analyst_ratings.slice(0, 3).map((rating, idx) => (
                <AnalystRatingRow key={`${rating.date}-${idx}`} rating={rating} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="mna" className="flex-1 mt-0 overflow-hidden">
          <div className="divide-y h-full overflow-y-auto">
            {eventsData.mna_events.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No M&A events available
              </div>
            ) : (
              eventsData.mna_events.slice(0, 3).map((event, idx) => (
                <MnAEventRow key={`${event.parent_company}-${event.acquired_company}-${idx}`} event={event} />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FedEventRow({ event }: { event: FedEvent }): React.ReactElement {
  return (
    <div className="p-3 hover:bg-muted/50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          {event.type}
        </span>
        <span className="text-xs text-muted-foreground">{event.date}</span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">{event.summary}</p>
    </div>
  );
}

function AnalystRatingRow({ rating }: { rating: AnalystRating }): React.ReactElement {
  return (
    <div className="p-3 hover:bg-muted/50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{rating.stock}</span>
        <span className="text-xs text-muted-foreground">{rating.date}</span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">{rating.title}</p>
    </div>
  );
}

function MnAEventRow({ event }: { event: MnAEvent }): React.ReactElement {
  return (
    <div className="p-3 hover:bg-muted/50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{event.parent_company}</span>
        <span className="text-xs text-muted-foreground">{event.month} {event.year}</span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Acquired: {event.acquired_company}
        </p>
        {event.price && (
          <span className="text-xs font-mono text-green-600 dark:text-green-400">
            ${(event.price / 1e9).toFixed(1)}B
          </span>
        )}
      </div>
      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground mt-1 inline-block">
        {event.category}
      </span>
    </div>
  );
}
