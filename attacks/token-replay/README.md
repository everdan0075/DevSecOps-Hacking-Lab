# Token Replay Attack

## Overview

Token replay attacks test the security of JWT (JSON Web Token) implementations by attempting to:
- Use expired access tokens
- Reuse revoked refresh tokens
- Tamper with JWT payloads
- Replay tokens multiple times (test token rotation)

## How It Works

The script performs a comprehensive security assessment of the JWT implementation:

1. **Expired Access Token Test**: Waits for token expiration and attempts to use it
2. **Revoked Token Test**: Revokes a refresh token and tries to use it
3. **Tampered JWT Test**: Modifies JWT payload and tests signature verification
4. **Token Replay Test**: Attempts to reuse a refresh token after it's been used once

## Usage

### Get MFA Code

First, generate a valid MFA code:

```bash
docker exec login-api python -c "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())"
```

### Run Attack

```bash
python token_replay.py \
  --target http://localhost:8000 \
  --username admin \
  --password admin123 \
  --mfa-code <code-from-above>
```

## Expected Results

### Secure Implementation

- **Expired Access Token**: Rejected (401 Unauthorized)
- **Revoked Refresh Token**: Rejected (401 Unauthorized)
- **Tampered JWT**: Rejected due to signature verification failure
- **Token Replay**: Old refresh token rejected after rotation (401 Unauthorized)

### Vulnerable Implementation

- **No Token Expiration**: Tokens work indefinitely
- **No Revocation**: Logged out tokens still work
- **No Signature Verification**: Tampered tokens accepted
- **No Token Rotation**: Same refresh token works multiple times

## Defense Mechanisms Tested

1. **Token Expiration**: Short-lived access tokens (5 minutes)
2. **Refresh Token Rotation**: New refresh token issued on each refresh
3. **Token Revocation**: Redis-based token blacklist
4. **Signature Verification**: HMAC-based JWT signing

## Results

Test results are saved to `results/token_replay_YYYYMMDD_HHMMSS.json`

## Notes

- This test will wait for tokens to expire (5 minutes by default)
- Multiple login attempts will be made to obtain fresh tokens for each test
- Some tests may trigger rate limiting or IP bans

## Ethical Usage

**⚠️ IMPORTANT**: This tool is for educational purposes only. Only use it against systems you own or have explicit permission to test.

