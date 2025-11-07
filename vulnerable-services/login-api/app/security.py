"""
Security functions and defense mechanisms
"""

from datetime import datetime, timedelta
from typing import Dict
import structlog

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


def verify_login(username: str, password: str) -> bool:
    """
    Verify login credentials
    
    VULNERABILITY: Simple comparison without timing attack protection
    In production, use constant-time comparison and proper password hashing
    """
    return MOCK_USERS.get(username) == password


def record_failed_attempt(ip: str, username: str) -> int:
    """
    Record a failed login attempt from an IP address
    Returns the total number of failed attempts
    """
    now = datetime.utcnow()
    
    # Initialize if not exists
    if ip not in failed_attempts:
        failed_attempts[ip] = []
    
    # Add new attempt
    failed_attempts[ip].append({
        "timestamp": now,
        "username": username
    })
    
    # Clean old attempts (older than BAN_DURATION)
    cutoff = now - timedelta(seconds=settings.BAN_DURATION)
    failed_attempts[ip] = [
        attempt for attempt in failed_attempts[ip]
        if attempt["timestamp"] > cutoff
    ]
    
    return len(failed_attempts[ip])


def get_failed_attempts(ip: str) -> int:
    """Get the number of failed attempts for an IP"""
    if ip not in failed_attempts:
        return 0
    
    # Clean old attempts
    now = datetime.utcnow()
    cutoff = now - timedelta(seconds=settings.BAN_DURATION)
    failed_attempts[ip] = [
        attempt for attempt in failed_attempts[ip]
        if attempt["timestamp"] > cutoff
    ]
    
    return len(failed_attempts[ip])


def ban_ip(ip: str, reason: str = "policy_violation"):
    """Ban an IP address temporarily"""
    banned_ips[ip] = datetime.utcnow()
    logger.warning("ip_banned", ip=ip, duration=settings.BAN_DURATION, reason=reason)
    observe_ip_ban(reason)


def is_ip_banned(ip: str) -> bool:
    """Check if an IP is currently banned"""
    if ip not in banned_ips:
        return False
    
    ban_time = banned_ips[ip]
    ban_expiry = ban_time + timedelta(seconds=settings.BAN_DURATION)
    
    if datetime.utcnow() > ban_expiry:
        # Ban expired, remove it
        del banned_ips[ip]
        return False
    
    return True


def clear_failed_attempts(ip: str):
    """Clear failed attempts for an IP (called on successful login)"""
    if ip in failed_attempts:
        del failed_attempts[ip]


def get_security_stats() -> dict:
    """Get overall security statistics"""
    return {
        "total_banned_ips": len(banned_ips),
        "ips_with_failed_attempts": len(failed_attempts),
        "total_failed_attempts": sum(len(attempts) for attempts in failed_attempts.values())
    }




