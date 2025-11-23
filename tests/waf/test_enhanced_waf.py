"""
Tests for Enhanced WAF (Phase 2.5A)

Tests signature detection, User-Agent filtering, bot detection, and per-endpoint rate limiting.
"""
import pytest
import httpx
import time


@pytest.fixture
def gateway_url():
    """Gateway base URL"""
    return "http://localhost:8080"


@pytest.fixture
def client():
    """HTTP client"""
    return httpx.Client(timeout=10.0)


class TestSignatureDetection:
    """Test WAF signature-based attack detection"""

    def test_sql_injection_union_select(self, client, gateway_url):
        """Test UNION SELECT SQL injection detection"""
        response = client.get(
            f"{gateway_url}/api/users/profile/1",
            params={"test": "union select from users"}
        )
        assert response.status_code == 400
        data = response.json()
        assert data["blocked_by"] == "WAF"
        assert data["message"] == "Attack pattern detected: sql_injection"
        assert data["severity"] == "critical"

    def test_sql_injection_boolean(self, client, gateway_url):
        """Test boolean-based SQL injection detection"""
        response = client.get(
            f"{gateway_url}/",
            params={"id": "1 OR 1=1"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "sql_injection" in data["message"]

    def test_xss_script_tag(self, client, gateway_url):
        """Test XSS via script tag detection"""
        response = client.get(
            f"{gateway_url}/api/users/profile/1",
            params={"name": "<script>alert(1)</script>"}
        )
        assert response.status_code == 400
        data = response.json()
        assert data["message"] == "Attack pattern detected: xss"
        assert data["severity"] == "high"

    def test_xss_event_handler(self, client, gateway_url):
        """Test XSS via event handler detection"""
        response = client.get(
            f"{gateway_url}/",
            params={"test": '<img src=x onerror="alert(1)">'}
        )
        assert response.status_code == 400
        data = response.json()
        assert "xss" in data["message"]

    def test_command_injection(self, client, gateway_url):
        """Test command injection detection"""
        response = client.get(
            f"{gateway_url}/",
            params={"cmd": "; ls -la"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "command_injection" in data["message"]

    def test_path_traversal(self, client, gateway_url):
        """Test path traversal detection"""
        response = client.get(
            f"{gateway_url}/",
            params={"file": "../../../../etc/passwd"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "path_traversal" in data["message"]

    def test_legitimate_request(self, client, gateway_url):
        """Test legitimate request passes through"""
        response = client.get(
            f"{gateway_url}/health",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        )
        assert response.status_code == 200


class TestUserAgentFiltering:
    """Test User-Agent based filtering"""

    def test_sqlmap_blocked(self, client, gateway_url):
        """Test SQLMap User-Agent blocked"""
        response = client.get(
            f"{gateway_url}/",
            headers={"User-Agent": "sqlmap/1.0"}
        )
        assert response.status_code == 403
        data = response.json()
        assert data["message"] == "Malicious User-Agent detected"
        assert data["blocked_by"] == "WAF"

    def test_nikto_blocked(self, client, gateway_url):
        """Test Nikto scanner blocked"""
        response = client.get(
            f"{gateway_url}/",
            headers={"User-Agent": "Nikto/2.1.6"}
        )
        assert response.status_code == 403
        data = response.json()
        assert "Malicious User-Agent" in data["message"]

    def test_nmap_blocked(self, client, gateway_url):
        """Test Nmap scanner blocked"""
        response = client.get(
            f"{gateway_url}/",
            headers={"User-Agent": "Nmap Scripting Engine"}
        )
        assert response.status_code == 403

    def test_curl_bare_blocked(self, client, gateway_url):
        """Test bare curl User-Agent blocked"""
        response = client.get(
            f"{gateway_url}/",
            headers={"User-Agent": "curl/7.68.0"}
        )
        assert response.status_code == 403

    def test_legitimate_browser_allowed(self, client, gateway_url):
        """Test legitimate browser User-Agent allowed"""
        response = client.get(
            f"{gateway_url}/health",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        assert response.status_code == 200


class TestBotDetection:
    """Test bot detection and filtering"""

    def test_generic_bot_blocked(self, client, gateway_url):
        """Test generic bot pattern blocked"""
        response = client.get(
            f"{gateway_url}/",
            headers={"User-Agent": "MyBot/1.0"}
        )
        assert response.status_code == 403
        data = response.json()
        assert "bot traffic not allowed" in data["message"]

    def test_crawler_blocked(self, client, gateway_url):
        """Test crawler pattern blocked"""
        response = client.get(
            f"{gateway_url}/",
            headers={"User-Agent": "MyCrawler/2.0"}
        )
        assert response.status_code == 403

    def test_googlebot_allowed(self, client, gateway_url):
        """Test Googlebot allowed (good bot)"""
        response = client.get(
            f"{gateway_url}/health",
            headers={"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)"}
        )
        assert response.status_code == 200

    def test_uptime_robot_allowed(self, client, gateway_url):
        """Test UptimeRobot allowed (monitoring bot)"""
        response = client.get(
            f"{gateway_url}/health",
            headers={"User-Agent": "UptimeRobot/2.0"}
        )
        assert response.status_code == 200


class TestPerEndpointRateLimiting:
    """Test per-endpoint rate limiting"""

    def test_login_endpoint_rate_limit(self, client, gateway_url):
        """Test strict rate limit on login endpoint (10 req/min)"""
        headers = {"User-Agent": "Mozilla/5.0"}

        # First 3 requests should succeed (burst_size = 3)
        for i in range(3):
            response = client.post(
                f"{gateway_url}/auth/login",
                headers=headers,
                json={"username": "test", "password": "test"}
            )
            # May fail auth but shouldn't be rate limited
            assert response.status_code != 429

        # 4th request should be rate limited
        response = client.post(
            f"{gateway_url}/auth/login",
            headers=headers,
            json={"username": "test", "password": "test"}
        )
        # Should be rate limited OR auth failed (but not both on 4th)
        # After burst, next request should hit rate limit
        time.sleep(1)  # Wait a bit
        response = client.post(
            f"{gateway_url}/auth/login",
            headers=headers,
            json={"username": "test", "password": "test"}
        )
        # This one might still succeed, so make more requests
        for i in range(5):
            response = client.post(
                f"{gateway_url}/auth/login",
                headers=headers,
                json={"username": "test", "password": "test"}
            )

        # Eventually we'll hit the rate limit
        assert response.status_code == 429
        data = response.json()
        assert "Rate Limit Exceeded" in data["error"]
        assert data["endpoint"] == "/auth/login"

    def test_honeypot_aggressive_rate_limit(self, client, gateway_url):
        """Test aggressive rate limit on honeypot endpoints (5 req/min)"""
        headers = {"User-Agent": "Mozilla/5.0"}

        # Hit honeypot endpoint multiple times
        for i in range(6):
            response = client.get(
                f"{gateway_url}/admin",
                headers=headers
            )

        # Should be rate limited
        assert response.status_code == 429
        data = response.json()
        assert "Rate Limit Exceeded" in data["error"]


class TestWAFStats:
    """Test WAF statistics endpoint"""

    def test_waf_stats_endpoint(self, client, gateway_url):
        """Test WAF stats endpoint returns configuration"""
        response = client.get(
            f"{gateway_url}/api/defense/waf-stats",
            headers={"User-Agent": "Mozilla/5.0"}
        )
        assert response.status_code == 200
        data = response.json()

        # Check signature database stats
        assert "signature_database" in data
        assert data["signature_database"]["total"] > 0
        assert "sql_injection" in data["signature_database"]
        assert "xss" in data["signature_database"]

        # Check features
        assert "features" in data
        assert data["features"]["signature_detection"] is True
        assert data["features"]["user_agent_filtering"] is True
        assert data["features"]["bot_detection"] is True

        # Check endpoint limits
        assert "endpoint_limits" in data
        assert len(data["endpoint_limits"]) > 0

        # Verify version
        assert data["version"] == "2.5A"


@pytest.mark.slow
class TestWAFMetrics:
    """Test WAF Prometheus metrics"""

    def test_waf_metrics_exposed(self, client, gateway_url):
        """Test WAF metrics are exposed in Prometheus format"""
        # Generate some WAF blocks first
        client.get(
            f"{gateway_url}/",
            params={"test": "union select"},
            headers={"User-Agent": "Mozilla/5.0"}
        )

        # Check metrics endpoint
        response = client.get(f"{gateway_url}/metrics")
        assert response.status_code == 200
        metrics_text = response.text

        # Check for WAF metrics
        assert "gateway_waf_blocks_total" in metrics_text
        assert "gateway_waf_suspicious_patterns" in metrics_text


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
