#!/usr/bin/env python3
"""
Monitoring smoke test for DevSecOps Hacking Lab.

This script verifies end-to-end observability by:
1. Ensuring Prometheus, Alertmanager, and the login API are reachable.
2. Generating a burst of failed login attempts to exercise defenses.
3. Waiting for Prometheus alerts to fire.
4. Confirming the webhook receiver captured alert payloads.

Exit code 0 indicates success; any failure raises an exception.
"""

from __future__ import annotations

import json
import os
import sys
import time
from typing import Iterable

import requests


PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://localhost:9090")
ALERTMANAGER_URL = os.getenv("ALERTMANAGER_URL", "http://localhost:9093")
ALERT_RECEIVER_URL = os.getenv("ALERT_RECEIVER_URL", "http://localhost:5001")
LOGIN_API_URL = os.getenv("LOGIN_API_URL", "http://localhost:8000/auth/login")

REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "5"))


def wait_for_ready(url: str, name: str, timeout: int = 120) -> None:
    """Poll an HTTP readiness endpoint until it returns HTTP 200."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            resp = requests.get(url, timeout=REQUEST_TIMEOUT)
            if resp.status_code == 200:
                print(f"[ok] {name} ready at {url}")
                return
        except requests.RequestException:
            pass
        time.sleep(2)
    raise RuntimeError(f"{name} not ready within {timeout}s at {url}")


def generate_failed_logins(
    warmup_attempts: int = 60,
    warmup_delay: float = 0.2,
    burst_attempts: int = 240,
    burst_delay: float = 0.02,
) -> None:
    """Send a burst of failed login attempts to trigger defenses."""
    payload = {"username": "admin", "password": "incorrect-password"}
    successes = 0
    failures = 0
    total_attempts = warmup_attempts + burst_attempts

    # Warm-up phase to register clear failures before bans/rate-limits kick in.
    for _ in range(warmup_attempts):
        try:
            resp = requests.post(LOGIN_API_URL, json=payload, timeout=REQUEST_TIMEOUT)
        except requests.RequestException as exc:  # pragma: no cover - network failure path
            raise RuntimeError(f"Request to login API failed: {exc}") from exc

        if resp.status_code == 200:
            successes += 1
        elif resp.status_code in (401, 403, 429):
            failures += 1
        else:
            raise RuntimeError(
                f"Unexpected status code {resp.status_code} from login API: {resp.text}"
            )

        time.sleep(warmup_delay)

    # Burst phase for stronger rate limiting activity.
    for _ in range(burst_attempts):
        try:
            resp = requests.post(LOGIN_API_URL, json=payload, timeout=REQUEST_TIMEOUT)
        except requests.RequestException as exc:  # pragma: no cover - network failure path
            raise RuntimeError(f"Request to login API failed: {exc}") from exc

        if resp.status_code == 200:
            successes += 1
        elif resp.status_code in (401, 403, 429):
            failures += 1
        else:
            raise RuntimeError(
                f"Unexpected status code {resp.status_code} from login API: {resp.text}"
            )

        time.sleep(burst_delay)

    print(
        f"[info] Generated {successes} successful and {failures} failed/braked login attempts"
    )

    if failures == 0:
        raise RuntimeError("No failed attempts recorded; expected to trigger defenses")


def query_prometheus(query: str) -> Iterable[dict]:
    """Run an instant query against Prometheus."""
    resp = requests.get(
        f"{PROMETHEUS_URL}/api/v1/query", params={"query": query}, timeout=REQUEST_TIMEOUT
    )
    resp.raise_for_status()
    payload = resp.json()
    if payload.get("status") != "success":  # pragma: no cover - query failure path
        raise RuntimeError(f"Prometheus query failed: {payload}")
    return payload["data"]["result"]


def ensure_metric_increased(metric_query: str, threshold: float, description: str) -> None:
    """Confirm that a Prometheus metric increase exceeds the expected threshold."""
    results = query_prometheus(metric_query)
    value = sum(float(result["value"][1]) for result in results) if results else 0.0
    print(f"[info] Metric query '{metric_query}' aggregated value {value}")
    if value < threshold:
        raise RuntimeError(f"{description} expected >= {threshold}, got {value}")


def wait_for_alert(alert_name: str, timeout: int = 120) -> None:
    """Wait for a named alert to reach the 'firing' state."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        resp = requests.get(f"{PROMETHEUS_URL}/api/v1/alerts", timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        alerts = resp.json().get("data", {}).get("alerts", [])
        for alert in alerts:
            if alert.get("labels", {}).get("alertname") == alert_name and alert.get(
                "state"
            ) == "firing":
                print(f"[ok] Alert '{alert_name}' is firing")
                return
        time.sleep(5)
    raise RuntimeError(f"Alert '{alert_name}' did not fire within {timeout}s")


def ensure_webhook_received(timeout: int = 90) -> None:
    """Verify that the alert receiver captured webhook payloads."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        resp = requests.get(f"{ALERT_RECEIVER_URL}/alerts", timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        payload = resp.json()
        alerts = payload.get("alerts", [])
        if alerts:
            print(f"[ok] Alert receiver captured {len(alerts)} alert payload(s)")
            return
        time.sleep(5)
    raise RuntimeError("Alert receiver has no recorded requests yet")


def main() -> int:
    wait_for_ready("http://localhost:8000/health", "login-api")
    wait_for_ready(f"{PROMETHEUS_URL}/-/ready", "Prometheus")
    wait_for_ready(f"{ALERTMANAGER_URL}/-/ready", "Alertmanager")
    wait_for_ready(f"{ALERT_RECEIVER_URL}/health", "Alert receiver")

    # Ensure previous alerts do not interfere with assertions
    requests.delete(f"{ALERT_RECEIVER_URL}/alerts", timeout=REQUEST_TIMEOUT)

    generate_failed_logins()

    # Give Prometheus time to ingest the latest samples (scrape interval 15s).
    time.sleep(20)

    ensure_metric_increased(
        "increase(login_failed_total[5m])", threshold=5, description="Failed logins spike"
    )
    ensure_metric_increased(
        "increase(rate_limit_blocks_total[5m])",
        threshold=3,
        description="Rate limiter blocks spike",
    )

    wait_for_alert("LoginFailureSpike", timeout=120)
    wait_for_alert("RateLimiterBlocking", timeout=120)

    # Allow Alertmanager to forward the webhook.
    time.sleep(5)
    ensure_webhook_received()

    print("[success] Monitoring smoke test completed successfully")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # pragma: no cover - script exit path
        print(f"[error] {exc}", file=sys.stderr)
        sys.exit(1)

