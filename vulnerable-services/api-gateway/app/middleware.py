"""
Middleware for API Gateway
Rate limiting, request validation, security headers
"""
import time
import logging
from typing import Dict, Tuple
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse
from .security import extract_client_ip

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Token Bucket Rate Limiting Middleware
    
    Limits requests per IP address using token bucket algorithm
    """
    
    def __init__(self, app, requests_per_minute: int = 60, burst_size: int = 10):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.burst_size = burst_size
        self.refill_rate = requests_per_minute / 60.0  # tokens per second
        
        # Storage: {ip_address: (tokens, last_refill_time)}
        self.buckets: Dict[str, Tuple[float, float]] = defaultdict(
            lambda: (self.burst_size, time.time())
        )
        
        logger.info(
            f"Rate limiter initialized: {requests_per_minute} req/min, "
            f"burst: {burst_size}"
        )
    
    def _get_tokens(self, ip: str) -> Tuple[float, float]:
        """Get current token count for IP"""
        tokens, last_refill = self.buckets[ip]
        
        # Refill tokens based on time elapsed
        now = time.time()
        time_elapsed = now - last_refill
        tokens_to_add = time_elapsed * self.refill_rate
        
        # Cap at burst size
        tokens = min(self.burst_size, tokens + tokens_to_add)
        
        return tokens, now
    
    def _consume_token(self, ip: str) -> bool:
        """
        Try to consume a token for this request
        Returns True if request allowed, False if rate limited
        """
        tokens, now = self._get_tokens(ip)
        
        if tokens >= 1.0:
            # Allow request, consume token
            self.buckets[ip] = (tokens - 1.0, now)
            return True
        else:
            # Rate limited
            self.buckets[ip] = (tokens, now)
            return False
    
    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting"""
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/metrics"]:
            return await call_next(request)
        
        # Extract client IP
        client_ip = extract_client_ip(request)
        
        # Check rate limit
        if not self._consume_token(client_ip):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate Limit Exceeded",
                    "message": f"Too many requests. Limit: {self.requests_per_minute} requests per minute.",
                    "retry_after": 60
                },
                headers={"Retry-After": "60"}
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        tokens, _ = self._get_tokens(client_ip)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(int(tokens))
        
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Gateway identification
        response.headers["X-Gateway"] = "DevSecOps-API-Gateway"
        response.headers["X-Gateway-Version"] = "0.1.0"
        
        return response


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """
    Basic WAF-style request validation
    Blocks suspicious patterns, oversized requests, etc.
    """
    
    # Maximum request body size (10MB)
    MAX_BODY_SIZE = 10 * 1024 * 1024
    
    # Suspicious patterns in URLs (basic SQL injection, path traversal)
    SUSPICIOUS_PATTERNS = [
        "../",
        "..\\",
        "<script",
        "javascript:",
        "onerror=",
        "onclick=",
        "' OR '1'='1",
        "' OR 1=1--",
        "; DROP TABLE",
        "UNION SELECT",
    ]
    
    async def dispatch(self, request: Request, call_next):
        """Validate request before processing"""
        
        # 1. Check request path for suspicious patterns
        path = request.url.path.lower()
        for pattern in self.SUSPICIOUS_PATTERNS:
            if pattern.lower() in path:
                logger.warning(
                    f"Suspicious pattern detected in path: {pattern} "
                    f"from IP {extract_client_ip(request)}"
                )
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={
                        "error": "Bad Request",
                        "message": "Request contains suspicious pattern",
                        "blocked_by": "WAF"
                    }
                )
        
        # 2. Check Content-Length header
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > self.MAX_BODY_SIZE:
                    logger.warning(
                        f"Oversized request blocked: {content_length} bytes "
                        f"from IP {extract_client_ip(request)}"
                    )
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={
                            "error": "Request Entity Too Large",
                            "message": f"Request body exceeds maximum size of {self.MAX_BODY_SIZE} bytes",
                            "blocked_by": "WAF"
                        }
                    )
            except ValueError:
                pass
        
        # 3. Validate HTTP method
        allowed_methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]
        if request.method not in allowed_methods:
            return JSONResponse(
                status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
                content={
                    "error": "Method Not Allowed",
                    "message": f"HTTP method {request.method} is not allowed"
                }
            )
        
        # Request is valid, proceed
        response = await call_next(request)
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests and responses with timing"""
    
    async def dispatch(self, request: Request, call_next):
        # Start timer
        start_time = time.time()
        
        # Get client info
        client_ip = extract_client_ip(request)
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log request
        logger.info(
            f"{request.method} {request.url.path} - "
            f"Status: {response.status_code} - "
            f"IP: {client_ip} - "
            f"Duration: {duration:.3f}s"
        )
        
        # Add timing header
        response.headers["X-Response-Time"] = f"{duration:.3f}s"
        
        return response

