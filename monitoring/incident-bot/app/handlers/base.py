"""Base action handler."""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict

from app.models.alert import Alert
from app.models.runbook import RunbookAction

logger = logging.getLogger(__name__)


class ActionResult:
    """Result of action execution."""

    def __init__(
        self,
        success: bool,
        message: str,
        data: Dict[str, Any] | None = None,
    ) -> None:
        self.success = success
        self.message = message
        self.data = data or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "success": self.success,
            "message": self.message,
            "data": self.data,
        }


class BaseActionHandler(ABC):
    """Base class for action handlers."""

    def __init__(self) -> None:
        """Initialize handler."""
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    @abstractmethod
    async def execute(
        self, action: RunbookAction, alert: Alert, context: Dict[str, Any]
    ) -> ActionResult:
        """
        Execute the action.

        Args:
            action: Action to execute
            alert: Alert that triggered the action
            context: Execution context with additional data

        Returns:
            ActionResult with success status and details
        """
        pass

    def get_param(
        self, action: RunbookAction, key: str, default: Any = None
    ) -> Any:
        """Get parameter from action params."""
        return action.params.get(key, default)

    async def execute_with_retry(
        self, action: RunbookAction, alert: Alert, context: Dict[str, Any]
    ) -> ActionResult:
        """Execute action with retry logic."""
        import asyncio

        attempts = action.retry_count + 1
        last_error = None

        for attempt in range(attempts):
            try:
                self.logger.info(
                    f"Executing {action.type} (attempt {attempt + 1}/{attempts})"
                )
                result = await self.execute(action, alert, context)

                if result.success:
                    return result

                last_error = result.message

                if not action.continue_on_error and attempt < attempts - 1:
                    self.logger.warning(
                        f"Action failed but continue_on_error=False, retrying..."
                    )
                    await asyncio.sleep(action.retry_delay)

            except Exception as e:
                last_error = str(e)
                self.logger.error(
                    f"Action execution failed (attempt {attempt + 1}): {e}",
                    exc_info=True,
                )

                if attempt < attempts - 1:
                    await asyncio.sleep(action.retry_delay)

        return ActionResult(
            success=False,
            message=f"Action failed after {attempts} attempts: {last_error}",
        )

