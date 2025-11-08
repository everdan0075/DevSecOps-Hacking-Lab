# Monitoring Stack Guide

This document explains how to operate, validate, and extend the observability stack that powers **DevSecOps Hacking Lab**.

## Contents

1. [Architecture Overview](#architecture-overview)  
2. [Services & Ports](#services--ports)  
3. [Quick Start](#quick-start)  
4. [Grafana Dashboards](#grafana-dashboards)  
5. [Alerting Pipeline](#alerting-pipeline)  
6. [Automated Smoke Test](#automated-smoke-test)  
7. [CI/CD Integration](#cicd-integration)  
8. [Troubleshooting](#troubleshooting)  
9. [Extending the Stack](#extending-the-stack)

---

## Architecture Overview

```
┌──────────────┐      ┌───────────────┐      ┌──────────────┐
│  login-api   │ ───▶ │  Prometheus   │ ───▶ │  Alertmanager │
│ (FastAPI)    │      │ (scrapes 15s) │      │  (routing)    │
└─────▲────────┘      └──────┬────────┘      └──────┬────────┘
      │                       │                        │
      │ metrics (/metrics)    │ scrapes                │ webhooks
      │                       ▼                        ▼
      │                ┌──────────────┐         ┌──────────────┐
      │                │   Grafana    │         │ Alert Receiver│
      │                │ (dashboards) │         │ (FastAPI)     │
      │                └──────────────┘         └──────────────┘
```

Observability data flows from the vulnerable service to Prometheus, which feeds Grafana dashboards and Alertmanager. Alerts are delivered to a local webhook receiver that stores payloads for inspection.

---

## Services & Ports

| Service           | Purpose                                      | Port | Docker Compose Service |
|-------------------|----------------------------------------------|------|------------------------|
| `login-api`       | Vulnerable FastAPI service with metrics      | 8000 | `login-api`            |
| `prometheus`      | Metrics scraper & query engine               | 9090 | `prometheus`           |
| `grafana`         | Visualization (pre-provisioned dashboards)   | 3000 | `grafana`              |
| `alertmanager`    | Alert routing, grouping, inhibition          | 9093 | `alertmanager`         |
| `alert-receiver`  | FastAPI webhook receiver for alerts          | 5001 | `alert-receiver`       |

All components run on the Docker network `devsecops-lab`.

---

## Quick Start

```bash
# Start the full observability stack
docker-compose up -d login-api prometheus grafana alertmanager alert-receiver

# Verify container health
docker-compose ps

# Open web UIs
start http://localhost:9090        # Prometheus
start http://localhost:3000        # Grafana (admin / admin)
start http://localhost:9093        # Alertmanager
start http://localhost:5001/alerts # Webhook payloads (JSON)
```

To generate activity, run the brute-force attack:

```bash
python attacks/brute-force/brute_force.py \
  --target http://localhost:8000/login \
  --username admin
```

---

## Grafana Dashboards

Provisioned automatically from `monitoring/grafana/dashboards/`.

- **DevSecOps Attack Visibility** (`uid: attack-visibility`)  
  - Login attempts (success vs failure)  
  - Rate limiter activity  
  - IP bans & failed attempts (5m)  
  - Prometheus scrape success (availability)  
  - API latency (P90)

Dashboards are updated on container start. Feel free to customize and export JSON back into the repo.

---

## Alerting Pipeline

Prometheus rule file: `monitoring/prometheus/alert_rules.yml`

| Alert Name            | Trigger                                                  | Severity | Notes                          |
|-----------------------|----------------------------------------------------------|----------|--------------------------------|
| `LoginFailureSpike`   | `increase(login_failed_total[5m]) > 5` for 30s           | warning  | Detects unusual failed logins |
| `RateLimiterBlocking` | `increase(rate_limit_blocks_total[5m]) > 3` for 30s      | critical | Highlights defense activation |
| `LoginAPIDown`        | Target `up == 0` for 1m                                  | critical | Availability monitoring       |

Alertmanager configuration: `monitoring/alertmanager/alertmanager.yml`

- Alerts are routed to a single receiver `default`.
- Webhook endpoint: `http://alert-receiver:5001/alerts`
- Both firing and resolved alerts are sent (`send_resolved: true`).
- Critical alerts inhibit warnings with the same service/alertname.

Webhook receiver (`monitoring/alert-receiver/`):

- `GET /health` – readiness for healthchecks  
- `POST /alerts` – stores payload in memory  
- `GET /alerts` – returns JSON `{count, alerts}`  
- `DELETE /alerts` – clears stored payloads (useful in tests)

---

## Automated Smoke Test

Script: `monitoring/tests/monitoring_smoke_test.py`

What it does:
1. Waits for all services to report healthy status.
2. Clears previous webhook payloads.
3. Performs a warm-up + burst of failed login attempts (300 requests).
4. Waits for Prometheus scrapes and checks metric deltas.
5. Confirms both alerts are firing.
6. Polls `/alerts` until a webhook message is stored.

Run locally:

```bash
pip install -r monitoring/tests/requirements.txt
python monitoring/tests/monitoring_smoke_test.py
curl http://localhost:5001/alerts | python -m json.tool
```

Expected output includes `[success] Monitoring smoke test completed successfully` and a JSON array of alert payloads.

---

## CI/CD Integration

GitHub Actions workflow `.github/workflows/ci.yml` includes `monitoring-tests` job:

1. Lints Prometheus configuration via `promtool`.
2. Spins up the stack (`docker-compose up`).
3. Runs the smoke test.
4. Uploads `alert-receiver.json` artifact (captured payloads).
5. Always tears down containers.

This ensures regressions in instrumentation or alerting are detected before merging.

---

## Troubleshooting

| Symptom | Diagnosis | Remedy |
|---------|-----------|--------|
| `/metrics` returns 404 | Instrumentator not initialized | Ensure `instrumentator.instrument(app)` is called before startup |
| Prometheus target down | Container not healthy | Check `docker-compose ps` and `docker-compose logs login-api` |
| Alerts not firing | Insufficient traffic | Run smoke test or adjust thresholds in `alert_rules.yml` |
| Webhook empty | Alertmanager not sending | Inspect `alertmanager` logs; ensure network connectivity to `alert-receiver:5001` |
| Grafana shows “No data” | Await new Prometheus scrape | Wait ~15s or confirm metrics via Prometheus UI |
| Smoke test fails on metrics | Prometheus cache stale | Trigger reload `curl -X POST http://localhost:9090/-/reload` |

---

## Extending the Stack

- **Additional Metrics:** Instrument new services and add scrape configs in `monitoring/prometheus/prometheus.yml`.
- **Extra Dashboards:** Export JSON from Grafana and place into `monitoring/grafana/dashboards/`.
- **Alert Destinations:** Add Slack, email, or PagerDuty receivers in `monitoring/alertmanager/alertmanager.yml`.
- **Persistent Storage:** Mount volumes for long-term Prometheus/Grafana data (already configured as named volumes).
- **Scaling:** Move to Kubernetes or ECS by reusing the same configuration files as templates.

For more ideas, see the project roadmap in the main `README.md`.

