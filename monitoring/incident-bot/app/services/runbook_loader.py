"""Load and manage runbooks from JSON files."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional

from app.models.alert import Alert
from app.models.runbook import Runbook, TriggerCondition

logger = logging.getLogger(__name__)


class RunbookLoader:
    """Load and cache runbooks from JSON directory."""

    def __init__(self, runbook_dir: str) -> None:
        """
        Initialize runbook loader.

        Args:
            runbook_dir: Directory containing runbook JSON files
        """
        self.runbook_dir = Path(runbook_dir)
        self.runbooks: List[Runbook] = []
        self._load_all_runbooks()

    def _load_all_runbooks(self) -> None:
        """Load all runbook JSON files from directory."""
        if not self.runbook_dir.exists():
            logger.warning(f"Runbook directory does not exist: {self.runbook_dir}")
            return

        json_files = list(self.runbook_dir.glob("*.json"))
        logger.info(f"Found {len(json_files)} runbook files in {self.runbook_dir}")

        for json_file in json_files:
            try:
                self._load_runbook_file(json_file)
            except Exception as e:
                logger.error(f"Failed to load runbook {json_file}: {e}", exc_info=True)

        logger.info(f"Loaded {len(self.runbooks)} runbooks successfully")

    def _load_runbook_file(self, file_path: Path) -> None:
        """Load a single runbook JSON file."""
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Support both single runbook and array of runbooks
        if isinstance(data, list):
            for runbook_data in data:
                runbook = Runbook(**runbook_data)
                if runbook.enabled:
                    self.runbooks.append(runbook)
                    logger.debug(f"Loaded runbook: {runbook.name}")
        else:
            runbook = Runbook(**data)
            if runbook.enabled:
                self.runbooks.append(runbook)
                logger.debug(f"Loaded runbook: {runbook.name}")

    def find_matching_runbooks(self, alert: Alert) -> List[Runbook]:
        """
        Find all runbooks matching the alert.

        Args:
            alert: Alert to match against runbooks

        Returns:
            List of matching runbooks, sorted by priority (descending)
        """
        matching = []

        # Convert alert labels to dict for matching
        alert_labels = alert.labels.model_dump()

        for runbook in self.runbooks:
            if runbook.trigger.matches(alert_labels):
                matching.append(runbook)
                logger.info(
                    f"Runbook '{runbook.name}' matched alert '{alert.labels.alertname}'"
                )

        # Sort by priority (higher priority first)
        matching.sort(key=lambda r: r.priority, reverse=True)

        return matching

    def get_runbook_by_name(self, name: str) -> Optional[Runbook]:
        """Get runbook by name."""
        for runbook in self.runbooks:
            if runbook.name == name:
                return runbook
        return None

    def reload(self) -> None:
        """Reload all runbooks from disk."""
        logger.info("Reloading runbooks...")
        self.runbooks.clear()
        self._load_all_runbooks()

    def get_stats(self) -> Dict[str, int]:
        """Get statistics about loaded runbooks."""
        return {
            "total_runbooks": len(self.runbooks),
            "enabled_runbooks": len([r for r in self.runbooks if r.enabled]),
            "disabled_runbooks": len([r for r in self.runbooks if not r.enabled]),
        }

