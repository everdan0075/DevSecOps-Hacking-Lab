"""
Security functions and defense mechanisms
"""

from datetime import datetime, timedelta
from typing import Dict, Optional
from dataclasses import dataclass
import secrets
import uuid
import structlog
import pyotp
from jose import jwt
from redis.asyncio import Redis

from app.config import settings
from app.metrics import observe_ip_ban

logger = structlog.get_logger()

# In-memory storage for demonstration (use Redis in production)
failed_attempts: Dict[str, list] = {}
banned_ips: Dict[str, datetime] = {}

# Mock user database (intentionally simple for educational purposes)
MOCK_USERS = {
    "admin": "admin123",
    "user": "password",
    "test": "test123",
    "demo": "demo123",
}


@dataclass
class TokenBundle:
    """Container for access and refresh tokens"""
    access_token: str
    refresh_token: str
    access_expires_at: datetime
    refresh_expires_at: datetime


def verify_login(username: str, password: str) -> bool:
    """
    Verify login credentials
    
    VULNERABILITY: Simple comparison without timing attack protection
    In production, use constant-time comparison and proper password hashing
    """
    return MOCK_USERS.get(username) == password


async def record_failed_attempt(redis: Redis, ip: str, username: str) -> int:
    """
    Record a failed login attempt from an IP address
    Returns the total number of failed attempts
    """
    key = f"failed_attempts:{ip}"
    now = int(datetime.utcnow().timestamp())
    
    # Add new attempt with current timestamp as score
    await redis.zadd(key, {username: now})
    
    # Clean old attempts (older than BAN_DURATION)
    cutoff = now - settings.BAN_DURATION
    await redis.zremrangebyscore(key, 0, cutoff)
    
    # Set expiry on the key
    await redis.expire(key, settings.BAN_DURATION)
    
    # Return current count
    count = await redis.zcard(key)
    return count


async def get_failed_attempts(redis: Redis, ip: str) -> int:
    """Get the number of failed attempts for an IP"""
    key = f"failed_attempts:{ip}"
    now = int(datetime.utcnow().timestamp())
    cutoff = now - settings.BAN_DURATION
    
    # Clean old attempts
    await redis.zremrangebyscore(key, 0, cutoff)
    
    # Return current count
    count = await redis.zcard(key)
    return count


async def ban_ip(redis: Redis, ip: str, reason: str = "policy_violation"):
    """Ban an IP address temporarily"""
    key = f"banned_ip:{ip}"
    await redis.setex(key, settings.BAN_DURATION, "1")
    logger.warning("ip_banned", ip=ip, duration=settings.BAN_DURATION, reason=reason)
    observe_ip_ban(reason)


async def is_ip_banned(redis: Redis, ip: str) -> bool:
    """Check if an IP is currently banned"""
    key = f"banned_ip:{ip}"
    result = await redis.get(key)
    return result is not None


async def clear_failed_attempts(redis: Redis, ip: str):
    """Clear failed attempts for an IP (called on successful login)"""
    key = f"failed_attempts:{ip}"
    await redis.delete(key)


async def get_security_stats(redis: Redis) -> dict:
    """Get overall security statistics"""
    # Count banned IPs
    banned_keys = await redis.keys("banned_ip:*")
    banned_count = len(banned_keys) if banned_keys else 0
    
    # Count IPs with failed attempts
    failed_keys = await redis.keys("failed_attempts:*")
    failed_count = len(failed_keys) if failed_keys else 0
    
    # Count total failed attempts
    total_failed = 0
    if failed_keys:
        for key in failed_keys:
            count = await redis.zcard(key)
            total_failed += count
    
    return {
        "total_banned_ips": banned_count,
        "ips_with_failed_attempts": failed_count,
        "total_failed_attempts": total_failed
    }


# ========== JWT Token Management ==========

def create_access_token(username: str) -> tuple[str, datetime]:
    """Create a JWT access token"""
    expires_at = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": username,
        "type": "access",
        "exp": expires_at,
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, expires_at


async def generate_token_bundle(redis: Redis, username: str) -> TokenBundle:
    """Generate access and refresh tokens for a user"""
    # Create access token (JWT)
    access_token, access_expires_at = create_access_token(username)
    
    # Create refresh token (random string)
    refresh_token = secrets.token_urlsafe(32)
    refresh_expires_at = datetime.utcnow() + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    
    # Store refresh token in Redis
    key = f"refresh_token:{refresh_token}"
    await redis.setex(
        key,
        settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
        username
    )
    
    # Track user's refresh tokens
    user_tokens_key = f"user_tokens:{username}"
    await redis.sadd(user_tokens_key, refresh_token)
    await redis.expire(user_tokens_key, settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60)
    
    return TokenBundle(
        access_token=access_token,
        refresh_token=refresh_token,
        access_expires_at=access_expires_at,
        refresh_expires_at=refresh_expires_at
    )


async def verify_refresh_token(redis: Redis, refresh_token: str, revoke: bool = False) -> Optional[str]:
    """
    Verify a refresh token and return the associated username.
    If revoke=True, the token is deleted after verification.
    """
    key = f"refresh_token:{refresh_token}"
    username = await redis.get(key)
    
    if username and revoke:
        await redis.delete(key)
        # Remove from user's token set
        user_tokens_key = f"user_tokens:{username}"
        await redis.srem(user_tokens_key, refresh_token)
    
    return username


async def revoke_refresh_token(redis: Redis, refresh_token: str):
    """Revoke a single refresh token"""
    key = f"refresh_token:{refresh_token}"
    username = await redis.get(key)
    await redis.delete(key)
    
    if username:
        user_tokens_key = f"user_tokens:{username}"
        await redis.srem(user_tokens_key, refresh_token)


async def revoke_all_refresh_tokens(redis: Redis, username: str):
    """Revoke all refresh tokens for a user"""
    user_tokens_key = f"user_tokens:{username}"
    tokens = await redis.smembers(user_tokens_key)
    
    if tokens:
        # Delete all refresh tokens
        for token in tokens:
            key = f"refresh_token:{token}"
            await redis.delete(key)
        
        # Clear the user's token set
        await redis.delete(user_tokens_key)


# ========== MFA Management ==========

def generate_totp_secret(username: str) -> str:
    """Generate a TOTP secret for a user (mock implementation)"""
    # In a real implementation, this would be stored per user
    # For demo purposes, we use a deterministic base32-encoded secret
    # Base32 alphabet: A-Z and 2-7 only (no 0, 1, 8, 9)
    base_secret = "DEVSECOPSTWENTYFOURHACKINGLAB"
    # Ensure the secret is base32 compatible (uppercase, valid chars)
    return base_secret


def current_mfa_code(username: str) -> str:
    """
    Get the current valid MFA code for a user.
    This is only for demonstration/testing purposes!
    In production, users would get codes from their authenticator app.
    """
    secret = generate_totp_secret(username)
    totp = pyotp.TOTP(secret, interval=settings.MFA_CODE_STEP)
    return totp.now()


def verify_mfa_code(username: str, code: str) -> bool:
    """Verify an MFA code for a user"""
    secret = generate_totp_secret(username)
    totp = pyotp.TOTP(secret, interval=settings.MFA_CODE_STEP)
    
    # Allow codes from previous/current/next window for clock skew
    return totp.verify(code, valid_window=settings.MFA_VALID_WINDOW)


async def create_mfa_challenge(redis: Redis, username: str, client_ip: str) -> str:
    """Create an MFA challenge and return the challenge ID"""
    challenge_id = str(uuid.uuid4())
    key = f"mfa_challenge:{challenge_id}"
    
    challenge_data = {
        "username": username,
        "client_ip": client_ip,
        "created_at": datetime.utcnow().isoformat(),
        "attempts": "0"
    }
    
    # Store as hash in Redis
    await redis.hset(key, mapping=challenge_data)
    await redis.expire(key, settings.MFA_CHALLENGE_TTL)
    
    return challenge_id


async def get_mfa_challenge(redis: Redis, challenge_id: str) -> Optional[dict]:
    """Retrieve an MFA challenge by ID"""
    key = f"mfa_challenge:{challenge_id}"
    challenge_data = await redis.hgetall(key)
    
    if not challenge_data:
        return None
    
    return challenge_data


async def increment_mfa_attempts(redis: Redis, challenge_id: str) -> int:
    """Increment the attempt counter for an MFA challenge"""
    key = f"mfa_challenge:{challenge_id}"
    attempts = await redis.hincrby(key, "attempts", 1)
    return attempts


async def delete_mfa_challenge(redis: Redis, challenge_id: str):
    """Delete an MFA challenge"""
    key = f"mfa_challenge:{challenge_id}"
    await redis.delete(key)




