#!/usr/bin/env python3
"""
End-to-End Integration Tests - Phase 2.2

Complete authentication flow through the entire system:
1. Login to auth-service
2. MFA verification
3. Obtain JWT tokens
4. Access protected resources through API Gateway
5. Gateway validates JWT and routes to backend services
6. User Service processes requests

This validates the entire microservices architecture.
"""

import pytest
import requests
import subprocess
import time
from typing import Dict, Optional, Tuple


# Configuration
AUTH_SERVICE_URL = "http://localhost:8000"
GATEWAY_URL = "http://localhost:8080"
USER_SERVICE_URL = "http://localhost:8002"  # For direct access comparison


class TestE2EAuthenticationFlow:
    """Test complete authentication flow"""
    
    def test_full_login_flow(self):
        """Complete login flow: username/password + MFA -> JWT tokens"""
        # Step 1: Submit credentials
        login_response = requests.post(
            f"{AUTH_SERVICE_URL}/auth/login",
            json={"username": "admin", "password": "admin123"}
        )
        assert login_response.status_code == 200
        
        login_data = login_response.json()
        assert login_data["status"] == "mfa_required"
        assert "challenge_id" in login_data
        assert "expires_in" in login_data
        
        challenge_id = login_data["challenge_id"]
        
        # Step 2: Get MFA code
        mfa_code = self._get_current_mfa_code()
        assert mfa_code is not None
        assert len(mfa_code) == 6
        
        # Step 3: Verify MFA
        mfa_response = requests.post(
            f"{AUTH_SERVICE_URL}/auth/mfa/verify",
            json={
                "challenge_id": challenge_id,
                "totp_code": mfa_code
            }
        )
        assert mfa_response.status_code == 200
        
        mfa_data = mfa_response.json()
        assert "access_token" in mfa_data
        assert "refresh_token" in mfa_data
        assert mfa_data["token_type"] == "bearer"
        
        # Verify tokens are valid JWTs (basic check)
        access_token = mfa_data["access_token"]
        refresh_token = mfa_data["refresh_token"]
        
        assert access_token.count(".") == 2  # JWT has 3 parts
        assert refresh_token.count(".") == 2
    
    def test_failed_login_invalid_credentials(self):
        """Failed login should not proceed to MFA"""
        response = requests.post(
            f"{AUTH_SERVICE_URL}/auth/login",
            json={"username": "admin", "password": "wrong_password"}
        )
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    def test_failed_mfa_invalid_code(self):
        """Failed MFA should not issue tokens"""
        # Get valid challenge
        login_response = requests.post(
            f"{AUTH_SERVICE_URL}/auth/login",
            json={"username": "admin", "password": "admin123"}
        )
        challenge_id = login_response.json()["challenge_id"]
        
        # Try invalid MFA code
        mfa_response = requests.post(
            f"{AUTH_SERVICE_URL}/auth/mfa/verify",
            json={
                "challenge_id": challenge_id,
                "totp_code": "000000"  # Invalid code
            }
        )
        assert mfa_response.status_code == 401
        assert "Invalid" in mfa_response.json()["detail"]
    
    @staticmethod
    def _get_current_mfa_code() -> Optional[str]:
        """Get current TOTP code from login-api container"""
        try:
            result = subprocess.run(
                ["docker", "exec", "login-api", "python", "-c",
                 "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.stdout.strip()
        except Exception as e:
            print(f"Error getting MFA code: {e}")
            return None


class TestE2EGatewayIntegration:
    """Test requests through API Gateway"""
    
    def test_gateway_jwt_validation_and_routing(self):
        """Gateway validates JWT and routes to backend"""
        # Step 1: Get valid token
        access_token = self._authenticate()
        assert access_token is not None
        
        # Step 2: Make request through Gateway
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{GATEWAY_URL}/protected", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "This is a protected endpoint"
        assert "user" in data
        assert data["user"]["username"] == "admin"
    
    def test_gateway_rejects_expired_token(self):
        """Gateway should reject expired tokens"""
        # Use a clearly invalid/expired token
        expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTYwMDAwMDAwMH0.invalid"
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = requests.get(f"{GATEWAY_URL}/protected", headers=headers)
        
        assert response.status_code == 401
    
    def test_gateway_rejects_missing_token(self):
        """Gateway should reject requests without token"""
        response = requests.get(f"{GATEWAY_URL}/protected")
        assert response.status_code == 401
        assert "Missing Authorization header" in response.json()["detail"]
    
    @staticmethod
    def _authenticate() -> Optional[str]:
        """Helper: Complete authentication flow and return access token"""
        try:
            # Login
            login_response = requests.post(
                f"{AUTH_SERVICE_URL}/auth/login",
                json={"username": "admin", "password": "admin123"}
            )
            if login_response.status_code != 200:
                return None
            
            challenge_id = login_response.json()["challenge_id"]
            
            # Get MFA
            result = subprocess.run(
                ["docker", "exec", "login-api", "python", "-c",
                 "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())"],
                capture_output=True,
                text=True,
                timeout=5
            )
            mfa_code = result.stdout.strip()
            
            # Verify MFA
            mfa_response = requests.post(
                f"{AUTH_SERVICE_URL}/auth/mfa/verify",
                json={"challenge_id": challenge_id, "totp_code": mfa_code}
            )
            if mfa_response.status_code != 200:
                return None
            
            return mfa_response.json()["access_token"]
        except Exception as e:
            print(f"Authentication error: {e}")
            return None


class TestE2EUserServiceAccess:
    """Test accessing User Service through Gateway"""
    
    def test_access_user_profile_through_gateway(self):
        """Complete flow: Auth -> Gateway -> User Service"""
        # Step 1: Authenticate
        access_token = TestE2EGatewayIntegration._authenticate()
        if not access_token:
            pytest.skip("Could not authenticate")
        
        # Step 2: Access user profile through Gateway
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(
            f"{GATEWAY_URL}/api/users/profile/1",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "1"
        assert data["username"] == "admin"
        assert "email" in data
    
    def test_idor_exploitation_through_gateway(self):
        """IDOR vulnerability exploitable through Gateway"""
        # Login as Alice
        access_token = self._authenticate_as("alice", "alice123")
        if not access_token:
            pytest.skip("Could not authenticate as alice")
        
        # Alice tries to access Bob's profile (user_id=3)
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(
            f"{GATEWAY_URL}/api/users/profile/3",
            headers=headers
        )
        
        # IDOR vulnerability: should be 403, but returns 200
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "3"
        assert data["username"] == "bob"
        # Sensitive data exposed
        assert "ssn" in data
        assert "credit_card" in data
    
    def test_auth_bypass_vulnerability(self):
        """Settings endpoint accessible without auth (through Gateway)"""
        # Try to access /settings WITHOUT authentication
        response = requests.get(f"{GATEWAY_URL}/api/users/settings")
        
        # Vulnerability: should be 401, but returns 200
        assert response.status_code == 200
        data = response.json()
        assert "settings" in data
        assert data["vulnerability"] == "Missing JWT validation"
    
    @staticmethod
    def _authenticate_as(username: str, password: str) -> Optional[str]:
        """Helper: Authenticate as specific user"""
        try:
            # Login
            login_response = requests.post(
                f"{AUTH_SERVICE_URL}/auth/login",
                json={"username": username, "password": password}
            )
            if login_response.status_code != 200:
                return None
            
            challenge_id = login_response.json()["challenge_id"]
            
            # Get MFA
            result = subprocess.run(
                ["docker", "exec", "login-api", "python", "-c",
                 "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())"],
                capture_output=True,
                text=True,
                timeout=5
            )
            mfa_code = result.stdout.strip()
            
            # Verify MFA
            mfa_response = requests.post(
                f"{AUTH_SERVICE_URL}/auth/mfa/verify",
                json={"challenge_id": challenge_id, "totp_code": mfa_code}
            )
            if mfa_response.status_code != 200:
                return None
            
            return mfa_response.json()["access_token"]
        except Exception:
            return None


class TestE2ESecurityControls:
    """Test security controls across the entire stack"""
    
    def test_gateway_rate_limiting(self):
        """Gateway rate limiting protects backend services"""
        access_token = TestE2EGatewayIntegration._authenticate()
        if not access_token:
            pytest.skip("Could not authenticate")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Send burst of requests
        blocked = False
        for i in range(65):
            response = requests.get(
                f"{GATEWAY_URL}/api/users/profile/1",
                headers=headers
            )
            if response.status_code == 429:
                blocked = True
                break
            time.sleep(0.01)  # Small delay
        
        # Rate limiter should eventually block
        assert blocked, "Rate limiter did not trigger"
    
    def test_gateway_waf_protection(self):
        """Gateway WAF blocks malicious requests before reaching backend"""
        access_token = TestE2EGatewayIntegration._authenticate()
        if not access_token:
            pytest.skip("Could not authenticate")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Try SQL injection through Gateway
        response = requests.get(
            f"{GATEWAY_URL}/api/users/profile/1",
            params={"filter": "' OR '1'='1"},
            headers=headers
        )
        
        # WAF should block at Gateway level (400), not reach backend
        assert response.status_code == 400
        assert "suspicious pattern" in response.json()["detail"].lower()
    
    def test_gateway_adds_security_headers(self):
        """Gateway adds security headers to all responses"""
        response = requests.get(f"{GATEWAY_URL}/health")
        
        # Check security headers
        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers
        assert "X-XSS-Protection" in response.headers
    
    def test_direct_access_vs_gateway_comparison(self):
        """Compare security controls: Direct access vs Gateway"""
        access_token = TestE2EGatewayIntegration._authenticate()
        if not access_token:
            pytest.skip("Could not authenticate")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Through Gateway (secure)
        gateway_response = requests.get(
            f"{GATEWAY_URL}/api/users/profile/1",
            headers=headers
        )
        
        # Direct to service (bypassing security)
        direct_response = requests.get(
            f"{USER_SERVICE_URL}/profile/1",
            headers=headers
        )
        
        # Both work, but Gateway adds protections
        assert gateway_response.status_code == 200
        assert direct_response.status_code == 200
        
        # Gateway has security headers
        assert "X-Frame-Options" in gateway_response.headers
        # Direct access doesn't
        assert "X-Frame-Options" not in direct_response.headers


class TestE2EMetricsAndObservability:
    """Test metrics collection across the stack"""
    
    def test_end_to_end_request_tracking(self):
        """Request tracked in all service metrics"""
        access_token = TestE2EGatewayIntegration._authenticate()
        if not access_token:
            pytest.skip("Could not authenticate")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Make request through Gateway to User Service
        response = requests.get(
            f"{GATEWAY_URL}/api/users/profile/1",
            headers=headers
        )
        assert response.status_code == 200
        
        # Check Gateway metrics
        gateway_metrics = requests.get(f"{GATEWAY_URL}/metrics").text
        assert "gateway_requests_total" in gateway_metrics
        assert 'path="/api/users/profile' in gateway_metrics
        
        # Check User Service metrics
        user_metrics = requests.get(f"{USER_SERVICE_URL}/metrics").text
        assert "user_service_requests_total" in user_metrics
        assert 'endpoint="/profile' in user_metrics
    
    def test_idor_attack_metrics_tracking(self):
        """IDOR attack tracked in metrics"""
        # Authenticate as Alice
        access_token = TestE2EUserServiceAccess._authenticate_as("alice", "alice123")
        if not access_token:
            pytest.skip("Could not authenticate as alice")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Alice accesses Bob's profile (IDOR)
        requests.get(f"{GATEWAY_URL}/api/users/profile/3", headers=headers)
        
        # Check metrics recorded IDOR attempt
        metrics = requests.get(f"{USER_SERVICE_URL}/metrics").text
        assert "user_service_idor_attempts_total" in metrics
        assert 'authenticated_user="alice"' in metrics
        assert 'target_user="3"' in metrics


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

