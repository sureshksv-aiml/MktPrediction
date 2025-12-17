# Phase 0.5: Landing Page Rebrand - Market Activity Prediction

**Duration:** 1 hour
**Prerequisites:** Phase 0 completed (project setup)
**Output:** Updated landing page components for Market Activity Prediction

---

## Overview

Rebrand the existing landing page from Market Signal Intelligence to **Market Activity Prediction** - a volatility forecasting system. This document provides all content updates for the landing page components.

**Project Name:** Market Activity Prediction
**Contact Email:** support@marketactivity.ai
**Target Audience:** Institutional investors, retail investors, financial analysts

---

## Key Messaging

### Tagline
"Predict Market Volatility Before It Strikes"

### Value Propositions
1. **VIX Regime Detection** - Know if markets are calm, elevated, or extreme
2. **Volatility Forecasts** - 1-day and 5-day predictions for major indices
3. **Multi-Source Intelligence** - Technical signals + Events + Earnings sentiment
4. **Smart Alerts** - VIX threshold alerts (>20 info, >25 warning, >30 critical)

---

## Task 0.5.1: HeroSection

**File:** `apps/web/components/landing/HeroSection.tsx`

### Content Updates

**Headline:**
```
Predict Market **Volatility** Before It Strikes
```

**Subheadline:**
```
Combine VIX analysis, Fed events, and earnings sentiment into actionable volatility forecasts. Powered by BigQuery and Gemini AI.
```

**Feature Highlights (3 items):**

| Icon | Text |
|------|------|
| `<Activity />` | Real-time VIX regime detection |
| `<Calendar />` | Fed & M&A event tracking |
| `<Mic />` | Earnings call sentiment |

**CTA Button:**
- Text: "Forecast Volatility Now"
- Link: `/auth/sign-up`
- Icon: `<ArrowRight />`

### Code Changes

```tsx
// HeroSection.tsx - Key content updates

const headline = "Predict Market **Volatility** Before It Strikes";

const subheadline = "Combine VIX analysis, Fed events, and earnings sentiment into actionable volatility forecasts. Powered by BigQuery and Gemini AI.";

const featureHighlights = [
  { icon: Activity, text: "Real-time VIX regime detection" },
  { icon: Calendar, text: "Fed & M&A event tracking" },
  { icon: Mic, text: "Earnings call sentiment" },
];

const ctaButton = {
  text: "Forecast Volatility Now",
  href: "/auth/sign-up",
};
```

---

## Task 0.5.2: FeaturesSection

**File:** `apps/web/components/landing/FeaturesSection.tsx`

### 6 Features

| # | Icon | Title | Description | Badge |
|---|------|-------|-------------|-------|
| 1 | `Activity` | VIX Regime Detection | Automatically classify market conditions as LOW (<15), NORMAL (15-20), ELEVATED (20-30), or EXTREME (>30). Track VIX percentile vs 30-year history. | Technical |
| 2 | `TrendingUp` | Volatility Forecasting | Generate 1-day and 5-day volatility predictions for SPX, NDX, DJI, and RUT using historical patterns and current signals. | Forecast |
| 3 | `Calendar` | Event Calendar Intelligence | Track Fed FOMC meetings, major M&A events, and analyst rating changes that drive market volatility. | Events |
| 4 | `Mic` | Earnings Sentiment Analysis | Analyze earnings calls from 10 major tech companies (AAPL, NVDA, MSFT, GOOGL, etc.) for bullish/bearish signals. | Speech |
| 5 | `AlertTriangle` | Smart Alert System | Get notified when VIX crosses thresholds. Info at 20+, warning at 25+, critical at 30+. | Alerts |
| 6 | `BarChart3` | Z-Score Anomaly Detection | Identify unusual market activity using statistical z-score analysis on price and volume data. | Anomaly |

### Code Changes

```tsx
// FeaturesSection.tsx - Features array

import { Activity, TrendingUp, Calendar, Mic, AlertTriangle, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "VIX Regime Detection",
    description: "Automatically classify market conditions as LOW (<15), NORMAL (15-20), ELEVATED (20-30), or EXTREME (>30). Track VIX percentile vs 30-year history.",
    badge: "Technical",
  },
  {
    icon: TrendingUp,
    title: "Volatility Forecasting",
    description: "Generate 1-day and 5-day volatility predictions for SPX, NDX, DJI, and RUT using historical patterns and current signals.",
    badge: "Forecast",
  },
  {
    icon: Calendar,
    title: "Event Calendar Intelligence",
    description: "Track Fed FOMC meetings, major M&A events, and analyst rating changes that drive market volatility.",
    badge: "Events",
  },
  {
    icon: Mic,
    title: "Earnings Sentiment Analysis",
    description: "Analyze earnings calls from 10 major tech companies (AAPL, NVDA, MSFT, GOOGL, etc.) for bullish/bearish signals.",
    badge: "Speech",
  },
  {
    icon: AlertTriangle,
    title: "Smart Alert System",
    description: "Get notified when VIX crosses thresholds. Info at 20+, warning at 25+, critical at 30+.",
    badge: "Alerts",
  },
  {
    icon: BarChart3,
    title: "Z-Score Anomaly Detection",
    description: "Identify unusual market activity using statistical z-score analysis on price and volume data.",
    badge: "Anomaly",
  },
];
```

---

## Task 0.5.3: ProblemSection

**File:** `apps/web/components/landing/ProblemSection.tsx`

### 3 Problems

| # | Icon | Title | Description |
|---|------|-------|-------------|
| 1 | `Layers` | Volatility Blindsides Investors | Market volatility spikes catch investors off guard. Fed announcements, earnings surprises, and M&A events trigger sudden moves that are predictable with the right signals. |
| 2 | `Clock` | Signals Are Scattered Across Sources | VIX data, Fed calendars, analyst ratings, and earnings calls live in separate systems. By the time you correlate them manually, the market has already moved. |
| 3 | `Target` | Generic Alerts Are Too Late | Traditional VIX alerts trigger after the spike. Understanding the regime (elevated vs extreme) and having forecasts helps you position before volatility hits. |

### Code Changes

```tsx
// ProblemSection.tsx - Problems array

import { Layers, Clock, Target } from "lucide-react";

const problems = [
  {
    icon: Layers,
    title: "Volatility Blindsides Investors",
    description: "Market volatility spikes catch investors off guard. Fed announcements, earnings surprises, and M&A events trigger sudden moves that are predictable with the right signals.",
  },
  {
    icon: Clock,
    title: "Signals Are Scattered Across Sources",
    description: "VIX data, Fed calendars, analyst ratings, and earnings calls live in separate systems. By the time you correlate them manually, the market has already moved.",
  },
  {
    icon: Target,
    title: "Generic Alerts Are Too Late",
    description: "Traditional VIX alerts trigger after the spike. Understanding the regime (elevated vs extreme) and having forecasts helps you position before volatility hits.",
  },
];
```

---

## Task 0.5.4: DemoSection (Dashboard Preview)

**File:** `apps/web/components/landing/DemoSection.tsx`

### Key Statistics (3 cards)

| Value | Label |
|-------|-------|
| 24.5 | Current VIX |
| ELEVATED | Volatility Regime |
| 78% | VIX Percentile |

### Dashboard Preview Content

**Volatility Regime Indicator:**
```
Current Regime: ELEVATED                VIX: 24.5 (+2.3 today)

████████████████████████████░░░░░░░░░░      78th Percentile
|         |         |         |         |
LOW      NORMAL   ELEVATED   EXTREME
(<15)    (15-20)   (20-30)    (>30)
```

**Forecast Table:**

| Symbol | 1-Day Forecast | 5-Day Forecast | Confidence |
|--------|----------------|----------------|------------|
| SPX | 12.5% | 14.2% | 82% |
| NDX | 15.2% | 17.1% | 78% |
| DJI | 10.1% | 11.8% | 85% |
| RUT | 18.3% | 20.5% | 74% |

**Sample Insights (3):**

| Icon | Insight |
|------|---------|
| `<Activity />` | VIX Elevated: Currently at 78th percentile vs 30-year history |
| `<Calendar />` | Event Alert: FOMC Meeting in 3 days - expect volatility |
| `<Mic />` | Earnings Mixed: 6/10 tech companies bullish, 4 bearish |

### Code Changes

```tsx
// DemoSection.tsx - Dashboard preview data

const stats = [
  { value: "24.5", label: "Current VIX" },
  { value: "ELEVATED", label: "Volatility Regime" },
  { value: "78%", label: "VIX Percentile" },
];

const forecasts = [
  { symbol: "SPX", forecast1d: "12.5%", forecast5d: "14.2%", confidence: 82 },
  { symbol: "NDX", forecast1d: "15.2%", forecast5d: "17.1%", confidence: 78 },
  { symbol: "DJI", forecast1d: "10.1%", forecast5d: "11.8%", confidence: 85 },
  { symbol: "RUT", forecast1d: "18.3%", forecast5d: "20.5%", confidence: 74 },
];

const insights = [
  { icon: Activity, text: "VIX Elevated: Currently at 78th percentile vs 30-year history" },
  { icon: Calendar, text: "Event Alert: FOMC Meeting in 3 days - expect volatility" },
  { icon: Mic, text: "Earnings Mixed: 6/10 tech companies bullish, 4 bearish" },
];

// VIX Regime levels for the indicator
const regimeLevels = [
  { label: "LOW", range: "<15", color: "green" },
  { label: "NORMAL", range: "15-20", color: "blue" },
  { label: "ELEVATED", range: "20-30", color: "yellow" },
  { label: "EXTREME", range: ">30", color: "red" },
];
```

---

## Task 0.5.5: FAQSection

**File:** `apps/web/components/landing/FAQSection.tsx`

### 7 FAQs

```tsx
const faqs = [
  {
    question: "What is the VIX and why does it matter?",
    answer: "The VIX (CBOE Volatility Index) measures expected market volatility over 30 days. It's called the \"fear gauge.\" Below 15 = calm markets, 15-20 = normal, 20-30 = elevated caution, above 30 = extreme fear/crisis.",
  },
  {
    question: "What indices do you forecast volatility for?",
    answer: "We provide 1-day and 5-day volatility forecasts for SPX (S&P 500), NDX (Nasdaq 100), DJI (Dow Jones), and RUT (Russell 2000). Small-caps (RUT) typically show 1.3-1.5x the volatility of large-caps.",
  },
  {
    question: "What events affect market volatility?",
    answer: "Fed FOMC meetings (+2-5 VIX points), Fed Chair speeches (+1-3 points), major M&A announcements (+1-3 sector), analyst downgrades on major stocks (+0.5-2 points). Our event calendar tracks all of these.",
  },
  {
    question: "How are earnings calls analyzed?",
    answer: "We process earnings transcripts from 10 major tech companies (AAPL, MSFT, NVDA, GOOGL, AMZN, etc.) using Gemini AI. We extract management tone (bullish/bearish/neutral), forward guidance, key topics, and risk factors.",
  },
  {
    question: "What do the alert severity levels mean?",
    answer: "INFO (VIX 20-25): Elevated volatility, monitor positions. WARNING (VIX 25-30): High volatility, consider hedging. CRITICAL (VIX >30): Extreme volatility, immediate attention required.",
  },
  {
    question: "How accurate are the volatility forecasts?",
    answer: "Forecasts combine historical VIX patterns, 20-day realized volatility, upcoming events, and earnings sentiment. Confidence scores (0-100%) indicate forecast reliability. Confidence decreases during extreme regimes.",
  },
  {
    question: "What data sources power the system?",
    answer: "30 years of VIX history (7,754 days), OHLCV data for indices (112K rows), 65K Fed communications, 1,454 M&A events, 5,000 analyst ratings, and 200 earnings call transcripts from major tech companies.",
  },
];

// Contact email for FAQ section
const contactEmail = "support@marketactivity.ai";
```

---

## Task 0.5.6: CTASection

**File:** `apps/web/components/landing/CTASection.tsx`

### Content Updates

**Headline:**
```
Ready to forecast market volatility?
```

**Subheadline:**
```
Join institutional and retail investors who anticipate volatility before it strikes.
```

**Trust Indicators (3):**

| Icon | Text |
|------|------|
| `<CheckCircle />` | VIX regime detection |
| `<CheckCircle />` | 1d/5d volatility forecasts |
| `<CheckCircle />` | Multi-source intelligence |

**CTA Button:**
- Text: "Start Forecasting"
- Link: `/auth/sign-up`
- Icon: `<ArrowRight />`

### Code Changes

```tsx
// CTASection.tsx - Content updates

import { CheckCircle, ArrowRight } from "lucide-react";

const headline = "Ready to forecast market volatility?";

const subheadline = "Join institutional and retail investors who anticipate volatility before it strikes.";

const trustIndicators = [
  { icon: CheckCircle, text: "VIX regime detection" },
  { icon: CheckCircle, text: "1d/5d volatility forecasts" },
  { icon: CheckCircle, text: "Multi-source intelligence" },
];

const ctaButton = {
  text: "Start Forecasting",
  href: "/auth/sign-up",
};
```

---

## Task 0.5.7: Logo & Branding Updates

**Files:**
- `apps/web/components/landing/Logo.tsx`
- `apps/web/components/landing/Footer.tsx`

### Logo Updates

```tsx
// Logo.tsx - Update brand name

const brandName = "MarketActivity";
// or if using icon + text:
const Logo = () => (
  <div className="flex items-center gap-2">
    <Activity className="h-6 w-6 text-primary" />
    <span className="font-semibold">MarketActivity</span>
  </div>
);
```

### Footer Updates

```tsx
// Footer.tsx - Contact info

const companyName = "Market Activity Prediction";
const contactEmail = "support@marketactivity.ai";
const year = new Date().getFullYear();
const copyright = `© ${year} ${companyName}. All rights reserved.`;
```

---

## Icon Reference

| Section | Icons |
|---------|-------|
| Hero | `Activity`, `Calendar`, `Mic`, `ArrowRight`, `Sparkles` |
| Features | `Activity`, `TrendingUp`, `Calendar`, `Mic`, `AlertTriangle`, `BarChart3` |
| Problems | `Layers`, `Clock`, `Target` |
| Demo | `Activity`, `Calendar`, `Mic`, `AlertTriangle` |
| CTA | `ArrowRight`, `CheckCircle` |
| Logo | `Activity` |

All icons from `lucide-react`.

---

## Files to Modify Summary

| File | Task | Changes |
|------|------|---------|
| `HeroSection.tsx` | 0.5.1 | Headline, subheadline, feature highlights, CTA |
| `FeaturesSection.tsx` | 0.5.2 | 6 volatility features with icons and badges |
| `ProblemSection.tsx` | 0.5.3 | 3 investor pain points |
| `DemoSection.tsx` | 0.5.4 | VIX regime indicator + forecast table preview |
| `FAQSection.tsx` | 0.5.5 | 7 volatility FAQs, contact email |
| `CTASection.tsx` | 0.5.6 | Headline, trust indicators, CTA |
| `Logo.tsx` | 0.5.7 | MarketActivity branding |
| `Footer.tsx` | 0.5.7 | Company name, contact email |

---

## VIX Reference Data

### Regime Definitions

| VIX Level | Regime | Color | Description |
|-----------|--------|-------|-------------|
| < 15 | LOW | Green | Markets calm, low risk |
| 15-20 | NORMAL | Blue | Normal conditions |
| 20-25 | ELEVATED | Yellow | Monitor positions |
| 25-30 | HIGH | Orange | Consider hedging |
| > 30 | EXTREME | Red | High risk, immediate attention |

### Alert Severity Mapping

| VIX Range | Severity | Action |
|-----------|----------|--------|
| 20-25 | INFO | Monitor positions |
| 25-30 | WARNING | Consider hedging |
| > 30 | CRITICAL | Immediate attention required |

---

## Verification Checklist

- [ ] HeroSection updated with volatility messaging
- [ ] FeaturesSection has 6 volatility features
- [ ] ProblemSection has 3 investor pain points
- [ ] DemoSection shows VIX regime indicator + forecast table
- [ ] FAQSection has 7 volatility questions
- [ ] CTASection has updated messaging
- [ ] Logo shows "MarketActivity" branding
- [ ] Footer has correct contact: support@marketactivity.ai
- [ ] No references to "traffic anomaly" or old branding remain
- [ ] Project name: "Market Activity Prediction"

---

## Next Phase

After completing the landing page rebrand, proceed to:
- **Phase 1:** `ph1_technical_agents.md` - Build technical_agent, event_calendar_agent, speech_signal_agent
