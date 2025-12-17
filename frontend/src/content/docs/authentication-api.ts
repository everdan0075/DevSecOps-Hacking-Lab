/**
 * Authentication API Guide
 */

import type { DocGuide } from '../docs'

export const authenticationApiGuide: DocGuide = {
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
}
