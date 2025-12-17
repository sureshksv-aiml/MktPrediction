import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is the VIX and why does it matter?",
    answer:
      "The VIX (CBOE Volatility Index) measures expected market volatility over 30 days. It's called the \"fear gauge.\" Below 15 = calm markets, 15-20 = normal, 20-30 = elevated caution, above 30 = extreme fear/crisis.",
  },
  {
    question: "What indices do you forecast volatility for?",
    answer:
      "We provide 1-day and 5-day volatility forecasts for SPX (S&P 500), NDX (Nasdaq 100), DJI (Dow Jones), and RUT (Russell 2000). Small-caps (RUT) typically show 1.3-1.5x the volatility of large-caps.",
  },
  {
    question: "What events affect market volatility?",
    answer:
      "Fed FOMC meetings (+2-5 VIX points), Fed Chair speeches (+1-3 points), major M&A announcements (+1-3 sector), analyst downgrades on major stocks (+0.5-2 points). Our event calendar tracks all of these.",
  },
  {
    question: "How are earnings calls analyzed?",
    answer:
      "We process earnings transcripts from 10 major tech companies (AAPL, MSFT, NVDA, GOOGL, AMZN, etc.) using Gemini AI. We extract management tone (bullish/bearish/neutral), forward guidance, key topics, and risk factors.",
  },
  {
    question: "What do the alert severity levels mean?",
    answer:
      "INFO (VIX 20-25): Elevated volatility, monitor positions. WARNING (VIX 25-30): High volatility, consider hedging. CRITICAL (VIX >30): Extreme volatility, immediate attention required.",
  },
  {
    question: "How accurate are the volatility forecasts?",
    answer:
      "Forecasts combine historical VIX patterns, 20-day realized volatility, upcoming events, and earnings sentiment. Confidence scores (0-100%) indicate forecast reliability. Confidence decreases during extreme regimes.",
  },
  {
    question: "What data sources power the system?",
    answer:
      "30 years of VIX history (7,754 days), OHLCV data for indices (112K rows), 65K Fed communications, 1,454 M&A events, 5,000 analyst ratings, and 200 earnings call transcripts from major tech companies.",
  },
];

export default function FAQSection() {
  return (
    <section
      id="faq"
      className="py-32 px-4 bg-slate-50 dark:bg-slate-900 relative"
    >
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
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-800 dark:text-white mb-8">
            {"Frequently "}
            <span className="text-primary">{"asked questions"}</span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {
              "Got questions about volatility forecasting? Here are the most common questions from investors using our platform."
            }
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-6 mb-20">
          <Accordion type="single" collapsible className="w-full space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl px-6 py-1 hover:border-primary dark:hover:border-primary transition-all duration-300"
              >
                <AccordionItem value={`item-${index}`} className="border-none">
                  <AccordionTrigger className="text-left group-hover:text-primary text-base md:text-lg font-bold text-slate-800 dark:text-white hover:text-primary transition-colors duration-300 py-4 hover:no-underline items-center">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 dark:text-slate-300 leading-relaxed text-base pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </div>
            ))}
          </Accordion>
        </div>

        {/* Still have questions CTA */}
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {"Still have questions? "}
            <a
              href="mailto:support@marketactivity.ai"
              className="text-primary hover:underline font-medium"
            >
              Contact us
            </a>
            {" - we'll get back to you within 24 hours."}
          </p>
        </div>
      </div>
    </section>
  );
}
