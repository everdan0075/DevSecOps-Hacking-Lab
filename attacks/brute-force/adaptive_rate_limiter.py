#!/usr/bin/env python3
"""
Adaptive Rate Limiter
Mimics human behavior to evade detection and rate limiting.
"""

import random
import time
from datetime import datetime, time as dt_time
from typing import Optional, Dict
from dataclasses import dataclass
import asyncio


@dataclass
class RateLimitResponse:
    """Response from rate limiter analysis"""
    detected: bool
    recommended_delay: float
    reason: str


class AdaptiveRateLimiter:
    """
    Adaptive rate limiter that mimics human behavior.

    Real attackers don't use fixed delays (e.g., 0.1s) - that's easily detected.
    Instead, they:
    - Use randomized delays with realistic distributions
    - Add occasional "thinking time" pauses
    - Slow down during business hours (to blend in)
    - Speed up during off-hours
    - React to rate limit responses
    """

    def __init__(
        self,
        base_delay: float = 2.0,
        stealth_mode: bool = False,
        business_hours: tuple = (9, 17),
        timezone: str = "UTC"
    ):
        self.base_delay = base_delay
        self.stealth_mode = stealth_mode
        self.business_hours = business_hours
        self.timezone = timezone

        # Backoff state
        self.consecutive_rate_limits = 0
        self.consecutive_successes = 0
        self.current_backoff_multiplier = 1.0

        # Statistics
        self.stats = {
            "total_delays": 0,
            "total_wait_time": 0.0,
            "rate_limit_detections": 0,
            "backoff_triggers": 0,
        }

    def is_business_hours(self) -> bool:
        """Check if current time is during business hours"""
        now = datetime.now()
        current_hour = now.hour

        start_hour, end_hour = self.business_hours
        return start_hour <= current_hour < end_hour

    def calculate_delay(
        self,
        attempt_num: int,
        response_status: Optional[int] = None,
        response_time: Optional[float] = None
    ) -> float:
        """
        Calculate adaptive delay based on multiple factors.

        Args:
            attempt_num: Current attempt number
            response_status: HTTP status code from last response
            response_time: Response time in seconds

        Returns:
            Delay in seconds before next request
        """
        # Detect rate limiting
        if response_status == 429:
            return self._handle_rate_limit()

        # Detect IP ban
        if response_status == 403:
            return self._handle_ip_ban()

        # Reset backoff on success
        if response_status == 200:
            self.consecutive_successes += 1
            if self.consecutive_successes > 5:
                self._reduce_backoff()

        # Calculate base delay with variance
        delay = self._calculate_human_delay()

        # Adjust for business hours (be stealthier)
        if self.is_business_hours() and self.stealth_mode:
            delay *= random.uniform(1.5, 2.5)  # Slower during business hours

        # Apply current backoff
        delay *= self.current_backoff_multiplier

        # Add occasional "coffee break" (10% chance)
        if random.random() < 0.1:
            delay += self._coffee_break_delay()

        # Add occasional burst delay (simulating reading response)
        if random.random() < 0.05:
            delay += random.uniform(5, 15)  # Reading/analyzing response

        # Update stats
        self.stats["total_delays"] += 1
        self.stats["total_wait_time"] += delay

        return max(0.1, delay)  # Minimum 0.1s

    def _calculate_human_delay(self) -> float:
        """
        Calculate delay using realistic human behavior patterns.

        Humans don't type/click at fixed intervals - use statistical distributions:
        - Normal distribution (Gaussian) for regular typing
        - Exponential distribution for occasional pauses
        - Gamma distribution for mixed patterns
        """
        pattern = random.choices(
            ["normal", "exponential", "uniform"],
            weights=[0.7, 0.2, 0.1]  # 70% normal, 20% exponential, 10% uniform
        )[0]

        if pattern == "normal":
            # Most common: normal distribution around base_delay
            delay = random.gauss(mu=self.base_delay, sigma=self.base_delay * 0.3)
        elif pattern == "exponential":
            # Occasional longer pauses
            delay = random.expovariate(1 / self.base_delay)
        else:
            # Uniform randomness
            delay = random.uniform(self.base_delay * 0.5, self.base_delay * 1.5)

        return max(0.1, delay)

    def _handle_rate_limit(self) -> float:
        """
        Handle rate limit detection with exponential backoff.

        Real pentesters back off when rate limited, then try again later.
        """
        self.consecutive_rate_limits += 1
        self.consecutive_successes = 0
        self.stats["rate_limit_detections"] += 1

        # Exponential backoff
        backoff_delay = min(
            2 ** self.consecutive_rate_limits * self.base_delay,
            300  # Max 5 minutes
        )

        # Add randomization to avoid pattern detection
        backoff_delay *= random.uniform(0.8, 1.2)

        # Increase backoff multiplier
        self.current_backoff_multiplier = min(
            self.current_backoff_multiplier * 1.5,
            5.0  # Max 5x
        )
        self.stats["backoff_triggers"] += 1

        print(f"    [⚠] Rate limit detected! Backing off for {backoff_delay:.1f}s")
        return backoff_delay

    def _handle_ip_ban(self) -> float:
        """
        Handle IP ban detection.

        If IP is banned, wait significantly longer before retrying.
        """
        self.stats["rate_limit_detections"] += 1
        ban_wait = random.uniform(60, 180)  # 1-3 minutes

        print(f"    [🚫] IP ban detected! Waiting {ban_wait:.0f}s before retry")
        return ban_wait

    def _reduce_backoff(self):
        """Reduce backoff multiplier after consecutive successes"""
        self.current_backoff_multiplier = max(
            self.current_backoff_multiplier * 0.8,
            1.0  # Min 1x
        )
        self.consecutive_rate_limits = 0

    def _coffee_break_delay(self) -> float:
        """
        Simulate human coffee break / distraction.

        Real humans don't attack continuously - they take breaks.
        """
        break_types = {
            "short": (10, 30),      # Quick distraction
            "medium": (30, 120),    # Coffee break
            "long": (300, 600),     # Lunch break
        }

        break_type = random.choices(
            list(break_types.keys()),
            weights=[0.8, 0.15, 0.05]  # 80% short, 15% medium, 5% long
        )[0]

        min_delay, max_delay = break_types[break_type]
        delay = random.uniform(min_delay, max_delay)

        if delay > 60:
            print(f"    [☕] Taking a break for {delay/60:.1f} minutes...")

        return delay

    def should_pause_attack(self) -> tuple[bool, str]:
        """
        Determine if attack should be paused.

        Returns:
            (should_pause, reason)
        """
        # Pause during business hours if in stealth mode
        if self.stealth_mode and self.is_business_hours():
            # 30% chance to pause during business hours
            if random.random() < 0.3:
                return True, "Business hours - avoiding detection"

        # Pause if too many rate limits
        if self.consecutive_rate_limits > 3:
            return True, "Too many rate limits - cooling down"

        return False, ""

    def get_burst_pattern(self, burst_size: int = 5) -> list[float]:
        """
        Generate burst pattern delays.

        Humans sometimes work in bursts - quick succession followed by pause.

        Returns:
            List of delays for a burst of requests
        """
        delays = []

        # Quick succession
        for i in range(burst_size):
            if i == 0:
                delays.append(0.1)  # Start immediately
            else:
                # Quick delays during burst
                delays.append(random.uniform(0.1, 0.5))

        # Longer pause after burst
        delays.append(random.uniform(5, 15))

        return delays

    def print_stats(self):
        """Print rate limiter statistics"""
        avg_delay = (
            self.stats["total_wait_time"] / self.stats["total_delays"]
            if self.stats["total_delays"] > 0
            else 0
        )

        print("\n[*] Adaptive Rate Limiter Statistics:")
        print(f"    Total delays calculated: {self.stats['total_delays']}")
        print(f"    Total wait time: {self.stats['total_wait_time']:.1f}s")
        print(f"    Average delay: {avg_delay:.2f}s")
        print(f"    Rate limit detections: {self.stats['rate_limit_detections']}")
        print(f"    Backoff triggers: {self.stats['backoff_triggers']}")
        print(f"    Current backoff multiplier: {self.current_backoff_multiplier:.2f}x")


class StealthTiming:
    """
    Advanced stealth timing strategies.

    Used by sophisticated attackers to avoid detection.
    """

    @staticmethod
    def jitter_delay(base_delay: float, jitter_percent: float = 0.2) -> float:
        """
        Add jitter to delay to avoid pattern detection.

        Args:
            base_delay: Base delay in seconds
            jitter_percent: Percentage of jitter (0.0 - 1.0)

        Returns:
            Delay with jitter applied
        """
        jitter = base_delay * jitter_percent
        return base_delay + random.uniform(-jitter, jitter)

    @staticmethod
    def gaussian_delay(mean: float, std_dev: float) -> float:
        """
        Generate delay using Gaussian (normal) distribution.

        This mimics natural human behavior better than uniform distribution.
        """
        delay = random.gauss(mean, std_dev)
        return max(0.1, delay)  # Ensure positive delay

    @staticmethod
    def poisson_delay(rate: float) -> float:
        """
        Generate delay using Poisson distribution.

        Good for modeling random arrival times (e.g., legitimate users).
        """
        return random.expovariate(rate)

    @staticmethod
    async def adaptive_async_delay(
        delay: float,
        progress_callback: Optional[callable] = None
    ):
        """
        Async delay with optional progress updates.

        Useful for long delays where you want to show progress.
        """
        if delay <= 1.0:
            await asyncio.sleep(delay)
            return

        # For longer delays, show progress
        steps = int(delay)
        for i in range(steps):
            await asyncio.sleep(1.0)
            if progress_callback:
                progress_callback(i + 1, steps)

        # Sleep remaining fractional seconds
        remaining = delay - steps
        if remaining > 0:
            await asyncio.sleep(remaining)


if __name__ == "__main__":
    # Demo: Adaptive rate limiting

    print("="*70)
    print("ADAPTIVE RATE LIMITER - DEMO")
    print("="*70)

    # Example 1: Normal operation
    print("\n[*] Simulating normal attack with adaptive delays...")
    limiter = AdaptiveRateLimiter(base_delay=2.0, stealth_mode=False)

    for i in range(10):
        delay = limiter.calculate_delay(i, response_status=200)
        print(f"    Attempt {i+1}: Delay = {delay:.2f}s")

    # Example 2: Rate limit encountered
    print("\n[*] Simulating rate limit detection...")
    limiter = AdaptiveRateLimiter(base_delay=1.0)

    for i in range(5):
        status = 429 if i == 2 else 200  # Rate limited on attempt 3
        delay = limiter.calculate_delay(i, response_status=status)
        print(f"    Attempt {i+1} (status {status}): Delay = {delay:.2f}s")

    # Example 3: Stealth mode during business hours
    print("\n[*] Simulating stealth mode...")
    limiter = AdaptiveRateLimiter(base_delay=1.5, stealth_mode=True)

    for i in range(5):
        delay = limiter.calculate_delay(i, response_status=200)
        biz_hours = "Yes" if limiter.is_business_hours() else "No"
        print(f"    Attempt {i+1} (Business hours: {biz_hours}): Delay = {delay:.2f}s")

    # Print stats
    limiter.print_stats()

    # Example 4: Burst pattern
    print("\n[*] Generating burst pattern...")
    limiter = AdaptiveRateLimiter()
    burst_delays = limiter.get_burst_pattern(5)
    print(f"    Burst delays: {[f'{d:.2f}s' for d in burst_delays]}")

    print("\n" + "="*70)
    print("Key features demonstrated:")
    print("  • Human-like delay patterns (Gaussian, exponential)")
    print("  • Adaptive backoff on rate limiting")
    print("  • Business hours detection")
    print("  • Random 'coffee breaks' and thinking pauses")
    print("  • Burst patterns (quick succession + pause)")
    print("="*70)
