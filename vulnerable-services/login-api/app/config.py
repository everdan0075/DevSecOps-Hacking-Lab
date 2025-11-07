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
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()




