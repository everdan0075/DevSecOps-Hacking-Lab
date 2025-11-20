# Burp Suite Professional - DevSecOps Lab Setup

## Quick Start

### 1. Configure Burp Proxy

**Proxy Settings**: 127.0.0.1:8081 (not 8080, that's our gateway)

```
Proxy → Options → Proxy Listeners
Add → Port: 8081 → Bind to address: Loopback only
```

### 2. Browser Configuration

**Firefox**:
```
Preferences → Network Settings → Manual proxy configuration
HTTP Proxy: 127.0.0.1, Port: 8081
✓ Also use this proxy for HTTPS
```

**Chrome** (with extension):
```
Install: FoxyProxy
Add proxy: 127.0.0.1:8081
```

### 3. Import Burp CA Certificate

```bash
# Navigate to
http://burp

# Download CA certificate
# Import to browser trusted certificates
```

## Lab Attack Scenarios

### Scenario 1: JWT Algorithm Confusion

**Target**: API Gateway JWT validation

```
1. Login and capture token:
   POST http://localhost:8000/auth/login
   {"username": "admin", "password": "admin123"}

2. Send to Repeater (Ctrl+R)

3. Decode JWT in Decoder tab:
   - Select Base64
   - Decode header and payload

4. Modify algorithm:
   Change: "alg": "HS256"
   To: "alg": "none"

5. Remove signature (keep two dots):
   eyJhbGc...payload..

6. Send modified token to /api/profile
   Authorization: Bearer <modified_token>

7. Check response (should be 401 if protected)
```

### Scenario 2: SQL Injection via Scanner

**Target**: User Service endpoints

```
1. Browse to http://localhost:8002/users?id=1

2. Right-click request → Scan

3. Scanner Configuration:
   - Issue types: SQL injection
   - Insertion points: All parameters
   - Thoroughness: Thorough

4. Wait for results

5. Analyze findings:
   - Check evidence
   - Test manually in Repeater
   - Exploit with SQLMap (copy request)
```

### Scenario 3: Rate Limit Bypass (Intruder)

**Target**: Login endpoint rate limiting

```
1. Capture login request:
   POST http://localhost:8000/auth/login

2. Send to Intruder (Ctrl+I)

3. Configure positions:
   Add position on password field
   Attack type: Sniper

4. Payloads:
   Load wordlist (e.g., top-100-passwords.txt)

5. Options:
   Request Engine → Number of threads: 10
   Grep - Match: Add "Invalid credentials"

6. Start attack

7. Analyze results:
   - Check for rate limiting (429 responses)
   - Look for successful logins (200)
   - Count blocked requests
```

### Scenario 4: IDOR Exploitation

**Target**: User profile enumeration

```
1. Access your profile:
   GET http://localhost:8080/api/profile/1
   Authorization: Bearer <your_token>

2. Send to Intruder

3. Configure:
   Position: Profile ID (§1§)
   Attack type: Numbers
   From: 1, To: 100, Step: 1

4. Start attack

5. Analyze:
   - Status codes (200 = accessible, 403 = protected)
   - Response length variations
   - Sensitive data in responses

6. Extract data:
   Options → Grep - Extract
   Add regex for email, SSN, etc.
```

### Scenario 5: API Endpoint Discovery

**Target**: Hidden API endpoints

```
1. Browse application normally

2. Proxy → HTTP history → Filter by:
   - Show only: API requests
   - Extension: json

3. Send interesting request to Intruder

4. Configure:
   Position: Endpoint path
   Payload: SecLists/api-endpoints.txt

5. Results analysis:
   - 200: Valid endpoints
   - 401: Authentication required
   - 404: Not found
   - 403: Forbidden (exists but no access)
```

## Advanced Techniques

### Extension: JWT Editor

**Installation**:
```
Extender → BApp Store → JWT Editor
```

**Usage**:
```
1. HTTP history → Select request with JWT

2. JWT Editor tab appears

3. Modify claims:
   - Change "role": "user" to "role": "admin"
   - Extend expiration time
   - Modify user_id

4. Sign with:
   - None algorithm (uncheck signature)
   - Symmetric key (if known)
   - Embedded JWK attack

5. Send modified request
```

### Extension: Autorize

**Purpose**: Automated authorization testing (IDOR detection)

```
1. Install Autorize from BApp Store

2. Configure two users:
   - User A token (low privilege)
   - User B token (high privilege)

3. Browse as User A

4. Autorize automatically tests each request with User B token

5. Flags authorization issues:
   - User A can access User B resources
   - Privilege escalation possible
```

### Extension: Upload Scanner

**Purpose**: File upload vulnerability detection

```
1. Install Upload Scanner

2. Upload file normally

3. Extension automatically tests:
   - Executable uploads (.php, .jsp, .asp)
   - Path traversal (../../shell.php)
   - Content-Type bypass
   - Double extension (.php.jpg)

4. Review findings in Issues tab
```

## Collaboration Features

### Project Export/Import

```
# Export findings
Burp → Project → Save project

# Share with team
project.burp → Send to colleagues

# Import
Burp → Project → Open project
```

### Report Generation

```
1. Target → Site map → Select host

2. Right-click → Report selected issues

3. Configure:
   - HTML report
   - Include HTTP requests/responses
   - Executive summary

4. Export → devsecops-lab-report.html
```

## Integration with Other Tools

### Export to SQLMap

```
1. Right-click vulnerable request

2. Copy to file → request.txt

3. Run SQLMap:
   sqlmap -r request.txt --batch --dbs
```

### Export to Metasploit

```
1. Scanner → Results

2. Right-click → Send to Metasploit

3. (Requires Metasploit RPC integration)
```

### Export to Nuclei

```
# Generate Nuclei template from finding

1. Identify vulnerability in Scanner

2. Copy request to file: jwt-vuln.yaml

3. Create Nuclei template:
   id: jwt-alg-confusion
   requests:
     - raw:
       - |
         POST /auth/login HTTP/1.1
         Host: localhost:8000
         ...
```

## Macros & Session Handling

### Auto-Login Macro

**Use case**: Automated re-authentication

```
1. Proxy → Options → Sessions

2. Session Handling Rules → Add

3. Rule Actions → Run a macro

4. Macro Recorder:
   - Record login flow
   - Extract access_token from response
   - Use in subsequent requests

5. Scope:
   - Include all URLs
   - Tools: Scanner, Intruder
```

### MFA Bypass with Macro

```
1. Record macro:
   a. POST /auth/login → Get challenge_id
   b. Generate MFA code (external script)
   c. POST /auth/mfa/verify → Get token

2. Configure parameter extraction:
   - Extract challenge_id from step 1
   - Use in step 3

3. Enable for Scanner/Intruder
```

## Performance Tuning

### For Lab Environment

```
Proxy → Options → Connection
- Upstream proxy: None
- Timeouts: 30 seconds

Intruder → Options → Request Engine
- Number of threads: 5 (avoid rate limiting)
- Delay between requests: 500ms

Scanner → Options → Live Scanning
- Live passive crawl: Off (manual control)
- Live audit: Off
```

## Common Issues & Solutions

### Issue: Browser shows "Connection Refused"

**Solution**:
```
1. Check Burp proxy is running (8081)
2. Verify browser proxy settings
3. Check firewall rules
```

### Issue: HTTPS errors

**Solution**:
```
1. Import Burp CA certificate
2. Trust for website authentication
3. Restart browser
```

### Issue: Rate limiting blocks scan

**Solution**:
```
1. Reduce Intruder threads (5 → 1)
2. Increase delay (500ms → 2000ms)
3. Use multiple IP addresses (if applicable)
```

## Cheat Sheet

### Keyboard Shortcuts

```
Ctrl+R - Send to Repeater
Ctrl+I - Send to Intruder
Ctrl+Shift+B - Send to Comparer
Ctrl+T - New tab in Repeater
Ctrl+Space - Send request (Repeater)
```

### Useful Extensions

```
- JWT Editor: JWT manipulation
- Autorize: Authorization testing
- Turbo Intruder: High-speed attacks
- Upload Scanner: File upload testing
- ActiveScan++: Extra vulnerability checks
- Param Miner: Parameter discovery
```

### Quick Tests

```
# Test JWT algorithm confusion
1. Capture token → Decoder
2. Change "alg": "HS256" to "alg": "none"
3. Remove signature → Send

# Test IDOR
1. Access /api/profile/1 → Intruder
2. Set payload: Numbers 1-100
3. Check 200 responses

# Test SQL injection
1. Scanner → Scan /users?id=1
2. Wait for findings
3. Export to SQLMap
```
