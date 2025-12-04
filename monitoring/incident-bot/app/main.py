"""
DevSecOps Incident Response Bot - Main Application

Receives alerts from Alertmanager and executes automated response actions.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from pydantic import BaseModel

from app.config import settings
from app.models.alert import AlertmanagerWebhook
from app.models.runbook import RunbookExecution
from app.services.executor import RunbookExecutor
from app.services.runbook_loader import RunbookLoader
from app.correlation import correlation_engine, AttackEvent
from app.routes import time_breach

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

# Global instances
runbook_loader: RunbookLoader | None = None
executor: RunbookExecutor | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager."""
    global runbook_loader, executor

    # Startup
    logger.info("Starting Incident Response Bot...")

    # Initialize runbook loader
    runbook_loader = RunbookLoader(settings.runbook_dir)
    stats = runbook_loader.get_stats()
    logger.info(f"Loaded {stats['total_runbooks']} runbooks")

    # Initialize executor
    executor = RunbookExecutor()

    logger.info("Incident Response Bot started successfully")

    yield

    # Shutdown
    logger.info("Shutting down Incident Response Bot...")
    if executor:
        await executor.close()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

# Include routers
app.include_router(time_breach.router, prefix="/api")


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    timestamp: str
    runbooks_loaded: int
    executions_count: int


class StatsResponse(BaseModel):
    """Statistics response."""

    runbook_stats: Dict[str, int]
    execution_stats: Dict[str, Any]


class ExecutionsResponse(BaseModel):
    """Executions list response."""

    count: int
    executions: List[RunbookExecution]


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Health check endpoint."""
    from app import metrics

    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc).isoformat(),
        runbooks_loaded=len(runbook_loader.runbooks) if runbook_loader else 0,
        executions_count=len(executor.executions) if executor else 0,
    )


@app.post("/webhook")
async def webhook(request: Request) -> JSONResponse:
    """
    Alertmanager webhook endpoint.

    Receives alerts and triggers appropriate runbooks.
    """
    from app import metrics

    if not runbook_loader or not executor:
        raise HTTPException(status_code=503, detail="Service not ready")

    try:
        # Parse webhook payload
        payload = await request.json()
        webhook_data = AlertmanagerWebhook(**payload)

        logger.info(
            f"Received webhook: {len(webhook_data.alerts)} alerts, "
            f"status={webhook_data.status}"
        )

        metrics.webhook_requests_total.labels(status="success").inc()

        # Process only firing alerts
        firing_alerts = webhook_data.get_firing_alerts()

        if not firing_alerts:
            logger.info("No firing alerts in webhook, skipping")
            return JSONResponse(
                {
                    "status": "received",
                    "message": "No firing alerts to process",
                }
            )

        # Track metrics
        for alert in firing_alerts:
            metrics.webhook_alerts_received.labels(alert_status="firing").inc()

        # Process each alert
        executions = []
        for alert in firing_alerts:
            logger.info(f"Processing alert: {alert.labels.alertname}")

            # Track incident
            metrics.incidents_total.labels(
                severity=alert.labels.severity or "unknown",
                category=alert.labels.category or "unknown",
                alertname=alert.labels.alertname,
            ).inc()

            metrics.incidents_processing.inc()

            try:
                # Find matching runbooks
                matching_runbooks = runbook_loader.find_matching_runbooks(alert)

                if not matching_runbooks:
                    logger.warning(
                        f"No matching runbook for alert: {alert.labels.alertname}"
                    )
                    metrics.runbook_no_match_total.labels(
                        alertname=alert.labels.alertname
                    ).inc()
                    continue

                # Execute first matching runbook (highest priority)
                runbook = matching_runbooks[0]
                logger.info(
                    f"Executing runbook '{runbook.name}' for alert '{alert.labels.alertname}'"
                )

                metrics.runbook_matches_total.labels(
                    alertname=alert.labels.alertname
                ).inc()

                # Execute with timing
                start_time = datetime.now(timezone.utc)
                execution = await executor.execute_runbook(
                    runbook, alert, context={"webhook": payload}
                )

                # Track metrics
                duration = (datetime.now(timezone.utc) - start_time).total_seconds()
                metrics.runbook_execution_duration_seconds.labels(
                    runbook_name=runbook.name
                ).observe(duration)

                metrics.runbook_executions_total.labels(
                    runbook_name=runbook.name, status=execution.status
                ).inc()

                # Track action metrics
                for action_result in execution.action_results:
                    status = "success" if action_result["success"] else "failed"
                    metrics.actions_total.labels(
                        action_type=action_result["action_type"], status=status
                    ).inc()

                executions.append(execution.model_dump())

            finally:
                metrics.incidents_processing.dec()

        return JSONResponse(
            {
                "status": "processed",
                "alerts_processed": len(firing_alerts),
                "executions": executions,
            }
        )

    except Exception as e:
        logger.error(f"Error processing webhook: {e}", exc_info=True)
        metrics.webhook_requests_total.labels(status="error").inc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/incidents", response_model=ExecutionsResponse)
async def list_incidents(limit: int = 50) -> ExecutionsResponse:
    """List recent incident executions."""
    if not executor:
        raise HTTPException(status_code=503, detail="Service not ready")

    executions = executor.get_executions(limit=limit)
    return ExecutionsResponse(
        count=len(executions),
        executions=executions,
    )


@app.get("/stats", response_model=StatsResponse)
async def get_stats() -> StatsResponse:
    """Get incident bot statistics."""
    if not runbook_loader or not executor:
        raise HTTPException(status_code=503, detail="Service not ready")

    return StatsResponse(
        runbook_stats=runbook_loader.get_stats(),
        execution_stats=executor.get_execution_stats(),
    )


@app.post("/reload")
async def reload_runbooks() -> JSONResponse:
    """Reload runbooks from disk."""
    if not runbook_loader:
        raise HTTPException(status_code=503, detail="Service not ready")

    runbook_loader.reload()
    stats = runbook_loader.get_stats()

    return JSONResponse(
        {
            "status": "reloaded",
            "runbooks_loaded": stats["total_runbooks"],
        }
    )


@app.get("/metrics")
async def metrics() -> PlainTextResponse:
    """Prometheus metrics endpoint."""
    return PlainTextResponse(
        content=generate_latest().decode("utf-8"),
        media_type=CONTENT_TYPE_LATEST,
    )


# ============================================================================
# Attack Correlation & Real-time Feed Endpoints
# ============================================================================


@app.post("/api/attack-event")
async def report_attack_event(event_data: Dict[str, Any]) -> JSONResponse:
    """
    Report an attack event to the correlation engine

    Expected payload:
    {
        "timestamp": "2024-01-01T12:00:00Z",  # ISO format (optional, defaults to now)
        "ip_address": "192.168.1.100",
        "attack_type": "honeypot_admin_panel",
        "severity": "high",  # low, medium, high, critical
        "target": "/admin",
        "details": {...},  # Additional context
        "user_agent": "Mozilla/5.0..."  # Optional
    }
    """
    try:
        # Parse timestamp
        timestamp_str = event_data.get("timestamp")
        if timestamp_str:
            timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        else:
            timestamp = datetime.now(timezone.utc)

        # Create attack event
        attack_event = AttackEvent(
            timestamp=timestamp,
            ip_address=event_data["ip_address"],
            attack_type=event_data["attack_type"],
            severity=event_data["severity"],
            target=event_data["target"],
            details=event_data.get("details", {}),
            user_agent=event_data.get("user_agent")
        )

        # Add to correlation engine
        correlation_engine.add_event(attack_event)

        logger.info(
            f"Attack event recorded: type={attack_event.attack_type}, "
            f"ip={attack_event.ip_address}, severity={attack_event.severity}"
        )

        return JSONResponse({
            "status": "recorded",
            "event": {
                "attack_type": attack_event.attack_type,
                "ip_address": attack_event.ip_address,
                "severity": attack_event.severity,
                "timestamp": attack_event.timestamp.isoformat()
            }
        })

    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing required field: {e}")
    except Exception as e:
        logger.error(f"Error recording attack event: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/attack-patterns")
async def get_attack_patterns(
    min_confidence: float = 0.0,
    severity: str | None = None,
    pattern_type: str | None = None,
    limit: int = 50
) -> JSONResponse:
    """
    Get detected attack patterns from correlation engine

    Query params:
    - min_confidence: Minimum confidence (0.0-1.0)
    - severity: Filter by severity (low, medium, high, critical)
    - pattern_type: Filter by type (reconnaissance, multi_stage_attack, etc.)
    - limit: Maximum patterns to return
    """
    try:
        patterns = correlation_engine.get_patterns(
            min_confidence=min_confidence,
            severity=severity,
            pattern_type=pattern_type
        )

        # Limit results
        patterns = patterns[:limit]

        # Serialize patterns
        patterns_data = []
        for pattern in patterns:
            patterns_data.append({
                "pattern_id": pattern.pattern_id,
                "pattern_type": pattern.pattern_type,
                "confidence": pattern.confidence,
                "severity": pattern.severity,
                "attacker_ips": list(pattern.attacker_ips),
                "event_count": len(pattern.events),
                "first_seen": pattern.first_seen.isoformat(),
                "last_seen": pattern.last_seen.isoformat(),
                "duration_minutes": (pattern.last_seen - pattern.first_seen).total_seconds() / 60,
                "description": pattern.description,
                "recommended_actions": pattern.recommended_actions
            })

        return JSONResponse({
            "count": len(patterns_data),
            "patterns": patterns_data,
            "filters": {
                "min_confidence": min_confidence,
                "severity": severity,
                "pattern_type": pattern_type
            }
        })

    except Exception as e:
        logger.error(f"Error retrieving attack patterns: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/attack-feed/realtime")
async def get_realtime_attack_feed(
    last_minutes: int = 60,
    severity: str | None = None,
    attack_type: str | None = None
) -> JSONResponse:
    """
    Get real-time attack event feed

    Query params:
    - last_minutes: Show events from last N minutes (default 60)
    - severity: Filter by severity
    - attack_type: Filter by attack type
    """
    try:
        # Get all events
        events = correlation_engine.events

        # Filter by time window
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=last_minutes)
        events = [e for e in events if e.timestamp >= cutoff_time]

        # Apply filters
        if severity:
            events = [e for e in events if e.severity == severity]

        if attack_type:
            events = [e for e in events if attack_type.lower() in e.attack_type.lower()]

        # Sort by timestamp (newest first)
        events = sorted(events, key=lambda e: e.timestamp, reverse=True)

        # Serialize events
        events_data = []
        for event in events:
            events_data.append({
                "timestamp": event.timestamp.isoformat(),
                "ip_address": event.ip_address,
                "attack_type": event.attack_type,
                "severity": event.severity,
                "target": event.target,
                "user_agent": event.user_agent,
                "details": event.details
            })

        # Group by IP for summary
        ip_summary = {}
        for event in events:
            if event.ip_address not in ip_summary:
                ip_summary[event.ip_address] = {
                    "event_count": 0,
                    "attack_types": set(),
                    "max_severity": "low"
                }
            ip_summary[event.ip_address]["event_count"] += 1
            ip_summary[event.ip_address]["attack_types"].add(event.attack_type)

            # Update max severity
            severity_order = {"low": 1, "medium": 2, "high": 3, "critical": 4}
            current_severity = ip_summary[event.ip_address]["max_severity"]
            if severity_order.get(event.severity, 0) > severity_order.get(current_severity, 0):
                ip_summary[event.ip_address]["max_severity"] = event.severity

        # Convert sets to lists for JSON
        ip_summary_list = []
        for ip, data in ip_summary.items():
            ip_summary_list.append({
                "ip_address": ip,
                "event_count": data["event_count"],
                "attack_types": list(data["attack_types"]),
                "max_severity": data["max_severity"]
            })

        # Sort by event count
        ip_summary_list = sorted(ip_summary_list, key=lambda x: x["event_count"], reverse=True)

        return JSONResponse({
            "summary": {
                "total_events": len(events_data),
                "unique_ips": len(ip_summary),
                "time_window_minutes": last_minutes,
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            "top_attackers": ip_summary_list[:10],  # Top 10
            "recent_events": events_data[:100],  # Last 100 events
            "severity_distribution": {
                "critical": len([e for e in events if e.severity == "critical"]),
                "high": len([e for e in events if e.severity == "high"]),
                "medium": len([e for e in events if e.severity == "medium"]),
                "low": len([e for e in events if e.severity == "low"])
            }
        })

    except Exception as e:
        logger.error(f"Error retrieving attack feed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/correlate")
async def correlate_ids_alert(event_data: Dict[str, Any]) -> JSONResponse:
    """
    Correlate IDS alert with existing attack patterns

    Expected payload from IDS exporter:
    {
        "source": "ids",
        "category": "sql_injection",
        "severity": "critical",
        "src_ip": "192.168.1.100",
        "dest_ip": "172.28.0.3",
        "dest_port": 8080,
        "signature": "SQL Injection - UNION SELECT",
        "timestamp": "2024-01-01T12:00:00Z",
        "http_method": "GET",
        "http_url": "/api/users?id=1' UNION SELECT...",
        "http_user_agent": "Mozilla/5.0...",
        "payload_printable": "..."
    }
    """
    try:
        # Map IDS categories to attack types
        category_mapping = {
            "sql_injection": "sql_injection",
            "xss": "xss_attack",
            "brute_force": "brute_force",
            "scanner": "scanner_detection",
            "honeypot": "honeypot_access",
            "gateway_bypass": "gateway_bypass",
            "idor": "idor_exploitation",
            "command_injection": "command_injection",
            "path_traversal": "path_traversal",
            "rate_limit_abuse": "rate_limit_bypass"
        }

        category = event_data.get("category", "unknown")
        attack_type = category_mapping.get(category, category)

        # Extract target from HTTP URL or use dest_ip:dest_port
        target = event_data.get("http_url",
                                f"{event_data.get('dest_ip')}:{event_data.get('dest_port')}")

        # Parse timestamp
        timestamp_str = event_data.get("timestamp")
        if timestamp_str:
            timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        else:
            timestamp = datetime.now(timezone.utc)

        # Create attack event for correlation
        attack_event = AttackEvent(
            timestamp=timestamp,
            ip_address=event_data["src_ip"],
            attack_type=attack_type,
            severity=event_data.get("severity", "medium"),
            target=target,
            details={
                "source": "ids",
                "signature": event_data.get("signature"),
                "dest_ip": event_data.get("dest_ip"),
                "dest_port": event_data.get("dest_port"),
                "http_method": event_data.get("http_method"),
                "http_url": event_data.get("http_url"),
                "payload": event_data.get("payload_printable", "")[:200]  # Truncate
            },
            user_agent=event_data.get("http_user_agent")
        )

        # Add to correlation engine
        correlation_engine.add_event(attack_event)

        # Check for attack patterns
        patterns = correlation_engine.get_patterns(
            min_confidence=0.5,
            severity=None
        )

        # Find patterns involving this IP
        relevant_patterns = [
            p for p in patterns
            if event_data["src_ip"] in p.attacker_ips
        ]

        logger.info(
            f"IDS alert correlated: category={category}, "
            f"ip={event_data['src_ip']}, signature={event_data.get('signature', 'N/A')}, "
            f"patterns_found={len(relevant_patterns)}"
        )

        return JSONResponse({
            "status": "correlated",
            "event": {
                "attack_type": attack_type,
                "ip_address": attack_event.ip_address,
                "severity": attack_event.severity,
                "timestamp": attack_event.timestamp.isoformat()
            },
            "correlation": {
                "total_patterns": len(patterns),
                "relevant_patterns": len(relevant_patterns),
                "pattern_ids": [p.pattern_id for p in relevant_patterns[:5]]  # Top 5
            }
        })

    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing required field: {e}")
    except Exception as e:
        logger.error(f"Error correlating IDS alert: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/correlation/statistics")
async def get_correlation_statistics() -> JSONResponse:
    """
    Get attack correlation engine statistics
    """
    try:
        stats = correlation_engine.get_statistics()

        # Add timestamp
        stats["timestamp"] = datetime.now(timezone.utc).isoformat()

        # Convert datetime objects to ISO strings
        if stats["oldest_event"]:
            stats["oldest_event"] = stats["oldest_event"].isoformat()
        if stats["newest_event"]:
            stats["newest_event"] = stats["newest_event"].isoformat()

        return JSONResponse(stats)

    except Exception as e:
        logger.error(f"Error retrieving correlation statistics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/defense/metrics")
async def get_defense_metrics() -> JSONResponse:
    """
    Get comprehensive defense metrics for visualization

    This endpoint aggregates data from:
    - Attack correlation engine
    - Incident executions
    - Honeypot statistics (if available)
    """
    try:
        # Get correlation stats
        correlation_stats = correlation_engine.get_statistics()

        # Get incident stats
        incident_stats = executor.get_execution_stats() if executor else {}

        # Get patterns summary
        patterns = correlation_engine.get_patterns()
        patterns_summary = {
            "total_patterns": len(patterns),
            "critical_patterns": len([p for p in patterns if p.severity == "critical"]),
            "high_confidence_patterns": len([p for p in patterns if p.confidence >= 0.7]),
            "active_patterns_last_hour": len([
                p for p in patterns
                if (datetime.now(timezone.utc) - p.last_seen).total_seconds() < 3600
            ])
        }

        # Top attack types
        attack_type_counts = {}
        for event in correlation_engine.events:
            attack_type_counts[event.attack_type] = attack_type_counts.get(event.attack_type, 0) + 1

        top_attack_types = sorted(
            [{"type": k, "count": v} for k, v in attack_type_counts.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:10]

        return JSONResponse({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "correlation": correlation_stats,
            "incidents": incident_stats,
            "patterns": patterns_summary,
            "top_attack_types": top_attack_types,
            "defense_effectiveness": {
                "attacks_detected": correlation_stats["total_events"],
                "patterns_identified": len(patterns),
                "incidents_handled": incident_stats.get("total_executions", 0),
                "success_rate": incident_stats.get("success_rate", 0.0)
            }
        })

    except Exception as e:
        logger.error(f"Error retrieving defense metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Phase 2.5C: Enhanced SIEM-like Correlation & Threat Scoring
# ============================================================================

@app.get("/api/siem/threat-scores")
async def get_threat_scores(
    min_score: float = 0.0,
    time_window_minutes: int = 60,
    limit: int = 50
) -> JSONResponse:
    """
    Get threat scores for all active IPs

    Query params:
    - min_score: Minimum threat score (0-100)
    - time_window_minutes: Time window for scoring
    - limit: Maximum results to return
    """
    try:
        from app.threat_scoring import ThreatScoringEngine

        scoring_engine = ThreatScoringEngine()
        threat_scores = []

        # Score each IP
        for ip, events in correlation_engine.ip_activity.items():
            if not events:
                continue

            score = scoring_engine.score_ip_activity(ip, events, time_window_minutes)

            if score.score >= min_score:
                threat_scores.append({
                    "ip_address": ip,
                    "threat_score": round(score.score, 2),
                    "threat_level": score.level,
                    "confidence": round(score.confidence, 2),
                    "factors": {k: round(v, 2) for k, v in score.factors.items()},
                    "recommendation": score.recommendation,
                    "event_count": len(events),
                    "attack_types": list(set(e.attack_type for e in events))
                })

        # Sort by threat score (highest first)
        threat_scores.sort(key=lambda x: x["threat_score"], reverse=True)

        return JSONResponse({
            "count": len(threat_scores[:limit]),
            "time_window_minutes": time_window_minutes,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "threat_scores": threat_scores[:limit]
        })

    except Exception as e:
        logger.error(f"Error calculating threat scores: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/siem/pattern-scores")
async def get_pattern_scores(min_score: float = 0.0) -> JSONResponse:
    """
    Get threat scores for all detected patterns

    Query params:
    - min_score: Minimum threat score (0-100)
    """
    try:
        from app.threat_scoring import ThreatScoringEngine

        scoring_engine = ThreatScoringEngine()
        pattern_scores = []

        # Get all patterns
        patterns = correlation_engine.get_patterns()

        for pattern in patterns:
            score = scoring_engine.score_pattern(pattern)

            if score.score >= min_score:
                pattern_scores.append({
                    "pattern_id": pattern.pattern_id,
                    "pattern_type": pattern.pattern_type,
                    "threat_score": round(score.score, 2),
                    "threat_level": score.level,
                    "confidence": round(score.confidence, 2),
                    "factors": {k: round(v, 2) for k, v in score.factors.items()},
                    "recommendation": score.recommendation,
                    "attacker_ips": list(pattern.attacker_ips),
                    "event_count": len(pattern.events),
                    "first_seen": pattern.first_seen.isoformat(),
                    "last_seen": pattern.last_seen.isoformat()
                })

        # Sort by threat score (highest first)
        pattern_scores.sort(key=lambda x: x["threat_score"], reverse=True)

        return JSONResponse({
            "count": len(pattern_scores),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "pattern_scores": pattern_scores
        })

    except Exception as e:
        logger.error(f"Error calculating pattern scores: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/siem/risk-assessment")
async def get_risk_assessment(time_window_hours: int = 24) -> JSONResponse:
    """
    Get overall risk assessment for the environment

    Query params:
    - time_window_hours: Time window for risk calculation (default 24h)
    """
    try:
        from app.threat_scoring import ThreatScoringEngine

        scoring_engine = ThreatScoringEngine()

        # Calculate metrics for risk assessment
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=time_window_hours)
        recent_events = [e for e in correlation_engine.events if e.timestamp >= cutoff_time]

        total_events = len(recent_events)
        patterns = correlation_engine.get_patterns()
        total_patterns = len(patterns)

        # Count high severity events
        high_severity_events = len([
            e for e in recent_events
            if e.severity in ["high", "critical"]
        ])

        # Count critical IPs (threat score >= 75)
        critical_ips = 0
        for ip, events in correlation_engine.ip_activity.items():
            score = scoring_engine.score_ip_activity(ip, events, time_window_hours * 60)
            if score.score >= 75:
                critical_ips += 1

        # Calculate risk assessment
        risk_assessment = scoring_engine.calculate_risk_assessment(
            total_events=total_events,
            total_patterns=total_patterns,
            critical_ips=critical_ips,
            high_severity_events=high_severity_events,
            time_window_hours=time_window_hours
        )

        # Add timestamp
        risk_assessment["timestamp"] = datetime.now(timezone.utc).isoformat()

        return JSONResponse(risk_assessment)

    except Exception as e:
        logger.error(f"Error calculating risk assessment: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/siem/dashboard")
async def get_siem_dashboard() -> JSONResponse:
    """
    Get comprehensive SIEM dashboard data

    Includes:
    - Overall risk assessment
    - Top threat IPs
    - Recent high-risk patterns
    - Attack timeline
    - Defense effectiveness metrics
    """
    try:
        from app.threat_scoring import ThreatScoringEngine

        scoring_engine = ThreatScoringEngine()

        # Get risk assessment (last 24h)
        cutoff_24h = datetime.now(timezone.utc) - timedelta(hours=24)
        recent_events = [e for e in correlation_engine.events if e.timestamp >= cutoff_24h]

        total_events = len(recent_events)
        patterns = correlation_engine.get_patterns()
        high_severity_events = len([e for e in recent_events if e.severity in ["high", "critical"]])

        # Count critical IPs
        critical_ips = 0
        top_threats = []
        for ip, events in correlation_engine.ip_activity.items():
            score = scoring_engine.score_ip_activity(ip, events, 24 * 60)
            if score.score >= 75:
                critical_ips += 1
            if score.score >= 25:  # Medium or higher
                top_threats.append({
                    "ip": ip,
                    "score": round(score.score, 2),
                    "level": score.level,
                    "event_count": len(events)
                })

        # Sort top threats
        top_threats.sort(key=lambda x: x["score"], reverse=True)

        # Risk assessment
        risk = scoring_engine.calculate_risk_assessment(
            total_events=total_events,
            total_patterns=len(patterns),
            critical_ips=critical_ips,
            high_severity_events=high_severity_events,
            time_window_hours=24
        )

        # Top attack types
        attack_type_counts = {}
        for event in recent_events:
            attack_type_counts[event.attack_type] = attack_type_counts.get(event.attack_type, 0) + 1

        top_attack_types = sorted(
            [{"type": k, "count": v} for k, v in attack_type_counts.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:10]

        # Pattern summary
        pattern_summary = {
            "total": len(patterns),
            "by_type": {},
            "by_severity": {"low": 0, "medium": 0, "high": 0, "critical": 0}
        }

        for pattern in patterns:
            pattern_summary["by_type"][pattern.pattern_type] = \
                pattern_summary["by_type"].get(pattern.pattern_type, 0) + 1
            pattern_summary["by_severity"][pattern.severity] += 1

        # Attack timeline (last 24 hours, grouped by hour)
        timeline = {}
        for event in recent_events:
            hour_key = event.timestamp.strftime("%Y-%m-%d %H:00")
            if hour_key not in timeline:
                timeline[hour_key] = {"total": 0, "critical": 0, "high": 0}
            timeline[hour_key]["total"] += 1
            if event.severity == "critical":
                timeline[hour_key]["critical"] += 1
            elif event.severity == "high":
                timeline[hour_key]["high"] += 1

        # Defense effectiveness
        incident_stats = executor.get_execution_stats() if executor else {}

        return JSONResponse({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "risk_assessment": risk,
            "top_threats": top_threats[:10],
            "attack_summary": {
                "total_events_24h": total_events,
                "high_severity_events": high_severity_events,
                "unique_attackers": len(correlation_engine.ip_activity),
                "critical_ips": critical_ips,
                "patterns_detected": len(patterns)
            },
            "top_attack_types": top_attack_types,
            "pattern_summary": pattern_summary,
            "attack_timeline": timeline,
            "defense_effectiveness": {
                "automated_responses": incident_stats.get("total_executions", 0),
                "response_success_rate": incident_stats.get("success_rate", 0.0),
                "avg_response_time": incident_stats.get("avg_duration", 0.0)
            }
        })

    except Exception as e:
        logger.error(f"Error generating SIEM dashboard: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Phase 2.7: Incident Management & Infrastructure Monitoring Endpoints
# ============================================================================


@app.get("/api/incidents/reports")
async def list_incident_reports() -> JSONResponse:
    """
    List all generated incident reports

    Returns:
        JSON with list of reports (filename, format, size, timestamp)
    """
    try:
        report_dir = Path(settings.report_output_dir)
        if not report_dir.exists():
            return JSONResponse({
                "count": 0,
                "reports": [],
                "timestamp": datetime.now(timezone.utc).isoformat()
            })

        reports = []
        for file_path in report_dir.iterdir():
            if file_path.is_file() and file_path.suffix in [".json", ".md"]:
                stat = file_path.stat()
                reports.append({
                    "filename": file_path.name,
                    "format": "json" if file_path.suffix == ".json" else "markdown",
                    "size_bytes": stat.st_size,
                    "created_at": datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat(),
                    "modified_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()
                })

        # Sort by created date (newest first)
        reports.sort(key=lambda x: x["created_at"], reverse=True)

        return JSONResponse({
            "count": len(reports),
            "reports": reports,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    except Exception as e:
        logger.error(f"Error listing incident reports: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/incidents/{filename}/report")
async def download_incident_report(filename: str) -> PlainTextResponse:
    """
    Download specific incident report

    Args:
        filename: Report filename

    Returns:
        File content with appropriate media type
    """
    try:
        report_dir = Path(settings.report_output_dir)
        file_path = report_dir / filename

        # Security check - prevent directory traversal
        if not file_path.resolve().is_relative_to(report_dir.resolve()):
            raise HTTPException(status_code=403, detail="Access denied")

        if not file_path.exists() or not file_path.is_file():
            raise HTTPException(status_code=404, detail="Report not found")

        # Read file content
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Determine media type
        media_type = "application/json" if file_path.suffix == ".json" else "text/markdown"

        return PlainTextResponse(
            content=content,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading report {filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/bans/active")
async def list_active_bans() -> JSONResponse:
    """
    List all active IP bans from Redis

    Returns:
        JSON with list of banned IPs and ban details
    """
    try:
        import redis.asyncio as redis

        r = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=settings.redis_db,
            decode_responses=True,
        )

        try:
            # Get all ban keys
            ban_keys = await r.keys("ip_ban:*")

            bans = []
            for ban_key in ban_keys:
                # Extract IP from key
                ip_address = ban_key.replace("ip_ban:", "")

                # Get ban data
                ban_data = await r.hgetall(ban_key)

                # Get TTL
                ttl = await r.ttl(ban_key)

                if ttl > 0:  # Only include active bans
                    bans.append({
                        "ip_address": ip_address,
                        "reason": ban_data.get("reason", "unknown"),
                        "alert": ban_data.get("alert", "unknown"),
                        "severity": ban_data.get("severity", "unknown"),
                        "banned_at": ban_data.get("banned_at", "unknown"),
                        "expires_in_seconds": ttl,
                        "ban_type": "permanent" if ttl == -1 else "temporary"
                    })

            # Sort by TTL (expiring soonest first)
            bans.sort(key=lambda x: x["expires_in_seconds"])

            return JSONResponse({
                "count": len(bans),
                "bans": bans,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })

        finally:
            await r.close()

    except Exception as e:
        logger.error(f"Error listing active bans: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/runbooks")
async def list_runbooks() -> JSONResponse:
    """
    List all available runbooks

    Returns:
        JSON with runbook catalog (name, priority, category, trigger info)
    """
    if not runbook_loader:
        raise HTTPException(status_code=503, detail="Service not ready")

    try:
        runbooks_data = []

        for runbook in runbook_loader.runbooks:
            runbooks_data.append({
                "name": runbook.name,
                "description": runbook.description,
                "priority": runbook.priority,
                "category": runbook.trigger.category,  # category is in trigger, not in runbook
                "trigger": {
                    "alertname": runbook.trigger.alertname,
                    "severity": runbook.trigger.severity,
                    "category": runbook.trigger.category
                },
                "action_count": len(runbook.actions),
                "action_types": list(set(action.type for action in runbook.actions))
            })

        # Sort by priority (highest first)
        runbooks_data.sort(key=lambda x: x["priority"], reverse=True)

        return JSONResponse({
            "count": len(runbooks_data),
            "runbooks": runbooks_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    except Exception as e:
        logger.error(f"Error listing runbooks: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/runbooks/{runbook_name}")
async def get_runbook_details(runbook_name: str) -> JSONResponse:
    """
    Get detailed information about a specific runbook

    Args:
        runbook_name: Name of the runbook

    Returns:
        JSON with full runbook details including all actions
    """
    if not runbook_loader:
        raise HTTPException(status_code=503, detail="Service not ready")

    try:
        # Find runbook by name
        runbook = next((r for r in runbook_loader.runbooks if r.name == runbook_name), None)

        if not runbook:
            raise HTTPException(status_code=404, detail=f"Runbook '{runbook_name}' not found")

        # Serialize runbook
        runbook_data = {
            "name": runbook.name,
            "description": runbook.description,
            "priority": runbook.priority,
            "category": runbook.trigger.category,  # category is in trigger, not in runbook
            "trigger": {
                "alertname": runbook.trigger.alertname,
                "severity": runbook.trigger.severity,
                "category": runbook.trigger.category
            },
            "actions": [
                {
                    "type": action.type,
                    "description": action.description,
                    "params": action.params,
                    "retry_count": action.retry_count,
                    "retry_delay": action.retry_delay
                }
                for action in runbook.actions
            ],
            "estimated_duration_seconds": len(runbook.actions) * 2  # Rough estimate
        }

        return JSONResponse({
            "runbook": runbook_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting runbook details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/gateway/health")
async def get_gateway_health() -> JSONResponse:
    """
    Get API Gateway health metrics

    Proxies health data from the API Gateway service or returns mock data

    Returns:
        JSON with gateway health metrics (uptime, error_rate, connections, circuit_breaker)
    """
    try:
        import httpx

        # Try to fetch real data from API Gateway
        gateway_url = "http://localhost:8080"  # Default gateway port

        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                # Try to fetch gateway health
                response = await client.get(f"{gateway_url}/health")

                if response.status_code == 200:
                    # Return real data
                    health_data = response.json()
                    return JSONResponse({
                        "status": "healthy",
                        "source": "live",
                        "gateway_url": gateway_url,
                        "uptime_seconds": health_data.get("uptime_seconds", 0),
                        "error_rate": health_data.get("error_rate", 0.0),
                        "active_connections": health_data.get("active_connections", 0),
                        "circuit_breaker_status": health_data.get("circuit_breaker_status", "closed"),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
        except (httpx.ConnectError, httpx.TimeoutException):
            pass  # Fall through to mock data

        # Return mock data if gateway is unavailable
        import random
        return JSONResponse({
            "status": "healthy",
            "source": "mock",
            "gateway_url": gateway_url,
            "uptime_seconds": 86400 + random.randint(0, 3600),  # ~1 day
            "error_rate": round(random.uniform(0.0, 0.05), 4),  # 0-5%
            "active_connections": random.randint(10, 50),
            "circuit_breaker_status": "closed",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": "Gateway unavailable - showing mock data"
        })

    except Exception as e:
        logger.error(f"Error fetching gateway health: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/jwt/validation-stats")
async def get_jwt_validation_stats() -> JSONResponse:
    """
    Get JWT validation statistics

    Returns mock JWT validation metrics

    Returns:
        JSON with validation success rate and failure reasons
    """
    try:
        import random

        # Generate mock JWT validation stats
        total_validations = random.randint(500, 2000)
        failures = random.randint(10, 50)
        success_count = total_validations - failures

        # Distribute failures across reasons
        expired = random.randint(5, failures // 2)
        invalid_signature = random.randint(2, failures // 4)
        malformed = random.randint(1, failures // 4)
        revoked = failures - expired - invalid_signature - malformed

        return JSONResponse({
            "source": "mock",
            "total_validations": total_validations,
            "successful_validations": success_count,
            "failed_validations": failures,
            "success_rate": round(success_count / total_validations * 100, 2),
            "failure_reasons": {
                "expired": expired,
                "invalid_signature": invalid_signature,
                "malformed": malformed,
                "revoked": max(0, revoked)
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": "Mock data - real JWT stats require auth service integration"
        })

    except Exception as e:
        logger.error(f"Error generating JWT stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ids/alerts")
async def get_ids_alerts(
    severity: str | None = None,
    limit: int = 50
) -> JSONResponse:
    """
    Get IDS alerts from Suricata (or mock data on Windows)

    Query params:
    - severity: Filter by severity (low, medium, high, critical)
    - limit: Maximum alerts to return

    Returns:
        JSON with IDS alerts
    """
    try:
        import platform
        import random

        # Platform detection
        is_linux = platform.system() == "Linux"

        if not is_linux:
            # Return mock data on Windows
            mock_alerts = []

            alert_templates = [
                {
                    "category": "sql_injection",
                    "severity": "critical",
                    "signature": "SQL Injection - UNION SELECT",
                    "src_ip": f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                    "dest_port": 8080,
                    "http_method": "GET",
                    "http_url": "/api/users?id=1' UNION SELECT..."
                },
                {
                    "category": "xss",
                    "severity": "high",
                    "signature": "XSS Attempt - Script Tag",
                    "src_ip": f"10.0.{random.randint(0, 255)}.{random.randint(1, 255)}",
                    "dest_port": 8080,
                    "http_method": "POST",
                    "http_url": "/api/comments"
                },
                {
                    "category": "scanner",
                    "severity": "medium",
                    "signature": "Port Scan Detected",
                    "src_ip": f"172.16.{random.randint(0, 255)}.{random.randint(1, 255)}",
                    "dest_port": 22,
                    "http_method": "N/A",
                    "http_url": "N/A"
                },
                {
                    "category": "brute_force",
                    "severity": "high",
                    "signature": "Brute Force Login Attempt",
                    "src_ip": f"203.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 255)}",
                    "dest_port": 8000,
                    "http_method": "POST",
                    "http_url": "/auth/login"
                }
            ]

            # Generate mock alerts
            for _ in range(min(limit, 20)):
                template = random.choice(alert_templates)
                alert = template.copy()
                alert["timestamp"] = (
                    datetime.now(timezone.utc) - timedelta(minutes=random.randint(0, 60))
                ).isoformat()
                alert["alert_id"] = f"ids-{random.randint(10000, 99999)}"

                # Apply severity filter
                if severity is None or alert["severity"] == severity:
                    mock_alerts.append(alert)

            return JSONResponse({
                "source": "mock",
                "platform": "Windows",
                "count": len(mock_alerts[:limit]),
                "alerts": mock_alerts[:limit],
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "note": "Mock data - Suricata IDS requires Linux"
            })
        else:
            # TODO: Implement real Suricata integration on Linux
            return JSONResponse({
                "source": "unavailable",
                "platform": "Linux",
                "count": 0,
                "alerts": [],
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "note": "Suricata integration not yet implemented"
            })

    except Exception as e:
        logger.error(f"Error fetching IDS alerts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ids/statistics")
async def get_ids_statistics() -> JSONResponse:
    """
    Get IDS engine statistics

    Returns:
        JSON with IDS statistics (total alerts, alerts by category, top sources)
    """
    try:
        import platform
        import random

        is_linux = platform.system() == "Linux"

        if not is_linux:
            # Return mock statistics on Windows
            return JSONResponse({
                "source": "mock",
                "platform": "Windows",
                "total_alerts_24h": random.randint(50, 200),
                "alerts_by_severity": {
                    "critical": random.randint(5, 15),
                    "high": random.randint(10, 30),
                    "medium": random.randint(15, 50),
                    "low": random.randint(20, 100)
                },
                "alerts_by_category": {
                    "sql_injection": random.randint(5, 20),
                    "xss": random.randint(3, 15),
                    "scanner": random.randint(10, 40),
                    "brute_force": random.randint(8, 25),
                    "path_traversal": random.randint(2, 10)
                },
                "top_source_ips": [
                    {"ip": f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}", "count": random.randint(10, 30)},
                    {"ip": f"10.0.{random.randint(0, 255)}.{random.randint(1, 255)}", "count": random.randint(5, 20)},
                    {"ip": f"172.16.{random.randint(0, 255)}.{random.randint(1, 255)}", "count": random.randint(3, 15)}
                ],
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "note": "Mock data - Suricata IDS requires Linux"
            })
        else:
            # TODO: Implement real Suricata statistics on Linux
            return JSONResponse({
                "source": "unavailable",
                "platform": "Linux",
                "total_alerts_24h": 0,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "note": "Suricata integration not yet implemented"
            })

    except Exception as e:
        logger.error(f"Error fetching IDS statistics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5002)

