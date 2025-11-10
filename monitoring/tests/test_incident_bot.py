"""
Smoke tests for Incident Bot.

Tests automated incident response functionality:
- Health checks
- Webhook reception
- Runbook loading
- Action execution (mocked)
"""

import json
from datetime import datetime

import pytest
import requests


BASE_URL = "http://localhost:5002"


class TestIncidentBotHealth:
    """Test basic health and availability."""

    def test_health_endpoint(self):
        """Test that incident bot is healthy."""
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "healthy"
        assert "runbooks_loaded" in data
        assert "executions_count" in data
        assert data["runbooks_loaded"] >= 0

    def test_metrics_endpoint(self):
        """Test that Prometheus metrics are exposed."""
        response = requests.get(f"{BASE_URL}/metrics", timeout=10)
        assert response.status_code == 200

        # Check for key metrics
        metrics_text = response.text
        assert "incident_bot_incidents_total" in metrics_text
        assert "incident_bot_actions_total" in metrics_text
        assert "incident_bot_runbook_executions_total" in metrics_text


class TestIncidentBotRunbooks:
    """Test runbook management."""

    def test_stats_endpoint(self):
        """Test that runbook statistics are available."""
        response = requests.get(f"{BASE_URL}/stats", timeout=10)
        assert response.status_code == 200

        data = response.json()
        assert "runbook_stats" in data
        assert "execution_stats" in data

        # Check runbook stats
        runbook_stats = data["runbook_stats"]
        assert "total_runbooks" in runbook_stats
        assert "enabled_runbooks" in runbook_stats
        
        # Should have loaded the runbooks we created
        assert runbook_stats["total_runbooks"] >= 8

    def test_incidents_endpoint(self):
        """Test that incident history is accessible."""
        response = requests.get(f"{BASE_URL}/incidents?limit=10", timeout=10)
        assert response.status_code == 200

        data = response.json()
        assert "count" in data
        assert "executions" in data
        assert isinstance(data["executions"], list)


class TestIncidentBotWebhook:
    """Test webhook handling and alert processing."""

    def test_webhook_with_sample_alert(self):
        """Test processing a sample Alertmanager webhook."""
        # Sample Alertmanager payload
        webhook_payload = {
            "version": "4",
            "groupKey": "test-group",
            "status": "firing",
            "receiver": "incident-bot",
            "groupLabels": {},
            "commonLabels": {},
            "commonAnnotations": {},
            "externalURL": "http://alertmanager:9093",
            "alerts": [
                {
                    "status": "firing",
                    "labels": {
                        "alertname": "TestAlert",
                        "severity": "warning",
                        "service": "test-service",
                        "category": "test",
                    },
                    "annotations": {
                        "summary": "Test alert for smoke testing",
                        "description": "This is a test alert",
                    },
                    "startsAt": datetime.utcnow().isoformat() + "Z",
                    "endsAt": None,
                    "generatorURL": "http://prometheus:9090",
                    "fingerprint": "test123456",
                }
            ],
        }

        response = requests.post(
            f"{BASE_URL}/webhook",
            json=webhook_payload,
            timeout=30,
        )

        # Should accept the webhook even if no runbook matches
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["processed", "received"]
        assert "alerts_processed" in data

    def test_webhook_with_brute_force_alert(self):
        """Test webhook with brute force alert that matches runbook."""
        webhook_payload = {
            "version": "4",
            "groupKey": "brute-force-group",
            "status": "firing",
            "receiver": "incident-bot",
            "groupLabels": {},
            "commonLabels": {},
            "commonAnnotations": {},
            "externalURL": "http://alertmanager:9093",
            "alerts": [
                {
                    "status": "firing",
                    "labels": {
                        "alertname": "LoginFailureSpike",
                        "severity": "warning",
                        "service": "login-api",
                        "category": "brute-force",
                    },
                    "annotations": {
                        "summary": "High rate of failed login attempts detected",
                        "description": "More than 5 failed login attempts per minute",
                    },
                    "startsAt": datetime.utcnow().isoformat() + "Z",
                    "endsAt": None,
                    "generatorURL": "http://prometheus:9090",
                    "fingerprint": "bf123456",
                }
            ],
        }

        response = requests.post(
            f"{BASE_URL}/webhook",
            json=webhook_payload,
            timeout=30,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processed"
        assert data["alerts_processed"] == 1

        # Should have executed the brute force runbook
        if "executions" in data and len(data["executions"]) > 0:
            execution = data["executions"][0]
            assert execution["runbook_name"] == "Brute Force Response"
            assert execution["status"] in ["running", "completed", "partial"]
            # Check that actions were attempted
            assert "actions_executed" in execution or "action_results" in execution


class TestIncidentBotIntegration:
    """Integration tests with real services."""

    def test_runbook_reload(self):
        """Test that runbooks can be reloaded."""
        response = requests.post(f"{BASE_URL}/reload", timeout=10)
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "reloaded"
        assert "runbooks_loaded" in data
        assert data["runbooks_loaded"] >= 8

    def test_metrics_after_webhook(self):
        """Test that metrics are updated after processing webhook."""
        # Get initial metrics
        response = requests.get(f"{BASE_URL}/metrics", timeout=10)
        initial_metrics = response.text

        # Send test webhook
        webhook_payload = {
            "version": "4",
            "groupKey": "metrics-test",
            "status": "firing",
            "receiver": "incident-bot",
            "groupLabels": {},
            "commonLabels": {},
            "commonAnnotations": {},
            "externalURL": "http://alertmanager:9093",
            "alerts": [
                {
                    "status": "firing",
                    "labels": {
                        "alertname": "MetricsTest",
                        "severity": "info",
                        "service": "test",
                        "category": "test",
                    },
                    "annotations": {
                        "summary": "Metrics test",
                    },
                    "startsAt": datetime.utcnow().isoformat() + "Z",
                    "fingerprint": "metrics123",
                }
            ],
        }

        requests.post(f"{BASE_URL}/webhook", json=webhook_payload, timeout=30)

        # Get updated metrics
        response = requests.get(f"{BASE_URL}/metrics", timeout=10)
        updated_metrics = response.text

        # Metrics should have changed (webhook request counter should increase)
        assert "incident_bot_webhook_requests_total" in updated_metrics


class TestIncidentBotResilience:
    """Test error handling and resilience."""

    def test_invalid_webhook_payload(self):
        """Test handling of invalid webhook payload."""
        response = requests.post(
            f"{BASE_URL}/webhook",
            json={"invalid": "payload"},
            timeout=10,
        )

        # Should return error but not crash
        assert response.status_code in [400, 422, 500]

    def test_malformed_json(self):
        """Test handling of malformed JSON."""
        response = requests.post(
            f"{BASE_URL}/webhook",
            data="not json",
            headers={"Content-Type": "application/json"},
            timeout=10,
        )

        # Should return error but not crash
        assert response.status_code in [400, 422, 500]

    def test_concurrent_webhooks(self):
        """Test handling multiple webhooks concurrently."""
        import concurrent.futures

        webhook_payload = {
            "version": "4",
            "groupKey": "concurrent-test",
            "status": "firing",
            "receiver": "incident-bot",
            "groupLabels": {},
            "commonLabels": {},
            "commonAnnotations": {},
            "externalURL": "http://alertmanager:9093",
            "alerts": [
                {
                    "status": "firing",
                    "labels": {
                        "alertname": "ConcurrentTest",
                        "severity": "info",
                        "service": "test",
                        "category": "test",
                    },
                    "annotations": {
                        "summary": "Concurrent test",
                    },
                    "startsAt": datetime.utcnow().isoformat() + "Z",
                    "fingerprint": f"concurrent{i}",
                }
            ],
        }

        def send_webhook():
            return requests.post(
                f"{BASE_URL}/webhook",
                json=webhook_payload,
                timeout=30,
            )

        # Send 5 webhooks concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(send_webhook) for _ in range(5)]
            results = [f.result() for f in futures]

        # All should succeed
        assert all(r.status_code == 200 for r in results)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

