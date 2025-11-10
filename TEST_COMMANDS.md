# Test Commands - Phase 2.2

## Group 1: API Gateway - Basics ✅ COMPLETED

### Build and Test
```powershell
docker-compose build api-gateway
docker-compose up -d api-gateway
curl http://localhost:8080/health
curl -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" -d '{\"username\":\"admin\",\"password\":\"admin123\"}'
```

---

## Group 2: Gateway Security (JWT + WAF + Metrics) 🔒

### 1. Rebuild and Start with Changes

```powershell
# Rebuild gateway with new code
docker-compose build api-gateway
docker-compose up -d api-gateway

# Check logs
docker-compose logs -f api-gateway
```

### 2. Test Metrics Endpoint

```powershell
# Fetch Prometheus metrics
curl http://localhost:8080/metrics

# Expected output: metrics in Prometheus format
# gateway_requests_total
# gateway_jwt_validation_total
# gateway_rate_limit_blocks_total
# gateway_backend_requests_total
```

### 3. Test JWT Validation - Protected Endpoint

```powershell
# Step 1: Login and get token
$mfaCode = docker exec login-api python -c "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())"

$loginResp = curl.exe -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" -d '{\"username\":\"admin\",\"password\":\"admin123\"}' | ConvertFrom-Json

$verifyResp = curl.exe -X POST http://localhost:8080/auth/mfa/verify -H "Content-Type: application/json" -d "{\"challenge_id\":\"$($loginResp.challenge_id)\",\"code\":\"$mfaCode\"}" | ConvertFrom-Json

$accessToken = $verifyResp.access_token

# Step 2: Test protected endpoint WITHOUT token (401)
curl http://localhost:8080/protected

# Expected output:
# {"detail":"Missing authorization header"}

# Step 3: Test protected endpoint WITH token (200)
curl http://localhost:8080/protected -H "Authorization: Bearer $accessToken"

# Expected output:
# {
#   "message": "Access granted to protected resource",
#   "user": "admin",
#   "token_type": "access",
#   "authenticated": true
# }

# Step 4: Test with invalid token (401)
curl http://localhost:8080/protected -H "Authorization: Bearer invalid_token_here"

# Expected output:
# {"detail":"Could not validate credentials: ..."}
```

### 4. Test Rate Limiting

```powershell
# Test 1: Single requests (should pass)
for ($i=1; $i -le 5; $i++) {
    curl http://localhost:8080/ 
    Write-Host "Request $i completed"
    Start-Sleep -Milliseconds 500
}

# Test 2: Burst requests (exceed limit)
# Send 15 requests quickly (limit: 10 burst)
for ($i=1; $i -le 15; $i++) {
    $response = curl.exe -s -o response.txt -w "%{http_code}" http://localhost:8080/
    Write-Host "Request $i - Status: $response"
}

# Expected output:
# First 10-12: 200 OK
# Next ones: 429 Too Many Requests
# Response body for 429:
# {
#   "error": "Rate Limit Exceeded",
#   "message": "Too many requests. Limit: 60 requests per minute.",
#   "retry_after": 60
# }

# Check rate limit headers
curl -I http://localhost:8080/
# X-RateLimit-Limit: 60
# X-RateLimit-Remaining: 9
```

### 5. Test WAF - Suspicious Patterns

```powershell
# Test 1: SQL Injection pattern
curl "http://localhost:8080/auth/login?id=1' OR '1'='1"

# Expected output (400):
# {
#   "error": "Bad Request",
#   "message": "Request contains suspicious pattern",
#   "blocked_by": "WAF"
# }

# Test 2: Path traversal
curl "http://localhost:8080/../../etc/passwd"

# Expected output (400):
# Same as above

# Test 3: XSS pattern
curl "http://localhost:8080/search?q=<script>alert('xss')</script>"

# Expected output (400)

# Test 4: Valid request (not blocked)
curl http://localhost:8080/auth/login
# Should return 405 Method Not Allowed (because GET), but not WAF block
```

### 6. Test WAF - Oversized Request

```powershell
# Create large file (>10MB)
$largeData = "x" * (11 * 1024 * 1024)  # 11MB

# Send oversized request
curl -X POST http://localhost:8080/auth/login `
  -H "Content-Type: application/json" `
  -d $largeData

# Expected output (413):
# {
#   "error": "Request Entity Too Large",
#   "message": "Request body exceeds maximum size of 10485760 bytes",
#   "blocked_by": "WAF"
# }
```

### 7. Test Security Headers

```powershell
# Check security headers in response
curl -I http://localhost:8080/

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Referrer-Policy: strict-origin-when-cross-origin
# X-Gateway: DevSecOps-API-Gateway
# X-Gateway-Version: 0.1.0
# X-Response-Time: 0.XXXs
```

### 8. Test Complete Auth Flow through Gateway with Metrics

```powershell
# 1. Login
$login = curl.exe -X POST http://localhost:8080/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"password\":\"admin123\"}' | ConvertFrom-Json

# 2. Get MFA code
$mfa = docker exec login-api python -c "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())"

# 3. Verify MFA
$tokens = curl.exe -X POST http://localhost:8080/auth/mfa/verify `
  -H "Content-Type: application/json" `
  -d "{\"challenge_id\":\"$($login.challenge_id)\",\"code\":\"$mfa\"}" | ConvertFrom-Json

# 4. Access protected endpoint
curl http://localhost:8080/protected `
  -H "Authorization: Bearer $($tokens.access_token)"

# 5. Check metrics
curl http://localhost:8080/metrics | Select-String "gateway_"

# Should contain:
# gateway_requests_total{method="POST",path="/auth/*",status_code="200"}
# gateway_jwt_validation_total{result="success"}
# gateway_backend_requests_total{backend="auth-service",method="POST",status_code="200"}
```

### 9. Verify Prometheus Scraping

```powershell
# Check if Prometheus is scraping gateway
curl http://localhost:9090/api/v1/targets | ConvertFrom-Json | 
  Select-Object -ExpandProperty data | 
  Select-Object -ExpandProperty activeTargets | 
  Where-Object {$_.labels.job -eq "api-gateway"}

# Query metrics in Prometheus
curl "http://localhost:9090/api/v1/query?query=gateway_requests_total"
curl "http://localhost:9090/api/v1/query?query=gateway_rate_limit_blocks_total"
```

### 10. Stress Test - Rate Limiter Effectiveness

```powershell
# Mass test - 100 requests
$successCount = 0
$rateLimitedCount = 0

for ($i=1; $i -le 100; $i++) {
    $status = curl.exe -s -o $null -w "%{http_code}" http://localhost:8080/
    if ($status -eq "200") { $successCount++ }
    if ($status -eq "429") { $rateLimitedCount++ }
}

Write-Host "Success: $successCount, Rate Limited: $rateLimitedCount"

# Expected result: 
# Most requests rate limited (> 80%)
```

---

## ✅ Success Criteria - Group 2

- [ ] Metrics endpoint returns Prometheus metrics
- [ ] Protected endpoint requires JWT (401 without token)
- [ ] Protected endpoint accepts valid JWT (200)
- [ ] Rate limiter blocks excess requests (429)
- [ ] WAF blocks suspicious patterns (400)
- [ ] WAF blocks oversized requests (413)
- [ ] Security headers are added to all responses
- [ ] Metrics are properly tracked (requests, JWT validation, backend calls)
- [ ] Logs contain timing and IP address information

---

## 🚀 Next Step - Commit

```powershell
git add vulnerable-services/api-gateway/
git add docker-compose.yml
git add TEST_COMMANDS.md
git commit -m "feat(gateway): Add JWT validation, WAF rules and Prometheus metrics (Phase 2.2 - Step 2)

Security Features:
- JWT verification middleware for protected endpoints
- Rate limiting (60 req/min, burst 10) with Token Bucket algorithm
- WAF rules (SQL injection, XSS, path traversal detection)
- Request size validation (max 10MB)
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

Monitoring:
- Prometheus metrics endpoint (/metrics)
- Gateway request tracking with labels
- JWT validation metrics
- Rate limiter metrics
- WAF block metrics
- Backend proxy metrics with duration histograms

Demo Endpoints:
- GET /protected - requires valid JWT token
- GET /metrics - Prometheus format metrics

Files:
- app/security.py - JWT validation utilities
- app/middleware.py - Rate limiting, WAF, security headers, logging
- app/metrics.py - Prometheus metrics definitions
- app/main.py - Updated with middleware integration
- app/config.py - Rate limiter & WAF configuration
"
```

---

## Group 3: User Service with IDOR & Auth Bypass Vulnerabilities 🚨

### 1. Build and Start User Service

```powershell
# Build user-service
docker-compose build user-service

# Start user-service
docker-compose up -d user-service

# Check logs
docker-compose logs -f user-service

# Rebuild gateway with user-service routing
docker-compose build api-gateway
docker-compose up -d api-gateway

# Restart Prometheus to scrape new services
docker-compose restart prometheus
```

### 2. Test User Service Health

```powershell
# Direct access to user-service
curl http://localhost:8002/health

# Expected output:
# {
#   "status": "healthy",
#   "service": "user-service",
#   "version": "0.1.0",
#   "vulnerabilities": [
#     "IDOR in /profile/{user_id}",
#     "No authentication in /settings",
#     "Sensitive data exposure"
#   ]
# }

# Access through gateway
curl http://localhost:8080/health

# Should show both backends healthy:
# "backends": {
#   "auth-service": {"status": "healthy"},
#   "user-service": {"status": "healthy"}
# }
```

### 3. Test IDOR Vulnerability - Profile Endpoint

```powershell
# Step 1: Login as admin and get token
$mfaCode = (docker exec login-api python -c "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())").Trim()

$loginResp = curl.exe -s -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" -d '{\"username\":\"admin\",\"password\":\"admin123\"}' | ConvertFrom-Json

# Use temp file to avoid PowerShell escaping issues
@{challenge_id=$loginResp.challenge_id; code=$mfaCode} | ConvertTo-Json -Compress | Out-File -FilePath mfa.json -Encoding ASCII

$verifyResp = curl.exe -s -X POST http://localhost:8080/auth/mfa/verify -H "Content-Type: application/json" -d "@mfa.json" | ConvertFrom-Json

$accessToken = $verifyResp.access_token

# Step 2: Access admin's own profile (user_id=1) - NORMAL
curl.exe http://localhost:8080/api/users/profile/1 -H "Authorization: Bearer $accessToken"

# Expected output (200 OK):
# {
#   "user_id": "1",
#   "username": "admin",
#   "email": "admin@devsecops.local",
#   "full_name": "Admin User",
#   "ssn": "12345678901",  <-- Sensitive data!
#   "credit_card": "**** **** **** 1234"
# }

# Step 3: IDOR EXPLOIT - Access user1's profile (user_id=2) 🚨
curl.exe http://localhost:8080/api/users/profile/2 -H "Authorization: Bearer $accessToken"

# Expected output (200 OK - VULNERABILITY!):
# {
#   "user_id": "2",
#   "username": "user1",
#   "email": "user1@devsecops.local",
#   "ssn": "98765432109",  <-- Admin sees user1's SSN!
#   ...
# }

# Step 4: Try all users (IDOR enumeration)
for ($i=1; $i -le 4; $i++) {
    Write-Host "=== User $i ==="
    curl.exe http://localhost:8080/api/users/profile/$i -H "Authorization: Bearer $accessToken"
}

# Step 5: Check user-service logs for IDOR detection
docker-compose logs user-service | Select-String "IDOR"

# Expected log:
# 🚨 IDOR EXPLOIT: User 'admin' accessed profile of 'user1' (user_id: 2)
```

### 4. Test Auth Bypass Vulnerability - Settings Endpoint

```powershell
# Step 1: Access settings WITHOUT any token 🚨
curl "http://localhost:8080/api/users/settings?user_id=1"

# Expected output (200 OK - NO AUTH REQUIRED!):
# {
#   "theme": "dark",
#   "notifications_enabled": true,
#   "two_factor_enabled": true,
#   "api_key": "admin-secret-api-key-12345"  <-- Exposed!
# }

# Step 2: Enumerate all users' settings
for ($i=1; $i -le 4; $i++) {
    Write-Host "=== Settings for user $i ==="
    curl "http://localhost:8080/api/users/settings?user_id=$i"
}

# Step 3: Try without user_id parameter
curl "http://localhost:8080/api/users/settings"

# Expected: defaults to user_id=1 (admin) - another vulnerability!

# Step 4: Check logs for unauthorized access
docker-compose logs user-service | Select-String "UNAUTHORIZED"

# Expected log:
# 🚨 UNAUTHORIZED ACCESS: /settings accessed without JWT
```

### 5. Test Direct Service Access (Bypass Gateway)

```powershell
# Access user-service DIRECTLY (port 8002), bypassing gateway 🚨
curl http://localhost:8002/profile/1

# Expected output (200 OK):
# Returns profile without any authentication!

# Check logs for direct access detection
docker-compose logs user-service | Select-String "Direct access"

# Expected log:
# ⚠️ Direct access detected (bypassing gateway): /profile/1 from <IP>

# Compare metrics: direct vs gateway
curl http://localhost:8002/metrics | Select-String "user_service_direct_access"

# Should show:
# user_service_direct_access_total{endpoint="/profile/1",source_ip="..."}
```

### 6. Test User Service Metrics

```powershell
# Fetch user-service metrics
curl http://localhost:8002/metrics

# Key metrics to check:
# user_service_idor_attempts_total - IDOR exploitation attempts
# user_service_direct_access_total - Requests bypassing gateway
# user_service_unauthorized_settings_access_total - Settings without JWT
# user_service_requests_total - Total requests

# Query metrics in Prometheus
curl "http://localhost:9090/api/v1/query?query=user_service_idor_attempts_total"
curl "http://localhost:9090/api/v1/query?query=user_service_direct_access_total"
curl "http://localhost:9090/api/v1/query?query=user_service_unauthorized_settings_access_total"
```

### 7. Verify Prometheus Scraping

```powershell
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | ConvertFrom-Json | 
  Select-Object -ExpandProperty data | 
  Select-Object -ExpandProperty activeTargets | 
  Where-Object {$_.labels.job -in @("api-gateway", "user-service")}

# Expected: Both api-gateway and user-service targets UP

# Query gateway metrics
curl "http://localhost:9090/api/v1/query?query=gateway_backend_requests_total"

# Should show requests to both auth-service and user-service
```

### 8. Complete Exploit Chain

```powershell
# Full attack simulation:
# 1. Login
$mfaCode = (docker exec login-api python -c "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())").Trim()
$loginResp = curl.exe -s -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" -d '{\"username\":\"admin\",\"password\":\"admin123\"}' | ConvertFrom-Json
@{challenge_id=$loginResp.challenge_id; code=$mfaCode} | ConvertTo-Json -Compress | Out-File -FilePath mfa.json -Encoding ASCII
$verifyResp = curl.exe -s -X POST http://localhost:8080/auth/mfa/verify -H "Content-Type: application/json" -d "@mfa.json" | ConvertFrom-Json
$token = $verifyResp.access_token

# 2. IDOR - Steal all profiles
Write-Host "`n=== IDOR ATTACK: Stealing all user profiles ==="
for ($i=1; $i -le 4; $i++) {
    $profile = curl.exe -s http://localhost:8080/api/users/profile/$i -H "Authorization: Bearer $token" | ConvertFrom-Json
    Write-Host "User $i - SSN: $($profile.ssn), Email: $($profile.email)"
}

# 3. Auth Bypass - Steal all API keys
Write-Host "`n=== AUTH BYPASS: Stealing all API keys ==="
for ($i=1; $i -le 4; $i++) {
    $settings = curl.exe -s "http://localhost:8080/api/users/settings?user_id=$i" | ConvertFrom-Json
    Write-Host "User $i - API Key: $($settings.api_key)"
}

# 4. Check detection metrics
Write-Host "`n=== Detection Metrics ==="
curl.exe -s "http://localhost:9090/api/v1/query?query=user_service_idor_attempts_total" | ConvertFrom-Json | Select-Object -ExpandProperty data | Select-Object -ExpandProperty result
curl.exe -s "http://localhost:9090/api/v1/query?query=user_service_unauthorized_settings_access_total" | ConvertFrom-Json | Select-Object -ExpandProperty data | Select-Object -ExpandProperty result
```

---

## ✅ Success Criteria - Group 3

- [ ] User service health endpoint works
- [ ] Gateway health check shows both backends healthy
- [ ] IDOR vulnerability: Can access other users' profiles
- [ ] Auth bypass: Can access settings without JWT
- [ ] Direct access: Can bypass gateway and access service directly
- [ ] Metrics track IDOR attempts
- [ ] Metrics track unauthorized settings access
- [ ] Metrics track direct access bypassing gateway
- [ ] Prometheus scrapes both gateway and user-service
- [ ] Logs show vulnerability exploitation attempts

---

## 🚀 Next Step - Commit

```powershell
git add vulnerable-services/user-service/
git add vulnerable-services/api-gateway/app/main.py
git add docker-compose.yml
git add monitoring/prometheus/prometheus.yml
git add TEST_COMMANDS.md
git commit -m "feat(user-service): Add User Service with IDOR and Auth Bypass vulnerabilities (Phase 2.2 - Step 3)

Vulnerabilities:
- IDOR in /profile/{user_id} - No authorization check (any user can access any profile)
- Auth bypass in /settings - No JWT validation required
- Sensitive data exposure (SSN, credit cards, API keys)
- Direct service access detection (bypassing gateway)

User Service Features:
- GET /profile/{user_id} - Profile with sensitive data (VULNERABLE: IDOR)
- GET /settings?user_id={id} - User settings with API keys (VULNERABLE: No Auth)
- GET /health - Health check with vulnerability list
- GET /metrics - Prometheus metrics endpoint
- Fake user database (4 users: admin, user1, user2, testuser)

Monitoring:
- user_service_idor_attempts_total - Tracks IDOR exploitation
- user_service_direct_access_total - Tracks gateway bypass
- user_service_unauthorized_settings_access_total - Tracks auth bypass
- user_service_requests_total - Total requests
- user_service_request_duration_seconds - Request latency

Gateway Updates:
- Added /api/users/* routing to user-service
- Updated health check to include user-service
- Metrics track backend requests to user-service

Prometheus:
- Added scraping for api-gateway:8080/metrics
- Added scraping for user-service:8000/metrics

Files:
- vulnerable-services/user-service/ - Complete service implementation
- app/main.py - FastAPI with vulnerable endpoints
- app/models.py - Pydantic models
- app/metrics.py - Prometheus metrics
- app/config.py - Configuration and fake database
- Dockerfile - Container image
- README.md - Vulnerability documentation
"
```

---

## Group 7: Automated Tests (Smoke + Integration) 🧪

### Prerequisites

```powershell
# Install Python dependencies
pip install -r tests/smoke/requirements.txt
pip install -r tests/integration/requirements.txt

# Ensure all services running
docker-compose up -d
docker-compose ps
```

### 1. Smoke Tests - API Gateway

**Purpose**: Fast validation of Gateway core functionality

```powershell
# Run all Gateway smoke tests
pytest tests/smoke/test_gateway.py -v

# Run specific test classes
pytest tests/smoke/test_gateway.py::TestGatewayHealth -v
pytest tests/smoke/test_gateway.py::TestGatewayJWTValidation -v
pytest tests/smoke/test_gateway.py::TestGatewayWAF -v

# Skip slow tests (rate limiting)
pytest tests/smoke/test_gateway.py -v -m "not slow"
```

**Expected Output**:
```
tests/smoke/test_gateway.py::TestGatewayHealth::test_health_endpoint PASSED
tests/smoke/test_gateway.py::TestGatewayHealth::test_root_endpoint PASSED
tests/smoke/test_gateway.py::TestGatewayRouting::test_route_to_auth_service PASSED
tests/smoke/test_gateway.py::TestGatewayRouting::test_route_to_user_service PASSED
tests/smoke/test_gateway.py::TestGatewayJWTValidation::test_protected_endpoint_without_token PASSED
tests/smoke/test_gateway.py::TestGatewayJWTValidation::test_protected_endpoint_with_invalid_token PASSED
tests/smoke/test_gateway.py::TestGatewayJWTValidation::test_protected_endpoint_with_valid_token PASSED
tests/smoke/test_gateway.py::TestGatewayWAF::test_waf_sql_injection_detection PASSED
tests/smoke/test_gateway.py::TestGatewayWAF::test_waf_xss_detection PASSED
tests/smoke/test_gateway.py::TestGatewayWAF::test_waf_path_traversal_detection PASSED
tests/smoke/test_gateway.py::TestGatewayMetrics::test_metrics_endpoint PASSED
======================== 16 passed in 12.34s ========================
```

### 2. Smoke Tests - User Service

**Purpose**: Validate vulnerabilities are exploitable

```powershell
# Run all User Service smoke tests
pytest tests/smoke/test_user_service.py -v

# Test IDOR vulnerability
pytest tests/smoke/test_user_service.py::TestUserServiceIDOR -v

# Test auth bypass
pytest tests/smoke/test_user_service.py::TestUserServiceAuthBypass -v

# Test direct access detection
pytest tests/smoke/test_user_service.py::TestDirectServiceAccess -v
```

**Expected Output**:
```
tests/smoke/test_user_service.py::TestUserServiceIDOR::test_idor_vulnerability_exists PASSED
tests/smoke/test_user_service.py::TestUserServiceIDOR::test_idor_access_own_profile PASSED
tests/smoke/test_user_service.py::TestUserServiceIDOR::test_idor_metrics_tracking PASSED
tests/smoke/test_user_service.py::TestUserServiceAuthBypass::test_settings_auth_bypass_exists PASSED
tests/smoke/test_user_service.py::TestDirectServiceAccess::test_direct_access_bypasses_gateway PASSED
======================== 12 passed in 8.56s ========================
```

### 3. Integration Tests - End-to-End

**Purpose**: Validate complete authentication and request flow

```powershell
# Run all E2E tests
pytest tests/integration/test_e2e_auth_flow.py -v

# Test authentication flow only
pytest tests/integration/test_e2e_auth_flow.py::TestE2EAuthenticationFlow -v

# Test Gateway integration only
pytest tests/integration/test_e2e_auth_flow.py::TestE2EGatewayIntegration -v

# Test User Service access through Gateway
pytest tests/integration/test_e2e_auth_flow.py::TestE2EUserServiceAccess -v

# Test security controls
pytest tests/integration/test_e2e_auth_flow.py::TestE2ESecurityControls -v
```

**Expected Output**:
```
tests/integration/test_e2e_auth_flow.py::TestE2EAuthenticationFlow::test_full_login_flow PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EAuthenticationFlow::test_failed_login_invalid_credentials PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EGatewayIntegration::test_gateway_jwt_validation_and_routing PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EUserServiceAccess::test_access_user_profile_through_gateway PASSED
tests/integration/test_e2e_auth_flow.py::TestE2EUserServiceAccess::test_idor_exploitation_through_gateway PASSED
tests/integration/test_e2e_auth_flow.py::TestE2ESecurityControls::test_gateway_rate_limiting PASSED
tests/integration/test_e2e_auth_flow.py::TestE2ESecurityControls::test_gateway_waf_protection PASSED
======================== 15 passed in 22.45s ========================
```

### 4. Run All Tests

```powershell
# All tests (smoke + integration)
pytest tests/ -v

# All tests with detailed output
pytest tests/ -v -s

# All tests, stop on first failure
pytest tests/ -v -x

# Generate coverage report
pytest tests/ --cov=vulnerable-services --cov-report=html
start htmlcov/index.html
```

**Expected Total**: 43 tests passed (~35 seconds)

### 5. Troubleshooting Tests

```powershell
# If tests fail with "Could not authenticate"
docker-compose restart login-api
curl http://localhost:8000/health

# If tests fail with connection errors
docker-compose ps
docker-compose restart api-gateway user-service

# Check Gateway logs
docker-compose logs api-gateway | Select-String -Pattern "error\|ERROR" -CaseSensitive

# Check User Service logs
docker-compose logs user-service | Select-String -Pattern "error\|ERROR" -CaseSensitive

# Verify services manually
curl.exe http://localhost:8000/health  # Auth Service
curl.exe http://localhost:8080/health  # Gateway
curl.exe http://localhost:8002/health  # User Service

# Test manual authentication
$login = curl.exe -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | ConvertFrom-Json
$mfa = docker exec login-api python -c "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())"
$mfa_verify = curl.exe -X POST http://localhost:8000/auth/mfa/verify -H "Content-Type: application/json" -d "{`"challenge_id`":`"$($login.challenge_id)`",`"totp_code`":`"$mfa`"}" | ConvertFrom-Json
$token = $mfa_verify.access_token
curl.exe http://localhost:8080/protected -H "Authorization: Bearer $token"
```

### Test Coverage

| Component | Smoke Tests | Integration Tests | Total |
|-----------|-------------|-------------------|-------|
| Gateway | 16 tests | 13 tests | 29 |
| User Service | 12 tests | Included in E2E | 12 |
| Auth Flow | - | 15 tests | 15 |
| **Total** | **28 tests** | **15 tests** | **43 tests** |

---
