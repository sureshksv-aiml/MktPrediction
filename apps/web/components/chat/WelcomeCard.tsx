"use client";

import { Brain, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

const examplePrompts = [
  "What is the news sentiment for TSLA over the past 7 days?",
  "Compare news sentiment for AAPL, NVDA, and MSFT",
  "Which tech stocks have the most positive news coverage?",
];

interface WelcomeCardProps {
  onPromptSelect?: (prompt: string) => void;
}

export function WelcomeCard({ onPromptSelect }: WelcomeCardProps) {
  const isInteractionDisabled = false;

  return (
    <div className="w-auto max-w-2xl mx-auto px-4 sm:px-0 sm:pt-20">
      <Card className="border-none shadow-none">
        <CardHeader className="text-center pb-4 sm:pb-5 px-2 sm:px-6">
          {/* Title */}
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 flex items-center justify-center gap-1 sm:gap-3">
            Welcome to <Logo className="hidden sm:inline-flex text-primary" />
            <span className="sm:hidden">Market Pulse</span>
          </CardTitle>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed px-2 sm:px-0">
            Ask me about market volatility, and I&rsquo;ll analyze VIX regimes,
            volatility forecasts, and market anomalies to help you make informed decisions.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-5 px-2 sm:px-6">
          {/* Features Highlight */}
          <div className="bg-muted/50 dark:bg-muted/20 border rounded-xl p-3 sm:p-5">
            <div className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-3 text-center">
              <div className="flex flex-col items-center gap-1 sm:gap-1.5">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <div className="text-xs font-medium leading-tight">
                  News sentiment
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 sm:gap-1.5">
                <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <div className="text-xs font-medium leading-tight">
                  Price anomalies
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 sm:gap-1.5">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <div className="text-xs font-medium leading-tight">
                  Risk scoring
                </div>
              </div>
            </div>
          </div>

          {/* Example Prompts */}
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="text-sm sm:text-base font-semibold mb-2 px-2 sm:px-0">
                Here are some examples to get you started:
              </h3>
            </div>

            <div className="space-y-2">
              {examplePrompts.map((prompt, index) => (
                <div
                  key={index}
                  className={cn(
                    "rounded-xl border hover:border-primary/50 p-3 cursor-pointer group transition-all duration-200",
                    isInteractionDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() =>
                    !isInteractionDisabled && onPromptSelect?.(prompt)
                  }
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5 sm:mt-0" />
                    <span className="text-xs sm:text-sm flex-1 leading-relaxed line-clamp-1 font-medium group-hover:text-primary transition-all duration-200">
                      {prompt}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
