/**
 * IDOR Exploitation Guide
 */

import type { DocGuide } from '../docs'

export const idorGuide: DocGuide = {
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
}
