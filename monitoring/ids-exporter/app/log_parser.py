"""
Suricata Eve JSON log parser
"""
import json
import logging
import time
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from collections import defaultdict
from .config import settings
from . import metrics

logger = logging.getLogger(__name__)


class SuricataLogParser:
    """Parse Suricata Eve JSON logs and extract IDS alerts"""

    def __init__(self):
        self.log_file = settings.SURICATA_EVE_LOG
        self.last_position = 0
        self.active_attackers = defaultdict(list)  # {ip: [timestamps]}
        logger.info(f"Initialized Suricata log parser for {self.log_file}")

    def parse_event(self, line: str) -> Optional[Dict]:
        """Parse a single Eve JSON event line"""
        try:
            event = json.loads(line)
            metrics.ids_events_processed_total.inc()
            return event
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            metrics.ids_log_parse_errors_total.inc()
            return None

    def categorize_alert(self, alert: Dict) -> str:
        """Categorize alert based on signature and metadata"""
        signature = alert.get("signature", "").lower()
        category = alert.get("category", "").lower()

        # Map signatures to attack categories
        if "sql injection" in signature or "union" in signature:
            return "sql_injection"
        elif "xss" in signature or "script" in signature:
            return "xss"
        elif "brute force" in signature or "login attempt" in signature:
            return "brute_force"
        elif "scanner" in signature or "sqlmap" in signature or "nikto" in signature:
            return "scanner"
        elif "honeypot" in signature or "admin panel" in signature:
            return "honeypot"
        elif "gateway bypass" in signature or "direct service" in signature:
            return "gateway_bypass"
        elif "idor" in signature or "unauthorized access" in signature:
            return "idor"
        elif "command injection" in signature:
            return "command_injection"
        elif "path traversal" in signature or "directory traversal" in signature:
            return "path_traversal"
        elif "rate limit" in signature:
            return "rate_limit_abuse"
        else:
            return category or "unknown"

    def get_severity(self, alert: Dict) -> str:
        """Extract severity from alert"""
        severity = alert.get("severity", 3)

        # Suricata severity: 1=high, 2=medium, 3=low
        if severity == 1:
            return "critical"
        elif severity == 2:
            return "high"
        else:
            return "medium"

    def update_metrics(self, event: Dict):
        """Update Prometheus metrics based on IDS event"""
        event_type = event.get("event_type")

        if event_type != "alert":
            return

        alert = event.get("alert", {})
        src_ip = event.get("src_ip", "unknown")
        dest_ip = event.get("dest_ip", "unknown")
        dest_port = event.get("dest_port", 0)
        signature = alert.get("signature", "unknown")
        category = self.categorize_alert(alert)
        severity = self.get_severity(alert)

        # Track active attackers
        now = datetime.now()
        self.active_attackers[src_ip].append(now)

        # Clean old entries (older than 5 minutes)
        cutoff = now - timedelta(seconds=settings.ACTIVE_ATTACKER_WINDOW)
        self.active_attackers[src_ip] = [
            ts for ts in self.active_attackers[src_ip] if ts > cutoff
        ]

        # Update general metrics
        metrics.ids_alerts_total.labels(
            category=category,
            severity=severity,
            signature=signature[:100]  # Truncate long signatures
        ).inc()

        metrics.ids_alerts_by_ip.labels(
            src_ip=src_ip,
            category=category
        ).inc()

        metrics.ids_alerts_by_dest.labels(
            dest_ip=dest_ip,
            dest_port=str(dest_port),
            category=category
        ).inc()

        # Update category-specific metrics
        http = event.get("http", {})
        user_agent = http.get("http_user_agent", "unknown")
        uri = http.get("url", "unknown")

        if category == "sql_injection":
            metrics.ids_sql_injection_total.labels(
                src_ip=src_ip,
                signature=signature[:100]
            ).inc()

        elif category == "xss":
            metrics.ids_xss_total.labels(
                src_ip=src_ip,
                signature=signature[:100]
            ).inc()

        elif category == "brute_force":
            metrics.ids_brute_force_total.labels(
                src_ip=src_ip,
                target_endpoint=uri[:100]
            ).inc()

        elif category == "scanner":
            metrics.ids_scanner_detection_total.labels(
                src_ip=src_ip,
                user_agent=user_agent[:100]
            ).inc()

        elif category == "honeypot":
            metrics.ids_honeypot_access_total.labels(
                src_ip=src_ip,
                endpoint=uri[:100]
            ).inc()

        elif category == "gateway_bypass":
            target_service = f"{dest_ip}:{dest_port}"
            metrics.ids_gateway_bypass_total.labels(
                src_ip=src_ip,
                target_service=target_service
            ).inc()

        elif category == "idor":
            # Extract user_id from URI if possible
            user_id = "unknown"
            if "/profile/" in uri:
                try:
                    user_id = uri.split("/profile/")[1].split("/")[0]
                except IndexError:
                    pass

            metrics.ids_idor_attempts_total.labels(
                src_ip=src_ip,
                user_id=user_id
            ).inc()

        elif category == "command_injection":
            metrics.ids_command_injection_total.labels(
                src_ip=src_ip,
                signature=signature[:100]
            ).inc()

        elif category == "path_traversal":
            metrics.ids_path_traversal_total.labels(
                src_ip=src_ip,
                signature=signature[:100]
            ).inc()

        # Update active attackers gauge
        active_count = len([
            ip for ip, timestamps in self.active_attackers.items()
            if timestamps  # Has recent alerts
        ])
        metrics.ids_active_attackers.set(active_count)

        logger.debug(
            f"IDS Alert: category={category}, severity={severity}, "
            f"src_ip={src_ip}, signature={signature}"
        )

    def should_report_to_incident_bot(self, category: str, severity: str, src_ip: str) -> bool:
        """Determine if alert should be reported to incident bot"""
        if not settings.INCIDENT_BOT_ENABLED:
            return False

        # Count recent alerts from this IP
        alert_count = len(self.active_attackers.get(src_ip, []))

        # Always report critical
        if severity == "critical":
            return alert_count >= settings.CRITICAL_ALERT_THRESHOLD

        # Report high severity after threshold
        if severity == "high":
            return alert_count >= settings.HIGH_ALERT_THRESHOLD

        # Report medium severity after higher threshold
        if severity == "medium":
            return alert_count >= settings.MEDIUM_ALERT_THRESHOLD

        return False

    def tail_log(self) -> List[Dict]:
        """Tail the Suricata Eve log file and return new events"""
        events = []

        try:
            with open(self.log_file, 'r') as f:
                # Seek to last position
                f.seek(self.last_position)

                # Read new lines
                batch_count = 0
                for line in f:
                    if batch_count >= settings.LOG_BATCH_SIZE:
                        break

                    event = self.parse_event(line.strip())
                    if event:
                        events.append(event)
                        batch_count += 1

                # Update position
                self.last_position = f.tell()

        except FileNotFoundError:
            logger.warning(f"Suricata log file not found: {self.log_file}")
        except Exception as e:
            logger.error(f"Error reading log file: {e}")

        return events

    def update_recent_alerts_gauge(self):
        """Update gauge for alerts in last minute"""
        now = datetime.now()
        one_minute_ago = now - timedelta(seconds=60)

        total_recent = sum(
            len([ts for ts in timestamps if ts > one_minute_ago])
            for timestamps in self.active_attackers.values()
        )

        metrics.ids_alerts_last_minute.set(total_recent)
