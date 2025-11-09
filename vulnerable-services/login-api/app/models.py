"""
Data models for Login API
"""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Login request model"""

    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=100)

    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin",
                "password": "password123",
            }
        }


class LoginResponse(BaseModel):
    """Login response model"""

    success: bool
    message: str
    requires_mfa: bool = True
    challenge_id: str | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "MFA verification required",
                "requires_mfa": True,
                "challenge_id": "7845f30b-9e67-4a98-90d0-7b0d2b62f93b",
            }
        }


class MfaVerifyRequest(BaseModel):
    """MFA verification payload"""

    challenge_id: str = Field(..., min_length=1)
    code: str = Field(..., min_length=4, max_length=10)

    class Config:
        json_schema_extra = {
            "example": {
                "challenge_id": "7845f30b-9e67-4a98-90d0-7b0d2b62f93b",
                "code": "123456",
            }
        }


class TokenResponse(BaseModel):
    """Token issuance response"""

    success: bool
    message: str | None = None
    token_type: str = "bearer"
    access_token: str
    refresh_token: str
    expires_in: int
    refresh_expires_in: int

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "token_type": "bearer",
                "message": "Authentication completed",
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "9hMTvyU2Z1S1H5kG7FmPiKzjFYgLny5nSui_oFGBZ8A",
                "expires_in": 300,
                "refresh_expires_in": 3600,
            }
        }


class RefreshRequest(BaseModel):
    """Refresh token request"""

    refresh_token: str = Field(..., min_length=10)

    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "9hMTvyU2Z1S1H5kG7FmPiKzjFYgLny5nSui_oFGBZ8A"
            }
        }


class LogoutRequest(BaseModel):
    """Logout request"""

    refresh_token: str | None = Field(
        default=None, description="Refresh token to revoke"
    )
    all_sessions: bool = Field(
        default=False,
        description="Revoke all refresh tokens for the authenticated user",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "9hMTvyU2Z1S1H5kG7FmPiKzjFYgLny5nSui_oFGBZ8A",
                "all_sessions": False,
            }
        }


class BasicResponse(BaseModel):
    """Generic success response"""

    success: bool = True
    message: str




