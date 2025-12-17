# Phase 8: Deploy ADK Agent to Google Cloud Agent Engine - Handoff Document

**Created:** December 11, 2024
**Previous Phase:** Phase 7 (Local Complete) - COMPLETED
**Current Phase:** Phase 8 (ADK to Cloud Deployment)
**Status:** READY TO DEPLOY
**Focus:** ADK Agent Deployment to Google Cloud (NOT Vercel)

---

## ⚠️ Critical Configuration Requirements

These settings are **REQUIRED** for successful deployment and operation. Missing any of these will cause failures.

### 1. DATABASE_URL: Use Session Pooler (Port 5432)

**CRITICAL:** Supabase Transaction pooler (port 6543) has SSL compatibility issues with Google Cloud. You **MUST** use the Session pooler (port 5432).

```bash
# ❌ WRONG - Transaction pooler causes SSL errors in GCP
DATABASE_URL="postgresql://user:pass@host:6543/postgres"

# ✅ CORRECT - Session pooler works with GCP
DATABASE_URL="postgresql://user:pass@host:5432/postgres"
```

**Error if wrong:**
```
psycopg2.OperationalError: SSL connection has been closed unexpectedly
```

### 2. Web App Request Handler: class_method Must Be "stream_query"

The Next.js web app must use `class_method: "stream_query"` when calling Agent Engine's streamQuery endpoint.

**File:** `apps/web/lib/adk/request-handler.ts`

```typescript
// ❌ WRONG - Method not found error
class_method: "stream"

// ✅ CORRECT - Agent Engine expects this
class_method: "stream_query"
```

**Error if wrong:**
```
User-specified method `stream` not found.
Available methods are: ['stream_query', 'async_stream_query', 'streaming_agent_run_with_events']
```

### 3. Session Service: class_method Must Be "create_session"

The session creation must use `class_method: "create_session"`.

**File:** `apps/web/lib/adk/session-service.ts`

```typescript
// ✅ CORRECT for session creation
class_method: "create_session"
```

### 4. NEXTJS_API_URL Limitation (Persistence Agent)

**IMPORTANT:** The cloud-deployed agent **cannot** reach `localhost:3000`. The persistence agent will fail to save reports until you deploy the Next.js app to Vercel and update this URL.

```bash
# ❌ Won't work from cloud - localhost doesn't exist in GCP
NEXTJS_API_URL=http://localhost:3000

# ✅ After Vercel deployment (Phase 9)
NEXTJS_API_URL=https://your-app.vercel.app
```

**Workaround:** Report generation works, but saving to database will fail until Phase 9 (Vercel deployment) is complete.

---

## Phase Overview

Deploy the traffic-anomaly-agent to Google Cloud Platform's Vertex AI Agent Engine for production use. This phase focuses **exclusively on ADK agent deployment** - web app deployment (Vercel) is covered in Phase 9.

### What This Phase Accomplishes

- Deploy the ADK agent to Google Cloud Agent Engine
- Create necessary cloud infrastructure (staging bucket, service account, IAM roles)
- Generate authentication credentials (service account key)
- Auto-update `apps/web/.env.prod` with `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`
- Obtain Query URL for web app configuration
- Verify agent is operational in cloud

---

## Pre-Deployment Checklist

### 1. Verify Google Cloud Authentication

```bash
# Check current authentication status
gcloud auth list

# Check application default credentials
gcloud auth application-default print-access-token

# If not authenticated or token expired, run:
gcloud auth application-default login
```

### 2. Verify Project Configuration

```bash
# Check current project
gcloud config get-value project

# Should output: adk-traffic-anomaly
# If wrong, set it:
gcloud config set project adk-traffic-anomaly

# Verify project exists and is accessible
gcloud projects describe adk-traffic-anomaly
```

### 3. Verify Billing is Enabled

```bash
# Check billing status
gcloud beta billing projects describe adk-traffic-anomaly

# If billing not linked, go to:
# https://console.cloud.google.com/billing/linkedaccount?project=adk-traffic-anomaly
```

### 4. Verify Local Environment File Exists

```bash
# Check .env.local exists with required variables
ls -la apps/traffic-anomaly-agent/.env.local

# Verify key variables are set (without showing values)
grep -E "^GOOGLE_CLOUD_PROJECT=" apps/traffic-anomaly-agent/.env.local
grep -E "^GOOGLE_CLOUD_LOCATION=" apps/traffic-anomaly-agent/.env.local
grep -E "^DATABASE_URL=" apps/traffic-anomaly-agent/.env.local
```

### 5. Verify UV Package Manager

```bash
# Check uv is installed
uv --version

# If not installed:
# macOS/Linux: curl -LsSf https://astral.sh/uv/install.sh | sh
# Windows: powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 6. Verify Deployment Script Exists

```bash
# Check deployment script exists
ls -la apps/traffic-anomaly-agent/scripts/agent_engine_app.py
```

---

## Deployment Steps

### Step 1: Create Production Environment File

**Purpose:** Copy the working local environment to production configuration.

```bash
# Ensure we're in project root
pwd

# Copy local environment to production
cp apps/traffic-anomaly-agent/.env.local apps/traffic-anomaly-agent/.env.prod

# Verify the file was created
ls -la apps/traffic-anomaly-agent/.env.prod

# Verify key variables are present
grep -E "^GOOGLE_CLOUD_PROJECT=" apps/traffic-anomaly-agent/.env.prod
```

**Expected Output:**
```
-rw-r--r--  1 user  staff  XXX Dec 11 XX:XX apps/traffic-anomaly-agent/.env.prod
GOOGLE_CLOUD_PROJECT=adk-traffic-anomaly
```

### Step 2: Set Google Cloud Project from Environment

**Purpose:** Ensure gcloud CLI uses the correct project from the environment file.

```bash
# Get project ID from environment file
uv run python scripts/read_env.py apps/traffic-anomaly-agent/.env.prod GOOGLE_CLOUD_PROJECT

# Set the project in gcloud CLI
gcloud config set project $(uv run python scripts/read_env.py apps/traffic-anomaly-agent/.env.prod GOOGLE_CLOUD_PROJECT --value-only)

# Verify the correct project is selected
gcloud config get-value project
```

### Step 3: Create Web App Production Environment Backup

**Purpose:** Create a backup of web app environment that will be updated during deployment.

```bash
# Create production backup of current web app environment
cp apps/web/.env.local apps/web/.env.prod

# Verify the file was created
ls -la apps/web/.env.prod
```

### Step 4: Deploy to Agent Engine

**Purpose:** Execute the automated deployment script.

```bash
# From project root - this single command does everything
npm run deploy:adk
```

**What this command does automatically:**

| Step | Action | Description |
|------|--------|-------------|
| 1 | Export Dependencies | Creates `requirements.txt` from `pyproject.toml` using `uv export` |
| 2 | Enable APIs | Enables IAM, Resource Manager, Vertex AI, Storage APIs in parallel |
| 3 | Create Staging Bucket | Creates GCS bucket `{project}-agent-staging` for deployment artifacts |
| 4 | Create Service Account | Creates `traffic-agent-sa@{project}.iam.gserviceaccount.com` |
| 5 | Assign IAM Roles | Grants `aiplatform.user` and `iam.serviceAccountTokenCreator` roles |
| 6 | Generate Key | Creates base64-encoded service account key |
| 7 | Update Web App Config | Updates `apps/web/.env.prod` with `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` |
| 8 | Deploy Agent | Deploys to Vertex AI Agent Engine using `vertexai.agent_engines` |
| 9 | Save Metadata | Saves deployment info to `logs/deployment_metadata.json` |

**Expected Console Output:**
```
🚀 Deploying ADK Agent Service to production...
🔌 Enabling required Google Cloud APIs...
   💨 Enabling APIs in parallel...
  ✓ iam.googleapis.com
  ✓ cloudresourcemanager.googleapis.com
  ✓ aiplatform.googleapis.com
  ✓ storage.googleapis.com
✅ All required APIs enabled successfully (4/4)
   ⏳ Waiting for APIs to propagate...
📦 Creating/finding staging bucket...
✅ Staging bucket ready: adk-traffic-anomaly-agent-staging
👤 Creating/finding service account...
✅ Service account ready: traffic-agent-sa@adk-traffic-anomaly.iam.gserviceaccount.com
🔑 Generating service account key...
✅ Service account key generated (base64 encoded)
📝 Updating apps/web/.env.prod with GOOGLE_SERVICE_ACCOUNT_KEY_BASE64...
🚀 Deploying to Agent Engine...
✅ Agent deployed successfully!
📄 Metadata saved to logs/deployment_metadata.json
```

**Deployment Time:** Approximately 5-15 minutes (first deployment takes longer)

### Step 5: Get Query URL from Agent Engine Console

**Purpose:** Retrieve the production Query URL needed for web app configuration.

1. **Navigate to Agent Engine Console:**
   - Open: https://console.cloud.google.com/vertex-ai/agents/agent-engines
   - Ensure project `adk-traffic-anomaly` is selected (top-left dropdown)

2. **Find Your Deployed Agent:**
   - Look for agent named `traffic-anomaly-orchestrator-prod` or similar
   - Status should show as "Active" (green)
   - Click on the agent name to open details

3. **Copy the Query URL:**
   - At the top of the agent details page, find **"Query URL:"**
   - Copy the full URL
   - Format: `https://us-central1-aiplatform.googleapis.com/v1/projects/adk-traffic-anomaly/locations/us-central1/agents/AGENT_ID`

### Step 6: Verify Deployment

```bash
# Check deployment metadata was saved
cat apps/traffic-anomaly-agent/logs/deployment_metadata.json

# Verify service account key was added to web app env
grep "GOOGLE_SERVICE_ACCOUNT_KEY_BASE64" apps/web/.env.prod | head -c 100
# Should show the beginning of a long base64 string
```

### Step 7: Update Web App with Query URL

**For local testing with cloud agent:**

```bash
# Update apps/web/.env.local with the Query URL you copied
# Add or update this line:
ADK_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/adk-traffic-anomaly/locations/us-central1/agents/YOUR_AGENT_ID"
```

### Step 8: Test Cloud Agent Locally

```bash
# Start only the frontend (agent is now in cloud)
npm run dev:frontend

# Open http://localhost:3000
# Go to Chat interface
# Send: "Show me recent traffic anomalies"
# Verify agent responds from cloud
```

---

## Files Involved

| File | Purpose | When Modified |
|------|---------|---------------|
| `apps/traffic-anomaly-agent/.env.local` | Source configuration | Never (read-only source) |
| `apps/traffic-anomaly-agent/.env.prod` | Production configuration | Step 1 (created) |
| `apps/traffic-anomaly-agent/scripts/agent_engine_app.py` | Deployment orchestrator | Never (executes) |
| `apps/web/.env.prod` | Web app production config | Step 4 (auto-updated with key) |
| `apps/web/.env.local` | Web app local config | Step 7 (manual update ADK_URL) |
| `logs/deployment_metadata.json` | Deployment tracking | Step 4 (auto-created) |

---

## Comprehensive Troubleshooting Guide

### Quick Diagnostic Commands

Run these first to understand the current state:

```bash
# 1. Check gcloud authentication
gcloud auth list
gcloud config get-value project

# 2. Check enabled APIs
gcloud services list --enabled --filter="name:iam OR name:aiplatform OR name:storage OR name:cloudresourcemanager"

# 3. Check service accounts
gcloud iam service-accounts list --filter="email~traffic"

# 4. Check Agent Engine status (if deployed)
gcloud ai agents list --project=adk-traffic-anomaly --region=us-central1 2>/dev/null || echo "No agents found or API not enabled"
```

---

### Issue: API Not Enabled Errors

**Symptom:**
```
ERROR: (gcloud.services.enable) PERMISSION_DENIED: ...
ERROR: API [aiplatform.googleapis.com] not enabled on project...
```

**Solution:**
```bash
# Enable all required APIs manually
gcloud services enable iam.googleapis.com --project=adk-traffic-anomaly
gcloud services enable cloudresourcemanager.googleapis.com --project=adk-traffic-anomaly
gcloud services enable aiplatform.googleapis.com --project=adk-traffic-anomaly
gcloud services enable storage.googleapis.com --project=adk-traffic-anomaly

# Verify APIs are enabled
gcloud services list --enabled --filter="name:iam OR name:aiplatform OR name:storage"
```

---

### Issue: Service Account Permission Errors

**Symptom:**
```
Permission denied on resource service account...
googleapiclient.errors.HttpError: 403
```

**Debugging:**
```bash
# Check if service account exists
gcloud iam service-accounts list --filter="email~traffic"

# Check your current user's IAM permissions
gcloud projects get-iam-policy adk-traffic-anomaly \
  --flatten="bindings[].members" \
  --format="table(bindings.role,bindings.members)" \
  --filter="bindings.members:$(gcloud config get-value account)"

# You need these roles:
# - roles/iam.serviceAccountAdmin (to create service accounts)
# - roles/iam.serviceAccountKeyAdmin (to create keys)
# - roles/resourcemanager.projectIamAdmin (to assign IAM roles)
```

**Solution:**
```bash
# Grant yourself the required roles (requires Owner/Admin)
PROJECT_ID="adk-traffic-anomaly"
USER_EMAIL=$(gcloud config get-value account)

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$USER_EMAIL" \
  --role="roles/iam.serviceAccountAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$USER_EMAIL" \
  --role="roles/iam.serviceAccountKeyAdmin"
```

---

### Issue: Deployment Script Python Errors

**Symptom:**
```
ModuleNotFoundError: No module named 'vertexai'
uv: command not found
```

**Solution:**
```bash
# Ensure uv is installed
uv --version

# If not installed:
pip install uv

# Sync dependencies
cd apps/traffic-anomaly-agent
uv sync

# Try running deployment directly
uv run python scripts/agent_engine_app.py --env=prod
```

---

### Issue: Billing Not Enabled

**Symptom:**
```
BILLING_DISABLED: This API method requires billing to be enabled
```

**Solution:**
```bash
# Check billing status
gcloud beta billing projects describe adk-traffic-anomaly

# If not linked, go to GCP Console:
# https://console.cloud.google.com/billing/linkedaccount?project=adk-traffic-anomaly
```

---

### Issue: Staging Bucket Errors

**Symptom:**
```
google.cloud.exceptions.Conflict: 409 ... bucket already exists
google.cloud.exceptions.NotFound: 404 ... bucket not found
```

**Debugging:**
```bash
# List buckets in project
gcloud storage buckets list --project=adk-traffic-anomaly

# Check specific bucket
gcloud storage buckets describe gs://adk-traffic-anomaly-agent-staging 2>/dev/null || echo "Bucket not found"
```

**Solution:**
```bash
# Create bucket manually if needed
gcloud storage buckets create gs://adk-traffic-anomaly-agent-staging \
  --project=adk-traffic-anomaly \
  --location=us-central1

# Grant service account access
gcloud storage buckets add-iam-policy-binding gs://adk-traffic-anomaly-agent-staging \
  --member=serviceAccount:traffic-agent-sa@adk-traffic-anomaly.iam.gserviceaccount.com \
  --role=roles/storage.objectAdmin
```

---

### Issue: Agent Engine Deployment Fails

**Symptom:**
```
vertexai.agent_engines.create failed
Agent deployment timeout
```

**Debugging:**
```bash
# Check Agent Engine logs
gcloud logging read "resource.type=aiplatform.googleapis.com/Agent AND resource.labels.project_id=adk-traffic-anomaly" --limit=20 --freshness=1h

# Check for quota issues
gcloud compute project-info describe --format="table(quotas.metric,quotas.limit,quotas.usage)"
```

**Solution:**
```bash
# Retry deployment
npm run deploy:adk

# If still failing, try with verbose output
cd apps/traffic-anomaly-agent
uv run python scripts/agent_engine_app.py --env=prod --verbose
```

---

### Issue: Build Failed - Network Error During pip Install

**Symptom:**
```
google.api_core.exceptions.InvalidArgument: 400 Build failed.
The issue might be caused by incorrect code, requirements.txt file or other dependencies.
```

**In GCP logs:**
```
pip._vendor.urllib3.exceptions.ProtocolError: ("Connection broken: BrokenPipeError(32, 'Broken pipe')"
Step #2: Downloading aiohttp-3.13.2... 1.4/1.8 MB
```

**Cause:** Transient network error during Cloud Build pip install. This is a temporary GCP infrastructure issue.

**Solution:**
```bash
# Simply retry the deployment - transient errors usually succeed on retry
npm run deploy:adk
```

---

### Issue: SSL Connection Error with Supabase Database

**Symptom:**
```
psycopg2.OperationalError: SSL connection has been closed unexpectedly
Failed to create session
```

**Cause:** Supabase Transaction pooler (port 6543) has SSL compatibility issues with Google Cloud.

**Solution:**
Update `DATABASE_URL` in `.env.prod` to use Session pooler (port 5432):
```bash
# Change from port 6543 to port 5432
DATABASE_URL="postgresql://user:pass@host:5432/postgres"

# Redeploy agent with updated config
npm run deploy:adk
```

---

### Issue: Method Not Found Error (stream vs stream_query)

**Symptom:**
```
User-specified method `stream` not found.
Available methods are: ['stream_query', 'async_stream_query', 'streaming_agent_run_with_events']
```

**Cause:** Web app is using wrong `class_method` value when calling Agent Engine.

**Solution:**
Update `apps/web/lib/adk/request-handler.ts`:
```typescript
// Change from "stream" to "stream_query"
body: {
  class_method: "stream_query",  // NOT "stream"
  input: { ... }
}
```

---

### Issue: Persistence Agent Cannot Save Reports

**Symptom:**
```
I was unable to save the report due to a connection error with the database API.
Please ensure the Next.js API is running and accessible at http://localhost:3000.
```

**Cause:** Cloud-deployed agent cannot reach `localhost:3000` - localhost refers to the container, not your machine.

**Solution:**
This is expected behavior until Phase 9 (Vercel deployment) is complete:
1. Report generation works fine
2. Saving to database requires deploying Next.js to Vercel
3. After Vercel deployment, update `NEXTJS_API_URL` in `.env.prod` and redeploy agent

---

### Issue: Agent Not Responding After Deployment

**Symptom:**
- Agent shows "Active" in console but web app can't connect
- Chat messages timeout or return errors

**Debugging:**
```bash
# 1. Verify Query URL is correct
echo "Check ADK_URL in your .env.local matches the Query URL from console"
grep ADK_URL apps/web/.env.local

# 2. Verify service account key is present
grep GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 apps/web/.env.prod | wc -c
# Should be > 1000 characters

# 3. Check Agent Engine logs
gcloud logging read "resource.type=aiplatform.googleapis.com/Agent" --limit=10 --freshness=30m

# 4. Test agent directly with curl (requires auth token)
ACCESS_TOKEN=$(gcloud auth print-access-token)
AGENT_URL="YOUR_QUERY_URL_HERE"
curl -X POST "$AGENT_URL:query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "Hello"}'
```

**Solution:**
1. Verify Query URL is copied correctly (no trailing spaces)
2. Ensure `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` is in web app environment
3. Restart the web app after updating environment variables
4. Check browser console for specific error messages

---

### Issue: Project Mismatch

**Symptom:**
```
Deployment goes to wrong project
Agent not found in expected project
```

**Solution:**
```bash
# Check all project references
gcloud config get-value project
grep GOOGLE_CLOUD_PROJECT apps/traffic-anomaly-agent/.env.prod
grep GOOGLE_CLOUD_PROJECT apps/traffic-anomaly-agent/.env.local

# They should ALL match: adk-traffic-anomaly

# If mismatch, fix .env.prod and redeploy
```

---

### Issue: Authentication Token Expired

**Symptom:**
```
google.auth.exceptions.RefreshError: ... token has been expired or revoked
Request had invalid authentication credentials
```

**Solution:**
```bash
# Refresh application default credentials
gcloud auth application-default login

# Verify new token works
gcloud auth application-default print-access-token

# Retry deployment
npm run deploy:adk
```

---

## Advanced Debugging

### View Agent Engine / Reasoning Engine Logs

Agent Engine uses Reasoning Engine internally. Use these commands to debug:

```bash
# View runtime errors (most useful for debugging)
gcloud logging read "resource.type=aiplatform.googleapis.com/ReasoningEngine" \
  --project=adk-traffic-anomaly \
  --limit=30 \
  --freshness=30m \
  --format="table(timestamp,textPayload)"

# View only ERROR severity logs
gcloud logging read "resource.type=aiplatform.googleapis.com/ReasoningEngine AND (textPayload:Error OR textPayload:Exception OR textPayload:Failed)" \
  --project=adk-traffic-anomaly \
  --limit=50 \
  --freshness=30m \
  --format="json"

# View Cloud Build logs (pip install, container build)
gcloud logging read "resource.type=aiplatform.googleapis.com/ReasoningEngine AND labels.build_step:Step" \
  --project=adk-traffic-anomaly \
  --limit=100 \
  --freshness=30m \
  --format="table(timestamp,textPayload)"
```

### View Agent Engine Logs (Alternative)

```bash
# Stream logs from Agent Engine
gcloud logging read "resource.type=aiplatform.googleapis.com/Agent AND resource.labels.project_id=adk-traffic-anomaly" --limit=50 --freshness=1h --format="table(timestamp,severity,jsonPayload.message)"
```

### Check IAM Policy for Service Account

```bash
# View all IAM bindings for the service account
gcloud projects get-iam-policy adk-traffic-anomaly \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:serviceAccount:traffic-agent-sa@adk-traffic-anomaly.iam.gserviceaccount.com"
```

### Verify Vertex AI API Quotas

```bash
# Check if you're hitting quota limits
gcloud alpha services quota list --service=aiplatform.googleapis.com --consumer=projects/adk-traffic-anomaly
```

### Manual Agent Health Check

```bash
# Get access token
ACCESS_TOKEN=$(gcloud auth print-access-token)

# Replace with your actual Query URL
QUERY_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/adk-traffic-anomaly/locations/us-central1/agents/YOUR_AGENT_ID"

# Test agent health
curl -s -X GET "$QUERY_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

---

## Local Development Logging Setup

Both the Next.js web app and ADK agent server support file-based logging for local development debugging. Logs are written to both terminal AND file simultaneously, with automatic cleanup of old logs.

### Web App Logging (`npm run dev:log`)

**Script:** `apps/web/scripts/dev-with-logging.js`
**Log Location:** `apps/web/logs/YYYY-MM-DD/YYYY-MM-DD_HH-mm-ss.log`

**Features:**
- Dual-write to terminal and log file
- Dated folder structure: `logs/2025-12-11/`
- Timestamped log files: `2025-12-11_14-30-45.log`
- Auto-cleanup of logs older than 3 days at startup
- Captures all Next.js server output (stdout + stderr)

**Usage:**
```bash
# Normal dev server (no file logging)
npm run dev:frontend

# Dev server WITH file logging
npm run dev:log
```

**Sample Log Output:**
```
================================================================================
  Next.js Development Server Log
  Started: 2025-12-11T14:30:45.123Z
================================================================================

[2025-12-11T14:30:46.000Z]  ▲ Next.js 15.x
[2025-12-11T14:30:46.100Z]  - Local:        http://localhost:3000
[2025-12-11T14:30:47.000Z] ✓ Ready in 1.5s
```

### ADK Agent Server Logging (`npm run dev:api`)

**Script:** `apps/traffic-anomaly-agent/scripts/run_adk_api.py`
**Log Location:** `apps/traffic-anomaly-agent/logs/YYYY-MM-DD/adk-server-YYYY-MM-DD-HHMMSS.log`

**Features:**
- Dual-write to terminal and log file
- Dated folder structure: `logs/2025-12-11/`
- Timestamped log files: `adk-server-2025-12-11-143045.log`
- Auto-cleanup of logs older than 3 days at startup
- Captures all ADK server output including agent execution traces

**Usage:**
```bash
# Start ADK server with automatic file logging
npm run dev:api

# Or from the agent directory directly
cd apps/traffic-anomaly-agent
uv run python scripts/run_adk_api.py
```

**Sample Log Output:**
```
============================================================
ADK Server Started: 2025-12-11T14:30:45.123456
============================================================

INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
🏠 [LOCALHOST_HANDLER] Processing request for session: abc123
```

### Log File Structure

```
gcp-bq-reports/
├── apps/
│   ├── web/
│   │   └── logs/                          # ← Web app logs
│   │       ├── 2025-12-11/
│   │       │   ├── 2025-12-11_14-30-45.log
│   │       │   └── 2025-12-11_16-22-10.log
│   │       └── 2025-12-10/
│   │           └── 2025-12-10_09-15-30.log
│   │
│   └── traffic-anomaly-agent/
│       └── logs/                          # ← ADK server logs
│           ├── 2025-12-11/
│           │   ├── adk-server-2025-12-11-143045.log
│           │   └── adk-server-2025-12-11-162210.log
│           └── 2025-12-10/
│               └── adk-server-2025-12-10-091530.log
```

### Logs Excluded from Git and Deployments

Both log directories are already excluded from version control via `.gitignore`:

**`apps/web/.gitignore`:**
```
# dev server logs
/logs/
```

**`apps/traffic-anomaly-agent/.gitignore`:**
```
logs/
```

This ensures:
- Logs are NOT committed to git
- Logs are NOT included in Agent Engine deployments
- Logs are NOT included in Vercel deployments

### When to Use File Logging

| Scenario | Command | Use Case |
|----------|---------|----------|
| Quick debugging | `npm run dev` | Normal development, issues easily visible in terminal |
| Complex debugging | `npm run dev:log` (web) | Need to review logs after session, search through output |
| Agent debugging | `npm run dev:api` | Always logs to file, useful for tracing agent execution |
| Both apps | Run `dev:log` + `dev:api` separately | Full debugging with both apps logging to files |

---

## Verification Checklist

After completing all steps, verify each item:

### Critical Configuration (MUST verify before deployment)
- [ ] **DATABASE_URL:** Uses port 5432 (Session pooler), NOT 6543 (Transaction pooler)
- [ ] **Web App:** `apps/web/lib/adk/request-handler.ts` has `class_method: "stream_query"`
- [ ] **Web App:** `apps/web/lib/adk/session-service.ts` has `class_method: "create_session"`

### Pre-Deployment
- [ ] **Pre-deployment:** `gcloud auth list` shows authenticated account
- [ ] **Pre-deployment:** `gcloud config get-value project` shows `adk-traffic-anomaly`
- [ ] **Step 1:** `.env.prod` created at `apps/traffic-anomaly-agent/.env.prod`

### Deployment
- [ ] **Step 4:** `npm run deploy:adk` completes without errors
- [ ] **Step 4:** Console shows "Agent deployed successfully!"
- [ ] **Step 5:** Agent appears in Agent Engine console with "Active" status
- [ ] **Step 5:** Query URL copied from Agent Engine console

### Post-Deployment
- [ ] **Step 6:** `logs/deployment_metadata.json` exists with deployment info
- [ ] **Step 6:** `apps/web/.env.prod` contains `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`
- [ ] **Step 7:** `ADK_URL` updated in `apps/web/.env.local` (with `:query` suffix)

### Testing
- [ ] **Step 8:** Web app can create sessions (no SSL errors)
- [ ] **Step 8:** Chat messages stream correctly (no "method not found" errors)
- [ ] **Step 8:** Agent generates reports successfully
- [ ] **Known Limitation:** Report persistence fails until Phase 9 (Vercel deployment)

---

## Post-Deployment Operations

### Monitoring Agent Health

```bash
# Check agent status
gcloud ai agents list --project=adk-traffic-anomaly --region=us-central1

# View recent logs
gcloud logging read "resource.type=aiplatform.googleapis.com/Agent" --limit=20 --freshness=1h
```

### Updating the Agent

To deploy updates after making changes to the agent code:

```bash
# Re-run the same deployment command
npm run deploy:adk

# The script uses create/update pattern - updates existing agent
```

### Viewing Costs

```bash
# Check Vertex AI costs
# Go to: https://console.cloud.google.com/billing/linkedaccount?project=adk-traffic-anomaly
# Or use:
gcloud beta billing accounts list
```

### Rollback to Local Development

If you need to revert to local agent for debugging:

```bash
# Update web app to use local agent
# In apps/web/.env.local, change:
ADK_URL="http://localhost:8000"

# Start local agent
npm run dev:api

# In another terminal, start frontend
npm run dev:frontend
```

---

## Quick Reference Commands

```bash
# === PRE-DEPLOYMENT ===
gcloud auth application-default login
gcloud config set project adk-traffic-anomaly
gcloud config get-value project

# === CRITICAL: Verify DATABASE_URL uses port 5432 (NOT 6543) ===
grep DATABASE_URL apps/traffic-anomaly-agent/.env.prod
# Must be port 5432 (Session pooler), NOT 6543 (Transaction pooler)

# === DEPLOYMENT ===
cp apps/traffic-anomaly-agent/.env.local apps/traffic-anomaly-agent/.env.prod
cp apps/web/.env.local apps/web/.env.prod
npm run deploy:adk

# === VERIFICATION ===
cat apps/traffic-anomaly-agent/logs/deployment_metadata.json
grep GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 apps/web/.env.prod | head -c 100
gcloud ai agents list --project=adk-traffic-anomaly --region=us-central1

# === TESTING ===
npm run dev:frontend
# Open http://localhost:3000 and test chat

# === DEBUGGING (Reasoning Engine logs - most useful) ===
gcloud logging read "resource.type=aiplatform.googleapis.com/ReasoningEngine" \
  --project=adk-traffic-anomaly --limit=30 --freshness=30m \
  --format="table(timestamp,textPayload)"

# === DEBUGGING (Error logs only) ===
gcloud logging read "resource.type=aiplatform.googleapis.com/ReasoningEngine AND textPayload:Error" \
  --project=adk-traffic-anomaly --limit=20 --freshness=30m

# === DEBUGGING (Build logs) ===
gcloud logging read "resource.type=aiplatform.googleapis.com/ReasoningEngine AND labels.build_step:Step" \
  --project=adk-traffic-anomaly --limit=100 --freshness=30m

# === OTHER DEBUGGING ===
gcloud services list --enabled --filter="name:aiplatform"
gcloud iam service-accounts list --filter="email~traffic"

# === UPDATE AGENT ===
npm run deploy:adk  # Re-run to update

# === ROLLBACK TO LOCAL ===
# Set ADK_URL="http://localhost:8000" in apps/web/.env.local
npm run dev  # Runs both frontend and local agent
```

---

## Next Phase

After successful ADK deployment:

- **Phase 9 (Web App to Cloud):** Deploy the Next.js web app to Vercel
- This connects the cloud-deployed ADK agent with a cloud-hosted web frontend
- Reference: `DEPLOY.md` for Vercel deployment steps

---

## Support Resources

- **Agent Engine Console:** https://console.cloud.google.com/vertex-ai/agents/agent-engines
- **Cloud Logging:** https://console.cloud.google.com/logs
- **IAM Console:** https://console.cloud.google.com/iam-admin/iam
- **Billing Console:** https://console.cloud.google.com/billing
- **GCP Documentation:** https://cloud.google.com/vertex-ai/docs/generative-ai/agents
