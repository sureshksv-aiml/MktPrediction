# Web Traffic Anomaly Assistant - Project Overview

**Project Type:** Google ADK Multi-Agent Platform
**Created:** December 10, 2024
**Base Template:** ADK Agent Simple (Competitor Analysis)

---

## Executive Summary

We are transforming the existing ADK Agent Simple template (competitor analysis) into a **Website Traffic Anomaly Assistant** that uses BigQuery ML for anomaly detection and provides intelligent reports through natural language interaction.

---

## Visual Architecture

### UI Layout (3-Pane Design)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HOME PAGE                                       │
├─────────────┬────────────────────────────────────┬──────────────────────────┤
│   SIDEBAR   │        CHAT PANE                   │      REPORTS PANE        │
│             │                                    │                          │
│  App Name   │  "Web Traffic Report Analytics     │  "Web Traffic Reports"   │
│             │   Chat Assistant"                  │                          │
│  Reports    │                                    │  ---Date1(MM/DD/YYYY)--- │
│   └─ Web    │  ┌────────────────────────────┐   │  | Name   | Summary     │
│      Traffic│  │                            │   │  | Report1| Brief desc  │
│             │  │      Chat Messages         │   │  | Report2| Brief desc  │
│  Topic      │  │                            │   │                          │
│   └─ Web    │  │                            │   │  ---Date2(MM/DD/YYYY)--- │
│      Traffic│  └────────────────────────────┘   │  | Name   | Summary     │
│             │                                    │  | Report3| Brief desc  │
│  User ID    │  ┌────────────────────────────┐   │                          │
│             │  │ Type the message    [Enter]│   │                          │
│  [Logout]   │  └────────────────────────────┘   │                          │
└─────────────┴────────────────────────────────────┴──────────────────────────┘
```

### Agent Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│              Root Agent (Report Analytics Orchestrator)          │
│              Plans tasks, coordinates agents, handles retries    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌─────────────────┐    ┌───────────────────┐
│  Data Agent   │    │ Report Generator│    │ Persistence Agent │
│               │    │                 │    │                   │
│ - BigQuery    │    │ - Synthesis     │    │ - Save reports    │
│   tools       │    │ - Root-cause    │    │ - Store chat      │
│ - Builds SQL  │    │   narratives    │    │   summaries       │
│ - Runs ML     │    │ - Executive     │    │ - Map to user     │
│   detection   │    │   summary       │    │                   │
└───────────────┘    └─────────────────┘    └───────────────────┘
```

### Deployment Architecture
```
Phase 7: All Local          Phase 8: Hybrid            Phase 9: Full Cloud
────────────────────        ─────────────────          ──────────────────

┌──────────────────┐        ┌──────────────────┐       ┌──────────────────┐
│   Next.js        │        │   Next.js        │       │   Next.js        │
│   localhost:3000 │        │   localhost:3000 │       │   Cloud Run      │
└────────┬─────────┘        └────────┬─────────┘       └────────┬─────────┘
         │                           │                          │
         ▼                           ▼                          ▼
┌──────────────────┐        ┌──────────────────┐       ┌──────────────────┐
│   ADK Agent      │        │   ADK Agent      │       │   ADK Agent      │
│   localhost:8000 │        │   Agent Engine   │       │   Agent Engine   │
└────────┬─────────┘        │   (GCP)          │       │   (GCP)          │
         │                  └────────┬─────────┘       └────────┬─────────┘
         ▼                           ▼                          ▼
┌──────────────────┐        ┌──────────────────┐       ┌──────────────────┐
│   BigQuery       │        │   BigQuery       │       │   BigQuery       │
│   (via gcloud)   │        │   (GCP)          │       │   (GCP)          │
└──────────────────┘        └──────────────────┘       └──────────────────┘
         │                           │                          │
         ▼                           ▼                          ▼
┌──────────────────┐        ┌──────────────────┐       ┌──────────────────┐
│   Supabase       │        │   Supabase       │       │   Supabase       │
│   (Cloud)        │        │   (Cloud)        │       │   (Cloud)        │
└──────────────────┘        └──────────────────┘       └──────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15, TypeScript | Web application |
| **UI Components** | Tailwind CSS, shadcn/ui | Styling |
| **Database** | Supabase PostgreSQL | Data persistence |
| **ORM** | Drizzle ORM | Type-safe database access |
| **Auth** | Supabase Auth | User authentication |
| **Agent Framework** | Google ADK | Multi-agent orchestration |
| **LLM** | Gemini 2.5 Flash/Pro | AI reasoning |
| **Data Analysis** | BigQuery ML | Anomaly detection |
| **Deployment** | Cloud Run + Agent Engine | Production hosting |

---

## BigQuery Data Schema

The system analyzes website traffic with these metrics:

| Column | Type | Description |
|--------|------|-------------|
| Page Views | INTEGER | Number of page views |
| Session Duration | FLOAT | Duration of session |
| Bounce Rate | FLOAT | Bounce rate percentage |
| Traffic Source | STRING | Source of traffic |
| Time on Page | FLOAT | Time spent on pages |
| Previous Visits | INTEGER | Number of return visitors |
| Conversion Rate | FLOAT | Conversion rate percentage |

**Note:** User has an existing BigQuery ML anomaly detection model - we just pass data to it.

---

## Implementation Phases

### Development Phases (1-7)

| Phase | Name | Description | Est. Time |
|-------|------|-------------|-----------|
| 1 | Documentation & Renaming | Update docs, rename folders | ~30 min |
| 2 | Database Schema | Create reports table | ~30 min |
| 3 | ADK Agents | Transform agents for traffic analysis | ~3-4 hrs |
| 4 | Frontend UI | Implement 3-pane layout | ~2-3 hrs |
| 5 | BigQuery Integration | Configure BigQuery connectivity | ~1-2 hrs |
| 6 | Testing | End-to-end verification | ~1-2 hrs |
| 7 | Local Complete | Verify everything works locally | ~1 hr |

### Deployment Phases (8-9)

| Phase | Name | Description | Est. Time |
|-------|------|-------------|-----------|
| 8 | ADK to Cloud | Deploy agent to Agent Engine | ~2-3 hrs |
| 9 | Full Cloud | Deploy Next.js to Cloud Run | ~2-3 hrs |

**Total Estimated Time:** ~13-19 hours

---

## Phase Status Tracking

| Phase | Status | Handoff Doc |
|-------|--------|-------------|
| Phase 1 | ✅ COMPLETE | N/A (documentation & renaming) |
| Phase 2 | ✅ COMPLETE | `phase_2_database_schema.md` |
| Phase 3 | ✅ COMPLETE | `phase_3_adk_agent_transformation.md` |
| Phase 4 | ✅ COMPLETE | `phase_4_frontend_ui.md` |
| Phase 5 | ⏳ READY | `phase_5_bigquery.md` (to create) |
| Phase 6 | ⬜ PENDING | `phase_6_testing.md` (to create) |
| Phase 7 | ⬜ PENDING | `phase_7_local_verification.md` (to create) |
| Phase 8 | ⬜ PENDING | `phase_8_agent_deployment.md` (to create) |
| Phase 9 | ⬜ PENDING | `phase_9_full_deployment.md` (to create) |

---

## Key File Locations

### Documentation
```
ai_docs/
├── prep/
│   ├── app_name.md          # App naming (updated)
│   ├── master_idea.md       # Project vision (updated)
│   └── system_architecture.md
├── dev_templates/           # Task templates to use
│   ├── drizzle_down_migration.md
│   ├── task_template.md
│   ├── adk_task_template.md
│   └── python_task_template.md
└── handoff_docs/            # Phase handoff documents
    ├── 00_project_overview.md  # This file
    └── phase_2_database_schema.md
```

### Frontend (Next.js)
```
apps/web/
├── app/
│   ├── (protected)/
│   │   ├── chat/           # Chat interface
│   │   ├── history/        # Session history
│   │   └── layout.tsx      # Protected layout
│   ├── actions/            # Server actions
│   └── api/                # API routes
├── components/
│   ├── chat/               # Chat components
│   ├── layout/             # Layout components (sidebar)
│   └── ui/                 # shadcn components
├── lib/
│   ├── drizzle/
│   │   └── schema/         # Database schemas
│   ├── adk/                # ADK integration
│   └── auth.ts             # Authentication
└── contexts/               # React contexts
```

### Backend (ADK Agent)
```
apps/traffic-anomaly-agent/
├── traffic_anomaly_agent/
│   ├── __init__.py
│   ├── agent.py            # Root agent
│   ├── config.py           # Configuration
│   ├── models.py           # Pydantic models
│   ├── sub_agents/         # Specialized agents
│   ├── tools/              # Agent tools
│   └── utils/              # Utilities
├── scripts/
│   └── run_adk_api.py      # API runner
├── pyproject.toml          # Python dependencies
└── .env.local.example      # Environment template
```

### Configuration
```
Root/
├── package.json            # Monorepo scripts
├── CLAUDE.md               # AI assistant instructions
└── C:\Users\sures\.claude\plans\adaptive-kindling-ripple.md  # Full plan
```

---

## Key Commands

### Development
```bash
npm run dev           # Start both frontend and API
npm run dev:frontend  # Start frontend only
npm run dev:api       # Start API only
```

### Database
```bash
npm run db:generate   # Generate migrations
npm run db:migrate    # Apply migrations
npm run db:status     # Check migration status
npm run db:rollback   # Rollback last migration
```

### Type Checking
```bash
npm run type-check    # Frontend type check
npm run lint          # Frontend linting
```

---

## User Requirements Summary

1. **Authentication:** Keep Supabase Auth (no Firebase)
2. **Database:** Keep Supabase PostgreSQL (no Firestore/Cloud SQL)
3. **BigQuery:** User has sample data and existing ML model
4. **UI Layout:** 3-pane (Sidebar + Chat + Reports)
5. **Topic:** "Web Traffic" only for MVP (extensible later)
6. **Deployment:** Incremental (Local → Hybrid → Full Cloud)

---

## Guidelines for Each Session

1. **Read the handoff document** for that phase first
2. **Use dev templates** from `ai_docs/dev_templates/`
3. **Ask questions upfront** before implementing
4. **Create handoff document** at end of each phase for next session
5. **Reference the plan file** for complete context

---

## Quick Reference - Handoff Document Template

When creating a new phase handoff document, include:

1. **Project Overview** (brief)
2. **Previous Phase Summary** (what was completed)
3. **Current Phase Tasks** (detailed step-by-step)
4. **Code Samples** (ready to copy)
5. **File Locations** (what to create/modify)
6. **Verification Checklist** (how to confirm completion)
7. **Next Phase Preview** (what comes next)
8. **Prompt for Next Session** (copy-paste ready)
