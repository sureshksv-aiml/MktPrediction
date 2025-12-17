import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-24 px-4 bg-primary text-white">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main CTA */}
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to forecast market volatility?
        </h2>

        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join institutional and retail investors who anticipate volatility before it strikes.
        </p>

        {/* CTA Button */}
        <div className="mb-8">
          <Button
            size="lg"
            asChild
            className="bg-white text-primary hover:scale-105 hover:bg-white  transition-all duration-300 px-8 py-6 text-lg font-semibold rounded-xl"
          >
            <Link href="/auth/sign-up">
              Start Forecasting
              <ArrowRight className="!h-5 !w-5" strokeWidth={3} />
            </Link>
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-white/90">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>VIX regime detection</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>1d/5d volatility forecasts</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>Multi-source intelligence</span>
          </div>
        </div>
      </div>
    </section>
  );
}
