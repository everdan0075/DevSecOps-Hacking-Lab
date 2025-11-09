"""
Security utilities for API Gateway
JWT verification, authentication, and authorization
"""
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import Header, HTTPException, status, Request
from jose import JWTError, jwt
from .config import settings

logger = logging.getLogger(__name__)


class JWTValidator:
    """JWT token validation and verification"""
    
    @staticmethod
    def verify_access_token(token: str) -> Dict[str, Any]:
        """
        Verify JWT access token
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token payload
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            # Decode and verify token
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            # Verify token type
            token_type = payload.get("type")
            if token_type != "access":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type. Expected 'access' token.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Verify expiration
            exp = payload.get("exp")
            if exp is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token missing expiration claim",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Check if expired
            current_time = datetime.now(timezone.utc).timestamp()
            if current_time > exp:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            logger.info(f"JWT verified for user: {payload.get('sub')}")
            return payload
            
        except JWTError as e:
            logger.warning(f"JWT verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Could not validate credentials: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Dependency to extract and verify JWT from Authorization header
    
    Args:
        authorization: Authorization header value (Bearer <token>)
        
    Returns:
        Decoded token payload with user information
        
    Raises:
        HTTPException: If authorization header is missing or invalid
    """
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Parse Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = parts[1]
    
    # Verify token
    validator = JWTValidator()
    payload = validator.verify_access_token(token)
    
    return payload


async def optional_auth(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """
    Optional authentication - returns user if token provided, None otherwise
    Useful for endpoints that work both authenticated and anonymous
    
    Args:
        authorization: Authorization header value (Bearer <token>)
        
    Returns:
        Decoded token payload or None if no auth provided
    """
    if authorization is None:
        return None
    
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None


def extract_client_ip(request: Request) -> str:
    """
    Extract client IP address from request
    Checks X-Forwarded-For header first (for proxy scenarios)
    
    Args:
        request: FastAPI request object
        
    Returns:
        Client IP address
    """
    # Check X-Forwarded-For header (set by reverse proxies)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # X-Forwarded-For can contain multiple IPs, take the first one
        return forwarded_for.split(",")[0].strip()
    
    # Fallback to direct client IP
    if request.client:
        return request.client.host
    
    return "unknown"

