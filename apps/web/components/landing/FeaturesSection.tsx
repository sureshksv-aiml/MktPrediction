import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  TrendingUp,
  Calendar,
  Mic,
  AlertTriangle,
  BarChart3,
  ArrowRight,
  Brain,
  Zap,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Activity,
    title: "VIX Regime Detection",
    description:
      "Automatically classify market conditions as LOW (<15), NORMAL (15-20), ELEVATED (20-30), or EXTREME (>30). Track VIX percentile vs 30-year history.",
    outcome: "Know your market regime",
    badge: "Technical",
  },
  {
    icon: TrendingUp,
    title: "Volatility Forecasting",
    description:
      "Generate 1-day and 5-day volatility predictions for SPX, NDX, DJI, and RUT using historical patterns and current signals.",
    outcome: "Anticipate volatility moves",
    badge: "Forecast",
  },
  {
    icon: Calendar,
    title: "Event Calendar Intelligence",
    description:
      "Track Fed FOMC meetings, major M&A events, and analyst rating changes that drive market volatility.",
    outcome: "Stay ahead of catalysts",
    badge: "Events",
  },
  {
    icon: Mic,
    title: "Earnings Sentiment Analysis",
    description:
      "Analyze earnings calls from 10 major tech companies (AAPL, NVDA, MSFT, GOOGL, etc.) for bullish/bearish signals.",
    outcome: "Decode earnings impact",
    badge: "Speech",
  },
  {
    icon: AlertTriangle,
    title: "Smart Alert System",
    description:
      "Get notified when VIX crosses thresholds. Info at 20+, warning at 25+, critical at 30+.",
    outcome: "Never miss a spike",
    badge: "Alerts",
  },
  {
    icon: BarChart3,
    title: "Z-Score Anomaly Detection",
    description:
      "Identify unusual market activity using statistical z-score analysis on price and volume data.",
    outcome: "Spot outliers instantly",
    badge: "Anomaly",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-32 px-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" aria-hidden="true" />
      <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/5 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-20 right-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/5 rounded-full blur-3xl" aria-hidden="true" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-800 dark:text-white mb-8">
            {"Turn volatility signals "}
            <span className="text-primary">
              {"into actionable forecasts"}
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed">
            {
              "Stop reacting to volatility after it strikes. Our multi-agent system synthesizes VIX data, events, and earnings into predictive forecasts."
            }
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card
                key={index}
                className="group relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 rounded-2xl overflow-hidden h-full flex flex-col"
              >
                {/* Card Subtle Background */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <CardHeader className="pb-6 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 dark:bg-primary/20 text-primary border-primary/20 text-sm font-medium">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-0 relative z-10 flex-1 flex flex-col">
                  <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed text-lg flex-1">
                    {feature.description}
                  </p>

                  {/* Outcome Section */}
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/10 dark:border-primary/20 mt-auto">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">&#128161;</span>
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        {feature.outcome}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="relative group">
            {/* Background Subtle Glow */}
            <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>

            <div className="relative bg-white/80  dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl py-12 px-10 sm:p-12 border border-primary/10 dark:border-primary/20 shadow-2xl shadow-primary/5">

              <h3 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-6">
                {"Ready to forecast "}
                <span className="text-primary">
                  {"market volatility?"}
                </span>
              </h3>

              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                {
                  "Join investors who anticipate volatility before it strikes with AI-powered multi-source forecasting."
                }
              </p>

              {/* Feature Highlights */}
              <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-24 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold">Parallel</div>
                    <div className="text-sm opacity-75">processing</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold">AI-powered</div>
                    <div className="text-sm opacity-75">synthesis</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold">BigQuery ML</div>
                    <div className="text-sm opacity-75">powered</div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-8">
                <Button
                  size="default"
                  asChild
                  className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg font-semibold rounded-xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105"
                >
                  <Link href="/auth/sign-up">
                    Start Forecasting
                    <ArrowRight className="!h-4 !w-4 sm:!h-5 sm:!w-5" strokeWidth={2.5} />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
