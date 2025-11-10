"""Report generation action handler."""

from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from app.config import settings
from app.handlers.base import ActionResult, BaseActionHandler
from app.models.alert import Alert
from app.models.runbook import RunbookAction

logger = logging.getLogger(__name__)


class ReportHandler(BaseActionHandler):
    """Handler for generating incident reports."""

    def __init__(self) -> None:
        """Initialize report handler."""
        super().__init__()
        self.report_dir = Path(settings.report_output_dir)
        self.report_dir.mkdir(parents=True, exist_ok=True)

    async def execute(
        self, action: RunbookAction, alert: Alert, context: Dict[str, Any]
    ) -> ActionResult:
        """
        Generate incident report.

        Expected params:
        - format: Report format (json, markdown, html)
        - include_context: Include execution context (default: true)
        """
        report_format = self.get_param(action, "format", "json")
        include_context = self.get_param(action, "include_context", True)

        try:
            if report_format == "json":
                return await self._generate_json_report(alert, context, include_context)
            elif report_format == "markdown":
                return await self._generate_markdown_report(
                    alert, context, include_context
                )
            else:
                return ActionResult(
                    success=False,
                    message=f"Unsupported report format: {report_format}",
                )

        except Exception as e:
            self.logger.error(f"Failed to generate report: {e}", exc_info=True)
            return ActionResult(
                success=False,
                message=f"Failed to generate report: {e}",
            )

    async def _generate_json_report(
        self, alert: Alert, context: Dict[str, Any], include_context: bool
    ) -> ActionResult:
        """Generate JSON report."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        alert_name = alert.labels.alertname.lower().replace(" ", "_")
        filename = f"incident_{alert_name}_{timestamp}.json"
        filepath = self.report_dir / filename

        report = {
            "incident_id": alert.fingerprint or f"{alert_name}_{timestamp}",
            "timestamp": datetime.utcnow().isoformat(),
            "alert": {
                "name": alert.labels.alertname,
                "severity": alert.labels.severity,
                "service": alert.labels.service,
                "category": alert.labels.category,
                "status": alert.status,
                "started_at": alert.startsAt.isoformat(),
                "summary": alert.annotations.summary,
                "description": alert.annotations.description,
                "remediation": alert.annotations.remediation,
            },
            "labels": alert.labels.model_dump(),
            "annotations": alert.annotations.model_dump(),
        }

        if include_context:
            report["execution_context"] = context

        # Write report to file
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        self.logger.info(f"Generated JSON report: {filepath}")

        return ActionResult(
            success=True,
            message=f"Report generated: {filename}",
            data={
                "format": "json",
                "filepath": str(filepath),
                "filename": filename,
            },
        )

    async def _generate_markdown_report(
        self, alert: Alert, context: Dict[str, Any], include_context: bool
    ) -> ActionResult:
        """Generate Markdown report."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        alert_name = alert.labels.alertname.lower().replace(" ", "_")
        filename = f"incident_{alert_name}_{timestamp}.md"
        filepath = self.report_dir / filename

        # Build markdown content
        md = f"# Incident Report: {alert.labels.alertname}\n\n"
        md += f"**Generated:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n"

        md += "## Alert Details\n\n"
        md += f"- **Alert Name:** {alert.labels.alertname}\n"
        md += f"- **Severity:** {alert.labels.severity or 'unknown'}\n"
        md += f"- **Service:** {alert.labels.service or 'unknown'}\n"
        md += f"- **Category:** {alert.labels.category or 'unknown'}\n"
        md += f"- **Status:** {alert.status}\n"
        md += f"- **Started At:** {alert.startsAt.isoformat()}\n\n"

        if alert.annotations.summary:
            md += "## Summary\n\n"
            md += f"{alert.annotations.summary}\n\n"

        if alert.annotations.description:
            md += "## Description\n\n"
            md += f"{alert.annotations.description}\n\n"

        if alert.annotations.remediation:
            md += "## Remediation\n\n"
            md += f"{alert.annotations.remediation}\n\n"

        if include_context and context:
            md += "## Execution Context\n\n"
            md += "```json\n"
            md += json.dumps(context, indent=2, ensure_ascii=False)
            md += "\n```\n\n"

        md += "---\n"
        md += "*Generated by DevSecOps Incident Bot*\n"

        # Write report to file
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(md)

        self.logger.info(f"Generated Markdown report: {filepath}")

        return ActionResult(
            success=True,
            message=f"Report generated: {filename}",
            data={
                "format": "markdown",
                "filepath": str(filepath),
                "filename": filename,
            },
        )

