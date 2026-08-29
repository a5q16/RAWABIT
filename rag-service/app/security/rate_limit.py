"""
Rate Limiter — Token Bucket per IP
====================================
Protects Groq API limits and FastAPI from DDoS/abuse.
Uses in-memory token bucket (no Redis dependency).
"""

from __future__ import annotations

import time
import logging
from collections import defaultdict
from dataclasses import dataclass, field

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger("rawabit.security.ratelimit")


@dataclass
class _Bucket:
    tokens: float
    last_refill: float
    capacity: float
    refill_rate: float  # tokens per second


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Token-bucket rate limiter applied per client IP.

    Config:
        rate:      requests per second (sustained)
        burst:     max tokens (burst capacity)
        whitelist: paths exempt from limiting (e.g. /health)
    """

    def __init__(self, app, rate: float = 10.0, burst: int = 30, whitelist: list[str] | None = None):
        super().__init__(app)
        self.rate = rate
        self.burst = burst
        self.whitelist = whitelist or ["/health", "/docs", "/redoc", "/openapi.json"]
        self._buckets: dict[str, _Bucket] = {}
        self._last_cleanup = time.monotonic()

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        return request.client.host if request.client else "unknown"

    def _get_bucket(self, key: str) -> _Bucket:
        now = time.monotonic()
        if key not in self._buckets:
            self._buckets[key] = _Bucket(
                tokens=self.burst,
                last_refill=now,
                capacity=self.burst,
                refill_rate=self.rate,
            )
        bucket = self._buckets[key]
        elapsed = now - bucket.last_refill
        bucket.tokens = min(bucket.capacity, bucket.tokens + elapsed * bucket.refill_rate)
        bucket.last_refill = now
        return bucket

    def _cleanup(self):
        now = time.monotonic()
        if now - self._last_cleanup < 60:
            return
        self._last_cleanup = now
        stale_keys = [k for k, b in self._buckets.items() if now - b.last_refill > 300]
        for k in stale_keys:
            del self._buckets[k]
        if stale_keys:
            logger.info("Cleaned up %d stale rate-limit buckets", len(stale_keys))

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if any(path.startswith(w) for w in self.whitelist):
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        bucket = self._get_bucket(client_ip)

        if bucket.tokens < 1:
            retry_after = (1 - bucket.tokens) / bucket.refill_rate
            logger.warning("Rate limit exceeded for %s (path=%s)", client_ip, path)
            return JSONResponse(
                status_code=429,
                content={"error": "rate_limit_exceeded", "retry_after": round(retry_after, 1)},
                headers={"Retry-After": str(int(retry_after) + 1)},
            )

        bucket.tokens -= 1
        self._cleanup()
        return await call_next(request)
