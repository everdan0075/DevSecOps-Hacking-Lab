/**
 * Brute Force Attack Guide
 */

import type { DocGuide } from '../docs'

export const bruteForceGuide: DocGuide = {
  slug: 'brute-force',
  title: 'Brute Force Attack',
  description: 'Password enumeration against authentication endpoint',
  category: 'attack-guides',
  lastUpdated: '2025-11-14',
  content: [
    {
      type: 'heading',
      level: 1,
      content: 'Brute Force Attack',
    },
    {
      type: 'paragraph',
      content: 'A brute force attack attempts to guess valid credentials by trying many username/password combinations. This attack demonstrates rate limiting bypass and automated credential enumeration.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'What is Brute Force?',
    },
    {
      type: 'paragraph',
      content: 'Brute force attacks systematically try all possible combinations of credentials until a valid one is found. They can be:',
    },
    {
      type: 'list',
      content: [
        'Dictionary-based: Using common passwords from wordlists',
        'Credential stuffing: Using leaked credentials from other breaches',
        'Pure brute force: Trying all possible character combinations',
        'Hybrid: Combining dictionary words with common patterns (Password1, Password123)',
      ],
    },
    {
      type: 'heading',
      level: 2,
      content: 'How This Attack Works',
    },
    {
      type: 'paragraph',
      content: 'Our implementation targets the authentication endpoint with a predefined password list:',
    },
    {
      type: 'code',
      language: 'python',
      content: `# Simplified attack flow
passwords = ["admin", "password", "123456", "admin123", ...]

for password in passwords:
    response = requests.post(
        "http://localhost:8000/auth/login",
        json={"username": "admin", "password": password}
    )
    if response.status_code == 200:
        print(f"SUCCESS: Found password: {password}")
        break`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Step-by-Step Execution',
    },
    {
      type: 'paragraph',
      content: 'Using the Attack Playground:',
    },
    {
      type: 'list',
      content: [
        'Navigate to Attack Playground',
        'Find the "Brute Force Attack" card',
        'Click "Launch Attack"',
        'Enter target username (default: admin)',
        'Click "Execute Attack"',
        'Watch real-time logging as passwords are tested',
        'See results showing attempts, success/failure, and time taken',
      ],
    },
    {
      type: 'heading',
      level: 2,
      content: 'Using the Python Script',
    },
    {
      type: 'code',
      language: 'bash',
      content: `cd attacks/brute-force
python brute_force.py --target http://localhost:8000/auth/login --username admin

# Output:
# [*] Starting brute force attack against admin
# [*] Attempting: admin
# [*] Attempting: password
# [*] Attempting: 123456
# [+] SUCCESS! Password found: admin123
# [*] Total attempts: 4 | Time: 2.31s`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Detection in Metrics',
    },
    {
      type: 'paragraph',
      content: 'This attack is visible in multiple metrics:',
    },
    {
      type: 'table',
      content: {
        headers: ['Metric', 'What to Look For', 'Alert Threshold'],
        rows: [
          ['login_attempts_total{status="failure"}', 'Spike in failed logins', '> 10 in 5 minutes'],
          ['gateway_rate_limit_blocks_total', 'Rate limit violations', '> 5 blocks'],
          ['http_requests_total{endpoint="/auth/login"}', 'High request volume', '> 60 per minute'],
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
        'Rate Limiting: Limit login attempts (implemented: 60 req/min at gateway)',
        'Account Lockout: Ban IP or account after N failed attempts (implemented: 10 failures = 15min ban)',
        'CAPTCHA: Require human verification after failed attempts',
        'Multi-Factor Authentication: MFA makes brute force impractical (implemented)',
        'Password Policies: Enforce strong, unique passwords',
        'Monitoring: Alert on unusual login patterns (implemented)',
        'Progressive Delays: Increase delay after each failed attempt',
      ],
    },
    {
      type: 'warning',
      content: 'The current implementation has rate limiting at the gateway (60 req/min), but this can be bypassed by attacking the auth service directly on port 8000. This is intentional for demonstration purposes.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'Real-World Impact',
    },
    {
      type: 'paragraph',
      content: 'Successful brute force attacks can lead to:',
    },
    {
      type: 'list',
      content: [
        'Account takeover and unauthorized access',
        'Data breaches if admin accounts are compromised',
        'Lateral movement within the network',
        'Privilege escalation if service accounts are compromised',
        'Compliance violations (GDPR, PCI-DSS)',
      ],
    },
  ],
}
