"""
Configuration for API Gateway
"""
import os
from typing import Optional


class Settings:
    """Gateway configuration settings"""
    
    # Application
    APP_NAME: str = "API Gateway"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8080"))
    
    # Backend Services
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://login-api:8000")
    USER_SERVICE_URL: str = os.getenv("USER_SERVICE_URL", "http://user-service:8001")
    
    # JWT Configuration (same as auth-service for validation)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production-this-is-not-secure")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    
    # Security
    ENABLE_CORS: bool = os.getenv("ENABLE_CORS", "true").lower() == "true"
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://localhost:8080"]
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "60"))
    RATE_LIMIT_BURST_SIZE: int = int(os.getenv("RATE_LIMIT_BURST_SIZE", "10"))
    
    # WAF
    WAF_ENABLED: bool = os.getenv("WAF_ENABLED", "true").lower() == "true"
    WAF_MAX_BODY_SIZE: int = int(os.getenv("WAF_MAX_BODY_SIZE", str(10 * 1024 * 1024)))  # 10MB
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    @classmethod
    def get_settings(cls) -> "Settings":
        """Get singleton settings instance"""
        return cls()


settings = Settings()

