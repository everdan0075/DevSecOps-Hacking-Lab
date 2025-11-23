"""
Incident Bot reporter for IDS alerts
"""
import logging
import httpx
from typing import Dict
from .config import settings
from . import metrics

logger = logging.getLogger(__name__)


class IncidentReporter:
    """Report critical IDS alerts to incident bot"""

    def __init__(self):
        self.incident_bot_url = settings.INCIDENT_BOT_URL
        self.client = httpx.AsyncClient(timeout=10.0)
        logger.info(f"Initialized incident reporter: {self.incident_bot_url}")

    async def report_alert(self, event: Dict, category: str, severity: str):
        """Send IDS alert to incident bot for correlation"""

        if not settings.INCIDENT_BOT_ENABLED:
            return

        # Build incident report payload
        alert = event.get("alert", {})
        src_ip = event.get("src_ip", "unknown")
        dest_ip = event.get("dest_ip", "unknown")
        dest_port = event.get("dest_port", 0)
        signature = alert.get("signature", "unknown")

        http = event.get("http", {})
        payload = {
            "source": "ids",
            "category": category,
            "severity": severity,
            "src_ip": src_ip,
            "dest_ip": dest_ip,
            "dest_port": dest_port,
            "signature": signature,
            "timestamp": event.get("timestamp"),
            "http_method": http.get("http_method"),
            "http_url": http.get("url"),
            "http_user_agent": http.get("http_user_agent"),
            "payload_printable": event.get("payload_printable"),
        }

        try:
            # Send to incident bot correlation endpoint
            response = await self.client.post(
                f"{self.incident_bot_url}/api/correlate",
                json=payload,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                logger.info(
                    f"Reported IDS alert to incident bot: category={category}, "
                    f"severity={severity}, src_ip={src_ip}"
                )
                metrics.ids_incident_reports_sent_total.labels(
                    category=category,
                    severity=severity
                ).inc()
            else:
                logger.warning(
                    f"Incident bot returned {response.status_code}: {response.text}"
                )
                metrics.ids_incident_reports_failed_total.inc()

        except httpx.RequestError as e:
            logger.error(f"Failed to report to incident bot: {e}")
            metrics.ids_incident_reports_failed_total.inc()
        except Exception as e:
            logger.error(f"Unexpected error reporting to incident bot: {e}")
            metrics.ids_incident_reports_failed_total.inc()

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()
