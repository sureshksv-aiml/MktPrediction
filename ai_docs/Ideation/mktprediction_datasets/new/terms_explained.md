# Market Pulse - Terms Explained

---

# PART 1: VOLATILITY REGIME PANEL

## What is VIX?

**VIX** (Volatility Index) is often called the "**Fear Index**" - it measures how nervous or calm the stock market is:

| VIX Level | Market Mood |
|-----------|-------------|
| 10-15 | Very calm, investors relaxed |
| 15-20 | Normal conditions |
| 20-25 | Getting nervous |
| 25-35 | High anxiety |
| 35+ | Panic mode |

The historical average VIX is around **20**.

---

## Data Sources for VIX & Volatility Regime

### Raw Data → Dashboard (The Pipeline)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES (BigQuery)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. market_30yr_v (30 Years of Market Data)                             │
│     ├── date                                                             │
│     ├── vix          ← VIX index value                                  │
│     ├── sp500        ← S&P 500 price                                    │
│     ├── nasdaq       ← Nasdaq price                                     │
│     ├── dow          ← Dow Jones price                                  │
│     └── russell_2000 ← Russell 2000 price                               │
│                                                                          │
│  2. index_data_v (OHLCV Data for Indices)                               │
│     ├── symbol       ← SPX, NDX, DJI, RUT, N225                        │
│     ├── date                                                             │
│     ├── open, high, low, close                                          │
│     └── volume       ← Used for anomaly detection                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       CALCULATIONS (SQL Queries)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Query 1: Get VIX and Regime                                            │
│  ─────────────────────────────                                          │
│  SELECT vix AS current_vix,                                             │
│         CASE                                                             │
│           WHEN vix < 15 THEN 'low'                                      │
│           WHEN vix < 20 THEN 'normal'                                   │
│           WHEN vix < 30 THEN 'elevated'                                 │
│           ELSE 'extreme'                                                │
│         END AS regime,                                                   │
│         PERCENT_RANK() * 100 AS percentile                              │
│                                                                          │
│  Query 2: Calculate 20-Day Historical Volatility                        │
│  ─────────────────────────────────────────────────                      │
│  - Get last 21 days of S&P 500 prices                                   │
│  - Calculate daily returns: (today - yesterday) / yesterday             │
│  - Calculate standard deviation of returns                              │
│  - Annualize: STDDEV * √252 * 100                                       │
│                                                                          │
│  Query 3: Z-Score Anomaly Detection                                     │
│  ─────────────────────────────────                                      │
│  - Calculate 90-day average and std dev for each index                  │
│  - Z-score = (current - average) / std_dev                              │
│  - If |z-score| > 2.0 → ANOMALY                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DASHBOARD OUTPUT                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  VOLATILITY REGIME                              VIX: 12.9  +0.2         │
│  ────────────────                               17th Percentile          │
│  LOW (<15)                                      20D Vol: 11.3%          │
│  ═══════════════════════════════════════════                            │
│  LOW     NORMAL     ELEVATED     EXTREME                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Volatility Regime Thresholds

| VIX Range | Regime | What It Means |
|-----------|--------|---------------|
| < 15 | **LOW** | Market is calm. Investors are confident. Good time to be invested. |
| 15-20 | **NORMAL** | Typical market conditions. Nothing unusual. |
| 20-30 | **ELEVATED** | Uncertainty is rising. Investors are getting cautious. |
| > 30 | **EXTREME** | Fear is high. Crisis mode. Big price swings expected. |

**Dashboard Example:**
```
VIX: 12.9 → Regime: LOW (because 12.9 < 15)
```

---

## VIX Percentile Explained

**What is it?** Where current VIX stands compared to all historical VIX values.

**Example:** "17th Percentile" means:
- 17% of all historical VIX readings were LOWER than today's 12.9
- 83% of all historical VIX readings were HIGHER than today's 12.9
- **Interpretation:** Today's VIX is relatively low (calm market)

| Percentile | Interpretation |
|------------|----------------|
| 0-20% | VIX is very low (rare calmness) |
| 20-40% | VIX is below average |
| 40-60% | VIX is around average |
| 60-80% | VIX is above average |
| 80-100% | VIX is very high (rare fear) |

---

## 20D Vol (20-Day Historical Volatility)

**What is it?** How much the S&P 500 actually moved over the last 20 trading days.

**How it's calculated:**
```
Step 1: Get last 21 days of S&P 500 prices
        Day 1: $4,500
        Day 2: $4,520
        Day 3: $4,480
        ... (21 days total)

Step 2: Calculate daily returns
        Day 2 return = (4520 - 4500) / 4500 = +0.44%
        Day 3 return = (4480 - 4520) / 4520 = -0.88%
        ...

Step 3: Calculate standard deviation of returns
        STDDEV = 0.71% (example)

Step 4: Annualize (multiply by √252 trading days)
        20D Vol = 0.71% × √252 = 11.3%
```

**Dashboard Example:**
```
20D Vol: 11.3%
```
This means the S&P 500 is moving about ±11.3% on an annualized basis.

**VIX vs 20D Vol Comparison:**
| Scenario | Meaning |
|----------|---------|
| VIX > 20D Vol | Market expects MORE volatility ahead |
| VIX < 20D Vol | Market expects LESS volatility ahead |
| VIX ≈ 20D Vol | Expectations match reality |

---

# PART 2: VOLATILITY FORECASTS TABLE

## What Does the Forecast Table Show?

```
VOLATILITY FORECASTS
───────────────────────────────────────────────────
Symbol        1-Day      5-Day      Confidence
───────────────────────────────────────────────────
SPX S&P 500   12.9%      12.5%      ████████░░ 90%
NDX Nasdaq    14.8%      14.4%      ███████░░░ 87%
DJI Dow Jones 12.2%      11.9%      █████████░ 92%
RUT Russell   17.4%      16.9%      ████████░░ 85%
───────────────────────────────────────────────────
```

### Symbol Column
| Symbol | Full Name | What It Is |
|--------|-----------|------------|
| **SPX** | S&P 500 | 500 largest US companies (baseline) |
| **NDX** | Nasdaq 100 | 100 largest tech companies (more volatile) |
| **DJI** | Dow Jones | 30 blue-chip companies (most stable) |
| **RUT** | Russell 2000 | 2000 small companies (most volatile) |

### 1-Day & 5-Day Columns
**What:** Predicted annualized volatility percentage.

**Example Calculation for SPX:**
```
Current VIX: 12.9
Long-term Mean: 20.0
SPX Multiplier: 1.0x

1-Day Forecast:
= (12.9 × 95%) + (20.0 × 5%)
= 12.26 + 1.0
= 13.26%
(rounded to 12.9% in display)

5-Day Forecast:
= (12.9 × 85%) + (20.0 × 15%)
= 10.97 + 3.0
= 13.97%
(more mean reversion = closer to 20)
```

**Example for NDX (Tech):**
```
Base forecast: 12.9%
NDX Multiplier: 1.15x (tech is more volatile)
NDX 1-Day = 12.9% × 1.15 = 14.8%
```

### Confidence Column
**What:** How reliable is this forecast?

**Factors that affect confidence:**
1. **Regime** - Calm markets are more predictable
2. **Historical vol difference** - If 20D Vol differs >30% from VIX, reduce confidence by 10%

| Regime | Base Confidence |
|--------|-----------------|
| Low | 85% |
| Normal | 80% |
| Elevated | 70% |
| Extreme | 55% |

**Dashboard Example:**
```
SPX Confidence: 90%
- Regime: Low (+85% base)
- VIX and 20D Vol are close (+5% bonus)
= 90% confidence
```

---

# PART 3: ANOMALIES DETECTED

## What is a Z-Score?

**Z-Score** tells you how unusual a value is compared to its average.

```
Z-Score = (Current Value - Average) / Standard Deviation
```

**Interpretation:**
| Z-Score | Meaning |
|---------|---------|
| 0 | Exactly average |
| +1 or -1 | Slightly above/below average (normal) |
| +2 or -2 | Significantly different (unusual) |
| +3 or -3 | Extremely rare (potential anomaly) |

**Dashboard Example:**
```
N225  volume  z=-3.39  ← 3.4σ BELOW average (very low volume!)
N225  price   z=-0.06  ← Almost exactly average (normal)
```

## Anomaly Detection Process

```
┌────────────────────────────────────────────────────────────────┐
│                    ANOMALY DETECTION                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Calculate 90-Day Statistics                           │
│  ─────────────────────────────────────                         │
│  For N225 (Nikkei 225):                                        │
│  - Average volume over 90 days: 100 million shares             │
│  - Std deviation: 20 million shares                            │
│                                                                 │
│  Step 2: Get Latest Value                                       │
│  ─────────────────────────                                      │
│  Today's N225 volume: 32 million shares                        │
│                                                                 │
│  Step 3: Calculate Z-Score                                      │
│  ──────────────────────────                                     │
│  Z = (32 - 100) / 20 = -68 / 20 = -3.4                        │
│                                                                 │
│  Step 4: Apply Threshold                                        │
│  ────────────────────────                                       │
│  |Z-Score| = 3.4 > 2.0 threshold                               │
│  ∴ ANOMALY DETECTED                                            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Real Examples from Dashboard

### Example 1: N225 Volume Anomaly (z=-3.39)
```
Average volume (90 days): ~2.5 billion shares
Today's volume: ~1.7 billion shares
Z-score: -3.39 (3.4 standard deviations BELOW average)

🚨 ANOMALY: Volume is unusually LOW
   Possible reasons:
   - Holiday in Japan
   - Low liquidity day
   - Market uncertainty causing traders to wait
```

### Example 2: N225 Price Normal (z=-0.06)
```
Average price (90 days): ¥38,500
Today's price: ¥38,470
Z-score: -0.06 (almost exactly at average)

✓ NORMAL: Price is right where expected
```

## Anomaly Status Rules
| |Z-Score| | Status | Color |
|-----------|--------|-------|
| < 2.0 | NORMAL | Green ✓ |
| ≥ 2.0 | ANOMALY | Red 🚨 |

---

# PART 4: EVENTS CALENDAR

## Data Sources for Events

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT DATA SOURCES (BigQuery)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. fed_communications_v (Federal Reserve Data)                 │
│     ├── date                                                     │
│     ├── type: 'Statement', 'Minute', 'Speech'                   │
│     └── text: Full content of communication                     │
│                                                                  │
│  2. acquisitions (M&A Events)                                   │
│     ├── parent_company                                          │
│     ├── acquired_company                                        │
│     ├── acquisition_price                                       │
│     ├── acquisition_year, acquisition_month                     │
│     └── category: 'Tech', 'Healthcare', etc.                    │
│                                                                  │
│  3. analyst_ratings (Stock Ratings)                             │
│     ├── date                                                     │
│     ├── stock: 'AAPL', 'MSFT', etc.                            │
│     └── title: 'Upgrade to Buy', 'Downgrade', etc.             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Fed Tab Explained

### Event Types
| Type | What It Is | Typical VIX Impact |
|------|------------|-------------------|
| **Statement** | Official FOMC decision announcement | +2 to +5 points |
| **Minute** | Detailed meeting notes (released 3 weeks later) | +1 to +2 points |
| **Speech** | Fed Chair/Governor speeches | +1 to +3 points |

### Dashboard Example
```
Fed (10)  ← 10 Fed communications in the data

Statement                              2025-10-29
Available indicators suggest that economic activity has been
expanding at a moderate pace. Job gains have slowed this year...

Minute                                 2025-10-29
Minutes of the Federal Open Market Committee October 28–29, 2025
```

**Why Fed Events Matter:**
- Fed controls interest rates
- Higher rates → stocks less attractive → more volatility
- Surprise decisions cause big market moves

---

## Ratings Tab Explained

### What Are Analyst Ratings?
Investment banks (Goldman Sachs, Morgan Stanley, etc.) rate stocks:

| Rating | Meaning |
|--------|---------|
| **Buy/Outperform** | Analysts think stock will beat the market |
| **Hold/Neutral** | Stock will perform about average |
| **Sell/Underperform** | Analysts think stock will lag |

### Rating Changes Impact
| Change | Market Reaction |
|--------|-----------------|
| Upgrade (Hold → Buy) | Stock price often rises 2-5% |
| Downgrade (Buy → Hold) | Stock price often drops 3-8% |
| Multiple downgrades same day | Can trigger sector-wide selling |

### Dashboard Example
```
Ratings (10)  ← 10 analyst rating changes

AAPL  "Morgan Stanley upgrades to Overweight"     2025-10-28
NVDA  "Goldman Sachs maintains Buy, raises PT"    2025-10-27
```

---

## M&A Tab Explained

### What is M&A?
**Mergers & Acquisitions** - when one company buys another.

### Why M&A Affects Volatility
| M&A Event | Market Impact |
|-----------|---------------|
| Large acquisition announced | Target stock jumps, acquirer may drop |
| Deal falls through | Both stocks move sharply |
| Sector consolidation | Entire sector becomes volatile |

### Dashboard Example
```
M&A (10)  ← 10 major acquisition events

Microsoft                              October 2023
Acquired: Activision Blizzard
$68.7B  Gaming
```

**Why This Matters:**
- $68.7B deal was the largest gaming acquisition ever
- Created volatility in gaming sector stocks
- Regulatory scrutiny added uncertainty for months

---

# PART 5: VIX FORECAST CALCULATION (Complete)

## VIX Forecast Weights Explained

### The Core Concept: **Mean Reversion**

VIX tends to return to its average (20) over time. If VIX spikes to 35 during a crisis, it will eventually come back down. If it drops to 10 during calm times, it will eventually rise.

### 1-Day Forecast: **95% VIX, 5% Mean Reversion**

**Example:** Today's VIX = 30

```
Tomorrow's Forecast = (Today's VIX × 95%) + (Average × 5%)
                    = (30 × 0.95) + (20 × 0.05)
                    = 28.5 + 1.0
                    = 29.5
```

**Why 95%?** Tomorrow is very close - volatility doesn't change much overnight. So we rely almost entirely on today's value, with just a tiny pull toward the average.

### 5-Day Forecast: **85% VIX, 15% Mean Reversion**

**Example:** Today's VIX = 30

```
5-Day Forecast = (Today's VIX × 85%) + (Average × 15%)
               = (30 × 0.85) + (20 × 0.15)
               = 25.5 + 3.0
               = 28.5
```

**Why 85%?** Over 5 days, there's more time for things to calm down (or heat up). So we give more weight to the long-term average.

---

## Event Adjustment: **+10% / +15%**

If there's a major event coming (Fed meeting, earnings announcements), add extra volatility:

**Example:** 5-Day Forecast = 28.5, Fed meeting this week

```
Adjusted Forecast = 28.5 × (1 + 15%)
                  = 28.5 × 1.15
                  = 32.8
```

---

## Index Multipliers Explained

Different indices have different volatility levels:

| Index | Multiplier | Why? |
|-------|------------|------|
| **SPX** (S&P 500) | 1.00x | Baseline - diversified, stable |
| **NDX** (Nasdaq) | 1.15x | Tech stocks are more volatile |
| **DJI** (Dow Jones) | 0.95x | Blue chips, very stable |
| **RUT** (Russell 2000) | 1.35x | Small companies = more risk |

**Example:** If base VIX forecast = 25

- SPX forecast: 25 × 1.00 = **25%**
- NDX forecast: 25 × 1.15 = **28.75%**
- RUT forecast: 25 × 1.35 = **33.75%**

---

## The Complete Formula

```
Forecast = (Current VIX × Weight) + (20 × (1-Weight)) × Index Multiplier × Event Adjustment
```

**Real Example:**
- Current VIX = 25
- 5-day forecast for Nasdaq (NDX)
- Fed meeting coming up

```
Step 1: Base forecast = (25 × 0.85) + (20 × 0.15) = 21.25 + 3 = 24.25
Step 2: Apply NDX multiplier = 24.25 × 1.15 = 27.89
Step 3: Apply Fed event = 27.89 × 1.15 = 32.07

Final 5-Day NDX Forecast: ~32%
```

This means: "We expect Nasdaq volatility to be around 32% annualized over the next 5 days."

---

# SUMMARY: Data Flow Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           DATA PIPELINE                                   │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   BigQuery  │    │   BigQuery  │    │   BigQuery  │    │   BigQuery  │
│  market_30yr│    │ index_data  │    │ fed_comms   │    │ acquisitions│
│             │    │             │    │ ratings     │    │             │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        TECHNICAL AGENT                                    │
│  • Queries VIX value and calculates regime                               │
│  • Calculates 20-day historical volatility                               │
│  • Calculates z-scores for anomaly detection                             │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      EVENT CALENDAR AGENT                                 │
│  • Fetches Fed meeting minutes and statements                            │
│  • Fetches M&A events                                                    │
│  • Fetches analyst rating changes                                        │
│  • Identifies high-impact upcoming events                                │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       SYNTHESIS AGENT                                     │
│  • Combines all signals                                                  │
│  • Applies forecast formula with weights                                 │
│  • Applies index multipliers                                             │
│  • Adjusts for upcoming events                                           │
│  • Calculates confidence levels                                          │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          DASHBOARD                                        │
│  ┌────────────────────┐  ┌────────────────────┐                          │
│  │ VOLATILITY REGIME  │  │ ANOMALIES DETECTED │                          │
│  │ LOW  VIX: 12.9     │  │ N225 volume z=-3.39│                          │
│  │ 17th Percentile    │  │ N225 price  z=-0.06│                          │
│  └────────────────────┘  └────────────────────┘                          │
│  ┌────────────────────┐  ┌────────────────────┐                          │
│  │ VOLATILITY FORECAST│  │ EVENTS CALENDAR    │                          │
│  │ SPX  12.9%  90%    │  │ Fed | Ratings | M&A│                          │
│  │ NDX  14.8%  87%    │  │ Statement...       │                          │
│  └────────────────────┘  └────────────────────┘                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

# PART 6: PREFERENCES PAGE EXPLAINED

This section explains each item shown on the **Preferences** page in Market Pulse.

---

## VIX Forecast Weights Table

The Preferences page displays how volatility forecasts are calculated:

```
┌─────────────────────────────────────────────────────────────┐
│ VIX Forecast Weights                                        │
├──────────┬───────┬───────────┬─────────────┐                │
│ Horizon  │ VIX   │ Mean Rev. │ Event Adj.  │                │
├──────────┼───────┼───────────┼─────────────┤                │
│ 1-Day    │ 95%   │ 5%        │ +10%        │                │
│ 5-Day    │ 85%   │ 15%       │ +15%        │                │
└──────────┴───────┴───────────┴─────────────┘                │
│ Long-term mean: 20.0 (historical VIX avg)                   │
└─────────────────────────────────────────────────────────────┘
```

### What Each Column Means

| Column | Meaning |
|--------|---------|
| **Horizon** | How far ahead we're forecasting (1 day or 5 days) |
| **VIX** | Weight given to current VIX value |
| **Mean Rev.** | Weight given to long-term average (mean reversion) |
| **Event Adj.** | Extra volatility added if major event is upcoming |

### Why These Weights?

**1-Day Forecast (95% VIX, 5% Mean Reversion)**
- Tomorrow is very close to today
- Volatility rarely changes dramatically overnight
- So we rely almost entirely (95%) on today's VIX
- Only a tiny pull (5%) toward the long-term average of 20

**5-Day Forecast (85% VIX, 15% Mean Reversion)**
- A week is longer - more time for things to normalize
- Markets tend to calm down after spikes
- So we give more weight (15%) to mean reversion
- This pulls extreme values back toward 20

**Event Adjustment (+10% / +15%)**
- Major events (Fed meetings, earnings) increase uncertainty
- 1-Day: Add 10% more volatility if event is imminent
- 5-Day: Add 15% more volatility (more time = more event risk)

### Long-Term Mean: 20.0

This is the historical average of the VIX index over decades of data. The VIX always tends to return to this value over time - this is called **mean reversion**.

---

## Index Multipliers Table

```
┌─────────────────────────────────────────────────────────────┐
│ Index Multipliers                                           │
├──────────┬───────────┬─────────────────────┐                │
│ Index    │ Mult.     │ Type                │                │
├──────────┼───────────┼─────────────────────┤                │
│ SPX      │ 1.00x     │ Baseline            │                │
│ NDX      │ 1.15x     │ Tech premium        │                │
│ DJI      │ 0.95x     │ Blue chip           │                │
│ RUT      │ 1.35x     │ Small cap           │                │
└──────────┴───────────┴─────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### What This Means

Different stock indices have different volatility characteristics:

| Index | Multiplier | Why? |
|-------|------------|------|
| **SPX** (S&P 500) | 1.00x | The baseline - 500 diverse large companies |
| **NDX** (Nasdaq 100) | 1.15x | Tech stocks swing more wildly (+15%) |
| **DJI** (Dow Jones) | 0.95x | 30 blue-chip giants are more stable (-5%) |
| **RUT** (Russell 2000) | 1.35x | Small companies are most volatile (+35%) |

### Example Calculation

If base volatility forecast = 20%:
- **SPX**: 20% × 1.00 = **20.0%**
- **NDX**: 20% × 1.15 = **23.0%** (tech is jumpier)
- **DJI**: 20% × 0.95 = **19.0%** (blue chips are calmer)
- **RUT**: 20% × 1.35 = **27.0%** (small caps are wild)

---

## Regime Confidence

```
┌─────────────────────────────────────────────────────────────┐
│ Regime Confidence                                           │
├─────────────┬─────────────┬─────────────┬─────────────┐     │
│    Low      │   Normal    │  Elevated   │   Extreme   │     │
│ ████████░░  │ ████████░░  │ ███████░░░  │ █████░░░░░  │     │
│    85%      │    80%      │    70%      │    55%      │     │
└─────────────┴─────────────┴─────────────┴─────────────┘     │
│ -10% if historical vol differs >30% from VIX                │
└─────────────────────────────────────────────────────────────┘
```

### What This Means

**Confidence** = How reliable is our forecast?

| Regime | Confidence | Why? |
|--------|------------|------|
| **Low** (VIX < 15) | 85% | Calm markets are predictable |
| **Normal** (VIX 15-20) | 80% | Typical conditions, fairly predictable |
| **Elevated** (VIX 20-30) | 70% | Uncertainty makes forecasting harder |
| **Extreme** (VIX > 30) | 55% | Crisis mode - anything can happen |

### The -10% Penalty

If historical volatility (what actually happened) differs from VIX (what's expected) by more than 30%, we reduce confidence by 10%.

**Example:**
- VIX = 20 (expected volatility)
- 20D Vol = 28 (actual recent volatility)
- Difference = 8/20 = 40% → exceeds 30% threshold
- Confidence penalty applied: 80% → 72%

This means the VIX isn't accurately predicting what's really happening, so we trust our forecast less.

---

## Data Sources

```
┌─────────────────────────────────────────────────────────────┐
│ Data Sources                                                │
├─────────────────────────────────────────────────────────────┤
│ ① Technical: VIX, regime, historical vol                   │
│ ② Events: Fed, M&A, ratings                                │
│ ③ Speech: Earnings sentiment                               │
└─────────────────────────────────────────────────────────────┘
```

### Three Input Categories

| # | Source | What It Provides |
|---|--------|------------------|
| **1** | Technical | Current VIX value, volatility regime (low/normal/elevated/extreme), 20-day historical volatility, z-score anomalies |
| **2** | Events | Federal Reserve communications (FOMC), M&A deals, analyst rating changes |
| **3** | Speech | Sentiment analysis from earnings call transcripts (bullish/bearish tone, risk factors mentioned) |

### How They Combine

```
Technical Signals ──────┐
                        │
Events Calendar ────────┼──► Synthesis Agent ──► Final Forecast
                        │
Speech Signals ─────────┘
```

The Synthesis Agent weighs all three inputs to produce the final volatility forecast for each index.

---

## Formula Note (Bottom of Preferences Page)

```
Forecast = (VIX × Weight) + (Mean × (1-Weight)) × IndexMultiplier
```

This is the simplified formula shown at the bottom of the Preferences page.

### Breaking It Down

| Component | Meaning |
|-----------|---------|
| `VIX` | Current VIX value |
| `Weight` | 0.95 for 1-day, 0.85 for 5-day |
| `Mean` | Long-term average (20.0) |
| `(1-Weight)` | Mean reversion weight (0.05 or 0.15) |
| `IndexMultiplier` | 1.0, 1.15, 0.95, or 1.35 depending on index |

### Complete Example

**Input:**
- Current VIX = 25
- Forecasting 5-day volatility for Nasdaq (NDX)

**Calculation:**
```
Step 1: Apply weights
        = (25 × 0.85) + (20 × 0.15)
        = 21.25 + 3.0
        = 24.25

Step 2: Apply NDX multiplier (1.15x for tech premium)
        = 24.25 × 1.15
        = 27.89

Step 3: (If Fed meeting upcoming) Apply event adjustment
        = 27.89 × 1.15
        = 32.07

Final Answer: ~32% expected volatility for NDX over 5 days
```

---

# PART 7: DEMO QUESTIONS FOR CHAT

Use these questions to demonstrate the Market Pulse chat capabilities.

## Best Overall Demo Question

```
Run a complete volatility analysis
```
*This triggers all agents and gives the most comprehensive response - VIX data, events, earnings sentiment, forecasts, and alerts.*

---

## VIX & Market Status

```
What is the current VIX level and market regime?
```

```
Is volatility currently elevated?
```

---

## Events & Fed

```
What recent Fed communications could impact volatility?
```

```
Show me major M&A deals that might affect the market
```

---

## Earnings Sentiment

```
What's the earnings sentiment for big tech companies?
```

```
How is Nvidia's earnings guidance?
```

```
Compare Apple and Microsoft earnings sentiment
```

---

## Forecasts

```
What are the volatility forecasts for major indices?
```

```
Generate 1-day and 5-day volatility predictions
```

---

## Alerts

```
Are there any market alerts I should know about?
```

---

## Recommended Demo Flow

1. **Start with**: `Run a complete volatility analysis` (shows full pipeline)
2. **Follow up with**: `What's the earnings sentiment for Nvidia?` (specific query)
3. **Then try**: `What recent Fed meetings could impact volatility?` (events focus)

These questions demonstrate that the system handles both broad analysis requests and specific targeted queries about different data sources.
