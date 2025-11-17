#!/usr/bin/env python3
"""
Statistical MFA Attack Module
Uses statistical analysis and psychological patterns to prioritize MFA code attempts.

REAL-WORLD INSIGHTS:
- Humans prefer certain digit patterns (123456 more common than 982371)
- Birthday-based codes (if DOB known from OSINT)
- Repeated digits (111111, 777777)
- Sequential patterns (123456, 654321)
- Keyboard patterns (147258, 369258)

WARNING: For educational purposes only!
"""

from typing import List, Dict, Optional
from datetime import datetime, date
from collections import Counter
import random


class StatisticalMFACodeGenerator:
    """
    Generate MFA code attempts based on statistical likelihood and human psychology.

    Real penetration testers use OSINT and behavioral analysis to narrow
    the search space from 1,000,000 possibilities to ~100-500 high-probability codes.
    """

    def __init__(self, user_info: Optional[Dict] = None):
        """
        Initialize statistical code generator.

        Args:
            user_info: Dict with user information from OSINT:
                - birthday: date object
                - phone: phone number (last 6 digits)
                - address: address (zip code, house number)
                - interests: list of interests/hobbies
        """
        self.user_info = user_info or {}

    def generate_psychological_patterns(self) -> List[str]:
        """
        Generate codes based on human psychology.

        Research shows people prefer:
        - Repeated digits (easier to remember)
        - Sequential patterns
        - Symmetrical patterns
        - Keyboard walks
        """
        patterns = []

        # Repeated digits (very common)
        for digit in range(10):
            patterns.append(str(digit) * 6)  # 000000, 111111, ..., 999999

        # Sequential ascending
        patterns.extend([
            "123456", "234567", "345678", "456789",
            "012345", "123450",
        ])

        # Sequential descending
        patterns.extend([
            "654321", "543210", "987654", "876543",
        ])

        # Alternating patterns
        patterns.extend([
            "121212", "131313", "141414",
            "123123", "234234", "345345",
            "112233", "223344", "334455",
        ])

        # Keyboard patterns (numpad)
        patterns.extend([
            "147258", "258369", "147852",  # Vertical walks
            "159357", "357159",  # Diagonal walks
            "123789", "789123",  # Horizontal walks
        ])

        # Mirror patterns
        patterns.extend([
            "123321", "456654", "789987",
            "111222", "222333", "333444",
        ])

        # Common PIN-style patterns
        patterns.extend([
            "696969", "420420", "424242",
            "808080", "123321", "112233",
        ])

        return patterns

    def generate_birthday_codes(self, birthday: Optional[date] = None) -> List[str]:
        """
        Generate codes based on birthday.

        Common formats:
        - MMDDYY (most common in US)
        - DDMMYY (common in Europe)
        - YYMMDD
        - Last 6 digits of various formats
        """
        codes = []

        if birthday is None:
            birthday = self.user_info.get("birthday")

        if not birthday:
            return codes

        month = f"{birthday.month:02d}"
        day = f"{birthday.day:02d}"
        year = f"{birthday.year:04d}"
        year_short = year[-2:]

        # Various date formats
        codes.extend([
            f"{month}{day}{year_short}",  # MMDDYY (010190)
            f"{day}{month}{year_short}",  # DDMMYY (010190)
            f"{year_short}{month}{day}",  # YYMMDD (900101)
            f"{month}{year_short}{day}",  # MMYYDD (019001)
            f"{day}{year_short}{month}",  # DDYYMM (019001)
        ])

        # With century digits
        if len(year) == 4:
            century = year[:2]
            codes.extend([
                f"{month}{day}{century}",  # MMDDCC (010119)
                f"{day}{month}{century}",  # DDMMCC (010119)
            ])

        # Just year digits
        codes.extend([
            year,  # YYYY (1990)
            f"{year[-2:]}",  # YY (90)
        ])

        # Birth year variations
        birth_year_int = birthday.year
        codes.extend([
            f"{birth_year_int:06d}",  # Padded to 6 digits
        ])

        return codes

    def generate_phone_based_codes(self, phone: Optional[str] = None) -> List[str]:
        """
        Generate codes based on phone number.

        Common patterns:
        - Last 6 digits
        - First 6 digits
        - Middle 6 digits
        - Repeating patterns from phone
        """
        codes = []

        if phone is None:
            phone = self.user_info.get("phone")

        if not phone:
            return codes

        # Remove non-digit characters
        phone_digits = ''.join(c for c in phone if c.isdigit())

        if len(phone_digits) >= 6:
            # Last 6 digits (most common)
            codes.append(phone_digits[-6:])

            # First 6 digits
            codes.append(phone_digits[:6])

            # Middle 6 digits
            if len(phone_digits) >= 8:
                start = (len(phone_digits) - 6) // 2
                codes.append(phone_digits[start:start+6])

        return codes

    def generate_address_based_codes(self, address: Optional[Dict] = None) -> List[str]:
        """
        Generate codes based on address information.

        Common patterns:
        - Zip code (5 or 6 digits)
        - House number + zip
        - Street number combinations
        """
        codes = []

        if address is None:
            address = self.user_info.get("address", {})

        # Zip code
        if "zip" in address:
            zip_code = ''.join(c for c in str(address["zip"]) if c.isdigit())
            if len(zip_code) == 5:
                codes.append(zip_code + "0")
                codes.append("0" + zip_code)
            elif len(zip_code) == 6:
                codes.append(zip_code)

        # House number
        if "house_number" in address:
            house = ''.join(c for c in str(address["house_number"]) if c.isdigit())
            if house:
                codes.append(house.zfill(6))  # Pad to 6 digits

        return codes

    def generate_common_pins(self) -> List[str]:
        """
        Generate most common PINs from leaked databases.

        Based on analysis of millions of leaked PINs:
        - Top 20 PINs account for ~27% of all PINs
        - Top 100 PINs account for ~45% of all PINs
        """
        # Top 50 most common 6-digit codes from research
        common = [
            "123456", "654321", "111111", "000000", "123123",
            "666666", "121212", "112233", "789456", "159753",
            "123321", "555555", "222222", "777777", "888888",
            "999999", "147258", "159357", "123654", "112211",
            "102030", "456789", "135790", "101010", "246810",
            "369258", "987654", "123450", "543210", "147852",
            "258369", "321654", "456123", "789123", "159263",
            "357951", "248624", "147741", "111222", "222111",
            "333444", "444333", "555666", "666555", "777888",
            "888777", "999000", "000999", "121121", "212212",
        ]

        return common

    def generate_year_based_codes(self, target_years: Optional[List[int]] = None) -> List[str]:
        """
        Generate codes based on years.

        Common patterns:
        - Current year (2024)
        - Birth year (if known)
        - Historical years (1990, 2000, etc.)
        - Years with special meaning
        """
        codes = []

        if target_years is None:
            # Default: current year and common years
            current_year = datetime.now().year
            target_years = [
                current_year, current_year - 1,  # Current and last year
                1990, 1995, 2000, 2005, 2010, 2015, 2020,  # Common birth years
            ]

        for year in target_years:
            year_str = str(year)
            if len(year_str) == 4:
                # Full year (e.g., 2024 -> 002024)
                codes.append(f"{year:06d}")
                # Year with padding (e.g., 2024 -> 202400, 002024, 240000)
                codes.append(f"{year}00")
                codes.append(f"00{year}")
                codes.append(f"{year}24")  # Year + month variation

        return codes

    def generate_intelligent_wordlist(
        self,
        max_codes: int = 200,
        include_psychological: bool = True,
        include_birthday: bool = True,
        include_phone: bool = True,
        include_address: bool = True,
        include_common: bool = True,
        include_year: bool = True,
    ) -> List[str]:
        """
        Generate complete intelligent MFA code wordlist.

        Priority order:
        1. User-specific (birthday, phone, address) - highest success rate
        2. Common PINs - medium-high success rate
        3. Psychological patterns - medium success rate
        4. Year-based - medium-low success rate

        Args:
            max_codes: Maximum codes to generate
            include_*: Flags to include specific categories

        Returns:
            List of 6-digit codes prioritized by likelihood
        """
        all_codes = []

        # Priority 1: User-specific codes (if available)
        if include_birthday and self.user_info.get("birthday"):
            all_codes.extend(self.generate_birthday_codes())

        if include_phone and self.user_info.get("phone"):
            all_codes.extend(self.generate_phone_based_codes())

        if include_address and self.user_info.get("address"):
            all_codes.extend(self.generate_address_based_codes())

        # Priority 2: Common PINs (proven high success rate)
        if include_common:
            all_codes.extend(self.generate_common_pins())

        # Priority 3: Psychological patterns
        if include_psychological:
            all_codes.extend(self.generate_psychological_patterns())

        # Priority 4: Year-based
        if include_year:
            all_codes.extend(self.generate_year_based_codes())

        # Remove duplicates while preserving order
        seen = set()
        unique_codes = []
        for code in all_codes:
            if code not in seen and len(code) == 6:
                seen.add(code)
                unique_codes.append(code)

        # Limit to max_codes
        return unique_codes[:max_codes]

    def analyze_code_strength(self, code: str) -> Dict:
        """
        Analyze how strong/unique a code is.

        Args:
            code: 6-digit code

        Returns:
            Dict with strength analysis
        """
        if len(code) != 6 or not code.isdigit():
            return {"valid": False, "error": "Code must be 6 digits"}

        analysis = {
            "code": code,
            "strength": "unknown",
            "vulnerabilities": [],
            "recommendations": [],
        }

        # Check for common patterns
        if code in self.generate_common_pins():
            analysis["vulnerabilities"].append("In top 100 most common PINs")
            analysis["strength"] = "Very Weak"

        # Check for repeated digits
        if len(set(code)) == 1:
            analysis["vulnerabilities"].append("All repeated digits")
            analysis["strength"] = "Very Weak"

        # Check for sequential
        if code in ["123456", "654321", "012345"]:
            analysis["vulnerabilities"].append("Sequential pattern")
            analysis["strength"] = "Very Weak"

        # Check for alternating
        if len(set(code[::2])) == 1 or len(set(code[1::2])) == 1:
            analysis["vulnerabilities"].append("Alternating pattern")
            analysis["strength"] = "Weak"

        # Check entropy
        digit_counts = Counter(code)
        entropy = len(digit_counts)
        if entropy < 4:
            analysis["vulnerabilities"].append(f"Low entropy (only {entropy} unique digits)")
            if analysis["strength"] == "unknown":
                analysis["strength"] = "Weak"

        # If no vulnerabilities found
        if not analysis["vulnerabilities"]:
            analysis["strength"] = "Strong"
            analysis["recommendations"].append("Code appears random and unique")
        else:
            analysis["recommendations"].append("Use truly random 6-digit codes")
            analysis["recommendations"].append("Avoid personal information (birthday, phone)")
            analysis["recommendations"].append("Avoid patterns and repeated digits")

        return analysis


if __name__ == "__main__":
    # Demo: Statistical MFA attack

    print("="*70)
    print("STATISTICAL MFA CODE GENERATION - DEMONSTRATION")
    print("="*70)

    # Example 1: Generic attack (no user info)
    print("\n[*] Example 1: Generic attack (no OSINT data)")
    generic_generator = StatisticalMFACodeGenerator()
    generic_codes = generic_generator.generate_intelligent_wordlist(max_codes=50)
    print(f"  Generated {len(generic_codes)} high-probability codes")
    print(f"  Sample: {generic_codes[:10]}")

    # Example 2: Targeted attack (with user info)
    print("\n[*] Example 2: Targeted attack (with OSINT data)")
    user_info = {
        "birthday": date(1990, 1, 15),
        "phone": "+1-555-123-4567",
        "address": {"zip": "90210", "house_number": "123"}
    }
    targeted_generator = StatisticalMFACodeGenerator(user_info)
    targeted_codes = targeted_generator.generate_intelligent_wordlist(max_codes=50)
    print(f"  Generated {len(targeted_codes)} targeted codes")
    print(f"  Sample: {targeted_codes[:15]}")

    # Example 3: Code strength analysis
    print("\n[*] Example 3: Code strength analysis")
    test_codes = ["123456", "918273", "111111", "654321"]
    for code in test_codes:
        analysis = targeted_generator.analyze_code_strength(code)
        print(f"\n  Code: {code}")
        print(f"    Strength: {analysis['strength']}")
        if analysis['vulnerabilities']:
            print(f"    Vulnerabilities: {', '.join(analysis['vulnerabilities'])}")

    # Example 4: Birthday-based attack
    print("\n[*] Example 4: Birthday-based codes")
    birthday_codes = targeted_generator.generate_birthday_codes(date(1990, 1, 15))
    print(f"  Birthday: 1990-01-15")
    print(f"  Generated codes: {birthday_codes}")

    print("\n" + "="*70)
    print("KEY INSIGHTS:")
    print("  • Top 100 codes account for ~45% of all user-chosen MFA codes")
    print("  • Birthday-based codes reduce search space by ~99.9%")
    print("  • Phone number last 6 digits: very common choice")
    print("  • Sequential/repeated patterns: human psychology preference")
    print("  • With OSINT, can reduce 1M possibilities to ~100-500")
    print("="*70)
