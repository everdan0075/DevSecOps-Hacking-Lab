"""IP ban action handler."""

from __future__ import annotations

import logging
from typing import Any, Dict

import redis.asyncio as redis

from app.config import settings
from app.handlers.base import ActionResult, BaseActionHandler
from app.models.alert import Alert
from app.models.runbook import RunbookAction

logger = logging.getLogger(__name__)


class IPBanHandler(BaseActionHandler):
    """Handler for banning IPs in Redis."""

    def __init__(self) -> None:
        """Initialize handler with Redis connection."""
        super().__init__()
        self.redis_client: redis.Redis | None = None

    async def _get_redis(self) -> redis.Redis:
        """Get or create Redis connection."""
        if self.redis_client is None:
            self.redis_client = redis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                db=settings.redis_db,
                decode_responses=True,
            )
        return self.redis_client

    async def execute(
        self, action: RunbookAction, alert: Alert, context: Dict[str, Any]
    ) -> ActionResult:
        """
        Ban IP address in Redis.

        Expected params:
        - ip: IP address to ban (optional, can extract from context)
        - duration: Ban duration in seconds (default: 3600)
        - reason: Reason for ban (default: alert name)
        """
        # Get IP address
        ip_address = self.get_param(action, "ip")
        if not ip_address:
            # Try to extract from context
            ip_address = context.get("source_ip")

        if not ip_address:
            return ActionResult(
                success=False,
                message="No IP address provided for ban",
            )

        duration = self.get_param(action, "duration", 3600)
        reason = self.get_param(action, "reason", alert.labels.alertname)

        try:
            r = await self._get_redis()

            # Store ban with expiration
            ban_key = f"ip_ban:{ip_address}"
            ban_data = {
                "reason": reason,
                "alert": alert.labels.alertname,
                "severity": alert.labels.severity or "unknown",
                "banned_at": alert.startsAt.isoformat(),
            }

            # Set ban with TTL
            await r.hset(ban_key, mapping=ban_data)  # type: ignore
            await r.expire(ban_key, duration)

            # Add to banned IPs set (for tracking)
            await r.sadd("banned_ips", ip_address)
            await r.expire(f"banned_ips:{ip_address}", duration)

            self.logger.info(
                f"Banned IP {ip_address} for {duration}s (reason: {reason})"
            )

            return ActionResult(
                success=True,
                message=f"IP {ip_address} banned for {duration} seconds",
                data={
                    "ip": ip_address,
                    "duration": duration,
                    "reason": reason,
                },
            )

        except Exception as e:
            self.logger.error(f"Failed to ban IP {ip_address}: {e}", exc_info=True)
            return ActionResult(
                success=False,
                message=f"Failed to ban IP: {e}",
            )

    async def close(self) -> None:
        """Close Redis connection."""
        if self.redis_client:
            await self.redis_client.close()

