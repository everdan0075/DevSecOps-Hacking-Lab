"""Notification action handler."""

from __future__ import annotations

import logging
from typing import Any, Dict

import httpx

from app.config import settings
from app.handlers.base import ActionResult, BaseActionHandler
from app.models.alert import Alert
from app.models.runbook import RunbookAction

logger = logging.getLogger(__name__)


class NotificationHandler(BaseActionHandler):
    """Handler for sending notifications."""

    def __init__(self) -> None:
        """Initialize notification handler."""
        super().__init__()

    async def execute(
        self, action: RunbookAction, alert: Alert, context: Dict[str, Any]
    ) -> ActionResult:
        """
        Send notification.

        Expected params:
        - channel: Notification channel (console, slack)
        - message: Custom message (optional)
        - severity_color: Use severity-based color (default: true)
        """
        channel = self.get_param(action, "channel", "console")
        message = self.get_param(action, "message")

        if not message:
            # Generate default message from alert
            message = self._generate_message(alert)

        if channel == "console":
            return await self._send_console(message, alert)
        elif channel == "slack":
            return await self._send_slack(message, alert, action)
        else:
            return ActionResult(
                success=False,
                message=f"Unknown notification channel: {channel}",
            )

    def _generate_message(self, alert: Alert) -> str:
        """Generate notification message from alert."""
        severity_emoji = {
            "critical": "🚨",
            "warning": "⚠️",
            "info": "ℹ️",
        }

        emoji = severity_emoji.get(alert.labels.severity or "info", "📢")

        msg = f"{emoji} **{alert.labels.alertname}**\n"
        msg += f"Severity: {alert.labels.severity or 'unknown'}\n"
        msg += f"Service: {alert.labels.service or 'unknown'}\n"

        if alert.annotations.summary:
            msg += f"\n{alert.annotations.summary}\n"

        if alert.annotations.description:
            msg += f"\n{alert.annotations.description}\n"

        if alert.annotations.remediation:
            msg += f"\n💡 Remediation: {alert.annotations.remediation}"

        return msg

    async def _send_console(self, message: str, alert: Alert) -> ActionResult:
        """Send notification to console (logs)."""
        severity = alert.labels.severity or "info"

        # Log with appropriate level
        if severity == "critical":
            self.logger.critical(f"ALERT NOTIFICATION:\n{message}")
        elif severity == "warning":
            self.logger.warning(f"ALERT NOTIFICATION:\n{message}")
        else:
            self.logger.info(f"ALERT NOTIFICATION:\n{message}")

        return ActionResult(
            success=True,
            message="Notification sent to console",
            data={"channel": "console", "message": message},
        )

    async def _send_slack(
        self, message: str, alert: Alert, action: RunbookAction
    ) -> ActionResult:
        """Send notification to Slack."""
        if not settings.enable_slack or not settings.slack_webhook_url:
            self.logger.warning("Slack notifications not configured, skipping")
            return ActionResult(
                success=True,
                message="Slack not configured, notification skipped",
                data={"channel": "slack", "skipped": True},
            )

        # Build Slack message
        severity = alert.labels.severity or "info"
        color_map = {
            "critical": "danger",
            "warning": "warning",
            "info": "good",
        }

        slack_payload = {
            "text": f"Security Alert: {alert.labels.alertname}",
            "attachments": [
                {
                    "color": color_map.get(severity, "good"),
                    "title": alert.labels.alertname,
                    "text": message,
                    "fields": [
                        {
                            "title": "Severity",
                            "value": severity.upper(),
                            "short": True,
                        },
                        {
                            "title": "Service",
                            "value": alert.labels.service or "unknown",
                            "short": True,
                        },
                    ],
                    "footer": "DevSecOps Incident Bot",
                    "ts": int(alert.startsAt.timestamp()),
                }
            ],
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    settings.slack_webhook_url,
                    json=slack_payload,
                    timeout=10.0,
                )
                response.raise_for_status()

            self.logger.info("Notification sent to Slack")
            return ActionResult(
                success=True,
                message="Notification sent to Slack",
                data={"channel": "slack"},
            )

        except Exception as e:
            self.logger.error(f"Failed to send Slack notification: {e}", exc_info=True)
            return ActionResult(
                success=False,
                message=f"Failed to send Slack notification: {e}",
            )

