# Phase 2.1: Secure Login API 2.0 Implementation Guide

## Overview

Phase 2.1 transforms the basic login-api into a production-grade authentication service with:
- **JWT-based authentication** with access and refresh tokens
- **Multi-Factor Authentication (MFA)** using TOTP
- **Token rotation** and revocation
- **Redis-based session management**
- **Enhanced security monitoring**

## Architecture

### Authentication Flow

```
┌─────────┐                  ┌──────────────┐                 ┌───────┐
│  Client │                  │  Login API   │                 │ Redis │
└────┬────┘                  └──────┬───────┘                 └───┬───┘
     │                              │                             │
     │  POST /auth/login            │                             │
     │  {username, password}        │                             │
     ├─────────────────────────────>│                             │
     │                              │                             │
     │                              │  verify_login()             │
     │                              │                             │
     │                              │  create_mfa_challenge()     │
     │                              ├────────────────────────────>│
     │                              │                             │
     │  200 OK                      │                             │
     │  {requires_mfa: true,        │                             │
     │   challenge_id: "uuid"}      │                             │
     │<─────────────────────────────┤                             │
     │                              │                             │
     │  POST /auth/mfa/verify       │                             │
     │  {challenge_id, code}        │                             │
     ├─────────────────────────────>│                             │
     │                              │                             │
     │                              │  verify_mfa_code()          │
     │                              │                             │
     │                              │  generate_token_bundle()    │
     │                              ├────────────────────────────>│
     │                              │  <store refresh token>      │
     │                              │                             │
     │  200 OK                      │                             │
     │  {access_token: "JWT",       │                             │
     │   refresh_token: "...",      │                             │
     │   expires_in: 300}           │                             │
     │<─────────────────────────────┤                             │
     │                              │                             │
```

### Token Lifecycle

1. **Access Token** (JWT):
   - Expires in 5 minutes
   - Contains: `{sub: username, type: "access", exp, iat}`
   - Signed with HS256 (HMAC-SHA256)

2. **Refresh Token**:
   - Expires in 60 minutes
   - 32-byte random URL-safe string
   - Stored in Redis with TTL
   - Rotates on each use (old token invalidated)

3. **Token Rotation**:
   ```
   Client uses refresh_token_A
   → Server issues refresh_token_B
   → refresh_token_A is invalidated
   → If refresh_token_A is used again → 401 Unauthorized
   ```

### MFA Implementation

- **TOTP (Time-based One-Time Password)**
- 6-digit codes, 30-second validity window
- Challenge TTL: 5 minutes
- Max attempts: 5 per challenge
- After max attempts: challenge deleted, IP may be banned

## API Endpoints

### 1. Login (Password Step)

```bash
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "MFA verification required. Use the one-time code sent to your device.",
  "requires_mfa": true,
  "challenge_id": "7845f30b-9e67-4a98-90d0-7b0d2b62f93b"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: IP banned
- `429 Too Many Requests`: Rate limited

### 2. MFA Verification

```bash
POST /auth/mfa/verify
Content-Type: application/json

{
  "challenge_id": "7845f30b-9e67-4a98-90d0-7b0d2b62f93b",
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Authentication completed successfully.",
  "token_type": "bearer",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "9hMTvyU2Z1S1H5kG7FmPiKzjFYgLny5nSui_oFGBZ8A",
  "expires_in": 300,
  "refresh_expires_in": 3600
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid MFA code
- `403 Forbidden`: Too many invalid attempts
- `404 Not Found`: Challenge expired or not found

### 3. Token Refresh

```bash
POST /auth/token/refresh
Content-Type: application/json

{
  "refresh_token": "9hMTvyU2Z1S1H5kG7FmPiKzjFYgLny5nSui_oFGBZ8A"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Access token refreshed.",
  "token_type": "bearer",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "WdQedWVeUANQuyph0kRBIop4uCiR8i9px7ZR4w_kYXY",
  "expires_in": 300,
  "refresh_expires_in": 3600
}
```

**Notes:**
- Old refresh token is invalidated
- New refresh token is issued

**Error Response:**
- `401 Unauthorized`: Invalid or expired refresh token

### 4. Logout

```bash
POST /auth/logout
Content-Type: application/json

{
  "refresh_token": "WdQedWVeUANQuyph0kRBIop4uCiR8i9px7ZR4w_kYXY",
  "all_sessions": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session revoked."
}
```

**Options:**
- `all_sessions: false` - Revoke only this token
- `all_sessions: true` - Revoke all refresh tokens for the user

## Configuration

### Environment Variables

```env
# JWT Configuration
SECRET_KEY=dev-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=5
REFRESH_TOKEN_EXPIRE_MINUTES=60

# MFA Configuration
MFA_ENABLED=true
MFA_CHALLENGE_TTL=300
MFA_CODE_STEP=30
MFA_VALID_WINDOW=1
MFA_MAX_ATTEMPTS=5

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# Rate Limiting
ENABLE_RATE_LIMITING=true
RATE_LIMIT_REQUESTS=5
RATE_LIMIT_WINDOW=60

# IP Banning
ENABLE_IP_BANNING=true
BAN_THRESHOLD=10
BAN_DURATION=900
```

## Security Features

### 1. Defense in Depth

**Layer 1: Rate Limiting**
- 5 requests per 60 seconds per IP
- Per-endpoint limits
- Returns HTTP 429

**Layer 2: IP Banning**
- 10 failed attempts → 15-minute ban
- Tracked in Redis with TTL
- Returns HTTP 403

**Layer 3: MFA Protection**
- Max 5 attempts per challenge
- Challenge expires after 5 minutes
- 30-second code rotation

**Layer 4: Token Security**
- Short-lived access tokens (5 min)
- Refresh token rotation
- Redis-based revocation

### 2. Redis Key Structure

```
# Failed attempts tracking
failed_attempts:{ip} → Sorted Set (username, timestamp)

# IP bans
banned_ip:{ip} → String ("1") with TTL

# MFA challenges
mfa_challenge:{challenge_id} → Hash {username, client_ip, created_at, attempts}

# Refresh tokens
refresh_token:{token} → String (username) with TTL
user_tokens:{username} → Set [token1, token2, ...]
```

### 3. Security Headers

- `Strict-Transport-Security` (via reverse proxy)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- CORS configured for specific origins

## Monitoring & Alerting

### Prometheus Metrics

**Authentication Metrics:**
```promql
login_attempts_total{outcome="success|failure|blocked"}
login_stage_total{stage="password_attempt|password_success|mfa_success|..."}
login_failed_total{reason="invalid_credentials|rate_limited|ip_banned|..."}
```

**MFA Metrics:**
```promql
mfa_attempts_total{result="success|failure|missing"}
```

**JWT Metrics:**
```promql
jwt_refresh_total{status="success|denied|revoked_single|revoked_all"}
```

**Defense Metrics:**
```promql
rate_limit_blocks_total{endpoint="/auth/login|/auth/mfa/verify|..."}
ip_bans_total{reason="policy_violation|failed_attempt_threshold|..."}
```

### Grafana Dashboards

1. **Auth Security Dashboard** (`/d/auth-security/`)
   - Authentication flow stages
   - MFA success rates
   - Token refresh operations
   - Active alerts

2. **Attack Visibility Dashboard** (`/d/attack-visibility/`)
   - Login attempts over time
   - Rate limiter effectiveness
   - IP bans
   - Failed login patterns

### Prometheus Alerts

**Critical Alerts:**
- `LoginAPIDown`: Service unreachable
- `IPBanThresholdReached`: Multiple IPs banned (distributed attack)

**Warning Alerts:**
- `LoginFailureSpike`: High failed login rate
- `MFABypassAttempts`: MFA brute-force attempt
- `RefreshTokenAbuse`: Token replay attack
- `RateLimiterBlocking`: Sustained rate limiting

**Info Alerts:**
- `TokenRevocationSpike`: Mass logout event
- `AuthenticationFlowStalled`: Users not completing MFA

## Testing

### Functional Testing

```bash
# 1. Test full authentication flow
./test_auth_flow.sh

# 2. Test token refresh
./test_token_refresh.sh

# 3. Test token revocation
./test_logout.sh
```

### Attack Simulation

```bash
# 1. Credential Stuffing
cd attacks/credential-stuffing
python credential_stuffing.py \
  --target http://localhost:8000/auth/login \
  --credentials wordlists/leaked-credentials.txt

# 2. MFA Brute-Force
cd attacks/mfa-bruteforce
python mfa_bruteforce.py \
  --target http://localhost:8000 \
  --username admin \
  --password admin123 \
  --code-count 100

# 3. Token Replay
cd attacks/token-replay
python token_replay.py \
  --target http://localhost:8000 \
  --username admin \
  --password admin123 \
  --mfa-code $(docker exec login-api python -c "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())")
```

### Monitoring Smoke Test

```bash
python monitoring/tests/monitoring_smoke_test.py
```

Expected output:
```
[ok] login-api ready
[ok] Prometheus ready
[ok] Alertmanager ready
[ok] Alert receiver ready
[info] Generated 300 failed login attempts
[info] Metric value: 364.6
[ok] Alert 'LoginFailureSpike' is firing
[ok] Alert 'RateLimiterBlocking' is firing
[ok] Alert receiver captured 2 alert payloads
[success] Monitoring smoke test completed successfully
```

## Deployment

### Docker Compose

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f login-api

# Stop all services
docker-compose down
```

### Service URLs

- **Login API**: http://localhost:8000
- **Login API (HTTPS)**: https://localhost:8443
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **Alertmanager**: http://localhost:9093
- **Alert Receiver**: http://localhost:5001

## Known Vulnerabilities (By Design)

These are intentional for educational purposes:

1. **Credential Stuffing**: No CAPTCHA, account lockout
2. **MFA Brute-Force**: Only 5-attempt limit (could be bypassed with multiple challenges)
3. **Token Replay**: Rotation helps but no device fingerprinting
4. **Timing Attacks**: Simple string comparison for passwords
5. **Demo TOTP Secret**: Shared, deterministic secret for all users

## Next Steps (Phase 2.2)

- API Gateway (FastAPI or Kong)
- User Service (microservice expansion)
- WAF rules on gateway
- mTLS between services
- Distributed tracing
- Service mesh observability

## References

- [JWT Best Practices (RFC 8725)](https://datatracker.ietf.org/doc/html/rfc8725)
- [TOTP (RFC 6238)](https://datatracker.ietf.org/doc/html/rfc6238)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

