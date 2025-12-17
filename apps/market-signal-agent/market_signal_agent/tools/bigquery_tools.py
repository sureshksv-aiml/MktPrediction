"""BigQuery toolset for market signal agents.

Provides a configured BigQueryToolset instance for querying market data.
Uses application default credentials. Supports both read-only and writable modes.
"""

import google.auth
from google.adk.tools.bigquery import BigQueryCredentialsConfig, BigQueryToolset
from google.adk.tools.bigquery.config import BigQueryToolConfig, WriteMode


def create_bigquery_toolset(writable: bool = False) -> BigQueryToolset:
    """Create a BigQuery toolset.

    Args:
        writable: If True, allows INSERT/UPDATE/DELETE operations.
                  If False (default), blocks write operations for safety.

    Returns:
        BigQueryToolset configured with application default credentials.
    """
    # Get application default credentials
    credentials, project = google.auth.default()

    # Configure with credentials
    credentials_config = BigQueryCredentialsConfig(credentials=credentials)

    # Set write mode based on parameter
    write_mode = WriteMode.ALLOWED if writable else WriteMode.BLOCKED
    tool_config = BigQueryToolConfig(write_mode=write_mode)

    return BigQueryToolset(
        credentials_config=credentials_config,
        bigquery_tool_config=tool_config,
    )


# Export shared instances for use by agents
bigquery_toolset = create_bigquery_toolset(writable=False)  # Read-only for queries
bigquery_toolset_writable = create_bigquery_toolset(writable=True)  # For persistence
