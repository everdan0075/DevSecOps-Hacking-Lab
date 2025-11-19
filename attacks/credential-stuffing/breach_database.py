#!/usr/bin/env python3
"""
Breach Database Simulation
Simulates real-world credential leak databases with realistic patterns.

REAL-WORLD SOURCES:
- Collection #1 (773M credentials, 2019)
- RockYou breach (32M passwords, 2009)
- LinkedIn breach (165M accounts, 2012)
- Adobe breach (150M accounts, 2013)
- Have I Been Pwned (11B+ accounts)
"""

import random
import hashlib
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass
class LeakedCredential:
    """Single leaked credential entry"""
    username: str
    password: str
    email: str
    source: str
    breach_date: str
    confidence: float  # 0.0-1.0 (how likely to be valid)
    metadata: Dict


class BreachDatabaseSimulator:
    """
    Simulate realistic breach database with:
    - Password reuse patterns
    - Email variations (user@gmail.com, user@yahoo.com)
    - Common password patterns
    - Breach metadata (source, date, confidence)
    """

    def __init__(self):
        self.breach_sources = [
            "Collection #1",
            "RockYou",
            "LinkedIn",
            "Adobe",
            "Dropbox",
            "MySpace",
            "Twitter",
            "Facebook",
            "Exploit.in",
            "Anti Public",
        ]

        # Common password patterns from real breaches
        self.common_passwords = [
            "password123", "admin123", "qwerty123", "welcome123",
            "Password1", "Admin@123", "Welcome@2024", "Spring2024",
            "Company123!", "Test@1234", "Demo@2024", "Secret123",
        ]

        # Password variations (realistic user behavior)
        self.password_variations = [
            lambda p: p,  # Original
            lambda p: p.lower(),  # lowercase
            lambda p: p.capitalize(),  # Capitalize
            lambda p: p + "!",  # Add !
            lambda p: p + "123",  # Add 123
            lambda p: p + "2024",  # Add year
            lambda p: p + "@123",  # Add @123
        ]

        # Email domain distribution (realistic)
        self.email_domains = [
            ("gmail.com", 0.40),  # 40% Gmail
            ("yahoo.com", 0.20),  # 20% Yahoo
            ("hotmail.com", 0.15),  # 15% Hotmail
            ("outlook.com", 0.10),  # 10% Outlook
            ("protonmail.com", 0.05),  # 5% ProtonMail
            ("aol.com", 0.05),  # 5% AOL
            ("icloud.com", 0.05),  # 5% iCloud
        ]

    def generate_breach_database(
        self,
        target_usernames: List[str],
        size: int = 100
    ) -> List[LeakedCredential]:
        """
        Generate simulated breach database.

        Args:
            target_usernames: Known usernames in target system
            size: Total number of credentials to generate

        Returns:
            List of leaked credentials (some matching target)
        """
        credentials = []

        # 30% of database contains target usernames (realistic hit rate)
        target_count = int(size * 0.30)
        noise_count = size - target_count

        # Generate credentials for target usernames
        for username in target_usernames[:target_count]:
            cred = self._generate_credential_for_user(username, is_target=True)
            credentials.append(cred)

        # Generate noise (random usernames)
        for _ in range(noise_count):
            random_username = self._generate_random_username()
            cred = self._generate_credential_for_user(random_username, is_target=False)
            credentials.append(cred)

        # Shuffle to mix targets with noise
        random.shuffle(credentials)

        return credentials

    def _generate_credential_for_user(
        self,
        username: str,
        is_target: bool
    ) -> LeakedCredential:
        """Generate leaked credential for username"""

        # Select password (targets get more common passwords)
        if is_target and random.random() > 0.3:
            # 70% chance of common password for targets
            base_password = random.choice(self.common_passwords)
        else:
            # Random password
            base_password = self._generate_random_password()

        # Apply password variation
        variation_fn = random.choice(self.password_variations)
        password = variation_fn(base_password)

        # Generate email (username variations)
        email = self._generate_email(username)

        # Select breach source
        source = random.choice(self.breach_sources)

        # Generate breach date (last 10 years)
        breach_date = self._generate_breach_date()

        # Confidence score (targets higher confidence)
        if is_target:
            confidence = random.uniform(0.6, 0.95)
        else:
            confidence = random.uniform(0.2, 0.6)

        # Metadata
        metadata = {
            "password_strength": self._calculate_password_strength(password),
            "reused": random.random() > 0.5,  # 50% password reuse
            "verified": random.random() > 0.7,  # 30% verified
            "is_target": is_target,
        }

        return LeakedCredential(
            username=username,
            password=password,
            email=email,
            source=source,
            breach_date=breach_date,
            confidence=confidence,
            metadata=metadata
        )

    def _generate_email(self, username: str) -> str:
        """Generate email address for username"""
        # Select domain based on realistic distribution
        rand = random.random()
        cumulative = 0.0
        domain = "gmail.com"

        for dom, probability in self.email_domains:
            cumulative += probability
            if rand <= cumulative:
                domain = dom
                break

        # Email variations
        variations = [
            f"{username}@{domain}",
            f"{username}.{random.randint(1, 99)}@{domain}",
            f"{username}{random.randint(1990, 2005)}@{domain}",
            f"{username}.work@{domain}",
        ]

        return random.choice(variations)

    def _generate_breach_date(self) -> str:
        """Generate realistic breach date (last 10 years)"""
        days_ago = random.randint(0, 3650)  # 0-10 years
        breach_date = datetime.now() - timedelta(days=days_ago)
        return breach_date.strftime("%Y-%m-%d")

    def _generate_random_username(self) -> str:
        """Generate random username"""
        first_names = [
            "john", "mike", "david", "chris", "alex", "sarah", "emma",
            "olivia", "james", "robert", "michael", "william", "daniel"
        ]
        last_names = [
            "smith", "johnson", "williams", "jones", "brown", "davis",
            "miller", "wilson", "moore", "taylor", "anderson", "thomas"
        ]

        patterns = [
            lambda: random.choice(first_names),
            lambda: f"{random.choice(first_names)}{random.randint(1, 99)}",
            lambda: f"{random.choice(first_names)}.{random.choice(last_names)}",
            lambda: f"{random.choice(first_names)}{random.choice(last_names)}",
        ]

        return random.choice(patterns)()

    def _generate_random_password(self) -> str:
        """Generate random password (weak, realistic)"""
        patterns = [
            lambda: f"password{random.randint(1, 9999)}",
            lambda: f"{random.choice(['welcome', 'admin', 'user'])}{random.randint(100, 999)}",
            lambda: f"qwerty{random.randint(1, 99)}",
            lambda: f"letmein{random.randint(1, 99)}",
            lambda: f"{random.randint(1000, 9999)}",
        ]

        return random.choice(patterns)()

    def _calculate_password_strength(self, password: str) -> str:
        """Calculate password strength (weak/medium/strong)"""
        score = 0

        if len(password) >= 8:
            score += 1
        if len(password) >= 12:
            score += 1
        if any(c.isupper() for c in password):
            score += 1
        if any(c.islower() for c in password):
            score += 1
        if any(c.isdigit() for c in password):
            score += 1
        if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            score += 1

        if score <= 2:
            return "weak"
        elif score <= 4:
            return "medium"
        else:
            return "strong"

    def sort_by_confidence(
        self,
        credentials: List[LeakedCredential]
    ) -> List[LeakedCredential]:
        """Sort credentials by confidence (high to low)"""
        return sorted(credentials, key=lambda c: c.confidence, reverse=True)

    def filter_by_breach_source(
        self,
        credentials: List[LeakedCredential],
        sources: List[str]
    ) -> List[LeakedCredential]:
        """Filter credentials by breach source"""
        return [c for c in credentials if c.source in sources]

    def filter_by_confidence_threshold(
        self,
        credentials: List[LeakedCredential],
        min_confidence: float = 0.5
    ) -> List[LeakedCredential]:
        """Filter credentials by minimum confidence"""
        return [c for c in credentials if c.confidence >= min_confidence]

    def export_to_combolist(
        self,
        credentials: List[LeakedCredential],
        output_file: str
    ):
        """Export credentials to combo list format (username:password)"""
        with open(output_file, 'w') as f:
            for cred in credentials:
                f.write(f"{cred.username}:{cred.password}\n")

    def export_detailed(
        self,
        credentials: List[LeakedCredential],
        output_file: str
    ):
        """Export credentials with full metadata (JSON)"""
        import json

        data = [
            {
                "username": c.username,
                "password": c.password,
                "email": c.email,
                "source": c.source,
                "breach_date": c.breach_date,
                "confidence": c.confidence,
                "metadata": c.metadata
            }
            for c in credentials
        ]

        with open(output_file, 'w') as f:
            json.dump(data, f, indent=2)


if __name__ == "__main__":
    # Demo
    print("="*70)
    print("BREACH DATABASE SIMULATION")
    print("="*70)

    simulator = BreachDatabaseSimulator()

    # Simulate breach database
    target_users = ["admin", "user", "alice", "bob", "charlie", "david"]

    print(f"\n[*] Generating breach database...")
    print(f"    Target usernames: {len(target_users)}")
    print(f"    Database size: 100 credentials")

    credentials = simulator.generate_breach_database(
        target_usernames=target_users,
        size=100
    )

    print(f"\n[*] Database generated:")
    print(f"    Total credentials: {len(credentials)}")

    # Count targets vs noise
    targets = [c for c in credentials if c.metadata["is_target"]]
    print(f"    Target hits: {len(targets)} ({len(targets)/len(credentials)*100:.1f}%)")

    # Sort by confidence
    sorted_creds = simulator.sort_by_confidence(credentials)

    print(f"\n[*] Top 10 credentials (by confidence):")
    print(f"    {'Username':<15} {'Password':<20} {'Source':<15} {'Confidence':<10}")
    print(f"    {'-'*65}")
    for cred in sorted_creds[:10]:
        print(f"    {cred.username:<15} {cred.password:<20} {cred.source:<15} {cred.confidence:<10.2f}")

    # Filter high confidence
    high_confidence = simulator.filter_by_confidence_threshold(credentials, 0.7)
    print(f"\n[*] High confidence credentials (>0.7): {len(high_confidence)}")

    # Breach sources
    sources = {}
    for cred in credentials:
        sources[cred.source] = sources.get(cred.source, 0) + 1

    print(f"\n[*] Credentials by breach source:")
    for source, count in sorted(sources.items(), key=lambda x: x[1], reverse=True):
        print(f"    {source:<20} {count:>3} credentials")

    # Export examples
    print(f"\n[*] Export formats:")
    print(f"    - Combo list: username:password")
    print(f"    - Detailed JSON: full metadata")

    print("\n" + "="*70)
    print("KEY INSIGHTS:")
    print("  • Real breaches contain 10-30% valid credentials")
    print("  • Password reuse is common (50%+ of users)")
    print("  • Confidence scoring improves success rate")
    print("  • Multi-breach correlation increases accuracy")
    print("="*70)
