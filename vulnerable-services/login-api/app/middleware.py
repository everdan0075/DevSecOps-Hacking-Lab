"""
Middleware configuration for Login API
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import time
import structlog

logger = structlog.get_logger()


def setup_middleware(app: FastAPI):
    """Setup all middleware for the application"""
    
    # CORS middleware (intentionally permissive for demo purposes)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production: specify actual origins
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Request logging middleware
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        """Log all HTTP requests"""
        start_time = time.time()
        
        # Log request
        logger.info(
            "http_request_started",
            method=request.method,
            path=request.url.path,
            client_ip=request.client.host if request.client else "unknown"
        )
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log response
        logger.info(
            "http_request_completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration * 1000, 2),
            client_ip=request.client.host if request.client else "unknown"
        )
        
        return response




