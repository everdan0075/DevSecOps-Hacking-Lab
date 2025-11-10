#!/usr/bin/env python3
"""
Smoke tests for User Service (Phase 2.2)

Tests intentional vulnerabilities:
- IDOR in /profile/{user_id}
- Auth bypass in /settings
- Direct service access detection
- Metrics exposure
"""

import pytest
import requests
from typing import Optional


# Configuration
USER_SERVICE_URL = "http://localhost:8002"  # Direct access (bypassing gateway)
GATEWAY_URL = "http://localhost:8080"
AUTH_SERVICE_URL = "http://localhost:8000"


class TestUserServiceHealth:
    """Test User Service availability"""
    
    def test_health_endpoint(self):
        """User Service health endpoint should return 200"""
        response = requests.get(f"{USER_SERVICE_URL}/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "user-service"


class TestUserServiceIDOR:
    """Test IDOR vulnerability in /profile endpoint"""
    
    def test_idor_vulnerability_exists(self):
        """Profile endpoint should NOT validate authorization (intentional vuln)"""
        # Get valid token for user 'alice'
        token = self._get_token_for_user("alice", "alice123")
        if not token:
            pytest.skip("Could not obtain token")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Alice (user_id=2) tries to access Bob's profile (user_id=3)
        response = requests.get(
            f"{USER_SERVICE_URL}/profile/3",
            headers=headers
        )
        
        # VULNERABILITY: Should be 403 Forbidden, but returns 200 (IDOR)
        assert response.status_code == 200
        
        data = response.json()
        assert data["user_id"] == "3"
        assert data["username"] == "bob"
        # Sensitive data exposed!
        assert "ssn" in data
        assert "credit_card" in data
    
    def test_idor_access_own_profile(self):
        """User should be able to access their own profile"""
        token = self._get_token_for_user("alice", "alice123")
        if not token:
            pytest.skip("Could not obtain token")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Alice accesses her own profile (user_id=2)
        response = requests.get(
            f"{USER_SERVICE_URL}/profile/2",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "2"
        assert data["username"] == "alice"
    
    def test_idor_metrics_tracking(self):
        """IDOR attempts should be tracked in metrics"""
        token = self._get_token_for_user("alice", "alice123")
        if not token:
            pytest.skip("Could not obtain token")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Alice tries to access multiple other users' profiles
        for target_id in [3, 4, 5]:
            requests.get(
                f"{USER_SERVICE_URL}/profile/{target_id}",
                headers=headers
            )
        
        # Check metrics recorded the IDOR attempts
        metrics_response = requests.get(f"{USER_SERVICE_URL}/metrics")
        assert metrics_response.status_code == 200
        
        metrics_text = metrics_response.text
        assert "user_service_idor_attempts_total" in metrics_text
        assert 'authenticated_user="alice"' in metrics_text
    
    @staticmethod
    def _get_token_for_user(username: str, password: str) -> Optional[str]:
        """Helper: Get JWT token for a user"""
        try:
            # Login
            login_response = requests.post(
                f"{AUTH_SERVICE_URL}/auth/login",
                json={"username": username, "password": password}
            )
            if login_response.status_code != 200:
                return None
            
            challenge_id = login_response.json()["challenge_id"]
            
            # Get MFA code
            import subprocess
            result = subprocess.run(
                ["docker", "exec", "login-api", "python", "-c",
                 "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())"],
                capture_output=True,
                text=True
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
            print(f"Error getting token: {e}")
            return None


class TestUserServiceAuthBypass:
    """Test auth bypass vulnerability in /settings endpoint"""
    
    def test_settings_auth_bypass_exists(self):
        """Settings endpoint should NOT require JWT (intentional vuln)"""
        # Access /settings WITHOUT any authentication
        response = requests.get(f"{USER_SERVICE_URL}/settings")
        
        # VULNERABILITY: Should be 401 Unauthorized, but returns 200
        assert response.status_code == 200
        
        data = response.json()
        # Response contains settings data (api_key, theme, etc.)
        assert "api_key" in data or "theme" in data
        # Settings accessible without auth = vulnerability
    
    def test_settings_metrics_tracking(self):
        """Unauthorized settings access should be tracked"""
        # Make multiple unauthorized accesses
        for _ in range(3):
            requests.get(f"{USER_SERVICE_URL}/settings")
        
        # Check metrics
        metrics_response = requests.get(f"{USER_SERVICE_URL}/metrics")
        assert metrics_response.status_code == 200
        
        metrics_text = metrics_response.text
        assert "user_service_unauthorized_settings_access_total" in metrics_text


class TestDirectServiceAccess:
    """Test direct service access detection"""
    
    def test_direct_access_bypasses_gateway(self):
        """Direct access to user-service should work but be tracked"""
        # Access user-service directly (port 8002) instead of through gateway (port 8080)
        response = requests.get(f"{USER_SERVICE_URL}/health")
        assert response.status_code == 200
        
        # This works, but metrics should track it as suspicious
        metrics_response = requests.get(f"{USER_SERVICE_URL}/metrics")
        metrics_text = metrics_response.text
        
        assert "user_service_direct_access_total" in metrics_text
    
    def test_direct_access_vs_gateway(self):
        """Compare direct access vs gateway access"""
        # Through gateway (correct way)
        gateway_response = requests.get(f"{GATEWAY_URL}/api/users/health")
        
        # Direct to service (bypassing gateway)
        direct_response = requests.get(f"{USER_SERVICE_URL}/health")
        
        # Both should work, but gateway adds security controls
        assert gateway_response.status_code == 200
        assert direct_response.status_code == 200
        
        # Gateway should add security headers
        assert "X-Content-Type-Options" in gateway_response.headers
        # Direct access won't have these headers
        assert "X-Content-Type-Options" not in direct_response.headers


class TestUserServiceMetrics:
    """Test metrics exposure"""
    
    def test_metrics_endpoint(self):
        """Metrics endpoint should return Prometheus format"""
        response = requests.get(f"{USER_SERVICE_URL}/metrics")
        assert response.status_code == 200
        assert response.headers["Content-Type"].startswith("text/plain")
        
        metrics_text = response.text
        
        # Check for key metrics
        assert "user_service_requests_total" in metrics_text
        assert "user_service_idor_attempts_total" in metrics_text
        assert "user_service_direct_access_total" in metrics_text
        assert "user_service_unauthorized_settings_access_total" in metrics_text
    
    def test_metrics_include_labels(self):
        """Metrics should include relevant labels"""
        # Make some requests to generate metrics
        requests.get(f"{USER_SERVICE_URL}/health")
        
        token = TestUserServiceIDOR._get_token_for_user("alice", "alice123")
        if token:
            headers = {"Authorization": f"Bearer {token}"}
            requests.get(f"{USER_SERVICE_URL}/profile/3", headers=headers)
        
        # Check metrics have labels
        response = requests.get(f"{USER_SERVICE_URL}/metrics")
        metrics_text = response.text
        
        # Should have endpoint labels
        assert 'endpoint="/health"' in metrics_text or 'method="GET"' in metrics_text


class TestUserServiceVulnerabilityValidation:
    """Validate that vulnerabilities are actually exploitable"""
    
    def test_idor_exploitation_complete_flow(self):
        """Complete IDOR exploitation flow"""
        # Step 1: Login as Alice
        token = TestUserServiceIDOR._get_token_for_user("alice", "alice123")
        if not token:
            pytest.skip("Could not obtain token")
        
        # Step 2: Access own profile (legitimate)
        headers = {"Authorization": f"Bearer {token}"}
        own_profile = requests.get(f"{USER_SERVICE_URL}/profile/2", headers=headers)
        assert own_profile.status_code == 200
        assert own_profile.json()["username"] == "alice"
        
        # Step 3: Enumerate other users (IDOR vulnerability)
        stolen_data = []
        for user_id in range(1, 6):
            response = requests.get(
                f"{USER_SERVICE_URL}/profile/{user_id}",
                headers=headers
            )
            if response.status_code == 200:
                data = response.json()
                stolen_data.append({
                    "user_id": data["user_id"],
                    "username": data["username"],
                    "ssn": data.get("ssn"),
                    "credit_card": data.get("credit_card")
                })
        
        # Should have stolen multiple users' data
        assert len(stolen_data) >= 3
        
        # Verify sensitive data was exposed
        for user in stolen_data:
            assert user["ssn"] is not None
            assert user["credit_card"] is not None
    
    def test_auth_bypass_exploitation(self):
        """Complete auth bypass exploitation flow"""
        # Access settings WITHOUT any authentication
        response = requests.get(f"{USER_SERVICE_URL}/settings")
        
        assert response.status_code == 200
        data = response.json()
        
        # Sensitive settings exposed without auth
        assert "api_key" in data or "theme" in data
        # Any data returned means vulnerability exists
        assert len(data) > 0
        
        # Verify it's tracked as unauthorized
        metrics = requests.get(f"{USER_SERVICE_URL}/metrics").text
        assert "user_service_unauthorized_settings_access_total" in metrics


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

