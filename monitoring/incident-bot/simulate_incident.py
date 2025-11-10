#!/usr/bin/env python3
"""
Simulate security incidents to trigger automated incident response.

This script executes a chain of attacks to generate alerts that will be
handled by the incident-bot through Alertmanager.

Attack Chain:
1. Brute Force → LoginFailureSpike alert
2. Token Replay → RefreshTokenAbuse alert  
3. IDOR Exploitation → IDORExploitationAttempt alert
4. Gateway Bypass → DirectServiceAccessDetected alert
"""

import argparse
import asyncio
import logging
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class IncidentSimulator:
    """Simulate security incidents to trigger incident response."""

    def __init__(
        self,
        login_api_url: str = "http://localhost:8000",
        user_service_url: str = "http://localhost:8002",
        gateway_url: str = "http://localhost:8080",
        alertmanager_url: str = "http://localhost:9093",
    ):
        """Initialize simulator."""
        self.login_api_url = login_api_url
        self.user_service_url = user_service_url
        self.gateway_url = gateway_url
        self.alertmanager_url = alertmanager_url
        self.client = httpx.AsyncClient(timeout=30.0)

    async def check_services(self) -> bool:
        """Check if all services are reachable."""
        services = {
            "Login API": f"{self.login_api_url}/health",
            "User Service": f"{self.user_service_url}/health",
            "Gateway": f"{self.gateway_url}/health",
        }

        all_healthy = True
        for name, url in services.items():
            try:
                response = await self.client.get(url)
                if response.status_code == 200:
                    logger.info(f"✓ {name} is healthy")
                else:
                    logger.error(f"✗ {name} returned {response.status_code}")
                    all_healthy = False
            except Exception as e:
                logger.error(f"✗ {name} is unreachable: {e}")
                all_healthy = False

        return all_healthy

    async def simulate_brute_force(self, attempts: int = 10) -> Dict[str, Any]:
        """
        Simulate brute force attack on login endpoint.
        
        This should trigger LoginFailureSpike alert.
        """
        logger.info(f"\n{'='*60}")
        logger.info("🔥 ATTACK 1: Brute Force")
        logger.info(f"{'='*60}")
        logger.info(f"Attempting {attempts} failed logins...")

        failed_count = 0
        for i in range(attempts):
            try:
                response = await self.client.post(
                    f"{self.login_api_url}/login",
                    json={
                        "username": "victim@example.com",
                        "password": f"wrongpassword{i}",
                    },
                )
                if response.status_code in [401, 403]:
                    failed_count += 1
                    logger.debug(f"  [{i+1}/{attempts}] Login failed (expected)")
                await asyncio.sleep(0.5)  # Small delay between attempts
            except Exception as e:
                logger.error(f"  Error during brute force: {e}")

        logger.info(f"✓ Brute force simulation completed: {failed_count} failed attempts")
        logger.info("  → Expected alert: LoginFailureSpike")
        logger.info("  → Expected response: IP ban + notification + report")

        return {"attack": "brute_force", "attempts": attempts, "failed": failed_count}

    async def simulate_token_replay(self, attempts: int = 20) -> Dict[str, Any]:
        """
        Simulate token replay attack.
        
        This should trigger RefreshTokenAbuse alert.
        """
        logger.info(f"\n{'='*60}")
        logger.info("🔥 ATTACK 2: Token Replay")
        logger.info(f"{'='*60}")
        logger.info(f"Attempting to replay {attempts} invalid refresh tokens...")

        # Use a fake/expired token
        fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkF0dGFja2VyIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid_signature"

        replay_count = 0
        for i in range(attempts):
            try:
                response = await self.client.post(
                    f"{self.login_api_url}/refresh",
                    headers={"Authorization": f"Bearer {fake_token}"},
                )
                if response.status_code in [401, 403]:
                    replay_count += 1
                    logger.debug(f"  [{i+1}/{attempts}] Token rejected (expected)")
                await asyncio.sleep(0.3)
            except Exception as e:
                logger.error(f"  Error during token replay: {e}")

        logger.info(f"✓ Token replay simulation completed: {replay_count} rejected tokens")
        logger.info("  → Expected alert: RefreshTokenAbuse")
        logger.info("  → Expected response: IP ban + report + notification")

        return {"attack": "token_replay", "attempts": attempts, "rejected": replay_count}

    async def simulate_idor(self, user_ids: List[int] = None) -> Dict[str, Any]:
        """
        Simulate IDOR (Insecure Direct Object Reference) attack.
        
        This should trigger IDORExploitationAttempt alert.
        """
        if user_ids is None:
            user_ids = list(range(1, 11))  # Try to access users 1-10

        logger.info(f"\n{'='*60}")
        logger.info("🔥 ATTACK 3: IDOR Exploitation")
        logger.info(f"{'='*60}")
        logger.info(f"Attempting to access {len(user_ids)} unauthorized user profiles...")

        # First, get a valid token by logging in
        login_response = await self.client.post(
            f"{self.login_api_url}/login",
            json={"username": "alice@example.com", "password": "password123"},
        )

        if login_response.status_code != 200:
            logger.error("Failed to get valid token for IDOR attack")
            return {"attack": "idor", "error": "authentication_failed"}

        token = login_response.json().get("access_token")
        if not token:
            logger.error("No access token in response")
            return {"attack": "idor", "error": "no_token"}

        # Try to access other users' profiles
        success_count = 0
        for user_id in user_ids:
            try:
                response = await self.client.get(
                    f"{self.user_service_url}/profile/{user_id}",
                    headers={"Authorization": f"Bearer {token}"},
                )
                if response.status_code == 200:
                    success_count += 1
                    logger.debug(f"  [{user_id}] Accessed unauthorized profile (IDOR!)")
                await asyncio.sleep(0.2)
            except Exception as e:
                logger.error(f"  Error during IDOR: {e}")

        logger.info(f"✓ IDOR simulation completed: {success_count} unauthorized accesses")
        logger.info("  → Expected alert: IDORExploitationAttempt")
        logger.info("  → Expected response: IP ban (12h) + report + remediation guidance")

        return {"attack": "idor", "attempts": len(user_ids), "success": success_count}

    async def simulate_gateway_bypass(self, attempts: int = 15) -> Dict[str, Any]:
        """
        Simulate gateway bypass by directly accessing backend services.
        
        This should trigger DirectServiceAccessDetected alert.
        """
        logger.info(f"\n{'='*60}")
        logger.info("🔥 ATTACK 4: Gateway Bypass")
        logger.info(f"{'='*60}")
        logger.info(f"Attempting {attempts} direct service accesses (bypassing gateway)...")

        bypass_count = 0
        for i in range(attempts):
            try:
                # Try to access user service directly (without gateway)
                response = await self.client.get(
                    f"{self.user_service_url}/settings",
                    headers={"X-Direct-Access": "true"},  # Marker for metrics
                )
                if response.status_code in [200, 401, 403]:
                    bypass_count += 1
                    logger.debug(f"  [{i+1}/{attempts}] Direct access (bypassing gateway)")
                await asyncio.sleep(0.3)
            except Exception as e:
                logger.error(f"  Error during gateway bypass: {e}")

        logger.info(f"✓ Gateway bypass simulation completed: {bypass_count} direct accesses")
        logger.info("  → Expected alert: DirectServiceAccessDetected")
        logger.info("  → Expected response: IP ban (24h) + critical notification + remediation")

        return {"attack": "gateway_bypass", "attempts": attempts, "success": bypass_count}

    async def wait_for_alerts(self, wait_time: int = 60) -> List[Dict[str, Any]]:
        """Wait for alerts to be generated and check Alertmanager."""
        logger.info(f"\n{'='*60}")
        logger.info("⏳ Waiting for alerts to be generated...")
        logger.info(f"{'='*60}")
        logger.info(f"Waiting {wait_time} seconds for Prometheus to evaluate rules...")

        await asyncio.sleep(wait_time)

        # Check Alertmanager for active alerts
        try:
            response = await self.client.get(f"{self.alertmanager_url}/api/v2/alerts")
            if response.status_code == 200:
                alerts = response.json()
                logger.info(f"\n✓ Found {len(alerts)} active alerts in Alertmanager:")
                for alert in alerts:
                    labels = alert.get("labels", {})
                    logger.info(
                        f"  - {labels.get('alertname')} "
                        f"[{labels.get('severity')}] "
                        f"({labels.get('category')})"
                    )
                return alerts
            else:
                logger.warning(f"Failed to fetch alerts: {response.status_code}")
        except Exception as e:
            logger.error(f"Error checking Alertmanager: {e}")

        return []

    async def run_full_attack_chain(self) -> Dict[str, Any]:
        """Execute complete attack chain simulation."""
        logger.info("=" * 60)
        logger.info("🚀 Starting Incident Simulation - Attack Chain")
        logger.info("=" * 60)

        # Check services
        if not await self.check_services():
            logger.error("❌ Not all services are healthy. Aborting simulation.")
            return {"error": "services_unhealthy"}

        # Execute attacks in sequence
        results = []

        # Attack 1: Brute Force
        result = await self.simulate_brute_force(attempts=10)
        results.append(result)
        await asyncio.sleep(5)

        # Attack 2: Token Replay
        result = await self.simulate_token_replay(attempts=20)
        results.append(result)
        await asyncio.sleep(5)

        # Attack 3: IDOR
        result = await self.simulate_idor(user_ids=list(range(1, 8)))
        results.append(result)
        await asyncio.sleep(5)

        # Attack 4: Gateway Bypass
        result = await self.simulate_gateway_bypass(attempts=15)
        results.append(result)

        # Wait for alerts
        alerts = await self.wait_for_alerts(wait_time=60)

        logger.info(f"\n{'='*60}")
        logger.info("✅ Incident Simulation Completed")
        logger.info(f"{'='*60}")
        logger.info(f"Total attacks executed: {len(results)}")
        logger.info(f"Alerts generated: {len(alerts)}")
        logger.info(
            "\n💡 Check incident-bot logs and Grafana dashboards for automated responses!"
        )

        return {"results": results, "alerts": alerts, "total_attacks": len(results)}

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Simulate security incidents for incident response testing"
    )
    parser.add_argument(
        "--attack",
        choices=["brute-force", "token-replay", "idor", "gateway-bypass", "all"],
        default="all",
        help="Type of attack to simulate (default: all)",
    )
    parser.add_argument(
        "--login-api",
        default="http://localhost:8000",
        help="Login API URL",
    )
    parser.add_argument(
        "--user-service",
        default="http://localhost:8002",
        help="User Service URL",
    )
    parser.add_argument(
        "--gateway",
        default="http://localhost:8080",
        help="API Gateway URL",
    )
    parser.add_argument(
        "--alertmanager",
        default="http://localhost:9093",
        help="Alertmanager URL",
    )

    args = parser.parse_args()

    simulator = IncidentSimulator(
        login_api_url=args.login_api,
        user_service_url=args.user_service,
        gateway_url=args.gateway,
        alertmanager_url=args.alertmanager,
    )

    try:
        if args.attack == "all":
            await simulator.run_full_attack_chain()
        elif args.attack == "brute-force":
            await simulator.simulate_brute_force()
        elif args.attack == "token-replay":
            await simulator.simulate_token_replay()
        elif args.attack == "idor":
            await simulator.simulate_idor()
        elif args.attack == "gateway-bypass":
            await simulator.simulate_gateway_bypass()

    except KeyboardInterrupt:
        logger.info("\n\n⚠️  Simulation interrupted by user")
    except Exception as e:
        logger.error(f"❌ Simulation failed: {e}", exc_info=True)
        return 1
    finally:
        await simulator.close()

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

