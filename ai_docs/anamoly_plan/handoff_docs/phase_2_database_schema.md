# Phase 2: Database Schema - Handoff Document

**Created:** December 10, 2024
**Previous Phase:** Phase 1 (Documentation & Renaming) - COMPLETED
**Current Phase:** Phase 2 (Database Schema)
**Status:** Ready to Start

---

## Project Overview

### What We're Building
**Web Traffic Anomaly Assistant** - A multi-agent platform that uses BigQuery ML to detect anomalies in website traffic data and generates intelligent reports through natural language interaction.

### Architecture Summary
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
│   ├── Data Agent (BigQuery tools)                                       │
│   │   └── Builds SQL, runs BigQuery ML, returns structured results     │
│   │                                                                      │
│   ├── Report Generation Agent                                           │
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

### Tech Stack
| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python 3.10+, Google ADK, BigQuery ML |
| Database | Supabase PostgreSQL + Drizzle ORM |
| Auth | Supabase Auth |
| Deployment | Google Cloud Run + Agent Engine |

---

## Phase 1 Completion Summary

### What Was Done
| Task | File/Folder | Status |
|------|-------------|--------|
| Updated app name documentation | `ai_docs/prep/app_name.md` | ✅ Complete |
| Updated project vision | `ai_docs/prep/master_idea.md` | ✅ Complete |
| Renamed agent folder | `apps/competitor-analysis-agent/` → `apps/traffic-anomaly-agent/` | ✅ Complete |
| Renamed Python package | `competitor_analysis_agent/` → `traffic_anomaly_agent/` | ✅ Complete |
| Updated package.json scripts | All references updated | ✅ Complete |
| Updated pyproject.toml | Name, description, BigQuery deps | ✅ Complete |
| Updated CLAUDE.md | New architecture documentation | ✅ Complete |

### Current Folder Structure
```
gcp-bq-reports/
├── apps/
│   ├── traffic-anomaly-agent/          # Renamed from competitor-analysis-agent
│   │   ├── traffic_anomaly_agent/      # Renamed from competitor_analysis_agent
│   │   │   ├── __init__.py
│   │   │   ├── agent.py               # Root agent (needs transformation in Phase 3)
│   │   │   ├── config.py
│   │   │   ├── models.py
│   │   │   ├── sub_agents/            # Will be modified in Phase 3
│   │   │   ├── tools/                 # Will add BigQuery tools in Phase 5
│   │   │   └── utils/
│   │   ├── scripts/
│   │   ├── pyproject.toml             # Updated with BigQuery deps
│   │   └── .env.local.example
│   │
│   └── web/                           # Next.js frontend
│       ├── app/
│       ├── components/
│       ├── lib/
│       │   └── drizzle/
│       │       └── schema/
│       │           ├── index.ts       # Needs to export reports
│       │           ├── users.ts
│       │           └── session-names.ts
│       └── ...
│
├── ai_docs/
│   ├── prep/                          # Project documentation (updated)
│   ├── dev_templates/                 # Task templates to use
│   └── handoff_docs/                  # Handoff documents (this folder)
│
├── package.json                       # Updated with new agent references
├── CLAUDE.md                          # Updated project documentation
└── ...
```

---

## Phase 2: Database Schema - Implementation Guide

### Goal
Create the `reports` table in Supabase PostgreSQL to persist anomaly reports for authenticated users.

### Tasks to Complete

#### Task 1: Create Reports Schema File
**File to create:** `apps/web/lib/drizzle/schema/reports.ts`

**Schema Definition:**
```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { InferSelectModel } from "drizzle-orm";
import { users } from "./users";

// Reports table - stores anomaly analysis reports
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    session_id: text("session_id"),           // ADK session ID (optional)
    title: text("title").notNull(),
    content: text("content").notNull(),        // Markdown report content
    summary: text("summary"),                  // Brief summary for list view
    report_type: text("report_type").default("web_traffic"),
    anomaly_data: jsonb("anomaly_data"),       // Structured anomaly metrics

    // Metadata
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    // Index for efficient report lookups by user
    index("reports_user_id_idx").on(t.user_id),
    // Index for session-based lookups
    index("reports_session_id_idx").on(t.session_id),
    // Index for date-based queries (for grouping)
    index("reports_created_at_idx").on(t.created_at),
  ]
);

// Zod validation schemas
export const insertReportSchema = createInsertSchema(reports);
export const selectReportSchema = createSelectSchema(reports);

// Update schema - useful for PATCH requests
export const updateReportSchema = insertReportSchema.partial();

// TypeScript types
export type Report = InferSelectModel<typeof reports>;
export type InsertReport = typeof reports.$inferInsert;
export type UpdateReport = Partial<Report>;

// Report creation type (for API requests)
export type CreateReportData = {
  title: string;
  content: string;
  summary?: string;
  session_id?: string;
  report_type?: string;
  anomaly_data?: Record<string, unknown>;
};
```

#### Task 2: Update Schema Index
**File to modify:** `apps/web/lib/drizzle/schema/index.ts`

**Add export:**
```typescript
// Schema exports - all database schemas are exported from here
// This file is needed for the database connection setup

export * from "./users";
export * from "./session-names";
export * from "./reports";  // ADD THIS LINE
```

#### Task 3: Generate Migration
**Commands to run (from project root):**
```bash
# Navigate to web app directory
cd apps/web

# Generate the migration
npm run db:generate

# Check what was generated
ls -la drizzle/migrations/
```

#### Task 4: Create Down Migration
**Use template:** `ai_docs/dev_templates/drizzle_down_migration.md`

The down migration should:
```sql
-- Down migration for reports table
DROP INDEX IF EXISTS "reports_created_at_idx";
DROP INDEX IF EXISTS "reports_session_id_idx";
DROP INDEX IF EXISTS "reports_user_id_idx";
DROP TABLE IF EXISTS "reports";
```

#### Task 5: Apply Migration
**Commands to run (from project root):**
```bash
cd apps/web
npm run db:migrate
npm run db:status
```

#### Task 6: Verify in Supabase
- Check Supabase Dashboard → Table Editor
- Confirm `reports` table exists with correct columns
- Verify indexes are created

---

## Important References

### Plan File
**Location:** `C:\Users\sures\.claude\plans\adaptive-kindling-ripple.md`

This file contains the complete implementation plan for all 9 phases.

### Dev Templates to Use
**Location:** `ai_docs/dev_templates/`

| Template | Use For |
|----------|---------|
| `drizzle_down_migration.md` | Creating rollback migrations |
| `task_template.md` | General task structure |

### Existing Schema Patterns
**Reference files:**
- `apps/web/lib/drizzle/schema/users.ts` - User table pattern
- `apps/web/lib/drizzle/schema/session-names.ts` - Session names pattern (similar structure)

### Database Commands
```bash
# From project root
npm run db:generate       # Generate migrations
npm run db:migrate        # Apply migrations
npm run db:status         # Check migration status
npm run db:rollback       # Rollback last migration

# Or from apps/web directory
cd apps/web
npm run db:generate
npm run db:migrate
```

---

## BigQuery Data Schema (For Context)

The reports will store anomaly data from these traffic metrics:

| Column | Type | Description |
|--------|------|-------------|
| Page Views | INTEGER | Number of page views |
| Session Duration | FLOAT | Duration of session |
| Bounce Rate | FLOAT | Bounce rate percentage |
| Traffic Source | STRING | Source of traffic |
| Time on Page | FLOAT | Time spent on pages |
| Previous Visits | INTEGER | Number of return visitors |
| Conversion Rate | FLOAT | Conversion rate percentage |

The `anomaly_data` JSONB column will store structured results from BigQuery ML anomaly detection.

---

## Key Guidelines

### From User
1. **Start each phase in a new Claude Code session** - Prevents context overflow
2. **Use dev templates** - Located in `ai_docs/dev_templates/`
3. **Ask questions upfront** - Clarify before implementing

### Coding Standards (from CLAUDE.md)
- **Drizzle ORM**: Use type-safe operators (`eq`, `inArray`, `and`, `or`)
- **Drizzle Migrations**: Always create down migrations before applying
- **TypeScript**: Explicit return types, no `any` type
- **Database**: Run commands from `apps/web/` directory

---

## Verification Checklist for Phase 2

- [ ] Created `apps/web/lib/drizzle/schema/reports.ts`
- [ ] Updated `apps/web/lib/drizzle/schema/index.ts` to export reports
- [ ] Generated migration with `npm run db:generate`
- [ ] Created down migration file
- [ ] Applied migration with `npm run db:migrate`
- [ ] Verified `npm run db:status` shows success
- [ ] Confirmed table exists in Supabase Dashboard
- [ ] Ran type check: `npm run type-check:frontend`

---

## Next Phase Preview

**Phase 3: ADK Agent Transformation** will:
- Transform root agent to `traffic_anomaly_orchestrator`
- Create new `data_agent` for BigQuery operations
- Create `persistence_agent` for report storage
- Adapt `report_composer` for anomaly reports
- Remove unused sub-agents (section_planner, section_researcher, etc.)

---

## Prompt for Next Session

Copy and paste this to start Phase 2:

```
I'm implementing the Web Traffic Anomaly Assistant project.

Phase 1 (Documentation & Renaming) is COMPLETE.

Now implement Phase 2: Database Schema (Reports Table).

Context:
- Handoff document: ai_docs/handoff_docs/phase_2_database_schema.md
- Plan file: C:\Users\sures\.claude\plans\adaptive-kindling-ripple.md
- Dev templates: ai_docs/dev_templates/

Tasks:
1. Create apps/web/lib/drizzle/schema/reports.ts
2. Update apps/web/lib/drizzle/schema/index.ts
3. Generate and apply migration
4. Create down migration for rollback safety
5. Verify in Supabase

Use the drizzle_down_migration.md template for rollback migrations.
Ask questions before implementing if anything is unclear.
```
