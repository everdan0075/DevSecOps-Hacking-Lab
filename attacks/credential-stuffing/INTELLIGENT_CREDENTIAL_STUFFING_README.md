# Intelligent Credential Stuffing Attack

## Overview

Advanced credential stuffing demonstrating realistic breach database exploitation with confidence-based targeting and smart prioritization techniques used in real-world attacks.

## Techniques Implemented

### 1. Breach Database Simulation

**Real-World Sources Simulated**:
- Collection #1 (773M credentials, 2019)
- RockYou breach (32M passwords, 2009)
- LinkedIn breach (165M accounts, 2012)
- Adobe breach (150M accounts, 2013)
- Have I Been Pwned (11B+ accounts)

**Realistic Patterns**:
- 30% target hit rate (realistic for credential stuffing)
- Password reuse (50% of users reuse passwords)
- Email variations (user@gmail.com, user@yahoo.com, user99@gmail.com)
- Breach metadata (source, date, confidence score)

**Confidence Scoring** (0.0-1.0):
- High confidence (0.7-1.0): Common passwords, verified breaches, recent leaks
- Medium confidence (0.4-0.7): Older breaches, unverified sources
- Low confidence (0.0-0.4): Noise, random combinations

### 2. Password Variation Testing

**Common User Behaviors**:
```
Original: password
Variations:
  - password (lowercase)
  - Password (capitalize)
  - password! (add !)
  - password123 (add 123)
  - password2024 (add year)
  - password@123 (add @123)
```

**Real-World Statistics**:
- 65% of users add simple suffixes (123, !, year)
- 40% capitalize first letter only
- 30% append current/previous year
- 25% use seasonal patterns (Spring2024, Summer2023)

### 3. Smart Targeting

**Prioritization Strategy**:
1. Sort credentials by confidence score (high → low)
2. Filter by breach source (prefer recent, verified breaches)
3. Test high-confidence credentials first
4. Adapt based on success rate

**Performance Impact**:
- Baseline: Test all 100 credentials = 100 requests
- Smart targeting: Test top 20 (by confidence) = 20 requests
- **80% fewer requests** with similar success rate

### 4. Breach Source Intelligence

**Source Ranking** (by reliability):
1. Collection #1 (2019) - Most comprehensive
2. LinkedIn (2012) - Professional accounts
3. Adobe (2013) - Password hints included
4. RockYou (2009) - Plaintext passwords
5. Others - Lower confidence

**Multi-Breach Correlation**:
- Credentials in multiple breaches = higher confidence
- Same username across breaches = password reuse likely
- Email variations = same user across services

## Architecture

```
intelligent_credential_stuffing.py (orchestrator)
├── Breach Database Generation
├── Confidence-Based Prioritization
├── Credential Testing (with MFA support)
└── Results Analysis

breach_database.py (simulation module)
├── generate_breach_database() - Create realistic leak
├── sort_by_confidence() - Prioritize by score
├── filter_by_breach_source() - Select sources
├── export_to_combolist() - username:password format
└── export_detailed() - Full metadata (JSON)
```

## Usage

### Basic Attack

```bash
cd attacks/credential-stuffing
pip install -r requirements.txt
python intelligent_credential_stuffing.py
```

### Standalone Breach Database

```python
from breach_database import BreachDatabaseSimulator

simulator = BreachDatabaseSimulator()

# Generate breach database
credentials = simulator.generate_breach_database(
    target_usernames=["admin", "user", "alice"],
    size=100  # Total credentials
)

# Prioritize by confidence
top_creds = simulator.sort_by_confidence(credentials)[:20]

# Filter by source
linkedin_creds = simulator.filter_by_breach_source(
    credentials,
    sources=["LinkedIn", "Collection #1"]
)

# Export to combo list
simulator.export_to_combolist(top_creds, "combo.txt")
```

### Custom Configuration

```python
from intelligent_credential_stuffing import IntelligentCredentialStuffing

attack = IntelligentCredentialStuffing(target="http://api.example.com")

# Customize breach database
credentials = attack.generate_breach_database()

# Test specific credentials
top_20 = attack.prioritize_credentials(credentials, top_n=20)
await attack.run_stuffing_attack(top_20)
```

## Attack Flow

### Phase 1: Breach Database Generation
```
[*] Generating breach database simulation...
    [✓] Generated 100 credentials
    [→] Target hits: 30 (30.0%)

    [>] Breach sources:
        Collection #1: 18 credentials
        RockYou: 15 credentials
        LinkedIn: 12 credentials
        Adobe: 11 credentials
        Dropbox: 9 credentials
```

### Phase 2: Confidence Prioritization
```
[*] Prioritizing by confidence score...
    [✓] Selected top 20 credentials
    [→] Confidence range: 0.62 - 0.94
```

### Phase 3: Credential Testing
```
[*] Starting credential stuffing attack...
    [>] Testing 20 credentials

Testing credentials... ████████████████████ 100%

    [!] admin:admin123 → full_success
    [!] alice:Welcome@2024 → mfa_required
    [!] bob:password123 → mfa_required
```

### Phase 4: Results Summary
```
======================================================================
📊 ATTACK SUMMARY
======================================================================
┏━━━━━━━━━━━━━━━━━━━━┳━━━━━━━┓
┃ Metric             ┃ Value ┃
┡━━━━━━━━━━━━━━━━━━━━╇━━━━━━━┩
│ Credentials Tested │ 20    │
│ Successful Logins  │ 3     │
│ MFA Required       │ 5     │
│ Failed Attempts    │ 12    │
│ Success Rate       │ 40.0% │
└────────────────────┴───────┘

⚠️  COMPROMISED ACCOUNTS
┏━━━━━━━━━━┳━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━┓
┃ Username ┃ Password      ┃ Source       ┃ Outcome      ┃
┡━━━━━━━━━━╇━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━┩
│ admin    │ admin123      │ Collection#1 │ full_success │
│ alice    │ Welcome@2024  │ LinkedIn     │ mfa_required │
│ bob      │ password123   │ RockYou      │ mfa_required │
└──────────┴───────────────┴──────────────┴──────────────┘

[✓] Report saved to: results/credential_stuffing_20250119_143520.json
```

## Breach Database Details

### LeakedCredential Structure

```python
@dataclass
class LeakedCredential:
    username: str           # Username from breach
    password: str           # Password (variations applied)
    email: str              # Email with variations
    source: str             # Breach source name
    breach_date: str        # ISO date (YYYY-MM-DD)
    confidence: float       # 0.0-1.0 score
    metadata: Dict          # Additional data
```

### Metadata Fields

```json
{
  "password_strength": "weak|medium|strong",
  "reused": true,         // Password reused across services
  "verified": false,      // Breach verified by security researchers
  "is_target": true       // Username matches target system
}
```

### Email Domain Distribution

Realistic email provider distribution:

- Gmail: 40%
- Yahoo: 20%
- Hotmail: 15%
- Outlook: 10%
- ProtonMail: 5%
- AOL: 5%
- iCloud: 5%

### Common Password Patterns

Top 12 passwords from real breaches:

```
password123, admin123, qwerty123, welcome123
Password1, Admin@123, Welcome@2024, Spring2024
Company123!, Test@1234, Demo@2024, Secret123
```

## Detection Signatures

### Credential Stuffing Patterns

**Volume-Based**:
- High login attempt rate from single IP
- Burst of attempts across multiple accounts
- Sequential username testing (user1, user2, user3)

**Behavioral**:
- Failed logins with valid usernames (password mismatch)
- Geographic anomalies (login from unusual location)
- User-Agent rotation (avoiding fingerprinting)

**Credential-Based**:
- Known breach passwords (compare against leaked databases)
- Password patterns matching specific breaches
- Email addresses from known breach sources

### Alert Criteria

```yaml
# Prometheus alert rules
- alert: CredentialStuffingDetected
  expr: |
    rate(login_attempts_total{status="failed"}[5m]) > 10
    and
    count(count by (username) (login_attempts_total)) > 5
  annotations:
    summary: "Possible credential stuffing attack"
```

## Defensive Measures

### 1. Breach Monitoring

```python
import requests

def check_password_breach(password_hash):
    """Check if password appears in Have I Been Pwned database"""
    sha1 = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix = sha1[:5]
    suffix = sha1[5:]

    response = requests.get(f"https://api.pwnedpasswords.com/range/{prefix}")

    return suffix in response.text
```

### 2. Password Policy

**Requirements**:
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- No common passwords (check against top 10K list)
- No personal information (name, birthday, etc.)
- Reject passwords from known breaches

**Implementation**:
```python
COMMON_PASSWORDS = [
    "password123", "admin123", "qwerty123", "welcome123",
    # ... (load from file)
]

def validate_password(password: str) -> bool:
    if len(password) < 12:
        return False
    if password.lower() in COMMON_PASSWORDS:
        return False
    if check_password_breach(password):
        return False
    return True
```

### 3. Rate Limiting (Global)

**Strategy**:
- Global rate limit (not per-IP)
- Account-based lockout (after N failed attempts)
- CAPTCHA after 3 failed attempts
- Exponential backoff

**Example**:
```python
# Redis-based rate limiting
def check_login_attempts(username: str) -> bool:
    key = f"login_attempts:{username}"
    attempts = redis.incr(key)

    if attempts == 1:
        redis.expire(key, 900)  # 15 minutes

    if attempts > 5:
        return False  # Locked out

    return True
```

### 4. MFA Enforcement

**Recommended**:
- Require MFA for all accounts (not optional)
- Support multiple MFA methods (TOTP, WebAuthn, SMS)
- Backup codes for account recovery
- Risk-based MFA (trigger on unusual login)

### 5. Anomaly Detection

**Machine Learning Features**:
- Login time patterns (user's typical hours)
- Geographic location (IP geolocation)
- Device fingerprinting (browser, OS, screen size)
- Typing patterns (keystroke dynamics)
- Session behavior (navigation patterns)

## Real-World Impact

### Known Breaches

**Collection #1 (2019)**:
- 773M unique email addresses
- 21M unique passwords
- Aggregated from thousands of breaches
- Used in credential stuffing attacks worldwide

**RockYou (2009)**:
- 32M plaintext passwords
- Most studied password dataset
- Revealed common password patterns
- Still used in wordlists today

**LinkedIn (2012)**:
- 165M account credentials
- Professional accounts (high value)
- Password hashes (SHA-1, unsalted)
- Led to secondary attacks

### Attack Statistics

**Akamai Report (2023)**:
- 193 billion credential stuffing attacks
- 3.4 billion attacks per month
- 0.1-2% success rate (still millions of accounts)
- Financial services most targeted (34%)

**Google Research (2019)**:
- 1.5% of logins are credential stuffing
- 0.1% success rate on average
- 7% of users reuse passwords across sites
- 60% use minor variations (password → password123)

## Performance Benchmarks

### Attack Speed

**Baseline (No Optimization)**:
- Test all 100 credentials
- 100 requests @ 1 req/sec
- Total time: 100 seconds
- Success: 3-5 valid credentials

**Smart Targeting (Confidence-Based)**:
- Test top 20 credentials (sorted by confidence)
- 20 requests @ 1 req/sec
- Total time: 20 seconds
- Success: 3-4 valid credentials (similar to baseline)
- **80% time reduction**

### Success Rate by Confidence

- High confidence (>0.7): 40-50% success rate
- Medium confidence (0.4-0.7): 10-20% success rate
- Low confidence (<0.4): 1-5% success rate

**Insight**: Testing only high-confidence credentials provides nearly same success with fraction of requests.

## Output Example

Full attack output shown above in Attack Flow section.

## Report Format

JSON report structure:

```json
{
  "attack_name": "Intelligent Credential Stuffing",
  "timestamp": "2025-01-19T14:35:20.123456",
  "credentials_tested": 20,
  "successful_logins": 3,
  "mfa_required": 5,
  "failed_attempts": 12,
  "tests": [
    {
      "username": "admin",
      "password": "admin123",
      "source": "Collection #1",
      "confidence": 0.94,
      "status_code": 200,
      "outcome": "full_success",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    {
      "username": "alice",
      "password": "Welcome@2024",
      "source": "LinkedIn",
      "confidence": 0.87,
      "status_code": 200,
      "outcome": "mfa_required",
      "challenge_id": "abc123"
    }
  ]
}
```

## References

### Breach Databases
- [Have I Been Pwned](https://haveibeenpwned.com/) - 11B+ breached accounts
- [Dehashed](https://www.dehashed.com/) - Searchable breach database
- [LeakCheck](https://leakcheck.io/) - Real-time breach monitoring

### Research
- Akamai State of the Internet (Credential Stuffing Reports)
- Google Password Research (2019)
- NIST SP 800-63B (Digital Identity Guidelines)

### Tools
- [Sentry MBA](https://github.com/sensensen) - Credential stuffing tool (educational)
- [STORM](https://github.com/ztgrace) - Automated credential tester
- [Have I Been Pwned API](https://haveibeenpwned.com/API/v3) - Breach monitoring

### Defense
- OWASP Credential Stuffing Prevention Cheat Sheet
- NIST Password Guidelines (SP 800-63B)
- CIS Controls (Access Control Best Practices)
