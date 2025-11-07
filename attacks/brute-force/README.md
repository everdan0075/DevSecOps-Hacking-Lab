# Brute Force Attack Module

## Overview

This module demonstrates brute-force password attacks against authentication endpoints. It is designed for **educational purposes only** and should only be used in authorized testing environments.

## Features

- Asynchronous password testing for efficiency
- Rate limiting and concurrent request controls
- Automatic detection of defense mechanisms (rate limiting, IP banning)
- Beautiful CLI output with progress tracking
- Detailed result reporting and export
- Safety checks to prevent accidental misuse

## Installation

```bash
cd attacks/brute-force
pip install -r requirements.txt
```

## Usage

### Basic Attack

```bash
python brute_force.py \
  --target http://localhost:8000/login \
  --username admin
```

### With Custom Wordlist

```bash
python brute_force.py \
  --target http://localhost:8000/login \
  --username admin \
  --wordlist /path/to/passwords.txt
```

### With Rate Limiting

```bash
python brute_force.py \
  --target http://localhost:8000/login \
  --username admin \
  --delay 0.5 \
  --max-concurrent 3
```

## Parameters

- `--target`: Target login URL (required)
- `--username`: Username to test (required)
- `--wordlist`: Path to password wordlist file (optional, uses built-in list if not provided)
- `--delay`: Delay between requests in seconds (default: 0.1)
- `--max-concurrent`: Maximum concurrent requests (default: 5)
- `--timeout`: Request timeout in seconds (default: 10)

## Output

The script provides:
1. **Real-time progress bar** showing attack progress
2. **Summary table** with attack statistics
3. **Successful credentials** if any are found
4. **Defense mechanism detection** (rate limiting, IP banning)
5. **JSON report** saved to `results/` directory

## Example Output

```
⚔️  Starting Brute Force Attack

Target: http://localhost:8000/login
Username: admin
Passwords to try: 20
Delay: 0.1s
Max concurrent: 5

Testing passwords... ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% 0:00:00

✅ Attack Completed

┌─────────────────────────────────────────┐
│            Attack Summary                │
├──────────────────────┬──────────────────┤
│ Duration             │ 2.45 seconds     │
│ Total Attempts       │ 20               │
│ Successful           │ 1                │
│ Failed               │ 15               │
│ Rate Limited/Banned  │ 4                │
│ Errors               │ 0                │
│ Requests per second  │ 8.16             │
└──────────────────────┴──────────────────┘

🎯 Successful Logins:
  ✓ Password: admin123
    Token: mock-jwt-token-admin

⚠️  Rate Limiting Detected:
  4 requests were blocked
  Defense mechanism is active!
```

## Defense Mechanisms Detected

The script automatically detects:

- **Rate Limiting**: HTTP 429 responses
- **IP Banning**: HTTP 403 responses
- **Timeouts**: Network or application timeouts
- **Other errors**: Connection issues, etc.

## Security Considerations

### ✅ Safe Usage

- Only test systems you own or have written permission to test
- Use in isolated Docker environments
- Keep all traffic on localhost
- Review logs after testing

### ❌ Prohibited

- Testing external systems without authorization
- Using in production environments
- Attacking third-party services
- Automated scanning of unknown targets

## Wordlists

### Built-in Wordlist

If no wordlist is provided, the script uses a small set of common passwords:
- admin, password, 123456, admin123, etc.

### Custom Wordlists

You can use popular wordlists like:
- **rockyou.txt**: Classic large wordlist
- **SecLists**: Curated security testing wordlists
- **Custom**: Create your own for specific scenarios

Example:
```bash
# Download SecLists
git clone https://github.com/danielmiessler/SecLists.git

# Use passwords from SecLists
python brute_force.py \
  --target http://localhost:8000/login \
  --username admin \
  --wordlist SecLists/Passwords/Common-Credentials/10-million-password-list-top-1000.txt
```

## Results

Results are automatically saved to `results/brute_force_YYYYMMDD_HHMMSS.json` with:

```json
{
  "attack_info": {
    "target": "http://localhost:8000/login",
    "username": "admin",
    "timestamp": "2025-10-26T10:30:00",
    "duration": 2.45,
    "total_attempts": 20
  },
  "summary": {
    "successful": 1,
    "failed": 15,
    "rate_limited": 4,
    "errors": 0
  },
  "results": {
    "successful": [...],
    "failed": [...],
    "rate_limited": [...],
    "errors": [...]
  }
}
```

## Learning Objectives

This module teaches:

1. **How brute-force attacks work**: Systematic password guessing
2. **Rate limiting effectiveness**: How delays affect attackers
3. **IP banning mechanisms**: Threshold-based blocking
4. **Attack detection**: Identifying suspicious patterns
5. **Defense tuning**: Balancing security and usability

## Countermeasures

To defend against brute-force attacks:

1. **Rate Limiting**: Limit requests per IP/user
2. **Account Lockout**: Temporary disable after failures
3. **CAPTCHA**: Challenge-response for suspicious activity
4. **IP Banning**: Block malicious sources
5. **Strong Passwords**: Enforce complexity requirements
6. **MFA**: Multi-factor authentication
7. **Monitoring**: Alert on suspicious patterns

## Next Steps

- Experiment with different rate limits
- Try custom wordlists
- Analyze the JSON results
- Review application logs
- Test different defense configurations




