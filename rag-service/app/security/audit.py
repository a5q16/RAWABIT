"""
Audit Logger — Data Poisoning Prevention
==========================================
Captures metadata, timestamps, and traceability for all
crowdsourced data submissions (suggest_profile actions).
Enables rollback of malicious inputs.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("rawabit.security.audit")


@dataclass
class AuditEntry:
    event_id: str
    timestamp: str
    event_type: str  # "suggest_profile", "chat_query", "data_modify"
    client_ip: str
    request_id: str
    user_agent: str
    payload_summary: str
    payload_hash: str
    severity: str  # "info", "warn", "critical"
    metadata: dict[str, Any]


class AuditLogger:
    """
    Structured audit logger for traceability.
    In production, ship entries to Supabase `audit_log` table.
    For now, logs to file + console.
    """

    def __init__(self):
        self._entries: list[dict] = []

    def _hash_payload(self, data: dict) -> str:
        """Simple content hash for change detection."""
        import hashlib
        raw = json.dumps(data, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    def log(
        self,
        event_type: str,
        client_ip: str,
        request_id: str,
        user_agent: str,
        payload: dict,
        severity: str = "info",
        metadata: dict[str, Any] | None = None,
    ) -> AuditEntry:
        entry = AuditEntry(
            event_id=uuid.uuid4().hex[:16],
            timestamp=datetime.now(timezone.utc).isoformat(),
            event_type=event_type,
            client_ip=client_ip,
            request_id=request_id,
            user_agent=user_agent,
            payload_summary=json.dumps(payload, ensure_ascii=False)[:500],
            payload_hash=self._hash_payload(payload),
            severity=severity,
            metadata=metadata or {},
        )
        self._entries.append(asdict(entry))
        logger.info(
            "[AUDIT] %s | %s | ip=%s | hash=%s | %s",
            entry.event_type,
            entry.severity,
            entry.client_ip,
            entry.payload_hash,
            entry.payload_summary[:120],
        )
        return entry

    def log_suggestion(
        self,
        client_ip: str,
        request_id: str,
        user_agent: str,
        suggestion: dict,
    ) -> AuditEntry:
        """Log a crowdsourced profile suggestion with full traceability."""
        return self.log(
            event_type="suggest_profile",
            client_ip=client_ip,
            request_id=request_id,
            user_agent=user_agent,
            payload=suggestion,
            severity="warn",
            metadata={
                "action": "crowdsourced_suggestion",
                "requires_approval": True,
                "rollback_possible": True,
            },
        )

    def log_chat(
        self,
        client_ip: str,
        request_id: str,
        user_agent: str,
        query: str,
        lang: str,
    ) -> AuditEntry:
        """Log a chat query for analytics and abuse detection."""
        return self.log(
            event_type="chat_query",
            client_ip=client_ip,
            request_id=request_id,
            user_agent=user_agent,
            payload={"query": query, "lang": lang},
            severity="info",
        )

    def get_entries(self, event_type: str | None = None, limit: int = 100) -> list[dict]:
        entries = self._entries
        if event_type:
            entries = [e for e in entries if e["event_type"] == event_type]
        return entries[-limit:]


# Global singleton
audit = AuditLogger()
