# DevSecOps Hacking Lab 🛡️⚔️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Docker](https://img.shields.io/badge/docker-required-blue.svg)](https://www.docker.com/)

> **Professional DevSecOps showcase demonstrating offensive and defensive security techniques in containerized microservices environments**

## 📋 Overview

DevSecOps Hacking Lab is an educational, ethical testing environment designed to simulate real-world attacks on microservices and demonstrate defense mechanisms. This project serves as a portfolio showcase for DevOps/DevSecOps professionals and security enthusiasts.

### ⚠️ Legal Disclaimer

**READ THIS FIRST**: This project is for educational purposes only. All attacks must be performed exclusively in controlled, local environments. See [DISCLAIMER.md](./DISCLAIMER.md) for full ethical usage guidelines.

## 🎯 Current Features

### Phase 2.1: Secure Authentication & MFA ✅

**Vulnerable Services**:
- **login-api**: JWT-based authentication with MFA
  - Multi-factor authentication (TOTP)
  - JWT access/refresh tokens
  - Token revocation & session management

**Attack Scenarios**:
- Brute-Force Attack
- MFA Bypass Attempts
- Token Replay

**Defenses**:
- Rate Limiting (Token Bucket)
- IP-based Blocking
- Redis-backed session storage

### Phase 2.2: API Gateway & Microservices ✅

**Architecture**:
- **API Gateway**: Central entry point with security controls (port 8080)
- **Auth Service**: JWT-based authentication (port 8000)
- **User Service**: User management with intentional vulnerabilities (port 8002)

### Phase 2.3: Incident Response Automation 🚀 NEWEST!

**Automated Security Response**:
- **Incident Bot**: Automated incident response system (port 5002)
- **Runbook Engine**: JSON-based playbooks for different attack scenarios
- **Action Handlers**: IP banning, notifications, report generation
- **Integration**: Prometheus → Alertmanager → Incident Bot → Actions

**Features**:
- ✅ Automated IP banning in Redis for detected attacks
- ✅ Instant notifications (console/Slack) for security incidents
- ✅ Automated incident report generation (JSON/Markdown)
- ✅ 8 prebuilt runbooks for common attack patterns
- ✅ Grafana dashboard for incident visualization
- ✅ Metrics tracking (incidents handled, actions executed, success rate)

**Incident Response Flow**:
1. **Detection**: Prometheus detects anomaly → fires alert
2. **Routing**: Alertmanager routes to incident-bot based on severity/category
3. **Matching**: Bot finds appropriate runbook (playbook)
4. **Execution**: Automated actions (IP ban, notify, report, remediate)
5. **Documentation**: Full incident timeline and reports generated

**Supported Scenarios**:
- 🔥 Brute Force Response (IP ban 1h + notify)
- 🔥 MFA Bypass Attempts (IP ban 2h + analysis)
- 🔥 Token Abuse Response (IP ban + token revocation guidance)
- 🔥 Gateway Bypass Detection (IP ban 24h + critical alert)
- 🔥 IDOR Exploitation (IP ban 12h + remediation steps)
- 🔥 SQL Injection Attack (IP ban 24h + full forensics)
- 🔥 Multiple IP Bans (Distributed attack analysis)
- 🔥 Credential Leak Chain (Advanced: leak detection + chain prevention)

**Security Features**:
- ✅ JWT verification middleware
- ✅ Rate limiting (60 req/min, burst 10)
- ✅ WAF rules (SQL injection, XSS, path traversal detection)
- ✅ Security headers (X-Frame-Options, CSP, etc.)
- ✅ Request size validation (max 10MB)
- ✅ Prometheus metrics & monitoring

**Intentional Vulnerabilities** (Educational):
- 🚨 **IDOR** (Insecure Direct Object Reference) - Access any user's profile
- 🚨 **Auth Bypass** - Settings endpoint without JWT validation
- 🚨 **Direct Service Access** - Backend services exposed on public ports
- 🚨 **Rate Limit Bypass** - Unlimited requests via direct access

**Attack Demonstrations**:
- `attacks/direct-access/` - Gateway bypass exploitation
- `attacks/idor-exploit/` - Unauthorized data access
- `attacks/rate-limit-bypass/` - Rate limiting evasion

**Certificate Infrastructure** (Ready for mTLS):
- Self-signed CA for service-to-service authentication
- Certificates for gateway, auth-service, user-service
- Implementation plan documented (`infrastructure/certs/MTLS_IMPLEMENTATION_PLAN.md`)

**Monitoring & Observability**:
- Grafana dashboards for attack visibility
- Metrics tracking IDOR attempts, direct access, rate limit violations
- Prometheus alert rules for security events

## 🏗️ Architecture

```
DevSecOps Hacking Lab
├── vulnerable-services/        # Intentionally vulnerable microservices
│   ├── api-gateway/           # API Gateway with security controls (Phase 2.2)
│   ├── login-api/             # Authentication service with JWT & MFA (Phase 2.1)
│   └── user-service/          # User management with IDOR vulnerability (Phase 2.2)
├── attacks/                   # Ethical attack demonstrations
│   ├── brute-force/          # Password attacks (Phase 2.1)
│   ├── credential-stuffing/  # Credential reuse attacks (Phase 2.1)
│   ├── mfa-bruteforce/       # MFA bypass attempts (Phase 2.1)
│   ├── token-replay/         # JWT token replay (Phase 2.1)
│   ├── direct-access/        # Gateway bypass (Phase 2.2) ✨ NEW
│   ├── idor-exploit/         # IDOR exploitation (Phase 2.2) ✨ NEW
│   └── rate-limit-bypass/    # Rate limiting evasion (Phase 2.2) ✨ NEW
├── monitoring/                # Observability & alerting
│   ├── prometheus/           # Metrics collection & alert rules
│   ├── grafana/              # Visualization dashboards
│   ├── alertmanager/         # Alert routing
│   ├── incident-bot/         # Automated incident response (Phase 2.3) 🚀 NEW
│   └── tests/                # Monitoring smoke tests
├── infrastructure/            # Infrastructure as Code
│   ├── certs/                # mTLS certificates (Phase 2.2) ✨ NEW
│   └── README.md             # Infrastructure documentation
├── docs/                      # Architecture documentation
│   ├── auth/                 # Authentication system docs
│   ├── gateway/              # API Gateway architecture (Phase 2.2)
│   ├── incident-response/    # Incident automation docs (Phase 2.3) 🚀 NEW
│   └── monitoring/           # Observability documentation
├── defenses/                  # Security hardening examples
├── reverse-proxy/             # Traefik configuration
└── docker-compose.yml         # Full stack orchestration
```

### Request Flow Diagram

```
Client
  │
  ↓
API Gateway (:8080)
  │
  ├─ Security Layer
  │   ├─ Rate Limiting (60 req/min)
  │   ├─ WAF (SQL injection, XSS detection)
  │   ├─ JWT Verification
  │   └─ Security Headers
  │
  ├─→ Auth Service (:8000)
  │    └─ Login, MFA, Token Management
  │
  └─→ User Service (:8002)
       └─ Profile, Settings (VULNERABLE!)
```

**See detailed architecture**: [`docs/gateway/README.md`](docs/gateway/README.md)

## 🚀 Quick Start

### Prerequisites

- Docker 24.0+
- Docker Compose 2.0+
- Python 3.11+ (for local development)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/DevSecOps-Hacking-Lab.git
cd DevSecOps-Hacking-Lab
```

2. **Start the environment**
```bash
docker-compose up -d
```

3. **Verify services are running**
```bash
docker-compose ps
```

Expected output:
```
NAME                COMMAND                  SERVICE       STATUS
login-api           "uvicorn app.main:ap…"   login-api     Up
prometheus          "/bin/prometheus --c…"   prometheus    Up
```

### Testing the Environment

#### Manual Login Test (Password Step)
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

The response includes a `challenge_id`. The one-time MFA code is logged for demo purposes:

```bash
docker-compose logs login-api | grep mfa_code
```

#### Complete MFA Verification
```bash
curl -X POST http://localhost:8000/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{"challenge_id":"<value from previous step>","code":"<mfa-code>"}'
```

Response includes JWT tokens:
```json
{
  "success": true,
  "access_token": "eyJhbGci...",
  "refresh_token": "AbCd1234...",
  "expires_in": 300,
  "refresh_expires_in": 3600
}
```

#### Refresh Access Token
```bash
curl -X POST http://localhost:8000/auth/token/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh_token from previous step>"}'
```

#### Logout (Revoke Token)
```bash
# Revoke single session
curl -X POST http://localhost:8000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh_token>","all_sessions":false}'

# Revoke all sessions for user
curl -X POST http://localhost:8000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh_token>","all_sessions":true}'
```

#### Secure Endpoint (HTTPS via reverse proxy)
```bash
# macOS / Linux (curl)
curl -k https://localhost:8443/health

# Windows PowerShell
curl.exe -k https://localhost:8443/health
```
> The `-k` flag skips certificate verification because Traefik uses a self-signed development cert. Import the certificate into your trust store for production-like testing.
>
> HTTP on port 8081 automatically redirects to HTTPS. Use it only for debugging (`curl -I http://localhost:8081/health`).

#### Run Attack Scripts (Ethical Testing)

**Phase 2.1 Attacks**:
```bash
# Brute-force attack
cd attacks/brute-force
python brute_force.py --target http://localhost:8000/auth/login --username admin
```

**Phase 2.2 Attacks** ✨ NEW:
```bash
# IDOR exploitation
cd attacks/idor-exploit
pip install -r requirements.txt
python idor_attack.py

# Direct service access (gateway bypass)
cd attacks/direct-access
python direct_access_attack.py

# Rate limit bypass
cd attacks/rate-limit-bypass
python rate_limit_bypass.py
```

## 🧪 Attack Scenarios

### Scenario 1: Brute-Force Attack

**Objective**: Demonstrate vulnerability to password guessing attacks

**Usage**:
```bash
cd attacks/brute-force
python brute_force.py \
  --target http://localhost:8000/auth/login \
  --username admin
```

**Expected Outcome**: 
- Initial requests succeed
- Rate limiter blocks excessive requests (429 status)
- IP gets temporarily banned after threshold

### Scenario 2: Credential Stuffing

**Objective**: Test leaked credential pairs from data breaches

**Usage**:
```bash
cd attacks/credential-stuffing
python credential_stuffing.py \
  --target http://localhost:8000/auth/login \
  --credentials wordlists/leaked-credentials.txt
```

**Expected Outcome**:
- Valid credentials identified
- MFA required for successful logins
- Rate limiting and IP banning trigger on sustained attacks

### Scenario 3: MFA Brute-Force

**Objective**: Attempt to guess 6-digit TOTP codes

**Usage**:
```bash
cd attacks/mfa-bruteforce
python mfa_bruteforce.py \
  --target http://localhost:8000 \
  --username admin \
  --password admin123 \
  --code-count 100
```

**Expected Outcome**:
- Max attempts limit enforced (5 attempts)
- Challenge expires after TTL (5 minutes)
- Attack is impractical due to defenses

### Scenario 4: Token Replay

**Objective**: Test JWT security (expiration, revocation, tampering)

**Usage**:
```bash
# Get current MFA code
MFA_CODE=$(docker exec login-api python -c "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())")

cd attacks/token-replay
python token_replay.py \
  --target http://localhost:8000 \
  --username admin \
  --password admin123 \
  --mfa-code $MFA_CODE
```

**Expected Outcome**:
- Expired tokens rejected
- Revoked tokens cannot be reused
- Token rotation prevents replay attacks
- Tampered JWTs fail signature verification

### Scenario 5: IDOR Exploitation (Phase 2.2) ✨ NEW

**Vulnerability**: `/profile/{user_id}` lacks authorization checks

**Objective**: Access other users' profiles including sensitive data (SSN, credit cards)

**Usage**:
```bash
cd attacks/idor-exploit
pip install -r requirements.txt
python idor_attack.py
```

**Attack Flow**:
1. Login as `admin` user
2. Get JWT access token
3. Enumerate user IDs (1-5)
4. Access ALL user profiles (IDOR vulnerability)
5. Exfiltrate SSNs, credit cards, personal data

**Expected Outcome**:
- ✅ Attack succeeds (demonstrates vulnerability)
- 🔍 IDOR attempts tracked in metrics: `user_service_idor_attempts_total`
- 📝 Logs show: `"🚨 IDOR EXPLOIT: User 'admin' accessed profile of 'user1'"`
- 📊 JSON report generated with stolen data

**OWASP**: A01:2021 - Broken Access Control

### Scenario 6: Direct Service Access (Gateway Bypass) ✨ NEW

**Vulnerability**: Backend services exposed on public ports

**Objective**: Bypass API Gateway security controls (JWT, WAF, rate limiting)

**Usage**:
```bash
cd attacks/direct-access
pip install -r requirements.txt
python direct_access_attack.py
```

**Attack Flow**:
1. Discover exposed services (port scanning)
2. Access user-service directly on port 8002
3. Retrieve data without authentication
4. Compare: Gateway (protected) vs Direct (unprotected)

**Expected Outcome**:
- ✅ Complete bypass of Gateway security
- 🔓 No JWT validation, no rate limiting, no WAF
- 🔍 Tracked in metrics: `user_service_direct_access_total`
- 📝 Logs show: `"⚠️ Direct access detected (bypassing gateway)"`

**Remediation**: Remove port exposure, implement mTLS

### Scenario 7: Rate Limit Bypass ✨ NEW

**Vulnerability**: Rate limiting only at Gateway level, not on backend services

**Objective**: Evade rate limiting through various techniques

**Usage**:
```bash
cd attacks/rate-limit-bypass
pip install -r requirements.txt
python rate_limit_bypass.py
```

**Techniques Tested**:
1. **User-Agent rotation** (ineffective - IP-based limiting)
2. **Direct service access** (effective - bypasses Gateway)
3. **Distributed attack simulation** (effective - multiple IPs)

**Expected Outcome**:
- ⚠️ Gateway rate limit works (60 req/min enforced)
- ✅ Direct access bypasses rate limit (unlimited requests)
- 🔍 Tracked in metrics: `gateway_rate_limit_blocks_total`
- 📊 Report shows successful bypass techniques

**Attack Impact**: Enables brute force, DoS, unlimited data scraping

## 🛡️ Defense Mechanisms

### Rate Limiting
- **Algorithm**: Token Bucket
- **Default**: 5 requests per minute per IP
- **Configuration**: `vulnerable-services/login-api/app/config.py`

### IP Banning
- **Trigger**: 10 failed login attempts within 5 minutes
- **Duration**: 15 minutes temporary ban
- **Storage**: In-memory (Redis in production)

## 📊 Monitoring & Observability

### Metrics Collection
- **Prometheus** (http://localhost:9090) - Time-series metrics database
- **Grafana** (http://localhost:3000) - Visualization dashboards (admin/admin)
- **Alertmanager** (http://localhost:9093) - Alert routing & notifications

### Dashboards

**Phase 2.1 - Auth Security** (`auth-security.json`):
- Login success/failure rates
- MFA verification metrics
- JWT token validation
- Failed authentication attempts
- Rate limiting effectiveness

**Phase 2.2 - Attack Visibility** (`devsecops-attack-visibility.json`) ✨:
- IDOR exploitation attempts (`user_service_idor_attempts_total`)
- Direct service access bypasses (`user_service_direct_access_total`)
- Gateway rate limit blocks (`gateway_rate_limit_blocks_total`)
- WAF blocks by attack type (`gateway_waf_blocks_total`)
- Backend service health & latency

**Phase 2.2 - Service Mesh Security** (`service-mesh-security.json`) ✨ NEW:
- Real-time service request rates (Gateway, User Service, Auth Service)
- Security gauges: IDOR attempts, Direct access bypasses
- JWT validation success/failure with reason breakdown
- Gateway security controls (Rate limiting, WAF blocks)
- Service health status (UP/DOWN indicators)
- Performance metrics (latency histograms)

### Key Metrics

```promql
# Phase 2.2 Security Metrics
gateway_requests_total{method, path, status_code}
gateway_jwt_validation_failures_total{reason}
gateway_rate_limit_blocks_total
gateway_waf_blocks_total{attack_type}
user_service_idor_attempts_total{authenticated_user, target_user}
user_service_direct_access_total{endpoint, source_ip}
user_service_unauthorized_settings_access_total
```

### Alerts

**Phase 2.1 - Authentication Alerts** (`devsecops-login-alerts`):
- `LoginFailureSpike` - High rate of failed login attempts (brute-force detection)
- `RateLimiterBlocking` - Rate limiter blocking sustained traffic
- `MFABypassAttempts` - Failed MFA verification attempts spike
- `RefreshTokenAbuse` - Invalid refresh token attempts (token replay)
- `IPBanThresholdReached` - Multiple IPs banned in short period
- `TokenRevocationSpike` - Unusual token revocation activity
- `AuthenticationFlowStalled` - Users completing password but not MFA

**Phase 2.2 - Gateway & Microservices Alerts** (`devsecops-gateway-alerts`) ✨ NEW:

*Critical Security Alerts*:
- `DirectServiceAccessDetected` - Backend services accessed directly (Gateway bypass)
- `IDORExploitationAttempt` - Users accessing unauthorized profiles (OWASP A01:2021)
- `UnauthorizedSettingsAccess` - Auth bypass on `/settings` endpoint
- `WAFSQLInjectionAttempt` - SQL injection attacks detected

*Warning Alerts*:
- `GatewayRateLimitExceeded` - High rate of blocked requests (possible DoS)
- `GatewayRateLimitBypass` - Rate limiting bypassed via direct access
- `WAFBlockSpike` - Active attack detected (SQLi, XSS, Path Traversal)
- `GatewayJWTValidationFailureSpike` - Token tampering or replay attempts
- `IDOREnumerationPattern` - Sequential profile enumeration attack

*Availability & Performance*:
- `APIGatewayDown` - Gateway metrics endpoint unreachable
- `UserServiceDown` - User Service unavailable
- `BackendServiceError` - Backend returning errors to Gateway
- `GatewayHighLatency` - 95th percentile >2s
- `BackendHighLatency` - Backend 95th percentile >1.5s

**Alert Infrastructure**:
- Alert webhook receiver (http://localhost:5001)
- Automated smoke test (`python monitoring/tests/monitoring_smoke_test.py`)
- Full alert rules: `monitoring/prometheus/alert_rules.yml`

### Documentation
- **Phase 2.1 Implementation**: [`docs/auth/PHASE_2.1_IMPLEMENTATION.md`](docs/auth/PHASE_2.1_IMPLEMENTATION.md)
- **Monitoring Guide**: [`docs/monitoring/README.md`](docs/monitoring/README.md)
- **Incident Response**: [`docs/incident-response/README.md`](docs/incident-response/README.md) 🚀 NEW
- **Secure Login API (Original Plan)**: [`docs/auth/SECURE_LOGIN_API.md`](docs/auth/SECURE_LOGIN_API.md)

### Monitoring Quick Start

```bash
# Start services
docker-compose up -d login-api prometheus grafana alertmanager alert-receiver

# Check Prometheus targets
open http://localhost:9090/targets    # Windows: start http://localhost:9090/targets

# Open Grafana dashboard
open http://localhost:3000/d/devsecops/attack-visibility

# Check active alerts
open http://localhost:9093/#/alerts

# View webhook payloads
open http://localhost:5001/alerts

# Query login attempts
curl "http://localhost:9090/api/v1/query?query=login_attempts_total"
```

### Phase 2.3: Incident Response Quick Start 🚀 NEW

```bash
# Start full environment including incident-bot
docker-compose up -d

# Verify incident-bot is running
curl http://localhost:5002/health

# Check loaded runbooks
curl http://localhost:5002/stats | jq

# Simulate security incidents (automated attack chain)
cd monitoring/incident-bot
python simulate_incident.py --attack all

# Watch incident bot logs
docker logs -f incident-bot

# View Incident Response dashboard
open http://localhost:3000/d/incident-response

# Check automated incident reports
docker exec incident-bot ls -la /app/reports/

# Run advanced credential leak demo
python demo_credential_leak.py

# Check incident history
curl http://localhost:5002/incidents | jq
```

**Test Individual Runbooks**:
```bash
# Trigger brute force (should execute: notify + IP ban + report)
cd attacks/brute-force
python brute_force.py --target http://localhost:8000/login

# Trigger IDOR (should execute: IP ban 12h + remediation)
cd attacks/idor-exploit
python idor_attack.py

# Trigger gateway bypass (should execute: IP ban 24h + critical alert)
cd attacks/direct-access
python direct_access_attack.py
```

**Monitor Automated Response**:
- **Incident Timeline**: http://localhost:3000/d/incident-response
- **Alertmanager**: http://localhost:9093/#/alerts
- **Incident Bot Metrics**: http://localhost:5002/metrics
- **Generated Reports**: `docker exec incident-bot ls /app/reports/`

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# Login API Configuration
LOGIN_API_PORT=8000
LOGIN_API_DEBUG=false

# Rate Limiting
RATE_LIMIT_REQUESTS=5
RATE_LIMIT_WINDOW=60

# Security
ENABLE_RATE_LIMITING=true
ENABLE_IP_BANNING=true
BAN_THRESHOLD=10
BAN_DURATION=900
```

## 🧰 Development

### Local Development Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r vulnerable-services/login-api/requirements.txt

# Run service locally
cd vulnerable-services/login-api
uvicorn app.main:app --reload
```

### Running Tests

```bash
# Run Login API tests (comprehensive suite)
cd vulnerable-services/login-api

# Linux/macOS
./run_tests.sh

# Windows PowerShell
.\run_tests.ps1

# Or run pytest directly
pytest -v --cov=app

# Run specific test file
pytest tests/test_security.py -v
pytest tests/test_api.py -v

# Run with coverage report
pytest --cov=app --cov-report=html
# Open htmlcov/index.html

# Run monitoring smoke test
cd ../..
python monitoring/tests/monitoring_smoke_test.py
```

## 📈 Roadmap

### Phase 1: MVP (Current)
- [x] Basic login-api service
- [x] Brute-force attack script
- [x] Rate limiting defense
- [x] Docker containerization

### Phase 2.1: Secure Login API 2.0 ✅ COMPLETED
- [x] JWT access tokens with 5-minute expiry
- [x] Refresh tokens with rotation
- [x] Multi-Factor Authentication (TOTP)
- [x] Redis-based session management
- [x] Credential stuffing attack script
- [x] MFA brute-force attack script
- [x] Token replay attack script
- [x] Enhanced monitoring (MFA, JWT metrics)
- [x] New Prometheus alerts
- [x] Auth Security dashboard
- [x] Complete documentation

### Phase 2.2: API Gateway + User Service ✅ COMPLETED
- [x] FastAPI API Gateway with security middleware
- [x] User microservice (CRUD + profiles)
- [x] WAF rules on gateway (SQL injection, XSS, path traversal)
- [x] JWT validation middleware
- [x] Rate limiting (60 req/min, burst 10)
- [x] Security metrics & monitoring
- [x] Attack demos (IDOR, direct access, rate limit bypass)
- [x] Grafana dashboards (Attack Visibility, Service Mesh Security)
- [x] mTLS certificates generated (ready for implementation)

### Phase 2.3: Incident Response Automation ✅ COMPLETED
- [x] Incident Bot service with runbook engine
- [x] 8 prebuilt runbooks for common attack patterns  
- [x] Automated action handlers (IP ban, notify, report)
- [x] Integration with Prometheus/Alertmanager
- [x] Grafana dashboard for incident visualization
- [x] Attack simulation scripts (chain attacks)
- [x] Advanced credential leak + chain demo
- [x] Comprehensive incident response documentation
- [x] Smoke tests for incident automation

### Phase 3: Observability
- [x] Prometheus metrics
- [x] Grafana dashboards (2x)
- [x] Alertmanager integration
- [ ] ELK Stack integration
- [ ] Security event correlation
- [ ] Log aggregation

### Phase 4: Cloud Deployment
- [ ] Terraform AWS infrastructure
- [ ] Kubernetes manifests
- [ ] Multi-region setup
- [ ] Automated security scanning

### Phase 5: AI/ML Integration
- [ ] Anomaly detection
- [ ] Predictive threat analysis
- [ ] Automated response systems

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: [Wiki](https://github.com/yourusername/DevSecOps-Hacking-Lab/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/DevSecOps-Hacking-Lab/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/DevSecOps-Hacking-Lab/discussions)

## 👨‍💻 Author

Created as a professional portfolio showcase for DevSecOps capabilities.

## 🙏 Acknowledgments

- OWASP for security best practices
- FastAPI community
- Docker and container security community

---

**Remember**: This is an ethical hacking lab. All activities must be performed in controlled environments. Never attack systems you don't own or have explicit permission to test.



