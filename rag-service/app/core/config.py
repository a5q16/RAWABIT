"""
Rawabit RAG Microservice — Application Settings
=================================================
Centralised configuration loaded from environment variables (.env file).
Uses pydantic-settings for type-safe validation and automatic casting.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    """
    All settings are loaded from environment variables or a `.env` file
    located at the project root (rag-service/.env).
    """

    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    supabase_url: str
    supabase_service_key: str

    groq_api_key: str

    sim_threshold: float = 0.72
    match_count: int = 5

    embedding_model: str = "intfloat/multilingual-e5-small"
    embedding_dim: int = 384

    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    rate_limit_rate: float = 10.0
    rate_limit_burst: int = 30
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"
    sandbox_ttl_minutes: int = 60
    sandbox_max_pending: int = 100

@lru_cache
def get_settings() -> Settings:
    """Return a cached singleton of the application settings."""
    return Settings()
