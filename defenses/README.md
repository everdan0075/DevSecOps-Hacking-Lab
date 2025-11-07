# Defense Mechanisms

This directory contains security defense implementations and hardening configurations.

## Current Defenses

### 1. Rate Limiting
**Location**: `vulnerable-services/login-api/app/security.py`

**Implementation**: Token bucket algorithm via SlowAPI

**Configuration**:
```env
RATE_LIMIT_REQUESTS=5
RATE_LIMIT_WINDOW=60
```

**How it works**:
- Tracks requests per IP address
- Returns HTTP 429 when limit exceeded
- Time-based window for rate calculation

### 2. IP Banning
**Location**: `vulnerable-services/login-api/app/security.py`

**Implementation**: Threshold-based temporary banning

**Configuration**:
```env
BAN_THRESHOLD=10
BAN_DURATION=900  # 15 minutes
```

**How it works**:
- Tracks failed login attempts per IP
- Automatically bans IPs exceeding threshold
- Returns HTTP 403 for banned IPs
- Auto-expires after configured duration

## Planned Defense Mechanisms

### Phase 2: Advanced Defenses

#### Web Application Firewall (WAF)
- ModSecurity integration
- OWASP Core Rule Set
- Custom rule definitions
- SQL injection prevention
- XSS prevention

#### Input Validation
- Schema validation
- Sanitization
- Type checking
- Length limits
- Whitelist/blacklist patterns

#### Output Encoding
- HTML entity encoding
- JavaScript escaping
- URL encoding
- SQL escaping

#### CAPTCHA Integration
- Google reCAPTCHA
- hCaptcha
- Challenge-response for suspicious activity

#### Multi-Factor Authentication (MFA)
- TOTP (Time-based One-Time Password)
- SMS verification
- Email verification
- Backup codes

#### Security Headers
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- X-XSS-Protection

#### Session Management
- Secure session tokens
- Token rotation
- Session timeout
- Concurrent session limits

## Defense Effectiveness Metrics

Track defense performance:
- **Block rate**: % of malicious requests blocked
- **False positive rate**: % of legitimate requests blocked
- **Response time impact**: Latency added by defenses
- **Attack detection rate**: % of attacks identified

## Configuration Best Practices

### Development
```env
ENABLE_RATE_LIMITING=true
RATE_LIMIT_REQUESTS=5
ENABLE_IP_BANNING=true
```

### Production
```env
ENABLE_RATE_LIMITING=true
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60
ENABLE_IP_BANNING=true
BAN_THRESHOLD=5
BAN_DURATION=1800
```

### Testing Attacks
```env
ENABLE_RATE_LIMITING=false  # Temporarily disable for testing
ENABLE_IP_BANNING=false
```

## Testing Defenses

### Test Rate Limiting
```bash
# Rapid requests should trigger rate limiting
for i in {1..20}; do
  curl -X POST http://localhost:8000/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"test"}' &
done
```

### Test IP Banning
```bash
# Multiple failed attempts should trigger ban
cd attacks/brute-force
python brute_force.py \
  --target http://localhost:8000/login \
  --username admin \
  --delay 0.1
```

## Future Enhancements

- Redis-based distributed rate limiting
- Machine learning anomaly detection
- Geographic IP blocking
- Reputation-based scoring
- Automated incident response
- Integration with SIEM systems

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on adding new defense mechanisms.




