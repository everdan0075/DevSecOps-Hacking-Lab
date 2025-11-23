"""
Prometheus metrics for API Gateway
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# Gateway Request Metrics
# ============================================================================

gateway_requests_total = Counter(
    "gateway_requests_total",
    "Total requests processed by gateway",
    ["method", "path", "status_code"]
)

gateway_request_duration_seconds = Histogram(
    "gateway_request_duration_seconds",
    "Gateway request duration in seconds",
    ["method", "path"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

# ============================================================================
# JWT Validation Metrics
# ============================================================================

gateway_jwt_validation_total = Counter(
    "gateway_jwt_validation_total",
    "JWT validation attempts",
    ["result"]  # success, expired, invalid, missing
)

gateway_jwt_validation_failures = Counter(
    "gateway_jwt_validation_failures",
    "JWT validation failures by reason",
    ["reason"]  # expired, invalid_signature, missing_claims, wrong_type
)

# ============================================================================
# Rate Limiting Metrics
# ============================================================================

gateway_rate_limit_blocks_total = Counter(
    "gateway_rate_limit_blocks_total",
    "Total requests blocked by rate limiter",
    ["client_ip"]
)

gateway_rate_limit_tokens_remaining = Gauge(
    "gateway_rate_limit_tokens_remaining",
    "Current rate limit tokens remaining per IP",
    ["client_ip"]
)

# ============================================================================
# WAF Metrics
# ============================================================================

gateway_waf_blocks_total = Counter(
    "gateway_waf_blocks_total",
    "Total requests blocked by WAF",
    ["reason"]  # suspicious_pattern, oversized_request, invalid_method
)

gateway_waf_suspicious_patterns = Counter(
    "gateway_waf_suspicious_patterns",
    "Suspicious patterns detected",
    ["pattern", "client_ip"]
)

# ============================================================================
# Backend Proxy Metrics
# ============================================================================

gateway_backend_requests_total = Counter(
    "gateway_backend_requests_total",
    "Requests proxied to backend services",
    ["backend", "method", "status_code"]
)

gateway_backend_request_duration_seconds = Histogram(
    "gateway_backend_request_duration_seconds",
    "Backend request duration in seconds",
    ["backend", "method"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

gateway_backend_errors_total = Counter(
    "gateway_backend_errors_total",
    "Backend connection errors",
    ["backend", "error_type"]  # connection_error, timeout, bad_gateway
)

# ============================================================================
# Active Connections
# ============================================================================

gateway_active_connections = Gauge(
    "gateway_active_connections",
    "Currently active connections to gateway"
)

# ============================================================================
# Honeypot Metrics
# ============================================================================

honeypot_hits_total = Counter(
    "gateway_honeypot_hits_total",
    "Total honeypot endpoint hits (attacker detection)",
    ["honeypot_type", "severity"]  # admin_panel, secret_file, etc. / low, medium, high, critical
)

honeypot_unique_attackers = Gauge(
    "gateway_honeypot_unique_attackers",
    "Number of unique IP addresses hitting honeypots"
)


def get_metrics() -> Response:
    """
    Endpoint handler for Prometheus metrics
    Returns metrics in Prometheus text format
    """
    metrics_data = generate_latest()
    return Response(
        content=metrics_data,
        media_type=CONTENT_TYPE_LATEST
    )


def track_jwt_validation(success: bool, reason: str = None):
    """
    Track JWT validation metrics
    
    Args:
        success: Whether validation succeeded
        reason: Reason for failure (if applicable)
    """
    if success:
        gateway_jwt_validation_total.labels(result="success").inc()
    else:
        gateway_jwt_validation_total.labels(result="failure").inc()
        if reason:
            gateway_jwt_validation_failures.labels(reason=reason).inc()


def track_rate_limit_block(client_ip: str):
    """
    Track rate limit block
    
    Args:
        client_ip: IP address that was blocked
    """
    gateway_rate_limit_blocks_total.labels(client_ip=client_ip).inc()


def track_waf_block(reason: str, pattern: str = None, client_ip: str = None):
    """
    Track WAF block
    
    Args:
        reason: Reason for block
        pattern: Suspicious pattern detected (if applicable)
        client_ip: Client IP address (if applicable)
    """
    gateway_waf_blocks_total.labels(reason=reason).inc()
    
    if pattern and client_ip:
        gateway_waf_suspicious_patterns.labels(
            pattern=pattern,
            client_ip=client_ip
        ).inc()


def track_backend_request(backend: str, method: str, status_code: int, duration: float):
    """
    Track backend request
    
    Args:
        backend: Backend service name
        method: HTTP method
        status_code: Response status code
        duration: Request duration in seconds
    """
    gateway_backend_requests_total.labels(
        backend=backend,
        method=method,
        status_code=status_code
    ).inc()
    
    gateway_backend_request_duration_seconds.labels(
        backend=backend,
        method=method
    ).observe(duration)


def track_backend_error(backend: str, error_type: str):
    """
    Track backend error
    
    Args:
        backend: Backend service name
        error_type: Type of error (connection_error, timeout, bad_gateway)
    """
    gateway_backend_errors_total.labels(
        backend=backend,
        error_type=error_type
    ).inc()

