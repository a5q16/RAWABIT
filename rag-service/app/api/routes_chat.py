"""
Chat endpoint — SSE contract for the Rawabit chatbot.

POST /api/chat
Request:  {"query": "string", "lang": "string"}
Response: text/event-stream (SSE)

Event sequence:
  1. event: meta     — status indicator ("searching" → "generating")
  2. event: token    — LLM tokens streamed one-by-one
  3. event: sources  — ranked citation list (always last event)
  4. event: action   — AI-suggested action (e.g. suggest_profile)
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.generator import stream_rag_response, _sse
from app.security.audit import audit
from app.security.sandbox import sandbox

logger = logging.getLogger("rawabit.api.chat")

router = APIRouter(prefix="/api", tags=["chat"])

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="User query")
    lang: str = Field(default="fr", pattern="^(ar|fr|en)$", description="Response language: ar, fr, en")

class SuggestProfileRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, description="Full name (primary language)")
    name_ar: str | None = Field(default=None, max_length=200, description="Arabic name")
    name_fr: str | None = Field(default=None, max_length=200, description="French name")
    name_en: str | None = Field(default=None, max_length=200, description="English name")
    specialty: str = Field(..., min_length=2, max_length=200, description="Specialty (primary language)")
    specialty_ar: str | None = Field(default=None, max_length=200, description="Arabic specialty")
    specialty_fr: str | None = Field(default=None, max_length=200, description="French specialty")
    specialty_en: str | None = Field(default=None, max_length=200, description="English specialty")
    wilaya: str = Field(..., min_length=2, max_length=100, description="Wilaya name")
    company: str | None = Field(default=None, max_length=200)
    company_ar: str | None = Field(default=None, max_length=200)
    company_fr: str | None = Field(default=None, max_length=200)
    company_en: str | None = Field(default=None, max_length=200)
    university: str | None = Field(default=None, max_length=200)
    university_ar: str | None = Field(default=None, max_length=200)
    university_fr: str | None = Field(default=None, max_length=200)
    university_en: str | None = Field(default=None, max_length=200)
    reason: str = Field(..., min_length=10, max_length=2000, description="Why this person should be added")
    reason_ar: str | None = Field(default=None, max_length=2000)
    reason_fr: str | None = Field(default=None, max_length=2000)
    reason_en: str | None = Field(default=None, max_length=2000)

@router.post("/chat")
async def chat(req: ChatRequest, request: Request):
    """
    POST /api/chat — Server-Sent Events chat endpoint.

    The frontend must read the stream in this order:
      event: meta     → {"status": "searching"} | {"status": "generating"}
      event: token    → "word " (repeated, N tokens)
      event: sources  → [{"n":1, "name":"...", "url":"...", "score":5}]
      event: action   → {"type": "suggest_profile"} (on fallback)
      event: error    → {"message":"...", "code":"..."}  (on failure, stream ends)
    """
    request_id = uuid.uuid4().hex[:12]
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
    user_agent = request.headers.get("user-agent", "unknown")

    audit.log_chat(client_ip, request_id, user_agent, req.query, req.lang)
    logger.info("[%s] chat request lang=%s query=%r", request_id, req.lang, req.query[:80])

    async def event_stream() -> AsyncGenerator[str, None]:
        t0 = time.perf_counter()
        try:
            async for event in stream_rag_response(req.query, req.lang):
                yield event
        except Exception as exc:
            logger.exception("[%s] unexpected stream error", request_id)
            yield _sse("error", {"message": "Internal error", "code": "internal_error"})
        finally:
            elapsed = time.perf_counter() - t0
            logger.info("[%s] stream complete in %.2fs", request_id, elapsed)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Request-Id": request_id,
        },
    )

@router.post("/suggest")
async def suggest_profile(req: SuggestProfileRequest, request: Request):
    """
    POST /api/suggest — Submit a profile suggestion.
    Goes through the sandbox approval gate (dry-run → pending → approve/reject).
    """
    request_id = uuid.uuid4().hex[:12]
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
    user_agent = request.headers.get("user-agent", "unknown")

    suggestion = req.model_dump()

    audit.log_suggestion(client_ip, request_id, user_agent, suggestion)

    try:
        action = sandbox.submit(
            action_type="suggest_profile",
            payload=suggestion,
            client_ip=client_ip,
            request_id=request_id,
        )
    except RuntimeError as e:
        return {"error": "sandbox_overloaded", "message": str(e)}

    return {
        "status": "pending_approval",
        "action_id": action.action_id,
        "dry_run": action.dry_run_result,
        "expires_at": action.expires_at,
        "message": "Your suggestion has been submitted for admin review.",
    }
