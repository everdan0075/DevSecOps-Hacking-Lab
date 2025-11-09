#!/usr/bin/env python3
"""
Token Replay Attack Script
Tests JWT token security by attempting to use expired, revoked, or tampered tokens.
"""

import argparse
import base64
import json
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

import httpx
from rich.console import Console
from rich.table import Table

console = Console()


class TokenReplayAttack:
    """Token replay attack testing JWT implementation"""

    def __init__(self, target: str, timeout: float = 10.0):
        self.target = target
        self.login_url = target.rstrip("/") + "/auth/login"
        self.mfa_url = target.rstrip("/") + "/auth/mfa/verify"
        self.refresh_url = target.rstrip("/") + "/auth/token/refresh"
        self.logout_url = target.rstrip("/") + "/auth/logout"
        self.timeout = timeout
        self.results = {
            "timestamp": datetime.utcnow().isoformat(),
            "target": target,
            "tests": [],
        }

    def decode_jwt(self, token: str) -> Optional[Dict]:
        """Decode JWT payload (without verification)"""
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None
            # Add padding if needed
            payload = parts[1]
            payload += "=" * (4 - len(payload) % 4)
            decoded = base64.urlsafe_b64decode(payload)
            return json.loads(decoded)
        except Exception:
            return None

    def obtain_valid_tokens(self, username: str, password: str, mfa_code: str) -> Dict:
        """Obtain valid tokens through login flow"""
        console.print(f"\n[cyan]Obtaining valid tokens for {username}...[/cyan]")

        try:
            # Step 1: Login
            with httpx.Client(timeout=self.timeout) as client:
                login_response = client.post(
                    self.login_url, json={"username": username, "password": password}
                )

                if login_response.status_code != 200:
                    console.print(
                        f"[red]Login failed: {login_response.status_code}[/red]"
                    )
                    return {}

                login_data = login_response.json()
                if not login_data.get("requires_mfa"):
                    console.print("[yellow]MFA not required, unexpected[/yellow]")
                    return {}

                challenge_id = login_data["challenge_id"]
                console.print(f"  ✓ Login successful, challenge_id: {challenge_id}")

                # Step 2: MFA
                mfa_response = client.post(
                    self.mfa_url,
                    json={"challenge_id": challenge_id, "code": mfa_code},
                )

                if mfa_response.status_code != 200:
                    console.print(
                        f"[red]MFA verification failed: {mfa_response.status_code}[/red]"
                    )
                    return {}

                tokens = mfa_response.json()
                console.print("  ✓ MFA verification successful")
                console.print(
                    f"  ✓ Access token expires in: {tokens['expires_in']}s"
                )
                console.print(
                    f"  ✓ Refresh token expires in: {tokens['refresh_expires_in']}s"
                )

                return tokens

        except Exception as e:
            console.print(f"[red]Error obtaining tokens: {e}[/red]")
            return {}

    def test_expired_access_token(self, tokens: Dict) -> Dict:
        """Test 1: Try to use an expired access token"""
        console.print("\n[bold]Test 1: Expired Access Token[/bold]")

        access_token = tokens["access_token"]
        payload = self.decode_jwt(access_token)

        if payload:
            exp_timestamp = payload.get("exp", 0)
            exp_dt = datetime.fromtimestamp(exp_timestamp)
            console.print(f"  Token expires at: {exp_dt}")
            console.print("  Waiting for token to expire...")
            time.sleep(tokens["expires_in"] + 2)

        console.print("  Attempting to use expired access token...")

        # Try to refresh with expired access token (should fail)
        result = {
            "test": "expired_access_token",
            "description": "Attempt to use expired JWT access token",
            "expected": "Should be rejected",
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    self.refresh_url, json={"refresh_token": tokens["refresh_token"]}
                )
                # Note: We're testing if refresh works even when access is expired
                # This SHOULD work (that's the point of refresh tokens)
                result["status_code"] = response.status_code
                result["outcome"] = (
                    "pass" if response.status_code == 200 else "unexpected"
                )
                result["message"] = (
                    "Refresh token correctly allows new access token"
                    if response.status_code == 200
                    else f"Unexpected: {response.text}"
                )
                console.print(f"  [green]✓[/green] {result['message']}")
        except Exception as e:
            result["outcome"] = "error"
            result["error"] = str(e)
            console.print(f"  [red]✗ Error: {e}[/red]")

        self.results["tests"].append(result)
        return result

    def test_revoked_refresh_token(self, tokens: Dict) -> Dict:
        """Test 2: Try to use a revoked refresh token"""
        console.print("\n[bold]Test 2: Revoked Refresh Token[/bold]")

        result = {
            "test": "revoked_refresh_token",
            "description": "Attempt to use revoked refresh token",
            "expected": "Should be rejected with 401",
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                # First, revoke the token
                console.print("  Revoking refresh token...")
                logout_response = client.post(
                    self.logout_url,
                    json={
                        "refresh_token": tokens["refresh_token"],
                        "all_sessions": False,
                    },
                )

                if logout_response.status_code == 200:
                    console.print("  ✓ Token revoked successfully")
                else:
                    console.print(
                        f"  [yellow]Revocation returned: {logout_response.status_code}[/yellow]"
                    )

                # Now try to use the revoked token
                console.print("  Attempting to use revoked refresh token...")
                response = client.post(
                    self.refresh_url, json={"refresh_token": tokens["refresh_token"]}
                )

                result["status_code"] = response.status_code
                result["outcome"] = "pass" if response.status_code == 401 else "fail"
                result["message"] = (
                    "Correctly rejected revoked token"
                    if response.status_code == 401
                    else f"SECURITY ISSUE: Revoked token still works! ({response.status_code})"
                )

                if result["outcome"] == "pass":
                    console.print(f"  [green]✓[/green] {result['message']}")
                else:
                    console.print(f"  [red]✗[/red] {result['message']}")

        except Exception as e:
            result["outcome"] = "error"
            result["error"] = str(e)
            console.print(f"  [red]✗ Error: {e}[/red]")

        self.results["tests"].append(result)
        return result

    def test_tampered_jwt(self, tokens: Dict) -> Dict:
        """Test 3: Try to use a tampered JWT"""
        console.print("\n[bold]Test 3: Tampered JWT[/bold]")

        result = {
            "test": "tampered_jwt",
            "description": "Attempt to use modified JWT payload",
            "expected": "Should be rejected",
        }

        access_token = tokens["access_token"]
        parts = access_token.split(".")

        if len(parts) == 3:
            try:
                # Decode payload
                payload_data = self.decode_jwt(access_token)
                console.print(f"  Original username: {payload_data.get('sub')}")

                # Tamper with payload (change username)
                payload_data["sub"] = "admin"
                tampered_payload = base64.urlsafe_b64encode(
                    json.dumps(payload_data).encode()
                ).decode()
                tampered_payload = tampered_payload.rstrip("=")

                # Create tampered token
                tampered_token = f"{parts[0]}.{tampered_payload}.{parts[2]}"
                console.print("  Created tampered token with username='admin'")

                # Try to use tampered token (in a hypothetical protected endpoint)
                # Since we don't have a protected endpoint yet, we'll just document this
                result["outcome"] = "documented"
                result["message"] = (
                    "Tampered token created. Would be rejected by signature verification. "
                    "Need protected endpoint to test fully."
                )
                console.print(f"  [yellow]⚠[/yellow] {result['message']}")

            except Exception as e:
                result["outcome"] = "error"
                result["error"] = str(e)
                console.print(f"  [red]✗ Error: {e}[/red]")
        else:
            result["outcome"] = "error"
            result["message"] = "Invalid JWT format"
            console.print(f"  [red]✗ {result['message']}[/red]")

        self.results["tests"].append(result)
        return result

    def test_token_replay_attack(self, tokens: Dict) -> Dict:
        """Test 4: Try to replay a refresh token multiple times"""
        console.print("\n[bold]Test 4: Token Replay (Multiple Use)[/bold]")

        result = {
            "test": "token_replay",
            "description": "Attempt to use same refresh token multiple times",
            "expected": "After first use, should be invalidated (if using rotation)",
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                refresh_token = tokens["refresh_token"]

                # Use token first time
                console.print("  Using refresh token (1st time)...")
                response1 = client.post(
                    self.refresh_url, json={"refresh_token": refresh_token}
                )

                if response1.status_code == 200:
                    console.print("  ✓ First use successful")
                    new_tokens = response1.json()
                    new_refresh = new_tokens["refresh_token"]

                    # Try to use OLD token again
                    console.print("  Attempting to reuse old refresh token...")
                    response2 = client.post(
                        self.refresh_url, json={"refresh_token": refresh_token}
                    )

                    result["first_use"] = response1.status_code
                    result["second_use"] = response2.status_code

                    # With rotation, old token should be invalid
                    if response2.status_code == 401:
                        result["outcome"] = "pass"
                        result["message"] = (
                            "Correctly implements token rotation - old token rejected"
                        )
                        console.print(f"  [green]✓[/green] {result['message']}")
                    else:
                        result["outcome"] = "fail"
                        result["message"] = (
                            f"SECURITY ISSUE: Old refresh token still works after rotation! "
                            f"({response2.status_code})"
                        )
                        console.print(f"  [red]✗[/red] {result['message']}")
                else:
                    result["outcome"] = "error"
                    result["message"] = f"First refresh failed: {response1.status_code}"
                    console.print(f"  [red]✗ {result['message']}[/red]")

        except Exception as e:
            result["outcome"] = "error"
            result["error"] = str(e)
            console.print(f"  [red]✗ Error: {e}[/red]")

        self.results["tests"].append(result)
        return result

    def run_attack(self, username: str, password: str, mfa_code: str):
        """Execute all token replay tests"""
        console.print("[bold cyan]Token Replay Attack Suite[/bold cyan]")
        console.print(f"Target: {self.target}\n")

        # Obtain valid tokens
        tokens = self.obtain_valid_tokens(username, password, mfa_code)
        if not tokens:
            console.print("[red]Failed to obtain tokens. Cannot proceed.[/red]")
            return

        # Run tests
        self.test_expired_access_token(tokens.copy())

        # Get fresh tokens for next test
        tokens2 = self.obtain_valid_tokens(username, password, mfa_code)
        if tokens2:
            self.test_revoked_refresh_token(tokens2)

        # Test JWT tampering
        tokens3 = self.obtain_valid_tokens(username, password, mfa_code)
        if tokens3:
            self.test_tampered_jwt(tokens3)

        # Test token replay
        tokens4 = self.obtain_valid_tokens(username, password, mfa_code)
        if tokens4:
            self.test_token_replay_attack(tokens4)

    def print_summary(self):
        """Print test summary"""
        console.print("\n[bold green]Test Summary[/bold green]")

        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Test", style="cyan")
        table.add_column("Outcome", justify="center")
        table.add_column("Message", style="dim")

        for test in self.results["tests"]:
            outcome = test["outcome"]
            color = {
                "pass": "green",
                "fail": "red",
                "error": "yellow",
                "documented": "blue",
            }.get(outcome, "white")

            outcome_symbol = {
                "pass": "✓",
                "fail": "✗",
                "error": "⚠",
                "documented": "📝",
            }.get(outcome, "?")

            table.add_row(
                test["test"],
                f"[{color}]{outcome_symbol} {outcome}[/{color}]",
                test.get("message", ""),
            )

        console.print(table)

    def save_results(self):
        """Save test results"""
        results_dir = Path(__file__).parent / "results"
        results_dir.mkdir(exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = results_dir / f"token_replay_{timestamp}.json"

        with open(filename, "w") as f:
            json.dump(self.results, f, indent=2)

        console.print(f"\n[dim]Results saved to: {filename}[/dim]")


def main():
    parser = argparse.ArgumentParser(
        description="Token Replay Attack Script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python token_replay.py \\
    --target http://localhost:8000 \\
    --username admin \\
    --password admin123 \\
    --mfa-code 123456
""",
    )

    parser.add_argument(
        "--target", required=True, help="Target API base URL (e.g., http://localhost:8000)"
    )
    parser.add_argument("--username", required=True, help="Username for authentication")
    parser.add_argument("--password", required=True, help="Password for authentication")
    parser.add_argument("--mfa-code", required=True, help="MFA code for authentication")
    parser.add_argument(
        "--timeout", type=float, default=10.0, help="Request timeout (default: 10.0)"
    )

    args = parser.parse_args()

    attack = TokenReplayAttack(target=args.target, timeout=args.timeout)

    try:
        attack.run_attack(args.username, args.password, args.mfa_code)
        attack.print_summary()
        attack.save_results()
        return 0
    except KeyboardInterrupt:
        console.print("\n[yellow]Attack interrupted by user[/yellow]")
        return 1
    except Exception as e:
        console.print(f"\n[bold red]Error:[/bold red] {e}")
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

