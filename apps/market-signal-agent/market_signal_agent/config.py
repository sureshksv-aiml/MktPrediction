"""Configuration for Market Signal Agent.

Uses Pydantic BaseSettings for type-safe configuration with environment variable loading.
"""

from pydantic_settings import BaseSettings


class MarketSignalConfig(BaseSettings):
    """Configuration settings for the Market Signal Agent."""

    # Agent settings
    agent_name: str = "market-signal-agent"

    # Google Cloud settings
    google_cloud_project: str = "ccibt-hack25ww7-736"
    google_cloud_location: str = "us-central1"

    # BigQuery settings
    bigquery_project: str | None = None  # Falls back to google_cloud_project
    bigquery_dataset: str = "market_volatility"

    # VIX thresholds for volatility regime classification
    vix_low: float = 15.0
    vix_normal: float = 20.0
    vix_elevated: float = 25.0
    vix_high: float = 30.0

    # Z-score anomaly threshold
    zscore_threshold: float = 2.0

    # Model settings
    model_name: str = "gemini-2.0-flash"

    # Database URL for session persistence (optional)
    database_url: str | None = None

    class Config:
        """Pydantic config."""

        env_file = ".env.local"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra env vars

    @property
    def bq_project(self) -> str:
        """Get BigQuery project ID, falling back to google_cloud_project."""
        return self.bigquery_project or self.google_cloud_project

    @property
    def bq_dataset_full(self) -> str:
        """Get fully qualified BigQuery dataset: project.dataset."""
        return f"{self.bq_project}.{self.bigquery_dataset}"

    def get_database_url(self) -> str:
        """Get database URL for session persistence."""
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is not set")
        return self.database_url


# Singleton config instance
config = MarketSignalConfig()
