"""
Threat Scoring System

Calculates threat scores (0-100) based on multiple factors:
- Attack severity
- Attack frequency
- Attack diversity (multiple attack types)
- Pattern confidence
- Time persistence
- Target criticality
"""
import logging
from typing import List, Dict, Set
from datetime import datetime, timedelta
from dataclasses import dataclass
from .correlation import AttackEvent, AttackPattern

logger = logging.getLogger(__name__)


@dataclass
class ThreatScore:
    """Represents a calculated threat score for an IP or pattern"""
    score: float  # 0-100
    level: str  # low, medium, high, critical
    factors: Dict[str, float]  # Breakdown of score components
    confidence: float  # 0.0-1.0
    recommendation: str


class ThreatScoringEngine:
    """
    Calculates threat scores for attack events and patterns
    """

    # Severity weights
    SEVERITY_WEIGHTS = {
        "low": 10,
        "medium": 25,
        "high": 50,
        "critical": 75
    }

    # Attack type weights (based on OWASP risk)
    ATTACK_TYPE_WEIGHTS = {
        "sql_injection": 20,
        "xss_attack": 15,
        "command_injection": 25,
        "path_traversal": 15,
        "brute_force": 10,
        "scanner_detection": 8,
        "honeypot_access": 12,
        "gateway_bypass": 18,
        "idor_exploitation": 15,
        "rate_limit_bypass": 10,
        "unknown": 5
    }

    # Pattern type weights
    PATTERN_WEIGHTS = {
        "reconnaissance": 15,
        "multi_stage_attack": 30,
        "distributed_attack": 25,
        "credential_stuffing": 20,
        "apt_indicator": 35
    }

    def __init__(self):
        logger.info("Threat Scoring Engine initialized")

    def score_ip_activity(
        self,
        ip: str,
        events: List[AttackEvent],
        time_window_minutes: int = 60
    ) -> ThreatScore:
        """
        Calculate threat score for a specific IP address

        Args:
            ip: IP address to score
            events: List of attack events from this IP
            time_window_minutes: Time window to consider

        Returns:
            ThreatScore object
        """
        if not events:
            return ThreatScore(
                score=0.0,
                level="none",
                factors={},
                confidence=1.0,
                recommendation="No activity detected"
            )

        factors = {}

        # Factor 1: Attack frequency (0-25 points)
        recent_events = [
            e for e in events
            if (datetime.now(e.timestamp.tzinfo) - e.timestamp).total_seconds() < time_window_minutes * 60
        ]
        event_count = len(recent_events)
        frequency_score = min(25, event_count * 2)  # 2 points per event, max 25
        factors["frequency"] = frequency_score

        # Factor 2: Attack diversity (0-20 points)
        attack_types = set(e.attack_type for e in recent_events)
        diversity_score = min(20, len(attack_types) * 5)  # 5 points per unique type
        factors["diversity"] = diversity_score

        # Factor 3: Severity (0-30 points)
        severity_scores = [
            self.SEVERITY_WEIGHTS.get(e.severity, 0) for e in recent_events
        ]
        avg_severity = sum(severity_scores) / len(severity_scores) if severity_scores else 0
        severity_score = min(30, avg_severity / 75 * 30)  # Normalized to 30
        factors["severity"] = severity_score

        # Factor 4: Attack type risk (0-25 points)
        attack_risk_scores = [
            self.ATTACK_TYPE_WEIGHTS.get(e.attack_type, 5) for e in recent_events
        ]
        avg_risk = sum(attack_risk_scores) / len(attack_risk_scores) if attack_risk_scores else 0
        risk_score = min(25, avg_risk / 25 * 25)  # Normalized to 25
        factors["attack_risk"] = risk_score

        # Total score
        total_score = sum(factors.values())

        # Confidence based on event count (more events = higher confidence)
        confidence = min(1.0, event_count / 20)  # Full confidence at 20+ events

        # Determine level and recommendation
        level, recommendation = self._determine_level_and_recommendation(
            total_score, attack_types, event_count
        )

        logger.debug(
            f"Threat score for {ip}: {total_score:.1f} ({level}), "
            f"events={event_count}, types={len(attack_types)}"
        )

        return ThreatScore(
            score=total_score,
            level=level,
            factors=factors,
            confidence=confidence,
            recommendation=recommendation
        )

    def score_pattern(self, pattern: AttackPattern) -> ThreatScore:
        """
        Calculate threat score for an attack pattern

        Args:
            pattern: AttackPattern to score

        Returns:
            ThreatScore object
        """
        factors = {}

        # Factor 1: Pattern type weight (0-35 points)
        pattern_weight = self.PATTERN_WEIGHTS.get(pattern.pattern_type, 10)
        factors["pattern_type"] = pattern_weight

        # Factor 2: Pattern confidence (0-25 points)
        confidence_score = pattern.confidence * 25
        factors["confidence"] = confidence_score

        # Factor 3: Number of involved IPs (0-20 points)
        ip_count = len(pattern.attacker_ips)
        ip_score = min(20, ip_count * 5)  # 5 points per IP, max 20
        factors["ip_count"] = ip_score

        # Factor 4: Event count (0-20 points)
        event_count = len(pattern.events)
        event_score = min(20, event_count * 2)  # 2 points per event, max 20
        factors["event_count"] = event_score

        # Total score
        total_score = sum(factors.values())

        # Use pattern confidence as score confidence
        confidence = pattern.confidence

        # Determine level and recommendation
        level, recommendation = self._determine_pattern_recommendation(
            total_score, pattern.pattern_type, ip_count
        )

        logger.debug(
            f"Threat score for pattern {pattern.pattern_id}: {total_score:.1f} ({level}), "
            f"type={pattern.pattern_type}, IPs={ip_count}"
        )

        return ThreatScore(
            score=total_score,
            level=level,
            factors=factors,
            confidence=confidence,
            recommendation=recommendation
        )

    def _determine_level_and_recommendation(
        self,
        score: float,
        attack_types: Set[str],
        event_count: int
    ) -> tuple:
        """Determine threat level and recommendation based on score"""

        if score >= 75:
            level = "critical"
            recommendation = (
                f"IMMEDIATE ACTION: {event_count} attacks detected with {len(attack_types)} "
                f"different types. Ban IP immediately, enable enhanced monitoring, "
                f"review logs for successful exploitation."
            )
        elif score >= 50:
            level = "high"
            recommendation = (
                f"HIGH PRIORITY: {event_count} attacks detected. Ban IP, review attack "
                f"patterns, check for data exfiltration or privilege escalation."
            )
        elif score >= 25:
            level = "medium"
            recommendation = (
                f"MONITOR: {event_count} suspicious activities detected. Add to watchlist, "
                f"enable rate limiting, monitor for escalation."
            )
        else:
            level = "low"
            recommendation = (
                f"LOW RISK: {event_count} minor activities. Continue monitoring."
            )

        return level, recommendation

    def _determine_pattern_recommendation(
        self,
        score: float,
        pattern_type: str,
        ip_count: int
    ) -> tuple:
        """Determine threat level and recommendation for patterns"""

        if score >= 75:
            level = "critical"
            if pattern_type == "apt_indicator":
                recommendation = (
                    f"APT DETECTED: Advanced persistent threat indicators from {ip_count} IPs. "
                    f"ESCALATE to security team, enable full packet capture, "
                    f"check for lateral movement and data exfiltration."
                )
            elif pattern_type == "multi_stage_attack":
                recommendation = (
                    f"MULTI-STAGE ATTACK: {ip_count} IPs executing coordinated attack chain. "
                    f"Ban all involved IPs, review for successful exploitation, "
                    f"check for persistence mechanisms."
                )
            else:
                recommendation = (
                    f"CRITICAL PATTERN: {pattern_type} detected from {ip_count} IPs. "
                    f"Immediate investigation and response required."
                )
        elif score >= 50:
            level = "high"
            recommendation = (
                f"HIGH-RISK PATTERN: {pattern_type} detected from {ip_count} IPs. "
                f"Implement blocking, review attack timeline, prepare incident report."
            )
        elif score >= 25:
            level = "medium"
            recommendation = (
                f"SUSPICIOUS PATTERN: {pattern_type} detected. Monitor for escalation, "
                f"consider temporary rate limiting."
            )
        else:
            level = "low"
            recommendation = f"INFORMATIONAL: {pattern_type} pattern detected. Continue monitoring."

        return level, recommendation

    def calculate_risk_assessment(
        self,
        total_events: int,
        total_patterns: int,
        critical_ips: int,
        high_severity_events: int,
        time_window_hours: int = 24
    ) -> Dict[str, any]:
        """
        Calculate overall risk assessment for the environment

        Args:
            total_events: Total attack events in time window
            total_patterns: Total detected patterns
            critical_ips: Number of IPs with critical threat score
            high_severity_events: Number of high/critical severity events
            time_window_hours: Time window for assessment

        Returns:
            Risk assessment dictionary
        """
        # Risk factors
        event_risk = min(30, total_events / 10)  # 30 points max
        pattern_risk = min(25, total_patterns * 5)  # 25 points max
        ip_risk = min(25, critical_ips * 10)  # 25 points max
        severity_risk = min(20, high_severity_events / 5)  # 20 points max

        total_risk_score = event_risk + pattern_risk + ip_risk + severity_risk

        # Determine risk level
        if total_risk_score >= 75:
            risk_level = "critical"
            status = "Under active attack"
        elif total_risk_score >= 50:
            risk_level = "high"
            status = "Multiple threats detected"
        elif total_risk_score >= 25:
            risk_level = "medium"
            status = "Suspicious activity present"
        else:
            risk_level = "low"
            status = "Normal security posture"

        return {
            "risk_score": round(total_risk_score, 2),
            "risk_level": risk_level,
            "status": status,
            "factors": {
                "event_volume": round(event_risk, 2),
                "pattern_complexity": round(pattern_risk, 2),
                "critical_ips": round(ip_risk, 2),
                "severity": round(severity_risk, 2)
            },
            "time_window_hours": time_window_hours,
            "metrics": {
                "total_events": total_events,
                "total_patterns": total_patterns,
                "critical_ips": critical_ips,
                "high_severity_events": high_severity_events
            }
        }
