# Test Suite - DevSecOps Hacking Lab

Comprehensive test suite for Phase 2.2 (API Gateway & Microservices).

## Test Structure

```
tests/
├── smoke/              # Fast component tests
│   ├── test_gateway.py           # API Gateway smoke tests
│   ├── test_user_service.py      # User Service smoke tests
│   ├── requirements.txt
│   └── README.md
└── integration/        # End-to-end tests
    ├── test_e2e_auth_flow.py     # Complete auth flow tests
    ├── requirements.txt
    └── README.md
```

## Test Types

### 🔥 Smoke Tests

**Purpose**: Fast validation that services are running and core functionality works

**Coverage**:
- Gateway: Health, routing, JWT, rate limiting, WAF, metrics
- User Service: Health, IDOR, auth bypass, direct access, metrics

**Speed**: ~1-2 minutes  
**Frequency**: Every commit

**Run**:
```bash
pytest tests/smoke/ -v
```

**See**: [`tests/smoke/README.md`](smoke/README.md)

---

### 🔗 Integration Tests

**Purpose**: Validate complete flows through entire microservices architecture

**Coverage**:
- Complete authentication (login → MFA → JWT)
- Gateway routing and JWT validation
- User Service access through Gateway
- Security controls (rate limiting, WAF)
- End-to-end metrics tracking

**Speed**: ~3-5 minutes  
**Frequency**: Before merge

**Run**:
```bash
pytest tests/integration/ -v
```

**See**: [`tests/integration/README.md`](integration/README.md)

---

## Quick Start

### 1. Install Dependencies

```bash
# Smoke tests
pip install -r tests/smoke/requirements.txt

# Integration tests
pip install -r tests/integration/requirements.txt

# Or install both
pip install -r tests/smoke/requirements.txt -r tests/integration/requirements.txt
```

### 2. Start Services

```bash
# Start all services
docker-compose up -d

# Verify health
curl http://localhost:8000/health  # Auth Service
curl http://localhost:8080/health  # API Gateway
curl http://localhost:8002/health  # User Service
```

### 3. Run Tests

```bash
# All tests
pytest tests/ -v

# Smoke tests only
pytest tests/smoke/ -v

# Integration tests only
pytest tests/integration/ -v
```

---

## Test Coverage Summary

| Component | Smoke Tests | Integration Tests | Total |
|-----------|-------------|-------------------|-------|
| **Gateway** | 16 tests | 13 tests | 29 |
| **User Service** | 12 tests | Included in E2E | 12 |
| **Auth Flow** | - | 15 tests | 15 |
| **Total** | **28 tests** | **15 tests** | **43 tests** |

---

## Running Tests

### Run All Tests

```bash
# From project root
pytest tests/ -v

# With detailed output
pytest tests/ -v -s

# Stop on first failure
pytest tests/ -v -x
```

### Run Specific Test Files

```bash
# Gateway smoke tests
pytest tests/smoke/test_gateway.py -v

# User Service smoke tests
pytest tests/smoke/test_user_service.py -v

# E2E integration tests
pytest tests/integration/test_e2e_auth_flow.py -v
```

### Run Specific Test Classes

```bash
# Gateway JWT validation tests
pytest tests/smoke/test_gateway.py::TestGatewayJWTValidation -v

# IDOR tests
pytest tests/smoke/test_user_service.py::TestUserServiceIDOR -v

# E2E authentication flow
pytest tests/integration/test_e2e_auth_flow.py::TestE2EAuthenticationFlow -v
```

### Run Specific Test Methods

```bash
# Single test
pytest tests/smoke/test_gateway.py::TestGatewayWAF::test_waf_sql_injection_detection -v
```

### Skip Slow Tests

```bash
# Skip tests marked as slow (e.g., rate limit enforcement)
pytest tests/ -v -m "not slow"
```

---

## Test Output

### Successful Run

```bash
$ pytest tests/ -v

tests/smoke/test_gateway.py::TestGatewayHealth::test_health_endpoint PASSED
tests/smoke/test_gateway.py::TestGatewayHealth::test_root_endpoint PASSED
tests/smoke/test_gateway.py::TestGatewayRouting::test_route_to_auth_service PASSED
...
tests/integration/test_e2e_auth_flow.py::TestE2EAuthenticationFlow::test_full_login_flow PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EGatewayIntegration::test_gateway_jwt_validation_and_routing PASSED
...

======================== 43 passed in 35.67s ========================
```

### With Failures

```bash
$ pytest tests/smoke/ -v

tests/smoke/test_gateway.py::TestGatewayHealth::test_health_endpoint FAILED
...
FAILED tests/smoke/test_gateway.py::TestGatewayHealth::test_health_endpoint - requests.exceptions.ConnectionError

======================== 1 failed, 27 passed in 15.23s ========================
```

---

## Continuous Integration

### GitHub Actions

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Start services
        run: |
          docker-compose up -d
          sleep 30
      
      - name: Install dependencies
        run: |
          pip install -r tests/smoke/requirements.txt
          pip install -r tests/integration/requirements.txt
      
      - name: Run smoke tests
        run: pytest tests/smoke/ -v --tb=short
      
      - name: Run integration tests
        run: pytest tests/integration/ -v --tb=short
      
      - name: Show logs on failure
        if: failure()
        run: docker-compose logs
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
echo "Running smoke tests..."
pytest tests/smoke/ -v -x || exit 1
echo "✅ All tests passed"
```

---

## Troubleshooting

### Common Issues

#### 1. Connection Errors

**Symptom**: `requests.exceptions.ConnectionError`

**Solution**:
```bash
# Check services
docker-compose ps

# Restart services
docker-compose restart api-gateway user-service login-api

# Check logs
docker-compose logs api-gateway
```

#### 2. Authentication Failures

**Symptom**: `SKIPPED: Could not obtain valid token`

**Solution**:
```bash
# Test auth manually
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Verify MFA
docker exec login-api python -c "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB').now())"
```

#### 3. Rate Limit Tests Fail

**Symptom**: `AssertionError: Rate limiter did not block`

**Solution**:
- Wait 60 seconds for rate limit reset
- Run test in isolation
- Check `RATE_LIMIT_REQUESTS_PER_MINUTE` config

#### 4. Metrics Not Found

**Symptom**: `AssertionError: 'gateway_requests_total' not in metrics`

**Solution**:
```bash
# Verify metrics endpoints
curl http://localhost:8080/metrics
curl http://localhost:8002/metrics

# Generate some traffic
for i in {1..10}; do curl http://localhost:8080/health; done
```

---

## Test Development

### Adding New Tests

1. **Create test file**:
   ```bash
   # Smoke test
   tests/smoke/test_new_service.py
   
   # Integration test
   tests/integration/test_new_flow.py
   ```

2. **Follow naming conventions**:
   - File: `test_<component>.py`
   - Class: `Test<Feature>`
   - Method: `test_<behavior>`

3. **Use descriptive assertions**:
   ```python
   def test_gateway_health_check(self):
       """Gateway health endpoint should return status and backend info"""
       response = requests.get(f"{GATEWAY_URL}/health")
       assert response.status_code == 200
       
       data = response.json()
       assert data["status"] == "healthy", "Gateway should be healthy"
       assert "backends" in data, "Health check should include backend status"
   ```

4. **Mark slow tests**:
   ```python
   @pytest.mark.slow
   def test_rate_limit_enforcement(self):
       """This test takes ~10 seconds"""
       ...
   ```

### Best Practices

- ✅ Tests should be independent (no shared state)
- ✅ Use descriptive test names and docstrings
- ✅ Clean up resources (if any) in teardown
- ✅ Use fixtures for common setup
- ✅ Mock external dependencies when appropriate
- ✅ Avoid hardcoded sleeps (use retries with timeout)

---

## Coverage Report

```bash
# Install coverage
pip install pytest-cov

# Run with coverage
pytest tests/ --cov=vulnerable-services --cov-report=html

# Open report
open htmlcov/index.html  # macOS
start htmlcov/index.html  # Windows
```

---

## Related Documentation

- **Smoke Tests**: [`tests/smoke/README.md`](smoke/README.md)
- **Integration Tests**: [`tests/integration/README.md`](integration/README.md)
- **Gateway Architecture**: [`docs/gateway/README.md`](../docs/gateway/README.md)
- **User Service**: [`vulnerable-services/user-service/README.md`](../vulnerable-services/user-service/README.md)
- **Attack Scripts**: [`attacks/`](../attacks/)
- **Test Commands**: [`TEST_COMMANDS.md`](../TEST_COMMANDS.md)

---

## Test Philosophy

These tests are designed to:

1. **Validate functionality** - Services work as expected
2. **Verify vulnerabilities** - Intentional weaknesses are exploitable
3. **Ensure observability** - Metrics and logs capture attacks
4. **Prove defense-in-depth** - Gateway security controls protect backends

**Note**: In a real production environment, tests validating vulnerabilities (IDOR, auth bypass) would **fail by design**, indicating proper security controls.

---

**Last Updated**: 2025-11-10  
**Phase**: 2.2 - API Gateway & Microservices

