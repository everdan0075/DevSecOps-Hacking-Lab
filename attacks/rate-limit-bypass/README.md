# Rate Limit Bypass Attack

## 🎯 Vulnerability

Rate limiting can be bypassed through:
1. **Direct service access** - Bypassing gateway completely (port 8002)
2. **Distributed attacks** - Using multiple IP addresses (botnets, proxies)
3. **Header manipulation** - Rotating User-Agent, X-Forwarded-For (ineffective against IP-based limits)

## ⚠️ Impact

- **Brute force attacks** - Unlimited login attempts
- **DoS (Denial of Service)** - Overwhelming backend services
- **Data scraping** - Extracting all data without throttling
- **Resource exhaustion** - Consuming server capacity

## 🚀 Usage

### Run Attack

```bash
pip install -r requirements.txt
python rate_limit_bypass.py
```

### Expected Output

```
==================================================================
🎭 RATE LIMIT BYPASS ATTACK
==================================================================

[*] Test 1: Testing basic rate limit (15 requests)...
    [ 1] ✓ OK
    [ 2] ✓ OK
    ...
    [11] ✗ 429
    [12] ✗ 429
    
    Summary: 10 OK, 5 Rate Limited

[*] Test 2: Bypass attempt - User-Agent rotation...
    [✓] Rate limit held - Bypass failed

[*] Test 3: Bypass - Direct service access (NO rate limit)...
    [ 1] ✓ OK
    [ 2] ✓ OK
    ...
    [20] ✓ OK
    
    🚨 COMPLETE BYPASS - All 20 requests succeeded!

📊 RATE LIMIT BYPASS ATTACK REPORT
==================================================================
Bypass attempts: 3
Successful bypasses: 2
⚠️ VULNERABILITY: Rate limit can be bypassed!
==================================================================
```

## 🔍 How It Works

### Gateway Rate Limit (Current)

```python
# Per-IP Token Bucket: 60 requests/minute, burst 10
Rate Limit: 60 req/min per IP
Burst Size: 10 simultaneous requests
```

**Limitations**:
- ❌ Only protects Gateway endpoints
- ❌ Backend services (port 8002) are unprotected
- ❌ Single IP tracking (vulnerable to distributed attacks)

### Bypass Technique #1: Direct Access

```bash
# Through Gateway (rate limited)
for i in {1..100}; do
  curl http://localhost:8080/
done
# Result: ~60 succeed, 40 blocked (429)

# Direct to service (NO rate limit)
for i in {1..100}; do
  curl http://localhost:8002/health
done
# Result: ALL 100 succeed! 🚨
```

### Bypass Technique #2: Distributed Attack

```
Attacker controls 10 IPs:
- Each IP: 60 req/min
- Total capacity: 600 req/min
- Amplification: 10x
```

Using proxies/VPN/botnet:
```python
proxies = [
    "http://proxy1:8080",
    "http://proxy2:8080",
    "http://proxy3:8080",
    ...
]

for proxy in proxies:
    # Each proxy has its own rate limit quota
    requests.get(url, proxies={"http": proxy})
```

## 🛡️ Remediation

### 1. Remove Direct Service Access

```yaml
# docker-compose.yml
user-service:
  # ports:
  #   - "8002:8000"  # ❌ REMOVE - don't expose
  networks:
    - internal  # Only accessible within Docker network
```

### 2. Implement mTLS

```python
# Only Gateway has valid client certificate
# Direct access without certificate → Connection refused
```

### 3. Distributed Rate Limiting

Use Redis for shared rate limit state:

```python
import redis
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

# Shared across multiple gateway instances
redis_client = redis.Redis(host="redis")
await FastAPILimiter.init(redis_client)

@app.get("/", dependencies=[Depends(RateLimiter(times=60, seconds=60))])
async def endpoint():
    ...
```

### 4. Advanced Detection

Track multiple signals:
```python
rate_limit_key = f"{ip}:{user_agent}:{token}"  # Composite key
```

Alert on suspicious patterns:
- Same User-Agent across many IPs
- Burst requests from new IPs
- Sequential ID enumeration

### 5. Progressive Challenges

```
Requests 1-50: Normal
Requests 51-100: CAPTCHA required
Requests 101+: Temporary IP ban
```

## 📊 Detection

**Metrics**:
```promql
# Rate limit blocks
gateway_rate_limit_blocks_total

# Successful requests per IP
rate(gateway_requests_total[1m])

# Alert if >100 req/min from single IP
sum(rate(gateway_requests_total[1m])) by (source_ip) > 100
```

**Logs**:
```bash
docker-compose logs api-gateway | grep "rate limit"
```

## 🧪 Testing

### Test Gateway Rate Limit

```powershell
# Burst test
$count429 = 0
for ($i=1; $i -le 20; $i++) {
    $status = curl.exe -s -o $null -w "%{http_code}" http://localhost:8080/
    if ($status -eq "429") { $count429++ }
}
Write-Host "Rate limited: $count429/20"
```

### Test Direct Access Bypass

```bash
# Should NOT be rate limited
for i in {1..100}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8002/health
done | grep -c "200"
# Output: 100 (all succeeded)
```

## 📚 Real-World Examples

### Famous Rate Limit Bypass Attacks

1. **Twitter API** (2020): Rate limit bypass via multiple API keys
2. **GitHub** (2018): Brute force via distributed IPs
3. **AWS** (2019): DDoS via amplification attack

### Common Bypass Techniques

| Technique | Effectiveness | Difficulty |
|-----------|--------------|------------|
| Direct service access | ✅ Very High | Easy |
| Multiple IPs (botnet) | ✅ High | Medium |
| Rotating proxies | ✅ High | Medium |
| User-Agent rotation | ❌ Low | Easy |
| Cookie manipulation | ⚠️ Medium | Medium |

## 💡 Best Practices

1. **Defense in Depth**
   - Rate limit at multiple layers (Gateway, Service, Database)
   - Don't rely solely on IP-based limits

2. **Dynamic Rate Limiting**
   ```python
   # Authenticated users: higher limit
   if user.is_authenticated:
       limit = 1000  # req/hour
   else:
       limit = 100   # req/hour
   ```

3. **Behavioral Analysis**
   - Track request patterns
   - Machine learning for anomaly detection
   - Fingerprinting techniques

4. **Graceful Degradation**
   - Return useful error messages
   - Include `Retry-After` header
   - Suggest alternative endpoints

## 📖 References

- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [Redis Rate Limiting](https://redis.io/docs/reference/patterns/rate-limiting/)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)

---

**DISCLAIMER**: Educational purposes only. Use in controlled lab environment.

