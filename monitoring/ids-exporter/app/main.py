"""
IDS Exporter - Suricata log parser and Prometheus metrics exporter
"""
import asyncio
import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from .config import settings
from .log_parser import SuricataLogParser
from .incident_reporter import IncidentReporter
from . import metrics

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global parser and reporter instances
log_parser: SuricataLogParser = None
incident_reporter: IncidentReporter = None
background_task: asyncio.Task = None


async def process_logs_background():
    """Background task to continuously process Suricata logs"""
    global log_parser, incident_reporter

    logger.info("Started background log processing task")

    while True:
        try:
            # Tail log file for new events
            events = log_parser.tail_log()

            # Process each event
            for event in events:
                start_time = time.time()

                # Update metrics
                log_parser.update_metrics(event)

                # Check if we should report to incident bot
                if event.get("event_type") == "alert":
                    alert = event.get("alert", {})
                    category = log_parser.categorize_alert(alert)
                    severity = log_parser.get_severity(alert)
                    src_ip = event.get("src_ip", "unknown")

                    if log_parser.should_report_to_incident_bot(category, severity, src_ip):
                        await incident_reporter.report_alert(event, category, severity)

                # Track processing duration
                duration = time.time() - start_time
                metrics.ids_alert_processing_duration.observe(duration)

            # Update recent alerts gauge
            log_parser.update_recent_alerts_gauge()

            # Sleep before next iteration
            await asyncio.sleep(settings.LOG_TAIL_INTERVAL)

        except Exception as e:
            logger.error(f"Error in background log processing: {e}")
            await asyncio.sleep(5)  # Back off on errors


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    global log_parser, incident_reporter, background_task

    # Startup
    logger.info("Starting IDS Exporter")
    log_parser = SuricataLogParser()
    incident_reporter = IncidentReporter()

    # Start background task
    background_task = asyncio.create_task(process_logs_background())

    yield

    # Shutdown
    logger.info("Shutting down IDS Exporter")
    if background_task:
        background_task.cancel()
        try:
            await background_task
        except asyncio.CancelledError:
            pass

    if incident_reporter:
        await incident_reporter.close()


# Create FastAPI app
app = FastAPI(
    title="IDS Exporter",
    description="Suricata log parser and Prometheus metrics exporter",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ids-exporter",
        "log_file": settings.SURICATA_EVE_LOG,
        "incident_bot_enabled": settings.INCIDENT_BOT_ENABLED
    }


@app.get("/metrics")
async def metrics_endpoint():
    """Prometheus metrics endpoint"""
    return PlainTextResponse(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


@app.get("/stats")
async def stats():
    """IDS statistics endpoint"""
    active_attackers = len([
        ip for ip, timestamps in log_parser.active_attackers.items()
        if timestamps
    ])

    return {
        "active_attackers": active_attackers,
        "log_file": settings.SURICATA_EVE_LOG,
        "log_position": log_parser.last_position,
        "incident_bot_url": settings.INCIDENT_BOT_URL,
        "incident_bot_enabled": settings.INCIDENT_BOT_ENABLED,
        "thresholds": {
            "critical": settings.CRITICAL_ALERT_THRESHOLD,
            "high": settings.HIGH_ALERT_THRESHOLD,
            "medium": settings.MEDIUM_ALERT_THRESHOLD
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9200, log_level=settings.LOG_LEVEL.lower())
