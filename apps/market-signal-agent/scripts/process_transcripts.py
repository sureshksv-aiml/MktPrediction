"""Process earnings transcripts via Gemini and insert to BigQuery.

Two-step pipeline:
1. Load raw transcripts to temp table (earnings_transcripts_raw)
2. Process in batches of 15-20 with Gemini -> insert to speech_signals
"""

import json
import os
import uuid
import warnings
from datetime import datetime, timezone
from pathlib import Path

# Suppress Google auth warnings
warnings.filterwarnings("ignore", message="Your application has authenticated using end user credentials")
os.environ["GRPC_VERBOSITY"] = "ERROR"

from google import genai
from google.cloud import bigquery
from google.genai.types import GenerateContentConfig

PROJECT_ID = "ccibt-hack25ww7-736"
DATASET_ID = "market_volatility"
LOCATION = "us-central1"
BATCH_SIZE = 15  # Process 15 transcripts per batch

# Path to extracted transcripts
TRANSCRIPTS_DIR = Path(__file__).parent.parent.parent.parent / "ai_docs" / "Ideation" / "mktprediction_datasets" / "data" / "Transcripts"

# Table names
TEMP_TABLE = f"{PROJECT_ID}.{DATASET_ID}.earnings_transcripts_raw"
SPEECH_TABLE = f"{PROJECT_ID}.{DATASET_ID}.speech_signals"


def create_temp_table(bq_client: bigquery.Client) -> None:
    """Create temporary table for raw transcripts."""
    schema = [
        bigquery.SchemaField("id", "STRING"),
        bigquery.SchemaField("symbol", "STRING"),
        bigquery.SchemaField("event", "STRING"),
        bigquery.SchemaField("transcript", "STRING"),
        bigquery.SchemaField("file_path", "STRING"),
        bigquery.SchemaField("created_at", "TIMESTAMP"),
    ]

    table = bigquery.Table(TEMP_TABLE, schema=schema)

    try:
        bq_client.delete_table(TEMP_TABLE, not_found_ok=True)
        bq_client.create_table(table)
        print(f"Created temp table: {TEMP_TABLE}")
    except Exception as e:
        print(f"Error creating temp table: {e}")
        raise


def load_raw_transcripts(bq_client: bigquery.Client) -> int:
    """Step 1: Load all raw transcripts to temp table in batches."""
    print(f"\n=== STEP 1: Loading raw transcripts to temp table ===")
    print(f"Source: {TRANSCRIPTS_DIR}")
    print(f"Target: {TEMP_TABLE}\n")

    all_rows = []

    # Iterate through company folders and collect all rows
    for company_folder in TRANSCRIPTS_DIR.iterdir():
        if not company_folder.is_dir():
            continue

        symbol = company_folder.name
        print(f"Reading {symbol} transcripts...")

        for transcript_file in company_folder.glob("*.txt"):
            # Read transcript
            text = transcript_file.read_text(encoding="utf-8", errors="ignore")

            # Extract event name from filename
            event_name = transcript_file.stem.replace(f"-{symbol}", "") + " Earnings"

            row = {
                "id": str(uuid.uuid4()),
                "symbol": symbol,
                "event": event_name,
                "transcript": text[:100000],  # Limit to 100k chars
                "file_path": str(transcript_file),
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            all_rows.append(row)

    if not all_rows:
        print("No transcripts found!")
        return 0

    # Insert in batches of 10 (large transcripts = smaller batches)
    load_batch_size = 10
    total_loaded = 0
    print(f"\nInserting {len(all_rows)} rows in batches of {load_batch_size}...")

    for i in range(0, len(all_rows), load_batch_size):
        batch = all_rows[i:i + load_batch_size]
        batch_num = (i // load_batch_size) + 1
        print(f"  Loading batch {batch_num}: rows {i+1} to {i+len(batch)}...")

        errors = bq_client.insert_rows_json(TEMP_TABLE, batch)
        if errors:
            print(f"    Errors: {errors[:2]}...")
        else:
            total_loaded += len(batch)

    print(f"Successfully loaded {total_loaded}/{len(all_rows)} transcripts to temp table")
    return total_loaded


def extract_signals_with_gemini(transcript: str, symbol: str) -> dict:
    """Extract market signals from transcript using Gemini."""
    client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

    # Truncate to avoid token limits (keep first 15000 chars)
    truncated = transcript[:15000]

    prompt = f"""Analyze this earnings call transcript for {symbol} and extract market signals.

TRANSCRIPT:
{truncated}

Return a JSON object with these exact fields:
{{
    "tone": "bullish" or "bearish" or "neutral",
    "guidance": "1-2 sentence summary of forward-looking guidance",
    "topics": ["topic1", "topic2", "topic3"],
    "risks": ["risk1", "risk2"]
}}

Respond with ONLY the JSON object, no other text."""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=GenerateContentConfig(temperature=0.1, max_output_tokens=1024),
        )

        text = response.text.strip()
        # Remove markdown code blocks if present
        if text.startswith("```"):
            text = text.replace("```json", "").replace("```", "").strip()

        return json.loads(text)
    except Exception as e:
        print(f"    Warning: Gemini extraction failed: {e}")
        return {
            "tone": "neutral",
            "guidance": "Unable to extract guidance",
            "topics": [],
            "risks": [],
        }


def process_batch(bq_client: bigquery.Client, batch_num: int, offset: int) -> int:
    """Process a batch of transcripts from temp table."""
    print(f"\n--- Batch {batch_num}: Processing rows {offset+1} to {offset+BATCH_SIZE} ---")

    # Query batch from temp table
    query = f"""
    SELECT id, symbol, event, transcript, file_path
    FROM `{TEMP_TABLE}`
    ORDER BY symbol, event
    LIMIT {BATCH_SIZE} OFFSET {offset}
    """

    results = list(bq_client.query(query).result())

    if not results:
        return 0

    rows_to_insert = []

    for i, row in enumerate(results):
        print(f"  [{offset + i + 1}] {row.symbol} - {row.event}")

        # Process with Gemini
        signals = extract_signals_with_gemini(row.transcript, row.symbol)

        # Build speech_signals row
        speech_row = {
            "id": row.id,
            "symbol": row.symbol,
            "event": row.event,
            "transcript": row.transcript,  # Keep raw transcript
            "tone": signals.get("tone", "neutral"),
            "guidance": signals.get("guidance", ""),
            "topics": signals.get("topics", []),
            "risks": signals.get("risks", []),
            "processed_at": datetime.now(timezone.utc).isoformat(),
        }
        rows_to_insert.append(speech_row)

    # Insert batch to speech_signals
    if rows_to_insert:
        errors = bq_client.insert_rows_json(SPEECH_TABLE, rows_to_insert)
        if errors:
            print(f"  Errors: {errors[:2]}...")
            return 0
        print(f"  Inserted {len(rows_to_insert)} rows to speech_signals")

    return len(rows_to_insert)


def process_all_batches(bq_client: bigquery.Client, total_rows: int) -> int:
    """Step 2: Process all batches from temp table."""
    print(f"\n=== STEP 2: Processing with Gemini in batches of {BATCH_SIZE} ===")
    print(f"Total rows to process: {total_rows}")

    total_processed = 0
    batch_num = 1
    offset = 0

    while offset < total_rows:
        processed = process_batch(bq_client, batch_num, offset)
        if processed == 0:
            break
        total_processed += processed
        offset += BATCH_SIZE
        batch_num += 1
        print(f"  Progress: {total_processed}/{total_rows} ({100*total_processed//total_rows}%)")

    return total_processed


def delete_temp_table(bq_client: bigquery.Client) -> None:
    """Cleanup: Delete temp table."""
    print(f"\n=== CLEANUP: Deleting temp table ===")
    bq_client.delete_table(TEMP_TABLE, not_found_ok=True)
    print(f"Deleted: {TEMP_TABLE}")


def verify_results(bq_client: bigquery.Client) -> None:
    """Verify final results in speech_signals."""
    print(f"\n=== VERIFICATION ===")

    # Total count
    query = f"SELECT COUNT(*) as cnt FROM `{SPEECH_TABLE}`"
    result = list(bq_client.query(query).result())[0]
    print(f"Total rows in speech_signals: {result.cnt}")

    # Count by symbol
    query = f"""
    SELECT symbol, COUNT(*) as cnt
    FROM `{SPEECH_TABLE}`
    GROUP BY symbol
    ORDER BY symbol
    """
    print("\nRows per symbol:")
    for row in bq_client.query(query).result():
        print(f"  {row.symbol}: {row.cnt}")


def main() -> None:
    """Main entry point for two-step pipeline."""
    print("=" * 60)
    print("TRANSCRIPT INGESTION PIPELINE")
    print("=" * 60)

    bq_client = bigquery.Client(project=PROJECT_ID)

    # Step 1: Create temp table and load raw transcripts
    create_temp_table(bq_client)
    total_rows = load_raw_transcripts(bq_client)

    if total_rows == 0:
        print("No rows loaded. Exiting.")
        return

    # Step 2: Process in batches with Gemini
    processed = process_all_batches(bq_client, total_rows)

    # Verify results
    verify_results(bq_client)

    # Cleanup temp table
    delete_temp_table(bq_client)

    print("\n" + "=" * 60)
    print(f"COMPLETE: Processed {processed}/{total_rows} transcripts")
    print("=" * 60)


if __name__ == "__main__":
    main()
