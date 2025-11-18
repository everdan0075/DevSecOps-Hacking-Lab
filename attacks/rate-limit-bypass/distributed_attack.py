#!/usr/bin/env python3
"""
Distributed Attack Simulation
Simulates botnet/proxy-based rate limit evasion.

REAL-WORLD TECHNIQUES:
- IP rotation (proxy pools, Tor, VPNs)
- Request distribution across multiple sources
- Timing randomization per "IP"
- Coordinated attack patterns
"""

import asyncio
import random
import time
from typing import List, Dict, Optional
from dataclasses import dataclass
from collections import defaultdict


@dataclass
class ProxyNode:
    """Simulated proxy/bot node"""
    ip: str
    user_agent: str
    requests_sent: int = 0
    rate_limited: bool = False
    last_request_time: float = 0.0


class DistributedAttackSimulator:
    """
    Simulate distributed attack from multiple IPs.

    Real attackers use:
    - Botnets (compromised devices)
    - Residential proxy networks
    - VPN/Tor rotation
    - Cloud IPs (AWS, Azure, GCP)
    """

    def __init__(self, num_nodes: int = 10, rate_limit_per_ip: int = 60):
        self.num_nodes = num_nodes
        self.rate_limit_per_ip = rate_limit_per_ip
        self.nodes: List[ProxyNode] = []
        self.stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "rate_limited_requests": 0,
            "active_nodes": 0,
        }

        # Initialize proxy nodes
        self._initialize_nodes()

    def _initialize_nodes(self):
        """Create simulated proxy nodes"""
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            "Mozilla/5.0 (X11; Linux x86_64)",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6)",
            "Mozilla/5.0 (Android 13; Mobile)",
        ]

        for i in range(self.num_nodes):
            # Generate realistic IP
            ip = f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"

            node = ProxyNode(
                ip=ip,
                user_agent=random.choice(user_agents)
            )
            self.nodes.append(node)

        self.stats["active_nodes"] = len(self.nodes)

    def select_node(self) -> Optional[ProxyNode]:
        """
        Select next available node (round-robin or least-used).

        Returns:
            ProxyNode or None if all rate limited
        """
        # Filter non-rate-limited nodes
        available = [n for n in self.nodes if not n.rate_limited]

        if not available:
            return None

        # Select least-used node
        return min(available, key=lambda n: n.requests_sent)

    async def send_distributed_requests(
        self,
        total_requests: int,
        delay_between_requests: float = 0.1
    ) -> Dict:
        """
        Send requests distributed across nodes.

        Args:
            total_requests: Total number of requests to send
            delay_between_requests: Delay between requests (in seconds)

        Returns:
            Attack statistics
        """
        results = {
            "requests_sent": 0,
            "successful": 0,
            "rate_limited": 0,
            "node_stats": defaultdict(int)
        }

        for i in range(total_requests):
            # Select node
            node = self.select_node()

            if not node:
                # All nodes rate limited - wait and retry
                await asyncio.sleep(1.0)
                # Reset nodes (simulate rate limit window expiry)
                for n in self.nodes:
                    n.rate_limited = False
                    n.requests_sent = 0
                node = self.select_node()

            if node:
                # Simulate request
                success = await self._simulate_request(node)

                results["requests_sent"] += 1
                results["node_stats"][node.ip] += 1

                if success:
                    results["successful"] += 1
                    self.stats["successful_requests"] += 1
                else:
                    results["rate_limited"] += 1
                    self.stats["rate_limited_requests"] += 1

                # Small delay between requests
                await asyncio.sleep(delay_between_requests)

        self.stats["total_requests"] += results["requests_sent"]

        return results

    async def _simulate_request(self, node: ProxyNode) -> bool:
        """
        Simulate sending request from node.

        Returns:
            True if successful, False if rate limited
        """
        node.requests_sent += 1
        node.last_request_time = time.time()

        # Simulate rate limit (per-IP)
        if node.requests_sent >= self.rate_limit_per_ip:
            node.rate_limited = True
            return False

        # Simulate small chance of failure
        return random.random() > 0.05  # 95% success rate

    def calculate_amplification(self) -> Dict:
        """
        Calculate attack amplification vs single IP.

        Returns:
            Amplification statistics
        """
        single_ip_capacity = self.rate_limit_per_ip
        distributed_capacity = self.num_nodes * self.rate_limit_per_ip

        return {
            "single_ip_capacity": single_ip_capacity,
            "distributed_capacity": distributed_capacity,
            "amplification_factor": distributed_capacity / single_ip_capacity,
            "num_nodes": self.num_nodes,
            "effective_bypass": "Yes" if self.num_nodes > 1 else "No"
        }

    def print_stats(self):
        """Print attack statistics"""
        print("\n[*] Distributed Attack Statistics:")
        print(f"    Active nodes: {self.stats['active_nodes']}")
        print(f"    Total requests: {self.stats['total_requests']}")
        print(f"    Successful: {self.stats['successful_requests']}")
        print(f"    Rate limited: {self.stats['rate_limited_requests']}")

        amp = self.calculate_amplification()
        print(f"\n    Amplification: {amp['amplification_factor']:.1f}x")
        print(f"    Single IP capacity: {amp['single_ip_capacity']} req/min")
        print(f"    Distributed capacity: {amp['distributed_capacity']} req/min")


if __name__ == "__main__":
    # Demo
    print("="*70)
    print("DISTRIBUTED ATTACK SIMULATION")
    print("="*70)

    async def demo():
        # Simulate botnet with 10 nodes
        simulator = DistributedAttackSimulator(num_nodes=10, rate_limit_per_ip=60)

        print(f"\n[*] Initialized {simulator.num_nodes} proxy nodes")
        print(f"    Rate limit per IP: {simulator.rate_limit_per_ip} req/min")

        # Send 200 requests distributed
        print(f"\n[*] Sending 200 requests (distributed)...")
        results = await simulator.send_distributed_requests(200, delay_between_requests=0.01)

        print(f"\n[*] Results:")
        print(f"    Requests sent: {results['requests_sent']}")
        print(f"    Successful: {results['successful']}")
        print(f"    Rate limited: {results['rate_limited']}")

        # Show node distribution
        print(f"\n[*] Request distribution:")
        for ip, count in sorted(results['node_stats'].items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"        {ip}: {count} requests")

        simulator.print_stats()

        # Show amplification
        amp = simulator.calculate_amplification()
        print(f"\n[*] Attack Amplification:")
        print(f"    Single IP: Limited to {amp['single_ip_capacity']} req/min")
        print(f"    Distributed: {amp['distributed_capacity']} req/min ({amp['amplification_factor']:.0f}x amplification)")

    asyncio.run(demo())

    print("\n" + "="*70)
    print("KEY INSIGHTS:")
    print("  • Distributed attacks bypass per-IP rate limits")
    print("  • 10 nodes = 10x amplification")
    print("  • Real botnets use 1000+ nodes")
    print("  • Defense requires global rate limiting (not per-IP)")
    print("="*70)
