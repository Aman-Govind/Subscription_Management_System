"""
Application configuration.

Reads settings from environment variables (or a .env file via python-dotenv).
All sensitive values (DB password, secret keys) must live in .env — never hardcoded.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Every attribute here can be overridden by an environment variable
    with the same name (case-insensitive).

    Example: APP_NAME can be set via  export APP_NAME="My App"
    or by adding  APP_NAME=My App  to the .env file.
    """

    # ── Application ───────────────────────────────────────────────────────────
    APP_NAME: str = "Subscription Management API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins for the React frontend.
    # Example in .env:  ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # ── Database (not connected yet — placeholder for Stage 5) ────────────────
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "subscription_db"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""

    # ── Security (placeholder for Stage 7 — Auth) ────────────────────────────
    SECRET_KEY: str = "change-this-before-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # ── Pydantic-settings: load from a .env file automatically ───────────────
    model_config = SettingsConfigDict(
        env_file=".env",          # looks for .env relative to where uvicorn is started
        env_file_encoding="utf-8",
        case_sensitive=False,     # APP_NAME == app_name == App_Name
        extra="ignore",           # unknown keys in .env are silently ignored
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        """Split the comma-separated ALLOWED_ORIGINS string into a Python list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def database_url(self) -> str:
        """
        Build a SQLAlchemy-compatible MySQL connection string.
        Not used yet — will be wired up when Member 1 delivers the DB models.
        """
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


# Single shared instance — import this everywhere instead of re-creating Settings().
settings = Settings()
