"""
Data models for User Service
"""
from pydantic import BaseModel
from typing import Optional


class UserProfile(BaseModel):
    """User profile information"""
    user_id: str
    username: str
    email: str
    role: str
    full_name: str
    phone: str
    address: str
    ssn: str  # Sensitive - should be redacted
    credit_card: str  # Sensitive - should be redacted


class UserSettings(BaseModel):
    """User settings"""
    theme: str
    notifications_enabled: bool
    two_factor_enabled: bool
    api_key: str  # Sensitive - should never be exposed


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    vulnerabilities: list[str]


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    message: str
    details: Optional[dict] = None

