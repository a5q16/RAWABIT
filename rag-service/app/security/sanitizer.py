"""
Response Sanitizer — Leak Prevention Middleware
================================================
Intercepts ALL HTTP responses and strips any leaked
infrastructure details (API keys, tokens, internal URLs).
"""

from __future__ import annotations

import re
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, StreamingResponse

logger = logging.getLogger("rawabit.security.sanitizer")

_LEAK_PATTERNS = [

    (re.compile(r"gsk_[A-Za-z0-9]{20,}"), "gsk_***REDACTED***"),

    (re.compile(r"eyJ[A-Za-z0-9_-]{50,}\.eyJ[A-Za-z0-9_-]{50,}\.[A-Za-z0-9_-]+"), "eyJ***REDACTED***"),

    (re.compile(r"sb_publishable_[A-Za-z0-9]{20,}"), "sb_publishable_***REDACTED***"),

    (re.compile(r"sb_secret_[A-Za-z0-9]{20,}"), "sb_secret_***REDACTED***"),

    (re.compile(r"sbp_[A-Za-z0-9]{20,}"), "sbp_***REDACTED***"),

    (re.compile(r"127\.0\.0\.1:\d+"), "***LOCALHOST***"),
    (re.compile(r"localhost:\d+"), "***LOCALHOST***"),

    (re.compile(r"https://[a-z0-9]+\.supabase\.co"), "https://***REDACTED***.supabase.co"),
]

_SCAN_TYPES = {"application/json", "text/event-stream", "text/plain", "text/html"}

def _redact(text: str) -> str:
    """Apply all redaction patterns to a string."""
    redacted = text
    for pattern, replacement in _LEAK_PATTERNS:
        redacted = pattern.sub(replacement, redacted)
    return redacted

class SanitizerMiddleware(BaseHTTPMiddleware):
    """
    Scans every response body for leaked secrets.
    For streaming responses, buffers and scans the full output.
    """

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        content_type = response.headers.get("content-type", "")
        if not any(t in content_type for t in _SCAN_TYPES):
            return response

        if isinstance(response, StreamingResponse):
            return await self._sanitize_stream(response)

        if hasattr(response, "body"):
            body = response.body.decode("utf-8", errors="replace")
            redacted = _redact(body)
            if redacted != body:
                logger.warning("LEAK PREVENTED in %s — secrets redacted", request.url.path)
            return Response(
                content=redacted.encode("utf-8"),
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )

        return response

    async def _sanitize_stream(self, response: StreamingResponse) -> StreamingResponse:
        """Buffer a streaming response, scan for leaks, then re-stream."""
        chunks = []
        async for chunk in response.body_iterator:
            if isinstance(chunk, bytes):
                chunks.append(chunk.decode("utf-8", errors="replace"))
            else:
                chunks.append(str(chunk))

        full_text = "".join(chunks)
        redacted = _redact(full_text)

        if redacted != full_text:
            logger.warning("LEAK PREVENTED in streaming response — secrets redacted")

        async def _re_stream():
            yield redacted

        return StreamingResponse(
            _re_stream(),
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type,
        )
