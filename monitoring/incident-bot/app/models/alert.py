"""Alert models from Alertmanager."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AlertLabel(BaseModel):
    """Alert labels (alertname, severity, service, category, etc.)."""

    alertname: str
    severity: Optional[str] = None
    service: Optional[str] = None
    category: Optional[str] = None
    job: Optional[str] = None

    # Allow extra fields
    class Config:
        extra = "allow"


class AlertAnnotation(BaseModel):
    """Alert annotations (summary, description, etc.)."""

    summary: Optional[str] = None
    description: Optional[str] = None
    remediation: Optional[str] = None
    owasp: Optional[str] = None

    # Allow extra fields
    class Config:
        extra = "allow"


class Alert(BaseModel):
    """Single alert from Alertmanager."""

    status: str  # firing or resolved
    labels: AlertLabel
    annotations: AlertAnnotation
    startsAt: datetime
    endsAt: Optional[datetime] = None
    generatorURL: Optional[str] = None
    fingerprint: Optional[str] = None


class AlertmanagerWebhook(BaseModel):
    """Webhook payload from Alertmanager."""

    version: str = Field(default="4")
    groupKey: str
    truncatedAlerts: int = 0
    status: str  # firing or resolved
    receiver: str
    groupLabels: Dict[str, Any]
    commonLabels: Dict[str, Any]
    commonAnnotations: Dict[str, Any]
    externalURL: str
    alerts: List[Alert]

    def get_firing_alerts(self) -> List[Alert]:
        """Return only firing alerts."""
        return [alert for alert in self.alerts if alert.status == "firing"]

    def get_resolved_alerts(self) -> List[Alert]:
        """Return only resolved alerts."""
        return [alert for alert in self.alerts if alert.status == "resolved"]

