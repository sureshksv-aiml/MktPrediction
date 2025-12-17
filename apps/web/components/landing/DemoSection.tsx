import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  LayoutDashboard,
  Activity,
  Calendar,
  Mic,
} from "lucide-react";
import Link from "next/link";

export default function DemoSection() {
  return (
    <section className="py-32 px-4 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]"
        aria-hidden="true"
      />
      <div
        className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/5 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-20 right-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/5 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-all duration-300 text-sm">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-3 h-3" />
              Dashboard Preview
            </div>
          </Badge>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-800 dark:text-white mb-8">
            {"See what "}
            <span className="text-primary">{"volatility forecasting"}</span>
            {" looks like"}
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {
              "VIX regime detection with multi-source forecasts. Here's what your Volatility Dashboard delivers."
            }
          </p>
        </div>

        {/* Report Preview - Simple Layout */}
        <div className="bg-slate-100/80 dark:bg-slate-800/70 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-slate-200/50 dark:border-slate-700/50 mb-12">
          {/* Report Header */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Market Activity Dashboard
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Profile: Analyst • 4 indices tracked • Live
            </p>
          </div>

          {/* Key Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-white/90 dark:bg-slate-800 rounded-2xl">
              <div className="text-3xl font-bold text-primary mb-2">24.5</div>
              <div className="text-slate-600 dark:text-slate-400">
                Current VIX
              </div>
            </div>
            <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-700">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">ELEVATED</div>
              <div className="text-slate-600 dark:text-slate-400">
                Volatility Regime
              </div>
            </div>
            <div className="text-center p-6 bg-white/90 dark:bg-slate-800 rounded-2xl">
              <div className="text-3xl font-bold text-primary mb-2">78%</div>
              <div className="text-slate-600 dark:text-slate-400">
                VIX Percentile
              </div>
            </div>
          </div>

          {/* Forecast Table */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 mb-8 overflow-x-auto">
            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Volatility Forecasts
            </h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 font-medium">Index</th>
                  <th className="pb-3 font-medium">1-Day</th>
                  <th className="pb-3 font-medium">5-Day</th>
                  <th className="pb-3 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300">
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="py-3 font-semibold">SPX</td>
                  <td className="py-3">12.5%</td>
                  <td className="py-3">14.2%</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '82%' }}></div>
                      </div>
                      <span className="text-xs">82%</span>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="py-3 font-semibold">NDX</td>
                  <td className="py-3">15.2%</td>
                  <td className="py-3">17.1%</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                      <span className="text-xs">78%</span>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="py-3 font-semibold">DJI</td>
                  <td className="py-3">10.1%</td>
                  <td className="py-3">11.8%</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-xs">85%</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold">RUT</td>
                  <td className="py-3">18.3%</td>
                  <td className="py-3">20.5%</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '74%' }}></div>
                      </div>
                      <span className="text-xs">74%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sample Insights */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">
              Live Insights
            </h4>

            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-slate-800 dark:text-white">
                    VIX Elevated: Currently at 78th percentile vs 30-year history
                  </h5>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-slate-800 dark:text-white">
                    Event Alert: FOMC Meeting in 3 days - expect volatility
                  </h5>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-slate-800 dark:text-white">
                    Earnings Mixed: 6/10 tech companies bullish, 4 bearish
                  </h5>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white/80  dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl py-12 px-10 sm:p-12 border border-primary/10 dark:border-primary/20 shadow-2xl shadow-primary/5">
          <h3 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-6">
            {"Get your volatility dashboard in "}
            <span className="text-primary">minutes</span>
          </h3>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            {
              "This is just a preview. Your full dashboard includes real-time VIX tracking, event calendars, forecast alerts, and embedded chat for volatility questions."
            }
          </p>
          <Button
            size="default"
            asChild
            className="bg-primary hover:bg-primary/90 text-white px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            <Link href="/auth/sign-up">
              Start Forecasting
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
