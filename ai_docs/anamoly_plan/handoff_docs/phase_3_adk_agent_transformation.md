# Phase 3: ADK Agent Transformation - Handoff Document

**Created:** December 10, 2024
**Previous Phase:** Phase 2 (Database Schema) - COMPLETED
**Current Phase:** Phase 3 (ADK Agent Transformation)
**Status:** ✅ COMPLETED (December 10, 2024)

---

## Phase 3 Completion Summary

Phase 3 has been completed with the following deliverables:
- ✅ Cleaned up all old competitor analysis code (10 sub_agent folders deleted)
- ✅ Created traffic_anomaly_orchestrator (root agent)
- ✅ Created data_agent with BigQuery Toolset
- ✅ Created report_agent (NEW)
- ✅ Created persistence_agent with function tools
- ✅ Created analysis_pipeline (SequentialAgent)
- ✅ Created Reports API routes (POST/GET/DELETE)
- ✅ Updated all configuration and exports

---

## Post-Completion Bug Fixes

### Bug Fix #1: ADK Web Environment Variables

**Problem:** ADK web server looks for `.env` files, NOT `.env.local`:
```
No .env file found for traffic_anomaly_agent
ValueError: Missing key inputs argument! To use the Google Cloud API, provide (`vertexai`, `project` & `location`) arguments.
```

**Solution:** Created `.env` file (ADK web convention) alongside `.env.local`

**File created:** `apps/traffic-anomaly-agent/.env`
```bash
# Google Cloud Configuration
GOOGLE_GENAI_USE_VERTEXAI=True
GOOGLE_CLOUD_PROJECT=adk-traffic-anomaly
GOOGLE_CLOUD_LOCATION=us-central1

# BigQuery Configuration
BIGQUERY_DATASET=adk-traffic-anomaly.adk_webtraffic_dataset
BIGQUERY_TABLE=adk-traffic-anomaly.adk_webtraffic_dataset.webtraffic_dataset

# Next.js API Configuration
NEXTJS_API_URL=http://localhost:3000
```

**Note:** Keep `DATABASE_URL` and other secrets in `.env.local` only.

---

### Bug Fix #2: User ID Not in Session State

**Problem:** When testing with ADK web, `user_id` is not passed to session state, causing persistence to fail:
```
User ID not found in session state. Cannot save report.
```

**Solution:** Updated `callbacks.py` to set a default test `user_id` for development

**File modified:** `apps/traffic-anomaly-agent/traffic_anomaly_agent/utils/callbacks.py`
```python
# Set default test user_id for ADK web testing (if not already set by frontend)
if not callback_context.state.get("user_id"):
    callback_context.state["user_id"] = "test-user-adk-web"
```

**Note:** In production, the frontend will pass the real `user_id` when calling the ADK API.

---

### Bug Fix #3: Next.js API Required for Persistence

**Problem:** Persistence agent can't save if Next.js server isn't running:
```
Could not connect to Next.js API at http://localhost:3000: Max retries exceeded
```

**Solution:** Both servers must be running for full workflow:

| Server | URL | Command |
|--------|-----|---------|
| ADK Web | http://localhost:8000 | `uv run adk web .` (in traffic-anomaly-agent/) |
| Next.js API | http://localhost:3000 | `npm run dev` (in apps/web/) |

---

## Phase 3.5: Interactive Workflow (Architectural Enhancement)

### Problem Statement

The initial Phase 3 implementation used a **SequentialAgent** that automatically chained all three agents:
```
User: "Show me last 7 days anomalies"
→ data_agent runs automatically
→ report_agent runs automatically
→ persistence_agent runs automatically
→ Report saved (user had no control)
```

### Solution: Intent-Based Routing

Replace SequentialAgent with direct sub_agents and intent-based routing:

**Architecture Change:**
```
BEFORE: orchestrator → SequentialAgent [data → report → persist]
AFTER:  orchestrator → [data_agent, report_agent, persistence_agent]
```

**User-Controlled Workflow:**
```
Phase 1: Data Exploration (iterative)
├── User: "Show me last 7 days anomalies"
├── data_agent: Returns results
├── User: "Also check bounce rate specifically"
└── data_agent: Returns more results (can iterate N times)

Phase 2: Report Generation (user-triggered)
├── User: "Generate a report"
├── report_agent: Creates report
└── User: "Make it more detailed" (can iterate)

Phase 3: Persistence (explicit command)
├── User: "Save this report"
└── persistence_agent: Saves to database
```

**Intent Detection:**
| User Intent | Trigger Phrases | Agent Called |
|-------------|-----------------|--------------|
| Data Query | "show", "analyze", "check", "what", "why" | data_agent |
| Report Generation | "generate report", "create report", "summarize" | report_agent |
| Save/Persist | "save", "persist", "store" | persistence_agent |

**Files Modified for Phase 3.5:**
- Delete `sub_agents/analysis_pipeline/` folder
- Update `agent.py` with intent-based instructions
- Update `sub_agents/__init__.py` exports

---

## Project Overview

### What We're Building
**Web Traffic Anomaly Assistant** - A multi-agent platform that uses BigQuery ML to detect anomalies in website traffic data and generates intelligent reports through natural language interaction.

### Architecture Summary (from BrainDump_Screenflows_architecture.png)
```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
│  ┌─────────────┬──────────────────────────────┬─────────────────────┐  │
│  │  SIDEBAR    │     CHAT ASSISTANT           │    REPORTS PANEL    │  │
│  │  - App Name │  "Web Traffic Report         │ "Web Traffic Reports"│  │
│  │  - Reports  │   Analytics Chat Assistant"  │  - Date grouped     │  │
│  │  - Topic    │                              │  - Report links     │  │
│  │  - User ID  │  [Chat messages area]        │  - Brief summaries  │  │
│  │  - Logout   │  [Type message] [Enter]      │                     │  │
│  └─────────────┴──────────────────────────────┴─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ADK AGENT ARCHITECTURE                                │
│                                                                          │
│   Root Agent (Report Analytics Orchestrator)                            │
│   ├── Plans tasks, coordinates agents, handles retries                  │
│   │                                                                      │
│   ├── Data Agent (BigQuery Toolset - Google ADK Built-in)              │
│   │   └── Uses BigQuery toolset, runs BigQuery ML, returns results     │
│   │                                                                      │
│   ├── Report Agent (NEW - replaces report_composer)                    │
│   │   └── Synthesis, root-cause narratives, executive summary          │
│   │                                                                      │
│   └── Persistence Agent                                                 │
│       └── Stores report payload and chat summary to database           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │   BigQuery ML   │  │    Supabase     │  │      Supabase Auth      │ │
│  │  (Traffic Data) │  │  (PostgreSQL)   │  │    (Authentication)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Use Case Summary (from Project_info.txt)
- **Problem**: Teams struggle to spot and explain anomalous traffic patterns quickly
- **Solution**: Multi-agent system that detects outliers with BigQuery ML, explains them in plain language, and saves reports per user
- **User Flow**:
  1. Authenticated user submits request via chat
  2. Orchestrator decomposes tasks (data fetch → anomaly detection → synthesis)
  3. Data Agent executes BigQuery SQL/ML, returns anomalies with metrics
  4. Report Agent explains anomalies, contextualizes with referrers/campaigns
  5. Persistence Agent saves report + chat summary under user's UID
  6. UI renders charts, tables, narrative

---

## UI-ADK Integration Architecture (CRITICAL)

### Current Communication Pattern

The existing system uses a **fire-and-forget + polling** pattern:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UI ↔ ADK COMMUNICATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────┐                           ┌────────────────────────┐    │
│  │    Next.js     │                           │    ADK Engine          │    │
│  │    Frontend    │                           │    (Python)            │    │
│  └───────┬────────┘                           └───────────┬────────────┘    │
│          │                                                │                  │
│          │  1. POST /api/run                              │                  │
│          │     {userId, message, sessionId}               │                  │
│          ├──────────────────────────────────────────────► │                  │
│          │                                                │                  │
│          │  2. Fire-and-forget to ADK                     │                  │
│          │     POST {ADK_URL}/run                         │                  │
│          │     {app_name, user_id, session_id, message}   │                  │
│          │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ► │                  │
│          │                                                │                  │
│          │  3. Immediate success response                 │                  │
│          │ ◄──────────────────────────────────────────────┤                  │
│          │                                                │                  │
│          │  4. ADK processes request asynchronously       │                  │
│          │     - Orchestrator delegates to sub-agents     │                  │
│          │     - Results stored in session state/events   │                  │
│          │                                                │                  │
│          │  5. Polling (every 3 seconds)                  │                  │
│          │     Server Action: getSessionEvents()          │                  │
│          │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ► │                  │
│          │                                                │                  │
│          │  6. Session events returned                    │                  │
│          │     Contains new messages from agents          │                  │
│          │ ◄ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                  │
│          │                                                │                  │
└──────────┴────────────────────────────────────────────────┴──────────────────┘
```

### Existing API Routes

| Route | Method | Purpose | File |
|-------|--------|---------|------|
| `/api/run` | POST | Send message to ADK agent | `apps/web/app/api/run/route.ts` |
| `/api/sessions` | POST | Create new ADK session | `apps/web/app/api/sessions/route.ts` |
| `/api/health` | GET | Health check | `apps/web/app/api/health/route.ts` |

### Existing Server Actions

| Action | File | Purpose |
|--------|------|---------|
| `getSessionEvents()` | `apps/web/app/actions/sessions.ts` | Poll session for new events |

### Existing Services

| Service | File | Purpose |
|---------|------|---------|
| `AdkSessionService` | `apps/web/lib/adk/session-service.ts` | Session CRUD operations with ADK backend |

### Existing Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useChatPolling` | `apps/web/hooks/useChatPolling.ts` | Background polling for session updates (3s interval) |

---

## Persistence Agent → Database Architecture Decision

The `persistence_agent` needs to save reports to the Supabase PostgreSQL database. There are **two architectural options**:

### Option A: ADK Agent Calls Next.js API (RECOMMENDED)

```
┌─────────────────┐     HTTP POST     ┌─────────────────┐     Drizzle ORM     ┌──────────────┐
│ persistence_    │ ──────────────► │   Next.js       │ ─────────────────► │   Supabase   │
│ agent (Python)  │                   │   /api/reports  │                     │   PostgreSQL │
└─────────────────┘                   └─────────────────┘                     └──────────────┘
```

**Pros:**
- Uses existing Drizzle ORM and schema
- Database credentials stay in Next.js only
- Consistent with existing architecture patterns
- Type-safe database operations

**Cons:**
- Extra HTTP hop
- Requires API endpoint for agent to call

**Implementation:**
1. Create `POST /api/reports` endpoint in Next.js
2. Persistence agent function tool makes HTTP call to Next.js API
3. Next.js API uses Drizzle ORM to insert into `reports` table

### Option B: Direct Supabase Connection from Python

```
┌─────────────────┐     Direct SQL     ┌──────────────┐
│ persistence_    │ ─────────────────► │   Supabase   │
│ agent (Python)  │                     │   PostgreSQL │
└─────────────────┘                     └──────────────┘
```

**Pros:**
- Simpler, no extra HTTP hop
- Agent has direct database access

**Cons:**
- Requires sharing DATABASE_URL with Python backend
- Duplicates database logic (Python + TypeScript)
- No Drizzle ORM type safety in Python

---

## NEW API Routes Required for Phase 3

### Reports API Routes (for Option A)

Create these new routes for the persistence agent to call:

| Route | Method | Purpose |
|-------|--------|---------|
| `POST /api/reports` | POST | Create new report (called by persistence_agent) |
| `GET /api/reports` | GET | List user's reports |
| `GET /api/reports/[id]` | GET | Get single report |
| `DELETE /api/reports/[id]` | DELETE | Delete report |

### File: `apps/web/app/api/reports/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/drizzle/db";
import { reports } from "@/lib/drizzle/schema";
import { eq, desc } from "drizzle-orm";

// POST - Create report (called by persistence_agent)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    const newReport = await db.insert(reports).values({
      user_id: userId,
      title: data.title,
      content: data.content,
      summary: data.summary,
      session_id: data.session_id,
      report_type: data.report_type || "web_traffic",
      anomaly_data: data.anomaly_data,
    }).returning();

    return NextResponse.json({
      success: true,
      report_id: newReport[0].id
    });
  } catch (error) {
    console.error("Failed to create report:", error);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}

// GET - List user's reports
export async function GET(): Promise<NextResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userReports = await db
      .select()
      .from(reports)
      .where(eq(reports.user_id, userId))
      .orderBy(desc(reports.created_at));

    return NextResponse.json({ reports: userReports });
  } catch (error) {
    console.error("Failed to list reports:", error);
    return NextResponse.json({ error: "Failed to list reports" }, { status: 500 });
  }
}
```

### Persistence Agent Function Tool Update

```python
# apps/traffic-anomaly-agent/traffic_anomaly_agent/tools/persistence_tools.py

import httpx
import os

NEXTJS_API_URL = os.getenv("NEXTJS_API_URL", "http://localhost:3000")

def save_report(
    user_id: str,
    title: str,
    content: str,
    summary: str,
    anomaly_data: dict,
    session_id: str | None = None
) -> dict:
    """
    Save a report by calling the Next.js API endpoint.

    This maintains the architectural pattern where database operations
    go through the Next.js backend using Drizzle ORM.
    """
    try:
        response = httpx.post(
            f"{NEXTJS_API_URL}/api/reports",
            json={
                "user_id": user_id,
                "title": title,
                "content": content,
                "summary": summary,
                "anomaly_data": anomaly_data,
                "session_id": session_id,
                "report_type": "web_traffic",
            },
            headers={"Content-Type": "application/json"},
            timeout=30.0,
        )

        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "report_id": data.get("report_id"),
            }
        else:
            return {
                "success": False,
                "error": f"API returned {response.status_code}",
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }
```

---

## Environment Variable Updates

### Next.js (.env.local)
```bash
# Existing
ADK_URL="http://localhost:8000"

# No changes needed - DATABASE_URL already configured
```

### ADK Agent (.env.local)
```bash
# Add this for persistence agent to call Next.js
NEXTJS_API_URL="http://localhost:3000"

# BigQuery Configuration
BIGQUERY_DATASET=website_traffic
BIGQUERY_TABLE=sessions
```

---

## Phase 2 Completion Summary

### What Was Done
| Task | File/Folder | Status |
|------|-------------|--------|
| Created reports schema | `apps/web/lib/drizzle/schema/reports.ts` | ✅ Complete |
| Updated schema exports | `apps/web/lib/drizzle/schema/index.ts` | ✅ Complete |
| Generated migration | `apps/web/drizzle/migrations/0000_mixed_blob.sql` | ✅ Complete |
| Created down migration | `apps/web/drizzle/migrations/0000_mixed_blob/down.sql` | ✅ Complete |
| Applied migration | Supabase PostgreSQL | ✅ Complete |
| Type check passed | No errors | ✅ Complete |

### Database Tables Now Available
- `users` - User profiles (6 columns, 1 index)
- `session_names` - ADK session titles (7 columns, 2 indexes)
- `reports` - Anomaly analysis reports (10 columns, 3 indexes) ← **NEW**

---

## Phase 3: ADK Agent Transformation - Implementation Guide

### Goal
Transform the existing competitor analysis agent system into a traffic anomaly detection system with:
1. **New root orchestrator** (`traffic_anomaly_orchestrator`)
2. **Data agent** using Google's BigQuery Toolset (ADK built-in)
3. **Report agent** (NEW - not adapted from old code)
4. **Persistence agent** for saving reports to Supabase
5. **Complete cleanup** of old competitor analysis code

---

## Critical ADK Design Principles (from agent_orchestrator.md)

### 1. Root Agent as Human Consultant Pattern
✅ **BEST PRACTICE**: Root agents should act like human consultants
- Gather context first before diving into work
- Delegate control to specialized workflow agents
- Keep instructions simple and focused on coordination
- Save context to session state with `output_key`

❌ **AVOID**: Root agents with complex processing logic

### 2. Built-in Tool Constraints (CRITICAL)
- **Only ONE built-in tool per individual agent**
- **NO other tools can be used with built-in tools in the same agent**
- **Multiple agents in the system can each have their own built-in tool**

### 3. Session State Communication
- Information flows through session state, never direct parameters
- Agents write to ONE state key via `output_key`
- Use `{state_key}` placeholders in instructions to read state

### 4. Agent Types
| Type | Use For |
|------|---------|
| `LlmAgent` | Single-step tasks, tool use, coordination |
| `SequentialAgent` | Multi-step workflows requiring ordered execution |
| `ParallelAgent` | Independent tasks that can run simultaneously |
| `LoopAgent` | Repetitive tasks with termination conditions |

---

## Tasks to Complete

### Task 1: Clean Up Old Competitor Analysis Code

**Goal**: Remove all old competitor analysis agents and related code

**Files/Folders to DELETE:**
```
apps/traffic-anomaly-agent/traffic_anomaly_agent/sub_agents/
├── section_planner/           # DELETE entire folder
├── section_researcher/        # DELETE entire folder
├── enhanced_search_executor/  # DELETE entire folder
├── iterative_refinement_loop/ # DELETE entire folder
├── report_composer/           # DELETE entire folder (will create new report_agent)
└── [any other old sub_agents] # DELETE
```

**Files to MODIFY (clear old references):**
- `apps/traffic-anomaly-agent/traffic_anomaly_agent/agent.py` - Will be completely rewritten
- `apps/traffic-anomaly-agent/traffic_anomaly_agent/__init__.py` - Update exports

**Verification:**
- [ ] All old sub_agent folders deleted
- [ ] No imports referencing deleted modules
- [ ] Clean slate for new agent implementation

---

### Task 2: Create Root Agent (traffic_anomaly_orchestrator)

**File to create:** `apps/traffic-anomaly-agent/traffic_anomaly_agent/agent.py`

**Agent Design:**
```python
# Root Agent: traffic_anomaly_orchestrator
# Type: LlmAgent (coordinates sub-agents)
# Model: gemini-2.5-flash
# Purpose: Plans tasks, coordinates agents, handles retries
# Sub-agents: [analysis_pipeline]
# Tools: None (delegates to sub-agents)
# Output Key: analysis_context
```

**Instructions Pattern (Human Consultant):**
```
You are a Report Analytics Orchestrator for website traffic anomaly detection.

Your role is to:
1. Understand the user's analysis request
2. Gather necessary context (date ranges, metrics of interest)
3. Delegate to the analysis pipeline for execution

IMPORTANT:
- Ask clarifying questions if the request is ambiguous
- Save analysis context to session state
- Delegate to analysis_pipeline for actual work
```

**Session State:**
- **Reads**: User request (from conversation)
- **Writes**: `analysis_context` (user requirements, date ranges, metrics)

---

### Task 3: Create Data Agent (Using BigQuery Toolset)

**File to create:** `apps/traffic-anomaly-agent/traffic_anomaly_agent/sub_agents/data_agent/agent.py`

**CRITICAL: Use Google's BigQuery Toolset (ADK Built-in)**

The BigQuery Toolset is provided by Google ADK out of the box. Reference:
```python
from google.adk.tools.bigquery import BigQueryToolset

# BigQuery toolset provides:
# - Query execution
# - Schema inspection
# - ML model invocation (ML.DETECT_ANOMALIES)
```

**Agent Design:**
```python
# Data Agent
# Type: LlmAgent
# Model: gemini-2.5-flash
# Purpose: Execute BigQuery queries and ML anomaly detection
# Tools: [BigQueryToolset] - ONE built-in tool only
# Output Key: anomaly_results
```

**Instructions:**
```
You are a BigQuery data specialist for website traffic analysis.

**READ FROM SESSION STATE:**
Analysis context: {analysis_context}

**YOUR TASK:**
1. Build appropriate SQL queries for the traffic data
2. Use BigQuery ML DETECT_ANOMALIES function for outlier detection
3. Return structured anomaly results with metrics

**AVAILABLE DATA COLUMNS:**
- Page Views (INTEGER)
- Session Duration (FLOAT)
- Bounce Rate (FLOAT)
- Traffic Source (STRING)
- Time on Page (FLOAT)
- Previous Visits (INTEGER)
- Conversion Rate (FLOAT)

**OUTPUT:**
Return structured anomaly data including:
- Detected anomalies with timestamps
- Z-scores and deviation metrics
- Affected metrics and their values
```

**Session State:**
- **Reads**: `{analysis_context}`
- **Writes**: `anomaly_results`

---

### Task 4: Create Report Agent (NEW)

**File to create:** `apps/traffic-anomaly-agent/traffic_anomaly_agent/sub_agents/report_agent/agent.py`

**IMPORTANT**: This is a NEW agent, NOT adapted from report_composer

**Agent Design:**
```python
# Report Agent
# Type: LlmAgent
# Model: gemini-2.5-pro (better for synthesis and writing)
# Purpose: Generate executive reports from anomaly data
# Tools: None (pure LLM text generation)
# Output Key: generated_report
```

**Instructions:**
```
You are a Report Generation specialist for traffic anomaly analysis.

**READ FROM SESSION STATE:**
Analysis context: {analysis_context}
Anomaly results: {anomaly_results}

**YOUR TASK:**
Generate a professional markdown report that includes:

1. **Executive Summary**
   - Key findings in 2-3 sentences
   - Severity assessment (Critical/High/Medium/Low)

2. **Anomaly Details**
   - Each detected anomaly with:
     - Timestamp and affected metric
     - Deviation from baseline (z-score)
     - Potential root causes

3. **Root Cause Analysis**
   - Correlation with traffic sources
   - Campaign or referrer patterns
   - Temporal patterns (day of week, time of day)

4. **Recommendations**
   - Actionable next steps
   - Monitoring suggestions

**OUTPUT FORMAT:**
Well-structured markdown with headers, tables where appropriate, and clear narrative.
```

**Session State:**
- **Reads**: `{analysis_context}`, `{anomaly_results}`
- **Writes**: `generated_report`

---

### Task 5: Create Persistence Agent

**File to create:** `apps/traffic-anomaly-agent/traffic_anomaly_agent/sub_agents/persistence_agent/agent.py`

**Agent Design:**
```python
# Persistence Agent
# Type: LlmAgent
# Model: gemini-2.5-flash
# Purpose: Save reports and chat summaries to Supabase
# Tools: [save_report, get_user_reports] - Function tools
# Output Key: persistence_result
```

**Function Tools to Create:**
```python
# File: apps/traffic-anomaly-agent/traffic_anomaly_agent/tools/persistence_tools.py

from google.adk.tools import FunctionTool

def save_report(
    user_id: str,
    title: str,
    content: str,
    summary: str,
    anomaly_data: dict,
    session_id: str | None = None
) -> dict:
    """
    Save a report to the database for the authenticated user.

    Args:
        user_id: The authenticated user's ID
        title: Report title
        content: Full markdown report content
        summary: Brief summary for list view
        anomaly_data: Structured anomaly metrics (JSON)
        session_id: Optional ADK session ID

    Returns:
        dict with report_id and success status
    """
    # Implementation: Insert into reports table via Supabase
    pass

def get_user_reports(
    user_id: str,
    limit: int = 10
) -> list:
    """
    Retrieve reports for a user, ordered by creation date.

    Args:
        user_id: The authenticated user's ID
        limit: Maximum number of reports to return

    Returns:
        List of report summaries with id, title, summary, created_at
    """
    # Implementation: Query reports table
    pass
```

**Instructions:**
```
You are a Persistence specialist for saving analysis reports.

**READ FROM SESSION STATE:**
Analysis context: {analysis_context}
Generated report: {generated_report}
Anomaly results: {anomaly_results}

**YOUR TASK:**
1. Extract a brief summary from the report (2-3 sentences)
2. Generate an appropriate title based on the analysis
3. Save the report using the save_report tool
4. Confirm successful persistence

**IMPORTANT:**
- The user_id comes from the authenticated session
- Include the full anomaly_data for later retrieval
- Generate a descriptive title (e.g., "Traffic Anomaly Report - Dec 10, 2024")
```

**Session State:**
- **Reads**: `{analysis_context}`, `{generated_report}`, `{anomaly_results}`
- **Writes**: `persistence_result`

---

### Task 6: Create Analysis Pipeline (SequentialAgent)

**File to create:** `apps/traffic-anomaly-agent/traffic_anomaly_agent/sub_agents/analysis_pipeline/agent.py`

**Agent Design:**
```python
# Analysis Pipeline
# Type: SequentialAgent
# Purpose: Orchestrate the analysis workflow in order
# Sub-agents: [data_agent, report_agent, persistence_agent]
```

**Implementation:**
```python
from google.adk.agents import SequentialAgent
from ..data_agent import data_agent
from ..report_agent import report_agent
from ..persistence_agent import persistence_agent

analysis_pipeline = SequentialAgent(
    name="analysis_pipeline",
    description="Execute traffic anomaly analysis workflow",
    sub_agents=[
        data_agent,       # Step 1: Query BigQuery, detect anomalies
        report_agent,     # Step 2: Generate report from results
        persistence_agent # Step 3: Save report to database
    ],
)
```

---

### Task 7: Update Project Structure

**Final folder structure:**
```
apps/traffic-anomaly-agent/
├── traffic_anomaly_agent/
│   ├── __init__.py              # Export: from .agent import root_agent
│   ├── agent.py                 # Root agent (traffic_anomaly_orchestrator)
│   ├── config.py                # Configuration (models, project settings)
│   ├── models.py                # Pydantic models for structured output
│   │
│   ├── sub_agents/
│   │   ├── __init__.py
│   │   ├── analysis_pipeline/
│   │   │   ├── __init__.py
│   │   │   └── agent.py         # SequentialAgent
│   │   ├── data_agent/
│   │   │   ├── __init__.py
│   │   │   └── agent.py         # LlmAgent with BigQueryToolset
│   │   ├── report_agent/
│   │   │   ├── __init__.py
│   │   │   └── agent.py         # LlmAgent (no tools)
│   │   └── persistence_agent/
│   │       ├── __init__.py
│   │       └── agent.py         # LlmAgent with function tools
│   │
│   ├── tools/
│   │   ├── __init__.py
│   │   └── persistence_tools.py  # save_report, get_user_reports
│   │
│   └── utils/
│       ├── __init__.py
│       └── bigquery_config.py    # BigQuery project/dataset config
│
├── scripts/
├── pyproject.toml
└── .env.local
```

---

### Task 8: Update Configuration Files

**File to modify:** `apps/traffic-anomaly-agent/traffic_anomaly_agent/config.py`

```python
from typing import Optional
import os

class Config:
    def __init__(self):
        # Google Cloud
        self.project_id: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
        self.location: str = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

        # Models
        self.model_fast: str = "gemini-2.5-flash"
        self.model_pro: str = "gemini-2.5-pro"

        # BigQuery
        self.bigquery_dataset: str = os.getenv("BIGQUERY_DATASET", "website_traffic")
        self.bigquery_table: str = os.getenv("BIGQUERY_TABLE", "sessions")

        # Database
        self.database_url: str = os.getenv("DATABASE_URL", "")

        # Agent
        self.agent_name: str = "traffic_anomaly_orchestrator"
        self.max_iterations: int = 3

config = Config()
```

**File to modify:** `apps/traffic-anomaly-agent/.env.local`

Add these new variables:
```bash
# BigQuery Configuration
BIGQUERY_DATASET=website_traffic
BIGQUERY_TABLE=sessions

# Next.js API URL (for persistence agent)
NEXTJS_API_URL=http://localhost:3000
```

---

### Task 9: Create Reports API Routes (Next.js)

**Files to create:**

#### `apps/web/app/api/reports/route.ts`
Handles POST (create) and GET (list) operations. See code example in "NEW API Routes Required" section above.

#### `apps/web/app/api/reports/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/drizzle/db";
import { reports } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";

// GET - Get single report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const report = await db
      .select()
      .from(reports)
      .where(and(eq(reports.id, id), eq(reports.user_id, userId)))
      .limit(1);

    if (report.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ report: report[0] });
  } catch (error) {
    console.error("Failed to get report:", error);
    return NextResponse.json({ error: "Failed to get report" }, { status: 500 });
  }
}

// DELETE - Delete report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db
      .delete(reports)
      .where(and(eq(reports.id, id), eq(reports.user_id, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete report:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
```

---

## Session State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SESSION STATE FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User Request                                                            │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────────────────────────┐                                │
│  │   traffic_anomaly_orchestrator      │                                │
│  │   output_key: "analysis_context"    │                                │
│  └─────────────────────────────────────┘                                │
│       │                                                                  │
│       │  Writes: analysis_context = {                                   │
│       │    "date_range": "last_7_days",                                 │
│       │    "metrics": ["page_views", "bounce_rate"],                    │
│       │    "user_request": "Find traffic anomalies this week"           │
│       │  }                                                               │
│       ▼                                                                  │
│  ┌─────────────────────────────────────┐                                │
│  │   data_agent (BigQuery Toolset)     │                                │
│  │   Reads: {analysis_context}         │                                │
│  │   output_key: "anomaly_results"     │                                │
│  └─────────────────────────────────────┘                                │
│       │                                                                  │
│       │  Writes: anomaly_results = {                                    │
│       │    "anomalies": [...],                                          │
│       │    "metrics": {...},                                            │
│       │    "query_executed": "..."                                      │
│       │  }                                                               │
│       ▼                                                                  │
│  ┌─────────────────────────────────────┐                                │
│  │   report_agent                      │                                │
│  │   Reads: {analysis_context},        │                                │
│  │          {anomaly_results}          │                                │
│  │   output_key: "generated_report"    │                                │
│  └─────────────────────────────────────┘                                │
│       │                                                                  │
│       │  Writes: generated_report = "# Traffic Anomaly Report..."       │
│       ▼                                                                  │
│  ┌─────────────────────────────────────┐                                │
│  │   persistence_agent                 │                                │
│  │   Reads: {analysis_context},        │                                │
│  │          {anomaly_results},         │                                │
│  │          {generated_report}         │                                │
│  │   output_key: "persistence_result"  │                                │
│  └─────────────────────────────────────┘                                │
│       │                                                                  │
│       │  Writes: persistence_result = {                                 │
│       │    "report_id": "uuid-...",                                     │
│       │    "success": true                                              │
│       │  }                                                               │
│       ▼                                                                  │
│  Response to User                                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Important References

### Dev Templates to Use
| Template | Purpose |
|----------|---------|
| `ai_docs/dev_templates/agent_orchestrator.md` | ADK workflow design patterns |
| `ai_docs/dev_templates/adk_bottleneck_analysis.md` | Troubleshooting patterns |
| `ai_docs/dev_templates/adk_task_template.md` | Task implementation template |
| `ai_docs/dev_templates/python_task_template.md` | Python coding standards |

### Architecture References
| File | Purpose |
|------|---------|
| `ai_docs/diagrams/Project_info.txt` | Use case and flow description |
| `ai_docs/diagrams/BrainDump_Screenflows_architecture.png` | Visual architecture |

### Plan File
**Location:** `C:\Users\sures\.claude\plans\adaptive-kindling-ripple.md`

---

## Verification Checklist for Phase 3

### Cleanup
- [ ] Deleted `sub_agents/section_planner/`
- [ ] Deleted `sub_agents/section_researcher/`
- [ ] Deleted `sub_agents/enhanced_search_executor/`
- [ ] Deleted `sub_agents/iterative_refinement_loop/`
- [ ] Deleted `sub_agents/report_composer/`
- [ ] No broken imports in codebase

### New Agents Created
- [ ] `agent.py` - Root agent (traffic_anomaly_orchestrator)
- [ ] `sub_agents/analysis_pipeline/agent.py` - SequentialAgent
- [ ] `sub_agents/data_agent/agent.py` - With BigQuery Toolset
- [ ] `sub_agents/report_agent/agent.py` - Report generation
- [ ] `sub_agents/persistence_agent/agent.py` - Database persistence

### Tools Created
- [ ] `tools/persistence_tools.py` - save_report, get_user_reports

### API Routes Created (Next.js)
- [ ] `apps/web/app/api/reports/route.ts` - POST (create), GET (list)
- [ ] `apps/web/app/api/reports/[id]/route.ts` - GET (single), DELETE

### Configuration Updated
- [ ] `config.py` - New configuration class
- [ ] `.env.local` - BigQuery variables added
- [ ] `__init__.py` files - Proper exports

### Testing
- [ ] `uv sync` completes without errors
- [ ] Agent imports work correctly
- [ ] ADK web interface loads agents

---

## Common Pitfalls to Avoid (from adk_bottleneck_analysis.md)

### Pattern 6: Agent Delegation vs Tool Call Confusion
- **Use `sub_agents=[agent]`** AND **instruct agent to delegate** for handoffs
- **Use `AgentTool(agent)`** when you want results returned

### Pattern 8: State Reference Interpolation Failures
- Ensure all `{state_key}` references in instructions have corresponding `output_key` in upstream agents

### Pattern 10: Agent Responsibility Overload
- Each agent should do input → processing → output (max 1-2 tool calls)
- Don't create "super agents" that do everything

---

## BigQuery Toolset Notes

**Google ADK BigQuery Toolset** is a built-in tool that provides:
- Query execution against BigQuery datasets
- Schema inspection
- ML model invocation (including `ML.DETECT_ANOMALIES`)

**Important**: As a built-in tool, it follows the ONE built-in tool per agent rule. The data_agent should ONLY have the BigQuery Toolset, no other tools.

**Reference Documentation**: Check Google ADK documentation for exact import path and configuration options for BigQueryToolset.

---

## Next Phase Preview

**Phase 4: Frontend UI Updates** will:
- Implement 3-pane layout with reports panel
- Create ReportsPanel component
- Create ReportsContext for state management
- Create server actions for report CRUD operations
- Update sidebar with new navigation

---

## Prompt for Next Session

Copy and paste this to start Phase 3:

```
I'm implementing the Web Traffic Anomaly Assistant project.

Phase 2 (Database Schema) is COMPLETE.

Now implement Phase 3: ADK Agent Transformation.

Context:
- Handoff document: ai_docs/handoff_docs/phase_3_adk_agent_transformation.md
- Project overview: ai_docs/handoff_docs/00_project_overview.md
- Plan file: C:\Users\sures\.claude\plans\adaptive-kindling-ripple.md
- Dev templates: ai_docs/dev_templates/

Key Requirements:
1. Use Google's BigQuery Toolset (ADK built-in) for data_agent
2. Create NEW report_agent (don't adapt old report_composer)
3. Clean up ALL old competitor analysis code first
4. Follow ADK best practices from agent_orchestrator.md
5. persistence_agent should call Next.js API (Option A architecture) - see handoff doc

Tasks:
1. Clean up old competitor analysis sub_agents (DELETE all)
2. Create traffic_anomaly_orchestrator (root agent)
3. Create data_agent with BigQuery Toolset
4. Create report_agent (NEW)
5. Create persistence_agent with function tools (calls Next.js API)
6. Create analysis_pipeline (SequentialAgent)
7. Update configuration and exports
8. Create Reports API routes in Next.js (POST/GET/DELETE)
9. Test agent system loads correctly

IMPORTANT: Read the "UI-ADK Integration Architecture" and "Persistence Agent → Database Architecture Decision" sections in the handoff doc before starting.

Use the adk_task_template.md and agent_orchestrator.md for implementation tasks.
Ask questions before implementing if anything is unclear.
```
