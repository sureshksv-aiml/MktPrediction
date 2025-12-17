"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TickerTable } from "./TickerTable";
import { DetailPanel } from "./DetailPanel";
import { ProfileSelector } from "./ProfileSelector";
import { ChatPanel } from "./ChatPanel";
import {
  type TickerSignals,
  type SignalProfile,
  type MarketSignal,
  type NewsSignal,
  type SpeechSignal,
  SIGNAL_PROFILES,
  calculateOverallScore,
  getRiskLevel,
} from "@/lib/signals/types";
import type { CustomProfile } from "@/lib/drizzle/schema/user-preferences";

// Raw signal data from API (before score calculation)
interface RawSignalData {
  symbol: string;
  company_name?: string;
  market: MarketSignal | null;
  news: NewsSignal | null;
  speech: SpeechSignal | null;
}

// Mock data - replace BigQuery API calls for demo/testing
const MOCK_SIGNALS: RawSignalData[] = [
  {
    symbol: "TSLA",
    company_name: "Tesla Inc",
    market: { symbol: "TSLA", date: "2025-12-15", close_price: 421.06, z_score: 2.1, volume: 98500000, avg_30d: 405.5, is_anomaly: true },
    news: { symbol: "TSLA", date: "2025-12-15", avg_tone: 3.5, article_count: 45, positive_pct: 0.65, sample_headlines: ["Tesla Q4 deliveries beat expectations", "Cybertruck demand surges in Q4"] },
    speech: { symbol: "TSLA", event: "Q3 2024 Earnings", tone: "bullish", guidance: "Strong growth projected for 2025", topics: ["FSD", "Energy Storage", "Cybertruck"], risks: ["Competition", "Supply Chain"], processed_at: "2024-10-23" },
  },
  {
    symbol: "AAPL",
    company_name: "Apple Inc",
    market: { symbol: "AAPL", date: "2025-12-15", close_price: 248.13, z_score: 0.8, volume: 45000000, avg_30d: 242.0, is_anomaly: false },
    news: { symbol: "AAPL", date: "2025-12-15", avg_tone: 2.1, article_count: 32, positive_pct: 0.58, sample_headlines: ["iPhone 16 sales strong in holiday season", "Apple Intelligence features rolling out"] },
    speech: { symbol: "AAPL", event: "Q4 2024 Earnings", tone: "neutral", guidance: "Steady revenue expected in services", topics: ["Services", "AI", "Vision Pro"], risks: ["China sales decline"], processed_at: "2024-11-01" },
  },
  {
    symbol: "NVDA",
    company_name: "NVIDIA Corporation",
    market: { symbol: "NVDA", date: "2025-12-15", close_price: 134.25, z_score: 1.9, volume: 312000000, avg_30d: 128.5, is_anomaly: true },
    news: { symbol: "NVDA", date: "2025-12-15", avg_tone: 4.2, article_count: 67, positive_pct: 0.78, sample_headlines: ["NVIDIA Blackwell chips in high demand", "AI infrastructure spending accelerates"] },
    speech: { symbol: "NVDA", event: "Q3 FY25 Earnings", tone: "bullish", guidance: "Record data center revenue projected", topics: ["Blackwell", "Data Center", "AI"], risks: ["Export restrictions"], processed_at: "2024-11-20" },
  },
  {
    symbol: "MSFT",
    company_name: "Microsoft Corporation",
    market: { symbol: "MSFT", date: "2025-12-15", close_price: 446.95, z_score: 0.3, volume: 18500000, avg_30d: 442.0, is_anomaly: false },
    news: { symbol: "MSFT", date: "2025-12-15", avg_tone: 1.8, article_count: 28, positive_pct: 0.55, sample_headlines: ["Microsoft Azure growth steady", "Copilot adoption increasing"] },
    speech: { symbol: "MSFT", event: "Q1 FY25 Earnings", tone: "neutral", guidance: "Cloud growth to continue", topics: ["Azure", "Copilot", "Gaming"], risks: ["AI infrastructure costs"], processed_at: "2024-10-30" },
  },
  {
    symbol: "GOOGL",
    company_name: "Alphabet Inc",
    market: { symbol: "GOOGL", date: "2025-12-15", close_price: 191.41, z_score: -0.5, volume: 22000000, avg_30d: 195.0, is_anomaly: false },
    news: { symbol: "GOOGL", date: "2025-12-15", avg_tone: -1.2, article_count: 41, positive_pct: 0.38, sample_headlines: ["Google faces antitrust ruling concerns", "Gemini competition intensifies"] },
    speech: { symbol: "GOOGL", event: "Q3 2024 Earnings", tone: "bearish", guidance: "Regulatory headwinds expected", topics: ["Search", "Cloud", "AI"], risks: ["Antitrust", "AI competition"], processed_at: "2024-10-29" },
  },
  {
    symbol: "AMZN",
    company_name: "Amazon.com Inc",
    market: { symbol: "AMZN", date: "2025-12-15", close_price: 227.03, z_score: 1.2, volume: 42000000, avg_30d: 218.5, is_anomaly: false },
    news: { symbol: "AMZN", date: "2025-12-15", avg_tone: 2.5, article_count: 35, positive_pct: 0.62, sample_headlines: ["AWS momentum continues", "Holiday retail sales exceed forecasts"] },
    speech: { symbol: "AMZN", event: "Q3 2024 Earnings", tone: "bullish", guidance: "AWS and retail growth strong", topics: ["AWS", "Retail", "Advertising"], risks: ["Labor costs"], processed_at: "2024-10-31" },
  },
];

// Hook to detect mobile viewport
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = (): void => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export function DashboardContent(): React.ReactElement {
  // Raw signals from API (unchanged by profile)
  const [rawSignals, setRawSignals] = useState<RawSignalData[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [profile, setProfile] = useState<SignalProfile>("balanced");
  const [customProfiles, setCustomProfiles] = useState<CustomProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  const isMobile = useIsMobile();

  // Get weights for current profile (built-in or custom)
  const getProfileWeights = useCallback(
    (profileId: SignalProfile): { market: number; news: number; speech: number } => {
      // Check built-in profiles first
      const builtIn = SIGNAL_PROFILES[profileId as keyof typeof SIGNAL_PROFILES];
      if (builtIn) return builtIn.weights;

      // Check custom profiles
      const custom = customProfiles.find((p) => p.id === profileId);
      if (custom) {
        // Convert percentages to decimals for calculation
        return {
          market: custom.weights.market / 100,
          news: custom.weights.news / 100,
          speech: custom.weights.speech / 100,
        };
      }

      // Fallback to balanced
      return SIGNAL_PROFILES.balanced.weights;
    },
    [customProfiles]
  );

  // Process raw signals with current profile weights (computed, not state)
  const signals: TickerSignals[] = useMemo(() => {
    if (rawSignals.length === 0) return [];

    const weights = getProfileWeights(profile);

    return rawSignals.map((s) => {
      const { score, confidence } = calculateOverallScore(
        { market: s.market, news: s.news, speech: s.speech },
        weights
      );

      return {
        ...s,
        overall_score: score,
        confidence,
        risk_level: getRiskLevel(score),
        profile,
      };
    });
  }, [rawSignals, profile, getProfileWeights]);

  // Auto-select first ticker when signals load
  useEffect(() => {
    if (signals.length > 0 && selectedTicker === null) {
      setSelectedTicker(signals[0].symbol);
    }
  }, [signals, selectedTicker]);

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async (): Promise<void> => {
      try {
        const res = await fetch("/api/preferences");
        if (res.ok) {
          const prefs = await res.json();
          // Load custom profiles first
          if (prefs.custom_profiles && Array.isArray(prefs.custom_profiles)) {
            setCustomProfiles(prefs.custom_profiles);
          }
          // Set active profile (built-in or custom)
          if (prefs.signal_profile) {
            const isBuiltIn = prefs.signal_profile in SIGNAL_PROFILES;
            const isCustom = prefs.custom_profiles?.some(
              (p: CustomProfile) => p.id === prefs.signal_profile
            );
            if (isBuiltIn || isCustom) {
              setProfile(prefs.signal_profile as SignalProfile);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load preferences:", err);
      } finally {
        setPreferencesLoaded(true);
      }
    };

    loadPreferences();
  }, []);

  // Save profile preference when changed (fire and forget)
  const handleProfileChange = useCallback(
    async (newProfile: SignalProfile): Promise<void> => {
      setProfile(newProfile);

      try {
        await fetch("/api/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signal_profile: newProfile }),
        });
      } catch (err) {
        console.error("Failed to save preference:", err);
        toast.error("Failed to save profile preference");
      }
    },
    []
  );

  // Fetch raw signals - using mock data instead of BigQuery API
  const fetchSignals = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Simulate network delay for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Use mock data instead of API call
      setRawSignals(MOCK_SIGNALS);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load signals";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch signals on mount (after preferences loaded)
  useEffect(() => {
    if (preferencesLoaded) {
      fetchSignals();
    }
  }, [preferencesLoaded, fetchSignals]);

  // Get selected signal data
  const selectedSignal = signals.find((s) => s.symbol === selectedTicker);

  // Show detail panel when a signal is selected
  const showDetailPanel = selectedSignal !== undefined;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main Content Area (Dashboard + Detail) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar - Fixed, never scrolls */}
        <div className="shrink-0 p-4 pb-2">
          <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-4 shadow-sm border border-border/80">
            <ProfileSelector
              value={profile}
              onChange={handleProfileChange}
              disabled={loading}
              customProfiles={customProfiles}
            />

            <div className="ml-auto flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSignals}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="shrink-0 px-4 py-2 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Table Area - Middle section that contains scrolling */}
        <div className="flex-1 min-h-0 px-4 py-2 flex flex-col overflow-hidden">
          <TickerTable
            signals={signals}
            selectedTicker={selectedTicker}
            onSelect={setSelectedTicker}
            loading={loading}
          />
        </div>

        {/* Detail Panel - Fixed at bottom, never scrolls (Desktop) */}
        {showDetailPanel && !isMobile && (
          <div className="shrink-0 px-4 pb-4">
            <DetailPanel signal={selectedSignal} />
          </div>
        )}

        {/* Mobile Detail Panel - Full Screen Overlay */}
        {showDetailPanel && isMobile && (
          <div className="fixed inset-0 z-50 bg-background overflow-auto p-4">
            <DetailPanel signal={selectedSignal} />
          </div>
        )}
      </div>

      {/* Chat Panel - Fixed Right Sidebar (Desktop only) */}
      {!isMobile && (
        <ChatPanel
          ticker={selectedTicker}
          isCollapsed={chatCollapsed}
          onToggle={() => setChatCollapsed(!chatCollapsed)}
          profile={profile}
        />
      )}
    </div>
  );
}
