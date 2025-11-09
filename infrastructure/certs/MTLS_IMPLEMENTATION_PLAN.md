# mTLS Implementation Plan - Phase 2.2 (Future Work)

## 📋 Current Status

✅ **COMPLETED**:
- Self-signed CA certificate generated
- Service certificates generated (gateway, auth-service, user-service)
- Certificate infrastructure ready (`infrastructure/certs/`)
- Documentation (`README.md`)
- Scripts for certificate generation (`.sh` and `.ps1`)

⏸️ **NOT IMPLEMENTED YET**:
- Services don't use HTTPS yet (still HTTP)
- Gateway doesn't send client certificates
- No SSL/TLS handshake validation

---

## 🎯 Why Implement mTLS?

### Security Benefits

1. **Mutual Authentication**
   - Server verifies client identity (not just username/password)
   - Client verifies server identity (prevents MITM attacks)
   - Protection against service impersonation

2. **Zero Trust Architecture**
   - Every service-to-service call is authenticated
   - No implicit trust based on network location
   - Defense in depth strategy

3. **Encrypted Communication**
   - All traffic between services is encrypted
   - Protection against eavesdropping on internal network
   - Compliance with security standards (PCI DSS, HIPAA)

### Educational Value for Portfolio

- ✅ Shows understanding of **PKI (Public Key Infrastructure)**
- ✅ Demonstrates **microservices security** best practices
- ✅ Real-world **zero-trust** architecture implementation
- ✅ SSL/TLS troubleshooting experience
- ✅ Certificate lifecycle management

---

## 📝 Implementation Steps

### Step 1: Configure Auth Service (login-api) for HTTPS

**File**: `vulnerable-services/login-api/app/main.py`

**Changes**:
```python
import ssl

# Create SSL context
ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
ssl_context.load_cert_chain(
    certfile="/certs/auth-service/cert.pem",
    keyfile="/certs/auth-service/key.pem"
)
ssl_context.load_verify_locations("/certs/ca/ca-cert.pem")
ssl_context.verify_mode = ssl.CERT_REQUIRED  # Require client certificate

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8443,  # HTTPS port
        ssl_keyfile="/certs/auth-service/key.pem",
        ssl_certfile="/certs/auth-service/cert.pem",
        ssl_ca_certs="/certs/ca/ca-cert.pem",
        ssl_cert_reqs=ssl.CERT_REQUIRED
    )
```

**Docker Changes** (`docker-compose.yml`):
```yaml
login-api:
  ports:
    - "8443:8443"  # Changed from 8000:8000
  volumes:
    - ./infrastructure/certs/ca/ca-cert.pem:/certs/ca/ca-cert.pem:ro
    - ./infrastructure/certs/services/auth-service/cert.pem:/certs/auth-service/cert.pem:ro
    - ./infrastructure/certs/services/auth-service/key.pem:/certs/auth-service/key.pem:ro
```

**Estimated Effort**: 15-20 tool calls

---

### Step 2: Configure User Service for HTTPS

**File**: `vulnerable-services/user-service/app/main.py`

**Changes**:
```python
import ssl

ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
ssl_context.load_cert_chain(
    certfile="/certs/user-service/cert.pem",
    keyfile="/certs/user-service/key.pem"
)
ssl_context.load_verify_locations("/certs/ca/ca-cert.pem")
ssl_context.verify_mode = ssl.CERT_REQUIRED

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8443,  # HTTPS port
        ssl_keyfile="/certs/user-service/key.pem",
        ssl_certfile="/certs/user-service/cert.pem",
        ssl_ca_certs="/certs/ca/ca-cert.pem",
        ssl_cert_reqs=ssl.CERT_REQUIRED
    )
```

**Docker Changes** (`docker-compose.yml`):
```yaml
user-service:
  ports:
    - "8444:8443"  # External: 8444, Internal: 8443
  volumes:
    - ./infrastructure/certs/ca/ca-cert.pem:/certs/ca/ca-cert.pem:ro
    - ./infrastructure/certs/services/user-service/cert.pem:/certs/user-service/cert.pem:ro
    - ./infrastructure/certs/services/user-service/key.pem:/certs/user-service/key.pem:ro
```

**Estimated Effort**: 15-20 tool calls

---

### Step 3: Configure API Gateway as mTLS Client

**File**: `vulnerable-services/api-gateway/app/main.py`

**Changes**:
```python
import httpx
import ssl

# Create SSL context for outgoing requests
ssl_context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
ssl_context.load_cert_chain(
    certfile="/certs/gateway/cert.pem",
    keyfile="/certs/gateway/key.pem"
)
ssl_context.load_verify_locations("/certs/ca/ca-cert.pem")

# HTTP Client for backend requests with mTLS
http_client = httpx.AsyncClient(
    timeout=30.0,
    verify="/certs/ca/ca-cert.pem",  # Verify server certificates
    cert=("/certs/gateway/cert.pem", "/certs/gateway/key.pem")  # Client certificate
)
```

**Config Changes** (`vulnerable-services/api-gateway/app/config.py`):
```python
# Change URLs from http:// to https://
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "https://login-api:8443")
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "https://user-service:8443")
```

**Docker Changes** (`docker-compose.yml`):
```yaml
api-gateway:
  environment:
    - AUTH_SERVICE_URL=https://login-api:8443
    - USER_SERVICE_URL=https://user-service:8443
  volumes:
    - ./infrastructure/certs/ca/ca-cert.pem:/certs/ca/ca-cert.pem:ro
    - ./infrastructure/certs/services/gateway/cert.pem:/certs/gateway/cert.pem:ro
    - ./infrastructure/certs/services/gateway/key.pem:/certs/gateway/key.pem:ro
```

**Estimated Effort**: 20-25 tool calls

---

### Step 4: Update Health Checks

**Problem**: Docker healthchecks use `curl` which doesn't have certificates

**Solution 1** - Disable certificate verification in healthcheck:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "-k", "https://localhost:8443/health"]  # -k = insecure
```

**Solution 2** - Use Python healthcheck script:
```yaml
healthcheck:
  test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
```

**Solution 3** - Keep internal HTTP endpoint for healthchecks:
```python
# Separate HTTP port for internal healthchecks only
@app.get("/internal/health")  # On port 8000
async def internal_health():
    return {"status": "healthy"}
```

**Estimated Effort**: 10 tool calls

---

### Step 5: Testing & Debugging

**Test SSL Handshake**:
```bash
# Test connection from host
openssl s_client -connect localhost:8443 \
  -CAfile infrastructure/certs/ca/ca-cert.pem \
  -cert infrastructure/certs/services/gateway/cert.pem \
  -key infrastructure/certs/services/gateway/key.pem
```

**Test through Gateway**:
```powershell
# Should still work through gateway (gateway handles mTLS)
curl.exe http://localhost:8080/health
```

**Common Issues to Debug**:
1. Certificate verification failed
2. SSL handshake timeout
3. Wrong certificate CN (Common Name)
4. Expired certificates
5. Missing CA certificate

**Estimated Effort**: 15-20 tool calls (debugging)

---

### Step 6: Add mTLS Metrics

**File**: `vulnerable-services/api-gateway/app/metrics.py`

**New Metrics**:
```python
gateway_mtls_handshake_total = Counter(
    "gateway_mtls_handshake_total",
    "Total mTLS handshakes attempted",
    ["backend", "result"]  # result: success, failed, timeout
)

gateway_mtls_certificate_validation_total = Counter(
    "gateway_mtls_certificate_validation_total",
    "Certificate validation results",
    ["backend", "validation_type", "result"]  # validation_type: expiry, cn, signature
)
```

**Estimated Effort**: 10 tool calls

---

### Step 7: Documentation Updates

**Files to Update**:
- `TEST_COMMANDS.md` - Update with HTTPS URLs
- `README.md` - Add mTLS section
- `docs/gateway/README.md` - Architecture diagram with mTLS
- `infrastructure/certs/README.md` - Add implementation status

**Estimated Effort**: 10 tool calls

---

## 📊 Total Effort Estimate

| Task | Tool Calls | Difficulty | Priority |
|------|-----------|-----------|----------|
| Auth Service HTTPS | 15-20 | Medium | High |
| User Service HTTPS | 15-20 | Medium | High |
| Gateway mTLS Client | 20-25 | Medium-High | High |
| Health Checks | 10 | Low | Medium |
| Testing & Debugging | 15-20 | High | High |
| Metrics | 10 | Low | Low |
| Documentation | 10 | Low | Medium |
| **TOTAL** | **95-125** | **Medium-High** | - |

**Time Estimate**: 2-3 hours of focused implementation (if no major issues)

---

## 🎯 Benefits Summary

### Security Improvements

| Without mTLS | With mTLS |
|--------------|-----------|
| Anyone can call backend services directly | Only Gateway can call backends |
| No encryption between services | All traffic encrypted |
| Network-based security only | Certificate-based authentication |
| Single point of failure (Gateway bypass) | Defense in depth |

### Attack Scenarios Prevented

1. **Direct Service Access**
   - Currently: `curl http://localhost:8002/profile/1` works
   - With mTLS: Connection refused (no valid certificate)

2. **Service Impersonation**
   - Currently: Attacker can pretend to be Gateway
   - With mTLS: Requires valid certificate signed by CA

3. **Man-in-the-Middle**
   - Currently: Traffic is plaintext HTTP
   - With mTLS: Encrypted TLS 1.3

4. **Network Sniffing**
   - Currently: Passwords/tokens visible in network capture
   - With mTLS: All traffic encrypted

---

## 🚀 Quick Start (When Ready to Implement)

### Prerequisites
1. Ensure certificates are generated (`infrastructure/certs/services/`)
2. Backup current working version: `git tag backup-before-mtls`
3. Update all services in one go (all-or-nothing approach)

### Implementation Order
1. ✅ Certificates (DONE)
2. 🔄 Backend services (auth + user) - switch to HTTPS
3. 🔄 Gateway client - add mTLS support
4. 🔄 Health checks - update or add internal endpoint
5. 🔄 Test complete flow
6. 🔄 Add metrics
7. 🔄 Update documentation

### Rollback Plan
```bash
# If mTLS doesn't work, rollback:
git reset --hard backup-before-mtls
docker-compose down
docker-compose up -d
```

---

## 📚 References

- [HTTPX SSL/TLS Documentation](https://www.python-httpx.org/advanced/#ssl-certificates)
- [Uvicorn HTTPS Configuration](https://www.uvicorn.org/deployment/#running-with-https)
- [Python SSL Module](https://docs.python.org/3/library/ssl.html)
- [mTLS Best Practices - Cloudflare](https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/)
- [OWASP Transport Layer Protection](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)

---

## 💡 Alternative: Service Mesh (Future Consideration)

Instead of implementing mTLS manually in each service, consider:

**Istio / Linkerd** (Service Mesh):
- Automatic mTLS between all services
- No code changes required
- Built-in observability
- Traffic management (retries, timeouts, circuit breakers)

**Pros**:
- Zero code changes
- Automatic certificate rotation
- Advanced features (traffic splitting, canary deployments)

**Cons**:
- Additional complexity
- Resource overhead
- Kubernetes required (most service meshes)

**Learning Value**: Even higher (shows knowledge of modern cloud-native patterns)

---

## ✅ Current Achievement

Even without full implementation, you have:
- ✅ Working PKI infrastructure
- ✅ Understanding of certificate generation
- ✅ Ready-to-use certificates for all services
- ✅ Scripts for certificate lifecycle management
- ✅ Documentation of security architecture

**Portfolio Value**: Shows you understand the concept and have infrastructure ready!

---

## 📝 Next Steps Recommendation

**For DevSecOps Lab Project**:
1. ✅ Keep certificates (infrastructure ready)
2. 🚀 Focus on **Attack Scripts** (demonstrate vulnerabilities)
3. 🚀 Create **Documentation & Diagrams** (showcase architecture)
4. 🚀 Add **Alerting** for detected attacks
5. 🚀 Create **Smoke Tests** (CI/CD ready)
6. ⏸️ Save mTLS implementation for future iteration

**Why?** 
- Attack scripts show immediate security value
- Docs make project portfolio-ready
- mTLS can be "future work" (shows planning skills)

---

**Author**: AI Assistant  
**Date**: 2025-11-10  
**Status**: Planning Document - Implementation Pending

