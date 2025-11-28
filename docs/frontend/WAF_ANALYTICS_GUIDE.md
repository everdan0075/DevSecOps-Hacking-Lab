# WAF Analytics Dashboard Guide

**Status**: Implemented (Phase 2.6B)
**Location**: `/waf` page in frontend
**Component**: Frontend WAF Analytics Dashboard

## Overview

The WAF Analytics dashboard provides comprehensive visibility into Web Application Firewall (WAF) operations, including real-time attack detection, rate limiting metrics, and User-Agent filtering. It serves as a security operations center (SOC) tool for monitoring gateway defenses.

## Dashboard Sections

### 1. Signature Breakdown

**Display**: 28 WAF Signatures organized by category

**Categories**:

#### SQL Injection (8 signatures)
- UNION/SELECT injection detection
- Boolean-based blind injection
- Comment-based injection (--,  #)
- DDL/DML injection (DROP, INSERT, UPDATE, DELETE)
- Stored procedure execution
- Time-based blind injection (SLEEP, BENCHMARK, WAITFOR)
- Advanced encodings

**Severity**: CRITICAL, HIGH, MEDIUM

#### Cross-Site Scripting - XSS (7 signatures)
- Script tag injection (`<script>`)
- JavaScript protocol handlers (`javascript:`)
- Event handler injection (`onload=`, `onerror=`)
- Iframe injection (`<iframe>`)
- Image/SVG XSS (`<img src=`, `<svg>`)
- Function calls (`eval()`, `setTimeout()`)
- DOM manipulation (`document.cookie`, `document.write`)

**Severity**: HIGH, MEDIUM

#### Command Injection (4 signatures)
- Shell metacharacters (`;`, `|`, `` ` ``, `$()`)
- Command substitution (`$()`, backticks)
- Reverse shell patterns
- Shell invocation (`/bin/bash`, `/bin/sh`)

**Severity**: CRITICAL, HIGH

#### Path Traversal (3 signatures)
- Directory traversal (`../`, `..\\`)
- System file access (`/etc/passwd`, `/windows/system32`)
- URL-encoded traversal (`%2e%2e/`)

**Severity**: HIGH, MEDIUM

#### XXE - XML External Entity (2 signatures)
- XML entity declaration
- External entity reference

**Severity**: CRITICAL

#### SSRF - Server-Side Request Forgery (2 signatures)
- Internal network targets (localhost, 192.168.x.x, 10.x.x.x)
- Protocol-based SSRF (file://, dict://, gopher://)

**Severity**: CRITICAL, HIGH

#### LDAP Injection (1 signature)
- LDAP query injection patterns

**Severity**: MEDIUM

#### Template Injection (1 signature)
- Server-side template injection (Jinja2, ERB, etc.)

**Severity**: MEDIUM

**Visualization**:
- Pie chart showing distribution by category
- Bar chart showing detection counts
- Filter by severity level
- Click-through to detailed patterns

### 2. Blocked Patterns

**Real-time Detection Display**:

**Top Blocked Patterns (last 24 hours)**:
- Pattern name/signature matched
- Number of detections
- Source IP address(es)
- Timestamp of most recent detection
- Block reason (rate limit vs. signature)

**Metrics Shown**:
- Unique source IPs attempting each pattern
- Attack frequency trends
- Geographic distribution (if IP geolocation enabled)
- User-Agent of attacking client

**Interactions**:
- Click pattern to drill-down into attempts
- View detailed WAF logs
- See geographic distribution
- Filter by time range
- Export blocked patterns list

### 3. Rate Limit Monitoring

**Per-Endpoint Configuration Table**:

| Endpoint | Requests/Min | Burst | Current Rate | Status |
|----------|------------|--------|-------------|--------|
| `/auth/login` | 10 | 3 | 5 req/min | OK |
| `/auth/mfa/verify` | 15 | 5 | 3 req/min | OK |
| `/auth/token/refresh` | 20 | 10 | 8 req/min | OK |
| `/api/users/profile/*` | 30 | 15 | 12 req/min | OK |
| `/api/users/settings` | 20 | 10 | 4 req/min | OK |
| `/admin*` (honeypot) | 5 | 2 | 2 req/min | WARNING |
| `/.env` (honeypot) | 1 | 1 | 0 req/min | OK |

**Columns**:
- **Endpoint**: Route pattern
- **Requests/Min**: Configured limit
- **Burst**: Allowed burst size
- **Current Rate**: Real-time request rate
- **Status**: OK/WARNING/ALERT
- **Blocks (24h)**: Number of rate limit blocks

**Visual Indicators**:
- Green: Operating normally
- Yellow: Warning (50%+ of limit)
- Red: Alert (exceeded or near limit)

**Interactions**:
- See individual endpoint details
- View blocked IP addresses
- Check block reasons
- Analyze attack patterns
- Adjust limits (admin feature)

### 4. User-Agent Filtering

**Blocked User-Agents**:

**Security Scanners**:
- Nikto (vulnerability scanner)
- Nmap (network mapper)
- Masscan (port scanner)
- ZGrab (service grabber)
- Sqlmap (SQL injection tool)
- Havij (SQL injection tool)
- Acunetix (web vulnerability scanner)
- Nessus (vulnerability scanner)
- OpenVAS (open source vulnerability scanner)
- w3af (web attack framework)
- Burp (penetration testing tool)
- Metasploit (exploitation framework)

**Scrapers**:
- Scrapy (Python scraping framework)
- Bare python-requests (without version)
- Bare curl (without version)
- Bare wget (without version)

**Malicious Bots**:
- Semrush (aggressive crawler)
- Ahrefs (aggressive SEO crawler)
- MJ12Bot (suspicious crawler)
- DotBot (crawler)

**Whitelisted Good Bots**:
- Googlebot (Google search)
- BingBot (Bing search)
- DuckDuckGo (DDG search)
- SlackBot (Slack integration)
- TwitterBot (Twitter/X integration)
- FacebookExternalHit (Facebook crawl)
- UptimeRobot (uptime monitoring)
- Pingdom (uptime monitoring)

**Metrics**:
- `gateway_user_agent_blocks_total{agent}` - Blocks by agent
- `gateway_user_agent_allowed_total{agent}` - Allowed good bots

**Display**:
- List of blocked User-Agents
- Detection counts for each
- Most recent hits
- Filter by category (scanner, scraper, bot)
- Real-time block rate

### 5. Historical Trends

**Time-Series Charts**:

**Attack Category Trends** (past 7 days):
- Daily detection counts by signature category
- Line chart with multiple series (one per category)
- Hover for detailed counts
- Identify spike patterns

**WAF Block Rate** (past 24 hours):
- Blocks per hour
- Rate limit vs. signature-based blocks
- Peak times identification
- Anomaly detection

**Top Attack Sources** (past 24 hours):
- Source IPs with most blocks
- Attack vector per IP
- Geographic distribution
- Block reason distribution

**User-Agent Detections** (past 7 days):
- Scanner detection trends
- Bad bot activity
- Scraper prevalence
- Good bot baseline

## Key Metrics

### Prometheus Queries

```prometheus
# Total WAF blocks
gateway_waf_blocks_total

# Blocks by category
gateway_waf_blocks_total{category="sql_injection"}
gateway_waf_blocks_total{category="xss"}
gateway_waf_blocks_total{category="command_injection"}

# Rate limit blocks
gateway_rate_limit_blocks_total{endpoint="/auth/login"}

# User-Agent blocks
gateway_user_agent_blocks_total{agent="sqlmap"}

# Suspicious patterns detected
gateway_waf_suspicious_patterns_total
```

### Frontend Metrics Visualization

**Real-time Gauges**:
- Total blocks (24h)
- Block rate (blocks/min)
- Active rate limit violations
- Unique attacking IPs

**Counters**:
- SQL Injection attempts: 234
- XSS attempts: 89
- Path Traversal attempts: 45
- Command Injection attempts: 12
- Other: 18

## Usage Patterns

### For Security Analysts

1. **Identify Attack Patterns**:
   - Review "Top Blocked Patterns" for trending attacks
   - Analyze geographical distribution
   - Identify attack tools/scanners

2. **Investigate Rate Limit Violations**:
   - Check which endpoints are targeted
   - Identify brute force attempts
   - Correlate with login failures

3. **Monitor User-Agent Filtering**:
   - Track scanner activity
   - Detect new attacking tools
   - Monitor bot traffic

4. **Create Alerts**:
   - Set thresholds for spike detection
   - Alert on zero-day pattern matches
   - Monitor honeypot interactions

### For DevOps/Platform Engineers

1. **Optimize Rate Limits**:
   - Review current vs. configured limits
   - Identify legitimate users being blocked
   - Adjust burst sizes if needed

2. **Troubleshoot Legitimate Traffic**:
   - Identify false positives
   - Whitelist legitimate scanners/crawlers
   - Fine-tune WAF rules

3. **Capacity Planning**:
   - Monitor WAF processing load
   - Identify performance bottlenecks
   - Plan for traffic growth

4. **Tuning Defenses**:
   - Review signature effectiveness
   - Enable/disable low-value signatures
   - Adjust severity classifications

### For Incident Response

1. **Rapid Investigation**:
   - Identify attack source IP
   - Determine attack vector
   - Review attack timeline

2. **Evidence Collection**:
   - Export blocked patterns for analysis
   - Generate forensic reports
   - Document attack chain

3. **Remediation**:
   - Block IP addresses
   - Disable bypassed signatures
   - Rotate potentially exposed credentials

## Integration with Other Dashboards

### Monitoring Dashboard
- See WAF blocks in context of other security events
- Correlate with failed login attempts
- Track incident timeline

### SIEM Dashboard
- Threat scoring incorporates WAF activity
- Attack pattern detection uses WAF data
- Defense effectiveness includes WAF metrics

### Battle Arena
- WAF is defense mechanism in battles
- See successful/blocked attacks
- Analyze defense response times

## Advanced Features

### Export Capabilities

**Export Formats**:
- CSV: Blocked patterns, rate limits, User-Agents
- JSON: Complete metrics and metadata
- PDF: Dashboard snapshot with charts

**Export Options**:
- Custom date ranges
- Filter by category
- Include/exclude summary statistics

### Custom Views

**Saved Filters**:
- Create views for specific attack types
- Save alert thresholds
- Bookmark common queries

**Drill-Down Analysis**:
- Click signatures to see detailed patterns
- Inspect specific source IPs
- Review request headers/payloads

### Alerting Integration

**Alert Conditions**:
- SQL Injection spike: >10 attempts in 5 min
- XSS attempts: >5 in 5 min
- Rate limit violations: >20 blocks in 5 min
- Scanner detection: Known tool User-Agent
- Honeypot interaction: Any access to admin/secrets

**Notification Channels**:
- Email
- Slack (if configured)
- PagerDuty (if integrated)
- Dashboard indicators

## Performance Considerations

### Metric Collection
- Aggregated every 10 seconds
- Stored in Prometheus (15 day retention)
- Summarized for long-term storage

### Dashboard Load Times
- Initial load: <2 seconds
- Chart updates: Real-time (5s refresh)
- Drill-down queries: <1 second
- Large date ranges: May take 5-10 seconds

### Data Retention
- Raw metrics: 15 days
- Summarized data: 90 days
- Incident reports: 1 year

## Troubleshooting

### Issue: No WAF Data Showing

**Possible Causes**:
1. Gateway not running → Check docker-compose status
2. Metrics not exported → Verify `/metrics` endpoint
3. Prometheus not scraping → Check Prometheus targets
4. Dashboard not querying → Check browser console for errors

**Solutions**:
1. Restart gateway: `docker-compose restart api-gateway`
2. Force metrics refresh: Run attack scenario to generate events
3. Check Prometheus: http://localhost:9090/targets
4. Clear browser cache and reload

### Issue: Rate Limit Data Stale

**Possible Causes**:
1. Real-time query failing
2. Prometheus cache
3. Dashboard not refreshing

**Solutions**:
1. Manually trigger traffic to refresh metrics
2. Refresh browser (Ctrl+F5)
3. Check Prometheus query performance

### Issue: Missing Attack Signatures

**Possible Causes**:
1. Gateway not detecting attacks
2. Metrics configuration missing
3. WAF disabled

**Solutions**:
1. Run attack scenario to test
2. Check gateway logs: `docker-compose logs api-gateway`
3. Verify WAF_ENABLED=true in .env

## Related Documentation

- [PHASE_2.5A_ENHANCED_WAF.md](./PHASE_2.5A_ENHANCED_WAF.md) - WAF implementation details
- [HONEYPOT_PROTECTION.md](./HONEYPOT_PROTECTION.md) - Honeypot endpoints and detection
- [../../vulnerable-services/api-gateway/README.md](../../vulnerable-services/api-gateway/README.md) - Gateway architecture
- [../../monitoring/incident-bot/README.md](../../monitoring/incident-bot/README.md) - Incident response integration

## Future Enhancements

- Machine learning for anomaly detection
- Predictive threat analysis
- Custom signature creation UI
- Real-time payload inspection
- Integration with threat intelligence feeds
- Advanced correlation analysis
- False positive reduction
- Signature tuning recommendations
