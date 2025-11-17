#!/usr/bin/env python3
"""
TOTP Timing Attack Module
Exploits time-based weaknesses in TOTP (Time-based One-Time Password) implementations.

REAL-WORLD VULNERABILITIES:
- TOTP codes valid for ±30s window (some implementations allow ±60s or more)
- Server/client clock skew exploitation
- Time window boundaries testing
- Predictable code generation at known timestamps

WARNING: For educational purposes only!
"""

import time
import pyotp
from typing import List, Tuple, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass


@dataclass
class TOTPWindow:
    """Represents a TOTP time window"""
    timestamp: int
    code: str
    window_offset: int  # -2, -1, 0, +1, +2 (relative to current)
    valid_from: datetime
    valid_until: datetime


class TOTPTimingAttacker:
    """
    Advanced TOTP timing attack techniques.

    Real-world TOTP vulnerabilities:
    1. Most implementations accept codes from ±1 window (60s total validity)
    2. Some accept ±2 windows (150s total validity)
    3. Clock skew between client/server can be exploited
    4. Predictable generation allows pre-computing codes
    """

    def __init__(self, shared_secret: str, interval: int = 30, drift: int = 1):
        """
        Initialize TOTP timing attacker.

        Args:
            shared_secret: TOTP shared secret (base32 encoded)
            interval: Time interval in seconds (default: 30)
            drift: Number of time windows to check (±drift)
        """
        self.shared_secret = shared_secret
        self.interval = interval
        self.drift = drift
        self.totp = pyotp.TOTP(shared_secret, interval=interval)

    def generate_time_window_codes(self, timestamp: Optional[float] = None) -> List[TOTPWindow]:
        """
        Generate codes for multiple time windows.

        Real pentesters test codes from:
        - Current window (0)
        - Previous window (-1) - usually accepted
        - Next window (+1) - usually accepted
        - ±2 windows - sometimes accepted (misconfigured servers)

        Args:
            timestamp: Base timestamp (default: current time)

        Returns:
            List of TOTPWindow objects with codes and validity info
        """
        if timestamp is None:
            timestamp = time.time()

        windows = []

        for offset in range(-self.drift, self.drift + 1):
            window_timestamp = timestamp + (offset * self.interval)
            code = self.totp.at(window_timestamp)

            # Calculate validity period
            window_start = datetime.fromtimestamp(
                (window_timestamp // self.interval) * self.interval
            )
            window_end = window_start + timedelta(seconds=self.interval)

            windows.append(TOTPWindow(
                timestamp=int(window_timestamp),
                code=code,
                window_offset=offset,
                valid_from=window_start,
                valid_until=window_end
            ))

        return windows

    def find_optimal_attack_time(self) -> Tuple[float, List[TOTPWindow]]:
        """
        Find optimal time to attack (when multiple windows overlap).

        The best time to attack is right at the window boundary, where:
        - Old window code is still valid
        - New window code is now valid
        - You effectively get 2+ codes to try

        Returns:
            (optimal_timestamp, windows_at_boundary)
        """
        current_time = time.time()

        # Find next window boundary
        next_boundary = ((current_time // self.interval) + 1) * self.interval

        # Generate codes at boundary
        windows = self.generate_time_window_codes(next_boundary)

        return next_boundary, windows

    def exploit_clock_skew(self, server_time_offset: int = 0) -> List[str]:
        """
        Exploit server clock skew.

        If server clock is offset from client:
        - Positive offset: server is ahead, test future codes
        - Negative offset: server is behind, test past codes

        Args:
            server_time_offset: Server time offset in seconds

        Returns:
            List of codes to try accounting for skew
        """
        adjusted_timestamp = time.time() + server_time_offset
        windows = self.generate_time_window_codes(adjusted_timestamp)

        # Return codes in priority order (closest to adjusted time first)
        return [w.code for w in sorted(windows, key=lambda w: abs(w.window_offset))]

    def generate_boundary_attack_codes(self, seconds_before_boundary: int = 5) -> List[str]:
        """
        Generate codes optimized for boundary attack.

        Attack strategy:
        1. Wait until seconds_before_boundary from next window
        2. Generate codes from current and next windows
        3. Both codes will be valid during the overlap period

        Args:
            seconds_before_boundary: How many seconds before boundary to attack

        Returns:
            List of codes with highest success probability
        """
        current_time = time.time()
        next_boundary = ((current_time // self.interval) + 1) * self.interval

        # Calculate when to start attack
        attack_time = next_boundary - seconds_before_boundary

        # If attack time is in the past, use next boundary
        if attack_time < current_time:
            attack_time = next_boundary + self.interval - seconds_before_boundary

        # Generate codes at attack time
        windows = self.generate_time_window_codes(attack_time)

        # Prioritize: current window, then ±1, then ±2
        priority_order = [0, -1, 1, -2, 2]
        sorted_windows = sorted(windows, key=lambda w: priority_order.index(w.window_offset))

        return [w.code for w in sorted_windows]

    def calculate_success_probability(self, drift: int = 1) -> dict:
        """
        Calculate success probability of timing attack.

        Assumptions:
        - TOTP interval: 30s
        - If server accepts ±drift windows
        - Attack duration: varies

        Returns:
            Dict with probability statistics
        """
        total_window_seconds = (2 * drift + 1) * self.interval
        codes_to_try = 2 * drift + 1

        # Probability that random code matches (6 digits = 1,000,000 possibilities)
        random_probability = codes_to_try / 1_000_000

        # With timing knowledge, we only need to try 'codes_to_try' codes
        # Success rate depends on server configuration
        known_vulnerabilities = {
            "drift_0": {"codes": 1, "window_seconds": 30, "typical_config": "Very secure (no drift)"},
            "drift_1": {"codes": 3, "window_seconds": 90, "typical_config": "Common (Google Authenticator default)"},
            "drift_2": {"codes": 5, "window_seconds": 150, "typical_config": "Weak (some custom implementations)"},
            "drift_3": {"codes": 7, "window_seconds": 210, "typical_config": "Very weak (misconfigured)"},
        }

        drift_key = f"drift_{drift}"
        config = known_vulnerabilities.get(drift_key, known_vulnerabilities["drift_1"])

        return {
            "drift": drift,
            "codes_to_try": codes_to_try,
            "total_valid_window_seconds": total_window_seconds,
            "random_success_probability": random_probability,
            "timing_attack_advantage": f"{codes_to_try}x better than random",
            "configuration": config["typical_config"],
            "attack_strategy": f"Test {codes_to_try} codes instead of 1,000,000",
        }

    def verify_code_at_timestamp(self, code: str, timestamp: Optional[float] = None) -> bool:
        """
        Verify if a code is valid at given timestamp.

        Useful for testing and validation.

        Args:
            code: 6-digit TOTP code
            timestamp: Timestamp to check (default: current)

        Returns:
            True if code is valid at timestamp
        """
        if timestamp is None:
            timestamp = time.time()

        return self.totp.verify(code, for_time=int(timestamp))

    def analyze_code_validity_period(self, code: str) -> Optional[dict]:
        """
        Analyze when a specific code is valid.

        Args:
            code: 6-digit TOTP code

        Returns:
            Dict with validity information, or None if code not found
        """
        current_time = time.time()

        # Check current and ±5 windows
        for offset in range(-5, 6):
            check_time = current_time + (offset * self.interval)
            expected_code = self.totp.at(check_time)

            if expected_code == code:
                window_start = (check_time // self.interval) * self.interval
                window_end = window_start + self.interval

                return {
                    "code": code,
                    "valid": True,
                    "window_offset": offset,
                    "valid_from": datetime.fromtimestamp(window_start).isoformat(),
                    "valid_until": datetime.fromtimestamp(window_end).isoformat(),
                    "seconds_remaining": int(window_end - current_time),
                    "is_current_window": offset == 0,
                    "is_past_window": offset < 0,
                    "is_future_window": offset > 0,
                }

        return None


class TOTPRaceConditionAttacker:
    """
    Race condition exploitation for TOTP validation.

    VULNERABILITY:
    Some TOTP implementations don't properly lock used codes, allowing:
    - Multiple simultaneous requests with same code
    - Code reuse within the same window
    - Bypass of "code already used" checks
    """

    def __init__(self, check_interval: float = 0.01):
        """
        Initialize race condition attacker.

        Args:
            check_interval: Time between attempts in seconds
        """
        self.check_interval = check_interval

    def should_attempt_race_condition(self, code: str, seconds_remaining: int) -> bool:
        """
        Determine if race condition attack is worthwhile.

        Best conditions:
        - Fresh code (>20s remaining in window)
        - Implementation doesn't have proper locking
        - Multiple authentication paths available

        Args:
            code: TOTP code to test
            seconds_remaining: Seconds until code expires

        Returns:
            True if race condition attack recommended
        """
        # Race condition most effective with fresh codes
        return seconds_remaining > 20

    def calculate_race_attempts(self, seconds_remaining: int, concurrent_requests: int = 100) -> dict:
        """
        Calculate optimal race condition parameters.

        Args:
            seconds_remaining: Seconds until code expires
            concurrent_requests: Number of simultaneous requests

        Returns:
            Dict with race condition strategy
        """
        # Time available for race
        race_window = min(seconds_remaining, 5)  # Max 5s burst

        # Theoretical maximum attempts
        max_attempts = int(race_window / self.check_interval)
        actual_attempts = min(max_attempts, concurrent_requests)

        return {
            "race_window_seconds": race_window,
            "concurrent_requests": concurrent_requests,
            "actual_attempts": actual_attempts,
            "check_interval": self.check_interval,
            "success_probability": "Depends on server's locking implementation",
            "strategy": "Fire all requests simultaneously to exploit race window",
        }


if __name__ == "__main__":
    # Demo: TOTP timing attack

    print("="*70)
    print("TOTP TIMING ATTACK - DEMONSTRATION")
    print("="*70)

    # Use demo secret (same as in the lab environment)
    demo_secret = "DEVSECOPSTWENTYFOURHACKINGLAB"

    attacker = TOTPTimingAttacker(demo_secret, interval=30, drift=2)

    print("\n[*] Generating time window codes...")
    windows = attacker.generate_time_window_codes()

    print("\nCodes for multiple time windows:")
    for window in windows:
        status = "CURRENT" if window.window_offset == 0 else f"Offset: {window.window_offset:+d}"
        print(f"  {window.code} - {status}")
        print(f"    Valid: {window.valid_from.strftime('%H:%M:%S')} - {window.valid_until.strftime('%H:%M:%S')}")

    print("\n[*] Finding optimal attack time...")
    optimal_time, boundary_windows = attacker.find_optimal_attack_time()
    optimal_dt = datetime.fromtimestamp(optimal_time)
    print(f"  Next boundary: {optimal_dt.strftime('%H:%M:%S')}")
    print(f"  Codes available at boundary: {[w.code for w in boundary_windows[:3]]}")

    print("\n[*] Calculating success probability...")
    for drift in [0, 1, 2, 3]:
        prob = attacker.calculate_success_probability(drift)
        print(f"\n  Drift ±{drift}:")
        print(f"    Codes to try: {prob['codes_to_try']}")
        print(f"    Valid window: {prob['total_valid_window_seconds']}s")
        print(f"    Configuration: {prob['configuration']}")
        print(f"    Advantage: {prob['timing_attack_advantage']}")

    print("\n[*] Current code analysis...")
    current_code = attacker.totp.now()
    analysis = attacker.analyze_code_validity_period(current_code)
    if analysis:
        print(f"  Current code: {analysis['code']}")
        print(f"  Seconds remaining: {analysis['seconds_remaining']}s")
        print(f"  Valid until: {analysis['valid_until']}")

    print("\n[*] Race condition analysis...")
    race_attacker = TOTPRaceConditionAttacker()
    if analysis:
        should_race = race_attacker.should_attempt_race_condition(
            analysis['code'],
            analysis['seconds_remaining']
        )
        print(f"  Should attempt race condition: {should_race}")

        if should_race:
            race_params = race_attacker.calculate_race_attempts(
                analysis['seconds_remaining'],
                concurrent_requests=100
            )
            print(f"  Race window: {race_params['race_window_seconds']}s")
            print(f"  Concurrent requests: {race_params['concurrent_requests']}")
            print(f"  Strategy: {race_params['strategy']}")

    print("\n" + "="*70)
    print("KEY INSIGHTS:")
    print("  • Most servers accept ±1 window (90s total validity)")
    print("  • Timing attacks reduce search space from 1M to 3-7 codes")
    print("  • Boundary attacks maximize success probability")
    print("  • Race conditions can bypass 'code already used' checks")
    print("="*70)
