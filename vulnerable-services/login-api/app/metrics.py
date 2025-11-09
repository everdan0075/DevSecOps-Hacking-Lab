"""
Prometheus metrics helpers for login API
"""

from prometheus_client import Counter

# Core login metrics
LOGIN_ATTEMPTS_TOTAL = Counter(
    "login_attempts_total",
    "Total number of login attempts handled by the login API",
    ["outcome"],
)

FAILED_LOGIN_TOTAL = Counter(
    "login_failed_total",
    "Total number of failed login attempts grouped by reason",
    ["reason"],
)

IP_BANS_TOTAL = Counter(
    "ip_bans_total",
    "Total number of IP bans issued by the login API",
    ["reason"],
)

RATE_LIMIT_BLOCKS_TOTAL = Counter(
    "rate_limit_blocks_total",
    "Total number of requests blocked by rate limiting",
    ["endpoint"],
)

LOGIN_STAGE_TOTAL = Counter(
    "login_stage_total",
    "Total number of authentication flow events grouped by stage",
    ["stage"],
)

MFA_ATTEMPTS_TOTAL = Counter(
    "mfa_attempts_total",
    "Total number of MFA verification attempts",
    ["result"],
)

JWT_REFRESH_TOTAL = Counter(
    "jwt_refresh_total",
    "Total number of refresh token operations",
    ["status"],
)


def observe_login_success() -> None:
    """Increment counters when a login succeeds."""
    LOGIN_ATTEMPTS_TOTAL.labels(outcome="success").inc()


def observe_login_failure(reason: str) -> None:
    """Increment counters when a login fails."""
    LOGIN_ATTEMPTS_TOTAL.labels(outcome="failure").inc()
    FAILED_LOGIN_TOTAL.labels(reason=reason).inc()


def observe_login_blocked(reason: str) -> None:
    """Increment counters when a login attempt is blocked before authentication."""
    LOGIN_ATTEMPTS_TOTAL.labels(outcome="blocked").inc()
    FAILED_LOGIN_TOTAL.labels(reason=reason).inc()


def observe_ip_ban(reason: str) -> None:
    """Increment counters when an IP is banned."""
    IP_BANS_TOTAL.labels(reason=reason).inc()


def observe_rate_limit(endpoint: str) -> None:
    """Increment counters when the rate limiter blocks a request."""
    RATE_LIMIT_BLOCKS_TOTAL.labels(endpoint=endpoint).inc()


def observe_login_stage(stage: str) -> None:
    """Observe a particular stage in the authentication flow."""
    LOGIN_STAGE_TOTAL.labels(stage=stage).inc()


def observe_mfa_attempt(result: str) -> None:
    """Observe MFA verification attempts."""
    MFA_ATTEMPTS_TOTAL.labels(result=result).inc()


def observe_refresh(status: str) -> None:
    """Observe refresh token operations."""
    JWT_REFRESH_TOTAL.labels(status=status).inc()

