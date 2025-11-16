"""
DevSecOps Hacking Lab - Authentication Service
Secure authentication flow with HTTPS, MFA, and token-based sessions.
"""

from datetime import datetime
from typing import Optional

import redis.asyncio as redis_async
import structlog
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, status
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from prometheus_fastapi_instrumentator import Instrumentator
from redis.asyncio import Redis
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.middleware import setup_middleware
from app.metrics import (
    observe_login_blocked,
    observe_login_failure,
    observe_login_stage,
    observe_login_success,
    observe_mfa_attempt,
    observe_rate_limit,
    observe_refresh,
)
from app.models import (
    BasicResponse,
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    MfaVerifyRequest,
    RefreshRequest,
    TokenResponse,
)
from app.security import (
    ban_ip,
    clear_failed_attempts,
    create_mfa_challenge,
    current_mfa_code,
    delete_mfa_challenge,
    generate_token_bundle,
    get_failed_attempts,
    get_mfa_challenge,
    get_security_stats,
    increment_mfa_attempts,
    is_ip_banned,
    record_failed_attempt,
    revoke_all_refresh_tokens,
    revoke_refresh_token,
    verify_login,
    verify_mfa_code,
    verify_refresh_token,
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
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Custom key function for rate limiting that skips direct access
def custom_rate_limit_key(request: Request) -> str:
    """
    Generate rate limit key.
    Returns unique key for each direct access request to effectively bypass rate limiting.
    """
    # Check for X-Direct-Access header (Security OFF mode)
    if request.headers.get("X-Direct-Access") == "true":
        # Return unique key for each request - effectively no rate limiting
        import uuid
        unique_key = f"direct-access-{uuid.uuid4()}"
        logger.info(
            "rate_limit_bypassed",
            path=request.url.path,
            client_ip=get_remote_address(request),
            reason="direct_access_header"
        )
        return unique_key

    # Normal rate limiting by IP
    return get_remote_address(request)


# Initialize rate limiter with custom key function
limiter = Limiter(key_func=custom_rate_limit_key)

# Create FastAPI app
app = FastAPI(
    title=settings.SERVICE_NAME,
    description="Secure authentication service for the DevSecOps Hacking Lab",
    version="2.0.0",
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

# Add rate limiter to app and configure middleware
app.state.limiter = limiter
setup_middleware(app)

# API router for authentication endpoints
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


async def get_redis(request: Request) -> Redis:
    redis: Optional[Redis] = getattr(request.app.state, "redis", None)
    if redis is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Redis connection not available",
        )
    return redis


def build_token_response(bundle, message: str) -> TokenResponse:
    access_expires_in = max(
        int((bundle.access_expires_at - datetime.utcnow()).total_seconds()), 0
    )
    refresh_expires_in = max(
        int((bundle.refresh_expires_at - datetime.utcnow()).total_seconds()), 0
    )
    return TokenResponse(
        success=True,
        message=message,
        access_token=bundle.access_token,
        refresh_token=bundle.refresh_token,
        expires_in=access_expires_in,
        refresh_expires_in=refresh_expires_in,
    )


async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Capture rate limiting events for observability."""
    observe_rate_limit(request.url.path)
    observe_login_failure("rate_limited")
    observe_login_stage("rate_limited")
    return _rate_limit_exceeded_handler(request, exc)


app.add_exception_handler(RateLimitExceeded, rate_limit_handler)


@auth_router.post(
    "/login",
    response_model=LoginResponse,
    summary="Initiate authentication (password step)",
)
@limiter.limit(f"{settings.RATE_LIMIT_REQUESTS}/{settings.RATE_LIMIT_WINDOW}seconds")
async def login(
    request: Request,
    login_data: LoginRequest,
    redis: Redis = Depends(get_redis),
):
    """
    Primary authentication step: validate username/password and issue MFA challenge.

    Rate limiting can be bypassed with X-Direct-Access header for security demos.
    """
    client_ip = get_remote_address(request)
    observe_login_stage("password_attempt")

    logger.info(
        "login_attempt",
        username=login_data.username,
        client_ip=client_ip,
        timestamp=datetime.utcnow().isoformat(),
    )

    if settings.ENABLE_IP_BANNING and await is_ip_banned(redis, client_ip):
        logger.warning(
            "login_attempt_from_banned_ip",
            client_ip=client_ip,
            username=login_data.username,
        )
        observe_login_blocked("ip_banned")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your IP has been temporarily banned due to suspicious activity.",
        )

    if not verify_login(login_data.username, login_data.password):
        failed_count = await record_failed_attempt(redis, client_ip, login_data.username)
        observe_login_failure("invalid_credentials")
        observe_login_stage("password_failure")
        logger.warning(
            "login_failed",
            username=login_data.username,
            client_ip=client_ip,
            failed_attempts=failed_count,
        )

        if settings.ENABLE_IP_BANNING and failed_count >= settings.BAN_THRESHOLD:
            await ban_ip(redis, client_ip)
            observe_login_blocked("failed_attempt_threshold")
            logger.warning(
                "ip_banned",
                client_ip=client_ip,
                reason="exceeded_failed_login_threshold",
                threshold=settings.BAN_THRESHOLD,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Too many failed attempts. Your IP has been temporarily banned.",
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    # Successful password verification
    await clear_failed_attempts(redis, client_ip)
    observe_login_stage("password_success")

    if not settings.MFA_ENABLED:
        bundle = await generate_token_bundle(redis, login_data.username)
        observe_login_stage("token_issued")
        observe_login_success()
        return LoginResponse(
            success=True,
            message="Login successful",
            requires_mfa=False,
            challenge_id=None,
        )

    challenge_id = await create_mfa_challenge(redis, login_data.username, client_ip)
    current_code = current_mfa_code(login_data.username)
    if current_code:
        logger.info(
            "mfa_code_generated",
            username=login_data.username,
            challenge_id=challenge_id,
            demo_code=current_code,
        )

    return LoginResponse(
        success=True,
        message="MFA verification required. Use the one-time code sent to your device.",
        requires_mfa=True,
        challenge_id=challenge_id,
    )


@auth_router.post(
    "/mfa/verify",
    response_model=TokenResponse,
    summary="Complete authentication with MFA code",
)
@limiter.limit(f"{settings.RATE_LIMIT_REQUESTS}/{settings.RATE_LIMIT_WINDOW}seconds")
async def verify_mfa(
    request: Request,
    request_payload: MfaVerifyRequest,
    redis: Redis = Depends(get_redis),
):
    challenge = await get_mfa_challenge(redis, request_payload.challenge_id)
    if not challenge:
        observe_mfa_attempt("missing")
        observe_login_failure("mfa_challenge_missing")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MFA challenge not found or expired.",
        )

    username = challenge["username"]
    client_ip = challenge.get("client_ip")

    if not verify_mfa_code(username, request_payload.code):
        attempts = await increment_mfa_attempts(redis, request_payload.challenge_id)
        observe_mfa_attempt("failure")
        observe_login_failure("mfa_invalid_code")
        observe_login_stage("mfa_failure")

        if attempts >= settings.MFA_MAX_ATTEMPTS:
            await delete_mfa_challenge(redis, request_payload.challenge_id)
            observe_login_blocked("mfa_failure_threshold")
            if client_ip and settings.ENABLE_IP_BANNING:
                await ban_ip(redis, client_ip)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Too many invalid MFA attempts.",
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid MFA code.",
        )

    await delete_mfa_challenge(redis, request_payload.challenge_id)
    if client_ip:
        await clear_failed_attempts(redis, client_ip)

    observe_mfa_attempt("success")
    observe_login_stage("mfa_success")

    bundle = await generate_token_bundle(redis, username)
    observe_login_stage("token_issued")
    observe_login_success()

    return build_token_response(bundle, message="Authentication completed successfully.")


@auth_router.post(
    "/token/refresh",
    response_model=TokenResponse,
    summary="Obtain a new access token using a refresh token",
)
@limiter.limit(f"{settings.RATE_LIMIT_REQUESTS}/{settings.RATE_LIMIT_WINDOW}seconds")
async def refresh_token(
    request: Request,
    request_payload: RefreshRequest,
    redis: Redis = Depends(get_redis),
):
    username = await verify_refresh_token(
        redis, request_payload.refresh_token, revoke=True
    )
    if not username:
        observe_refresh("denied")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    observe_refresh("success")
    observe_login_stage("token_refreshed")
    bundle = await generate_token_bundle(redis, username)
    return build_token_response(bundle, message="Access token refreshed.")


@auth_router.post(
    "/logout",
    response_model=BasicResponse,
    summary="Revoke refresh token(s)",
)
async def logout(
    request_payload: LogoutRequest,
    redis: Redis = Depends(get_redis),
):
    if request_payload.all_sessions:
        if not request_payload.refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token required when revoking all sessions.",
            )
        username = await verify_refresh_token(
            redis, request_payload.refresh_token, revoke=False
        )
        if not username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token invalid or already revoked.",
            )
        await revoke_all_refresh_tokens(redis, username)
        await revoke_refresh_token(redis, request_payload.refresh_token)
        observe_refresh("revoked_all")
        message = "All sessions revoked."
    else:
        if not request_payload.refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token required.",
            )
        username = await verify_refresh_token(
            redis, request_payload.refresh_token, revoke=True
        )
        if not username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token invalid or already revoked.",
            )
        observe_refresh("revoked_single")
        message = "Session revoked."

    return BasicResponse(success=True, message=message)


app.include_router(auth_router)


@app.get("/")
async def root():
    """Root endpoint summarising capabilities."""
    return {
        "service": settings.SERVICE_NAME,
        "version": "2.0.0",
        "status": "operational",
        "features": [
            "https-reverse-proxy",
            "rate-limiting",
            "ip-banning",
            "mfa",
            "jwt-sessions",
        ],
        "vulnerabilities": [
            "credential-stuffing",
            "token-replay",
            "mfa-bruteforce",
        ],
    }


@app.get("/metrics")
async def metrics() -> Response:
    """Prometheus metrics endpoint."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/health")
async def health_check(request: Request):
    """Health check endpoint for container orchestration."""
    redis_status = "disconnected"
    redis: Optional[Redis] = getattr(request.app.state, "redis", None)
    if redis:
        try:
            await redis.ping()
            redis_status = "connected"
        except Exception as exc:  # pragma: no cover - only for logging
            redis_status = f"error:{exc.__class__.__name__}"
            logger.error("redis_health_failed", error=str(exc))

    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.SERVICE_NAME,
        "redis": redis_status,
    }


@app.get("/stats")
async def get_stats(request: Request, redis: Redis = Depends(get_redis)):
    """
    Get statistics about login attempts (for monitoring).
    Note: This endpoint should be protected in production!
    """
    client_ip = get_remote_address(request)
    failed_attempts = await get_failed_attempts(redis, client_ip)
    banned = await is_ip_banned(redis, client_ip)
    overall = await get_security_stats(redis)

    return {
        "client_ip": client_ip,
        "failed_attempts": failed_attempts,
        "is_banned": banned,
        "rate_limiting_enabled": settings.ENABLE_RATE_LIMITING,
        "ip_banning_enabled": settings.ENABLE_IP_BANNING,
        "mfa_enabled": settings.MFA_ENABLED,
        "overview": overall,
    }


@app.get("/demo/mfa-code")
async def get_demo_mfa_code():
    """
    DEMO ONLY: Get current MFA code for testing.
    This endpoint should NEVER exist in production!

    Returns the current TOTP code for the demo environment.
    Uses the shared MFA secret for all demo users.
    """
    if settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This endpoint is only available in development mode"
        )

    # Use admin as default demo user (all demo users share the same MFA secret)
    code = current_mfa_code("admin")
    logger.info("demo_mfa_code_requested", code=code)

    return {
        "mfa_code": code,
        "warning": "DEMO ONLY - Never expose MFA codes in production!",
        "expires_in_seconds": 30,  # TOTP codes expire every 30 seconds
    }


@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    logger.info(
        "service_starting",
        service=settings.SERVICE_NAME,
        environment=settings.ENVIRONMENT,
        rate_limiting=settings.ENABLE_RATE_LIMITING,
        ip_banning=settings.ENABLE_IP_BANNING,
        mfa_enabled=settings.MFA_ENABLED,
    )

    redis_client = redis_async.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        decode_responses=True,
    )
    try:
        await redis_client.ping()
        logger.info(
            "redis_connected",
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
        )
    except Exception as exc:  # pragma: no cover - connection failure logging
        logger.error("redis_connection_failed", error=str(exc))

    app.state.redis = redis_client
    instrumentator.expose(app, include_in_schema=False)


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    logger.info("service_shutting_down", service=settings.SERVICE_NAME)
    redis_client: Optional[Redis] = getattr(app.state, "redis", None)
    if redis_client:
        await redis_client.close()
        await redis_client.connection_pool.disconnect()
