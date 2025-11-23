"""
Middleware for API Gateway
Rate limiting, request validation, security headers, enhanced WAF
"""
import time
import logging
import re
from typing import Dict, Tuple, Optional
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse
from .security import extract_client_ip
from .waf_signatures import signature_db
from .waf_config import waf_config, EndpointRateLimit
from . import metrics as metrics_module

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
    Enhanced WAF-style request validation with:
    - Signature-based attack detection
    - User-Agent filtering
    - Bot detection
    - Geo-blocking (placeholder)
    - Per-endpoint rate limiting
    """

    def __init__(self, app):
        super().__init__(app)

        # Compile endpoint rate limit patterns
        self.compiled_endpoint_limits = []
        for limit in waf_config.endpoint_rate_limits:
            try:
                pattern = re.compile(limit.endpoint_pattern)
                self.compiled_endpoint_limits.append((pattern, limit))
            except re.error:
                logger.error(f"Invalid endpoint pattern: {limit.endpoint_pattern}")

        # Compile User-Agent patterns
        self.blocked_ua_patterns = []
        for pattern in waf_config.blocked_user_agents:
            try:
                self.blocked_ua_patterns.append(re.compile(pattern, re.IGNORECASE))
            except re.error:
                logger.error(f"Invalid User-Agent pattern: {pattern}")

        self.bot_patterns = []
        for pattern in waf_config.bot_detection_patterns:
            try:
                self.bot_patterns.append(re.compile(pattern, re.IGNORECASE))
            except re.error:
                logger.error(f"Invalid bot pattern: {pattern}")

        self.allowed_bot_patterns = []
        for pattern in waf_config.allowed_bots:
            try:
                self.allowed_bot_patterns.append(re.compile(pattern, re.IGNORECASE))
            except re.error:
                logger.error(f"Invalid allowed bot pattern: {pattern}")

        # Per-endpoint rate limiting storage
        # {(ip, endpoint): (tokens, last_refill)}
        self.endpoint_buckets: Dict[Tuple[str, str], Tuple[float, float]] = defaultdict(
            lambda: (0, time.time())
        )

        logger.info("Enhanced WAF middleware initialized")

    def _check_user_agent(self, request: Request) -> Optional[JSONResponse]:
        """Check User-Agent header for suspicious patterns"""
        if not waf_config.enable_user_agent_filtering:
            return None

        user_agent = request.headers.get("User-Agent", "")

        # Require User-Agent header
        if waf_config.require_user_agent and not user_agent:
            logger.warning(f"Missing User-Agent from {extract_client_ip(request)}")
            metrics_module.gateway_waf_blocks_total.labels(reason="missing_user_agent").inc()
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "error": "Forbidden",
                    "message": "User-Agent header required",
                    "blocked_by": "WAF"
                }
            )

        # Check against blocked User-Agents
        for pattern in self.blocked_ua_patterns:
            if pattern.search(user_agent):
                logger.warning(
                    f"Blocked User-Agent: {user_agent[:100]} from {extract_client_ip(request)}"
                )
                metrics_module.gateway_waf_blocks_total.labels(reason="malicious_user_agent").inc()
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "error": "Forbidden",
                        "message": "Malicious User-Agent detected",
                        "blocked_by": "WAF"
                    }
                )

        # Bot detection
        if waf_config.enable_bot_detection:
            # Check if it's an allowed bot first
            is_allowed_bot = any(
                pattern.search(user_agent)
                for pattern in self.allowed_bot_patterns
            )

            if not is_allowed_bot:
                # Check for bot patterns
                for pattern in self.bot_patterns:
                    if pattern.search(user_agent):
                        logger.warning(
                            f"Suspicious bot detected: {user_agent[:100]} from {extract_client_ip(request)}"
                        )
                        metrics_module.gateway_waf_blocks_total.labels(reason="suspicious_bot").inc()
                        return JSONResponse(
                            status_code=status.HTTP_403_FORBIDDEN,
                            content={
                                "error": "Forbidden",
                                "message": "Automated bot traffic not allowed",
                                "blocked_by": "WAF"
                            }
                        )

        return None

    def _check_signature_scan(self, request: Request, body: bytes = None) -> Optional[JSONResponse]:
        """Scan request for attack signatures"""
        if not waf_config.enable_signature_detection:
            return None

        scan_targets = []

        # Scan query parameters
        if waf_config.signature_scan_query:
            query_string = str(request.url.query)
            if query_string:
                scan_targets.append(("query", query_string))

        # Scan headers
        if waf_config.signature_scan_headers:
            for key, value in request.headers.items():
                # Skip common headers
                if key.lower() not in ["host", "user-agent", "accept", "connection"]:
                    scan_targets.append((f"header:{key}", value))

        # Scan body (if provided and enabled)
        if waf_config.signature_scan_body and body:
            if len(body) <= waf_config.max_scan_body_size:
                try:
                    body_str = body.decode("utf-8", errors="ignore")
                    scan_targets.append(("body", body_str))
                except Exception:
                    pass

        # Perform signature scanning
        for target_type, target_value in scan_targets:
            result = signature_db.scan_detailed(target_value)

            if result["threat_detected"]:
                client_ip = extract_client_ip(request)
                highest_match = result["matches"][0]

                logger.warning(
                    f"Attack signature detected in {target_type}: "
                    f"category={highest_match['category']}, "
                    f"severity={highest_match['severity']}, "
                    f"ip={client_ip}"
                )

                # Update metrics
                metrics_module.gateway_waf_blocks_total.labels(
                    reason=highest_match['category']
                ).inc()

                metrics_module.gateway_waf_suspicious_patterns.labels(
                    pattern=highest_match['category'],
                    client_ip=client_ip
                ).inc()

                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={
                        "error": "Bad Request",
                        "message": f"Attack pattern detected: {highest_match['category']}",
                        "blocked_by": "WAF",
                        "severity": highest_match['severity']
                    }
                )

        return None

    def _check_endpoint_rate_limit(self, request: Request) -> Optional[JSONResponse]:
        """Check per-endpoint rate limiting"""
        if not waf_config.enable_endpoint_rate_limiting:
            return None

        path = request.url.path
        client_ip = extract_client_ip(request)

        # Find matching endpoint limit
        for pattern, limit in self.compiled_endpoint_limits:
            if pattern.match(path):
                # Get or create bucket for this IP+endpoint combo
                bucket_key = (client_ip, limit.endpoint_pattern)
                tokens, last_refill = self.endpoint_buckets[bucket_key]

                # Initialize bucket if first request
                if tokens == 0 and last_refill == self.endpoint_buckets.default_factory()[1]:
                    tokens = limit.burst_size

                # Refill tokens
                now = time.time()
                time_elapsed = now - last_refill
                refill_rate = limit.requests_per_minute / 60.0
                tokens_to_add = time_elapsed * refill_rate
                tokens = min(limit.burst_size, tokens + tokens_to_add)

                # Try to consume token
                if tokens >= 1.0:
                    self.endpoint_buckets[bucket_key] = (tokens - 1.0, now)
                    return None  # Allow request
                else:
                    # Rate limited for this endpoint
                    self.endpoint_buckets[bucket_key] = (tokens, now)
                    logger.warning(
                        f"Endpoint rate limit exceeded: {path} from {client_ip}"
                    )

                    metrics_module.gateway_rate_limit_blocks_total.labels(
                        client_ip=client_ip
                    ).inc()

                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={
                            "error": "Rate Limit Exceeded",
                            "message": f"Too many requests to this endpoint. Limit: {limit.requests_per_minute} req/min",
                            "endpoint": path,
                            "retry_after": 60
                        },
                        headers={"Retry-After": "60"}
                    )

        return None

    async def dispatch(self, request: Request, call_next):
        """Enhanced WAF validation"""

        # Skip WAF for health/metrics endpoints
        if request.url.path in ["/health", "/metrics"]:
            return await call_next(request)

        # 1. Check User-Agent
        ua_response = self._check_user_agent(request)
        if ua_response:
            return ua_response

        # 2. Check request size limits
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > waf_config.max_request_body_size:
                    logger.warning(
                        f"Oversized request blocked: {content_length} bytes "
                        f"from IP {extract_client_ip(request)}"
                    )
                    metrics_module.gateway_waf_blocks_total.labels(reason="oversized_request").inc()
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={
                            "error": "Request Entity Too Large",
                            "message": f"Request body exceeds maximum size",
                            "blocked_by": "WAF"
                        }
                    )
            except ValueError:
                pass

        # 3. Check URL length
        if len(str(request.url)) > waf_config.max_url_length:
            logger.warning(f"Oversized URL blocked from {extract_client_ip(request)}")
            metrics_module.gateway_waf_blocks_total.labels(reason="oversized_url").inc()
            return JSONResponse(
                status_code=status.HTTP_414_REQUEST_URI_TOO_LONG,
                content={
                    "error": "URI Too Long",
                    "message": "URL exceeds maximum length",
                    "blocked_by": "WAF"
                }
            )

        # 4. Signature-based scanning (without body first)
        sig_response = self._check_signature_scan(request)
        if sig_response:
            return sig_response

        # 5. Per-endpoint rate limiting
        endpoint_rate_response = self._check_endpoint_rate_limit(request)
        if endpoint_rate_response:
            return endpoint_rate_response

        # 6. Validate HTTP method
        allowed_methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]
        if request.method not in allowed_methods:
            metrics_module.gateway_waf_blocks_total.labels(reason="invalid_method").inc()
            return JSONResponse(
                status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
                content={
                    "error": "Method Not Allowed",
                    "message": f"HTTP method {request.method} is not allowed"
                }
            )

        # Request passed all WAF checks
        response = await call_next(request)

        # Add WAF headers (for debugging)
        if waf_config.add_waf_headers:
            response.headers["X-WAF-Status"] = "passed"
            response.headers["X-WAF-Version"] = "2.5A"

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

