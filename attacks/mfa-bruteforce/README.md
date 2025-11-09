# MFA Brute-Force Attack

## Overview

This attack tests the security of Multi-Factor Authentication (MFA) implementation by attempting to guess 6-digit TOTP codes through brute-force. 

**Theoretical Attack Space**: 1,000,000 possible 6-digit codes (000000-999999)

## How It Works

1. **Obtain MFA Challenge**: Login with valid credentials to get a challenge_id
2. **Brute-Force Codes**: Try common/sequential codes with the challenge
3. **Test Defenses**: Measure how many attempts are allowed before:
   - Challenge expires (TTL)
   - Max attempts limit is hit
   - Rate limiting blocks requests
   - IP gets banned

## Usage

### Basic Attack

```bash
python mfa_bruteforce.py \
  --target http://localhost:8000 \
  --username admin \
  --password admin123 \
  --code-count 100
```

### Aggressive Attack

```bash
python mfa_bruteforce.py \
  --target http://localhost:8000 \
  --username admin \
  --password admin123 \
  --code-count 500 \
  --max-concurrent 10 \
  --delay 0.1
```

### Stealthy Attack

```bash
python mfa_bruteforce.py \
  --target http://localhost:8000 \
  --username admin \
  --password admin123 \
  --code-count 50 \
  --max-concurrent 1 \
  --delay 2.0
```

## Code Testing Strategy

The script uses a smart code ordering strategy:

1. **Common Codes First** (most likely to succeed):
   - 000000, 111111, 222222, etc. (repeated digits)
   - 123456, 654321 (sequential patterns)
   
2. **Random Sampling**: Random codes from the 0-999999 space

This approach maximizes the chance of finding a weak code quickly.

## Expected Defenses

A secure MFA implementation should have:

1. **Attempt Limit**: Max 3-5 attempts per challenge
2. **Challenge TTL**: Expires after 5 minutes
3. **Rate Limiting**: Limits requests per IP
4. **Account Lockout**: Temporary lock after multiple failed MFA attempts
5. **Time-based Codes**: TOTP codes expire every 30 seconds

## Expected Results

### Secure Implementation (Expected)

```
Total Attempts: 100
Successful Codes: 0
Max Attempts Exceeded: 1 (after 5 attempts)

✓ PROTECTED: Max MFA attempts limit is enforced
```

### Vulnerable Implementation (Security Issue)

```
Total Attempts: 234
Successful Codes: 1
Code: 123456

✗ VULNERABLE: MFA code was successfully brute-forced!
```

## Success Probability

- **Without Attempt Limit**: ~0.01% per 100 attempts (for random code)
- **With Common Codes**: Higher if user chose weak code (000000, 123456)
- **With 5-Attempt Limit**: Attack is impractical

## Defense Mechanisms Tested

1. **MFA_MAX_ATTEMPTS**: Configured in auth service (default: 5)
2. **MFA_CHALLENGE_TTL**: Challenge expiration (default: 300s)
3. **Rate Limiting**: Per-endpoint limits
4. **TOTP Time Window**: 30-second code validity

## Results

Attack results are saved to `results/mfa_bruteforce_YYYYMMDD_HHMMSS.json`

## Real-World Mitigations

- Use TOTP with short time windows (30s)
- Implement exponential backoff
- Lock account temporarily after 3-5 failed MFA attempts
- Require re-authentication after MFA failure
- Monitor for suspicious patterns (many MFA failures from same IP)

## Ethical Usage

**⚠️ IMPORTANT**: This tool is for educational purposes only. Only use it against systems you own or have explicit permission to test. Unauthorized access attempts are illegal.

