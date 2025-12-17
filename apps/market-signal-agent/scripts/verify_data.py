"""Verify data loading - check all table row counts."""

from google.cloud import bigquery

PROJECT_ID = "ccibt-hack25ww7-736"
DATASET_ID = "market_volatility"


def verify_tables() -> None:
    """Verify all tables have been loaded correctly."""
    client = bigquery.Client(project=PROJECT_ID)

    tables = [
        "market_30yr",
        "index_data",
        "fed_communications",
        "acquisitions",
        "economic_indicators",
        "stock_news",
        "analyst_ratings",
        "speech_signals",
        "volatility_forecasts",
        "alerts",
    ]

    print(f"Verifying tables in {PROJECT_ID}.{DATASET_ID}\n")
    print(f"{'Table':<25} {'Row Count':>15} {'Status'}")
    print("-" * 50)

    total_rows = 0
    for table_name in tables:
        try:
            table_id = f"{PROJECT_ID}.{DATASET_ID}.{table_name}"
            table = client.get_table(table_id)
            row_count = table.num_rows
            total_rows += row_count

            # Determine status
            if table_name in ["volatility_forecasts", "alerts"]:
                status = "OK (output table)"
            elif row_count > 0:
                status = "OK"
            else:
                status = "EMPTY"

            print(f"{table_name:<25} {row_count:>15,} {status}")
        except Exception as e:
            print(f"{table_name:<25} {'N/A':>15} ERROR: {e}")

    print("-" * 50)
    print(f"{'TOTAL':<25} {total_rows:>15,}")


def test_vix_query() -> None:
    """Test VIX query to verify market_30yr data."""
    client = bigquery.Client(project=PROJECT_ID)

    # Column name with V2 character map: "CBOE Volitility (^VIX)" -> "CBOE Volitility __VIX_"
    query = f"""
    SELECT Date, `CBOE Volitility __VIX_` as VIX
    FROM `{PROJECT_ID}.{DATASET_ID}.market_30yr`
    WHERE `CBOE Volitility __VIX_` IS NOT NULL
    ORDER BY Date DESC
    LIMIT 5
    """

    print("\n\nTest VIX Query (Latest 5 records):")
    print("-" * 40)

    results = client.query(query).result()
    for row in results:
        print(f"  {row.Date}  VIX: {row.VIX:.2f}")


def test_speech_signals() -> None:
    """Test speech_signals to verify Gemini processing."""
    client = bigquery.Client(project=PROJECT_ID)

    query = f"""
    SELECT symbol, event, tone, guidance
    FROM `{PROJECT_ID}.{DATASET_ID}.speech_signals`
    ORDER BY processed_at DESC
    LIMIT 3
    """

    print("\n\nTest Speech Signals (Latest 3 records):")
    print("-" * 60)

    results = client.query(query).result()
    for row in results:
        print(f"  {row.symbol} | {row.event}")
        print(f"    Tone: {row.tone}")
        print(f"    Guidance: {row.guidance[:80]}...")
        print()


if __name__ == "__main__":
    verify_tables()
    test_vix_query()
    test_speech_signals()
