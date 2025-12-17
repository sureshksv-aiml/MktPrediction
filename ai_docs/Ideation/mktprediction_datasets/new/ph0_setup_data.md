# Phase 0: Setup + Data Loading

**Previous Phase:** None (Starting Point)
**Current Phase:** Phase 0 - Setup + Data Loading
**Next Phase:** Phase 1 - Technical Agents
**Estimated Time:** 45 minutes (extended for additional datasets)
**Status:** PENDING

---

## Project Context (Read First)

> **Before starting this phase, review:**
>
> - [00_system_architecture.md](00_system_architecture.md) - System diagrams and BigQuery schemas
> - [01_project_plan.md](01_project_plan.md) - Project overview and timeline

---

## Phase Objectives

1. Create GCS bucket for raw data storage
2. Upload CSV files to GCS (including analyst ratings and earnings transcripts) ★UPDATED
3. Create BigQuery dataset `market_volatility`
4. Load 8 input tables from CSV files ★UPDATED (was 6)
5. Process 200 earnings transcripts via Gemini batch script ★NEW
6. Create 2 output tables (empty, for agent writes)
7. Verify data loading with test queries

---

## What This Phase Creates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 0 OUTPUT                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  GCS Bucket: gs://[PROJECT_ID]-market-volatility-data/
  ├── raw/
  │   ├── 30_yr_stock_market_data.csv
  │   ├── indexData.csv
  │   ├── communications.csv
  │   ├── acquisitions_update_2021.csv
  │   ├── US_Economic_Indicators.csv
  │   ├── stock_news.csv
  │   ├── analyst_ratings.csv            ★NEW
  │   └── earnings_transcripts/          ★NEW (folder with 200 text files)
  │       ├── AAPL/
  │       ├── MSFT/
  │       ├── NVDA/
  │       └── ... (10 companies total)

  BigQuery Dataset: market_volatility
  ├── INPUT TABLES (8) ★UPDATED
  │   ├── market_30yr          (7,754 rows)
  │   ├── index_data           (112,457 rows)
  │   ├── fed_communications   (65,019 rows)
  │   ├── acquisitions         (1,454 rows)
  │   ├── economic_indicators  (44 rows)
  │   ├── stock_news           (26,000 rows)
  │   ├── analyst_ratings      (~5,000 rows)    ★NEW
  │   └── speech_signals       (~200 rows)      ★NEW (processed via Gemini)
  │
  └── OUTPUT TABLES (2)
      ├── volatility_forecasts (empty)
      └── alerts               (empty)
```

---

## Prerequisites

- [ ] Google Cloud project with billing enabled
- [ ] `gcloud` CLI installed and authenticated
- [ ] BigQuery API enabled
- [ ] CSV files available in `ai_docs/Ideation/mktprediction_datasets/data/`

---

## Tasks

### Task 0.1: Set Environment Variables

```bash
# Set your GCP project ID
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export BUCKET_NAME="${PROJECT_ID}-market-volatility-data"
export DATASET_NAME="market_volatility"

# Verify
echo "Project: $PROJECT_ID"
echo "Bucket: $BUCKET_NAME"
echo "Dataset: $DATASET_NAME"
```

### Task 0.2: Create GCS Bucket

```bash
# Create bucket
gsutil mb -l $REGION gs://$BUCKET_NAME

# Verify
gsutil ls gs://$BUCKET_NAME
```

### Task 0.3: Upload CSV Files to GCS

```bash
# Navigate to data folder
cd ai_docs/Ideation/mktprediction_datasets/data/

# Upload files (rename for cleaner names)
gsutil cp datasets_uc4-market-activity-prediction-agent_30_yr_stock_market_data.csv \
    gs://$BUCKET_NAME/raw/30_yr_stock_market_data.csv

gsutil cp datasets_uc4-market-activity-prediction-agent_indexData.csv \
    gs://$BUCKET_NAME/raw/indexData.csv

gsutil cp datasets_uc4-market-activity-prediction-agent_communications.csv \
    gs://$BUCKET_NAME/raw/communications.csv

gsutil cp datasets_uc4-market-activity-prediction-agent_acquisitions_update_2021.csv \
    gs://$BUCKET_NAME/raw/acquisitions.csv

gsutil cp datasets_uc4-market-activity-prediction-agent_US_Economic_Indicators.csv \
    gs://$BUCKET_NAME/raw/economic_indicators.csv

gsutil cp datasets_uc4-market-activity-prediction-agent_stock_news.csv \
    gs://$BUCKET_NAME/raw/stock_news.csv

# ★NEW: Upload analyst ratings
gsutil cp datasets_uc4-market-activity-prediction-agent_analyst_ratings_processed.csv \
    gs://$BUCKET_NAME/raw/analyst_ratings.csv

# ★NEW: Upload earnings transcripts folder
gsutil -m cp -r datasets_uc4-market-activity-prediction-agent_earnings-call-transcripts/ \
    gs://$BUCKET_NAME/raw/earnings_transcripts/

# Verify uploads
gsutil ls gs://$BUCKET_NAME/raw/
```

### Task 0.4: Create BigQuery Dataset

```bash
# Create dataset
bq mk --dataset --location=$REGION $PROJECT_ID:$DATASET_NAME

# Verify
bq ls $PROJECT_ID:$DATASET_NAME
```

### Task 0.5: Load Input Tables

#### Table 1: market_30yr
```bash
bq load --source_format=CSV --autodetect \
    $PROJECT_ID:$DATASET_NAME.market_30yr \
    gs://$BUCKET_NAME/raw/30_yr_stock_market_data.csv
```

#### Table 2: index_data
```bash
bq load --source_format=CSV --autodetect \
    $PROJECT_ID:$DATASET_NAME.index_data \
    gs://$BUCKET_NAME/raw/indexData.csv
```

#### Table 3: fed_communications
```bash
bq load --source_format=CSV --autodetect \
    $PROJECT_ID:$DATASET_NAME.fed_communications \
    gs://$BUCKET_NAME/raw/communications.csv
```

#### Table 4: acquisitions
```bash
bq load --source_format=CSV --autodetect \
    $PROJECT_ID:$DATASET_NAME.acquisitions \
    gs://$BUCKET_NAME/raw/acquisitions.csv
```

#### Table 5: economic_indicators
```bash
bq load --source_format=CSV --autodetect \
    $PROJECT_ID:$DATASET_NAME.economic_indicators \
    gs://$BUCKET_NAME/raw/economic_indicators.csv
```

#### Table 6: stock_news
```bash
bq load --source_format=CSV --autodetect \
    $PROJECT_ID:$DATASET_NAME.stock_news \
    gs://$BUCKET_NAME/raw/stock_news.csv
```

#### Table 7: analyst_ratings ★NEW
```bash
bq load --source_format=CSV --autodetect \
    $PROJECT_ID:$DATASET_NAME.analyst_ratings \
    gs://$BUCKET_NAME/raw/analyst_ratings.csv
```

#### Table 8: speech_signals ★NEW (Empty - populated by Gemini processing)
```bash
bq query --use_legacy_sql=false "
CREATE TABLE IF NOT EXISTS \`$PROJECT_ID.$DATASET_NAME.speech_signals\` (
    id STRING,
    symbol STRING,
    event STRING,
    transcript STRING,
    tone STRING,
    guidance STRING,
    topics ARRAY<STRING>,
    risks ARRAY<STRING>,
    processed_at TIMESTAMP
)"
```

### Task 0.5.5: Process Earnings Transcripts via Gemini ★NEW

This step processes the 200 earnings transcripts through Gemini for sentiment analysis.

**Option A: Reuse existing pipeline from market-signal-agent**

Copy and adapt `extract_signals_with_gemini()` from:
`apps/market-signal-agent/cloud_functions/process_audio/main.py`

**Create batch processing script:**
```python
# apps/market-signal-agent/scripts/process_transcripts.py

import os
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from google.cloud import bigquery
from google.genai import Client
from google.genai.types import GenerateContentConfig

PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT")
DATASET = "market_volatility"
LOCATION = "us-central1"

def extract_signals_with_gemini(transcript: str, symbol: str) -> dict:
    """Extract market signals from transcript using Gemini."""
    client = Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

    # Truncate to avoid token limits
    truncated = transcript[:15000]

    prompt = f"""Analyze this earnings call transcript and extract:

    TRANSCRIPT:
    {truncated}

    Return JSON with:
    {{
      "tone": "bullish|bearish|neutral",
      "guidance": "1-2 sentence forward guidance summary",
      "topics": ["topic1", "topic2", ...],
      "risks": ["risk1", "risk2", ...]
    }}
    """

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=GenerateContentConfig(temperature=0.1, max_output_tokens=1024)
    )

    try:
        text = response.text.strip()
        if text.startswith("```"):
            text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except:
        return {"tone": "neutral", "guidance": "", "topics": [], "risks": []}

def process_all_transcripts(transcripts_folder: str):
    """Process all transcripts and insert to BigQuery."""
    client = bigquery.Client(project=PROJECT_ID)
    table_ref = f"{PROJECT_ID}.{DATASET}.speech_signals"

    rows = []
    for company_folder in Path(transcripts_folder).iterdir():
        if company_folder.is_dir():
            symbol = company_folder.name
            for transcript_file in company_folder.glob("*.txt"):
                print(f"Processing: {symbol}/{transcript_file.name}")

                text = transcript_file.read_text()
                signals = extract_signals_with_gemini(text, symbol)

                rows.append({
                    "id": str(uuid.uuid4()),
                    "symbol": symbol,
                    "event": transcript_file.stem,
                    "transcript": text[:100000],
                    "tone": signals.get("tone", "neutral"),
                    "guidance": signals.get("guidance", ""),
                    "topics": signals.get("topics", []),
                    "risks": signals.get("risks", []),
                    "processed_at": datetime.now(timezone.utc).isoformat()
                })

    # Insert in batches
    errors = client.insert_rows_json(table_ref, rows)
    if errors:
        print(f"Errors: {errors}")
    else:
        print(f"Inserted {len(rows)} rows to speech_signals")

if __name__ == "__main__":
    process_all_transcripts("gs://$BUCKET_NAME/raw/earnings_transcripts/")
```

**Run the processing:**
```bash
cd apps/market-signal-agent
uv run python scripts/process_transcripts.py
```

Expected: ~200 rows inserted into `speech_signals` table (15-30 minutes depending on rate limits)

### Task 0.6: Create Output Tables

#### volatility_forecasts
```sql
CREATE TABLE IF NOT EXISTS `{PROJECT_ID}.market_volatility.volatility_forecasts` (
    id STRING,
    symbol STRING,
    forecast_date DATE,
    volatility_1d FLOAT64,
    volatility_5d FLOAT64,
    current_vix FLOAT64,
    volatility_regime STRING,
    confidence FLOAT64,
    computed_at TIMESTAMP
);
```

Run with bq:
```bash
bq query --use_legacy_sql=false "
CREATE TABLE IF NOT EXISTS \`$PROJECT_ID.$DATASET_NAME.volatility_forecasts\` (
    id STRING,
    symbol STRING,
    forecast_date DATE,
    volatility_1d FLOAT64,
    volatility_5d FLOAT64,
    current_vix FLOAT64,
    volatility_regime STRING,
    confidence FLOAT64,
    computed_at TIMESTAMP
)"
```

#### alerts
```bash
bq query --use_legacy_sql=false "
CREATE TABLE IF NOT EXISTS \`$PROJECT_ID.$DATASET_NAME.alerts\` (
    id STRING,
    alert_type STRING,
    severity STRING,
    symbol STRING,
    message STRING,
    vix_value FLOAT64,
    triggered_at TIMESTAMP,
    is_active BOOLEAN
)"
```

### Task 0.7: Verify Data Loading

```bash
# Check row counts
bq query --use_legacy_sql=false "
SELECT 'market_30yr' as table_name, COUNT(*) as row_count FROM \`$PROJECT_ID.$DATASET_NAME.market_30yr\`
UNION ALL
SELECT 'index_data', COUNT(*) FROM \`$PROJECT_ID.$DATASET_NAME.index_data\`
UNION ALL
SELECT 'fed_communications', COUNT(*) FROM \`$PROJECT_ID.$DATASET_NAME.fed_communications\`
UNION ALL
SELECT 'acquisitions', COUNT(*) FROM \`$PROJECT_ID.$DATASET_NAME.acquisitions\`
UNION ALL
SELECT 'economic_indicators', COUNT(*) FROM \`$PROJECT_ID.$DATASET_NAME.economic_indicators\`
UNION ALL
SELECT 'stock_news', COUNT(*) FROM \`$PROJECT_ID.$DATASET_NAME.stock_news\`
UNION ALL
SELECT 'analyst_ratings', COUNT(*) FROM \`$PROJECT_ID.$DATASET_NAME.analyst_ratings\`
UNION ALL
SELECT 'speech_signals', COUNT(*) FROM \`$PROJECT_ID.$DATASET_NAME.speech_signals\`
"
```

Expected output:
```
+----------------------+-----------+
|     table_name       | row_count |
+----------------------+-----------+
| market_30yr          |      7754 |
| index_data           |    112457 |
| fed_communications   |     65019 |
| acquisitions         |      1454 |
| economic_indicators  |        44 |
| stock_news           |     26000 |
| analyst_ratings      |     ~5000 | ★NEW
| speech_signals       |      ~200 | ★NEW (after Gemini processing)
+----------------------+-----------+
```

### Task 0.8: Test VIX Query

```bash
bq query --use_legacy_sql=false "
SELECT date, vix
FROM \`$PROJECT_ID.$DATASET_NAME.market_30yr\`
WHERE vix IS NOT NULL
ORDER BY date DESC
LIMIT 5
"
```

---

## Verification Checklist

- [ ] GCS bucket created: `gs://[PROJECT_ID]-market-volatility-data`
- [ ] 7 CSV files uploaded to `raw/` folder ★UPDATED
- [ ] Earnings transcripts folder uploaded to `raw/earnings_transcripts/` ★NEW
- [ ] BigQuery dataset `market_volatility` created
- [ ] market_30yr table loaded (~7,754 rows)
- [ ] index_data table loaded (~112,457 rows)
- [ ] fed_communications table loaded (~65,019 rows)
- [ ] acquisitions table loaded (~1,454 rows)
- [ ] economic_indicators table loaded (~44 rows)
- [ ] stock_news table loaded (~26,000 rows)
- [ ] analyst_ratings table loaded (~5,000 rows) ★NEW
- [ ] speech_signals table created and populated (~200 rows after Gemini processing) ★NEW
- [ ] volatility_forecasts output table created (empty)
- [ ] alerts output table created (empty)
- [ ] Test VIX query returns data

---

## Troubleshooting

### CSV Load Errors
If autodetect fails, create explicit schema:
```bash
bq load --source_format=CSV \
    --schema "date:DATE,vix:FLOAT64,sp500:FLOAT64,..." \
    $PROJECT_ID:$DATASET_NAME.market_30yr \
    gs://$BUCKET_NAME/raw/30_yr_stock_market_data.csv
```

### Permission Errors
```bash
# Ensure BigQuery API is enabled
gcloud services enable bigquery.googleapis.com

# Check authentication
gcloud auth application-default login
```

---

## Handoff to Phase 1

**What's Ready:**
- GCS bucket with raw CSV files + earnings transcripts ★UPDATED
- BigQuery dataset with 8 input tables loaded ★UPDATED
- 2 output tables created (empty)
- VIX data verified and queryable
- 200 earnings transcripts processed via Gemini ★NEW

**What's Next:**
- Create technical_agent (VIX analysis, z-scores)
- Create event_calendar_agent (Fed meetings, M&A, analyst ratings) ★UPDATED
- Create speech_signal_agent (earnings call sentiment) ★NEW

---

## Prompt for Next Session (Phase 1)

```
`ph1_technical_agents.md`
Reference: `00_system_architecture.md`, `01_project_plan.md`

I'm continuing the Market Volatility Prediction Agent project.

## Phase 0 (Setup + Data Loading) is COMPLETE

**What was created:**
- GCS bucket: gs://[PROJECT_ID]-market-volatility-data/
- BigQuery dataset: market_volatility
- 8 input tables loaded (market_30yr, index_data, fed_communications, acquisitions, economic_indicators, stock_news, analyst_ratings, speech_signals) ★UPDATED
- 2 output tables created (volatility_forecasts, alerts)
- 200 earnings transcripts processed via Gemini into speech_signals table ★NEW

## Now Starting: Phase 1 - Technical Agents

Please read:
1. `ai_docs/Ideation/mktprediction_datasets/new/ph1_technical_agents.md` - Phase 1 tasks
2. `ai_docs/Ideation/mktprediction_datasets/new/00_system_architecture.md` - Architecture

## Key Tasks for Phase 1:
1. Create technical_agent (queries market_30yr, index_data)
2. Create event_calendar_agent (queries fed_communications, acquisitions, analyst_ratings) ★UPDATED
3. Create speech_signal_agent (queries speech_signals) ★NEW
4. Test agents with adk web

Please start by reading the phase document.
```
