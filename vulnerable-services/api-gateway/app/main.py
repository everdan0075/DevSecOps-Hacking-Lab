"""
API Gateway - Main Application
Routes requests to backend microservices
"""
import logging
import time
import httpx
from typing import Dict, Any
from fastapi import FastAPI, Request, Response, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .config import settings
from .middleware import (
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    RequestValidationMiddleware,
    LoggingMiddleware
)
from .security import get_current_user
from . import metrics as metrics_module

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="API Gateway for DevSecOps Hacking Lab microservices",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Add middleware (order matters - first added = last executed)
# 1. Logging (outer layer - logs everything)
app.add_middleware(LoggingMiddleware)

# 2. Security headers
app.add_middleware(SecurityHeadersMiddleware)

# 3. Rate limiting
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=60,  # 60 requests per minute
    burst_size=10  # Allow bursts of 10 requests
)

# 4. WAF / Request validation
app.add_middleware(RequestValidationMiddleware)

# 5. CORS middleware
if settings.ENABLE_CORS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# HTTP Client for backend requests
http_client = httpx.AsyncClient(
    timeout=30.0,
    follow_redirects=False,
)


@app.on_event("shutdown")
async def shutdown_event():
    """Close HTTP client on shutdown"""
    await http_client.aclose()


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    Returns gateway status and backend service connectivity
    """
    backend_status = {}
    
    # Check auth-service
    try:
        auth_response = await http_client.get(
            f"{settings.AUTH_SERVICE_URL}/health",
            timeout=5.0
        )
        backend_status["auth-service"] = {
            "status": "healthy" if auth_response.status_code == 200 else "unhealthy",
            "url": settings.AUTH_SERVICE_URL
        }
    except Exception as e:
        backend_status["auth-service"] = {
            "status": "unreachable",
            "error": str(e),
            "url": settings.AUTH_SERVICE_URL
        }
    
    # Check user-service
    try:
        user_response = await http_client.get(
            f"{settings.USER_SERVICE_URL}/health",
            timeout=5.0
        )
        backend_status["user-service"] = {
            "status": "healthy" if user_response.status_code == 200 else "unhealthy",
            "url": settings.USER_SERVICE_URL
        }
    except Exception as e:
        backend_status["user-service"] = {
            "status": "unreachable",
            "error": str(e),
            "url": settings.USER_SERVICE_URL
        }
    
    # Overall gateway status
    all_healthy = all(
        svc.get("status") == "healthy" 
        for svc in backend_status.values()
    )
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "backends": backend_status
    }


@app.get("/")
async def root():
    """Root endpoint - Gateway info"""
    return {
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "message": "API Gateway for DevSecOps Hacking Lab",
        "security": {
            "rate_limiting": "enabled (60 req/min)",
            "waf": "enabled",
            "jwt_validation": "enabled for protected routes"
        },
        "endpoints": {
            "health": "/health",
            "metrics": "/metrics",
            "docs": "/docs" if settings.DEBUG else "disabled",
            "auth": "/auth/*",
            "users": "/api/users/*",
            "protected_demo": "/protected"
        }
    }


@app.get("/metrics")
async def get_metrics():
    """
    Prometheus metrics endpoint
    Returns metrics in Prometheus text format
    """
    return metrics_module.get_metrics()


@app.get("/protected")
async def protected_endpoint(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Demo protected endpoint - requires valid JWT
    Shows how to protect routes with JWT authentication
    """
    # Track successful JWT validation
    metrics_module.track_jwt_validation(success=True)
    
    return {
        "message": "Access granted to protected resource",
        "user": current_user.get("sub"),
        "token_type": current_user.get("type"),
        "authenticated": True,
        "gateway": settings.APP_NAME
    }


async def proxy_request(
    request: Request,
    backend_url: str,
    path: str,
    backend_name: str = "unknown"
) -> Response:
    """
    Proxy HTTP request to backend service with metrics tracking
    
    Args:
        request: Incoming FastAPI request
        backend_url: Backend service base URL
        path: Path to append to backend URL
        backend_name: Name of backend service (for metrics)
    
    Returns:
        Response from backend service
    """
    # Build target URL
    target_url = f"{backend_url}{path}"
    
    # Copy headers (exclude host)
    headers = dict(request.headers)
    headers.pop("host", None)
    
    # Get query parameters
    query_params = dict(request.query_params)
    
    # Get request body
    body = await request.body()
    
    logger.info(f"Proxying {request.method} {path} -> {target_url}")
    
    # Start timer for metrics
    start_time = time.time()
    
    try:
        # Forward request to backend
        backend_response = await http_client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            params=query_params,
            content=body,
        )
        
        # Track metrics
        duration = time.time() - start_time
        metrics_module.track_backend_request(
            backend=backend_name,
            method=request.method,
            status_code=backend_response.status_code,
            duration=duration
        )
        
        # Track gateway request metrics
        metrics_module.gateway_requests_total.labels(
            method=request.method,
            path=f"/{path.split('/')[0]}/*",  # Group by first path segment
            status_code=backend_response.status_code
        ).inc()
        
        # Return backend response
        return Response(
            content=backend_response.content,
            status_code=backend_response.status_code,
            headers=dict(backend_response.headers),
        )
        
    except httpx.ConnectError as e:
        logger.error(f"Backend connection error: {e}")
        metrics_module.track_backend_error(backend_name, "connection_error")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Backend service unavailable: {backend_url}"
        )
    except httpx.TimeoutException as e:
        logger.error(f"Backend timeout: {e}")
        metrics_module.track_backend_error(backend_name, "timeout")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Backend service timeout"
        )
    except Exception as e:
        logger.error(f"Proxy error: {e}")
        metrics_module.track_backend_error(backend_name, "bad_gateway")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gateway error while processing request"
        )


# ============================================================================
# Route: Auth Service (login-api)
# ============================================================================

@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def route_auth(request: Request, path: str):
    """
    Route all /auth/* requests to auth-service (login-api)
    
    Examples:
        POST /auth/login -> http://login-api:8000/auth/login
        POST /auth/mfa/verify -> http://login-api:8000/auth/mfa/verify
        POST /auth/token/refresh -> http://login-api:8000/auth/token/refresh
    """
    return await proxy_request(
        request,
        settings.AUTH_SERVICE_URL,
        f"/auth/{path}",
        backend_name="auth-service"
    )


# ============================================================================
# Route: User Service
# ============================================================================

@app.api_route("/api/users/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def route_users(request: Request, path: str):
    """
    Route all /api/users/* requests to user-service

    Examples:
        GET /api/users/profile/1 -> http://user-service:8000/profile/1
        GET /api/users/settings -> http://user-service:8000/settings

    NOTE: User service has intentional vulnerabilities:
    - IDOR in /profile/{user_id}
    - Missing authentication in /settings
    """
    return await proxy_request(
        request,
        settings.USER_SERVICE_URL,
        f"/{path}",
        backend_name="user-service"
    )


# ============================================================================
# Route: Demo Endpoints (for testing/development)
# ============================================================================

@app.api_route("/demo/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def route_demo(request: Request, path: str):
    """
    Route all /demo/* requests to auth-service (development only)

    Examples:
        GET /demo/mfa-code -> http://login-api:8000/demo/mfa-code
        POST /demo/unban-me -> http://login-api:8000/demo/unban-me

    NOTE: Demo endpoints should only be available in development environment
    """
    return await proxy_request(
        request,
        settings.AUTH_SERVICE_URL,
        f"/demo/{path}",
        backend_name="auth-service-demo"
    )


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Custom 404 handler"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": f"Route {request.url.path} not found in gateway",
            "gateway": settings.APP_NAME
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """Custom 500 handler"""
    logger.error(f"Internal error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "Gateway encountered an internal error",
            "gateway": settings.APP_NAME
        }
    )


# ============================================================================
# Honeypot Endpoints - Trap endpoints to detect attackers
# ============================================================================

from . import honeypot as honeypot_module

# Admin panel honeypot
@app.get("/admin")
@app.get("/admin/")
@app.get("/admin/login")
@app.post("/admin/login")
async def honeypot_admin(request: Request):
    """Fake admin panel - attracts admin interface attacks"""
    return await honeypot_module.honeypot_admin_panel(request)


# Secret files honeypots
@app.get("/.env")
async def honeypot_env(request: Request):
    """Fake .env file - attracts credential theft"""
    return await honeypot_module.honeypot_env_file(request)


@app.get("/backup.zip")
@app.get("/backup.sql")
@app.get("/database.sql")
async def honeypot_backup(request: Request):
    """Fake backup files - attracts data exfiltration"""
    return await honeypot_module.honeypot_backup_file(request)


# Git exposure honeypot
@app.get("/.git/config")
@app.get("/.git/HEAD")
async def honeypot_git(request: Request):
    """Fake git config - attracts source code theft"""
    return await honeypot_module.honeypot_git_config(request)


# Config file honeypot
@app.get("/config.json")
@app.get("/config.yml")
@app.get("/config.yaml")
async def honeypot_config(request: Request):
    """Fake config files - attracts config exposure attempts"""
    return await honeypot_module.honeypot_config_json(request)


# CMS-specific honeypots
@app.get("/phpmyadmin")
@app.get("/phpmyadmin/")
@app.post("/phpmyadmin/")
async def honeypot_pma(request: Request):
    """Fake phpMyAdmin - attracts database panel attacks"""
    return await honeypot_module.honeypot_phpmyadmin(request)


@app.get("/wp-login.php")
@app.post("/wp-login.php")
@app.get("/wp-admin/")
async def honeypot_wordpress(request: Request):
    """Fake WordPress - attracts CMS-specific attacks"""
    return await honeypot_module.honeypot_wordpress_login(request)


# API credentials honeypot
@app.get("/api/keys")
@app.get("/api/secrets")
@app.get("/api/tokens")
async def honeypot_api_keys(request: Request):
    """Fake API keys endpoint - attracts credential theft"""
    return await honeypot_module.honeypot_api_keys(request)


# Honeypot statistics endpoint (for defense dashboard)
@app.get("/api/defense/honeypot-stats")
async def get_honeypot_statistics():
    """
    Get honeypot statistics for monitoring dashboard
    Shows attacker activity and patterns
    """
    return await honeypot_module.get_honeypot_stats()


# WAF statistics endpoint
@app.get("/api/defense/waf-stats")
async def get_waf_statistics():
    """
    Get WAF statistics and configuration
    Shows signature database stats, enabled features, etc.
    """
    from .waf_signatures import signature_db
    from .waf_config import waf_config

    return {
        "signature_database": signature_db.get_stats(),
        "features": {
            "signature_detection": waf_config.enable_signature_detection,
            "endpoint_rate_limiting": waf_config.enable_endpoint_rate_limiting,
            "geo_blocking": waf_config.enable_geo_blocking,
            "user_agent_filtering": waf_config.enable_user_agent_filtering,
            "bot_detection": waf_config.enable_bot_detection
        },
        "endpoint_limits": [
            {
                "pattern": limit.endpoint_pattern,
                "requests_per_minute": limit.requests_per_minute,
                "burst_size": limit.burst_size,
                "description": limit.description
            }
            for limit in waf_config.endpoint_rate_limits
        ],
        "version": "2.5A"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )

