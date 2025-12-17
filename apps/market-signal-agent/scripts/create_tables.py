"""Create BigQuery tables for speech_signals and output tables."""

from google.cloud import bigquery

PROJECT_ID = "ccibt-hack25ww7-736"
DATASET_ID = "market_volatility"


def create_speech_signals_table(client: bigquery.Client) -> None:
    """Create speech_signals table for processed earnings transcripts."""
    table_id = f"{PROJECT_ID}.{DATASET_ID}.speech_signals"

    schema = [
        bigquery.SchemaField("id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("symbol", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("event", "STRING"),
        bigquery.SchemaField("transcript", "STRING"),
        bigquery.SchemaField("tone", "STRING"),  # bullish, neutral, bearish
        bigquery.SchemaField("guidance", "STRING"),
        bigquery.SchemaField("topics", "STRING", mode="REPEATED"),  # ARRAY<STRING>
        bigquery.SchemaField("risks", "STRING", mode="REPEATED"),  # ARRAY<STRING>
        bigquery.SchemaField("processed_at", "TIMESTAMP"),
    ]

    table = bigquery.Table(table_id, schema=schema)
    table = client.create_table(table, exists_ok=True)
    print(f"Created table: {table_id}")


def create_volatility_forecasts_table(client: bigquery.Client) -> None:
    """Create volatility_forecasts output table."""
    table_id = f"{PROJECT_ID}.{DATASET_ID}.volatility_forecasts"

    schema = [
        bigquery.SchemaField("id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("symbol", "STRING"),
        bigquery.SchemaField("forecast_date", "DATE"),
        bigquery.SchemaField("volatility_1d", "FLOAT64"),
        bigquery.SchemaField("volatility_5d", "FLOAT64"),
        bigquery.SchemaField("current_vix", "FLOAT64"),
        bigquery.SchemaField("volatility_regime", "STRING"),  # low, normal, high, extreme
        bigquery.SchemaField("confidence", "FLOAT64"),
        bigquery.SchemaField("computed_at", "TIMESTAMP"),
    ]

    table = bigquery.Table(table_id, schema=schema)
    table = client.create_table(table, exists_ok=True)
    print(f"Created table: {table_id}")


def create_alerts_table(client: bigquery.Client) -> None:
    """Create alerts output table."""
    table_id = f"{PROJECT_ID}.{DATASET_ID}.alerts"

    schema = [
        bigquery.SchemaField("id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("alert_type", "STRING"),
        bigquery.SchemaField("severity", "STRING"),  # low, medium, high, critical
        bigquery.SchemaField("symbol", "STRING"),
        bigquery.SchemaField("message", "STRING"),
        bigquery.SchemaField("vix_value", "FLOAT64"),
        bigquery.SchemaField("triggered_at", "TIMESTAMP"),
        bigquery.SchemaField("is_active", "BOOLEAN"),
    ]

    table = bigquery.Table(table_id, schema=schema)
    table = client.create_table(table, exists_ok=True)
    print(f"Created table: {table_id}")


def main() -> None:
    """Create all required tables."""
    client = bigquery.Client(project=PROJECT_ID)

    print(f"Creating tables in {PROJECT_ID}.{DATASET_ID}\n")

    create_speech_signals_table(client)
    create_volatility_forecasts_table(client)
    create_alerts_table(client)

    print("\nAll tables created successfully!")


if __name__ == "__main__":
    main()
