# Secure Login API 2.0 – Architecture & Implementation Plan

This document describes the scope, architecture, and milestones for **Phase 2.1** of the DevSecOps Hacking Lab: upgrading the `login-api` into a realistic, production-grade authentication service with HTTPS, JWT-based sessions, and MFA simulation.

---

## Goals

1. **Transport Security** – All inbound traffic to `login-api` must traverse an HTTPS reverse proxy with security headers and basic WAF policies.
2. **Modern Auth Flow** – Support short-lived access tokens, refresh tokens, and a second-factor challenge (MFA mock).
3. **Shared Defense State** – Store rate-limit/IP-ban state in Redis to enable enforcement across proxy and service.
4. **Enhanced Observability** – Expose granular metrics for auth flow stages, JWT usage, and MFA, with corresponding alerts.
5. **Offensive Toolkit Update** – Extend attack scripts to cover credential stuffing, token replay, and MFA brute force scenarios.
6. **Penetration Testing Hooks** – Provide fixtures/data to run automated security scanners (Zap/OWASP, custom scripts) against the hardened flow.

Out of scope for Phase 2.1: external identity providers, cloud deployment, Terraform.

---

## High-Level Architecture

```
          ┌───────────────────────┐
          │     Attacker /       │
          │ Legit Client Scripts │
          └─────────▲────────────┘
                    │ HTTPS (TLS)
           ┌────────┴────────┐
           │ reverse-proxy   │
           │ (Traefik/Envoy) │◄────────────┐
           └───────▲────────┘             │
                   │ mTLS / HTTP2         │
          ┌────────┴────────┐             │
          │   auth-service  │             │
          │  (login-api v2) │             │
          └───┬─────────────┘             │
              │ Redis (rate limits, bans) │
          ┌───▼─────────────┐             │
          │ metrics/logs    │─────────────┘
          │ Prometheus/Graf │
          └─────────────────┘
```

### Components

| Component        | Description                                                                                  |
|------------------|----------------------------------------------------------------------------------------------|
| `reverse-proxy`  | Terminates TLS, injects security headers, performs request-level WAF checks, forwards to auth-service over mTLS, enforces basic rate limits. |
| `auth-service`   | New version of login API: handles credential verification, MFA challenge, JWT/refresh issuance, communicates with Redis for bans and sessions. |
| `redis`          | Stores temporary state (IP ban list, refresh tokens, MFA sessions).                           |
| `attacks/`       | Extended attack scripts for credential stuffing, token replay, MFA brute force.              |
| Monitoring stack | Prometheus/Grafana/Alertmanager receive new metrics and alerts for auth flow.                 |

---

## Auth Flow Specification

1. **Login** (`POST /auth/login`)  
   - Input: username, password.  
   - Response: `requires_mfa` flag, temporary `login_challenge_id`.  
   - On valid credentials: schedule MFA, track attempt in Redis, emit metric `login_stage_total{stage="password"}`.

2. **MFA Verification** (`POST /auth/mfa/verify`)  
   - Input: `challenge_id`, `mfa_code`.  
   - Validates mock TOTP code (static or algorithmic).  
   - On success: issue access token (short TTL) + refresh token (stored in Redis).  
   - Emit metrics `login_stage_total{stage="mfa"}`, `mfa_success_total`.

3. **Refresh Token** (`POST /auth/token/refresh`)  
   - Input: refresh token.  
   - Validates + rotates refresh token, issues new access token.  
   - Metric: `jwt_refresh_total`, `jwt_refresh_failure_total`.

4. **Logout** (`POST /auth/logout`)  
   - Revokes active refresh tokens, clears session state.

### Security Controls

- TLS termination with `TLSv1.2+`, HSTS, CSP, X-Frame-Options, Referrer-Policy.
- Rate limiting:
  - Proxy-level: IP-based, path-specific (`/auth/login` stricter).  
  - Service-level: per username, per challenge (defensive).
- Redis-based IP ban sharing.
- Access tokens (JWT) signed with HS256 (demo) and optional RS256 for advanced stage.
- Refresh token hashing before storing (to simulate secure practices).
- MFA codes stored hashed and expiring (simulate TOTPs).

---

## Offensive Scenarios

1. **Credential Stuffing**  
   - Script reads generated user dataset (`data/users.csv`).  
   - Attempts login through proxy over HTTPS.  
   - Observes rate limiting & bans.

2. **Token Replay / Session Hijack**  
   - Acquire valid access token, wait for expiry, attempt reuse.  
   - Attack script checks if service rejects stale tokens.  
   - Optional: attempt using token before MFA completes.

3. **MFA Brute Force**  
   - Iterate codes for active challenge ID.  
   - Expect detection via increased `mfa_failure_total` and alert trigger.  
   - Simulate automation (multi-threaded).

4. **Penetration Testing Harness**  
   - Provide Zap/Burp config stub to run against HTTPS endpoint.  
   - Ensure test data allows reproducible results (user credentials, token lifetimes).

---

## Monitoring & Alerting Enhancements

- New metrics:
  - `login_stage_total{stage=...}` – counts per auth stage.
  - `mfa_failure_total`, `mfa_success_total`.
  - `jwt_refresh_total`, `jwt_refresh_failure_total`.
  - `rate_limit_blocks_total{endpoint}` (already extended).
- Alerts:
  - `MFAFailureSpike` – high rate of MFA failures in 5 min window.
  - `RefreshFailureSpike` – potential token replay attempts.
  - `CertExpiryWarning` – proxy certificate near expiration (simulated).
- Grafana dashboard sections:
  - Auth funnel (password → MFA → token).
  - Token refresh activity.
  - Security headers compliance (from proxy logs, if feasible).

---

## Implementation Milestones

| Milestone | Deliverables |
|-----------|--------------|
| **M1. Proxy Scaffolding** | Traefik reverse-proxy (port 8443), TLS termination (self-signed dev cert), security headers, rate limiting, integration into `docker-compose`. |
| **M2. Auth-Service Refactor** | New endpoints, JWT/MFA logic, Redis integration, updated Pydantic models, tests. |
| **M3. Offense Toolkit Update** | Scripts for credential stuffing, token replay, MFA brute force, updated wordlists/data. |
| **M4. Observability** | Metrics exposed, Prometheus scrape config, Grafana panels, Alertmanager rules. |
| **M5. Penetration Fixtures** | Sample datasets, Zap config, documentation for running pentests. |
| **M6. Documentation** | README updates, `docs/auth/` guide, diagrams. |

Each milestone should produce at least one commit (Conventional Commit style) and updated documentation/tests.

---

## Data & Test Fixtures

- `data/users/seed_users.json` – list of generated identities (username, password, email, MFA seed).  
- `data/attacks/credential_stuffing.txt` – credential stuffing list.  
- Pre-generated JWT private/public keys (dev only).  
- Postman collection for manual exploratory testing.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| TLS misconfiguration | Provide helper script for cert generation, add CI check using `openssl s_client`. |
| JWT clock skew | Keep short expiry but add small leeway; log claims for debugging. |
| Redis persistence | Use ephemeral storage with bootstrap script to clear state between tests. |
| Complexity creep | Keep Faza 2.1 bounded to auth; gateway/service mesh handled in Faza 2.2. |
| Pentest false positives | Document known vulnerabilities vs. mitigated ones; isolate by environment. |

---

## Next Steps

1. Update `docker-compose.yml` to include `reverse-proxy` and `redis` (stub).  
2. Scaffold directories (`reverse-proxy/`, `services/auth-service/` or refactor existing `login-api`).  
3. Implement Milestone 1 (proxy) and iterate per milestone list.  
4. Keep monitoring dashboards updated to track new metrics.  
5. After Phase 2.1 completion, reassess backlog for Phase 2.2.

---

*Prepared for DevSecOps Hacking Lab – Phase 2.1 (November 2025).*

