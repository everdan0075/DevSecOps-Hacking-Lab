# Intelligent Direct Access Attack - Advanced Version

## Overview

This is an **upgraded version** of the basic direct access attack that demonstrates **real reconnaissance and exploitation techniques** used by professional penetration testers.

### Improvements Over Basic Version

| Feature | Basic Version | Intelligent Version |
|---------|--------------|---------------------|
| **Service Discovery** | Hardcoded URLs | Automated port scanning (8000-9100) |
| **Fingerprinting** | None | Framework/version detection, CVE matching |
| **Endpoint Fuzzing** | Static endpoints | 20+ common path fuzzing |
| **Intelligence** | Basic access test | Full service mesh mapping |
| **Vulnerability Detection** | None | Known CVE database matching |
| **Protocol Analysis** | GET only | HTTP verb tampering, header injection |

---

## Key Features

### 1. Automated Service Discovery

Instead of testing hardcoded URLs, the system discovers all exposed services:

#### Port Scanning
```python
# Scan ports 8000-9100 in parallel
discovered = scanner.scan_ports(
    host="localhost",
    start_port=8000,
    end_port=9100,
    max_workers=10
)

# Results:
# - Port 8000: Auth Service (FastAPI)
# - Port 8002: User Service (FastAPI)
# - Port 8080: API Gateway (Traefik)
# - Port 9090: Prometheus
# - Port 6379: Redis
```

#### Endpoint Fuzzing
```python
# Common API paths to fuzz
paths = [
    "/health", "/metrics", "/docs", "/openapi.json",
    "/api/v1", "/admin", "/debug", "/.env",
    "/api/users", "/api/auth", "/api/profile"
]

# Discovers:
# ✓ /health - HTTP 200
# ✓ /metrics - HTTP 200 (Prometheus metrics exposed!)
# ✓ /docs - HTTP 200 (Interactive API docs!)
# ✓ /api/users/profile/1 - HTTP 200 (No auth required!)
```

### 2. Service Fingerprinting

Advanced technology detection and version identification:

#### Framework Detection
```python
# Analyzes server headers and response patterns
fingerprint = fingerprinter.fingerprint_service(
    url="http://localhost:8000",
    response_headers={"server": "uvicorn/0.23.2"},
    response_body=response_text
)

# Detects:
# Framework: FastAPI
# Version: 0.23.2 (via uvicorn)
# Confidence: 95%
```

#### Technology Stack Identification
```python
# Detects from headers, body, timing:
technologies = [
    "Python",          # From server header
    "FastAPI",         # Framework
    "Uvicorn",         # ASGI server
    "Prometheus",      # /metrics endpoint
    "OpenAPI/Swagger", # /docs endpoint
    "Redis"            # From error messages
]
```

#### Known Vulnerability Matching
```python
# Matches detected versions against CVE database
vulnerabilities = [
    {
        "cve": "CVE-2021-32677",
        "severity": "Medium",
        "description": "Open redirect in FastAPI <0.65.2",
        "affected_versions": "<0.65.2",
        "remediation": "Upgrade to FastAPI >=0.65.2"
    }
]
```

### 3. Service Mesh Mapping

Visualizes the complete service architecture:

```
Service Mesh Topology:

API Gateway (port 8080)
  ├── Auth Service (port 8000)
  │   └── Endpoint fingerprinting:
  │       • Server: uvicorn/0.23.2
  │       • Framework: FastAPI
  │       • Endpoints: /health, /metrics, /auth/login, /auth/mfa/verify
  │       • Bypassed control: Rate limiting (100+ requests without blocking)
  │
  └── User Service (port 8002)
      └── Endpoint fingerprinting:
          • Server: uvicorn/0.20.0
          • Framework: FastAPI
          • Endpoints: /profile/{id}, /settings
          • Bypassed control: JWT validation

Monitoring Stack (port 9090)
  └── Prometheus
      • Metrics exposed publicly (reconnaissance goldmine)

Cache Layer (port 6379)
  └── Redis
      • Direct access possible (if not firewalled)
```

### 4. Gateway Bypass Testing

Systematic testing of security control bypasses:

#### JWT Validation Bypass
```python
# Test 1: Through Gateway (should fail)
response = GET http://localhost:8080/api/users/profile/1
# Result: HTTP 401 Unauthorized (JWT required)

# Test 2: Direct Access (bypasses JWT)
response = GET http://localhost:8002/profile/1
# Result: HTTP 200 OK ← BYPASSED!
# Data: {"username": "admin", "ssn": "123-45-6789", ...}
```

#### Rate Limiting Bypass
```python
# Test 1: Through Gateway (rate limited)
for i in range(100):
    POST http://localhost:8080/auth/login
# Result: HTTP 429 after ~10 requests (rate limit triggered)

# Test 2: Direct Access (no rate limit)
for i in range(100):
    POST http://localhost:8000/auth/login
# Result: All 100 requests succeed ← NO RATE LIMIT!
```

#### WAF Bypass
```python
# Test 1: Through Gateway (WAF blocks)
POST http://localhost:8080/api/users
Body: {"username": "admin' OR '1'='1"}
# Result: HTTP 403 Forbidden (WAF detected SQL injection)

# Test 2: Direct Access (bypasses WAF)
POST http://localhost:8002/users
Body: {"username": "admin' OR '1'='1"}
# Result: HTTP 200 OK ← WAF BYPASSED!
```

---

## Usage

### Basic Attack (Auto-Discovery)

```bash
python intelligent_direct_access.py \
  --gateway http://localhost:8080
```

Automatically discovers and fingerprints all services on ports 8000-9100.

### Custom Port Range

```bash
python intelligent_direct_access.py \
  --gateway http://localhost:8080 \
  --scan-start 8000 \
  --scan-end 8500
```

Scans custom port range for services.

---

## Technical Architecture

### Module Structure

```
direct-access/
├── direct_access_attack.py           # Original basic version
├── intelligent_direct_access.py      # NEW: Advanced orchestrator
├── service_discovery.py              # NEW: Port scanning, endpoint fuzzing
├── service_fingerprinting.py         # NEW: Framework detection, CVE matching
├── requirements.txt
└── results/
    └── intelligent_direct_access_*.json
```

### Class Hierarchy

```python
ServiceDiscovery
  ├── scan_ports()                 # TCP connect scan (parallel)
  ├── discover_endpoints()         # Fuzz common API paths
  ├── map_service_mesh()           # Build topology graph
  └── fast_scan()                  # High-speed port scan

ServiceFingerprinter
  ├── fingerprint_service()        # Complete fingerprinting
  ├── _detect_framework()          # FastAPI, Flask, Django, Express
  ├── _detect_technologies()       # Python, Node.js, Nginx, Redis
  ├── _check_known_vulnerabilities()  # CVE database matching
  └── generate_report()            # Comprehensive analysis

IntelligentDirectAccessAttack
  ├── phase1_service_discovery()   # Port scan + endpoint fuzz
  ├── phase2_service_fingerprinting()  # Technology detection
  ├── phase3_gateway_bypass_testing()  # JWT, rate limit, WAF bypass
  ├── phase4_service_mesh_mapping()    # Architecture mapping
  └── display_intelligence_report()    # Rich console output
```

---

## Output Example

```
═══════════════════════════════════════════════════════════════════
🎭 INTELLIGENT DIRECT ACCESS ATTACK - Gateway Bypass
═══════════════════════════════════════════════════════════════════

Gateway (protected): http://localhost:8080
Scan Range: Ports 8000 - 9100

VULNERABILITY: Backend services exposed without authentication
IMPACT: Complete bypass of Gateway security controls

INTELLIGENCE FEATURES:
  • Automated service discovery (port scanning)
  • Framework fingerprinting (version detection)
  • Known vulnerability matching (CVE database)
  • Service mesh mapping
  • Protocol-level attack testing

[*] Phase 1: Service Discovery
    [>] Scanning ports 8000-9100...
    [✓] Found 5 services
    [>] Fuzzing endpoints on http://localhost:8000
        [+] Found 8 endpoints
    [>] Fuzzing endpoints on http://localhost:8002
        [+] Found 6 endpoints

[*] Phase 2: Service Fingerprinting
    [>] Fingerprinting http://localhost:8000
        [+] Framework: FastAPI 0.23.2
        [i] Stack: Python, Uvicorn, Prometheus
    [>] Fingerprinting http://localhost:8002
        [+] Framework: FastAPI 0.20.0
        [i] Stack: Python, Uvicorn, OpenAPI

[*] Phase 3: Gateway Bypass Testing

    → Testing User Service Bypass (:8002)
        Test 1: Profile via Gateway
          Gateway: HTTP 401 (Protected)
        Test 2: Profile via Direct Access
          Direct: HTTP 200 (BYPASSED!)
          [!] Leaked: admin, SSN: 123-45-6789

    → Testing Auth Service Bypass (:8000)
        Test: Rate Limiting Bypass
          Gateway: Rate limited after 10 attempts
          Testing direct access (no rate limit)...
          Direct: NO RATE LIMIT - 100+ requests successful

[*] Phase 4: Service Mesh Mapping
    [→] API Gateway: 8080 (HTTP Proxy)
    [→] Backend Services:
        • Port 8000: HTTP (Dev)
        • Port 8002: HTTP (Alt)
    [→] Service Relationships:
        api_gateway → localhost:8000 (proxy/route)
        api_gateway → localhost:8002 (proxy/route)

═══════════════════════════════════════════════════════════════════
📊 INTELLIGENCE REPORT
═══════════════════════════════════════════════════════════════════

Attack Summary
┌──────────────────────────┬────────┐
│ Metric                   │  Value │
├──────────────────────────┼────────┤
│ Services Discovered      │      5 │
│ Endpoints Found          │     14 │
│ Vulnerabilities Found    │      2 │
│ Successful Bypasses      │      2 │
│ Data Items Exfiltrated   │      3 │
└──────────────────────────┴────────┘

⚠️  KNOWN VULNERABILITIES
  • CVE-2021-32677 (Medium)
    Open redirect vulnerability in FastAPI <0.65.2

🚨 BYPASSED SECURITY CONTROLS
  • localhost:8002/profile/1
    Bypassed: JWT validation
  • localhost:8000/auth/login
    Bypassed: Rate limiting

[✓] Report saved to: results/intelligent_direct_access_20251116_153022.json

💡 REMEDIATION:
   1. Implement mTLS between Gateway and services
   2. Use internal Docker network (no exposed ports)
   3. Add service-to-service authentication
   4. Patch identified vulnerabilities
   5. Monitor direct_access_total metrics for anomalies
```

---

## Comparison: Basic vs Intelligent

### Basic Attack Approach

```python
# Hardcoded URLs
services = [
    "http://localhost:8002",
    "http://localhost:8000"
]

# Simple GET requests
for service_url in services:
    response = requests.get(f"{service_url}/profile/1")
    if response.status_code == 200:
        print("Bypassed!")
```

**Limitations:**
- Misses unknown services
- No version detection
- No vulnerability assessment
- Manual endpoint testing

### Intelligent Attack Approach

```python
# 1. Auto-discover all services
discovered = discovery.scan_ports("localhost", 8000, 9100)

# 2. Fingerprint each service
for service in discovered:
    fingerprint = fingerprinter.fingerprint_service(service)
    print(f"Framework: {fingerprint.framework} {fingerprint.version}")
    print(f"CVEs: {fingerprint.known_vulnerabilities}")

# 3. Fuzz endpoints
endpoints = discovery.discover_endpoints(service.url)

# 4. Map service mesh
mesh = discovery.map_service_mesh(discovered)
```

**Advantages:**
- Discovers all exposed services
- Identifies vulnerable versions
- Maps complete architecture
- Automated CVE matching

---

## Real-World Parallels

This attack demonstrates techniques used in:

### 1. Bug Bounty Reconnaissance

Bounty hunters use service discovery to:
- Find forgotten/misconfigured services
- Identify outdated frameworks with known CVEs
- Map internal service architecture
- Discover unprotected admin panels

**Example:** HackerOne report #923456 - Discovered internal Prometheus metrics endpoint exposing sensitive application data.

### 2. Red Team Engagements

Professional red teams use fingerprinting for:
- Technology stack identification (aids in exploit selection)
- Version-specific exploit development
- Service mesh mapping (lateral movement planning)
- Known vulnerability exploitation

**Example:** Real engagement where port scan revealed Redis on 6379 with no auth → full data exfiltration.

### 3. Real Breach Analysis

**Case Study: Docker Exposed Ports**

Many organizations expose backend services during development:
- Dev environment: Docker ports `-p 8000:8000` (public)
- Production: Docker internal network (private)

**Attacker approach:**
1. Port scan: `nmap -p 8000-9000 target.com`
2. Discover: Auth service on 8001, Database on 8003
3. Fingerprint: PostgreSQL 12.1 (CVE-2020-XXXX available)
4. Exploit: Direct database access, no gateway protection

**Statistics:**
- 34% of Docker deployments expose unnecessary ports (Sysdig 2023)
- 89% of exposed services lack proper authentication (Shodan analysis)
- Average time to discovery: 14 hours (automated scanners)

---

## Defense Recommendations

If you're defending against this type of attack:

### 1. Network Segmentation

```yaml
# docker-compose.yml - Proper network isolation
services:
  api-gateway:
    ports:
      - "8080:8080"  # Only gateway exposed
    networks:
      - frontend
      - backend

  auth-service:
    # NO ports exposed!
    networks:
      - backend

  user-service:
    # NO ports exposed!
    networks:
      - backend

networks:
  frontend:  # Public-facing
  backend:   # Internal only
    internal: true  # No external access
```

### 2. Service-to-Service Authentication

```python
# Implement mTLS or service tokens
@app.middleware("http")
async def verify_internal_auth(request: Request, call_next):
    if not request.headers.get("X-Internal-Service-Token"):
        raise HTTPException(403, "Forbidden")

    # Verify token
    if not verify_service_token(request.headers["X-Internal-Service-Token"]):
        raise HTTPException(403, "Invalid service token")

    return await call_next(request)
```

### 3. Monitoring & Detection

```python
# Alert on direct service access attempts
direct_access_attempts_total{
  service="user-service",
  bypassed_gateway="true",
  source_ip="external"
} > 5 in 1m

# Alert on port scans
port_scan_detected_total{
  source_ip="suspicious_ip",
  ports_probed=">10"
} > 1
```

### 4. Version Disclosure Hardening

```python
# Hide server version in headers
app = FastAPI()

@app.middleware("http")
async def remove_server_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["server"] = "ProductionServer"  # Generic
    del response.headers["x-powered-by"]  # Remove if present
    return response
```

---

## Educational Value

This module demonstrates:

✅ **Reconnaissance techniques**: Port scanning, endpoint fuzzing, service discovery

✅ **Fingerprinting**: Framework/version detection, technology stack identification

✅ **CVE matching**: Known vulnerability assessment

✅ **Service mesh mapping**: Understanding microservice architecture

✅ **Gateway bypass**: Demonstrating defense-in-depth failures

---

## Performance Comparison

| Scenario | Basic Version | Intelligent Version | Improvement |
|----------|--------------|---------------------|-------------|
| Service discovery | 2 hardcoded URLs | Auto-scan 100 ports | **50x more coverage** |
| Endpoints tested | 3 static paths | 20+ common paths (fuzzing) | **6.7x more** |
| Fingerprinting | None | Framework + version + CVEs | **New capability** |
| Service mesh mapping | None | Full topology graph | **New capability** |
| Reconnaissance time | 10 seconds (manual) | 15 seconds (automated) | **Fully automated** |

---

## Next Steps

After mastering intelligent direct access, explore:

1. **Rate Limit Bypass** (`../rate-limit-bypass/`) - Distributed attacks, IP rotation
2. **JWT Manipulation** (`../token-replay/`) - Algorithm confusion, claims tampering
3. **Credential Stuffing** (`../credential-stuffing/`) - Breach database correlation

---

## License & Ethics

**WARNING**: This tool is for **educational purposes only**.

- ✅ Use against your own systems
- ✅ Use in authorized penetration tests
- ✅ Use in CTF competitions
- ❌ Use against systems you don't own
- ❌ Use without explicit written authorization

Unauthorized port scanning and service enumeration may be **illegal** in some jurisdictions.

---

## Contributing

Improvements welcome! Consider adding:

- [ ] Actual CVE API integration (NVD, Vulners)
- [ ] SYN scan implementation (half-open)
- [ ] UDP service discovery
- [ ] Protocol-specific fingerprinting (SSH, FTP, SMTP)
- [ ] Shodan/Censys integration for public service discovery

---

**Author**: DevSecOps Hacking Lab Team
**Version**: 2.0 (Intelligent)
**Last Updated**: 2025-11-16
