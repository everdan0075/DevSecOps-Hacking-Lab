"""
User Service - Intentionally Vulnerable Microservice
Demonstrates IDOR and authorization bypass vulnerabilities
"""
from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.responses import Response
import time
import logging
from typing import Optional

from app.config import (
    SERVICE_NAME,
    SERVICE_VERSION,
    USERS_DB,
    SETTINGS_DB,
    SECRET_KEY,
    JWT_ALGORITHM,
)
from app.models import UserProfile, UserSettings, HealthResponse, ErrorResponse
from app.metrics import (
    user_service_requests_total,
    user_service_request_duration_seconds,
    user_service_idor_attempts_total,
    user_service_direct_access_total,
    user_service_unauthorized_settings_access_total,
    get_metrics,
    get_content_type,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="User Service",
    description="Vulnerable User Management Service for DevSecOps Lab",
    version=SERVICE_VERSION,
)


def extract_user_from_token(authorization: Optional[str]) -> Optional[str]:
    """
    Extract username from JWT token
    NOTE: This is simplified - in production, use proper JWT validation
    """
    if not authorization:
        return None
    
    try:
        from jose import jwt
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload.get("sub")
    except Exception as e:
        logger.warning(f"Failed to decode JWT: {e}")
        return None


def check_gateway_bypass(request: Request) -> bool:
    """
    Check if request bypassed API Gateway
    In real scenario, check for gateway-specific headers
    """
    gateway_header = request.headers.get("X-Gateway")
    return gateway_header != "DevSecOps-API-Gateway"


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Track request metrics"""
    start_time = time.time()
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Record metrics
    user_service_requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code
    ).inc()
    
    user_service_request_duration_seconds.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    # Add response time header
    response.headers["X-Response-Time"] = f"{duration:.3f}s"
    
    return response


@app.get("/", response_model=dict)
async def root():
    """Root endpoint with service info"""
    return {
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "status": "running",
        "endpoints": {
            "/health": "Health check",
            "/profile/{user_id}": "Get user profile (VULNERABLE: IDOR)",
            "/settings": "Get user settings (VULNERABLE: No Auth)",
            "/metrics": "Prometheus metrics"
        },
        "vulnerabilities": [
            "IDOR in /profile/{user_id} - No authorization check",
            "Missing authentication in /settings",
            "Sensitive data exposure (SSN, credit cards, API keys)"
        ],
        "warning": "This service is intentionally vulnerable for security testing"
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service=SERVICE_NAME,
        version=SERVICE_VERSION,
        vulnerabilities=[
            "IDOR in /profile/{user_id}",
            "No authentication in /settings",
            "Sensitive data exposure"
        ]
    )


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(
        content=get_metrics(),
        media_type=get_content_type()
    )


@app.get("/profile/{user_id}", response_model=UserProfile)
async def get_profile(
    user_id: str,
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Get user profile by ID
    
    VULNERABILITY: IDOR (Insecure Direct Object Reference)
    - Does NOT check if authenticated user has permission to view this profile
    - Any authenticated user can access any other user's profile
    - Exposes sensitive data (SSN, credit card)
    """
    
    # Check if request bypassed gateway
    if check_gateway_bypass(request):
        user_service_direct_access_total.labels(
            endpoint=f"/profile/{user_id}",
            source_ip=request.client.host
        ).inc()
        logger.warning(
            f"⚠️ Direct access detected (bypassing gateway): "
            f"/profile/{user_id} from {request.client.host}"
        )
    
    # Extract authenticated user from token
    authenticated_user = extract_user_from_token(authorization)
    
    # Check if user exists
    if user_id not in USERS_DB:
        raise HTTPException(status_code=404, detail="User not found")
    
    # VULNERABILITY: No authorization check!
    # We should verify: authenticated_user == user_id or authenticated_user is admin
    # But we don't... 🚨
    
    user_data = USERS_DB[user_id]
    
    # Track IDOR attempt if authenticated user tries to access someone else's profile
    if authenticated_user and authenticated_user != user_data["username"]:
        user_service_idor_attempts_total.labels(
            authenticated_user=authenticated_user,
            target_user=user_data["username"],
            result="success"
        ).inc()
        logger.warning(
            f"🚨 IDOR EXPLOIT: User '{authenticated_user}' "
            f"accessed profile of '{user_data['username']}' (user_id: {user_id})"
        )
    
    # Return profile with sensitive data (another vulnerability!)
    return UserProfile(**user_data)


@app.get("/settings", response_model=UserSettings)
async def get_settings(
    request: Request,
    user_id: Optional[str] = None
):
    """
    Get user settings
    
    VULNERABILITY: Missing Authentication
    - Does NOT require JWT token
    - Does NOT validate authorization header
    - Anyone can access by guessing user_id parameter
    - Exposes sensitive API keys
    
    This demonstrates authorization bypass vulnerability
    """
    
    # Check if request bypassed gateway
    if check_gateway_bypass(request):
        user_service_direct_access_total.labels(
            endpoint="/settings",
            source_ip=request.client.host
        ).inc()
        logger.warning(
            f"⚠️ Direct access detected: /settings from {request.client.host}"
        )
    
    # Track unauthorized access
    user_service_unauthorized_settings_access_total.labels(
        source_ip=request.client.host
    ).inc()
    
    logger.warning(
        f"🚨 UNAUTHORIZED ACCESS: /settings accessed without JWT from {request.client.host}"
    )
    
    # Default to user 1 if not specified (another bad practice!)
    if not user_id:
        user_id = "1"
        logger.warning("No user_id provided, defaulting to user 1 (admin)!")
    
    # Check if settings exist
    if user_id not in SETTINGS_DB:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    # VULNERABILITY: Return settings without any authentication! 🚨
    settings_data = SETTINGS_DB[user_id]
    logger.info(f"Returning settings for user_id: {user_id}")
    
    return UserSettings(**settings_data)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

