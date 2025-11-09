# User Service - Intentionally Vulnerable Microservice

Part of DevSecOps Hacking Lab - Phase 2.2

## ⚠️ WARNING: Intentional Vulnerabilities

This service contains **intentional security vulnerabilities** for educational purposes:

### 🚨 Vulnerability #1: IDOR (Insecure Direct Object Reference)

**Endpoint**: `GET /profile/{user_id}`

**Issue**: No authorization check - any authenticated user can access any other user's profile

```bash
# User "admin" can access user1's profile
curl http://localhost:8002/profile/2 -H "Authorization: Bearer <admin_token>"

# Exposes sensitive data: SSN, credit card, phone, address
```

**Impact**:
- Unauthorized access to sensitive personal information
- Privacy violation
- Data breach potential

---

### 🚨 Vulnerability #2: Missing Authentication

**Endpoint**: `GET /settings?user_id={id}`

**Issue**: No JWT validation - anyone can access user settings without authentication

```bash
# No token required!
curl http://localhost:8002/settings?user_id=1

# Exposes sensitive data: API keys, security settings
```

**Impact**:
- Exposed API keys and secrets
- Account takeover potential
- Complete authentication bypass

---

### 🚨 Vulnerability #3: Sensitive Data Exposure

**Issue**: Returns unredacted sensitive information in API responses

- Social Security Numbers (SSN)
- Credit card numbers
- API keys
- Personal contact information

---

## Architecture

```
User Request
    ↓
API Gateway (should protect these endpoints)
    ↓
User Service (intentionally vulnerable)
    ├── /profile/{user_id}  ← IDOR vulnerability
    ├── /settings           ← No authentication
    └── /metrics            ← Tracks exploitation attempts
```

## Endpoints

### Health Check
```bash
GET /health
```

### User Profile (VULNERABLE - IDOR)
```bash
GET /profile/{user_id}
Authorization: Bearer <token>  # Token is checked but not validated against user_id!
```

### User Settings (VULNERABLE - No Auth)
```bash
GET /settings?user_id={user_id}
# No authorization header required!
```

### Metrics
```bash
GET /metrics
```

## Prometheus Metrics

The service tracks exploitation attempts:

- `user_service_idor_attempts_total` - IDOR exploitation attempts
- `user_service_direct_access_total` - Direct access bypassing gateway
- `user_service_unauthorized_settings_access_total` - Unauthorized settings access
- `user_service_requests_total` - Total requests
- `user_service_request_duration_seconds` - Request latency

## Test Users

| User ID | Username | Role | Notes |
|---------|----------|------|-------|
| 1 | admin | admin | Full access |
| 2 | user1 | user | Regular user |
| 3 | user2 | user | Regular user |
| 4 | testuser | user | Test account |

## Running Locally

```bash
# Build
docker-compose build user-service

# Run
docker-compose up -d user-service

# Test
curl http://localhost:8002/health
```

## Security Learning Objectives

1. **Understand IDOR**: Learn how missing authorization checks lead to unauthorized data access
2. **Recognize Auth Bypass**: See how missing authentication can expose critical endpoints
3. **Data Protection**: Understand why sensitive data should be redacted/encrypted
4. **Defense Strategies**: Learn how API Gateway should protect backend services

## Defensive Measures (Not Implemented - Intentionally)

What SHOULD be done:
- ✅ Validate JWT token in every protected endpoint
- ✅ Check if authenticated user == requested user_id
- ✅ Implement role-based access control (RBAC)
- ✅ Redact sensitive data in responses
- ✅ Force all traffic through API Gateway
- ✅ Use mTLS for service-to-service communication

---

**Remember**: Never deploy this service in production or exposed to the internet!

