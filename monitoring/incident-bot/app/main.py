"""
DevSecOps Incident Response Bot - Main Application

Receives alerts from Alertmanager and executes automated response actions.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime
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
        timestamp=datetime.utcnow().isoformat(),
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
                start_time = datetime.utcnow()
                execution = await executor.execute_runbook(
                    runbook, alert, context={"webhook": payload}
                )

                # Track metrics
                duration = (datetime.utcnow() - start_time).total_seconds()
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
            timestamp = datetime.utcnow()

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
        cutoff_time = datetime.utcnow() - timedelta(minutes=last_minutes)
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
                "timestamp": datetime.utcnow().isoformat()
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


@app.get("/api/correlation/statistics")
async def get_correlation_statistics() -> JSONResponse:
    """
    Get attack correlation engine statistics
    """
    try:
        stats = correlation_engine.get_statistics()

        # Add timestamp
        stats["timestamp"] = datetime.utcnow().isoformat()

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
                if (datetime.utcnow() - p.last_seen).total_seconds() < 3600
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
            "timestamp": datetime.utcnow().isoformat(),
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5002)

