"""Load CSV files to BigQuery market_volatility dataset."""

import os
from pathlib import Path

from google.cloud import bigquery

PROJECT_ID = "ccibt-hack25ww7-736"
DATASET_ID = "market_volatility"
DATA_DIR = Path(__file__).parent.parent.parent.parent / "ai_docs" / "Ideation" / "mktprediction_datasets" / "data"

# Mapping of CSV files to table names
CSV_TO_TABLE = {
    "datasets_uc4-market-activity-prediction-agent_30_yr_stock_market_data.csv": "market_30yr",
    "datasets_uc4-market-activity-prediction-agent_indexData.csv": "index_data",
    "datasets_uc4-market-activity-prediction-agent_communications.csv": "fed_communications",
    "datasets_uc4-market-activity-prediction-agent_acquisitions_update_2021.csv": "acquisitions",
    "datasets_uc4-market-activity-prediction-agent_US_Economic_Indicators.csv": "economic_indicators",
    "datasets_uc4-market-activity-prediction-agent_stock_news.csv": "stock_news",
    "datasets_uc4-market-activity-prediction-agent_analyst_ratings_processed (1).csv": "analyst_ratings",
}


def load_csv_to_bigquery(csv_path: Path, table_name: str, client: bigquery.Client) -> int:
    """Load a CSV file to BigQuery table."""
    table_id = f"{PROJECT_ID}.{DATASET_ID}.{table_name}"

    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.CSV,
        skip_leading_rows=1,  # Skip header row
        autodetect=True,  # Auto-detect schema
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,  # Overwrite if exists
        column_name_character_map="V2",  # Handle special chars in column names
        max_bad_records=1000,  # Allow some bad records
        allow_quoted_newlines=True,  # Handle newlines in quoted fields
        allow_jagged_rows=True,  # Handle rows with missing columns
    )

    print(f"Loading {csv_path.name} -> {table_name}...")

    with open(csv_path, "rb") as f:
        job = client.load_table_from_file(f, table_id, job_config=job_config)

    job.result()  # Wait for job to complete

    table = client.get_table(table_id)
    print(f"  -> Loaded {table.num_rows:,} rows")
    return table.num_rows


def main() -> None:
    """Load all CSV files to BigQuery."""
    client = bigquery.Client(project=PROJECT_ID)

    print(f"Loading CSVs from: {DATA_DIR}")
    print(f"Target dataset: {PROJECT_ID}.{DATASET_ID}\n")

    total_rows = 0
    for csv_name, table_name in CSV_TO_TABLE.items():
        csv_path = DATA_DIR / csv_name
        if csv_path.exists():
            rows = load_csv_to_bigquery(csv_path, table_name, client)
            total_rows += rows
        else:
            print(f"WARNING: {csv_name} not found!")

    print(f"\nTotal rows loaded: {total_rows:,}")


if __name__ == "__main__":
    main()
