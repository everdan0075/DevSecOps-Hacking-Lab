#!/usr/bin/env python3
"""
Intelligent Wordlist Generator
Generates realistic password wordlists based on target intelligence and common patterns.
"""

import random
from datetime import datetime
from typing import List, Dict, Optional
from dataclasses import dataclass
from pathlib import Path


@dataclass
class TargetInfo:
    """Information about the target organization"""
    company_name: Optional[str] = None
    domain: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None


class IntelligentPasswordGenerator:
    """
    Generates realistic password wordlists using intelligence-based techniques.

    Real pentesters don't use generic wordlists - they create targeted ones based on:
    - Company name and domain
    - Current season and year
    - Industry-specific terms
    - Common corporate password patterns
    - Leaked password analysis
    """

    def __init__(self, target_info: Optional[TargetInfo] = None):
        self.target_info = target_info or TargetInfo()
        self.current_year = datetime.now().year
        self.current_season = self._get_current_season()

    def _get_current_season(self) -> str:
        """Determine current season"""
        month = datetime.now().month
        if month in [12, 1, 2]:
            return "Winter"
        elif month in [3, 4, 5]:
            return "Spring"
        elif month in [6, 7, 8]:
            return "Summer"
        else:
            return "Autumn"

    def generate_company_based(self) -> List[str]:
        """
        Generate passwords based on company name.

        Real-world examples:
        - Microsoft employees often use "Microsoft123!"
        - Seasonal: "Microsoft_Spring2024"
        - Department: "MicrosoftIT@2024"
        """
        passwords = []

        if not self.target_info.company_name:
            return passwords

        company = self.target_info.company_name
        company_lower = company.lower()
        company_upper = company.upper()

        # Pattern 1: Company + Number
        for num in ["123", "2024", "1", "12", "1234", str(self.current_year)]:
            passwords.extend([
                f"{company}{num}",
                f"{company_lower}{num}",
                f"{company.capitalize()}{num}",
            ])

        # Pattern 2: Company + Special char
        for char in ["!", "@", "#", "$", "@123"]:
            passwords.extend([
                f"{company}{char}",
                f"{company_lower}{char}",
                f"{company.capitalize()}{char}",
            ])

        # Pattern 3: Company + Year
        for year in [self.current_year, self.current_year - 1, str(self.current_year)[-2:]]:
            passwords.extend([
                f"{company}{year}",
                f"{company}{year}!",
                f"{company}@{year}",
                f"{company}_{year}",
            ])

        # Pattern 4: Company + Season + Year (very common in corporate)
        passwords.extend([
            f"{company}{self.current_season}{self.current_year}",
            f"{company}_{self.current_season}{self.current_year}",
            f"{company}{self.current_season}{str(self.current_year)[-2:]}",
            f"{company}{self.current_season}{self.current_year}!",
        ])

        # Pattern 5: Welcome messages (common for initial passwords)
        passwords.extend([
            f"Welcome{company}",
            f"Welcome{company}123",
            f"Welcome{company}{self.current_year}",
            f"Welcome{company}!",
        ])

        return passwords

    def generate_seasonal_patterns(self) -> List[str]:
        """
        Generate seasonal password patterns.

        IT departments often enforce password changes quarterly,
        leading to predictable seasonal patterns.
        """
        passwords = []
        seasons = ["Winter", "Spring", "Summer", "Autumn", "Fall"]

        for season in seasons:
            # Current and last 2 years
            for year in [self.current_year, self.current_year - 1, self.current_year - 2]:
                passwords.extend([
                    f"{season}{year}",
                    f"{season}{year}!",
                    f"{season}{str(year)[-2:]}",
                    f"{season.lower()}{year}",
                    f"{season}{year}@",
                    f"{season}{year}#",
                ])

        # Month + Year patterns
        months = ["January", "February", "March", "April", "May", "June",
                 "July", "August", "September", "October", "November", "December"]
        current_month = months[datetime.now().month - 1]

        for year in [self.current_year, self.current_year - 1]:
            passwords.extend([
                f"{current_month}{year}",
                f"{current_month}{year}!",
                f"{current_month[:3]}{year}",  # Jan2024
            ])

        return passwords

    def generate_breach_patterns(self) -> List[str]:
        """
        Generate passwords based on common patterns from real breaches.

        Analysis of leaked databases shows certain patterns appear repeatedly:
        - Keyboard walks (qwerty, asdf)
        - Number sequences (123456, 111111)
        - Common words + numbers
        """
        passwords = []

        # Common breach passwords (from RockYou, Collection #1, etc.)
        common_breach = [
            "password", "Password", "PASSWORD",
            "admin", "Admin", "ADMIN",
            "welcome", "Welcome", "WELCOME",
            "letmein", "Letmein",
            "changeme", "Changeme",
            "default", "Default",
            "P@ssw0rd", "P@ssword", "Passw0rd",
        ]

        # Add variations with years
        for base in common_breach:
            for year in [self.current_year, self.current_year - 1, str(self.current_year)[-2:]]:
                passwords.append(f"{base}{year}")
                passwords.append(f"{base}{year}!")

        # Keyboard walks
        keyboard_walks = [
            "qwerty", "qwerty123", "qwerty12345",
            "asdfgh", "asdf1234",
            "zxcvbn", "zxcvbnm",
            "1qaz2wsx", "!QAZ2wsx",
        ]
        passwords.extend(keyboard_walks)

        # Number patterns
        number_patterns = [
            "123456", "1234567", "12345678",
            "111111", "222222", "000000",
            "123123", "321321",
            "654321",
        ]
        passwords.extend(number_patterns)

        # Common with special chars
        passwords.extend([
            "Password123!", "Password123@", "Password123#",
            "Admin123!", "Admin@123",
            "Welcome123!", "Welcome@123",
        ])

        return passwords

    def generate_industry_specific(self) -> List[str]:
        """
        Generate industry-specific password patterns.

        Different industries have different password cultures:
        - Tech: often uses tech terms
        - Finance: often uses financial terms
        - Healthcare: often uses medical terms
        """
        passwords = []

        if not self.target_info.industry:
            return passwords

        industry_terms = {
            "tech": ["Tech", "Dev", "Code", "Cloud", "DevOps", "Agile", "Sprint"],
            "finance": ["Finance", "Bank", "Trade", "Invest", "Capital", "Funds"],
            "healthcare": ["Health", "Medical", "Care", "Doctor", "Patient", "Clinic"],
            "education": ["School", "Edu", "Student", "Teacher", "Campus", "Learn"],
            "retail": ["Shop", "Store", "Retail", "Sales", "Customer", "Product"],
        }

        terms = industry_terms.get(self.target_info.industry.lower(), [])

        for term in terms:
            for year in [self.current_year, str(self.current_year)[-2:]]:
                passwords.extend([
                    f"{term}{year}",
                    f"{term}{year}!",
                    f"{term}@{year}",
                    f"{term}{year}#",
                ])

        return passwords

    def generate_location_based(self) -> List[str]:
        """
        Generate location-based passwords.

        Companies often use location in passwords:
        - City name
        - State/Country
        - Office location codes
        """
        passwords = []

        if not self.target_info.location:
            return passwords

        location = self.target_info.location

        for year in [self.current_year, str(self.current_year)[-2:]]:
            passwords.extend([
                f"{location}{year}",
                f"{location}{year}!",
                f"{location}@{year}",
            ])

        return passwords

    def generate_default_credentials(self) -> List[str]:
        """
        Common default credentials that are often unchanged.

        Many systems ship with default passwords that admins forget to change.
        """
        return [
            # Generic defaults
            "admin", "admin123", "admin@123", "Admin123!",
            "administrator", "Administrator123",
            "root", "root123", "root@123",
            "password", "Password1", "Password123!",

            # Service defaults
            "changeme", "Change_me123",
            "default", "Default123",
            "temp123", "Temp@123",
            "Test123!", "test123",

            # First login passwords
            "Welcome1", "Welcome123", "Welcome@123",
            "NewUser123", "NewUser@123",
            f"Welcome{self.current_year}",
            f"NewUser{self.current_year}",
        ]

    def generate_intelligent_wordlist(self, max_passwords: int = 200) -> List[str]:
        """
        Generate complete intelligent wordlist combining all techniques.

        Priority order:
        1. Company-specific passwords (highest success rate)
        2. Seasonal patterns (very common in corporate)
        3. Breach patterns (proven to work)
        4. Default credentials (often unchanged)
        5. Industry/location specific
        """
        all_passwords = []

        # Priority 1: Company-based (if available)
        all_passwords.extend(self.generate_company_based())

        # Priority 2: Seasonal patterns
        all_passwords.extend(self.generate_seasonal_patterns())

        # Priority 3: Breach patterns
        all_passwords.extend(self.generate_breach_patterns())

        # Priority 4: Default credentials
        all_passwords.extend(self.generate_default_credentials())

        # Priority 5: Industry/location
        all_passwords.extend(self.generate_industry_specific())
        all_passwords.extend(self.generate_location_based())

        # Remove duplicates while preserving order
        seen = set()
        unique_passwords = []
        for pwd in all_passwords:
            if pwd not in seen:
                seen.add(pwd)
                unique_passwords.append(pwd)

        # Limit to max_passwords
        return unique_passwords[:max_passwords]

    def save_wordlist(self, filename: str, passwords: List[str]):
        """Save wordlist to file"""
        filepath = Path(__file__).parent / "wordlists" / filename
        filepath.parent.mkdir(exist_ok=True)

        with open(filepath, 'w') as f:
            for pwd in passwords:
                f.write(f"{pwd}\n")

        return filepath


def generate_targeted_wordlist(
    company_name: Optional[str] = None,
    industry: Optional[str] = None,
    location: Optional[str] = None,
    max_passwords: int = 200
) -> List[str]:
    """
    Convenience function to generate targeted wordlist.

    Usage:
        passwords = generate_targeted_wordlist(
            company_name="DevSecOps",
            industry="tech",
            max_passwords=150
        )
    """
    target_info = TargetInfo(
        company_name=company_name,
        industry=industry,
        location=location
    )

    generator = IntelligentPasswordGenerator(target_info)
    return generator.generate_intelligent_wordlist(max_passwords)


if __name__ == "__main__":
    # Demo: Generate intelligent wordlists

    print("="*70)
    print("INTELLIGENT WORDLIST GENERATOR - DEMO")
    print("="*70)

    # Example 1: Generic wordlist (no target info)
    print("\n[*] Generating generic intelligent wordlist...")
    generator = IntelligentPasswordGenerator()
    generic_passwords = generator.generate_intelligent_wordlist(50)
    print(f"    Generated {len(generic_passwords)} passwords")
    print(f"    Sample: {generic_passwords[:10]}")

    # Example 2: Company-specific wordlist
    print("\n[*] Generating company-specific wordlist (DevSecOps)...")
    target = TargetInfo(
        company_name="DevSecOps",
        industry="tech",
        location="Warsaw"
    )
    generator = IntelligentPasswordGenerator(target)
    company_passwords = generator.generate_intelligent_wordlist(100)
    print(f"    Generated {len(company_passwords)} passwords")
    print(f"    Sample: {company_passwords[:15]}")

    # Save to file
    filepath = generator.save_wordlist("intelligent-wordlist.txt", company_passwords)
    print(f"\n[✓] Saved wordlist to: {filepath}")

    print("\n" + "="*70)
    print("Real-world password patterns demonstrated:")
    print("  • Company + Year (DevSecOps2024)")
    print("  • Season + Year (Winter2024!)")
    print("  • Breach patterns (P@ssw0rd, Welcome123!)")
    print("  • Default credentials (admin123, changeme)")
    print("  • Industry terms (DevOps2024, Tech123!)")
    print("="*70)
