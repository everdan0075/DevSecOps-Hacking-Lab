"""
Configuration management for Login API
"""

from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    ENVIRONMENT: Literal["development", "production"] = "development"
    LOG_LEVEL: str = "INFO"
    SERVICE_NAME: str = "DevSecOps Hacking Lab - Auth Service"
    
    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    # Rate Limiting
    ENABLE_RATE_LIMITING: bool = True
    RATE_LIMIT_REQUESTS: int = 5
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # IP Banning
    ENABLE_IP_BANNING: bool = True
    BAN_THRESHOLD: int = 10  # failed attempts before ban
    BAN_DURATION: int = 900  # seconds (15 minutes)
    
    # Security (for demonstration purposes - these are intentionally weak)
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 5
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Multi-factor Authentication
    MFA_ENABLED: bool = True
    MFA_CHALLENGE_TTL: int = 300  # seconds (5 minutes)
    MFA_CODE_STEP: int = 30       # seconds per TOTP step
    MFA_VALID_WINDOW: int = 1     # allow previous/next step
    MFA_MAX_ATTEMPTS: int = 5
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()




