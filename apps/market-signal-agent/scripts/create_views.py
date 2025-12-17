"""Create BigQuery views with clean column names.

This script creates views that alias the messy V2 character-mapped column names
to clean, lowercase names for easier querying by agents.

Run once after data loading:
    uv run python scripts/create_views.py
"""

from google.cloud import bigquery

PROJECT_ID = "ccibt-hack25ww7-736"
DATASET_ID = "market_volatility"


def create_views() -> None:
    """Create BigQuery views with clean column names."""
    client = bigquery.Client(project=PROJECT_ID)

    views = {
        "market_30yr_v": """
            CREATE OR REPLACE VIEW `{project}.{dataset}.market_30yr_v` AS
            SELECT
                Date as date,
                `S&P500 __GSPC_` as sp500,
                `Nasdaq __IXIC_` as nasdaq,
                `Dow Jones __DJI_` as dow,
                `Russell 2000 __RUT_` as russell_2000,
                `CBOE Volitility __VIX_` as vix,
                `Treasury Yield 10 Years __TNX_` as treasury_10y,
                `Treasury Yield 5 Years __FVX_` as treasury_5y,
                `Gold _GC=F_` as gold,
                `Crude Oil-WTI _CL=F_` as oil_wti
            FROM `{project}.{dataset}.market_30yr`
        """,
        "index_data_v": """
            CREATE OR REPLACE VIEW `{project}.{dataset}.index_data_v` AS
            SELECT
                `Index` as symbol,
                Date as date,
                SAFE_CAST(Open AS FLOAT64) as open,
                SAFE_CAST(High AS FLOAT64) as high,
                SAFE_CAST(Low AS FLOAT64) as low,
                SAFE_CAST(Close AS FLOAT64) as close,
                SAFE_CAST(`Adj Close` AS FLOAT64) as adj_close,
                SAFE_CAST(Volume AS INT64) as volume
            FROM `{project}.{dataset}.index_data`
        """,
        "fed_communications_v": """
            CREATE OR REPLACE VIEW `{project}.{dataset}.fed_communications_v` AS
            SELECT
                Date as date,
                `Release Date` as release_date,
                Type as type,
                Text as text
            FROM `{project}.{dataset}.fed_communications`
        """,
    }

    print(f"Creating views in {PROJECT_ID}.{DATASET_ID}\n")

    for view_name, view_sql in views.items():
        sql = view_sql.format(project=PROJECT_ID, dataset=DATASET_ID)
        print(f"Creating view: {view_name}...")

        try:
            client.query(sql).result()
            print(f"  -> Created successfully")
        except Exception as e:
            print(f"  -> ERROR: {e}")

    print("\nDone. Views created:")
    for view_name in views:
        print(f"  - {DATASET_ID}.{view_name}")


def verify_views() -> None:
    """Verify views work by running test queries."""
    client = bigquery.Client(project=PROJECT_ID)

    print("\n\nVerifying views with sample queries:\n")

    # Test market_30yr_v
    print("1. market_30yr_v (latest VIX):")
    query = f"""
        SELECT date, vix, sp500
        FROM `{PROJECT_ID}.{DATASET_ID}.market_30yr_v`
        WHERE vix IS NOT NULL
        ORDER BY date DESC
        LIMIT 3
    """
    for row in client.query(query).result():
        print(f"   {row.date} | VIX: {row.vix:.2f} | S&P500: {row.sp500:.2f}")

    # Test index_data_v
    print("\n2. index_data_v (latest index data):")
    query = f"""
        SELECT symbol, date, close, volume
        FROM `{PROJECT_ID}.{DATASET_ID}.index_data_v`
        WHERE close IS NOT NULL
        ORDER BY date DESC
        LIMIT 3
    """
    for row in client.query(query).result():
        close_val = row.close if row.close else 0
        print(f"   {row.symbol} | {row.date} | Close: {close_val:.2f}")

    # Test fed_communications_v
    print("\n3. fed_communications_v (latest Fed communications):")
    query = f"""
        SELECT date, type, SUBSTR(text, 1, 50) as summary
        FROM `{PROJECT_ID}.{DATASET_ID}.fed_communications_v`
        WHERE type = 'Minute'
        ORDER BY date DESC
        LIMIT 3
    """
    for row in client.query(query).result():
        print(f"   {row.date} | {row.type} | {row.summary}...")


if __name__ == "__main__":
    create_views()
    verify_views()
