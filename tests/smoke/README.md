# Smoke Tests - Phase 2.2

Quick validation tests for API Gateway and User Service basic functionality.

## Purpose

Smoke tests verify that:
- Services are running and accessible
- Core functionality works as expected
- Intentional vulnerabilities are exploitable (for demo purposes)
- Metrics are properly exposed

## Test Coverage

### Gateway Smoke Tests (`test_gateway.py`)

**Health & Availability**:
- ✅ Health endpoint returns 200
- ✅ Root endpoint provides service info

**Routing**:
- ✅ Routes `/auth/*` to auth-service
- ✅ Routes `/api/users/*` to user-service

**JWT Validation**:
- ✅ Rejects requests without JWT
- ✅ Rejects invalid JWT tokens
- ✅ Accepts valid JWT tokens

**Rate Limiting**:
- ✅ Allows normal traffic
- ✅ Adds rate limit headers
- ✅ Blocks excessive requests (429)

**WAF Protection**:
- ✅ Blocks SQL injection attempts
- ✅ Blocks XSS attempts
- ✅ Blocks path traversal attempts
- ✅ Allows legitimate requests

**Security**:
- ✅ Adds security headers (X-Frame-Options, etc.)
- ✅ Exposes Prometheus metrics

---

### User Service Smoke Tests (`test_user_service.py`)

**Health**:
- ✅ Health endpoint returns 200

**IDOR Vulnerability** (intentional):
- ✅ Users can access other users' profiles
- ✅ Sensitive data exposed (SSN, credit cards)
- ✅ IDOR attempts tracked in metrics

**Auth Bypass Vulnerability** (intentional):
- ✅ `/settings` endpoint accessible without JWT
- ✅ Sensitive settings exposed
- ✅ Unauthorized access tracked in metrics

**Direct Service Access**:
- ✅ Service accessible on port 8002 (bypassing gateway)
- ✅ Direct access tracked in metrics
- ✅ Comparison with gateway access

**Metrics**:
- ✅ Prometheus metrics exposed
- ✅ Metrics include proper labels

---

## Running Tests

### Prerequisites

```bash
# Install dependencies
cd tests/smoke
pip install -r requirements.txt

# Ensure services are running
docker-compose up -d api-gateway user-service login-api
```

### Run All Smoke Tests

```bash
# From project root
pytest tests/smoke/ -v

# Or from tests/smoke directory
pytest -v
```

### Run Specific Test Suites

```bash
# Gateway tests only
pytest tests/smoke/test_gateway.py -v

# User Service tests only
pytest tests/smoke/test_user_service.py -v
```

### Run Specific Test Classes

```bash
# Only JWT validation tests
pytest tests/smoke/test_gateway.py::TestGatewayJWTValidation -v

# Only IDOR tests
pytest tests/smoke/test_user_service.py::TestUserServiceIDOR -v
```

### Skip Slow Tests

Some tests (like rate limit enforcement) are marked as slow:

```bash
# Skip slow tests
pytest tests/smoke/ -v -m "not slow"
```

---

## Test Output Example

```bash
$ pytest tests/smoke/ -v

tests/smoke/test_gateway.py::TestGatewayHealth::test_health_endpoint PASSED
tests/smoke/test_gateway.py::TestGatewayHealth::test_root_endpoint PASSED
tests/smoke/test_gateway.py::TestGatewayRouting::test_route_to_auth_service PASSED
tests/smoke/test_gateway.py::TestGatewayRouting::test_route_to_user_service PASSED
tests/smoke/test_gateway.py::TestGatewayJWTValidation::test_protected_endpoint_without_token PASSED
tests/smoke/test_gateway.py::TestGatewayJWTValidation::test_protected_endpoint_with_invalid_token PASSED
tests/smoke/test_gateway.py::TestGatewayJWTValidation::test_protected_endpoint_with_valid_token PASSED
tests/smoke/test_gateway.py::TestGatewayRateLimiting::test_rate_limit_basic PASSED
tests/smoke/test_gateway.py::TestGatewayRateLimiting::test_rate_limit_headers PASSED
tests/smoke/test_gateway.py::TestGatewayWAF::test_waf_sql_injection_detection PASSED
tests/smoke/test_gateway.py::TestGatewayWAF::test_waf_xss_detection PASSED
tests/smoke/test_gateway.py::TestGatewayWAF::test_waf_path_traversal_detection PASSED
tests/smoke/test_gateway.py::TestGatewayWAF::test_waf_legitimate_request PASSED
tests/smoke/test_gateway.py::TestGatewayMetrics::test_metrics_endpoint PASSED
tests/smoke/test_gateway.py::TestGatewayMetrics::test_metrics_are_updated PASSED
tests/smoke/test_gateway.py::TestGatewaySecurityHeaders::test_security_headers_present PASSED

tests/smoke/test_user_service.py::TestUserServiceHealth::test_health_endpoint PASSED
tests/smoke/test_user_service.py::TestUserServiceIDOR::test_idor_vulnerability_exists PASSED
tests/smoke/test_user_service.py::TestUserServiceIDOR::test_idor_access_own_profile PASSED
tests/smoke/test_user_service.py::TestUserServiceIDOR::test_idor_metrics_tracking PASSED
tests/smoke/test_user_service.py::TestUserServiceAuthBypass::test_settings_auth_bypass_exists PASSED
tests/smoke/test_user_service.py::TestUserServiceAuthBypass::test_settings_metrics_tracking PASSED
tests/smoke/test_user_service.py::TestDirectServiceAccess::test_direct_access_bypasses_gateway PASSED
tests/smoke/test_user_service.py::TestDirectServiceAccess::test_direct_access_vs_gateway PASSED
tests/smoke/test_user_service.py::TestUserServiceMetrics::test_metrics_endpoint PASSED
tests/smoke/test_user_service.py::TestUserServiceMetrics::test_metrics_include_labels PASSED
tests/smoke/test_user_service.py::TestUserServiceVulnerabilityValidation::test_idor_exploitation_complete_flow PASSED
tests/smoke/test_user_service.py::TestUserServiceVulnerabilityValidation::test_auth_bypass_exploitation PASSED

======================== 28 passed in 15.23s ========================
```

---

## Troubleshooting

### Tests Fail with Connection Errors

**Issue**: `requests.exceptions.ConnectionError: ('Connection aborted.', RemoteDisconnected('Remote end closed connection without response'))`

**Solution**:
```bash
# Check if services are running
docker-compose ps

# Restart services
docker-compose restart api-gateway user-service login-api

# Check logs
docker-compose logs api-gateway
docker-compose logs user-service
```

### JWT Token Tests Skip

**Issue**: `SKIPPED [1] tests/smoke/test_gateway.py:90: Could not obtain valid token from auth service`

**Solution**:
```bash
# Verify login-api is running
curl http://localhost:8000/health

# Check if MFA secret is correct
docker exec login-api python -c "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())"

# Test manual login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Rate Limit Test Fails

**Issue**: `AssertionError: Rate limiter did not block excessive requests`

**Solution**:
- Rate limiter may have higher thresholds
- Wait 60 seconds for rate limit reset
- Run test in isolation: `pytest tests/smoke/test_gateway.py::TestGatewayRateLimiting::test_rate_limit_enforcement -v`

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Smoke Tests

on: [push, pull_request]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start services
        run: |
          docker-compose up -d api-gateway user-service login-api redis prometheus
          sleep 10
      
      - name: Run smoke tests
        run: |
          pip install -r tests/smoke/requirements.txt
          pytest tests/smoke/ -v --tb=short
      
      - name: Show logs on failure
        if: failure()
        run: docker-compose logs
```

---

## Related Documentation

- **Gateway Architecture**: [`docs/gateway/README.md`](../../docs/gateway/README.md)
- **User Service README**: [`vulnerable-services/user-service/README.md`](../../vulnerable-services/user-service/README.md)
- **Integration Tests**: [`tests/integration/README.md`](../integration/README.md)
- **Attack Scripts**: [`attacks/`](../../attacks/)

---

**Note**: These smoke tests are designed to verify that intentional vulnerabilities exist and are exploitable. In a real production environment, these tests would fail (by design) to ensure security controls are properly implemented.

