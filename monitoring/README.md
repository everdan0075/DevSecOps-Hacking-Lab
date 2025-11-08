# Monitoring & Observability

This directory will contain monitoring and observability configurations.

## Planned Stack

### Metrics
- **Prometheus**: Time-series metrics collection (local service available)
- **Grafana**: Visualization and dashboards
- **Node Exporter**: System metrics (planned)
- **Custom exporters**: Application-specific metrics

### Logging
- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Structured logging**: JSON format
- **Log aggregation**: Centralized logging

### Tracing
- **Jaeger**: Distributed tracing
- **OpenTelemetry**: Instrumentation

### Alerting
- **AlertManager**: Alert routing and deduplication
- **PagerDuty integration**: Incident management

## Metrics to Monitor

### Security Metrics
- Failed login attempts per IP
- Rate limiting triggers
- Banned IPs count
- Attack patterns detected
- Response time anomalies

### Performance Metrics
- Request rate (requests/sec)
- Response times (p50, p95, p99)
- Error rates
- CPU/Memory usage
- Container health

### Business Metrics
- Total attacks simulated
- Defense effectiveness rate
- Most common attack patterns
- Geographic attack distribution (if applicable)

## Coming Soon

Phase 3 of the roadmap will include:
- Prometheus configuration
- Grafana dashboards
- Pre-configured alerts
- Attack visualization
- Real-time monitoring

## Current State

**Status**: 🚧 Phase 2 in progress

Currently available instrumentation:
- FastAPI `/metrics` endpoint exposed via Prometheus client
- Prometheus service scraping `login-api` every 15 seconds
- Counters for login successes, failures, IP bans, and rate limiting blocks
- Docker container logs: `docker-compose logs`
- Structured JSON logs: `vulnerable-services/login-api/logs/`

### Running Prometheus, Grafana & Alertmanager

```bash
# Start login-api, Prometheus, Grafana, Alertmanager, receiver
docker-compose up -d login-api prometheus grafana alertmanager alert-receiver

# Confirm Prometheus is healthy
docker-compose ps

# Open Prometheus UI
open http://localhost:9090   # Windows: start http://localhost:9090

# Open Grafana UI
open http://localhost:3000   # Windows: start http://localhost:3000

# Open Alertmanager UI
open http://localhost:9093   # Windows: start http://localhost:9093
```

Default Grafana credentials: `admin` / `admin`

Grafana provisioning:
- Datasource: `monitoring/grafana/provisioning/datasources/datasource.yml`
- Dashboards: `monitoring/grafana/dashboards/`
- Dashboard title: **DevSecOps Attack Visibility**

Alerting configuration:
- Rule file: `monitoring/prometheus/alert_rules.yml`
- Alertmanager config: `monitoring/alertmanager/alertmanager.yml`
- Webhook receiver service: http://localhost:5001 (FastAPI)
- Alert thresholds:
  - `LoginFailureSpike`: `increase(login_failed_total[2m]) > 5`
  - `RateLimiterBlocking`: `increase(rate_limit_blocks_total[2m]) > 3`

Key panels:
- Login Attempts (success vs failure)
- Rate limiter blocks
- IP bans and failed attempts
- Latency and scrape success

### Demo flow

```bash
# Start stack
docker-compose up -d login-api prometheus grafana alertmanager alert-receiver

# Run attack to generate data
python attacks/brute-force/brute_force.py --target http://localhost:8000/login --username admin

# Open Grafana dashboard (DevSecOps / DevSecOps Attack Visibility)
open http://localhost:3000/d/devsecops/attack-visibility

# Inspect alerts
open http://localhost:9090/alerts
open http://localhost:9093/#/alerts

# View webhook payloads captured by alert receiver
curl http://localhost:5001/alerts | python -m json.tool

# Optional: clear stored alerts
curl -X DELETE http://localhost:5001/alerts
```

### Automated Smoke Test

The repository includes an automated smoke test that validates metrics and alert delivery:

```bash
# Install dependencies (once)
pip install -r monitoring/tests/requirements.txt

# Ensure services are running
docker-compose up -d login-api prometheus grafana alertmanager alert-receiver

# Run the smoke test
python monitoring/tests/monitoring_smoke_test.py
```

The script will:
1. Confirm service readiness
2. Generate failed login attempts
3. Wait for Prometheus to scrape new samples (≈20s)
4. Wait for alerts to reach the firing state
5. Poll the webhook receiver until alert payloads are stored
6. Expose captured payloads via `GET /alerts`

Prometheus configuration lives in `monitoring/prometheus/prometheus.yml`. The default scrape targets:
- `login-api:8000/metrics`
- `prometheus:9090` (self-monitoring)

### Quick Checks

```bash
# Verify metrics endpoint
curl http://localhost:8000/metrics | Select-Object -First 20

# Query Prometheus via HTTP API
curl "http://localhost:9090/api/v1/query?query=login_attempts_total"

# Check active alerts
curl "http://localhost:9090/api/v1/alerts" | python -m json.tool
```

Stay tuned for full observability stack!




