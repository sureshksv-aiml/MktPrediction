# Project Overview
This is a Google Agent Development Kit (ADK) application featuring:
- Next.js 15 web application for chat interface with 3-pane layout
- Google ADK-powered market signal intelligence agent system
- BigQuery integration for GDELT news sentiment analysis
- Real-time streaming chat with agent responses
- Multi-agent architecture with specialized sub-agents (Market Data, News Signal, Speech)
- Report persistence and historical analysis

# Technology Stack
## Frontend (apps/web)
- Framework: Next.js 15 with App Router
- Language: TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Database: Supabase + Drizzle ORM
- Authentication: Supabase Auth
- Chat Interface: Real-time streaming with agent progress tracking
- Layout: 3-pane design (Sidebar + Chat + Reports)

## Backend (apps/market-signal-agent)
- Framework: Google Agent Development Kit (ADK)
- Language: Python 3.10+ with uv package management
- Agent Types: LlmAgent, SequentialAgent, ParallelAgent, LoopAgent
- Models: Gemini 2.0 Flash for LLM reasoning
- Tools: BigQuery tools (GDELT), Google Search, function tools
- Data Source: GDELT news sentiment via BigQuery
- Deployment: Google Cloud Agent Engine

# Development Commands
```bash
# Root-level commands (recommended)
npm run install      # Install dependencies for both apps
npm run dev          # Start both frontend and API development servers
npm run dev:frontend # Start frontend development server only
npm run dev:api      # Start API development server only
npm run adk:web      # Start ADK web interface

# Per-app commands (if needed)
cd apps/web
npm run dev          # Start development server
npm run build        # Build for production
npm run type-check   # Type checking

# ADK agent system
cd apps/market-signal-agent
uv run adk web       # Start ADK web interface
uv run python -m market_signal_agent  # Alternative execution
```

# Code Style & Conventions
## Frontend (Next.js/TypeScript)
- Use TypeScript strict mode with complete type annotations
- Prefer functional components with hooks
- Use server actions for data mutations
- Follow shadcn/ui component patterns
- Always run `npm run typecheck` after changes

## Backend (ADK/Python)
- Use type hints and Pydantic models
- Follow ADK patterns: LlmAgent, SequentialAgent, ParallelAgent, LoopAgent
- Session state communication via `output_key` and `{placeholder}` patterns
- Built-in tools: one per agent maximum (google_search, code_execution)
- Function tools: multiple allowed per agent
- Always export agents with `root_agent = my_agent` pattern

# Project Structure
- `apps/web/` - Next.js frontend with real-time chat interface
- `apps/market-signal-agent/` - ADK agent system with multi-agent workflow
  - `agent.py` - Root agent (orchestrator)
  - `sub_agents/` - Specialized agents (market_data_agent, news_signal_agent, news_search_agent)
  - `tools/` - BigQuery tools, function tools
  - `utils/` - Ticker keywords mapping, helpers
- `ai_docs/` - AI-generated documentation and task tracking
- `ai_docs/templates/` - Task templates (task_template.md, python_task_template.md, adk_task_template.md)

# ADK Agent Architecture
```
Root Agent (Market Signal Orchestrator)
├── Plans tasks, coordinates agents, handles retries
│
├── Market Data Agent (BigQuery tools)
│   └── Queries stock price data, calculates z-scores for anomalies
│
├── News Signal Agent (BigQuery GDELT)
│   └── Analyzes news sentiment from GDELT Global Knowledge Graph
│
├── News Search Agent (Google Search - optional)
│   └── Real-time news search with sentiment analysis (~$35/1000 req)
│
└── Synthesis Agent (Phase 5)
    └── Combines signals with weighted scoring profiles
```

# Signal Types & Data Sources
- **Market Signals**: Stock/crypto price anomalies (BigQuery z-score analysis)
- **News Signals**: GDELT sentiment analysis (free BigQuery dataset)
- **Speech Signals**: Earnings call transcripts (Phase 4)

# Signal Profiles (User Preferences)
- **Quant**: 60% market, 30% news, 10% speech
- **Fundamental**: 30% market, 20% news, 50% speech
- **News**: 20% market, 50% news, 30% speech
- **Balanced**: 33% each

# ADK-Specific Patterns
- Root agent acts as orchestrator - plans and delegates to specialized agents
- Session state flows through agents via `output_key` -> `{placeholder}` pattern
- Agent hierarchy: Root -> specialized sub-agents
- News agent selection: `USE_GOOGLE_SEARCH_FOR_NEWS` env flag
- Universal design principles - avoid domain-specific hardcoding

# Important Notes
- Agent responses stream through SSE to frontend
- Session state management critical for agent-to-agent communication
- Follow workflow documents for session state key naming
- Use Google Cloud authentication for Vertex AI/Gemini models
- All agents must export as `root_agent` for ADK system discovery
- Reports are persisted to Supabase PostgreSQL for historical analysis

# Coding Standards & Best Practices

## TypeScript/Next.js Rules
- **Type Safety**: Never use `any` type - use specific types, `Union` types, or `TypedDict`
- **Next.js 15**: `params` and `searchParams` are Promises - always `await` them before use
- **Server/Client Separation**: Never mix server-only imports (`next/headers`, `@/lib/supabase/server`) with client-safe utilities
- **shadcn/ui**: Always prefer shadcn components over custom UI - check existing `@/components/ui/` first
- **Client Components**: Use `'use client'` directive when needed, but avoid async client components
- **Return Types**: Explicit return types required for all functions
- **Drizzle ORM**: Use type-safe operators (`eq`, `inArray`, `and`, `or`) instead of raw SQL

## Python/ADK Rules
- **Type Annotations**: Complete type annotations required for all variables, functions, and parameters
- **No `Any` Type**: Use specific types from libraries (e.g., `from google.genai.types import File`)
- **Package Management**: Always use `uv` commands, never `pip install` directly
- **Google AI**: Primary: `google-genai>=1.24.0`, Fallback: `vertexai>=1.38.0` (embeddings only)
- **Dependencies**: Add to `pyproject.toml` then run `uv sync`, use dependency groups (`dev`, `test`, `lint`)
- **Modern Syntax**: Use Python 3.10+ syntax (`dict[str, int]`, `list[str]`, `str | None`)
- **Exception Chaining**: Use `raise ... from e` for proper exception chaining
- **Function Returns**: Always provide return type annotations, including `-> None`

## Database & Infrastructure
- **Drizzle Migrations**: Create down migrations before running `npm run db:migrate`
- **Environment**: Use `@/lib/config` over `os.getenv()` for configuration
- **Authentication**: Use Google Cloud SDK authentication patterns
- **File Management**: Always clean up uploaded files with `client.files.delete()`

## Code Quality Standards
- **No ESLint Disables**: Fix issues instead of disabling rules
- **No Type Ignores**: Address type issues properly instead of ignoring
- **Early Returns**: Use early returns to reduce nesting
- **Async/Await**: Use async/await patterns over Promise chains
- **Commenting**: Minimal comments - code should be self-documenting
- **Line Length**: Python 88 chars, TypeScript follow project standards
- **Clean Imports**: Remove unused imports, use proper import grouping
