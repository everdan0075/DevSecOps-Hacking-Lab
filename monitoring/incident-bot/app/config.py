"""Configuration for Incident Response Bot."""

from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Service configuration
    app_name: str = "DevSecOps Incident Bot"
    app_version: str = "1.0.0"
    debug: bool = False

    # Runbook configuration
    runbook_dir: str = "/app/runbooks"

    # Redis configuration (for IP banning, session management)
    redis_host: str = "redis"
    redis_port: int = 6379
    redis_db: int = 0

    # Notification configuration
    slack_webhook_url: str = ""
    enable_slack: bool = False

    # Report generation
    report_output_dir: str = "/app/reports"

    # External service endpoints
    login_api_url: str = "http://login-api:8000"
    gateway_url: str = "http://api-gateway:8080"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

