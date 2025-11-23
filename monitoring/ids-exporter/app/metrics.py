"""
Prometheus metrics for IDS exporter
"""
from prometheus_client import Counter, Gauge, Histogram

# Alert counters by category
ids_alerts_total = Counter(
    "ids_alerts_total",
    "Total IDS alerts detected",
    ["category", "severity", "signature"]
)

# Alert counters by source IP
ids_alerts_by_ip = Counter(
    "ids_alerts_by_ip_total",
    "IDS alerts grouped by source IP",
    ["src_ip", "category"]
)

# Alert counters by destination
ids_alerts_by_dest = Counter(
    "ids_alerts_by_dest_total",
    "IDS alerts grouped by destination",
    ["dest_ip", "dest_port", "category"]
)

# Specific attack type counters
ids_sql_injection_total = Counter(
    "ids_sql_injection_total",
    "SQL injection attempts detected",
    ["src_ip", "signature"]
)

ids_xss_total = Counter(
    "ids_xss_total",
    "XSS attempts detected",
    ["src_ip", "signature"]
)

ids_brute_force_total = Counter(
    "ids_brute_force_total",
    "Brute force attempts detected",
    ["src_ip", "target_endpoint"]
)

ids_scanner_detection_total = Counter(
    "ids_scanner_detection_total",
    "Security scanner detections",
    ["src_ip", "user_agent"]
)

ids_honeypot_access_total = Counter(
    "ids_honeypot_access_total",
    "Honeypot endpoint access attempts",
    ["src_ip", "endpoint"]
)

ids_gateway_bypass_total = Counter(
    "ids_gateway_bypass_total",
    "Gateway bypass attempts (direct service access)",
    ["src_ip", "target_service"]
)

ids_idor_attempts_total = Counter(
    "ids_idor_attempts_total",
    "IDOR exploitation attempts",
    ["src_ip", "user_id"]
)

ids_command_injection_total = Counter(
    "ids_command_injection_total",
    "Command injection attempts",
    ["src_ip", "signature"]
)

ids_path_traversal_total = Counter(
    "ids_path_traversal_total",
    "Path traversal attempts",
    ["src_ip", "signature"]
)

# Real-time gauges
ids_active_attackers = Gauge(
    "ids_active_attackers",
    "Number of unique source IPs with recent alerts (last 5 minutes)"
)

ids_alerts_last_minute = Gauge(
    "ids_alerts_last_minute",
    "Number of alerts in the last minute"
)

# Processing stats
ids_events_processed_total = Counter(
    "ids_events_processed_total",
    "Total events processed from Suricata logs"
)

ids_log_parse_errors_total = Counter(
    "ids_log_parse_errors_total",
    "Log parsing errors"
)

# Alert processing latency
ids_alert_processing_duration = Histogram(
    "ids_alert_processing_duration_seconds",
    "Time spent processing IDS alerts",
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]
)

# Incident bot correlation
ids_incident_reports_sent_total = Counter(
    "ids_incident_reports_sent_total",
    "Alerts forwarded to incident bot",
    ["category", "severity"]
)

ids_incident_reports_failed_total = Counter(
    "ids_incident_reports_failed_total",
    "Failed incident bot notifications"
)
