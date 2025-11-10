# Integration Tests - Phase 2.2

End-to-end tests validating complete flows through the entire microservices architecture.

## Purpose

Integration tests verify:
- Complete authentication flow (login → MFA → JWT)
- JWT validation and routing through API Gateway
- Backend service integration (User Service)
- Security controls across the entire stack
- Metrics and observability end-to-end

Unlike smoke tests (which test individual components), integration tests validate that **all services work together correctly**.

## Test Coverage

### E2E Authentication Flow (`test_e2e_auth_flow.py`)

**Complete Login Flow** (3 steps):
1. ✅ Submit username/password → receive MFA challenge
2. ✅ Submit TOTP code → receive JWT tokens
3. ✅ Tokens are valid JWTs (structure validation)

**Failure Scenarios**:
- ✅ Invalid credentials rejected
- ✅ Invalid MFA code rejected
- ✅ Expired tokens rejected

**Gateway Integration**:
- ✅ Gateway validates JWT before routing
- ✅ Gateway rejects expired/invalid tokens
- ✅ Gateway rejects requests without tokens
- ✅ Protected endpoints accessible with valid JWT

**User Service Access**:
- ✅ Full flow: Auth → Gateway → User Service
- ✅ User profile accessible through Gateway
- ✅ IDOR vulnerability exploitable end-to-end
- ✅ Auth bypass vulnerability accessible

**Security Controls**:
- ✅ Gateway rate limiting protects backends
- ✅ Gateway WAF blocks malicious requests
- ✅ Security headers added by Gateway
- ✅ Direct access vs Gateway comparison

**Observability**:
- ✅ Requests tracked in Gateway metrics
- ✅ Requests tracked in User Service metrics
- ✅ IDOR attacks tracked end-to-end

---

## Running Tests

### Prerequisites

```bash
# Install dependencies
cd tests/integration
pip install -r requirements.txt

# Ensure ALL services are running
docker-compose up -d
docker-compose ps  # Verify all services healthy
```

### Run All Integration Tests

```bash
# From project root
pytest tests/integration/ -v

# Or from tests/integration directory
pytest -v
```

### Run Specific Test Classes

```bash
# Authentication flow only
pytest tests/integration/test_e2e_auth_flow.py::TestE2EAuthenticationFlow -v

# Gateway integration only
pytest tests/integration/test_e2e_auth_flow.py::TestE2EGatewayIntegration -v

# User Service access only
pytest tests/integration/test_e2e_auth_flow.py::TestE2EUserServiceAccess -v

# Security controls only
pytest tests/integration/test_e2e_auth_flow.py::TestE2ESecurityControls -v
```

### Run with Detailed Output

```bash
# Show print statements
pytest tests/integration/ -v -s

# Show full tracebacks
pytest tests/integration/ -v --tb=long

# Stop on first failure
pytest tests/integration/ -v -x
```

---

## Test Scenarios

### Scenario 1: Happy Path Authentication

```
User → Auth Service → MFA Verification → JWT Tokens
```

**Steps**:
1. POST `/auth/login` with valid credentials
2. Receive `challenge_id`
3. POST `/auth/mfa/verify` with TOTP code
4. Receive `access_token` and `refresh_token`

**Expected**: All steps succeed, tokens are valid JWTs

---

### Scenario 2: Protected Resource Access

```
User → Gateway (JWT validation) → User Service → Response
```

**Steps**:
1. Authenticate and get JWT token
2. Request `GET /api/users/profile/1` through Gateway
3. Gateway validates JWT
4. Gateway routes to User Service
5. User Service returns profile data

**Expected**: 200 OK with profile data

---

### Scenario 3: IDOR Exploitation

```
Alice → Gateway → User Service (Bob's profile) → Sensitive Data
```

**Steps**:
1. Authenticate as Alice (user_id=2)
2. Request Bob's profile (user_id=3) through Gateway
3. Gateway validates Alice's JWT (✅ valid)
4. User Service **does NOT check authorization** (vulnerability)
5. Bob's sensitive data returned (SSN, credit card)

**Expected**: 200 OK (vulnerability), metrics track IDOR attempt

---

### Scenario 4: Security Controls

```
Attacker → Gateway → WAF Blocks / Rate Limiter Blocks
```

**Steps**:
1. Send SQL injection payload through Gateway
2. WAF detects and blocks (400)
3. Send 65+ requests in 1 minute
4. Rate limiter blocks (429)

**Expected**: Gateway protects backend services

---

## Test Output Example

```bash
$ pytest tests/integration/ -v

tests/integration/test_e2e_auth_flow.py::TestE2EAuthenticationFlow::test_full_login_flow PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EAuthenticationFlow::test_failed_login_invalid_credentials PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EAuthenticationFlow::test_failed_mfa_invalid_code PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EGatewayIntegration::test_gateway_jwt_validation_and_routing PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EGatewayIntegration::test_gateway_rejects_expired_token PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EGatewayIntegration::test_gateway_rejects_missing_token PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EUserServiceAccess::test_access_user_profile_through_gateway PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EUserServiceAccess::test_idor_exploitation_through_gateway PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EUserServiceAccess::test_auth_bypass_vulnerability PASSED
tests/integration/test_e2e_auth_flow.py::TestE2ESecurityControls::test_gateway_rate_limiting PASSED
tests/integration/test_e2e_auth_flow.py::TestE2ESecurityControls::test_gateway_waf_protection PASSED
tests/integration/test_e2e_auth_flow.py::TestE2ESecurityControls::test_gateway_adds_security_headers PASSED
tests/integration/test_e2e_auth_flow.py::TestE2ESecurityControls::test_direct_access_vs_gateway_comparison PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EMetricsAndObservability::test_end_to_end_request_tracking PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EMetricsAndObservability::test_idor_attack_metrics_tracking PASSED

======================== 15 passed in 22.45s ========================
```

---

## Troubleshooting

### Tests Fail with "Could not authenticate"

**Issue**: `SKIPPED [1] Could not authenticate`

**Solution**:
```bash
# Check auth service
curl http://localhost:8000/health

# Test manual login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Check MFA code generation
docker exec login-api python -c "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())"

# Restart login-api
docker-compose restart login-api
```

### Gateway Connection Refused

**Issue**: `requests.exceptions.ConnectionError: ('Connection aborted.', RemoteDisconnected...)`

**Solution**:
```bash
# Check Gateway status
docker-compose ps api-gateway

# Check Gateway logs
docker-compose logs api-gateway | tail -50

# Restart Gateway
docker-compose restart api-gateway

# Verify Gateway health
curl http://localhost:8080/health
```

### Metrics Not Found

**Issue**: `AssertionError: assert 'gateway_requests_total' in metrics_text`

**Solution**:
```bash
# Check if metrics endpoint works
curl http://localhost:8080/metrics
curl http://localhost:8002/metrics

# Make some requests to generate metrics
curl http://localhost:8080/health

# Check Prometheus is scraping
curl http://localhost:9090/api/v1/targets | jq
```

### Rate Limit Test Hangs

**Issue**: Test takes too long or fails intermittently

**Solution**:
- Rate limit buckets may need time to refill
- Wait 60 seconds between runs
- Run rate limit tests in isolation
- Check `RATE_LIMIT_REQUESTS_PER_MINUTE` in `vulnerable-services/api-gateway/app/config.py`

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start full stack
        run: |
          docker-compose up -d
          sleep 30  # Wait for all services
      
      - name: Check service health
        run: |
          curl -f http://localhost:8000/health || exit 1
          curl -f http://localhost:8080/health || exit 1
          curl -f http://localhost:8002/health || exit 1
      
      - name: Run integration tests
        run: |
          pip install -r tests/integration/requirements.txt
          pytest tests/integration/ -v --tb=short
      
      - name: Show logs on failure
        if: failure()
        run: |
          docker-compose logs api-gateway
          docker-compose logs user-service
          docker-compose logs login-api
```

---

## Comparison: Smoke vs Integration Tests

| Aspect | Smoke Tests | Integration Tests |
|--------|-------------|-------------------|
| **Scope** | Single service | Multiple services |
| **Speed** | Fast (1-2 min) | Slower (3-5 min) |
| **Isolation** | Service-specific | End-to-end flows |
| **Purpose** | "Does it work?" | "Do they work together?" |
| **Complexity** | Simple | Complex |
| **Run Frequency** | Every commit | Before merge |

**When to run**:
- **Smoke**: After every code change, in feature branches
- **Integration**: Before merging to main, in staging environment

---

## Related Documentation

- **Smoke Tests**: [`tests/smoke/README.md`](../smoke/README.md)
- **Gateway Architecture**: [`docs/gateway/README.md`](../../docs/gateway/README.md)
- **User Service**: [`vulnerable-services/user-service/README.md`](../../vulnerable-services/user-service/README.md)
- **Attack Scripts**: [`attacks/`](../../attacks/)
- **Phase 2.1 Tests**: [`monitoring/tests/monitoring_smoke_test.py`](../../monitoring/tests/monitoring_smoke_test.py)

---

**Note**: Integration tests validate that the **entire system** works together, including intentional vulnerabilities. These tests prove that attacks demonstrated in `attacks/` scripts are exploitable through the full architecture.

