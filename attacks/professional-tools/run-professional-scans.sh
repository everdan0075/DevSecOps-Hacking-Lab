#!/bin/bash
#
# Professional Security Scanning Suite
# Automated execution of industry-standard pentesting tools
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TARGET_GATEWAY="http://localhost:8080"
TARGET_AUTH="http://localhost:8000"
TARGET_USER="http://localhost:8002"
RESULTS_DIR="./results/$(date +%Y%m%d_%H%M%S)"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    DevSecOps Lab - Professional Security Scan Suite${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Function to check if tool is installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}[✗] $1 not installed${NC}"
        return 1
    else
        echo -e "${GREEN}[✓] $1 installed${NC}"
        return 0
    fi
}

# Function to run scan
run_scan() {
    local tool=$1
    local description=$2
    shift 2
    local command="$@"

    echo ""
    echo -e "${YELLOW}[*] Running: $description${NC}"
    echo -e "${BLUE}    Command: $command${NC}"

    if eval "$command"; then
        echo -e "${GREEN}[✓] $tool completed successfully${NC}"
    else
        echo -e "${RED}[✗] $tool failed${NC}"
    fi
}

# Check prerequisites
echo -e "${BLUE}[*] Checking prerequisites...${NC}"
TOOLS_OK=true

check_tool "nmap" || TOOLS_OK=false
check_tool "nuclei" || TOOLS_OK=false
check_tool "sqlmap" || TOOLS_OK=false
check_tool "ffuf" || TOOLS_OK=false
check_tool "hydra" || TOOLS_OK=false
check_tool "trivy" || TOOLS_OK=false
check_tool "gitleaks" || TOOLS_OK=false

if [ "$TOOLS_OK" = false ]; then
    echo ""
    echo -e "${RED}[!] Some tools are missing. Install them first:${NC}"
    echo ""
    echo -e "${YELLOW}# Nmap${NC}"
    echo "sudo apt install nmap"
    echo ""
    echo -e "${YELLOW}# Nuclei${NC}"
    echo "go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest"
    echo ""
    echo -e "${YELLOW}# SQLMap${NC}"
    echo "sudo apt install sqlmap"
    echo ""
    echo -e "${YELLOW}# ffuf${NC}"
    echo "go install github.com/ffuf/ffuf@latest"
    echo ""
    echo -e "${YELLOW}# Hydra${NC}"
    echo "sudo apt install hydra"
    echo ""
    echo -e "${YELLOW}# Trivy${NC}"
    echo "brew install aquasecurity/trivy/trivy"
    echo ""
    echo -e "${YELLOW}# GitLeaks${NC}"
    echo "brew install gitleaks"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}[✓] All tools available${NC}"
echo ""

# Phase 1: Network Reconnaissance
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 1: Network Reconnaissance${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

run_scan "Nmap" "Port scan and service enumeration" \
    "nmap -sV -p 8000,8002,8080,9090,3000,9093,5002,6379 localhost -oN $RESULTS_DIR/nmap_scan.txt"

# Phase 2: Vulnerability Scanning
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 2: Vulnerability Scanning${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

run_scan "Nuclei" "Template-based vulnerability scan" \
    "nuclei -u $TARGET_GATEWAY -t nuclei-templates.yaml -json -o $RESULTS_DIR/nuclei_results.json"

# Phase 3: SQL Injection Testing
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 3: SQL Injection Testing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

run_scan "SQLMap" "Automated SQL injection testing" \
    "sqlmap -u '$TARGET_USER/users?id=1' --batch --level=2 --risk=2 --output-dir=$RESULTS_DIR/sqlmap"

# Phase 4: API Endpoint Discovery
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 4: API Endpoint Discovery${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Create API endpoint wordlist
cat > $RESULTS_DIR/api_endpoints.txt <<EOF
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
auth
login
logout
EOF

run_scan "ffuf" "API endpoint fuzzing" \
    "ffuf -w $RESULTS_DIR/api_endpoints.txt -u $TARGET_GATEWAY/api/FUZZ -mc 200,201,204,301,302,307,401,403 -c -o $RESULTS_DIR/ffuf_results.json"

# Phase 5: Credential Testing
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 5: Credential Testing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Create wordlists
cat > $RESULTS_DIR/users.txt <<EOF
admin
user
alice
bob
charlie
EOF

cat > $RESULTS_DIR/passwords.txt <<EOF
admin123
password123
Welcome@2024
qwerty123
EOF

echo -e "${YELLOW}[*] Note: Hydra requires HTTP JSON API support${NC}"
echo -e "${YELLOW}    Using custom credential stuffing script instead${NC}"

# Phase 6: Container Security
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 6: Container Security${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

run_scan "Trivy" "Container image vulnerability scan - login-api" \
    "trivy image login-api:latest --severity HIGH,CRITICAL -f json -o $RESULTS_DIR/trivy_login_api.json"

run_scan "Trivy" "Container image vulnerability scan - api-gateway" \
    "trivy image api-gateway:latest --severity HIGH,CRITICAL -f json -o $RESULTS_DIR/trivy_gateway.json"

run_scan "Trivy" "Container image vulnerability scan - user-service" \
    "trivy image user-service:latest --severity HIGH,CRITICAL -f json -o $RESULTS_DIR/trivy_user_service.json"

# Phase 7: Secret Scanning
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 7: Secret Scanning${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

run_scan "GitLeaks" "Secret scanning in repository" \
    "gitleaks detect --source ../.. --report-path $RESULTS_DIR/gitleaks_report.json --no-git"

# Phase 8: Generate Summary Report
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 8: Report Generation${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

# Create HTML summary report
cat > $RESULTS_DIR/summary_report.html <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>DevSecOps Lab - Security Scan Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
        h2 { color: #007bff; margin-top: 30px; }
        .section { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .result { margin: 10px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #28a745; }
        .high { border-left-color: #dc3545; }
        .medium { border-left-color: #ffc107; }
        .low { border-left-color: #28a745; }
        .info { border-left-color: #17a2b8; }
        pre { background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>DevSecOps Hacking Lab - Security Scan Report</h1>
    <p class="timestamp">Generated: $(date)</p>

    <div class="section">
        <h2>Executive Summary</h2>
        <p>Comprehensive security assessment of DevSecOps Hacking Lab infrastructure using professional pentesting tools.</p>
        <ul>
            <li><strong>Target:</strong> http://localhost:8080 (API Gateway)</li>
            <li><strong>Scan Date:</strong> $(date +%Y-%m-%d)</li>
            <li><strong>Tools Used:</strong> Nmap, Nuclei, SQLMap, ffuf, Trivy, GitLeaks</li>
        </ul>
    </div>

    <div class="section">
        <h2>1. Network Reconnaissance (Nmap)</h2>
        <pre>$(cat $RESULTS_DIR/nmap_scan.txt 2>/dev/null || echo "No results available")</pre>
    </div>

    <div class="section">
        <h2>2. Vulnerability Scan (Nuclei)</h2>
        <p>Template-based vulnerability detection results:</p>
        <div class="result high">
            <strong>Check results in:</strong> $RESULTS_DIR/nuclei_results.json
        </div>
    </div>

    <div class="section">
        <h2>3. SQL Injection Testing (SQLMap)</h2>
        <p>Automated SQL injection vulnerability assessment:</p>
        <div class="result medium">
            <strong>Check results in:</strong> $RESULTS_DIR/sqlmap/
        </div>
    </div>

    <div class="section">
        <h2>4. API Endpoint Discovery (ffuf)</h2>
        <p>Discovered API endpoints:</p>
        <div class="result info">
            <strong>Check results in:</strong> $RESULTS_DIR/ffuf_results.json
        </div>
    </div>

    <div class="section">
        <h2>5. Container Security (Trivy)</h2>
        <p>Container image vulnerability scan results:</p>
        <ul>
            <li>login-api: $RESULTS_DIR/trivy_login_api.json</li>
            <li>api-gateway: $RESULTS_DIR/trivy_gateway.json</li>
            <li>user-service: $RESULTS_DIR/trivy_user_service.json</li>
        </ul>
    </div>

    <div class="section">
        <h2>6. Secret Scanning (GitLeaks)</h2>
        <p>Repository secret detection:</p>
        <div class="result low">
            <strong>Check results in:</strong> $RESULTS_DIR/gitleaks_report.json
        </div>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <ol>
            <li>Review all HIGH and CRITICAL severity findings</li>
            <li>Patch identified SQL injection vulnerabilities</li>
            <li>Update container images with known CVEs</li>
            <li>Remove or rotate any detected secrets</li>
            <li>Implement WAF rules for detected attack patterns</li>
            <li>Enable MFA for all administrative accounts</li>
        </ol>
    </div>
</body>
</html>
EOF

echo -e "${GREEN}[✓] HTML report generated: $RESULTS_DIR/summary_report.html${NC}"

# Final Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SCAN COMPLETE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}[✓] All scans completed${NC}"
echo ""
echo -e "${YELLOW}Results saved to: $RESULTS_DIR${NC}"
echo ""
echo -e "${BLUE}Files generated:${NC}"
ls -lh "$RESULTS_DIR"
echo ""
echo -e "${YELLOW}View HTML report:${NC}"
echo -e "    open $RESULTS_DIR/summary_report.html"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "    1. Review HTML summary report"
echo -e "    2. Analyze JSON results for detailed findings"
echo -e "    3. Prioritize remediation by severity"
echo -e "    4. Re-run scans after fixes"
echo ""
