"""
Prometheus metrics for User Service
"""
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# Service metrics
user_service_requests_total = Counter(
    "user_service_requests_total",
    "Total requests to user service",
    ["method", "endpoint", "status_code"]
)

user_service_request_duration_seconds = Histogram(
    "user_service_request_duration_seconds",
    "Request duration in seconds",
    ["method", "endpoint"]
)

# Vulnerability metrics - IDOR
user_service_idor_attempts_total = Counter(
    "user_service_idor_attempts_total",
    "Total IDOR attempts detected (accessing other user's profile)",
    ["authenticated_user", "target_user", "result"]
)

# Vulnerability metrics - Direct Access (bypass gateway)
user_service_direct_access_total = Counter(
    "user_service_direct_access_total",
    "Requests bypassing API Gateway (direct service access)",
    ["endpoint", "source_ip"]
)

# Vulnerability metrics - Unauthorized Settings Access
user_service_unauthorized_settings_access_total = Counter(
    "user_service_unauthorized_settings_access_total",
    "Access to /settings without JWT token",
    ["source_ip"]
)


def get_metrics():
    """Generate Prometheus metrics"""
    return generate_latest()


def get_content_type():
    """Get Prometheus content type"""
    return CONTENT_TYPE_LATEST

