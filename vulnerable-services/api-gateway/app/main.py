"""
API Gateway - Main Application
Routes requests to backend microservices
"""
import logging
import httpx
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .config import settings

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

# CORS middleware
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
        "endpoints": {
            "health": "/health",
            "docs": "/docs" if settings.DEBUG else "disabled",
            "auth": "/auth/*",
            "users": "/api/users/*"
        }
    }


async def proxy_request(
    request: Request,
    backend_url: str,
    path: str
) -> Response:
    """
    Proxy HTTP request to backend service
    
    Args:
        request: Incoming FastAPI request
        backend_url: Backend service base URL
        path: Path to append to backend URL
    
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
    
    try:
        # Forward request to backend
        backend_response = await http_client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            params=query_params,
            content=body,
        )
        
        # Return backend response
        return Response(
            content=backend_response.content,
            status_code=backend_response.status_code,
            headers=dict(backend_response.headers),
        )
        
    except httpx.ConnectError as e:
        logger.error(f"Backend connection error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Backend service unavailable: {backend_url}"
        )
    except httpx.TimeoutException as e:
        logger.error(f"Backend timeout: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Backend service timeout"
        )
    except Exception as e:
        logger.error(f"Proxy error: {e}")
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
        f"/auth/{path}"
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )

