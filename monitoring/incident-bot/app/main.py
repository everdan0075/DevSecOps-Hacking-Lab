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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5002)

