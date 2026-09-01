"""
Rawabit RAG Microservice — FastAPI Application
================================================
Security-hardened with AI-Driven SOAR methodology.

Endpoints:
  GET  /health          — liveness / readiness probe.
  POST /api/chat        — SSE chat endpoint (RAG pipeline).
  GET  /api/sandbox     — list pending approval actions.
  POST /api/sandbox/{id}/approve — approve a pending action.
  POST /api/sandbox/{id}/reject  — reject a pending action.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.core.config import get_settings
from app.services.embedder import embedder
from app.api.routes_chat import router as chat_router
from app.security.rate_limit import RateLimitMiddleware
from app.security.sanitizer import SanitizerMiddleware
from app.security.exceptions import register_exception_handlers
from app.security.sandbox import sandbox

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("rawabit.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    logger.info("=" * 60)
    logger.info("  Rawabit RAG Microservice — Starting up")
    logger.info("=" * 60)
    logger.info("Supabase URL : %s", settings.supabase_url)
    logger.info("Model        : %s", settings.embedding_model)
    logger.info("Threshold    : %.2f", settings.sim_threshold)
    logger.info("Rate Limit   : %.0f req/s (burst=%d)", settings.rate_limit_rate, settings.rate_limit_burst)
    logger.info("CORS Origins : %s", settings.allowed_origins)
    logger.info("-" * 60)

    embedder.warm(settings.embedding_model)

    logger.info("=" * 60)
    logger.info("  Startup complete — ready to serve requests")
    logger.info("=" * 60)

    yield

    logger.info("Rawabit RAG Microservice — Shutting down.")

app = FastAPI(
    title="Rawabit RAG Microservice",
    description="Retrieval-Augmented Generation service for the Algerian Competencies Platform.",
    version="0.1.0",
    lifespan=lifespan,
    default_response_class=ORJSONResponse,
    docs_url="/docs" if get_settings().debug else None,
    redoc_url="/redoc" if get_settings().debug else None,
)

app.add_middleware(SanitizerMiddleware)

settings = get_settings()
app.add_middleware(
    RateLimitMiddleware,
    rate=settings.rate_limit_rate,
    burst=settings.rate_limit_burst,
)

allowed = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

register_exception_handlers(app)

@app.get("/api/sandbox", tags=["security"])
async def list_pending_actions():
    """List all pending actions awaiting approval."""
    return {"pending": sandbox.get_pending()}

@app.post("/api/sandbox/{action_id}/approve", tags=["security"])
async def approve_action(action_id: str, reviewed_by: str = "admin"):
    """Approve a pending action (admin only)."""
    action = sandbox.approve(action_id, reviewed_by)
    if not action:
        return ORJSONResponse(status_code=404, content={"error": "action_not_found"})
    return {"status": "approved", "action_id": action_id, "reviewed_by": reviewed_by}

@app.post("/api/sandbox/{action_id}/reject", tags=["security"])
async def reject_action(action_id: str, reviewed_by: str = "admin"):
    """Reject a pending action (admin only)."""
    action = sandbox.reject(action_id, reviewed_by)
    if not action:
        return ORJSONResponse(status_code=404, content={"error": "action_not_found"})
    return {"status": "rejected", "action_id": action_id, "reviewed_by": reviewed_by}

app.include_router(chat_router)

@app.get("/health", tags=["system"])
async def health():
    """Liveness + readiness probe."""
    settings = get_settings()
    return {
        "status": "ok" if embedder.is_ready else "warming",
        "service": "rawabit-rag",
        "version": app.version,
        "security": {
            "rate_limit": f"{settings.rate_limit_rate} req/s",
            "cors_origins": allowed,
            "docs_enabled": settings.debug,
        },
        "embedder": {
            "model": settings.embedding_model,
            "dimension": embedder.dimension if embedder.is_ready else None,
            "ready": embedder.is_ready,
        },
        "config": {
            "sim_threshold": settings.sim_threshold,
            "match_count": settings.match_count,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
