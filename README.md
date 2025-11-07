# DevSecOps Hacking Lab 🛡️⚔️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Docker](https://img.shields.io/badge/docker-required-blue.svg)](https://www.docker.com/)

> **Professional DevSecOps showcase demonstrating offensive and defensive security techniques in containerized microservices environments**

## 📋 Overview

DevSecOps Hacking Lab is an educational, ethical testing environment designed to simulate real-world attacks on microservices and demonstrate defense mechanisms. This project serves as a portfolio showcase for DevOps/DevSecOps professionals and security enthusiasts.

### ⚠️ Legal Disclaimer

**READ THIS FIRST**: This project is for educational purposes only. All attacks must be performed exclusively in controlled, local environments. See [DISCLAIMER.md](./DISCLAIMER.md) for full ethical usage guidelines.

## 🎯 Current Features (MVP)

### Vulnerable Services
- **login-api**: FastAPI-based authentication service vulnerable to brute-force attacks

### Attack Scenarios
- **Brute-Force Attack**: Automated password guessing against login endpoints

### Defense Mechanisms
- **Rate Limiting**: Token-bucket algorithm to prevent abuse
- **IP-based Blocking**: Automatic temporary bans for suspicious activity

### Infrastructure
- Docker containerization
- Docker Compose orchestration
- Health checks and service monitoring

## 🏗️ Architecture

```
DevSecOps Hacking Lab
├── vulnerable-services/    # Intentionally vulnerable microservices
│   └── login-api/          # Authentication service with security flaws
├── attacks/                # Ethical attack scripts and tools
│   └── brute-force/        # Password brute-forcing scenarios
├── defenses/               # Security hardening and defense mechanisms
│   └── rate-limiter/       # Rate limiting implementation
├── monitoring/             # Observability stack (Prometheus, Grafana)
├── infrastructure/         # IaC and deployment configurations
│   └── docker/             # Docker and compose files
└── .github/                # CI/CD pipelines
```

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

#### Manual Login Test
```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

#### Run Brute-Force Attack (Ethical Testing)
```bash
cd attacks/brute-force
python brute_force.py --target http://localhost:8000/login --username admin
```

## 🧪 Attack Scenarios

### Scenario 1: Brute-Force Attack

**Objective**: Demonstrate vulnerability to password guessing attacks

**Steps**:
1. Start the vulnerable login-api service
2. Run the brute-force attack script
3. Observe rate limiting kicking in
4. Review logs and metrics

**Expected Outcome**: 
- Initial requests succeed
- Rate limiter blocks excessive requests (429 status)
- IP gets temporarily banned after threshold

## 🛡️ Defense Mechanisms

### Rate Limiting
- **Algorithm**: Token Bucket
- **Default**: 5 requests per minute per IP
- **Configuration**: `vulnerable-services/login-api/app/config.py`

### IP Banning
- **Trigger**: 10 failed login attempts within 5 minutes
- **Duration**: 15 minutes temporary ban
- **Storage**: In-memory (Redis in production)

## 📊 Monitoring (In Progress)

- Prometheus metrics collection (http://localhost:9090)
- `/metrics` endpoint with login counters
- Grafana dashboards (coming soon)
- Attack visualization (coming soon)
- Real-time alerting (coming soon)
 
### Prometheus Quick Start

```bash
# Start services
docker-compose up -d login-api prometheus

# Check Prometheus targets
open http://localhost:9090/targets    # Windows: start http://localhost:9090/targets

# Query login attempts
curl "http://localhost:9090/api/v1/query?query=login_attempts_total"
```

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
# Run unit tests
pytest tests/

# Run security tests
python -m attacks.brute-force.brute_force --test-mode
```

## 📈 Roadmap

### Phase 1: MVP (Current)
- [x] Basic login-api service
- [x] Brute-force attack script
- [x] Rate limiting defense
- [x] Docker containerization

### Phase 2: Enhanced Security
- [ ] SQL Injection vulnerable endpoint
- [ ] XSS vulnerable frontend
- [ ] CORS misconfiguration
- [ ] Advanced WAF implementation

### Phase 3: Observability
- [ ] Prometheus metrics
- [ ] Grafana dashboards
- [ ] ELK Stack integration
- [ ] Security event correlation

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



