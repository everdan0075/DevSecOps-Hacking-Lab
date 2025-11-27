# DevSecOps Hacking Lab 🛡️⚔️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Docker](https://img.shields.io/badge/docker-required-blue.svg)](https://www.docker.com/)
[![React](https://img.shields.io/badge/react-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.6-blue.svg)](https://www.typescriptlang.org/)

![Security Scan](https://github.com/everdan0075/DevSecOps-Hacking-Lab/actions/workflows/security-scan.yml/badge.svg)
![Attack Simulation](https://github.com/everdan0075/DevSecOps-Hacking-Lab/actions/workflows/attack-simulation.yml/badge.svg)
![Frontend Deploy](https://github.com/everdan0075/DevSecOps-Hacking-Lab/actions/workflows/deploy-frontend.yml/badge.svg)

> **Professional DevSecOps showcase demonstrating offensive and defensive security techniques in containerized microservices with real-time monitoring and automated incident response**

**🌐 Live Demo**: [https://everdan0075.github.io/DevSecOps-Hacking-Lab](https://everdan0075.github.io/DevSecOps-Hacking-Lab)

## 🔒 Security Status

<!-- SECURITY-STATUS-START -->
**Last Scan**: 2025-11-27
**Vulnerabilities**: 0 CRITICAL, 3 HIGH
**Status**: PASSING
<!-- SECURITY-STATUS-END -->

*Security status automatically updated by CI/CD pipeline. View detailed results in [GitHub Actions](https://github.com/everdan0075/DevSecOps-Hacking-Lab/actions).*

## 📋 Overview

DevSecOps Hacking Lab is a **production-grade educational platform** demonstrating offensive and defensive security techniques in microservices architecture. Features include:

- ✅ **8 Attack Scenarios** with UI execution (SQL injection, IDOR, brute force, etc.)
- ✅ **SIEM Dashboard** with real-time threat intelligence and risk assessment
- ✅ **Automated Incident Response** with runbook-based playbooks
- ✅ **WAF Analytics** exposing 28 attack signatures across 8 categories
- ✅ **IDS Integration** with Suricata for network-layer detection
- ✅ **Professional Frontend** (React + TypeScript) deployed on GitHub Pages
- ✅ **Full Observability** with Prometheus, Grafana, and Alertmanager

### ⚠️ Legal Disclaimer

**READ THIS FIRST**: This project is for **educational purposes only**. All attacks must be performed **exclusively in controlled, local environments**. Unauthorized access to systems you don't own is illegal. See [DISCLAIMER.md](./DISCLAIMER.md) for full ethical usage guidelines.

## 🎯 Key Features

### 🖥️ Frontend Dashboard (NEW - Phase 2.6B)

**Live Demo**: [https://everdan0075.github.io/DevSecOps-Hacking-Lab](https://everdan0075.github.io/DevSecOps-Hacking-Lab)

Professional React + TypeScript UI with 7 pages:

- **Home**: Overview, architecture diagram, tech stack
- **Attacks**: 8 attack scenarios with real-time execution
- **Monitoring**: Service health, incident timeline, metrics
- **WAF Analytics**: 28 attack signatures, rate limits, User-Agent filtering
- **SIEM**: Threat scoring, risk assessment, attack patterns, defense metrics
- **Architecture**: Interactive service diagram with data flow visualization
- **Docs**: Comprehensive documentation viewer

**Frontend Tech Stack**:
- React 18.3 + TypeScript 5.6
- Vite (build tool)
- Tailwind CSS (styling)
- Framer Motion (animations)
- Recharts (visualizations)
- Lucide React (icons)

### 🔐 Backend Security Platform (Phases 2.1-2.5)

**Microservices Architecture** (Docker Compose):

| Service | Port | Description | Key Features |
|---------|------|-------------|--------------|
| **API Gateway** | 8080 | Central routing + security | JWT validation, WAF (28 signatures), rate limiting, honeypots |
| **Auth Service** | 8000 | Authentication | JWT + MFA (TOTP), token management, Redis sessions |
| **User Service** | 8002 | User management | CRUD + **intentional IDOR vulnerability** |
| **Incident Bot** | 5002 | Automated response | Runbook engine, IP banning, report generation, correlation |
| **Prometheus** | 9090 | Metrics collection | 74 alert rules, 50+ metrics |
| **Grafana** | 3000 | Visualization | 4 pre-built dashboards |
| **Alertmanager** | 9093 | Alert routing | Webhook integration |
| **Redis** | 6379 | Session store | Rate limits, IP bans, MFA challenges |

### 🎯 Attack Scenarios (Phase 2.2 + 2.6)

All scenarios executable via **Web UI** or **Python scripts**:

1. **Brute Force** - Credential guessing with rate limit bypass techniques
2. **MFA Bypass** - Multi-factor authentication exploitation
3. **IDOR** - Insecure Direct Object Reference (access any user's profile)
4. **Direct Access** - Gateway bypass attack (backend port exposure)
5. **Rate Limit Bypass** - Distributed request attacks
6. **Token Replay** - JWT token reuse exploitation
7. **Credential Stuffing** - Bulk credential testing
8. **Honeypot Scan** - 8 reconnaissance attacks (admin panels, secrets, git exposure, etc.)

### 🛡️ Defense Mechanisms (Phase 2.5A-C + 2.6B)

**WAF (Web Application Firewall)** - 28 Attack Signatures:
- SQL Injection (8 patterns)
- Cross-Site Scripting (7 patterns)
- Command Injection (4 patterns)
- Path Traversal (3 patterns)
- XXE (XML External Entity) (2 patterns)
- SSRF (Server-Side Request Forgery) (2 patterns)
- LDAP Injection (1 pattern)
- Template Injection (1 pattern)

**Rate Limiting** - Per-Endpoint Configuration:
- `/auth/login`: 10 req/min (burst: 3)
- `/auth/mfa/verify`: 15 req/min (burst: 5)
- `/auth/token/refresh`: 20 req/min (burst: 10)
- `/api/users/profile/*`: 30 req/min (burst: 15)
- `/api/users/settings`: 20 req/min (burst: 10)
- `/admin*`: 5 req/min (burst: 2) - Honeypot
- `/.env`: 1 req/min (burst: 1) - Honeypot

**User-Agent Filtering**:
- Blocked: 20 agents (scanners: nikto, nmap, sqlmap; scrapers: scrapy; bots: semrush)
- Whitelisted: 8 good bots (googlebot, bingbot, duckduckbot, etc.)

**IDS Integration** (Phase 2.5B):
- Suricata for network intrusion detection (Linux only)
- Alert correlation with SIEM
- Real-time alert feed in frontend

**SIEM & Threat Intelligence** (Phase 2.5C):
- IP-based threat scoring (0-100 scale)
- Attack pattern detection (reconnaissance, multi-stage, distributed, credential stuffing, APT)
- Environment risk assessment (event volume, pattern complexity, severity)
- Defense effectiveness metrics

### 🤖 Automated Incident Response (Phase 2.3)

**Runbook Engine** - 8 Pre-built Scenarios:
1. Brute Force Response (IP ban 1h + notify)
2. MFA Bypass (IP ban 2h + analysis)
3. Token Abuse (IP ban + revocation guidance)
4. Gateway Bypass (IP ban 24h + critical alert)
5. IDOR Exploitation (IP ban 12h + remediation)
6. SQL Injection (IP ban 24h + forensics)
7. Multiple IP Bans (Distributed attack analysis)
8. Credential Leak Chain (Advanced multi-step response)

**Action Handlers**:
- `notify` - Slack/console notifications
- `ban_ip` - Redis-based IP banning with TTL
- `report` - JSON/Markdown incident reports
- `remediate` - Automated remediation steps
- `escalate` - Critical incident escalation

**Workflow**:
```
Attack → Prometheus Alert → Alertmanager → Incident Bot → Runbook → Actions → Report
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+ (for attack scripts)
- Node.js 18+ (for frontend development)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/everdan0075/DevSecOps-Hacking-Lab.git
cd DevSecOps-Hacking-Lab
```

### 2. Start Backend Services

```bash
docker-compose up -d
```

**Wait ~30 seconds** for all services to initialize.

### 3. Verify Services

```bash
# Check all services are running
docker-compose ps

# View logs
docker-compose logs -f api-gateway
```

**Service Health Endpoints**:
- API Gateway: http://localhost:8080/health
- Auth Service: http://localhost:8000/health
- User Service: http://localhost:8002/health
- Incident Bot: http://localhost:5002/health
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)

### 4. Access Frontend

**Option A: Live Demo** (GitHub Pages)
```
https://everdan0075.github.io/DevSecOps-Hacking-Lab
```

**Option B: Local Development**
```bash
cd frontend
npm install
npm run dev
# Access http://localhost:5173
```

**Option C: Production Build**
```bash
cd frontend
npm run build
npm run preview
# Access http://localhost:4173
```

### 5. Run Attack Scenarios

**Via Web UI** (Recommended):
1. Open http://localhost:5173/attacks
2. Click "Execute Attack" on any scenario
3. View real-time logs and results
4. Check monitoring metrics at http://localhost:5173/monitoring

**Via Python Scripts**:
```bash
# Brute Force Attack
cd attacks/brute-force
python brute_force.py --target http://localhost:8000/auth/login --username admin

# IDOR Exploitation
cd attacks/idor-exploit
python idor_attack.py

# Honeypot Reconnaissance
cd attacks/honeypot
python admin_panel_scan.py
```

### 6. View Monitoring Dashboards

**Frontend Dashboards** (http://localhost:5173):
- `/monitoring` - Service health, incidents, metrics
- `/waf` - WAF analytics, signatures, rate limits
- `/siem` - Threat intelligence, risk assessment

**Grafana Dashboards** (http://localhost:3000):
- Auth Security
- Attack Visibility
- Service Mesh Security
- Incident Response

**Prometheus** (http://localhost:9090):
- Query metrics directly
- View active alerts
- Explore target health

## 📚 Documentation

**Main Documentation**:
- [DISCLAIMER.md](./DISCLAIMER.md) - Legal & ethical usage
- [docs/auth/](./docs/auth/) - Authentication system (Phase 2.1)
- [docs/gateway/](./docs/gateway/) - API Gateway architecture (Phase 2.2)
- [docs/incident-response/](./docs/incident-response/) - Incident automation (Phase 2.3)
- [docs/frontend/](./docs/frontend/) - Frontend integration (Phase 2.6/2.6B)

**Service READMEs**:
- [vulnerable-services/login-api/README.md](./vulnerable-services/login-api/README.md)
- [vulnerable-services/api-gateway/README.md](./vulnerable-services/api-gateway/README.md)
- [vulnerable-services/user-service/README.md](./vulnerable-services/user-service/README.md)
- [monitoring/incident-bot/README.md](./monitoring/incident-bot/README.md)

**Attack Documentation**:
- [attacks/brute-force/README.md](./attacks/brute-force/README.md)
- [attacks/mfa-bruteforce/README.md](./attacks/mfa-bruteforce/README.md)
- [attacks/idor-exploit/README.md](./attacks/idor-exploit/README.md)

**In-App Documentation**:
- Access comprehensive guides at http://localhost:5173/docs
- 20+ documentation pages covering all features

## 🧪 Testing

### Smoke Tests (Fast - ~1-2 min)

```bash
# Test core functionality
pytest tests/smoke/ -v

# Test specific service
pytest tests/smoke/test_gateway.py -v
```

### Integration Tests (E2E - ~3-5 min)

```bash
# Full end-to-end flows
pytest tests/integration/ -v

# Specific flow
pytest tests/integration/test_auth_flow.py -v
```

### Service-Specific Tests

```bash
# Auth Service
cd vulnerable-services/login-api
pytest -v --cov=app

# API Gateway
cd vulnerable-services/api-gateway
pytest -v --cov=app

# User Service
cd vulnerable-services/user-service
pytest -v --cov=app
```

### Frontend Tests

```bash
cd frontend
npm run build  # TypeScript compilation + production build
npm run preview  # Test production build
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  Home │ Attacks │ Monitoring │ WAF │ SIEM │ Docs        │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────┐
│              API Gateway (:8080)                         │
│  JWT │ WAF │ Rate Limit │ Security Headers │ Honeypots  │
└─────┬──────────────────────────────────────────────┬────┘
      │                                               │
      ├──────────┬─────────────┬───────────────┬────┘
      │          │             │               │
┌─────▼────┐ ┌──▼──────┐ ┌────▼──────┐ ┌─────▼────────┐
│Auth Svc  │ │User Svc │ │ Redis     │ │ Incident Bot │
│  :8000   │ │  :8002  │ │  :6379    │ │   :5002      │
└──────────┘ └─────────┘ └───────────┘ └──────┬───────┘
                                               │
┌──────────────────────────────────────────────┼─────────┐
│              Monitoring Stack                │         │
│  Prometheus (:9090) ──> Alertmanager (:9093)─┘         │
│  Grafana (:3000) <──── Prometheus                      │
└────────────────────────────────────────────────────────┘
```

**Data Flow**:
1. User → Frontend (React)
2. Frontend → API Gateway (JWT token)
3. Gateway → Validates JWT, applies WAF/rate limiting
4. Gateway → Routes to Auth/User services
5. Services → Store data in Redis
6. Services → Export metrics to Prometheus
7. Prometheus → Fires alerts to Alertmanager
8. Alertmanager → Sends webhooks to Incident Bot
9. Incident Bot → Executes runbooks (ban IP, notify, report)
10. Grafana → Visualizes metrics from Prometheus

## 🔧 Configuration

### Environment Variables

**Auth Service** (vulnerable-services/login-api/.env):
```env
SECRET_KEY=dev-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=5
REFRESH_TOKEN_EXPIRE_MINUTES=60
MFA_ENABLED=true
ENABLE_RATE_LIMITING=true
BAN_THRESHOLD=10
BAN_DURATION=900
```

**API Gateway** (vulnerable-services/api-gateway/.env):
```env
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_BURST_SIZE=10
WAF_ENABLED=true
AUTH_SERVICE_URL=http://login-api:8000
USER_SERVICE_URL=http://user-service:8000
```

**Incident Bot** (monitoring/incident-bot/.env):
```env
RUNBOOK_DIR=/app/runbooks
REDIS_HOST=redis
REPORT_OUTPUT_DIR=/app/reports
SLACK_WEBHOOK_URL=  # Optional
```

### Port Reference

| Port | Service | URL |
|------|---------|-----|
| 5173 | Frontend (Dev) | http://localhost:5173 |
| 8000 | Auth Service | http://localhost:8000 |
| 8002 | User Service | http://localhost:8002 |
| 8080 | API Gateway | http://localhost:8080 |
| 8443 | Traefik (HTTPS) | https://localhost:8443 |
| 9090 | Prometheus | http://localhost:9090 |
| 3000 | Grafana | http://localhost:3000 |
| 9093 | Alertmanager | http://localhost:9093 |
| 5002 | Incident Bot | http://localhost:5002 |
| 6379 | Redis | localhost:6379 |

## 🎓 Educational Use Cases

### For DevSecOps Engineers
- **Attack Simulation**: Practice defending against common attacks
- **Monitoring Setup**: Learn Prometheus, Grafana, Alertmanager integration
- **Incident Response**: Understand automated response workflows
- **Security Controls**: Implement WAF, rate limiting, JWT validation

### For Security Analysts
- **Threat Intelligence**: Analyze attack patterns and threat scores
- **SIEM Configuration**: Work with real-time security event management
- **Forensics**: Investigate incident reports and attack chains
- **Risk Assessment**: Calculate environment-wide risk metrics

### For Developers
- **Secure Coding**: Learn common vulnerabilities (IDOR, SQL injection, auth bypass)
- **API Security**: Implement JWT, MFA, rate limiting
- **Observability**: Add metrics, logs, and traces to microservices
- **Frontend Security**: Build secure React applications with proper error handling

### For Students
- **Hands-on Learning**: Real attack scenarios in safe environment
- **Best Practices**: Industry-standard tools (Docker, Prometheus, React)
- **Portfolio Project**: Showcase DevSecOps skills to employers
- **Documentation**: Comprehensive guides for self-learning

## 🚨 Intentional Vulnerabilities

**These vulnerabilities are INTENTIONAL for educational purposes. DO NOT FIX.**

1. **IDOR (user-service)**: `/profile/{user_id}` - No authorization checks, any user can access any profile
2. **Auth Bypass (user-service)**: `/settings` endpoint lacks JWT validation
3. **Direct Service Access**: Backend services exposed on public ports (8000, 8002) allowing gateway bypass
4. **Rate Limit Bypass**: Rate limiting only at gateway level, not on backend services

**Metrics Track Exploitation**:
- `user_service_idor_attempts_total` - IDOR exploitation
- `user_service_direct_access_total` - Gateway bypass
- `user_service_unauthorized_settings_access_total` - Auth bypass
- `gateway_rate_limit_blocks_total` - Rate limit violations

## 🤝 Contributing

This project is part of a portfolio showcase, but suggestions and feedback are welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

**Contribution Guidelines**:
- Code: English (docs, comments, variable names)
- Commits: Conventional Commits format (`feat:`, `fix:`, `docs:`, etc.)
- No AI attribution in code/docs/commits
- Preserve intentional vulnerabilities

## 📝 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

**Technologies**:
- FastAPI (Python web framework)
- React + TypeScript (Frontend)
- Prometheus + Grafana (Monitoring)
- Docker + Docker Compose (Containerization)
- Redis (Session storage)
- Suricata (IDS)

**Inspiration**:
- OWASP Top 10
- MITRE ATT&CK Framework
- Real-world DevSecOps practices

## 📧 Contact

**Author**: Łukasz Everdan
**GitHub**: [@everdan0075](https://github.com/everdan0075)
**Project Link**: [https://github.com/everdan0075/DevSecOps-Hacking-Lab](https://github.com/everdan0075/DevSecOps-Hacking-Lab)
**Live Demo**: [https://everdan0075.github.io/DevSecOps-Hacking-Lab](https://everdan0075.github.io/DevSecOps-Hacking-Lab)

---

**⭐ If this project helped you learn DevSecOps, please give it a star!**

**🔒 Remember**: Use this knowledge responsibly and only in authorized, controlled environments.
