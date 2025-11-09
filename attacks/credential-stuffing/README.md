# Credential Stuffing Attack

## Overview

Credential stuffing is an attack where leaked username:password pairs from data breaches are tested against a target service. Unlike brute-force attacks that try many passwords for one user, credential stuffing uses known credential pairs that worked on other services.

## How It Works

1. Load a list of known username:password combinations
2. Attempt to login with each pair
3. Track which credentials are valid on the target system
4. Handle rate limiting and IP bans

## Usage

### Basic Attack

```bash
python credential_stuffing.py \
  --target http://localhost:8000/auth/login \
  --credentials wordlists/leaked-credentials.txt
```

### Advanced Options

```bash
# Slow and stealthy (avoid detection)
python credential_stuffing.py \
  --target http://localhost:8000/auth/login \
  --credentials wordlists/leaked-credentials.txt \
  --max-concurrent 1 \
  --delay 2.0

# Fast and aggressive (testing rate limits)
python credential_stuffing.py \
  --target http://localhost:8000/auth/login \
  --credentials wordlists/leaked-credentials.txt \
  --max-concurrent 10 \
  --delay 0.1
```

## Credentials File Format

The credentials file should contain one username:password pair per line:

```
username1:password1
username2:password2
admin:admin123
```

Lines starting with `#` are treated as comments.

## Expected Results

The script will report:
- **Successful Logins**: Credentials that passed authentication
- **MFA Required**: Valid credentials that require second factor
- **Failed Attempts**: Invalid credentials
- **Rate Limited**: Requests blocked by rate limiter (429)
- **Blocked**: IP banned due to suspicious activity (403)

## Defense Mechanisms

This attack tests the following defenses:
- Rate limiting per endpoint
- IP-based blocking after failed attempts
- MFA as additional layer
- Account lockout policies (if implemented)

## Results

Attack results are saved to `results/credential_stuffing_YYYYMMDD_HHMMSS.json`

## Ethical Usage

**⚠️ IMPORTANT**: This tool is for educational purposes only. Only use it against systems you own or have explicit permission to test. Unauthorized access attempts are illegal.

