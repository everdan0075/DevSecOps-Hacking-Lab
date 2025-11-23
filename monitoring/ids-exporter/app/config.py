"""
Configuration for IDS Exporter
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """IDS Exporter configuration"""

    # Suricata log file path
    SURICATA_EVE_LOG: str = "/var/log/suricata/eve.json"

    # Incident bot integration
    INCIDENT_BOT_URL: str = "http://incident-bot:5002"
    INCIDENT_BOT_ENABLED: bool = True

    # Alert thresholds for incident bot reporting
    CRITICAL_ALERT_THRESHOLD: int = 1  # Report immediately
    HIGH_ALERT_THRESHOLD: int = 3      # Report after 3 alerts
    MEDIUM_ALERT_THRESHOLD: int = 10   # Report after 10 alerts

    # Log processing settings
    LOG_TAIL_INTERVAL: float = 1.0  # Seconds between log reads
    LOG_BATCH_SIZE: int = 100       # Max events to process per batch

    # Active attacker tracking
    ACTIVE_ATTACKER_WINDOW: int = 300  # 5 minutes

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
