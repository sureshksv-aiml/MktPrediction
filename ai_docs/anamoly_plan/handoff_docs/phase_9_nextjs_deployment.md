# Phase 9: Deploy Next.js Web App to Google Cloud Run - Handoff Document

**Created:** December 11, 2024
**Previous Phase:** Phase 8 (ADK Agent Deployment) - COMPLETED
**Current Phase:** Phase 9 (Next.js to Cloud Run)
**Status:** READY TO DEPLOY
**Focus:** Next.js Web App Deployment to Google Cloud Run

---

## ⚠️ Critical Configuration Requirements

These settings are **REQUIRED** for successful deployment. Missing any of these will cause failures.

### 1. ADK_URL: Must Point to Agent Engine

The web app must connect to the cloud-deployed ADK Agent Engine, NOT localhost.

```bash
# ❌ WRONG - Won't work in production
ADK_URL="http://localhost:8000"

# ✅ CORRECT - Agent Engine Query URL
ADK_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT/locations/us-central1/reasoningEngines/YOUR_ENGINE_ID:query"
```

### 2. GOOGLE_SERVICE_ACCOUNT_KEY_BASE64: Required for Cloud ADK

When `ADK_URL` contains `googleapis.com`, this key is REQUIRED for authentication.

```bash
# Generated automatically by Phase 8 ADK deployment
# Should be a long base64-encoded JSON string
GOOGLE_SERVICE_ACCOUNT_KEY_BASE64="ewogICJ0eXBlIjogInNlcnZpY2..."
```

**Check if present:**
```bash
grep "GOOGLE_SERVICE_ACCOUNT_KEY_BASE64" apps/web/.env.prod | wc -c
# Should be > 1000 characters
```

### 3. NEXT_PUBLIC_APP_URL: Will Be Updated After Deployment

The deployment script will automatically update this with the Cloud Run service URL.

```bash
# Before deployment (local)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# After deployment (auto-updated)
NEXT_PUBLIC_APP_URL="https://gcp-bq-reports-web-prod-xxxxx-uc.a.run.app"
```

### 4. DATABASE_URL: Use Session Pooler (Port 5432)

Same as Phase 8 - Supabase Transaction pooler has SSL issues with GCP.

```bash
# ❌ WRONG - SSL errors
DATABASE_URL="postgresql://user:pass@host:6543/postgres"

# ✅ CORRECT
DATABASE_URL="postgresql://user:pass@host:5432/postgres"
```

**Error if wrong:**
```
SSL connection has been closed unexpectedly
Database connection failed
```

---

## Phase Overview

Deploy the Next.js 15 web application to Google Cloud Run using an automated Python deployment script, following the same pattern as the ADK Agent deployment (Phase 8).

### What This Phase Accomplishes

- Deploy Next.js app to Google Cloud Run using `gcloud run deploy --source`
- Enable required GCP APIs (Cloud Run, Cloud Build, Artifact Registry)
- Pass all environment variables to Cloud Run service
- Auto-update ADK agent's `NEXTJS_API_URL` with Cloud Run URL
- Auto-update web app's `NEXT_PUBLIC_APP_URL` with Cloud Run URL
- Verify deployment with health check
- Save deployment metadata to `logs/deployment_metadata.json`

### Architecture After Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                      Google Cloud Platform                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────────┐      ┌──────────────────────────┐   │
│   │   Cloud Run          │      │   Agent Engine           │   │
│   │   (Next.js App)      │◄────►│   (ADK Agent)            │   │
│   │                      │      │                          │   │
│   │   - SSR Pages        │      │   - Traffic Analysis     │   │
│   │   - API Routes       │      │   - BigQuery ML          │   │
│   │   - Chat Interface   │      │   - Report Generation    │   │
│   └──────────────────────┘      └──────────────────────────┘   │
│            │                              │                      │
│            ▼                              ▼                      │
│   ┌──────────────────────┐      ┌──────────────────────────┐   │
│   │   Supabase           │      │   BigQuery               │   │
│   │   (PostgreSQL)       │      │   (Traffic Data)         │   │
│   └──────────────────────┘      └──────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pre-Deployment Checklist

### 1. Verify Phase 8 is Complete

```bash
# Check ADK agent is deployed
cat apps/traffic-anomaly-agent/logs/deployment_metadata.json

# Verify service account key exists in web app env
grep "GOOGLE_SERVICE_ACCOUNT_KEY_BASE64" apps/web/.env.prod | wc -c
# Should be > 1000 characters

# Verify ADK_URL points to Agent Engine
grep "ADK_URL" apps/web/.env.prod
# Should contain googleapis.com
```

### 2. Verify Google Cloud Authentication

```bash
# Check current authentication status
gcloud auth list

# Check current project
gcloud config get-value project
# Should output: adk-traffic-anomaly

# If not authenticated:
gcloud auth login
gcloud config set project adk-traffic-anomaly
```

### 3. Verify Environment File Exists

```bash
# Check .env.prod exists with required variables
ls -la apps/web/.env.prod

# Verify key variables are set
grep -E "^DATABASE_URL=" apps/web/.env.prod
grep -E "^SUPABASE_URL=" apps/web/.env.prod
grep -E "^ADK_URL=" apps/web/.env.prod
grep -E "^GEMINI_API_KEY=" apps/web/.env.prod
```

### 4. Verify Node.js Version

```bash
node --version
# Must be v18 or higher for Cloud Run buildpacks
```

### 5. Verify Python and Dependencies

```bash
# Check Python version
python --version
# Should be 3.10+

# Check required packages are installed
pip show python-dotenv || pip install python-dotenv
pip show pydantic || pip install pydantic
```

### 6. Verify DATABASE_URL Uses Correct Port

```bash
# CRITICAL: Must be port 5432 (Session pooler), NOT 6543 (Transaction pooler)
grep "DATABASE_URL" apps/web/.env.prod

# If you see :6543, change it to :5432
```

---

## Deployment Steps

### Step 1: Ensure Production Environment File is Ready

```bash
# Verify .env.prod has all required variables
cd apps/web

# Check for required variables
echo "Checking required environment variables..."
for var in DATABASE_URL SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY GEMINI_API_KEY ADK_URL NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY; do
  if grep -q "^$var=" .env.prod; then
    echo "✓ $var is set"
  else
    echo "✗ $var is MISSING"
  fi
done
```

**If `.env.prod` doesn't exist:**
```bash
# Copy from .env.local
cp apps/web/.env.local apps/web/.env.prod

# Then update ADK_URL to point to Agent Engine (from Phase 8)
```

### Step 2: Update next.config.ts for Standalone Output

**File:** `apps/web/next.config.ts`

Add `output: 'standalone'` for optimized Cloud Run builds:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',  // ADD THIS LINE
  images: {
    remotePatterns: [
      // ... existing config
    ],
  },
};

export default nextConfig;
```

### Step 3: Create .gcloudignore File

**File:** `apps/web/.gcloudignore`

```
.git
.gitignore
node_modules/
.next/
.env.local
.env.development
*.md
tests/
__tests__/
logs/
scripts/
```

### Step 4: Run Deployment Script

```bash
# From project root
npm run deploy:web

# Or directly
cd apps/web
python scripts/cloud_run_deploy.py --env prod
```

**What this command does automatically:**

| Step | Action | Description |
|------|--------|-------------|
| 1 | Pre-flight Checks | Validates gcloud, auth, project, env file, Node.js |
| 2 | Load Config | Reads from `.env.prod` |
| 3 | Validate Env Vars | Checks all required variables present and valid |
| 4 | Enable APIs | Enables Cloud Run, Cloud Build, Artifact Registry APIs |
| 5 | Deploy | Runs `gcloud run deploy --source .` |
| 6 | Get URL | Retrieves deployed service URL |
| 7 | Update ADK Env | Updates `NEXTJS_API_URL` in agent's `.env.prod` |
| 8 | Update Web Env | Updates `NEXT_PUBLIC_APP_URL` in web's `.env.prod` |
| 9 | Save Metadata | Saves to `logs/deployment_metadata.json` |
| 10 | Health Check | Verifies `/api/health` returns 200 |

**Expected Console Output:**
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 DEPLOYING NEXT.JS TO CLOUD RUN (PROD)               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

📋 Phase 1: Pre-flight Checks
==================================================
🔍 Checking gcloud CLI installation...
  ✓ gcloud CLI is installed
🔍 Checking gcloud authentication...
  ✓ Authenticated as: your-email@gmail.com
🔍 Verifying project: adk-traffic-anomaly...
  ✓ Project 'adk-traffic-anomaly' is accessible
🔍 Checking environment file: .env.prod...
  ✓ Environment file found: .env.prod
🔍 Checking required files...
  ✓ All 3 required files present
🔍 Checking Node.js version...
  ✓ Node.js version: 20.x.x

📋 Phase 2: Configuration Validation
==================================================
🔍 Validating required environment variables...
  ✓ All 8 required variables present
🔍 Validating environment variable formats...
  ✓ All environment variable formats valid
🔍 Checking ADK Agent connectivity...
  ✓ ADK URL configured for Agent Engine

📋 Phase 3: Enable GCP APIs
==================================================
🔌 Enabling required Google Cloud APIs...
   💨 Enabling APIs in parallel...
  ✓ run.googleapis.com
  ✓ cloudbuild.googleapis.com
  ✓ artifactregistry.googleapis.com
✅ All required APIs enabled successfully (3/3)

📋 Phase 4: Deployment
==================================================
🚀 Deploying to Cloud Run...
   Service: gcp-bq-reports-web-prod
   Region: us-central1
   Project: adk-traffic-anomaly
   ⏳ Building and deploying (this may take 5-10 minutes)...
   ✅ Deployment successful!
   🌐 Service URL: https://gcp-bq-reports-web-prod-xxxxx-uc.a.run.app

📋 Phase 5: Post-Deployment
==================================================
🔄 Updated NEXTJS_API_URL in ../traffic-anomaly-agent/.env.prod
✅ Updated NEXT_PUBLIC_APP_URL in .env.prod
📄 Deployment metadata saved to: logs/deployment_metadata.json

🔍 Verifying deployment...
   ✅ Health check passed!

╔═══════════════════════════════════════════════════════════╗
║   ✅ DEPLOYMENT COMPLETE!                                 ║
╠═══════════════════════════════════════════════════════════╣
║   Service URL: https://gcp-bq-reports-web-prod-xxxxx...   ║
║   Environment: prod                                       ║
╚═══════════════════════════════════════════════════════════╝
```

**Deployment Time:** Approximately 5-10 minutes (first deployment takes longer)

### Step 5: Verify Deployment

```bash
# Check deployment metadata
cat apps/web/logs/deployment_metadata.json

# Verify NEXTJS_API_URL was updated in ADK config
grep "NEXTJS_API_URL" apps/traffic-anomaly-agent/.env.prod

# Verify NEXT_PUBLIC_APP_URL was updated
grep "NEXT_PUBLIC_APP_URL" apps/web/.env.prod

# Test health endpoint
curl https://YOUR_SERVICE_URL/api/health
```

### Step 6: Redeploy ADK Agent (Required for Persistence)

After deploying the web app, the ADK agent needs to be redeployed so it can save reports to the Cloud Run URL:

```bash
# Redeploy ADK agent with updated NEXTJS_API_URL
npm run deploy:adk
```

This allows the persistence agent to save reports to the database via the Cloud Run-hosted API.

### Step 7: Configure Supabase Authentication URLs (Required)

**⚠️ CRITICAL:** After deploying to Cloud Run, you MUST update Supabase authentication settings to enable Google OAuth login with the new production URL. Without this step, authentication will fail with errors like:

```
AuthApiError: Unable to exchange external code
Supabase client error: supabaseUrl is required
```

**Steps to configure:**

1. **Go to Supabase Dashboard:**
   - Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Authentication Settings:**
   - Click **Authentication** in the left sidebar
   - Click **URL Configuration** tab

3. **Update Site URL:**
   - Change **Site URL** from `http://localhost:3000` to your Cloud Run URL:
   ```
   https://gcp-bq-reports-web-prod-xxxxx-uc.a.run.app
   ```

4. **Update Redirect URLs:**
   - Add both localhost (for development) and production URLs to **Redirect URLs**:
   ```
   http://localhost:3000/**
   https://gcp-bq-reports-web-prod-xxxxx-uc.a.run.app/**
   ```
   - The `/**` wildcard allows all paths to be valid redirect targets

5. **Save Changes:**
   - Click **Save** to apply the configuration

**Verification:**
```bash
# Get your Cloud Run URL
gcloud run services describe gcp-bq-reports-web-prod \
  --region=us-central1 \
  --format="value(status.url)"

# Verify the URL matches what you configured in Supabase
```

**Note:** If you later set up a custom domain, you'll need to add that domain to the Redirect URLs as well.

---

### Step 8: Test Full Flow

1. Open the Cloud Run URL in your browser
2. Login with Supabase authentication (Google OAuth)
3. Create a new chat session
4. Send a message: "Show me recent traffic anomalies"
5. Verify agent responds with analysis
6. Check that reports are saved to the database

---

## Files Involved

| File | Purpose | When Modified |
|------|---------|---------------|
| `apps/web/.env.prod` | Production configuration | Step 4 (NEXT_PUBLIC_APP_URL updated) |
| `apps/web/next.config.ts` | Next.js configuration | Step 2 (add standalone output) |
| `apps/web/.gcloudignore` | Cloud Build exclusions | Step 3 (created) |
| `apps/web/scripts/cloud_run_deploy.py` | Deployment orchestrator | Never (executes) |
| `apps/web/logs/deployment_metadata.json` | Deployment tracking | Step 4 (auto-created) |
| `apps/traffic-anomaly-agent/.env.prod` | ADK agent config | Step 4 (NEXTJS_API_URL updated) |
| Root `package.json` | npm scripts | Contains `deploy:web` script |

---

## Comprehensive Troubleshooting Guide

### Quick Diagnostic Commands

```bash
# 1. Check gcloud authentication
gcloud auth list
gcloud config get-value project

# 2. Check enabled APIs
gcloud services list --enabled --filter="name:run OR name:cloudbuild OR name:artifactregistry"

# 3. Check Cloud Run services
gcloud run services list --region=us-central1

# 4. Check recent Cloud Build logs
gcloud builds list --limit=5

# 5. Check service logs
gcloud run services logs read gcp-bq-reports-web-prod --region=us-central1 --limit=50
```

---

### Issue: gcloud CLI Not Found

**Symptom:**
```
❌ gcloud CLI not found!
```

**Solution:**
```bash
# Install Google Cloud SDK
# macOS: brew install google-cloud-sdk
# Windows: https://cloud.google.com/sdk/docs/install
# Linux: curl https://sdk.cloud.google.com | bash

# Initialize after installation
gcloud init
```

---

### Issue: Not Authenticated

**Symptom:**
```
❌ Not authenticated with gcloud!
```

**Solution:**
```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project adk-traffic-anomaly
```

---

### Issue: Environment Variable Validation Failed

**Symptom:**
```
❌ Environment variable validation failed!
  Missing variables:
    • DATABASE_URL
    • SUPABASE_SERVICE_ROLE_KEY
```

**Solution:**
```bash
# Check what's in .env.prod
cat apps/web/.env.prod

# Copy from .env.local if missing
cp apps/web/.env.local apps/web/.env.prod

# Or manually add missing variables
```

---

### Issue: Build Failed in Cloud Build

**Symptom:**
```
❌ Deployment failed!
   Error: Build failed...
```

**Debugging:**
```bash
# View Cloud Build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID

# Check for common issues:
# - Missing dependencies in package.json
# - TypeScript errors
# - Node.js version mismatch
```

**Solution:**
```bash
# Test build locally first
cd apps/web
npm run build

# If local build fails, fix errors and retry
```

---

### Issue: Service Account Permission Error

**Symptom:**
```
ERROR: (gcloud.run.deploy) PERMISSION_DENIED
```

**Solution:**
```bash
# Check your IAM permissions
gcloud projects get-iam-policy adk-traffic-anomaly \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:$(gcloud config get-value account)"

# You need: roles/run.admin, roles/cloudbuild.builds.editor
```

---

### Issue: Health Check Fails After Deployment

**Symptom:**
```
⚠ Health check returned 500, retrying...
⚠ Health check did not pass
```

**Debugging:**
```bash
# Check service logs
gcloud run services logs read gcp-bq-reports-web-prod \
  --region=us-central1 \
  --limit=100

# Check if environment variables are set
gcloud run services describe gcp-bq-reports-web-prod \
  --region=us-central1 \
  --format="yaml(spec.template.spec.containers[0].env)"
```

**Common Causes:**
1. Missing environment variables
2. Database connection issues (wrong port - use 5432, not 6543)
3. ADK authentication failure (missing GOOGLE_SERVICE_ACCOUNT_KEY_BASE64)
4. Invalid ADK_URL format

---

### Issue: Agent Can't Save Reports (Persistence Error)

**Symptom:**
```
Unable to save report to database API
I was unable to save the report due to a connection error
```

**Cause:** ADK agent's `NEXTJS_API_URL` not updated, or agent not redeployed after web deployment.

**Solution:**
```bash
# Verify NEXTJS_API_URL in ADK config
grep "NEXTJS_API_URL" apps/traffic-anomaly-agent/.env.prod
# Should be: https://gcp-bq-reports-web-prod-xxxxx-uc.a.run.app

# Redeploy ADK agent with updated URL
npm run deploy:adk
```

---

### Issue: Database Connection Failed

**Symptom:**
```
Error: SSL connection has been closed unexpectedly
Database connection timeout
```

**Cause:** Using Transaction pooler (port 6543) instead of Session pooler (port 5432).

**Solution:**
```bash
# Check DATABASE_URL port
grep "DATABASE_URL" apps/web/.env.prod

# Change from 6543 to 5432
# From: postgresql://user:pass@host:6543/postgres
# To:   postgresql://user:pass@host:5432/postgres

# Redeploy
npm run deploy:web
```

---

### Issue: ADK Authentication Failed

**Symptom:**
```
Error: Request had invalid authentication credentials
403 Forbidden when calling Agent Engine
```

**Cause:** Missing or invalid `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`.

**Solution:**
```bash
# Check if key is present and has content
grep "GOOGLE_SERVICE_ACCOUNT_KEY_BASE64" apps/web/.env.prod | wc -c
# Should be > 1000 characters

# If missing or too short, re-run Phase 8 deployment
# which auto-generates and updates this key
npm run deploy:adk
```

---

### Issue: Google OAuth / Supabase Authentication Fails

**Symptom:**
```
AuthApiError: Unable to exchange external code
Supabase client error: supabaseUrl is required
Error: Unable to exchange external code: xxxxx
```

**Cause:** Supabase Site URL and/or Redirect URLs not configured for Cloud Run URL.

**Solution:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) > Your Project
2. Navigate to **Authentication** > **URL Configuration**
3. Update **Site URL** to your Cloud Run URL:
   ```
   https://gcp-bq-reports-web-prod-xxxxx-uc.a.run.app
   ```
4. Add to **Redirect URLs** (include both for dev and prod):
   ```
   http://localhost:3000/**
   https://gcp-bq-reports-web-prod-xxxxx-uc.a.run.app/**
   ```
5. Save changes and retry authentication

**See:** Step 7 in Deployment Steps for detailed instructions.

---

### Issue: CORS Errors in Browser

**Symptom:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solution:**
Cloud Run allows all origins by default. Check that:
1. The API routes return proper CORS headers
2. The NEXT_PUBLIC_APP_URL matches the actual domain
3. Supabase URL is correctly configured

---

### Issue: Container Startup Timeout

**Symptom:**
```
Container failed to start. The user-provided container failed to start and listen on the port
```

**Debugging:**
```bash
# Check container logs during startup
gcloud run services logs read gcp-bq-reports-web-prod \
  --region=us-central1 \
  --limit=100

# Check if PORT environment variable is being used
# Next.js standalone should use process.env.PORT
```

**Solution:**
Ensure `next.config.ts` has `output: 'standalone'` configured.

---

## Advanced Debugging

### View Cloud Run Logs in Real-time

```bash
# Stream logs from Cloud Run service
gcloud run services logs tail gcp-bq-reports-web-prod --region=us-central1
```

### View Cloud Build Logs

```bash
# List recent builds
gcloud builds list --limit=10

# View specific build log
gcloud builds log BUILD_ID

# View build logs in browser
gcloud builds log BUILD_ID --stream
```

### Check Service Configuration

```bash
# View full service configuration
gcloud run services describe gcp-bq-reports-web-prod \
  --region=us-central1 \
  --format="yaml"

# View only environment variables
gcloud run services describe gcp-bq-reports-web-prod \
  --region=us-central1 \
  --format="yaml(spec.template.spec.containers[0].env)"
```

### Manual Health Check

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe gcp-bq-reports-web-prod \
  --region=us-central1 \
  --format="value(status.url)")

# Test health endpoint
curl -v "$SERVICE_URL/api/health"

# Test with timing
time curl -s "$SERVICE_URL/api/health"
```

### Check Resource Usage

```bash
# View Cloud Run metrics
gcloud run services get-iam-policy gcp-bq-reports-web-prod \
  --region=us-central1

# View in console
echo "https://console.cloud.google.com/run/detail/us-central1/gcp-bq-reports-web-prod/metrics"
```

---

## Verification Checklist

### Pre-Deployment
- [ ] Phase 8 (ADK deployment) completed
- [ ] `gcloud auth list` shows authenticated account
- [ ] `gcloud config get-value project` shows `adk-traffic-anomaly`
- [ ] `apps/web/.env.prod` exists with all required variables
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` is present (> 1000 chars)
- [ ] `ADK_URL` points to Agent Engine (contains googleapis.com)
- [ ] `DATABASE_URL` uses port 5432 (NOT 6543)
- [ ] Node.js version 18+ installed
- [ ] Python 3.10+ with python-dotenv and pydantic installed

### Deployment
- [ ] `npm run deploy:web` completes without errors
- [ ] All pre-flight checks pass
- [ ] All required APIs enabled
- [ ] Cloud Build completes successfully
- [ ] Service URL is returned

### Post-Deployment
- [ ] `logs/deployment_metadata.json` created
- [ ] `NEXT_PUBLIC_APP_URL` updated in `.env.prod`
- [ ] `NEXTJS_API_URL` updated in ADK's `.env.prod`
- [ ] Health check passes (`/api/health` returns 200)
- [ ] Can access web app at Cloud Run URL

### Supabase Configuration (Required for Auth)
- [ ] Supabase Dashboard > Authentication > URL Configuration opened
- [ ] **Site URL** set to Cloud Run URL (not localhost)
- [ ] **Redirect URLs** includes both `http://localhost:3000/**` and Cloud Run URL with `/**`
- [ ] Changes saved in Supabase dashboard

### After ADK Redeploy
- [ ] `npm run deploy:adk` completed
- [ ] Login/authentication works
- [ ] Chat sends messages to ADK agent
- [ ] Agent responses stream correctly
- [ ] Reports are generated successfully
- [ ] Reports are saved to database (persistence works)

---

## Quick Reference Commands

```bash
# === PRE-DEPLOYMENT ===
gcloud auth login
gcloud config set project adk-traffic-anomaly
gcloud config get-value project

# === VERIFY PHASE 8 COMPLETE ===
grep "GOOGLE_SERVICE_ACCOUNT_KEY_BASE64" apps/web/.env.prod | wc -c
grep "ADK_URL" apps/web/.env.prod
cat apps/traffic-anomaly-agent/logs/deployment_metadata.json

# === VERIFY DATABASE_URL PORT ===
grep "DATABASE_URL" apps/web/.env.prod
# Must be port 5432, NOT 6543

# === DEPLOYMENT ===
npm run deploy:web

# === VERIFICATION ===
cat apps/web/logs/deployment_metadata.json
curl https://YOUR_SERVICE_URL/api/health

# === VIEW SERVICE ===
gcloud run services describe gcp-bq-reports-web-prod --region=us-central1

# === VIEW LOGS ===
gcloud run services logs read gcp-bq-reports-web-prod --region=us-central1 --limit=50

# === STREAM LOGS ===
gcloud run services logs tail gcp-bq-reports-web-prod --region=us-central1

# === VIEW BUILD LOGS ===
gcloud builds list --limit=5
gcloud builds log BUILD_ID

# === REDEPLOY ADK (for persistence) ===
npm run deploy:adk

# === UPDATE SERVICE ===
npm run deploy:web  # Re-run to update

# === DELETE SERVICE (if needed) ===
gcloud run services delete gcp-bq-reports-web-prod --region=us-central1

# === ROLLBACK TO LOCAL ===
# Set ADK_URL="http://localhost:8000" in apps/web/.env.local
npm run dev  # Runs both frontend and local agent
```

---

## Cloud Run Service Configuration

The deployment script uses these settings:

| Setting | Value | Description |
|---------|-------|-------------|
| Region | us-central1 | Same as Agent Engine |
| Memory | 1Gi | Sufficient for Next.js SSR |
| CPU | 1 | Single vCPU |
| Min Instances | 0 | Scale to zero for cost savings |
| Max Instances | 10 | Handle traffic spikes |
| Timeout | 300s | Allow long agent responses |
| Concurrency | 80 | Requests per instance |
| Auth | Unauthenticated | Public web app |

---

## Cost Considerations

- **Cloud Run:** Pay per request (scale to zero when idle)
- **Cloud Build:** 120 free build-minutes/day
- **Artifact Registry:** Minimal storage for container images
- **Network Egress:** Standard GCP rates
- **No persistent storage needed** (stateless container)

**Estimated Cost:** $0-5/month for low traffic, scales with usage

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase PostgreSQL (port 5432) | `postgresql://user:pass@host:5432/postgres` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOi...` |
| `GEMINI_API_KEY` | Google AI API key | `AIzaSy...` |
| `ADK_URL` | Agent Engine Query URL | `https://us-central1-aiplatform...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Client-side Supabase URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side anon key | `eyJhbGciOi...` |

### Optional/Auto-Updated Variables

| Variable | Description | Updated By |
|----------|-------------|------------|
| `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` | Service account key | Phase 8 deployment |
| `NEXT_PUBLIC_APP_URL` | Cloud Run service URL | Phase 9 deployment |
| `NEXT_PUBLIC_IS_AGENT_ENGINE` | Set to "true" for cloud | Deployment script |

---

## Next Steps After Deployment

### 1. Test Full Flow
- Open Cloud Run URL in browser
- Login with Supabase auth
- Create a chat session
- Send message to agent
- Verify report is generated and saved

### 2. Configure Custom Domain (Optional)

```bash
# Map a custom domain to Cloud Run
gcloud run domain-mappings create --service gcp-bq-reports-web-prod \
  --domain your-domain.com --region us-central1

# Follow DNS verification steps in console
```

### 3. Set Up Monitoring

- **Cloud Run Metrics:** https://console.cloud.google.com/run
- **Error Reporting:** https://console.cloud.google.com/errors
- **Cloud Logging:** https://console.cloud.google.com/logs

### 4. Set Up Alerts (Optional)

```bash
# Create alerting policy for high error rates
gcloud alpha monitoring policies create \
  --display-name="High Error Rate - Web App" \
  --condition-display-name="Error rate > 5%" \
  --condition-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="gcp-bq-reports-web-prod"'
```

---

## Rollback Procedures

### Rollback to Previous Revision

```bash
# List revisions
gcloud run revisions list --service=gcp-bq-reports-web-prod --region=us-central1

# Route traffic to previous revision
gcloud run services update-traffic gcp-bq-reports-web-prod \
  --region=us-central1 \
  --to-revisions=PREVIOUS_REVISION=100
```

### Rollback to Local Development

```bash
# Update web app to use local agent
# In apps/web/.env.local, change:
ADK_URL="http://localhost:8000"

# Start both frontend and local agent
npm run dev
```

---

## Support Resources

- **Cloud Run Console:** https://console.cloud.google.com/run
- **Cloud Build Console:** https://console.cloud.google.com/cloud-build
- **Cloud Logging:** https://console.cloud.google.com/logs
- **Artifact Registry:** https://console.cloud.google.com/artifacts
- **GCP Documentation:** https://cloud.google.com/run/docs
- **Next.js on Cloud Run:** https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service

---

## Appendix: Deployment Script Details

The `cloud_run_deploy.py` script performs these checks before deployment:

### Pre-flight Validation Functions

| Function | Purpose |
|----------|---------|
| `verify_gcloud_installed()` | Check gcloud CLI exists |
| `verify_gcloud_authenticated()` | Check user is logged in |
| `verify_project_exists()` | Validate GCP project accessible |
| `verify_env_file_exists()` | Check .env.prod/.env.local exists |
| `validate_required_env_vars()` | All required variables present |
| `validate_env_var_formats()` | URL formats, key formats valid |
| `verify_required_files()` | package.json, next.config.ts exist |
| `verify_node_version()` | Node.js 18+ installed |
| `verify_adk_agent_health()` | ADK_URL format is valid |

### APIs Enabled by Script

| API | Purpose |
|-----|---------|
| `run.googleapis.com` | Cloud Run API |
| `cloudbuild.googleapis.com` | Cloud Build API |
| `artifactregistry.googleapis.com` | Container image storage |

### Post-Deployment Actions

| Action | Description |
|--------|-------------|
| Update ADK env | Sets `NEXTJS_API_URL` in agent's `.env.prod` |
| Update Web env | Sets `NEXT_PUBLIC_APP_URL` in web's `.env.prod` |
| Save metadata | Writes to `logs/deployment_metadata.json` |
| Health check | Verifies `/api/health` returns 200 |
