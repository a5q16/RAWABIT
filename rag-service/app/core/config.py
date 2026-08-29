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

# Project root = rag-service/ (two levels above this file).
# Resolved absolutely so the app works no matter the current working directory.
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

    # ── Supabase ────────────────────────────────────────────────
    supabase_url: str
    supabase_service_key: str

    # ── Groq Cloud ────────────────────────────────────────────────
    groq_api_key: str

    # ── RAG Parameters ──────────────────────────────────────────
    sim_threshold: float = 0.72
    match_count: int = 5

    # ── Embedding Model ─────────────────────────────────────────
    embedding_model: str = "intfloat/multilingual-e5-small"
    embedding_dim: int = 384

    # ── Server ──────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    # ── Security ────────────────────────────────────────────────
    rate_limit_rate: float = 10.0       # requests per second (sustained)
    rate_limit_burst: int = 30          # max burst tokens
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"
    sandbox_ttl_minutes: int = 60       # approval gate TTL
    sandbox_max_pending: int = 100      # max pending actions


@lru_cache
def get_settings() -> Settings:
    """Return a cached singleton of the application settings."""
    return Settings()  # type: ignore[call-arg]
