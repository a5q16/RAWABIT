"""
Global Exception Handler — Zero-Leak Error Responses
======================================================
Catches ALL unhandled exceptions and returns a safe
error response that never exposes internal details.
"""

from __future__ import annotations

import logging
import traceback
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.responses import ORJSONResponse

logger = logging.getLogger("rawabit.security.exceptions")

_SENSITIVE = [
    "groq_api_key", "supabase_service_key", "sbp_",
    "gsk_", "eyJ", "password", "secret", "token",
    "Traceback", "File \"", "line ", "import ",
    "ConnectionRefused", "Errno", "OSError",
]

def _sanitize_error_message(msg: str) -> str:
    """Remove any sensitive patterns from an error message."""
    sanitized = msg
    for pattern in _SENSITIVE:
        if pattern.lower() in sanitized.lower():
            sanitized = "Internal error — see server logs for details."
            break

    import re
    sanitized = re.sub(r'[A-Z]:\\[^\s"\']+', '[PATH]', sanitized)
    sanitized = re.sub(r'/home/[^\s"\']+', '[PATH]', sanitized)
    sanitized = re.sub(r'/var/[^\s"\']+', '[PATH]', sanitized)
    return sanitized

async def global_exception_handler(request: Request, exc: Exception) -> ORJSONResponse:
    """Catch-all handler for unhandled exceptions."""
    error_id = uuid.uuid4().hex[:12]
    safe_path = request.url.path

    logger.exception(
        "[%s] Unhandled exception on %s %s",
        error_id, request.method, safe_path,
    )

    tb = traceback.format_exception(type(exc), exc, exc.__traceback__)
    logger.error("[%s] Full traceback:\n%s", error_id, "".join(tb))

    return ORJSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred. Please try again later.",
            "error_id": error_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        headers={"X-Error-Id": error_id},
    )

async def http_exception_handler(request: Request, exc) -> ORJSONResponse:
    """Handler for HTTPException that sanitizes the message."""
    error_id = uuid.uuid4().hex[:12]
    safe_msg = _sanitize_error_message(str(exc.detail))

    logger.warning(
        "[%s] HTTP %s on %s — %s",
        error_id, exc.status_code, request.url.path, safe_msg,
    )

    return ORJSONResponse(
        status_code=exc.status_code,
        content={
            "error": "http_error",
            "message": safe_msg,
            "error_id": error_id,
        },
    )

def register_exception_handlers(app: FastAPI):
    """Register all exception handlers on the FastAPI app."""
    from fastapi.exceptions import HTTPException as FastAPIHTTPException

    app.add_exception_handler(Exception, global_exception_handler)
    app.add_exception_handler(FastAPIHTTPException, http_exception_handler)
    logger.info("Global exception handlers registered (zero-leak mode)")
