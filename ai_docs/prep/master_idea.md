## Master Idea Document

### End Goal
My app helps **data analysts, business owners, and operations teams** achieve **intelligent website traffic anomaly detection and analysis** using **Google's Agent Development Kit (ADK) with BigQuery ML integration for automated anomaly detection and reporting**.

### Specific Problem
Organizations struggle because **existing analytics tools provide raw metrics without intelligent interpretation, requiring manual analysis to identify anomalies and their root causes**, leading to **delayed response to traffic issues, missed opportunities, and uninformed business decisions**.

### All User Types
#### Primary Users: Data Analysts & Business Owners
- **Who:** Data analysts, business owners, marketing managers, and operations teams who need to understand website traffic patterns and anomalies.
- **Frustrations:**
  - Raw metrics without intelligent interpretation
  - Manual analysis required to identify anomalies
  - Difficulty understanding root causes of traffic changes
  - Time-consuming report generation
  - Lack of historical context for pattern recognition
- **Urgent Goals:**
  - Quickly identify traffic anomalies across key metrics
  - Understand root causes of unusual traffic patterns
  - Generate executive summaries for stakeholders
  - Track anomaly patterns over time
  - Make data-driven decisions based on traffic insights

### Business Model & Revenue Strategy
- **Model Type:** Internal/Enterprise Tool (Hackathon Project)
- **Value Proposition:**
  - Automated anomaly detection using existing BigQuery ML models
  - Natural language interface for traffic analysis queries
  - Persistent reports for historical analysis
  - Executive summaries for quick decision-making

### Core Functionalities (MVP)
- **Data Analysts & Business Owners**
  - **Natural Language Queries:** Ask questions about traffic anomalies in plain English
  - **BigQuery ML Integration:** Leverage existing anomaly detection models
  - **Intelligent Report Generation:** Root-cause narratives and executive summaries
  - **Report Persistence:** Save and retrieve reports for historical analysis
  - **Multi-Agent Pipeline:** Specialized agents for data, reporting, and persistence

### Key User Stories

#### Traffic Analysis Workflow
1. **Natural Language Query**
   *As a data analyst,*
   *I want* to ask questions about traffic anomalies in natural language,
   *So that* I can quickly identify issues without writing complex SQL queries.

2. **Anomaly Detection**
   *As a business owner,*
   *I want* the system to automatically detect anomalies in my traffic data,
   *So that* I can respond quickly to unusual patterns.

3. **Root-Cause Analysis**
   *As a marketing manager,*
   *I want* to understand the root causes of traffic anomalies,
   *So that* I can take corrective action or capitalize on positive trends.

#### Report Generation Pipeline
4. **Executive Summary**
   *As a stakeholder,*
   *I want* to receive concise executive summaries of traffic analysis,
   *So that* I can make informed decisions without diving into technical details.

5. **Report Persistence**
   *As an analyst,*
   *I want* to save reports and access them later,
   *So that* I can track trends and compare analyses over time.

6. **Historical Analysis**
   *As a data analyst,*
   *I want* to view past reports grouped by date,
   *So that* I can identify patterns and trends in traffic behavior.

### Multi-Agent Architecture
The platform employs specialized agents for traffic anomaly analysis:

- **Root Agent (Report Analytics Orchestrator):** Plans tasks, coordinates agents, handles retries
- **Data Agent (BigQuery Tools):** Builds SQL queries, runs BigQuery ML anomaly detection, returns structured results
- **Report Generation Agent:** Synthesizes anomaly data into root-cause narratives and executive summaries
- **Persistence Agent:** Stores report payloads and chat summaries mapped to authenticated users

### Traffic Data Schema
The system analyzes the following BigQuery traffic metrics:
- **Page Views:** Number of page views
- **Session Duration:** Duration of user sessions
- **Bounce Rate:** Percentage of single-page sessions
- **Traffic Source:** Source of incoming traffic
- **Time on Page:** Average time spent on pages
- **Previous Visits:** Number of return visitors
- **Conversion Rate:** Conversion rate percentage

### Platform Vision
Unlike generic analytics dashboards or manual SQL analysis, the Web Traffic Anomaly Assistant provides:
- **Natural language interface** for traffic analysis queries
- **BigQuery ML integration** for automated anomaly detection
- **Multi-agent architecture** for intelligent data processing
- **Root-cause narratives** beyond basic metric reporting
- **Persistent reports** for historical analysis
- **Executive summaries** for stakeholder communication

The goal is to transform raw BigQuery traffic data into actionable insights through intelligent, conversational analysis.

### Technical Implementation
- **Frontend:** Next.js 15 with Supabase authentication, 3-pane layout (Sidebar + Chat + Reports)
- **Backend:** Python with Google ADK multi-agent architecture
- **Data Source:** BigQuery with existing ML anomaly detection models
- **Reports:** Markdown-based reports with persistent storage
- **Database:** Supabase PostgreSQL for user management and report storage
- **Authentication:** Supabase Auth with user-scoped report access
- **Deployment:** Google Cloud Run (Next.js) + Agent Engine (ADK agents)
