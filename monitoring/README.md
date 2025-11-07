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

### Running Prometheus

```bash
# Start login-api and Prometheus
docker-compose up -d login-api prometheus

# Confirm Prometheus is healthy
docker-compose ps

# Open Prometheus UI
open http://localhost:9090   # Windows: start http://localhost:9090
```

Prometheus configuration lives in `monitoring/prometheus/prometheus.yml`. The default scrape targets:
- `login-api:8000/metrics`
- `prometheus:9090` (self-monitoring)

### Quick Checks

```bash
# Verify metrics endpoint
curl http://localhost:8000/metrics | Select-Object -First 20

# Query Prometheus via HTTP API
curl "http://localhost:9090/api/v1/query?query=login_attempts_total"
```

Stay tuned for full observability stack!




