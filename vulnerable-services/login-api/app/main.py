"""
DevSecOps Hacking Lab - Login API
Intentionally vulnerable authentication service for security testing
"""

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import structlog
from datetime import datetime
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.config import settings
from app.models import LoginRequest, LoginResponse
from app.security import verify_login, get_failed_attempts, record_failed_attempt, is_ip_banned, ban_ip
from app.middleware import setup_middleware
from app.metrics import (
    observe_login_blocked,
    observe_login_failure,
    observe_login_success,
    observe_rate_limit,
)

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="DevSecOps Hacking Lab - Login API",
    description="Vulnerable authentication service for ethical security testing",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

# Prometheus instrumentation
instrumentator = Instrumentator(
    should_group_status_codes=True,
    should_ignore_untemplated=True,
    should_respect_env_var=True,
    env_var_name="PROMETHEUS_INSTRUMENTATION_DISABLED",
    excluded_handlers={"/metrics"},
    should_instrument_requests_inprogress=True,
)

instrumentator.instrument(app)

# Add rate limiter to app
app.state.limiter = limiter

# Setup middleware
setup_middleware(app)


async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Capture rate limiting events for observability."""
    observe_rate_limit(request.url.path)
    return _rate_limit_exceeded_handler(request, exc)


app.add_exception_handler(RateLimitExceeded, rate_limit_handler)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "DevSecOps Hacking Lab - Login API",
        "version": "1.0.0",
        "status": "operational",
        "vulnerabilities": ["brute-force"],
        "defenses": ["rate-limiting", "ip-banning"] if settings.ENABLE_RATE_LIMITING else []
    }


@app.get("/metrics")
async def metrics() -> Response:
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/health")
async def health_check():
    """Health check endpoint for container orchestration"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "login-api"
    }


@app.post("/login", response_model=LoginResponse)
@limiter.limit(f"{settings.RATE_LIMIT_REQUESTS}/{settings.RATE_LIMIT_WINDOW}seconds")
async def login(request: Request, login_data: LoginRequest):
    """
    Login endpoint - VULNERABLE to brute-force attacks
    
    This endpoint intentionally lacks proper security controls for educational purposes.
    
    Defense mechanisms:
    - Rate limiting (configurable)
    - IP banning after threshold (configurable)
    - Request logging for monitoring
    """
    client_ip = get_remote_address(request)
    
    # Log the login attempt
    logger.info(
        "login_attempt",
        username=login_data.username,
        client_ip=client_ip,
        timestamp=datetime.utcnow().isoformat()
    )
    
    # Check if IP is banned
    if settings.ENABLE_IP_BANNING and is_ip_banned(client_ip):
        logger.warning(
            "login_attempt_from_banned_ip",
            client_ip=client_ip,
            username=login_data.username
        )
        observe_login_blocked("ip_banned")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your IP has been temporarily banned due to suspicious activity"
        )
    
    # Verify credentials
    is_valid = verify_login(login_data.username, login_data.password)
    
    if is_valid:
        logger.info(
            "login_success",
            username=login_data.username,
            client_ip=client_ip
        )
        observe_login_success()
        return LoginResponse(
            success=True,
            message="Login successful",
            token="mock-jwt-token-" + login_data.username
        )
    else:
        # Record failed attempt
        failed_count = record_failed_attempt(client_ip, login_data.username)
        observe_login_failure("invalid_credentials")
        logger.warning(
            "login_failed",
            username=login_data.username,
            client_ip=client_ip,
            failed_attempts=failed_count
        )
        
        # Check if we should ban this IP
        if settings.ENABLE_IP_BANNING and failed_count >= settings.BAN_THRESHOLD:
            ban_ip(client_ip, reason="failed_attempt_threshold")
            observe_login_blocked("ip_ban_threshold")
            logger.warning(
                "ip_banned",
                client_ip=client_ip,
                reason="exceeded_failed_login_threshold",
                threshold=settings.BAN_THRESHOLD
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Too many failed attempts. Your IP has been temporarily banned."
            )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )


@app.get("/stats")
async def get_stats(request: Request):
    """
    Get statistics about login attempts (for monitoring)
    Note: This endpoint should be protected in production!
    """
    client_ip = get_remote_address(request)
    failed_attempts = get_failed_attempts(client_ip)
    is_banned = is_ip_banned(client_ip)
    
    return {
        "client_ip": client_ip,
        "failed_attempts": failed_attempts,
        "is_banned": is_banned,
        "rate_limiting_enabled": settings.ENABLE_RATE_LIMITING,
        "ip_banning_enabled": settings.ENABLE_IP_BANNING
    }


@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info(
        "service_starting",
        service="login-api",
        environment=settings.ENVIRONMENT,
        rate_limiting=settings.ENABLE_RATE_LIMITING,
        ip_banning=settings.ENABLE_IP_BANNING
    )


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("service_shutting_down", service="login-api")




