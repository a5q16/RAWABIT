"""
Sandbox — AI Action Approval Gate (Antigravity Methodology)
=============================================================
The AI must NEVER execute disruptive actions automatically.
All crowdsourced data and AI-suggested mutations pass through
a dry-run/approval gate before reaching the database.
"""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Any

logger = logging.getLogger("rawabit.security.sandbox")


class ActionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


@dataclass
class PendingAction:
    action_id: str
    action_type: str
    payload: dict[str, Any]
    client_ip: str
    request_id: str
    created_at: str
    expires_at: str
    status: ActionStatus = ActionStatus.PENDING
    reviewed_by: str | None = None
    reviewed_at: str | None = None
    dry_run_result: dict[str, Any] | None = None


class SandboxGate:
    """
    Approval gate for AI-suggested actions.
    Every mutation (profile suggestion, data modification) is:
      1. Simulated (dry-run) to show impact
      2. Stored as a pending action
      3. Only executed after explicit approval
    """

    def __init__(self, ttl_minutes: int = 60, max_pending: int = 100):
        self._pending: dict[str, PendingAction] = {}
        self.ttl_minutes = ttl_minutes
        self.max_pending = max_pending

    def _cleanup_expired(self):
        now = datetime.now(timezone.utc)
        expired = [
            aid for aid, action in self._pending.items()
            if datetime.fromisoformat(action.expires_at) < now
        ]
        for aid in expired:
            self._pending[aid].status = ActionStatus.EXPIRED
            logger.info("Action %s expired", aid)

    def dry_run(self, action_type: str, payload: dict, client_ip: str, request_id: str) -> dict:
        """
        Simulate an action without executing it.
        Returns a dry-run report showing what WOULD happen.
        """
        self._cleanup_expired()

        report = {
            "dry_run": True,
            "action_type": action_type,
            "would_affect": [],
            "warnings": [],
            "risk_level": "low",
        }

        if action_type == "suggest_profile":
            name = payload.get("name", "Unknown")
            report["would_affect"] = ["person", "academic_career", "professional_career"]
            report["warnings"] = [
                f"Profile for '{name}' would be inserted into the database.",
                "This action requires admin approval before execution.",
                "All data will be logged for audit and rollback.",
            ]
            report["risk_level"] = "medium"
            report["estimated_changes"] = {
                "new_rows": 3,
                "tables_affected": ["person", "academic_career", "professional_career"],
            }

        elif action_type == "modify_profile":
            person_id = payload.get("person_id", "unknown")
            report["would_affect"] = ["person"]
            report["warnings"] = [
                f"Profile {person_id} would be modified.",
                "Changes will be versioned for rollback.",
            ]
            report["risk_level"] = "high"
            report["estimated_changes"] = {
                "modified_rows": 1,
                "tables_affected": ["person"],
            }

        elif action_type == "delete_profile":
            report["would_affect"] = ["person", "academic_career", "professional_career", "ai_chunks"]
            report["warnings"] = [
                "DESTRUCTIVE ACTION: Profile and all related data would be deleted.",
                "This action REQUIRES explicit admin approval.",
                "A backup snapshot will be created before execution.",
            ]
            report["risk_level"] = "critical"
            report["estimated_changes"] = {
                "deleted_rows": "all related",
                "tables_affected": ["person", "academic_career", "professional_career", "ai_chunks"],
            }

        else:
            report["warnings"] = [f"Unknown action type: {action_type}"]
            report["risk_level"] = "unknown"

        logger.info(
            "[SANDBRY] dry_run type=%s risk=%s ip=%s request=%s",
            action_type, report["risk_level"], client_ip, request_id,
        )
        return report

    def submit(self, action_type: str, payload: dict, client_ip: str, request_id: str) -> PendingAction:
        """Submit an action for approval (creates a pending action)."""
        self._cleanup_expired()

        if len(self._pending) >= self.max_pending:
            raise RuntimeError("Too many pending actions. Wait for some to expire or be reviewed.")

        action_id = uuid.uuid4().hex[:12]
        now = datetime.now(timezone.utc)
        expires = now + timedelta(minutes=self.ttl_minutes)

        # Run dry-run first
        dry_run = self.dry_run(action_type, payload, client_ip, request_id)

        action = PendingAction(
            action_id=action_id,
            action_type=action_type,
            payload=payload,
            client_ip=client_ip,
            request_id=request_id,
            created_at=now.isoformat(),
            expires_at=expires.isoformat(),
            dry_run_result=dry_run,
        )

        self._pending[action_id] = action
        logger.info(
            "[SANDBOX] Submitted action %s type=%s risk=%s expires=%s",
            action_id, action_type, dry_run["risk_level"], action.expires_at,
        )
        return action

    def approve(self, action_id: str, reviewed_by: str = "admin") -> PendingAction | None:
        action = self._pending.get(action_id)
        if not action:
            return None
        if action.status != ActionStatus.PENDING:
            return action
        action.status = ActionStatus.APPROVED
        action.reviewed_by = reviewed_by
        action.reviewed_at = datetime.now(timezone.utc).isoformat()
        logger.info("[SANDBOX] Approved action %s by %s", action_id, reviewed_by)
        return action

    def reject(self, action_id: str, reviewed_by: str = "admin") -> PendingAction | None:
        action = self._pending.get(action_id)
        if not action:
            return None
        action.status = ActionStatus.REJECTED
        action.reviewed_by = reviewed_by
        action.reviewed_at = datetime.now(timezone.utc).isoformat()
        logger.info("[SANDBOX] Rejected action %s by %s", action_id, reviewed_by)
        return action

    def get_pending(self) -> list[dict]:
        self._cleanup_expired()
        return [
            {
                "action_id": a.action_id,
                "action_type": a.action_type,
                "status": a.status.value,
                "client_ip": a.client_ip,
                "created_at": a.created_at,
                "expires_at": a.expires_at,
                "dry_run": a.dry_run_result,
                "payload_summary": a.payload,
            }
            for a in self._pending.values()
            if a.status == ActionStatus.PENDING
        ]


# Global singleton
sandbox = SandboxGate()
