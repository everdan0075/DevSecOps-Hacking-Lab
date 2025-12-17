/**
 * Security Controls Overview Guide
 */

import type { DocGuide } from '../docs'

export const securityControlsGuide: DocGuide = {
  slug: 'security-controls',
  title: 'Security Controls Overview',
  description: 'Understanding implemented security mechanisms',
  category: 'defense',
  lastUpdated: '2025-11-14',
  content: [
    {
      type: 'heading',
      level: 1,
      content: 'Security Controls Overview',
    },
    {
      type: 'paragraph',
      content: 'The DevSecOps Hacking Lab implements multiple layers of security controls to demonstrate defense in depth. Understanding how these controls work is essential for both attacking and defending systems.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'Authentication Controls',
    },
    {
      type: 'paragraph',
      content: 'JWT-based authentication with MFA:',
    },
    {
      type: 'table',
      content: {
        headers: ['Control', 'Implementation', 'Bypass Method'],
        rows: [
          ['JWT Tokens', 'HS256 signed, 5min expiry', 'Token replay (before expiry)'],
          ['Refresh Tokens', '60min expiry, stored in Redis', 'Token theft from storage'],
          ['MFA (TOTP)', '6-digit codes, 30sec interval', 'Brute force enumeration'],
          ['Token Revocation', 'Blacklist in Redis', 'Race condition before sync'],
        ],
      },
    },
    {
      type: 'code',
      language: 'python',
      content: `# JWT token structure
{
  "sub": "admin",  # Subject (username)
  "exp": 1699999999,  # Expiration (5 minutes from issue)
  "iat": 1699999699,  # Issued at
  "type": "access"  # Token type
}

# Signed with secret key: HS256(header + payload, SECRET_KEY)`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Rate Limiting',
    },
    {
      type: 'paragraph',
      content: 'Two-tier rate limiting implementation:',
    },
    {
      type: 'list',
      content: [
        'Gateway Level: 60 requests per minute per IP (token bucket algorithm)',
        'Auth Service: 10 login attempts before 15-minute IP ban',
        'Burst Allowance: Up to 10 requests in a burst (gateway)',
        'Storage: In-memory (gateway), Redis (auth service)',
      ],
    },
    {
      type: 'code',
      language: 'python',
      content: `# Token bucket rate limiting
class TokenBucket:
    def __init__(self, rate: int, capacity: int):
        self.rate = rate  # 60 req/min
        self.capacity = capacity  # 10 burst
        self.tokens = capacity
        self.last_update = time.time()

    def allow_request(self) -> bool:
        # Refill tokens based on time elapsed
        now = time.time()
        elapsed = now - self.last_update
        self.tokens = min(
            self.capacity,
            self.tokens + (elapsed * self.rate / 60)
        )
        self.last_update = now

        # Consume token if available
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Web Application Firewall (WAF)',
    },
    {
      type: 'paragraph',
      content: 'Pattern-based request validation at gateway:',
    },
    {
      type: 'table',
      content: {
        headers: ['Attack Type', 'Pattern', 'Action'],
        rows: [
          ['SQL Injection', "' OR 1=1, UNION SELECT, DROP TABLE", 'Block (400)'],
          ['XSS', '<script>, javascript:, onerror=', 'Block (400)'],
          ['Path Traversal', '../, ..\\\\, /etc/passwd', 'Block (400)'],
          ['Command Injection', '; rm -rf, | nc, && cat', 'Block (400)'],
        ],
      },
    },
    {
      type: 'code',
      language: 'python',
      content: `# WAF pattern matching
SQL_INJECTION_PATTERNS = [
    r"(\\'|\\\")(\\s)*(or|and)(\\s)*(\\'|\\\")?(\\s)*=",
    r"union(\\s)+select",
    r"drop(\\s)+table",
]

def check_sql_injection(text: str) -> bool:
    for pattern in SQL_INJECTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True  # Attack detected
    return False`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Security Headers',
    },
    {
      type: 'paragraph',
      content: 'HTTP security headers applied by gateway:',
    },
    {
      type: 'code',
      language: 'text',
      content: `X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'IP Banning',
    },
    {
      type: 'paragraph',
      content: 'Automated IP blocking based on attack patterns:',
    },
    {
      type: 'table',
      content: {
        headers: ['Trigger', 'Ban Duration', 'Storage'],
        rows: [
          ['10 failed logins', '15 minutes', 'Redis (auth service)'],
          ['Brute force alert', '1 hour', 'Redis (incident bot)'],
          ['MFA enumeration', '2 hours', 'Redis (incident bot)'],
          ['IDOR exploitation', '12 hours', 'Redis (incident bot)'],
          ['Gateway bypass', '24 hours', 'Redis (incident bot)'],
        ],
      },
    },
    {
      type: 'code',
      language: 'python',
      content: `# IP ban storage in Redis
await redis.setex(
    f"banned_ip:{ip_address}",
    duration,  # TTL in seconds
    json.dumps({
        "reason": "brute_force",
        "banned_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(seconds=duration)).isoformat()
    })
)

# Check if IP is banned
banned = await redis.get(f"banned_ip:{request.client.host}")
if banned:
    raise HTTPException(status_code=403, detail="IP banned")`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Monitoring & Alerting',
    },
    {
      type: 'paragraph',
      content: 'Prometheus metrics and Alertmanager rules:',
    },
    {
      type: 'list',
      content: [
        'Login Attempts: Track success/failure rates (login_attempts_total)',
        'MFA Failures: Monitor brute force attempts (mfa_attempts_total)',
        'IDOR Detection: Count profile enumeration (user_service_idor_attempts_total)',
        'Rate Limit Blocks: Track violations (gateway_rate_limit_blocks_total)',
        'WAF Blocks: Monitor attack attempts (gateway_waf_blocks_total)',
      ],
    },
    {
      type: 'code',
      language: 'yaml',
      content: `# Prometheus alert rule example
- alert: LoginFailureSpike
  expr: |
    rate(login_attempts_total{status="failure"}[5m]) > 0.5
  for: 2m
  labels:
    severity: warning
    category: brute-force
  annotations:
    summary: "High login failure rate detected"
    description: "{{ $value }} failures per second"`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Defense in Depth Strategy',
    },
    {
      type: 'paragraph',
      content: 'Multiple layers ensure that compromising one control doesn\'t break entire security:',
    },
    {
      type: 'code',
      language: 'text',
      content: `Layer 1: Network
  - Docker networking
  - Firewall rules (in production)

Layer 2: Gateway
  - Rate limiting
  - WAF
  - Security headers

Layer 3: Authentication
  - JWT validation
  - MFA
  - Token revocation

Layer 4: Authorization
  - Role-based access control (RBAC)
  - Resource ownership checks

Layer 5: Monitoring
  - Real-time metrics
  - Automated alerting
  - Incident response

Layer 6: Incident Response
  - Automated IP banning
  - Runbook execution
  - Post-incident analysis`,
    },
    {
      type: 'info',
      content: 'Even with these controls, the intentional vulnerabilities (IDOR, auth bypass, direct access) demonstrate that security must be implemented at EVERY layer, not just perimeter defenses.',
    },
  ],
}
