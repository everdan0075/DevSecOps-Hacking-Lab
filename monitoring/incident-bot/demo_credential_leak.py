#!/usr/bin/env python3
"""
Advanced Demonstration: Credential Leak + Chain Attack

This script simulates a realistic attack scenario:
1. Simulated credential leak (fake data breach)
2. Automated incident response activation
3. Follow-up chain attacks demonstrating why credential leaks are critical

The scenario demonstrates how attackers exploit leaked credentials to:
- Gain initial access
- Escalate privileges (IDOR)
- Exfiltrate data
- Maintain persistence (token replay)

This triggers our incident response automation and shows the importance
of immediate response to credential leaks.
"""

import argparse
import asyncio
import logging
import sys
import time
from datetime import datetime
from typing import Any, Dict, List

import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class CredentialLeakDemo:
    """Demonstrate credential leak and chain attack scenario."""

    def __init__(
        self,
        login_api_url: str = "http://localhost:8000",
        user_service_url: str = "http://localhost:8002",
        incident_bot_url: str = "http://localhost:5002",
    ):
        """Initialize demo."""
        self.login_api_url = login_api_url
        self.user_service_url = user_service_url
        self.incident_bot_url = incident_bot_url
        self.client = httpx.AsyncClient(timeout=30.0)

        # Simulated "leaked" credentials
        self.leaked_credentials = [
            {"username": "alice@example.com", "password": "password123"},
            {"username": "bob@example.com", "password": "password123"},
            {"username": "charlie@example.com", "password": "password123"},
        ]

    def print_banner(self, text: str, symbol: str = "="):
        """Print formatted banner."""
        logger.info(f"\n{symbol * 70}")
        logger.info(f"  {text}")
        logger.info(f"{symbol * 70}\n")

    async def stage_1_simulate_leak_detection(self):
        """
        Stage 1: Simulate detection of credential leak.
        
        In reality, this could be triggered by:
        - Monitoring paste sites (Pastebin, GitHub, etc.)
        - Dark web monitoring
        - Breach notification services
        - Internal data loss prevention (DLP) alerts
        """
        self.print_banner("STAGE 1: Credential Leak Detection", "=")

        logger.info("📡 Simulating credential leak detection...")
        logger.info("   Source: Fake Pastebin post (simulated)")
        logger.info(f"   Leaked accounts: {len(self.leaked_credentials)}")
        logger.info("   Time detected: Just now")

        # Display leaked data (sanitized for demo)
        logger.info("\n🔴 LEAKED CREDENTIALS DETECTED:")
        for i, cred in enumerate(self.leaked_credentials, 1):
            logger.info(f"   {i}. {cred['username']} : {'*' * len(cred['password'])}")

        # Trigger incident response by sending webhook to incident-bot
        logger.info("\n🚨 Triggering Incident Response Automation...")

        webhook_payload = {
            "version": "4",
            "groupKey": "credential-leak-group",
            "status": "firing",
            "receiver": "incident-bot",
            "groupLabels": {},
            "commonLabels": {},
            "commonAnnotations": {},
            "externalURL": "http://alertmanager:9093",
            "alerts": [
                {
                    "status": "firing",
                    "labels": {
                        "alertname": "CredentialLeakDetected",
                        "severity": "critical",
                        "service": "security-monitoring",
                        "category": "credential-leak",
                    },
                    "annotations": {
                        "summary": "Credential leak detected on external source",
                        "description": f"Found {len(self.leaked_credentials)} leaked credentials on Pastebin (simulated). Immediate action required.",
                        "remediation": "Ban source IPs, revoke sessions, force password resets",
                    },
                    "startsAt": datetime.utcnow().isoformat() + "Z",
                    "endsAt": None,
                    "generatorURL": "http://security-monitor:8080",
                    "fingerprint": "credential-leak-demo-001",
                }
            ],
        }

        try:
            response = await self.client.post(
                f"{self.incident_bot_url}/webhook",
                json=webhook_payload,
            )

            if response.status_code == 200:
                data = response.json()
                logger.info("✅ Incident response triggered successfully!")
                logger.info(f"   Status: {data.get('status')}")

                if "executions" in data and len(data["executions"]) > 0:
                    execution = data["executions"][0]
                    logger.info(f"   Runbook: {execution.get('runbook_name')}")
                    logger.info(f"   Actions: {execution.get('actions_executed', 0)} executed")
            else:
                logger.error(f"❌ Failed to trigger incident response: {response.status_code}")
        except Exception as e:
            logger.error(f"❌ Error triggering incident response: {e}")

        logger.info("\n⏳ Waiting for incident response to complete...")
        await asyncio.sleep(3)

    async def stage_2_attacker_exploitation(self):
        """
        Stage 2: Simulate attacker using leaked credentials.
        
        This demonstrates what happens if credentials are NOT immediately handled.
        """
        self.print_banner("STAGE 2: Attacker Exploitation (Credential Stuffing)", "=")

        logger.info("👤 Attacker perspective: Using leaked credentials...")
        logger.info("   Attack type: Credential Stuffing")
        logger.info("   Goal: Gain unauthorized access\n")

        successful_logins = []

        for cred in self.leaked_credentials:
            try:
                logger.info(f"🔓 Attempting login as {cred['username']}...")
                response = await self.client.post(
                    f"{self.login_api_url}/login",
                    json={
                        "username": cred["username"],
                        "password": cred["password"],
                    },
                )

                if response.status_code == 200:
                    data = response.json()
                    token = data.get("access_token")
                    logger.info(f"   ✅ SUCCESS - Obtained access token!")
                    successful_logins.append(
                        {"username": cred["username"], "token": token}
                    )
                else:
                    logger.info(f"   ❌ BLOCKED - Login denied ({response.status_code})")

                await asyncio.sleep(1)

            except Exception as e:
                logger.error(f"   ❌ Error: {e}")

        logger.info(f"\n📊 Exploitation Results:")
        logger.info(f"   Successful logins: {len(successful_logins)}/{len(self.leaked_credentials)}")

        if len(successful_logins) > 0:
            logger.info(f"   ⚠️  Attacker gained access to {len(successful_logins)} accounts!")
        else:
            logger.info(f"   ✅ Incident response prevented all unauthorized access!")

        return successful_logins

    async def stage_3_chain_attack_idor(self, successful_logins: List[Dict]):
        """
        Stage 3: Chain attack using compromised accounts (IDOR).
        
        Attacker uses obtained tokens to attempt IDOR exploitation.
        """
        self.print_banner("STAGE 3: Chain Attack - IDOR Exploitation", "=")

        if not successful_logins:
            logger.info("✅ No compromised accounts - chain attack prevented!")
            return

        logger.info("👤 Attacker perspective: Exploiting compromised accounts...")
        logger.info("   Attack type: IDOR (Insecure Direct Object Reference)")
        logger.info("   Goal: Access other users' data\n")

        for compromised in successful_logins:
            token = compromised["token"]
            username = compromised["username"]

            logger.info(f"🔍 Using compromised account: {username}")

            # Try to access other users' profiles
            target_user_ids = [1, 2, 3, 5, 10, 15, 20]

            accessed_profiles = 0
            for user_id in target_user_ids:
                try:
                    response = await self.client.get(
                        f"{self.user_service_url}/profile/{user_id}",
                        headers={"Authorization": f"Bearer {token}"},
                    )

                    if response.status_code == 200:
                        accessed_profiles += 1
                        logger.debug(f"   ✓ Accessed profile {user_id}")
                    await asyncio.sleep(0.2)

                except Exception as e:
                    logger.debug(f"   ✗ Failed to access profile {user_id}")

            if accessed_profiles > 0:
                logger.warning(
                    f"   ⚠️  Attacker accessed {accessed_profiles} unauthorized profiles!"
                )
            else:
                logger.info(f"   ✅ IDOR exploitation blocked!")

        logger.info("\n📊 Chain Attack Results:")
        logger.info("   Impact: Potential data exfiltration from multiple users")
        logger.info("   Root cause: Initial credential leak")

    async def stage_4_persistence_token_replay(self, successful_logins: List[Dict]):
        """
        Stage 4: Attacker attempts to maintain persistence.
        
        Uses captured tokens repeatedly to maintain access.
        """
        self.print_banner("STAGE 4: Persistence - Token Replay", "=")

        if not successful_logins:
            logger.info("✅ No compromised tokens - persistence attack prevented!")
            return

        logger.info("👤 Attacker perspective: Maintaining persistence...")
        logger.info("   Attack type: Token Replay")
        logger.info("   Goal: Long-term unauthorized access\n")

        for compromised in successful_logins:
            token = compromised["token"]
            username = compromised["username"]

            logger.info(f"🔄 Attempting token replay for: {username}")

            # Try to use token multiple times
            replay_attempts = 10
            successful_replays = 0

            for i in range(replay_attempts):
                try:
                    response = await self.client.post(
                        f"{self.login_api_url}/refresh",
                        headers={"Authorization": f"Bearer {token}"},
                    )

                    if response.status_code == 200:
                        successful_replays += 1
                    await asyncio.sleep(0.3)

                except Exception:
                    pass

            if successful_replays > 0:
                logger.warning(
                    f"   ⚠️  {successful_replays}/{replay_attempts} token replays succeeded!"
                )
            else:
                logger.info(f"   ✅ All token replays blocked!")

        logger.info("\n📊 Persistence Attack Results:")
        logger.info("   Impact: Sustained unauthorized access over time")
        logger.info("   Defense: Token revocation + IP banning + MFA")

    async def stage_5_incident_analysis(self):
        """
        Stage 5: Analyze incident response effectiveness.
        """
        self.print_banner("STAGE 5: Incident Response Analysis", "=")

        logger.info("📊 Analyzing incident response effectiveness...\n")

        # Get incident bot stats
        try:
            response = await self.client.get(f"{self.incident_bot_url}/incidents?limit=10")
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ Recent incidents handled: {data.get('count', 0)}")

                if data["count"] > 0:
                    latest = data["executions"][0]
                    logger.info(f"\n📋 Latest Incident:")
                    logger.info(f"   Runbook: {latest['runbook_name']}")
                    logger.info(f"   Status: {latest['status']}")
                    logger.info(f"   Actions executed: {latest['actions_executed']}")
                    logger.info(f"   Actions failed: {latest['actions_failed']}")

            # Get metrics
            response = await self.client.get(f"{self.incident_bot_url}/metrics")
            if response.status_code == 200:
                metrics = response.text
                logger.info(f"\n📈 System Metrics:")
                # Parse key metrics (simple grep-like)
                for line in metrics.split("\n"):
                    if "incident_bot_incidents_total" in line and not line.startswith("#"):
                        logger.info(f"   {line}")

        except Exception as e:
            logger.error(f"Error fetching analysis: {e}")

        logger.info("\n💡 Key Takeaways:")
        logger.info("   1. Credential leaks require IMMEDIATE response")
        logger.info("   2. Leaked credentials enable chain attacks (IDOR, token replay, etc.)")
        logger.info("   3. Automated incident response reduces reaction time from hours to seconds")
        logger.info("   4. Multiple defense layers are critical (IP ban + session revocation + MFA)")
        logger.info("   5. Monitoring and alerting are essential for detecting breaches early")

    async def run_full_demo(self):
        """Execute complete demonstration."""
        self.print_banner("🎭 CREDENTIAL LEAK + CHAIN ATTACK DEMONSTRATION 🎭", "#")

        logger.info("This demonstration shows:")
        logger.info("  1. Detection of credential leak")
        logger.info("  2. Automated incident response")
        logger.info("  3. Chain attacks following credential compromise")
        logger.info("  4. Importance of rapid incident response\n")

        input("Press ENTER to start the demonstration...")

        # Stage 1: Detect leak and trigger incident response
        await self.stage_1_simulate_leak_detection()

        input("\nPress ENTER to continue to attacker exploitation...")

        # Stage 2: Attacker uses leaked credentials
        successful_logins = await self.stage_2_attacker_exploitation()

        if successful_logins:
            input("\nPress ENTER to continue to chain attacks...")

            # Stage 3: IDOR exploitation
            await self.stage_3_chain_attack_idor(successful_logins)

            input("\nPress ENTER to continue to persistence attack...")

            # Stage 4: Token replay for persistence
            await self.stage_4_persistence_token_replay(successful_logins)

        input("\nPress ENTER to see incident analysis...")

        # Stage 5: Analyze response
        await self.stage_5_incident_analysis()

        self.print_banner("🎬 DEMONSTRATION COMPLETE 🎬", "#")

    async def close(self):
        """Cleanup."""
        await self.client.aclose()


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Demonstrate credential leak + chain attack scenario"
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
        "--incident-bot",
        default="http://localhost:5002",
        help="Incident Bot URL",
    )

    args = parser.parse_args()

    demo = CredentialLeakDemo(
        login_api_url=args.login_api,
        user_service_url=args.user_service,
        incident_bot_url=args.incident_bot,
    )

    try:
        await demo.run_full_demo()
    except KeyboardInterrupt:
        logger.info("\n\n⚠️  Demo interrupted by user")
    except Exception as e:
        logger.error(f"❌ Demo failed: {e}", exc_info=True)
        return 1
    finally:
        await demo.close()

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

