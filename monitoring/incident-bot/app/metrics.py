"""Prometheus metrics for incident bot."""

from __future__ import annotations

from prometheus_client import Counter, Gauge, Histogram

# Incident metrics
incidents_total = Counter(
    "incident_bot_incidents_total",
    "Total number of incidents handled",
    ["severity", "category", "alertname"],
)

incidents_processing = Gauge(
    "incident_bot_incidents_processing",
    "Number of incidents currently being processed",
)

# Action metrics
actions_total = Counter(
    "incident_bot_actions_total",
    "Total number of actions executed",
    ["action_type", "status"],
)

actions_duration_seconds = Histogram(
    "incident_bot_action_duration_seconds",
    "Duration of action execution",
    ["action_type"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
)

# Runbook metrics
runbook_executions_total = Counter(
    "incident_bot_runbook_executions_total",
    "Total number of runbook executions",
    ["runbook_name", "status"],
)

runbook_execution_duration_seconds = Histogram(
    "incident_bot_runbook_execution_duration_seconds",
    "Duration of runbook execution",
    ["runbook_name"],
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0],
)

# Alert matching metrics
runbook_matches_total = Counter(
    "incident_bot_runbook_matches_total",
    "Total number of runbook matches for alerts",
    ["alertname"],
)

runbook_no_match_total = Counter(
    "incident_bot_runbook_no_match_total",
    "Total number of alerts with no matching runbook",
    ["alertname"],
)

# Webhook metrics
webhook_requests_total = Counter(
    "incident_bot_webhook_requests_total",
    "Total number of webhook requests received",
    ["status"],
)

webhook_alerts_received = Counter(
    "incident_bot_webhook_alerts_received",
    "Total number of alerts received from webhooks",
    ["alert_status"],
)

