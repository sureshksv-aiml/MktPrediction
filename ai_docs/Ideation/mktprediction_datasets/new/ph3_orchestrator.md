# Phase 3: Root Orchestrator

**Previous Phase:** Phase 2 - Synthesis + Alert Agents (COMPLETE)
**Current Phase:** Phase 3 - Root Orchestrator
**Next Phase:** Phase 4 - Dashboard UI
**Estimated Time:** 30 minutes
**Status:** PENDING

---

## Project Context (Read First)

> **Before starting this phase, review:**
>
> - [00_system_architecture.md](00_system_architecture.md) - Agent hierarchy and workflow
> - [01_project_plan.md](01_project_plan.md) - Project overview

---

## Phase Objectives

1. Create `volatility_workflow` using SequentialAgent
2. Create `root_agent` orchestrator
3. Add `chat_agent` for Q&A
4. Test full pipeline end-to-end

---

## What This Phase Creates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 3 OUTPUT                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  apps/market-signal-agent/market_signal_agent/
  ├── agent.py                          ← Root orchestrator (replaces test agent)
  ├── workflows/
  │   ├── __init__.py
  │   └── volatility_workflow.py        ← SequentialAgent pipeline (6 agents) ★UPDATED
  └── sub_agents/
      └── chat_agent/
          ├── __init__.py
          └── agent.py                  ← Q&A agent with google_search

  Agent Hierarchy:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  root_agent (LlmAgent - Orchestrator)                                   │
  │  │                                                                       │
  │  ├── volatility_workflow (SequentialAgent)                              │
  │  │   ├── technical_agent                                                │
  │  │   ├── event_calendar_agent                                           │
  │  │   ├── speech_signal_agent                              ★NEW          │
  │  │   ├── synthesis_agent                                                │
  │  │   ├── alert_agent                                                    │
  │  │   └── persistence_agent                                              │
  │  │                                                                       │
  │  └── chat_agent (LlmAgent - Q&A)                                        │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- [ ] Phase 2 completed (all 6 sub-agents working) ★UPDATED
- [ ] technical_agent returns `technical_signals`
- [ ] event_calendar_agent returns `event_calendar` (includes analyst ratings)
- [ ] speech_signal_agent returns `speech_signals` ★NEW
- [ ] synthesis_agent returns `volatility_forecasts`
- [ ] alert_agent returns `alerts`
- [ ] persistence_agent writes to BigQuery

---

## Tasks

### Task 3.1: Create Workflows Directory

```bash
mkdir -p apps/market-signal-agent/market_signal_agent/workflows
mkdir -p apps/market-signal-agent/market_signal_agent/sub_agents/chat_agent

touch apps/market-signal-agent/market_signal_agent/workflows/__init__.py
touch apps/market-signal-agent/market_signal_agent/sub_agents/chat_agent/__init__.py
```

### Task 3.2: Create Volatility Workflow ★UPDATED

**File:** `apps/market-signal-agent/market_signal_agent/workflows/volatility_workflow.py`

```python
"""Volatility Workflow - Sequential pipeline for volatility analysis."""

from google.adk.agents import SequentialAgent

from ..sub_agents import (
    technical_agent,
    event_calendar_agent,
    speech_signal_agent,  # ★NEW
    synthesis_agent,
    alert_agent,
    persistence_agent,
)

# Sequential workflow that runs all agents in order
# Each agent writes to session state via output_key
# Downstream agents read from session state via {placeholder}
volatility_workflow = SequentialAgent(
    name="volatility_workflow",
    description="Sequential pipeline for volatility analysis, forecasting, and alerting",
    sub_agents=[
        technical_agent,       # → technical_signals
        event_calendar_agent,  # → event_calendar (includes analyst ratings)
        speech_signal_agent,   # → speech_signals (earnings sentiment) ★NEW
        synthesis_agent,       # reads {technical_signals}, {event_calendar}, {speech_signals} → volatility_forecasts
        alert_agent,           # reads {technical_signals}, {volatility_forecasts} → alerts
        persistence_agent,     # reads {volatility_forecasts}, {alerts} → BigQuery
    ],
)
```

**File:** `apps/market-signal-agent/market_signal_agent/workflows/__init__.py`

```python
"""Workflows for Market Volatility Agent."""

from .volatility_workflow import volatility_workflow

__all__ = ["volatility_workflow"]
```

### Task 3.3: Create Chat Agent

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/chat_agent/agent.py`

```python
"""Chat Agent - Answers questions about market volatility."""

from google.adk.agents import LlmAgent
from google.adk.tools import google_search

from ...config import config

chat_agent = LlmAgent(
    name="chat_agent",
    model=config.MODEL_NAME,
    instruction="""You are a Market Volatility Assistant helping users understand market conditions.

## Your Role
Answer questions about:
- Current volatility levels and regime
- VIX interpretation and historical context
- Market events affecting volatility
- Volatility forecasts and their meaning
- Alert explanations

## Context Available
You may have access to session state containing:
- {technical_signals}: Current VIX, regime, anomalies
- {event_calendar}: Recent Fed meetings, M&A events, analyst ratings
- {speech_signals}: Earnings call sentiment from major tech companies ★NEW
- {volatility_forecasts}: 1d/5d forecasts for indices
- {alerts}: Active alerts

## Response Guidelines

### VIX Interpretation
| VIX Level | Market Condition | Investor Sentiment |
|-----------|------------------|-------------------|
| < 15 | Calm markets | Complacent, risk-on |
| 15-20 | Normal | Balanced |
| 20-25 | Elevated | Cautious |
| 25-30 | High | Fearful |
| > 30 | Extreme | Panic/Crisis |

### Common Questions

**"Why is volatility elevated?"**
- Check recent Fed communications
- Look for major M&A announcements
- Consider earnings season
- Review geopolitical events

**"What does the forecast mean?"**
- Explain 1d vs 5d horizon
- Discuss confidence levels
- Compare to historical averages

**"Should I be worried about the alert?"**
- Explain severity levels
- Provide historical context
- Suggest monitoring actions

## Using Google Search
Use google_search tool to find:
- Current market news
- Historical VIX events
- Fed policy updates
- Market analysis

## Response Format
- Be concise but informative
- Use bullet points for clarity
- Include relevant numbers/data
- Cite sources when using search results
""",
    tools=[google_search],
)
```

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/chat_agent/__init__.py`

```python
"""Chat Agent for Q&A."""

from .agent import chat_agent

__all__ = ["chat_agent"]
```

### Task 3.4: Update Sub-Agents __init__.py ★UPDATED

**File:** `apps/market-signal-agent/market_signal_agent/sub_agents/__init__.py`

```python
"""Sub-agents for Market Volatility Agent."""

from .technical_agent import technical_agent
from .event_calendar_agent import event_calendar_agent
from .speech_signal_agent import speech_signal_agent  # ★NEW
from .synthesis_agent import synthesis_agent
from .alert_agent import alert_agent
from .persistence_agent import persistence_agent
from .chat_agent import chat_agent

__all__ = [
    "technical_agent",
    "event_calendar_agent",
    "speech_signal_agent",  # ★NEW
    "synthesis_agent",
    "alert_agent",
    "persistence_agent",
    "chat_agent",
]
```

### Task 3.5: Create Root Agent

**File:** `apps/market-signal-agent/market_signal_agent/agent.py`

```python
"""Root Agent - Market Volatility Orchestrator."""

from google.adk.agents import LlmAgent

from .config import config
from .workflows import volatility_workflow
from .sub_agents import chat_agent

root_agent = LlmAgent(
    name="market_volatility_orchestrator",
    model=config.MODEL_NAME,
    instruction="""You are the Market Volatility Orchestrator coordinating volatility analysis.

## Your Role
You orchestrate two main capabilities:
1. **Volatility Analysis Pipeline** - Full analysis with forecasts and alerts
2. **Q&A Chat** - Answer questions about volatility

## Available Sub-Agents

### 1. volatility_workflow (SequentialAgent)
Use for: "Analyze volatility", "Generate forecasts", "Run full analysis"

This runs a sequential pipeline:
1. technical_agent → VIX level, regime, anomalies
2. event_calendar_agent → Fed meetings, M&A events, analyst ratings
3. speech_signal_agent → Earnings call sentiment ★NEW
4. synthesis_agent → 1d/5d volatility forecasts (uses all 3 signal sources)
5. alert_agent → VIX threshold alerts
6. persistence_agent → Save to BigQuery

### 2. chat_agent
Use for: Questions, explanations, "Why is...", "What does..."

The chat agent can:
- Explain VIX levels and regimes
- Interpret forecasts and alerts
- Search for current market news
- Provide historical context

## Routing Logic

**Route to volatility_workflow when user asks:**
- "Analyze current volatility"
- "Generate volatility forecasts"
- "Run the analysis pipeline"
- "What are the current signals?"
- "Check for alerts"

**Route to chat_agent when user asks:**
- "Why is volatility high?"
- "What does this alert mean?"
- "Explain the VIX"
- "What happened in the market today?"
- General questions about volatility

## Response Format
After running volatility_workflow, summarize:
1. Current regime and VIX level
2. Key forecasts (SPX, NDX, DJI, RUT)
3. Active alerts (if any)
4. Notable events

After chat_agent, provide the answer directly.

## Example Interactions

User: "Analyze current market volatility"
→ Run volatility_workflow, then summarize results

User: "Why is the VIX elevated today?"
→ Route to chat_agent for explanation with search
""",
    sub_agents=[volatility_workflow, chat_agent],
)
```

### Task 3.6: Update Package __init__.py

**File:** `apps/market-signal-agent/market_signal_agent/__init__.py`

```python
"""Market Volatility Prediction Agent."""

from .agent import root_agent
from .config import config

__all__ = ["root_agent", "config"]
```

### Task 3.7: Test Full Pipeline

```bash
cd apps/market-signal-agent
uv run adk web .
```

Test prompts:

**1. Full Pipeline Test:**
```
Analyze current market volatility and generate forecasts
```
Expected: Runs all 6 agents sequentially, returns VIX, earnings sentiment, forecasts, alerts ★UPDATED

**2. Chat Test:**
```
Why might volatility be elevated right now?
```
Expected: Routes to chat_agent, uses google_search for context

**3. Specific Query:**
```
What alerts are currently active?
```
Expected: Routes appropriately based on context

**4. Explanation Request:**
```
Explain what a VIX of 25 means for investors
```
Expected: Routes to chat_agent for explanation

---

## Verification Checklist

- [ ] workflows/ directory created
- [ ] volatility_workflow.py with SequentialAgent
- [ ] chat_agent created with google_search tool
- [ ] root_agent orchestrator created
- [ ] All imports working correctly
- [ ] `uv sync` succeeds
- [ ] `adk web` starts without errors
- [ ] Full pipeline runs: volatility_workflow
- [ ] Chat agent responds to questions
- [ ] Root agent routes correctly

---

## Handoff to Phase 4

**What's Ready:**
- Complete agent system:
  - root_agent orchestrator
  - volatility_workflow (SequentialAgent)
  - 6 sub-agents in pipeline (includes speech_signal_agent) ★UPDATED
  - chat_agent for Q&A
- Session state flow working (3 signal sources → synthesis)
- BigQuery persistence working

**What's Next:**
- Create dashboard UI components
- Build volatility dashboard page
- Display forecasts, alerts, and earnings sentiment

---

## Prompt for Next Session (Phase 4)

```
`ph4_dashboard_ui.md`
Reference: `00_system_architecture.md`, `01_project_plan.md`

I'm continuing the Market Volatility Prediction Agent project.

## Phase 3 (Root Orchestrator) is COMPLETE

**What was created:**
- volatility_workflow (SequentialAgent) with 6 sub-agents: ★UPDATED
  - technical_agent → event_calendar_agent → speech_signal_agent → synthesis_agent → alert_agent → persistence_agent
- chat_agent with google_search for Q&A
- root_agent orchestrator that routes between workflow and chat
- Full pipeline tested and working (3 signal sources → synthesis)

## Now Starting: Phase 4 - Dashboard UI

Please read:
1. `ai_docs/Ideation/mktprediction_datasets/new/ph4_dashboard_ui.md` - Phase 4 tasks
2. `ai_docs/Ideation/mktprediction_datasets/new/00_system_architecture.md` - UI mockups

## Key Tasks for Phase 4:
1. Create VolatilityDashboard.tsx (main container)
2. Create RegimeIndicator.tsx (VIX regime bar)
3. Create ForecastTable.tsx (1d/5d forecasts)
4. Create AnomalyList.tsx (z-score anomalies)
5. Create AlertsPanel.tsx (VIX alerts)
6. Create volatility page at /volatility

Please start by reading the phase document.
```
