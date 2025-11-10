"""Runbook execution engine."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List

from app.handlers import IPBanHandler, NotificationHandler, ReportHandler
from app.handlers.base import BaseActionHandler
from app.models.alert import Alert
from app.models.runbook import ActionType, Runbook, RunbookExecution

logger = logging.getLogger(__name__)


class RunbookExecutor:
    """Execute runbooks in response to alerts."""

    def __init__(self) -> None:
        """Initialize executor with action handlers."""
        self.handlers: Dict[ActionType, BaseActionHandler] = {
            ActionType.IP_BAN: IPBanHandler(),
            ActionType.NOTIFY: NotificationHandler(),
            ActionType.REPORT: ReportHandler(),
        }

        # Track executions
        self.executions: List[RunbookExecution] = []

    async def execute_runbook(
        self, runbook: Runbook, alert: Alert, context: Dict[str, Any] | None = None
    ) -> RunbookExecution:
        """
        Execute a runbook for the given alert.

        Args:
            runbook: Runbook to execute
            alert: Alert that triggered the runbook
            context: Additional execution context

        Returns:
            RunbookExecution with results
        """
        if context is None:
            context = {}

        # Create execution record
        execution = RunbookExecution(
            runbook_name=runbook.name,
            alert_fingerprint=alert.fingerprint or f"{alert.labels.alertname}_{alert.startsAt.isoformat()}",
            started_at=datetime.utcnow().isoformat(),
            status="running",
        )

        logger.info(
            f"Starting runbook execution: {runbook.name} for alert {alert.labels.alertname}"
        )

        try:
            # Execute each action in sequence
            for idx, action in enumerate(runbook.actions):
                logger.debug(
                    f"Executing action {idx + 1}/{len(runbook.actions)}: {action.type}"
                )

                # Check if handler exists
                handler = self.handlers.get(action.type)
                if not handler:
                    logger.warning(f"No handler for action type: {action.type}")
                    execution.actions_failed += 1
                    execution.action_results.append(
                        {
                            "action_type": action.type,
                            "success": False,
                            "message": f"No handler for action type: {action.type}",
                        }
                    )
                    continue

                # Execute action with retry
                result = await handler.execute_with_retry(action, alert, context)

                # Record result
                action_result = {
                    "action_index": idx,
                    "action_type": action.type,
                    "description": action.description,
                    "success": result.success,
                    "message": result.message,
                    "data": result.data,
                }
                execution.action_results.append(action_result)

                if result.success:
                    execution.actions_executed += 1
                    logger.info(f"Action {action.type} succeeded: {result.message}")
                else:
                    execution.actions_failed += 1
                    logger.error(f"Action {action.type} failed: {result.message}")

                    # Stop execution if continue_on_error is False
                    if not action.continue_on_error:
                        logger.warning("Stopping runbook execution due to failed action")
                        break

            # Mark execution as completed
            execution.completed_at = datetime.utcnow().isoformat()
            execution.status = "completed" if execution.actions_failed == 0 else "partial"

            logger.info(
                f"Runbook execution completed: {runbook.name} "
                f"(executed: {execution.actions_executed}, failed: {execution.actions_failed})"
            )

        except Exception as e:
            logger.error(
                f"Runbook execution failed with exception: {e}", exc_info=True
            )
            execution.completed_at = datetime.utcnow().isoformat()
            execution.status = "failed"
            execution.error_message = str(e)

        # Store execution
        self.executions.append(execution)

        return execution

    def get_executions(self, limit: int = 100) -> List[RunbookExecution]:
        """Get recent executions."""
        return self.executions[-limit:]

    def get_execution_stats(self) -> Dict[str, Any]:
        """Get execution statistics."""
        total = len(self.executions)
        completed = len([e for e in self.executions if e.status == "completed"])
        failed = len([e for e in self.executions if e.status == "failed"])
        partial = len([e for e in self.executions if e.status == "partial"])

        return {
            "total_executions": total,
            "completed": completed,
            "failed": failed,
            "partial": partial,
            "success_rate": completed / total if total > 0 else 0,
        }

    async def close(self) -> None:
        """Cleanup resources."""
        # Close IP ban handler (Redis connection)
        ip_ban_handler = self.handlers.get(ActionType.IP_BAN)
        if ip_ban_handler and hasattr(ip_ban_handler, "close"):
            await ip_ban_handler.close()  # type: ignore

