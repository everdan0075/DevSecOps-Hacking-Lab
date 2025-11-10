"""Runbook models for incident response automation."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ActionType(str, Enum):
    """Supported action types in runbooks."""

    IP_BAN = "ip_ban"
    NOTIFY = "notify"
    REPORT = "report"
    SERVICE_COMMAND = "service_command"
    WAIT = "wait"


class TriggerCondition(BaseModel):
    """Conditions for triggering a runbook."""

    alertname: Optional[str] = None
    severity: Optional[str] = None
    category: Optional[str] = None
    service: Optional[str] = None

    # Additional custom matchers
    labels: Optional[Dict[str, str]] = Field(default_factory=dict)

    def matches(self, alert_labels: Dict[str, Any]) -> bool:
        """Check if alert matches trigger conditions."""
        # Check standard fields
        if self.alertname and alert_labels.get("alertname") != self.alertname:
            return False
        if self.severity and alert_labels.get("severity") != self.severity:
            return False
        if self.category and alert_labels.get("category") != self.category:
            return False
        if self.service and alert_labels.get("service") != self.service:
            return False

        # Check custom label matchers
        if self.labels:
            for key, value in self.labels.items():
                if alert_labels.get(key) != value:
                    return False

        return True


class RunbookAction(BaseModel):
    """Single action in a runbook."""

    type: ActionType
    description: Optional[str] = None

    # Action-specific parameters
    params: Dict[str, Any] = Field(default_factory=dict)

    # Conditional execution
    condition: Optional[str] = None  # Python expression evaluated at runtime

    # Error handling
    continue_on_error: bool = True
    retry_count: int = 0
    retry_delay: int = 5  # seconds


class Runbook(BaseModel):
    """Complete incident response runbook."""

    name: str
    description: Optional[str] = None
    version: str = "1.0"
    enabled: bool = True

    # Trigger conditions
    trigger: TriggerCondition

    # Priority (higher = more important, if multiple runbooks match)
    priority: int = 10

    # Actions to execute
    actions: List[RunbookAction]

    # Metadata
    author: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class RunbookExecution(BaseModel):
    """Track execution of a runbook."""

    runbook_name: str
    alert_fingerprint: str
    started_at: str
    completed_at: Optional[str] = None
    status: str = "running"  # running, completed, failed
    actions_executed: int = 0
    actions_failed: int = 0
    error_message: Optional[str] = None

    # Store action results
    action_results: List[Dict[str, Any]] = Field(default_factory=list)

