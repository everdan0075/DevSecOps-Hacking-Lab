# Monitoring & Observability

This directory will contain monitoring and observability configurations.

## Planned Stack

### Metrics
- **Prometheus**: Time-series metrics collection
- **Grafana**: Visualization and dashboards
- **Node Exporter**: System metrics
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

**Status**: 📋 Planned for Phase 3

Currently, basic logging is available in:
- Docker container logs: `docker-compose logs`
- Application JSON logs: `vulnerable-services/login-api/logs/`

Stay tuned for full observability stack!




