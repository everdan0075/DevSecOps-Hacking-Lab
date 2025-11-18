#!/usr/bin/env python3
"""
Service Fingerprinting Module
Advanced service discovery and technology detection.

REAL-WORLD TECHNIQUES:
- Server header analysis
- Framework detection (FastAPI, Flask, Express, Django)
- Version identification
- Technology stack detection
- Known vulnerability matching
- Response timing analysis
"""

import re
import hashlib
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
import time


@dataclass
class ServiceFingerprint:
    """Complete service fingerprint"""
    url: str
    server_header: Optional[str] = None
    framework: Optional[str] = None
    framework_version: Optional[str] = None
    technologies: List[str] = field(default_factory=list)
    headers: Dict[str, str] = field(default_factory=dict)
    response_time_ms: float = 0.0
    known_vulnerabilities: List[Dict] = field(default_factory=list)
    confidence: float = 0.0  # 0.0 - 1.0


class ServiceFingerprinter:
    """
    Advanced service fingerprinting.

    Real pentesters identify:
    1. Web framework (FastAPI, Flask, Express, Django)
    2. Version numbers
    3. Technology stack (Python, Node.js, Ruby)
    4. Known CVEs for detected versions
    5. Default configurations
    """

    def __init__(self):
        self.stats = {
            "services_fingerprinted": 0,
            "frameworks_detected": 0,
            "vulnerabilities_found": 0,
        }

    def fingerprint_service(
        self,
        url: str,
        response_headers: Dict[str, str],
        response_body: str,
        response_time: float
    ) -> ServiceFingerprint:
        """
        Comprehensive service fingerprinting.

        Args:
            url: Service URL
            response_headers: HTTP response headers
            response_body: Response body content
            response_time: Response time in seconds

        Returns:
            ServiceFingerprint with detection results
        """
        self.stats["services_fingerprinted"] += 1

        fingerprint = ServiceFingerprint(
            url=url,
            headers=response_headers,
            response_time_ms=response_time * 1000
        )

        # 1. Server header analysis
        fingerprint.server_header = response_headers.get("server", response_headers.get("Server"))

        # 2. Framework detection
        framework_info = self._detect_framework(response_headers, response_body)
        if framework_info:
            fingerprint.framework = framework_info["name"]
            fingerprint.framework_version = framework_info.get("version")
            fingerprint.confidence = framework_info.get("confidence", 0.0)
            self.stats["frameworks_detected"] += 1

        # 3. Technology stack detection
        fingerprint.technologies = self._detect_technologies(response_headers, response_body)

        # 4. Known vulnerability matching
        if fingerprint.framework and fingerprint.framework_version:
            fingerprint.known_vulnerabilities = self._check_known_vulnerabilities(
                fingerprint.framework,
                fingerprint.framework_version
            )
            self.stats["vulnerabilities_found"] += len(fingerprint.known_vulnerabilities)

        return fingerprint

    def _detect_framework(
        self,
        headers: Dict[str, str],
        body: str
    ) -> Optional[Dict]:
        """
        Detect web framework from headers and response body.

        Returns:
            Dict with name, version, confidence
        """
        # FastAPI detection
        server = headers.get("server", headers.get("Server", "")).lower()
        if "uvicorn" in server:
            # Extract version from "uvicorn/0.23.2"
            version_match = re.search(r'uvicorn/([\d.]+)', server)
            return {
                "name": "FastAPI",
                "version": version_match.group(1) if version_match else None,
                "confidence": 0.95,
                "details": "Detected via uvicorn server header"
            }

        # Flask detection
        if "werkzeug" in server:
            version_match = re.search(r'werkzeug/([\d.]+)', server)
            return {
                "name": "Flask",
                "version": version_match.group(1) if version_match else None,
                "confidence": 0.90,
                "details": "Detected via werkzeug server header"
            }

        # Django detection
        if "x-frame-options" in headers and "SAMEORIGIN" in headers.get("x-frame-options", ""):
            # Django's default security headers
            return {
                "name": "Django",
                "version": None,
                "confidence": 0.70,
                "details": "Detected via X-Frame-Options header pattern"
            }

        # Express.js detection
        if "x-powered-by" in headers:
            powered_by = headers["x-powered-by"]
            if "Express" in powered_by:
                return {
                    "name": "Express",
                    "version": None,
                    "confidence": 0.95,
                    "details": "Detected via X-Powered-By header"
                }

        # Check body for framework signatures
        if "fastapi" in body.lower():
            return {
                "name": "FastAPI",
                "version": None,
                "confidence": 0.60,
                "details": "Detected via body content"
            }

        return None

    def _detect_technologies(
        self,
        headers: Dict[str, str],
        body: str
    ) -> List[str]:
        """
        Detect technology stack components.

        Returns:
            List of detected technologies
        """
        technologies = []

        # Server/runtime detection
        server = headers.get("server", headers.get("Server", "")).lower()

        if "python" in server or "uvicorn" in server or "gunicorn" in server:
            technologies.append("Python")
        if "node" in server or "express" in server:
            technologies.append("Node.js")
        if "nginx" in server:
            technologies.append("Nginx")
        if "apache" in server:
            technologies.append("Apache")
        if "traefik" in server:
            technologies.append("Traefik")

        # Database hints (from error messages, headers)
        if "postgres" in body.lower():
            technologies.append("PostgreSQL")
        if "mysql" in body.lower():
            technologies.append("MySQL")
        if "mongodb" in body.lower():
            technologies.append("MongoDB")
        if "redis" in body.lower():
            technologies.append("Redis")

        # Framework-specific
        if "prometheus" in body.lower():
            technologies.append("Prometheus")
        if "openapi" in body.lower() or "swagger" in body.lower():
            technologies.append("OpenAPI/Swagger")

        # Security headers indicate security tools
        if "content-security-policy" in headers:
            technologies.append("CSP")
        if "strict-transport-security" in headers:
            technologies.append("HSTS")

        return list(set(technologies))  # Remove duplicates

    def _check_known_vulnerabilities(
        self,
        framework: str,
        version: Optional[str]
    ) -> List[Dict]:
        """
        Check for known vulnerabilities.

        In production: Query CVE databases, NVD, etc.
        Here: Use predefined vulnerability database

        Returns:
            List of vulnerability dicts
        """
        if not version:
            return []

        # Simulated CVE database (in real attack: query NVD, Vulners, etc.)
        known_vulns = {
            "FastAPI": {
                "0.65.0": [
                    {
                        "cve": "CVE-2021-32677",
                        "severity": "Medium",
                        "description": "Open redirect vulnerability in FastAPI <0.65.2",
                        "affected_versions": "<0.65.2",
                        "remediation": "Upgrade to FastAPI >=0.65.2"
                    }
                ],
                "0.70.0": [
                    {
                        "cve": "CVE-2023-XXXX",
                        "severity": "High",
                        "description": "Sample: Path traversal in static file serving",
                        "affected_versions": "<0.70.1",
                        "remediation": "Upgrade to latest version"
                    }
                ]
            },
            "Flask": {
                "2.0.0": [
                    {
                        "cve": "CVE-2023-30861",
                        "severity": "High",
                        "description": "Cookie parsing vulnerability",
                        "affected_versions": "<2.2.5",
                        "remediation": "Upgrade to Flask >=2.2.5"
                    }
                ]
            }
        }

        vulnerabilities = []

        if framework in known_vulns:
            # Check if version matches any known vulnerable versions
            for vuln_version, vulns in known_vulns[framework].items():
                if self._version_matches(version, vuln_version):
                    vulnerabilities.extend(vulns)

        return vulnerabilities

    def _version_matches(self, detected: str, vulnerable: str) -> bool:
        """
        Simple version matching.

        Real implementation would use semantic versioning comparison.
        """
        # Simplified: exact match or prefix match
        return detected.startswith(vulnerable) or detected == vulnerable

    def print_fingerprint(self, fingerprint: ServiceFingerprint):
        """Print formatted fingerprint report"""
        print(f"\n[*] Service Fingerprint: {fingerprint.url}")
        print(f"    Server: {fingerprint.server_header or 'Not disclosed'}")

        if fingerprint.framework:
            version_str = f" {fingerprint.framework_version}" if fingerprint.framework_version else ""
            print(f"    Framework: {fingerprint.framework}{version_str} ({fingerprint.confidence:.0%} confidence)")

        if fingerprint.technologies:
            print(f"    Technologies: {', '.join(fingerprint.technologies)}")

        print(f"    Response Time: {fingerprint.response_time_ms:.1f}ms")

        if fingerprint.known_vulnerabilities:
            print(f"\n    [!] Known Vulnerabilities:")
            for vuln in fingerprint.known_vulnerabilities:
                print(f"        • {vuln['cve']} ({vuln['severity']})")
                print(f"          {vuln['description']}")
                print(f"          Remediation: {vuln['remediation']}")

    def generate_report(self, fingerprints: List[ServiceFingerprint]) -> Dict:
        """Generate comprehensive fingerprinting report"""
        report = {
            "total_services": len(fingerprints),
            "frameworks_detected": {},
            "technologies": {},
            "vulnerabilities": [],
            "statistics": self.stats,
        }

        for fp in fingerprints:
            # Count frameworks
            if fp.framework:
                key = f"{fp.framework} {fp.framework_version or 'unknown'}"
                report["frameworks_detected"][key] = report["frameworks_detected"].get(key, 0) + 1

            # Count technologies
            for tech in fp.technologies:
                report["technologies"][tech] = report["technologies"].get(tech, 0) + 1

            # Collect vulnerabilities
            for vuln in fp.known_vulnerabilities:
                report["vulnerabilities"].append({
                    "service": fp.url,
                    "framework": fp.framework,
                    "version": fp.framework_version,
                    **vuln
                })

        return report


class ServiceVersionDetector:
    """
    Advanced version detection techniques.

    When server header doesn't reveal version:
    - Error message analysis
    - Default page fingerprinting
    - API endpoint behavior
    - Response timing patterns
    """

    def detect_version_from_errors(self, error_response: str) -> Optional[str]:
        """
        Extract version from error messages.

        Many frameworks leak version in error pages.
        """
        # FastAPI/Starlette error pattern
        version_match = re.search(r'Starlette/([\d.]+)', error_response)
        if version_match:
            return version_match.group(1)

        # Python version from tracebacks
        python_match = re.search(r'Python ([\d.]+)', error_response)
        if python_match:
            return python_match.group(1)

        # Generic version pattern
        version_match = re.search(r'version[:\s]+([\d.]+)', error_response, re.IGNORECASE)
        if version_match:
            return version_match.group(1)

        return None

    def detect_version_from_timing(
        self,
        response_times: List[float]
    ) -> Optional[str]:
        """
        Version detection via response timing patterns.

        Different versions may have different performance characteristics.
        """
        if not response_times or len(response_times) < 3:
            return None

        avg_time = sum(response_times) / len(response_times)

        # Statistical analysis (simplified)
        # Real implementation would have baseline timings for known versions
        if avg_time < 0.010:  # <10ms
            return "Likely recent version (optimized)"
        elif avg_time > 0.100:  # >100ms
            return "Likely older version or loaded system"

        return None


if __name__ == "__main__":
    # Demo: Service fingerprinting

    print("="*70)
    print("SERVICE FINGERPRINTING - DEMONSTRATION")
    print("="*70)

    fingerprinter = ServiceFingerprinter()

    # Example 1: FastAPI service
    print("\n[*] Example 1: FastAPI Service")
    sample_headers = {
        "server": "uvicorn/0.23.2",
        "content-type": "application/json",
        "content-length": "42"
    }
    sample_body = '{"message": "FastAPI service"}'

    fp1 = fingerprinter.fingerprint_service(
        url="http://localhost:8000",
        response_headers=sample_headers,
        response_body=sample_body,
        response_time=0.015
    )
    fingerprinter.print_fingerprint(fp1)

    # Example 2: Service with vulnerabilities
    print("\n[*] Example 2: Service with Known Vulnerabilities")
    vuln_headers = {
        "server": "uvicorn/0.65.0",  # Old version with CVEs
        "x-frame-options": "SAMEORIGIN"
    }
    vuln_body = '{"status": "ok"}'

    fp2 = fingerprinter.fingerprint_service(
        url="http://localhost:8002",
        response_headers=vuln_headers,
        response_body=vuln_body,
        response_time=0.025
    )
    fingerprinter.print_fingerprint(fp2)

    # Example 3: Generate report
    print("\n[*] Example 3: Fingerprinting Report")
    report = fingerprinter.generate_report([fp1, fp2])

    print(f"\n    Total services fingerprinted: {report['total_services']}")
    print(f"    Frameworks detected:")
    for framework, count in report['frameworks_detected'].items():
        print(f"      • {framework}: {count}")

    print(f"\n    Technologies:")
    for tech, count in report['technologies'].items():
        print(f"      • {tech}: {count}")

    if report['vulnerabilities']:
        print(f"\n    [!] Vulnerabilities found: {len(report['vulnerabilities'])}")
        for vuln in report['vulnerabilities']:
            print(f"        • {vuln['cve']} in {vuln['service']}")

    print("\n" + "="*70)
    print("KEY INSIGHTS:")
    print("  • Server headers reveal framework and version")
    print("  • Version detection enables CVE matching")
    print("  • Response timing can fingerprint technology stack")
    print("  • Error messages leak internal information")
    print("="*70)
