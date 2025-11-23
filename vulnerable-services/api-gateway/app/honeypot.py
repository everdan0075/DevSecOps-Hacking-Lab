"""
Honeypot Module - Trap endpoints to detect and track attackers

This module implements various honeypot endpoints that mimic common attack targets.
When an attacker accesses these endpoints, their activity is logged and metrics are tracked.
"""
import logging
import time
import hashlib
import httpx
from typing import Dict, Any, Set, Optional
from datetime import datetime, timedelta
from fastapi import Request, Response
from fastapi.responses import JSONResponse, PlainTextResponse, HTMLResponse
from . import metrics as metrics_module
from .config import settings

logger = logging.getLogger(__name__)

# HTTP client for incident-bot integration
http_client: Optional[httpx.AsyncClient] = None

def get_http_client() -> httpx.AsyncClient:
    """Get or create HTTP client for incident-bot communication"""
    global http_client
    if http_client is None:
        http_client = httpx.AsyncClient(timeout=5.0)
    return http_client

# In-memory tracking of attacker IPs
# In production, this should use Redis for distributed tracking
attacker_ips: Set[str] = set()
honeypot_hits: Dict[str, Dict[str, Any]] = {}


def get_client_ip(request: Request) -> str:
    """Extract client IP from request headers (considering proxies)"""
    # Check X-Forwarded-For header first (for proxied requests)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()

    # Check X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Fall back to direct client IP
    if request.client:
        return request.client.host

    return "unknown"


async def report_to_incident_bot(
    ip_address: str,
    attack_type: str,
    severity: str,
    target: str,
    details: Dict[str, Any],
    user_agent: Optional[str] = None
) -> None:
    """
    Report attack event to incident-bot correlation engine

    Args:
        ip_address: Attacker IP
        attack_type: Type of attack
        severity: Attack severity
        target: Target endpoint
        details: Additional context
        user_agent: User agent string
    """
    # Get incident-bot URL from settings (default to localhost)
    incident_bot_url = getattr(settings, "INCIDENT_BOT_URL", "http://incident-bot:5002")

    try:
        client = get_http_client()

        payload = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "ip_address": ip_address,
            "attack_type": attack_type,
            "severity": severity,
            "target": target,
            "details": details,
            "user_agent": user_agent
        }

        # Send async request (fire and forget, with short timeout)
        await client.post(
            f"{incident_bot_url}/api/attack-event",
            json=payload,
            timeout=2.0
        )

        logger.debug(f"Reported honeypot hit to incident-bot: {attack_type} from {ip_address}")

    except Exception as e:
        # Log but don't fail - incident-bot integration is optional
        logger.debug(f"Failed to report to incident-bot: {e}")


async def track_honeypot_hit(
    request: Request,
    honeypot_type: str,
    severity: str = "medium"
) -> None:
    """
    Track honeypot hit with metrics, logging, and incident-bot integration

    Args:
        request: FastAPI request object
        honeypot_type: Type of honeypot (admin_panel, secret_file, etc.)
        severity: Attack severity (low, medium, high, critical)
    """
    client_ip = get_client_ip(request)
    timestamp = datetime.utcnow().isoformat()
    path = str(request.url.path)
    user_agent = request.headers.get("User-Agent", "unknown")

    # Track unique attacker IPs
    attacker_ips.add(client_ip)

    # Update honeypot hit details
    hit_key = f"{client_ip}:{honeypot_type}"
    if hit_key not in honeypot_hits:
        honeypot_hits[hit_key] = {
            "ip": client_ip,
            "honeypot_type": honeypot_type,
            "severity": severity,
            "first_seen": timestamp,
            "last_seen": timestamp,
            "hit_count": 0,
            "user_agent": user_agent,
            "paths": []
        }

    honeypot_hits[hit_key]["hit_count"] += 1
    honeypot_hits[hit_key]["last_seen"] = timestamp

    # Track accessed path
    if path not in honeypot_hits[hit_key]["paths"]:
        honeypot_hits[hit_key]["paths"].append(path)

    # Update Prometheus metrics
    metrics_module.honeypot_hits_total.labels(
        honeypot_type=honeypot_type,
        severity=severity
    ).inc()

    metrics_module.honeypot_unique_attackers.set(len(attacker_ips))

    # Log the honeypot hit
    logger.warning(
        f"Honeypot hit: type={honeypot_type}, severity={severity}, "
        f"ip={client_ip}, path={path}, user_agent={user_agent}"
    )

    # Report to incident-bot for attack correlation
    await report_to_incident_bot(
        ip_address=client_ip,
        attack_type=f"honeypot_{honeypot_type}",
        severity=severity,
        target=path,
        details={"honeypot_type": honeypot_type, "method": request.method},
        user_agent=user_agent
    )


# ============================================================================
# Honeypot Handlers
# ============================================================================

async def honeypot_admin_panel(request: Request) -> Response:
    """
    Fake admin panel honeypot
    Attracts: Admin panel brute force, credential stuffing
    Severity: HIGH - indicates targeted attack
    """
    await track_honeypot_hit(request, "admin_panel", severity="high")

    # Return realistic-looking admin login page
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Admin Panel - Login</title>
        <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; }
            .login-box {
                width: 300px; margin: 100px auto; padding: 40px;
                background: white; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; }
            button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="login-box">
            <h2>Admin Login</h2>
            <form method="POST">
                <input type="text" name="username" placeholder="Username" required>
                <input type="password" name="password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
        </div>
    </body>
    </html>
    """

    if request.method == "POST":
        # POST requests indicate active attack attempt
        await track_honeypot_hit(request, "admin_panel_post", severity="critical")
        return JSONResponse(
            status_code=401,
            content={"error": "Invalid credentials"}
        )

    return HTMLResponse(content=html_content, status_code=200)


async def honeypot_env_file(request: Request) -> Response:
    """
    Fake .env file honeypot
    Attracts: Credential theft, secret scanning
    Severity: CRITICAL - highly suspicious activity
    """
    await track_honeypot_hit(request, "secret_file_env", severity="critical")

    # Return fake environment variables
    fake_env = """
# Application Configuration
APP_NAME=DevSecOps Lab
ENVIRONMENT=production

# Database (fake credentials)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=production_db
DB_USER=admin
DB_PASSWORD=honeypot_fake_password_123

# API Keys (fake)
API_KEY=sk_test_honeypot_fake_key_abcdef123456
SECRET_KEY=honeypot_secret_do_not_use

# JWT
JWT_SECRET=honeypot_jwt_secret_fake

# Redis
REDIS_URL=redis://localhost:6379/0
"""

    return PlainTextResponse(content=fake_env, status_code=200)


async def honeypot_backup_file(request: Request) -> Response:
    """
    Fake backup file honeypot
    Attracts: Data exfiltration attempts, backup file scanning
    Severity: HIGH - indicates reconnaissance
    """
    path = str(request.url.path)

    if "backup.zip" in path:
        honeypot_type = "backup_zip"
    elif "backup.sql" in path:
        honeypot_type = "backup_sql"
    else:
        honeypot_type = "backup_file"

    await track_honeypot_hit(request, honeypot_type, severity="high")

    # Return fake backup file content
    if ".sql" in path:
        fake_content = """
-- Database Backup (Honeypot)
-- Generated: 2024-01-01 00:00:00

CREATE TABLE users (
    id INT PRIMARY KEY,
    username VARCHAR(50),
    password_hash VARCHAR(255),
    email VARCHAR(100)
);

INSERT INTO users VALUES (1, 'admin', 'honeypot_hash_fake', 'admin@example.com');
INSERT INTO users VALUES (2, 'user', 'honeypot_hash_fake', 'user@example.com');
"""
        return PlainTextResponse(content=fake_content, status_code=200)
    else:
        # Fake ZIP file header (to appear legitimate)
        return Response(
            content=b"PK\x03\x04HONEYPOT_FAKE_ZIP",
            status_code=200,
            media_type="application/zip"
        )


async def honeypot_git_config(request: Request) -> Response:
    """
    Fake .git/config honeypot
    Attracts: Source code theft, git exposure exploitation
    Severity: HIGH - indicates advanced reconnaissance
    """
    path = str(request.url.path)

    if ".git/config" in path:
        honeypot_type = "git_config"
    else:
        honeypot_type = "git_head"

    await track_honeypot_hit(request, honeypot_type, severity="high")

    if ".git/config" in path:
        fake_config = """
[core]
    repositoryformatversion = 0
    filemode = true
    bare = false
    logallrefupdates = true

[remote "origin"]
    url = https://github.com/honeypot/fake-repo.git
    fetch = +refs/heads/*:refs/remotes/origin/*

[branch "main"]
    remote = origin
    merge = refs/heads/main
"""
        return PlainTextResponse(content=fake_config, status_code=200)
    else:
        # Fake .git/HEAD
        return PlainTextResponse(content="ref: refs/heads/main\n", status_code=200)


async def honeypot_config_json(request: Request) -> Response:
    """
    Fake config file honeypot
    Attracts: Configuration file exposure attempts
    Severity: MEDIUM - common reconnaissance pattern
    """
    path = str(request.url.path)

    if ".json" in path:
        honeypot_type = "config_json"
    elif ".yml" in path or ".yaml" in path:
        honeypot_type = "config_yaml"
    else:
        honeypot_type = "config_file"

    await track_honeypot_hit(request, honeypot_type, severity="medium")

    if ".json" in path:
        fake_config = {
            "app_name": "DevSecOps Lab",
            "version": "1.0.0",
            "database": {
                "host": "localhost",
                "port": 5432,
                "username": "honeypot_user",
                "password": "honeypot_password_fake"
            },
            "api_keys": {
                "stripe": "sk_test_honeypot_fake_key",
                "sendgrid": "SG.honeypot_fake_key"
            }
        }
        return JSONResponse(content=fake_config, status_code=200)
    else:
        # Fake YAML config
        fake_yaml = """
app_name: DevSecOps Lab
version: 1.0.0

database:
  host: localhost
  port: 5432
  username: honeypot_user
  password: honeypot_password_fake

api_keys:
  stripe: sk_test_honeypot_fake_key
  sendgrid: SG.honeypot_fake_key
"""
        return PlainTextResponse(content=fake_yaml, status_code=200)


async def honeypot_phpmyadmin(request: Request) -> Response:
    """
    Fake phpMyAdmin honeypot
    Attracts: Database admin panel attacks
    Severity: HIGH - targeted attack on database access
    """
    await track_honeypot_hit(request, "phpmyadmin", severity="high")

    # Return realistic phpMyAdmin login page
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>phpMyAdmin</title>
        <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; }
            .pma-login {
                width: 400px; margin: 100px auto; padding: 40px;
                background: white; border: 1px solid #ddd;
            }
            .logo { text-align: center; margin-bottom: 20px; }
            input { width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; }
            button { width: 100%; padding: 10px; background: #3a7abb; color: white; border: none; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="pma-login">
            <div class="logo">
                <h2>phpMyAdmin</h2>
                <p>Version 5.2.0</p>
            </div>
            <form method="POST">
                <input type="text" name="pma_username" placeholder="Username" required>
                <input type="password" name="pma_password" placeholder="Password" required>
                <select name="server">
                    <option value="1">Server: localhost</option>
                </select>
                <button type="submit">Log in</button>
            </form>
        </div>
    </body>
    </html>
    """

    if request.method == "POST":
        await track_honeypot_hit(request, "phpmyadmin_post", severity="critical")
        return JSONResponse(
            status_code=401,
            content={"error": "Access denied"}
        )

    return HTMLResponse(content=html_content, status_code=200)


async def honeypot_wordpress_login(request: Request) -> Response:
    """
    Fake WordPress login honeypot
    Attracts: WordPress-specific attacks, CMS exploitation
    Severity: MEDIUM - automated scanning
    """
    await track_honeypot_hit(request, "wordpress", severity="medium")

    # Return realistic WordPress login page
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Log In &lsaquo; DevSecOps Lab &mdash; WordPress</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif; background: #f1f1f1; }
            .login { width: 320px; margin: 100px auto; padding: 26px 24px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.13); }
            h1 { text-align: center; margin: 0 0 24px; }
            input[type="text"], input[type="password"] { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; }
            .button-primary { width: 100%; padding: 10px; background: #2271b1; color: white; border: none; cursor: pointer; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="login">
            <h1>Powered by WordPress</h1>
            <form method="POST">
                <input type="text" name="log" placeholder="Username or Email Address" required>
                <input type="password" name="pwd" placeholder="Password" required>
                <button type="submit" class="button-primary">Log In</button>
            </form>
        </div>
    </body>
    </html>
    """

    if request.method == "POST":
        await track_honeypot_hit(request, "wordpress_post", severity="high")
        return HTMLResponse(
            content=html_content.replace(
                "</form>",
                '<p style="color:red;">Error: Invalid username or password.</p></form>'
            ),
            status_code=200
        )

    return HTMLResponse(content=html_content, status_code=200)


async def honeypot_api_keys(request: Request) -> Response:
    """
    Fake API keys endpoint honeypot
    Attracts: API credential theft, secret scanning
    Severity: CRITICAL - direct attempt to steal credentials
    """
    path = str(request.url.path)

    if "/api/keys" in path:
        honeypot_type = "api_keys"
    elif "/api/secrets" in path:
        honeypot_type = "api_secrets"
    else:
        honeypot_type = "api_tokens"

    await track_honeypot_hit(request, honeypot_type, severity="critical")

    # Return fake API credentials
    fake_keys = {
        "api_keys": [
            {
                "name": "production_api_key",
                "key": "honeypot_fake_key_" + hashlib.sha256(b"fake1").hexdigest()[:32],
                "created_at": "2024-01-01T00:00:00Z",
                "scope": "read,write"
            },
            {
                "name": "admin_api_key",
                "key": "honeypot_fake_admin_" + hashlib.sha256(b"fake2").hexdigest()[:32],
                "created_at": "2024-01-01T00:00:00Z",
                "scope": "admin"
            }
        ],
        "tokens": {
            "jwt_secret": "honeypot_jwt_secret_fake_do_not_use",
            "refresh_token": "honeypot_refresh_" + hashlib.sha256(b"fake3").hexdigest()
        }
    }

    return JSONResponse(content=fake_keys, status_code=200)


async def get_honeypot_stats() -> Dict[str, Any]:
    """
    Get honeypot statistics for monitoring dashboard

    Returns:
        Dictionary with honeypot statistics and attacker information
    """
    # Calculate statistics
    total_hits = sum(hit["hit_count"] for hit in honeypot_hits.values())

    # Group by honeypot type
    hits_by_type = {}
    for hit in honeypot_hits.values():
        honeypot_type = hit["honeypot_type"]
        if honeypot_type not in hits_by_type:
            hits_by_type[honeypot_type] = {
                "count": 0,
                "severity": hit["severity"],
                "unique_ips": set()
            }
        hits_by_type[honeypot_type]["count"] += hit["hit_count"]
        hits_by_type[honeypot_type]["unique_ips"].add(hit["ip"])

    # Convert sets to counts for JSON serialization
    for honeypot_type in hits_by_type:
        hits_by_type[honeypot_type]["unique_ips"] = len(hits_by_type[honeypot_type]["unique_ips"])

    # Get top attackers
    attacker_stats = {}
    for hit in honeypot_hits.values():
        ip = hit["ip"]
        if ip not in attacker_stats:
            attacker_stats[ip] = {
                "ip": ip,
                "total_hits": 0,
                "honeypots_accessed": set(),
                "first_seen": hit["first_seen"],
                "last_seen": hit["last_seen"],
                "user_agent": hit["user_agent"]
            }
        attacker_stats[ip]["total_hits"] += hit["hit_count"]
        attacker_stats[ip]["honeypots_accessed"].add(hit["honeypot_type"])

        # Update last seen
        if hit["last_seen"] > attacker_stats[ip]["last_seen"]:
            attacker_stats[ip]["last_seen"] = hit["last_seen"]

    # Convert to list and sort by hit count
    top_attackers = sorted(
        [
            {
                **stats,
                "honeypots_accessed": len(stats["honeypots_accessed"])
            }
            for stats in attacker_stats.values()
        ],
        key=lambda x: x["total_hits"],
        reverse=True
    )[:10]  # Top 10 attackers

    return {
        "summary": {
            "total_honeypot_hits": total_hits,
            "unique_attacker_ips": len(attacker_ips),
            "honeypot_types_hit": len(hits_by_type),
            "last_updated": datetime.utcnow().isoformat()
        },
        "hits_by_type": hits_by_type,
        "top_attackers": top_attackers,
        "severity_distribution": {
            "critical": sum(1 for hit in honeypot_hits.values() if hit["severity"] == "critical"),
            "high": sum(1 for hit in honeypot_hits.values() if hit["severity"] == "high"),
            "medium": sum(1 for hit in honeypot_hits.values() if hit["severity"] == "medium"),
            "low": sum(1 for hit in honeypot_hits.values() if hit["severity"] == "low")
        }
    }
