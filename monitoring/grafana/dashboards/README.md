# Grafana Dashboards

This directory contains pre-configured Grafana dashboards for the DevSecOps Hacking Lab. All dashboards are automatically provisioned when Grafana starts.

## 📊 Available Dashboards

### 1. Auth Security (`auth-security.json`)

**Phase**: 2.1  
**Focus**: Authentication & Authorization Monitoring

**Panels**:
- Login success/failure rates
- MFA verification success/failure trends
- JWT token validation metrics
- Failed authentication attempts by reason
- Rate limiting effectiveness
- IP ban events
- Token revocation patterns

**Use Cases**:
- Monitor authentication health
- Detect brute-force attacks
- Track MFA adoption and failures
- Identify token abuse patterns

**Access**: http://localhost:3000/d/auth-security

---

### 2. Attack Visibility (`devsecops-attack-visibility.json`)

**Phase**: 2.2  
**Focus**: Real-time Attack Detection & Visualization

**Panels**:
- **IDOR Exploitation**: 
  - Success/failure attempts
  - Authenticated user → Target user mapping
  - Enumeration pattern detection
- **Direct Service Access**:
  - Gateway bypass attempts
  - Backend services accessed directly
  - Source IP tracking
- **Gateway Security**:
  - Rate limit blocks
  - WAF blocks by attack type (SQLi, XSS, Path Traversal)
  - JWT validation failures with reason breakdown
- **Backend Health**:
  - Service response times
  - Error rates

**Use Cases**:
- Live attack monitoring during demos
- Forensic analysis after attack scripts
- Security control effectiveness validation
- Identify bypasses and vulnerabilities

**Access**: http://localhost:3000/d/devsecops-attack-visibility

---

### 3. Service Mesh Security (`service-mesh-security.json`) ✨ NEW

**Phase**: 2.2  
**Focus**: Microservices Architecture & API Gateway Monitoring

**Layout**: 
- **Top Row**: Request rates + Security gauges (IDOR, Direct Access)
- **Middle Rows**: Detailed attack visualization (IDOR exploitation, Gateway bypasses)
- **Bottom Row**: Security controls (Rate limiting, WAF, JWT validation)
- **Footer**: Service health indicators (UP/DOWN status)

**Key Visualizations**:

1. **Service Request Rates** (Time series)
   - Gateway traffic: `rate(gateway_requests_total[1m])`
   - User Service traffic: `rate(user_service_requests_total[1m])`
   - Compare legitimate vs bypassed traffic

2. **IDOR Attempts Gauge** (Last 5 minutes)
   - Green: <5 attempts
   - Yellow: 5-10 attempts
   - Red: >10 attempts (Alert threshold)

3. **Direct Access Gauge** (Last 5 minutes)
   - Green: <10 bypasses
   - Orange: 10-50 bypasses
   - Red: >50 bypasses (Critical)

4. **IDOR Exploitation Attempts** (Bar chart)
   - Breakdown: `authenticated_user` → `target_user`
   - Identify enumeration patterns

5. **Direct Service Access** (Bar chart)
   - Endpoint accessed + Source IP
   - Detect Gateway bypass attempts

6. **Gateway Security Controls** (Time series)
   - Rate limit blocks
   - WAF blocks by attack type
   - Stacked visualization

7. **JWT Validation** (Time series)
   - Success vs failures
   - Failure reason breakdown (expired, invalid, tampered)

8. **Service Health Status** (Gauges x3)
   - API Gateway: `up{job="api-gateway"}`
   - User Service: `up{job="user-service"}`
   - Auth Service: `up{job="login-api"}`
   - Green = UP, Red = DOWN

**Use Cases**:
- **Operations**: Monitor service mesh health in real-time
- **Security**: Detect Gateway bypass and IDOR attacks
- **Performance**: Track request latency and error rates
- **Demos**: Single pane of glass for Phase 2.2 attack scenarios

**Access**: http://localhost:3000/d/devsecops-service-mesh

---

## 🔄 Dashboard Provisioning

Dashboards are automatically loaded via Grafana provisioning:

1. **Dashboard Location**: `monitoring/grafana/dashboards/`
2. **Provisioning Config**: `monitoring/grafana/provisioning/dashboards/dashboard.yml`
3. **Mount Point**: `/var/lib/grafana/dashboards` (in container)
4. **Update Interval**: 30 seconds

**To add a new dashboard**:
1. Export dashboard JSON from Grafana UI (Share → Export)
2. Save to `monitoring/grafana/dashboards/your-dashboard.json`
3. Set `"id": null` in JSON (allows auto-assignment)
4. Restart Grafana: `docker-compose restart grafana`

---

## 📈 Metrics Reference

### Phase 2.1 Metrics (Auth Service)

```promql
# Login attempts
login_attempts_total{username, result}
login_failed_total{reason}

# MFA
mfa_attempts_total{username, result}
mfa_challenge_created_total

# JWT
jwt_issued_total{token_type}
jwt_refresh_total{status}
jwt_validation_total{endpoint, result}

# Rate limiting & Security
rate_limit_blocks_total
ip_bans_total
```

### Phase 2.2 Metrics (Gateway + User Service)

```promql
# Gateway
gateway_requests_total{method, path, status_code}
gateway_request_duration_seconds{method, path}
gateway_jwt_validation_total{result}
gateway_jwt_validation_failures_total{reason}
gateway_rate_limit_blocks_total
gateway_waf_blocks_total{attack_type}
gateway_backend_requests_total{backend_name, status}
gateway_backend_errors_total{backend_name, error_type}

# User Service
user_service_requests_total{method, endpoint}
user_service_idor_attempts_total{authenticated_user, target_user, result}
user_service_direct_access_total{endpoint, source_ip}
user_service_unauthorized_settings_access_total

# Service Health
up{job="api-gateway"}
up{job="user-service"}
up{job="login-api"}
```

---

## 🎯 Dashboard Usage Tips

### During Attack Demos

1. **Pre-Demo Setup**:
   ```bash
   # Open all dashboards in separate browser tabs
   start http://localhost:3000/d/auth-security
   start http://localhost:3000/d/devsecops-attack-visibility
   start http://localhost:3000/d/devsecops-service-mesh
   
   # Set time range to "Last 15 minutes"
   # Enable auto-refresh (5s or 10s)
   ```

2. **Run Attack Scripts** (separate terminal):
   ```bash
   cd attacks/idor-exploit
   python idor_attack.py
   
   cd attacks/direct-access
   python direct_access_attack.py
   ```

3. **Watch Metrics Update**:
   - IDOR gauge should spike (yellow/red)
   - Direct Access gauge should increase
   - Bar charts show attack details
   - Alerts should trigger in Alertmanager

### Troubleshooting

**Dashboard not loading?**
```bash
# Check Grafana logs
docker-compose logs grafana | grep -i error

# Verify dashboard file exists
ls -la monitoring/grafana/dashboards/

# Restart Grafana
docker-compose restart grafana
```

**No data in panels?**
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job, health}'

# Test metric query
curl 'http://localhost:9090/api/v1/query?query=up'

# Check service is exposing metrics
curl http://localhost:8080/metrics  # API Gateway
curl http://localhost:8002/metrics  # User Service (direct access)
```

**Metrics stale/not updating?**
- Check service health: `docker-compose ps`
- Verify Prometheus scrape interval: `monitoring/prometheus/prometheus.yml`
- Default scrape: 15s (metrics update every 15 seconds)

---

## 🔗 Related Documentation

- **Monitoring Guide**: [`docs/monitoring/README.md`](../../docs/monitoring/README.md)
- **Alert Rules**: [`monitoring/prometheus/alert_rules.yml`](../../monitoring/prometheus/alert_rules.yml)
- **Gateway Architecture**: [`docs/gateway/README.md`](../../docs/gateway/README.md)
- **Phase 2.1 Implementation**: [`docs/auth/PHASE_2.1_IMPLEMENTATION.md`](../../docs/auth/PHASE_2.1_IMPLEMENTATION.md)

---

## 📝 Dashboard Maintenance

**Version Control**:
- All dashboards are tracked in Git
- Export JSON after UI changes: Share → Export → Save for External Use
- Commit changes with descriptive message

**Best Practices**:
- Use template variables for dynamic filters
- Set reasonable time ranges (5m-1h for attacks, 24h for trends)
- Add annotations for important events
- Use consistent color schemes (green=good, yellow=warning, red=critical)
- Document custom queries in panel descriptions

**Performance**:
- Avoid very short scrape intervals (<5s)
- Use `rate()` or `increase()` for counters, not raw values
- Limit time range for heavy queries
- Use recording rules for complex PromQL (if needed)

