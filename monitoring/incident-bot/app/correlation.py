"""
Attack Correlation Engine

This module correlates different attack signals to identify sophisticated attack patterns:
- Multi-stage attacks (reconnaissance → exploitation → exfiltration)
- Distributed attacks from coordinated IPs
- Credential stuffing campaigns
- Advanced persistent threats (APT) indicators
"""
import logging
from typing import Dict, List, Any, Optional, Set
from datetime import datetime, timedelta
from collections import defaultdict
from dataclasses import dataclass, field
import json

logger = logging.getLogger(__name__)


@dataclass
class AttackEvent:
    """Represents a single attack event"""
    timestamp: datetime
    ip_address: str
    attack_type: str
    severity: str
    target: str
    details: Dict[str, Any] = field(default_factory=dict)
    user_agent: Optional[str] = None


@dataclass
class AttackPattern:
    """Represents a detected attack pattern"""
    pattern_id: str
    pattern_type: str
    confidence: float  # 0.0 - 1.0
    severity: str
    attacker_ips: Set[str]
    events: List[AttackEvent]
    first_seen: datetime
    last_seen: datetime
    description: str
    recommended_actions: List[str]


class AttackCorrelationEngine:
    """
    Correlates attack events to detect sophisticated attack patterns
    """

    def __init__(self, time_window_minutes: int = 60):
        """
        Initialize correlation engine

        Args:
            time_window_minutes: Time window for correlating events (default 60 min)
        """
        self.time_window = timedelta(minutes=time_window_minutes)
        self.events: List[AttackEvent] = []
        self.patterns: List[AttackPattern] = []

        # Tracking structures for different attack types
        self.ip_activity: Dict[str, List[AttackEvent]] = defaultdict(list)
        self.honeypot_hits: Dict[str, List[AttackEvent]] = defaultdict(list)
        self.failed_logins: Dict[str, List[AttackEvent]] = defaultdict(list)
        self.idor_attempts: Dict[str, List[AttackEvent]] = defaultdict(list)

        logger.info(f"Attack Correlation Engine initialized (time window: {time_window_minutes} min)")

    def add_event(self, event: AttackEvent) -> None:
        """
        Add attack event to correlation engine

        Args:
            event: AttackEvent to process
        """
        self.events.append(event)

        # Index by IP for quick lookup
        self.ip_activity[event.ip_address].append(event)

        # Index by attack type
        if "honeypot" in event.attack_type.lower():
            self.honeypot_hits[event.ip_address].append(event)
        elif "login" in event.attack_type.lower() or "brute" in event.attack_type.lower():
            self.failed_logins[event.ip_address].append(event)
        elif "idor" in event.attack_type.lower():
            self.idor_attempts[event.ip_address].append(event)

        # Cleanup old events outside time window
        self._cleanup_old_events()

        # Detect patterns
        self._detect_patterns()

        logger.debug(
            f"Added event: type={event.attack_type}, ip={event.ip_address}, "
            f"severity={event.severity}"
        )

    def _cleanup_old_events(self) -> None:
        """Remove events outside the time window"""
        from datetime import timezone
        cutoff_time = datetime.now(timezone.utc) - self.time_window

        # Clean main events list
        self.events = [e for e in self.events if e.timestamp >= cutoff_time]

        # Clean IP activity
        for ip in list(self.ip_activity.keys()):
            self.ip_activity[ip] = [e for e in self.ip_activity[ip] if e.timestamp >= cutoff_time]
            if not self.ip_activity[ip]:
                del self.ip_activity[ip]

        # Clean honeypot hits
        for ip in list(self.honeypot_hits.keys()):
            self.honeypot_hits[ip] = [e for e in self.honeypot_hits[ip] if e.timestamp >= cutoff_time]
            if not self.honeypot_hits[ip]:
                del self.honeypot_hits[ip]

        # Clean failed logins
        for ip in list(self.failed_logins.keys()):
            self.failed_logins[ip] = [e for e in self.failed_logins[ip] if e.timestamp >= cutoff_time]
            if not self.failed_logins[ip]:
                del self.failed_logins[ip]

        # Clean IDOR attempts
        for ip in list(self.idor_attempts.keys()):
            self.idor_attempts[ip] = [e for e in self.idor_attempts[ip] if e.timestamp >= cutoff_time]
            if not self.idor_attempts[ip]:
                del self.idor_attempts[ip]

    def _detect_patterns(self) -> None:
        """Detect attack patterns from correlated events"""
        # Pattern detection methods
        self._detect_reconnaissance_pattern()
        self._detect_multi_stage_attack()
        self._detect_distributed_attack()
        self._detect_credential_stuffing()
        self._detect_apt_indicators()

    def _detect_reconnaissance_pattern(self) -> None:
        """
        Detect reconnaissance pattern:
        - Multiple honeypot hits from same IP
        - Scanning common vulnerable endpoints
        """
        for ip, events in self.honeypot_hits.items():
            if len(events) >= 3:  # 3+ honeypot hits indicates reconnaissance
                unique_honeypots = len(set(e.attack_type for e in events))

                if unique_honeypots >= 2:  # Multiple different honeypots
                    confidence = min(0.5 + (unique_honeypots * 0.1), 1.0)

                    pattern = AttackPattern(
                        pattern_id=f"recon_{ip}_{int(datetime.utcnow().timestamp())}",
                        pattern_type="reconnaissance",
                        confidence=confidence,
                        severity="high",
                        attacker_ips={ip},
                        events=events,
                        first_seen=min(e.timestamp for e in events),
                        last_seen=max(e.timestamp for e in events),
                        description=f"Reconnaissance detected: {unique_honeypots} different honeypots accessed by {ip}",
                        recommended_actions=[
                            "Monitor IP for further activity",
                            "Consider temporary IP ban (1-6 hours)",
                            "Alert security team for investigation",
                            "Check if IP is from known scanning service"
                        ]
                    )

                    self._add_pattern(pattern)

    def _detect_multi_stage_attack(self) -> None:
        """
        Detect multi-stage attack pattern:
        1. Reconnaissance (honeypot hits)
        2. Exploitation (failed logins, IDOR attempts)
        3. Potential data exfiltration
        """
        for ip, all_events in self.ip_activity.items():
            if len(all_events) < 5:
                continue

            # Check for multi-stage indicators
            has_recon = any("honeypot" in e.attack_type.lower() for e in all_events)
            has_exploitation = any(
                "login" in e.attack_type.lower() or
                "idor" in e.attack_type.lower() or
                "brute" in e.attack_type.lower()
                for e in all_events
            )

            if has_recon and has_exploitation:
                # Multi-stage attack detected
                confidence = 0.7

                # Increase confidence if multiple attack types
                attack_types = set(e.attack_type for e in all_events)
                if len(attack_types) >= 4:
                    confidence = 0.9

                pattern = AttackPattern(
                    pattern_id=f"multistage_{ip}_{int(datetime.utcnow().timestamp())}",
                    pattern_type="multi_stage_attack",
                    confidence=confidence,
                    severity="critical",
                    attacker_ips={ip},
                    events=sorted(all_events, key=lambda e: e.timestamp),
                    first_seen=min(e.timestamp for e in all_events),
                    last_seen=max(e.timestamp for e in all_events),
                    description=f"Multi-stage attack: IP {ip} performing reconnaissance followed by exploitation",
                    recommended_actions=[
                        "IMMEDIATE: Ban IP address (24-48 hours)",
                        "Escalate to security team",
                        "Review all access logs for this IP",
                        "Check for successful breaches",
                        "Consider threat intelligence lookup",
                        "Document attack timeline for post-incident analysis"
                    ]
                )

                self._add_pattern(pattern)

    def _detect_distributed_attack(self) -> None:
        """
        Detect distributed attack pattern:
        - Multiple IPs attacking same target
        - Coordinated timing
        - Similar user agents or attack patterns
        """
        # Group events by target
        target_events: Dict[str, List[AttackEvent]] = defaultdict(list)
        for event in self.events:
            target_events[event.target].append(event)

        for target, events in target_events.items():
            unique_ips = set(e.ip_address for e in events)

            if len(unique_ips) >= 5:  # 5+ different IPs attacking same target
                # Check for timing coordination (events clustered in time)
                time_span = (max(e.timestamp for e in events) - min(e.timestamp for e in events)).total_seconds()

                if time_span < 300:  # Within 5 minutes
                    confidence = min(0.6 + (len(unique_ips) * 0.05), 1.0)

                    # Check for similar user agents (botnet indicator)
                    user_agents = [e.user_agent for e in events if e.user_agent]
                    unique_user_agents = len(set(user_agents))

                    if unique_user_agents < len(unique_ips) * 0.3:  # Many IPs with same UA
                        confidence = min(confidence + 0.2, 1.0)

                    pattern = AttackPattern(
                        pattern_id=f"distributed_{target}_{int(datetime.utcnow().timestamp())}",
                        pattern_type="distributed_attack",
                        confidence=confidence,
                        severity="critical",
                        attacker_ips=unique_ips,
                        events=events,
                        first_seen=min(e.timestamp for e in events),
                        last_seen=max(e.timestamp for e in events),
                        description=f"Distributed attack: {len(unique_ips)} IPs targeting {target}",
                        recommended_actions=[
                            "Enable rate limiting at infrastructure level",
                            "Consider geo-blocking if IPs from specific regions",
                            "Activate WAF rules for target endpoint",
                            "Monitor for DDoS indicators",
                            "Prepare incident response for potential DDoS",
                            f"Ban attacker IPs: {', '.join(list(unique_ips)[:10])}"
                        ]
                    )

                    self._add_pattern(pattern)

    def _detect_credential_stuffing(self) -> None:
        """
        Detect credential stuffing pattern:
        - High volume of login attempts
        - Multiple different usernames
        - Low delay between requests
        """
        for ip, events in self.failed_logins.items():
            if len(events) >= 10:  # 10+ failed login attempts
                # Check for multiple usernames (credential stuffing indicator)
                usernames = set()
                for event in events:
                    if "username" in event.details:
                        usernames.add(event.details["username"])

                if len(usernames) >= 5:  # 5+ different usernames
                    confidence = min(0.5 + (len(usernames) * 0.05), 1.0)

                    # Check timing (rapid requests = automated)
                    if len(events) >= 2:
                        time_deltas = [
                            (events[i + 1].timestamp - events[i].timestamp).total_seconds()
                            for i in range(len(events) - 1)
                        ]
                        avg_delay = sum(time_deltas) / len(time_deltas)

                        if avg_delay < 2:  # Less than 2 seconds between requests
                            confidence = min(confidence + 0.2, 1.0)

                    pattern = AttackPattern(
                        pattern_id=f"credstuff_{ip}_{int(datetime.utcnow().timestamp())}",
                        pattern_type="credential_stuffing",
                        confidence=confidence,
                        severity="high",
                        attacker_ips={ip},
                        events=events,
                        first_seen=min(e.timestamp for e in events),
                        last_seen=max(e.timestamp for e in events),
                        description=f"Credential stuffing: {len(events)} login attempts with {len(usernames)} usernames from {ip}",
                        recommended_actions=[
                            "Ban IP immediately (12-24 hours)",
                            "Force password reset for attempted usernames",
                            "Enable MFA for affected accounts",
                            "Check for compromised credentials in breach databases",
                            "Notify users of attempted account access",
                            "Review authentication logs for successful logins"
                        ]
                    )

                    self._add_pattern(pattern)

    def _detect_apt_indicators(self) -> None:
        """
        Detect Advanced Persistent Threat (APT) indicators:
        - Sustained low-volume attacks over extended period
        - Mix of reconnaissance and targeted exploitation
        - Sophisticated evasion techniques
        """
        # Look for IPs with activity spanning long period but low volume
        for ip, events in self.ip_activity.items():
            if len(events) < 3:
                continue

            time_span = (max(e.timestamp for e in events) - min(e.timestamp for e in events)).total_seconds()

            # Activity over >30 minutes but low volume (stealth)
            if time_span > 1800 and len(events) <= 15:
                # Check for variety in attack types (sophisticated)
                attack_types = set(e.attack_type for e in events)

                if len(attack_types) >= 3:
                    confidence = 0.6

                    # Higher confidence if includes both recon and exploitation
                    has_recon = any("honeypot" in e.attack_type.lower() for e in events)
                    has_exploit = any(
                        "idor" in e.attack_type.lower() or
                        "bypass" in e.attack_type.lower()
                        for e in events
                    )

                    if has_recon and has_exploit:
                        confidence = 0.8

                    pattern = AttackPattern(
                        pattern_id=f"apt_{ip}_{int(datetime.utcnow().timestamp())}",
                        pattern_type="apt_indicators",
                        confidence=confidence,
                        severity="critical",
                        attacker_ips={ip},
                        events=sorted(events, key=lambda e: e.timestamp),
                        first_seen=min(e.timestamp for e in events),
                        last_seen=max(e.timestamp for e in events),
                        description=f"APT indicators: Sustained, sophisticated attack from {ip} over {time_span / 60:.1f} minutes",
                        recommended_actions=[
                            "CRITICAL: Escalate to senior security team immediately",
                            "DO NOT ban IP yet - monitor and collect intelligence",
                            "Enable enhanced logging for this IP",
                            "Check threat intelligence feeds",
                            "Review all successful requests from this IP",
                            "Prepare forensic analysis",
                            "Consider honeypot deployment for attribution",
                            "Notify CISO/security leadership"
                        ]
                    )

                    self._add_pattern(pattern)

    def _add_pattern(self, pattern: AttackPattern) -> None:
        """
        Add detected pattern to list (avoiding duplicates)

        Args:
            pattern: AttackPattern to add
        """
        # Check if similar pattern already exists
        for existing in self.patterns:
            if (existing.pattern_type == pattern.pattern_type and
                existing.attacker_ips == pattern.attacker_ips and
                (pattern.last_seen - existing.last_seen).total_seconds() < 300):  # Within 5 min
                # Update existing pattern
                existing.last_seen = pattern.last_seen
                existing.events.extend(pattern.events)
                existing.confidence = max(existing.confidence, pattern.confidence)
                logger.debug(f"Updated existing pattern: {existing.pattern_id}")
                return

        # Add new pattern
        self.patterns.append(pattern)
        logger.warning(
            f"New attack pattern detected: type={pattern.pattern_type}, "
            f"severity={pattern.severity}, confidence={pattern.confidence:.2f}, "
            f"ips={pattern.attacker_ips}"
        )

    def get_patterns(
        self,
        min_confidence: float = 0.0,
        severity: Optional[str] = None,
        pattern_type: Optional[str] = None
    ) -> List[AttackPattern]:
        """
        Get detected attack patterns with optional filtering

        Args:
            min_confidence: Minimum confidence threshold (0.0 - 1.0)
            severity: Filter by severity (low, medium, high, critical)
            pattern_type: Filter by pattern type

        Returns:
            List of matching AttackPatterns
        """
        filtered = self.patterns

        if min_confidence > 0:
            filtered = [p for p in filtered if p.confidence >= min_confidence]

        if severity:
            filtered = [p for p in filtered if p.severity == severity]

        if pattern_type:
            filtered = [p for p in filtered if p.pattern_type == pattern_type]

        return sorted(filtered, key=lambda p: p.last_seen, reverse=True)

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get correlation engine statistics

        Returns:
            Dictionary with engine statistics
        """
        return {
            "total_events": len(self.events),
            "unique_ips": len(self.ip_activity),
            "patterns_detected": len(self.patterns),
            "patterns_by_type": {
                pattern_type: len([p for p in self.patterns if p.pattern_type == pattern_type])
                for pattern_type in set(p.pattern_type for p in self.patterns)
            },
            "patterns_by_severity": {
                severity: len([p for p in self.patterns if p.severity == severity])
                for severity in ["low", "medium", "high", "critical"]
            },
            "time_window_minutes": self.time_window.total_seconds() / 60,
            "oldest_event": min((e.timestamp for e in self.events), default=None),
            "newest_event": max((e.timestamp for e in self.events), default=None)
        }

    def export_patterns_json(self) -> str:
        """
        Export detected patterns as JSON

        Returns:
            JSON string with pattern data
        """
        patterns_data = []
        for pattern in self.patterns:
            patterns_data.append({
                "pattern_id": pattern.pattern_id,
                "pattern_type": pattern.pattern_type,
                "confidence": pattern.confidence,
                "severity": pattern.severity,
                "attacker_ips": list(pattern.attacker_ips),
                "event_count": len(pattern.events),
                "first_seen": pattern.first_seen.isoformat(),
                "last_seen": pattern.last_seen.isoformat(),
                "description": pattern.description,
                "recommended_actions": pattern.recommended_actions
            })

        return json.dumps({
            "patterns": patterns_data,
            "statistics": self.get_statistics(),
            "generated_at": datetime.utcnow().isoformat()
        }, indent=2)


# Global correlation engine instance
correlation_engine = AttackCorrelationEngine(time_window_minutes=60)
