# Honeypot Protection & Decoy Attack Detection

**Status**: Implemented (Phase 2.6+)
**Date**: November 2025
**Component**: API Gateway + Frontend Honeypot Service

## Overview

Honeypots are intentionally vulnerable or alluring endpoints designed to detect and track reconnaissance activities and unauthorized access attempts. They serve as early warning systems for intrusions and provide valuable intelligence about attacker behavior.

## Implemented Honeypots

### 1. Admin Panel Honeypot (`/admin*`)

**Configuration**:
- **Pattern**: Matches `/admin`, `/admin/`, `/admin/login`, `/admin/panel`, etc.
- **Rate Limit**: 5 requests/minute (burst: 2)
- **Response**: 200 OK with fake admin login page
- **Headers**: Includes server version and tech stack hints

**Purpose**:
- Detects attackers probing for admin interfaces
- Common target for unauthorized access attempts
- Recognizable as attractive attack vector

**Metrics Tracked**:
- `gateway_honeypot_admin_attempts_total` - Total attempts
- `gateway_honeypot_admin_ips_unique` - Unique source IPs
- `gateway_honeypot_admin_detection_events` - Detection events

**Educational Value**:
- Demonstrates reconnaissance patterns
- Shows attacker targeting preferences
- Reveals scanner behavior (rapid, automated requests)

### 2. Secrets File Honeypot (`/.env`)

**Configuration**:
- **Pattern**: Exact match for `/.env`
- **Rate Limit**: 1 request/minute (burst: 1)
- **Response**: 200 OK with fake .env file containing
  - Database credentials (honeypot values)
  - API keys (honeypot values)
  - Secret tokens (honeypot values)
- **Headers**: `Content-Type: text/plain`

**Purpose**:
- Detects secret enumeration attacks
- Targets common configuration file locations
- Extremely low rate limit indicates high sensitivity

**Metrics Tracked**:
- `gateway_honeypot_secrets_attempts_total` - Total attempts
- `gateway_honeypot_secrets_content_extracted_total` - File reads
- `gateway_honeypot_secrets_detection_events` - Detection events

**Educational Value**:
- Shows danger of exposed configuration files
- Demonstrates automated secrets discovery
- Reveals attacker toolkit patterns

### 3. Git Directory Honeypot (`./.git` - Optional)

**Configuration**:
- **Pattern**: Matches `/.git`, `/.git/config`, `/.git/HEAD`, etc.
- **Rate Limit**: 3 requests/minute (burst: 1)
- **Response**: 200 OK with fake git metadata
- **Additional Targets**:
  - `/.gitignore`
  - `/.git/objects/`
  - `/.git/refs/`

**Purpose**:
- Detects source code repository exposure attempts
- Common vulnerability in misconfigured servers
- Often reveals sensitive code and history

**Metrics Tracked**:
- `gateway_honeypot_git_attempts_total` - Total git enumeration attempts
- `gateway_honeypot_git_files_accessed_total` - Specific files accessed
- `gateway_honeypot_git_clones_detected_total` - Attempted repository clones

**Educational Value**:
- Demonstrates importance of not exposing .git
- Shows reconnaissance toolkit capabilities
- Reveals source code hunting patterns

## Honeypot Detection Architecture

### Detection Flow

```
Request → Pattern Matching → Rate Limit Check → Honeypot Response
                                    ↓
                         Metrics Collection
                                    ↓
                         Event Logging & SIEM
                                    ↓
                    Incident Response (if configured)
```

### Rate Limiting Enforcement

**Token Bucket Algorithm**:
```
Admin Panel:  5 req/min (allows burst of 2)
Secrets:      1 req/min (ultra-strict)
Git:          3 req/min (allows burst of 1)
```

**Behavior When Exceeded**:
- Return 429 Too Many Requests
- Log attempt as attack event
- Trigger incident response if threshold reached
- Update threat score for source IP

### Response Generation

**Admin Panel Response**:
```html
<!DOCTYPE html>
<html>
  <title>Admin Login</title>
  <body>
    <h1>Application Admin Panel</h1>
    <form method="POST" action="/admin/login">
      <input name="username" placeholder="Username">
      <input name="password" type="password" placeholder="Password">
      <button type="submit">Login</button>
    </form>
  </body>
</html>
```

**Secrets File Response**:
```env
DATABASE_URL=postgresql://admin:honeypot_pass@db.internal:5432/app_db
API_KEY=sk_honeypot_e8f9a8b7c6d5e4f3a2b1c0d9
JWT_SECRET=honeypot_jwt_secret_key_12345
AWS_ACCESS_KEY=HONEYPOT_AKIAIOSFODNN7EXAMPLE
SLACK_WEBHOOK=https://hooks.slack.com/services/honeypot/webhook
DATABASE_PASSWORD=honeypot_admin123
PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
```

## Metrics & Analytics

### Prometheus Metrics

```prometheus
# Total honeypot attempts
gateway_honeypot_admin_attempts_total{ip="192.168.1.100"} 5
gateway_honeypot_secrets_attempts_total{ip="10.0.0.50"} 3

# Unique IPs
gateway_honeypot_admin_ips_unique 42
gateway_honeypot_secrets_ips_unique 15
gateway_honeypot_git_ips_unique 28

# Rate limit violations
gateway_honeypot_admin_rate_limit_blocks_total 3
gateway_honeypot_secrets_rate_limit_blocks_total 8

# Content extraction (secrets file)
gateway_honeypot_secrets_content_extracted_total 2

# Detection events
gateway_honeypot_detection_events_total{honeypot_type="admin"} 12
gateway_honeypot_detection_events_total{honeypot_type="secrets"} 5
```

### Frontend Analytics Dashboard

**Honeypot Metrics in WAF Analytics Page**:
- Total probing attempts by type
- Unique source IPs
- Attack patterns (timing, frequency)
- Detected attack tools/scanners
- Geographic distribution (if IP geolocation available)
- Trend charts over time

## Attack Detection Scenarios

### Scenario 1: Automated Scanner

**Pattern**:
```
1. Admin panel probe: /admin (404 expected → 200 found!)
2. Multiple attempts: /admin/login, /admin/panel, /admin/dashboard
3. Rate limit hit: 5+ requests in quick succession
4. Likely tool: Nikto, OWASP ZAP, Burp Scanner
```

**Detection**:
- Rapid sequential requests to admin endpoints
- User-Agent identifies as scanner
- Consistent timing patterns (automated)

**Response**:
- Log as reconnaissance activity
- Update threat score
- Optional: Trigger incident response

### Scenario 2: Secrets Enumeration

**Pattern**:
```
1. Probing common secrets locations:
   - /.env (found!)
   - /config.php (404)
   - /.env.bak (404)
   - /.env.local (404)
2. Attempt to read/download /.env
3. Analyze extracted secrets
```

**Detection**:
- Direct hits on `/env` honeypot
- Low rate limit violations (1 req/min)
- Indicates information gathering phase

**Response**:
- CRITICAL alert (secrets exposure)
- Immediate incident creation
- IP blocking recommended

### Scenario 3: Repository Disclosure

**Pattern**:
```
1. Probe for git directory: /.git (found!)
2. Enumerate git metadata:
   - /.git/config
   - /.git/HEAD
   - /.git/refs/heads/main
3. Attempt to extract repository history
4. Likely tool: Gitjacker, git-dumper
```

**Detection**:
- Sequential requests to git paths
- User-Agent or timing patterns suggest automation
- Attacker analyzing repository structure

**Response**:
- HIGH alert (source code exposure risk)
- Track attacker's enumeration pattern
- Document repository sensitivity

## Integration with Incident Response

### Runbook Triggers

**Honeypot Detection** → Alert → Alertmanager → Incident Bot

**Available Runbooks**:
1. **Admin Panel Honeypot Response**:
   - Notify security team
   - Log detailed forensics
   - Update threat intelligence
   - Optional: Extended monitoring

2. **Secrets File Detection**:
   - CRITICAL priority
   - Immediate IP investigation
   - Credential rotation procedures
   - Forensic analysis

3. **Repository Disclosure Detection**:
   - HIGH priority
   - Source code integrity check
   - Audit log review
   - Commit history analysis

### Alert Rules

```yaml
alert HoneypotAdminProbing
  if: increase(gateway_honeypot_admin_attempts_total[5m]) > 3
  annotations:
    summary: "Admin honeypot probing detected"
    description: "{{ $labels.ip }} attempted {{ $value }} admin accesses"
    severity: "warning"

alert HoneypotSecretsExposure
  if: increase(gateway_honeypot_secrets_content_extracted_total[5m]) > 0
  annotations:
    summary: "CRITICAL: Secrets file accessed"
    description: "IP {{ $labels.ip }} extracted secrets file content"
    severity: "critical"
```

## Frontend Honeypot Attack Scenario

### Honeypot Scan Attack (Attack #8)

**Location**: Attacks page in frontend

**What It Does**:
1. Probes common honeypot locations
2. Attempts admin panel access
3. Tries to read `.env` file
4. Enumerates git directory
5. Reports detection results

**Execution**:
```bash
# Via Web UI
Navigate to /attacks → Select "Honeypot Scan" → Click "Execute Attack"

# Via Python Script
cd attacks/honeypot
python admin_panel_scan.py
python secrets_enum.py
python git_dumper.py
```

**Expected Results**:
- Honeypot hits detected and logged
- Rate limiting enforced
- Incident alerts triggered
- Detailed attack logs returned

**Metrics Updated**:
- `gateway_honeypot_admin_attempts_total`
- `gateway_honeypot_secrets_attempts_total`
- `gateway_honeypot_detection_events_total`

## Best Practices for Honeypot Deployment

### 1. Authenticity
- Make honeypots look real (fake but plausible content)
- Use appropriate response codes and headers
- Include realistic-looking credentials/secrets
- Match expected file formats and structures

### 2. Monitoring
- Log all honeypot interactions
- Track unique source IPs
- Monitor access patterns
- Alert on suspicious behavior

### 3. Analysis
- Correlate honeypot events with other security logs
- Identify attacker profiles
- Track toolkit evolution
- Document attack patterns

### 4. Response
- Don't reveal honeypot's artificial nature (to attacker)
- Continue monitoring after detection
- Collect forensic evidence
- Escalate based on severity

### 5. Educational Value
- Use honeypot interactions to improve defenses
- Train security teams on attacker behavior
- Demonstrate real attack patterns
- Inform threat intelligence

## Configuration & Customization

### Adding New Honeypots

**File**: `vulnerable-services/api-gateway/app/honeypots.py`

```python
HONEYPOT_ENDPOINTS = {
    '/custom-honeypot': {
        'rate_limit': {'requests': 5, 'window': 60},
        'response_handler': 'generate_custom_response',
        'severity': 'medium',
        'category': 'custom'
    }
}

def generate_custom_response():
    return {
        'status': 200,
        'body': 'Custom honeypot content',
        'headers': {'X-Honeypot': 'true'}
    }
```

### Adjusting Rate Limits

Edit `vulnerable-services/api-gateway/app/config.py`:

```python
HONEYPOT_RATE_LIMITS = {
    '/admin': {'requests': 5, 'window': 60},    # 5 req/min
    '/.env': {'requests': 1, 'window': 60},    # 1 req/min (strict)
    '/.git': {'requests': 3, 'window': 60},    # 3 req/min
}
```

### Custom Response Content

Edit honeypot response generators to match your environment:
- Admin panel styling
- Secrets file format
- Git repository structure
- Error messages and hints

## Metrics Query Examples

```bash
# Total honeypot attempts
curl 'http://localhost:9090/api/v1/query?query=gateway_honeypot_admin_attempts_total'

# Rate limit blocks
curl 'http://localhost:9090/api/v1/query?query=gateway_honeypot_admin_rate_limit_blocks_total'

# Unique IPs probing honeypots
curl 'http://localhost:9090/api/v1/query?query=increase(gateway_honeypot_admin_ips_unique[1h])'

# Secrets file extraction attempts
curl 'http://localhost:9090/api/v1/query?query=gateway_honeypot_secrets_content_extracted_total'
```

## Limitations & Considerations

### Current Limitations
1. Honeypots are pattern-based (not true vulnerability)
2. Sophisticated attackers may recognize them
3. Response timing may reveal artificial nature
4. Limited to HTTP endpoints (no network-level honeypots)

### Attacker Evasion Techniques
- Timing-based detection (delays between requests)
- Content analysis (checking for honeypot patterns)
- Behavior deviation (human-like interaction)
- Response validation (checking for real vulnerabilities)

### Recommended Mitigations
- Vary response times and behaviors
- Use realistic server configurations
- Implement monitoring to detect evasion attempts
- Combine with other defense mechanisms

## Related Documentation

- [PHASE_2.5A_ENHANCED_WAF.md](./PHASE_2.5A_ENHANCED_WAF.md) - WAF signatures and filtering
- [../gateway/README.md](../gateway/) - API Gateway architecture
- [../incident-response/](../incident-response/) - Automated incident handling
- [../../attacks/honeypot/README.md](../../attacks/honeypot/) - Attack scripts
- [../../frontend/BATTLE_ARENA_GUIDE.md](../../frontend/BATTLE_ARENA_GUIDE.md) - Battle Arena scenarios

## Future Enhancements

- Network-level honeypots (ports, services)
- Behavioral analysis for evasion detection
- Machine learning for pattern recognition
- Multi-stage honeypot interactions
- Real credential monitoring integration
- Cross-service honeypot correlation
