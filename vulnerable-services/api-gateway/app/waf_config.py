"""
WAF Configuration Management

Centralized configuration for WAF features including:
- Per-endpoint rate limiting
- Geo-blocking
- User-Agent filtering
- Bot detection
"""
from typing import Dict, List, Set, Optional
from dataclasses import dataclass, field
from pydantic_settings import BaseSettings


@dataclass
class EndpointRateLimit:
    """Per-endpoint rate limit configuration"""
    endpoint_pattern: str  # Regex pattern
    requests_per_minute: int
    burst_size: int
    description: str = ""


@dataclass
class WAFConfig:
    """WAF configuration container"""

    # ========================================================================
    # Signature-based Detection
    # ========================================================================
    enable_signature_detection: bool = True
    signature_scan_body: bool = True
    signature_scan_query: bool = True
    signature_scan_headers: bool = True
    max_scan_body_size: int = 1048576  # 1 MB

    # ========================================================================
    # Per-Endpoint Rate Limiting
    # ========================================================================
    enable_endpoint_rate_limiting: bool = True
    endpoint_rate_limits: List[EndpointRateLimit] = field(default_factory=lambda: [
        # Authentication endpoints (stricter limits)
        EndpointRateLimit(
            endpoint_pattern=r"^/auth/login$",
            requests_per_minute=10,
            burst_size=3,
            description="Login endpoint - prevent brute force"
        ),
        EndpointRateLimit(
            endpoint_pattern=r"^/auth/mfa/verify$",
            requests_per_minute=15,
            burst_size=5,
            description="MFA verification - prevent bypass attempts"
        ),
        EndpointRateLimit(
            endpoint_pattern=r"^/auth/token/refresh$",
            requests_per_minute=20,
            burst_size=5,
            description="Token refresh - moderate limit"
        ),

        # User service endpoints
        EndpointRateLimit(
            endpoint_pattern=r"^/api/users/profile/\d+$",
            requests_per_minute=30,
            burst_size=10,
            description="User profile access - prevent IDOR enumeration"
        ),
        EndpointRateLimit(
            endpoint_pattern=r"^/api/users/settings$",
            requests_per_minute=20,
            burst_size=5,
            description="Settings endpoint"
        ),

        # Honeypot endpoints (very strict)
        EndpointRateLimit(
            endpoint_pattern=r"^/(admin|phpmyadmin|wp-admin|\.env|\.git)",
            requests_per_minute=5,
            burst_size=2,
            description="Honeypot endpoints - aggressive rate limiting"
        ),
    ])

    # ========================================================================
    # Geo-Blocking
    # ========================================================================
    enable_geo_blocking: bool = False  # Disabled by default
    geo_block_countries: Set[str] = field(default_factory=set)  # ISO country codes
    geo_allow_countries: Set[str] = field(default_factory=set)  # Whitelist mode
    geo_whitelist_mode: bool = False  # If True, only allow listed countries

    # ========================================================================
    # User-Agent Filtering
    # ========================================================================
    enable_user_agent_filtering: bool = True

    # Known malicious User-Agents
    blocked_user_agents: List[str] = field(default_factory=lambda: [
        # Scanners
        r"nikto",
        r"nmap",
        r"masscan",
        r"zgrab",
        r"sqlmap",
        r"havij",
        r"acunetix",
        r"nessus",
        r"openvas",
        r"w3af",
        r"burp",
        r"metasploit",

        # Scrapers (aggressive)
        r"scrapy",
        r"python-requests(?!/)", # Block bare python-requests
        r"curl(?!/)",  # Block bare curl
        r"wget(?!/)",  # Block bare wget

        # Known bad bots
        r"semrush",
        r"ahrefs",
        r"mj12bot",
        r"dotbot",
    ])

    # Require User-Agent header
    require_user_agent: bool = True

    # ========================================================================
    # Bot Detection
    # ========================================================================
    enable_bot_detection: bool = True

    # Suspicious patterns in User-Agent
    bot_detection_patterns: List[str] = field(default_factory=lambda: [
        r"bot",
        r"crawler",
        r"spider",
        r"scraper",
        r"scan",
    ])

    # Allowed good bots (search engines, monitoring)
    allowed_bots: List[str] = field(default_factory=lambda: [
        r"googlebot",
        r"bingbot",
        r"duckduckbot",
        r"slackbot",
        r"twitterbot",
        r"facebookexternalhit",
        r"uptimerobot",
        r"pingdom",
    ])

    # ========================================================================
    # Request Size Limits
    # ========================================================================
    max_request_body_size: int = 10485760  # 10 MB
    max_header_size: int = 8192  # 8 KB
    max_url_length: int = 2048

    # ========================================================================
    # IP Reputation (placeholder for future enhancement)
    # ========================================================================
    enable_ip_reputation: bool = False
    ip_reputation_threshold: float = 0.5  # 0.0 = clean, 1.0 = malicious

    # ========================================================================
    # Response Headers
    # ========================================================================
    add_waf_headers: bool = True  # Add X-WAF-* headers for debugging


class WAFSettings(BaseSettings):
    """WAF settings from environment variables"""

    # Global WAF toggle
    WAF_ENABLED: bool = True

    # Feature toggles
    WAF_SIGNATURE_DETECTION: bool = True
    WAF_ENDPOINT_RATE_LIMITING: bool = True
    WAF_GEO_BLOCKING: bool = False
    WAF_USER_AGENT_FILTERING: bool = True
    WAF_BOT_DETECTION: bool = True

    # Geo-blocking settings
    WAF_GEO_BLOCK_COUNTRIES: str = ""  # Comma-separated ISO codes
    WAF_GEO_ALLOW_COUNTRIES: str = ""  # Comma-separated ISO codes
    WAF_GEO_WHITELIST_MODE: bool = False

    # Debug mode
    WAF_DEBUG: bool = False

    class Config:
        env_file = ".env"


def load_waf_config() -> WAFConfig:
    """Load WAF configuration from environment"""
    settings = WAFSettings()

    config = WAFConfig()

    # Apply environment overrides
    config.enable_signature_detection = settings.WAF_SIGNATURE_DETECTION
    config.enable_endpoint_rate_limiting = settings.WAF_ENDPOINT_RATE_LIMITING
    config.enable_geo_blocking = settings.WAF_GEO_BLOCKING
    config.enable_user_agent_filtering = settings.WAF_USER_AGENT_FILTERING
    config.enable_bot_detection = settings.WAF_BOT_DETECTION

    # Parse geo-blocking lists
    if settings.WAF_GEO_BLOCK_COUNTRIES:
        config.geo_block_countries = set(
            settings.WAF_GEO_BLOCK_COUNTRIES.upper().split(",")
        )

    if settings.WAF_GEO_ALLOW_COUNTRIES:
        config.geo_allow_countries = set(
            settings.WAF_GEO_ALLOW_COUNTRIES.upper().split(",")
        )

    config.geo_whitelist_mode = settings.WAF_GEO_WHITELIST_MODE

    return config


# Global WAF configuration
waf_config = load_waf_config()
