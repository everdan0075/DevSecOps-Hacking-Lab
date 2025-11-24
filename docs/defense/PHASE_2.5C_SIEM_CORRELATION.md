# Phase 2.5C: Enhanced SIEM-like Correlation & Threat Scoring

**Status**: ✅ COMPLETE
**Date**: 2025-11-24
**Category**: Defense Enhancement
**Dependencies**: Phase 2.5A (Enhanced WAF), Phase 2.5B (IDS Integration), Phase 2.3 (Incident Response)

## Overview

Phase 2.5C transforms the Incident Bot into a Security Information and Event Management (SIEM) system with advanced threat intelligence capabilities. This enhancement adds quantitative threat scoring, risk assessment, and comprehensive security dashboards.

### Key Features

1. **Threat Scoring Engine**: 0-100 quantitative threat scoring for IPs and attack patterns
2. **Risk Assessment**: Environment-wide security posture calculation
3. **SIEM Dashboard API**: Comprehensive security monitoring endpoints
4. **Threat Intelligence**: Actionable recommendations based on threat level
5. **Multi-Factor Analysis**: Scoring based on frequency, diversity, severity, and attack risk

## Threat Scoring System

### Scoring Methodology

The threat scoring engine calculates a **0-100 score** for each IP address or attack pattern based on weighted factors:

#### IP-Based Threat Scoring (4 Factors, Total 100 Points)

| Factor | Weight | Description |
|--------|--------|-------------|
| **Frequency** | 0-25 pts | Attack volume (2 pts per event, capped at 25) |
| **Diversity** | 0-20 pts | Unique attack types (5 pts per type) |
| **Severity** | 0-30 pts | Average severity of attacks (normalized from SEVERITY_WEIGHTS) |
| **Attack Risk** | 0-25 pts | OWASP risk level (normalized from ATTACK_TYPE_WEIGHTS) |

**Total Score** = Frequency + Diversity + Severity + Attack Risk

#### Threat Levels

| Score Range | Level | Description | Recommended Action |
|-------------|-------|-------------|--------------------|
| 75-100 | **Critical** | Immediate threat | Ban IP, enable enhanced monitoring, review for exploitation |
| 50-74 | **High** | Significant risk | Ban IP, review attack patterns, check for data exfiltration |
| 25-49 | **Medium** | Suspicious activity | Add to watchlist, enable rate limiting, monitor for escalation |
| 0-24 | **Low** | Minor activity | Continue monitoring |

### Severity Weights

```python
SEVERITY_WEIGHTS = {
    "low": 10,
    "medium": 25,
    "high": 50,
    "critical": 75
}
```

### Attack Type Weights (OWASP-Based)

```python
ATTACK_TYPE_WEIGHTS = {
    "sql_injection": 20,
    "xss_attack": 15,
    "command_injection": 25,
    "path_traversal": 15,
    "brute_force": 10,
    "scanner_detection": 8,
    "honeypot_access": 12,
    "gateway_bypass": 18,
    "idor_exploitation": 15,
    "rate_limit_bypass": 10,
    "unknown": 5
}
```

### Pattern-Based Threat Scoring (4 Factors, Total 100 Points)

| Factor | Weight | Description |
|--------|--------|-------------|
| **Pattern Type** | 0-35 pts | Intrinsic risk of pattern (APT=35, multi-stage=30, distributed=25) |
| **Confidence** | 0-25 pts | Pattern detection confidence (0.0-1.0 normalized) |
| **IP Count** | 0-20 pts | Number of involved IPs (5 pts per IP, max 20) |
| **Event Count** | 0-20 pts | Number of events in pattern (2 pts per event, max 20) |

#### Pattern Type Weights

```python
PATTERN_WEIGHTS = {
    "reconnaissance": 15,
    "multi_stage_attack": 30,
    "distributed_attack": 25,
    "credential_stuffing": 20,
    "apt_indicator": 35
}
```

## Risk Assessment System

### Environment-Wide Risk Calculation (100 Points)

| Factor | Weight | Calculation |
|--------|--------|-------------|
| **Event Volume** | 0-30 pts | `min(30, total_events / 10)` |
| **Pattern Complexity** | 0-25 pts | `min(25, total_patterns * 5)` |
| **Critical IPs** | 0-25 pts | `min(25, critical_ips * 10)` |
| **Severity Distribution** | 0-20 pts | `min(20, high_severity_events / 5)` |

**Total Risk Score** = Event Volume + Pattern Complexity + Critical IPs + Severity

### Risk Levels

| Score Range | Level | Status |
|-------------|-------|--------|
| 75-100 | **Critical** | Under active attack |
| 50-74 | **High** | Multiple threats detected |
| 25-49 | **Medium** | Suspicious activity present |
| 0-24 | **Low** | Normal security posture |

## SIEM Dashboard API

### Endpoint 1: Threat Scores

**GET** `/api/siem/threat-scores`

Get quantitative threat scores for all active IP addresses.

**Query Parameters:**
- `min_score` (float, default: 0.0) - Filter by minimum threat score
- `time_window_minutes` (int, default: 60) - Time window for activity analysis
- `limit` (int, default: 50) - Maximum number of results

**Response:**
```json
{
  "threat_scores": [
    {
      "ip_address": "192.168.1.100",
      "threat_score": 87.5,
      "threat_level": "critical",
      "confidence": 0.95,
      "factors": {
        "frequency": 25.0,
        "diversity": 20.0,
        "severity": 27.5,
        "attack_risk": 15.0
      },
      "recommendation": "IMMEDIATE ACTION: 15 attacks detected with 4 different types. Ban IP immediately, enable enhanced monitoring, review logs for successful exploitation.",
      "event_count": 15,
      "attack_types": ["sql_injection", "xss_attack", "brute_force", "idor_exploitation"],
      "first_seen": "2025-11-24T00:00:00Z",
      "last_seen": "2025-11-24T00:15:00Z"
    }
  ],
  "count": 1,
  "time_window_minutes": 60,
  "timestamp": "2025-11-24T00:15:30Z"
}
```

### Endpoint 2: Pattern Scores

**GET** `/api/siem/pattern-scores`

Get threat scores for detected attack patterns.

**Query Parameters:**
- `min_score` (float, default: 0.0) - Filter by minimum threat score
- `min_confidence` (float, default: 0.5) - Filter by minimum pattern confidence

**Response:**
```json
{
  "pattern_scores": [
    {
      "pattern_id": "pattern_001",
      "pattern_type": "multi_stage_attack",
      "threat_score": 82.0,
      "threat_level": "critical",
      "confidence": 0.87,
      "factors": {
        "pattern_type": 30.0,
        "confidence": 21.75,
        "ip_count": 15.0,
        "event_count": 15.25
      },
      "recommendation": "MULTI-STAGE ATTACK: 3 IPs executing coordinated attack chain. Ban all involved IPs, review for successful exploitation, check for persistence mechanisms.",
      "attacker_ips": ["192.168.1.100", "192.168.1.101", "192.168.1.102"],
      "event_count": 8,
      "first_event": "2025-11-24T00:00:00Z",
      "last_event": "2025-11-24T00:15:00Z"
    }
  ],
  "count": 1,
  "timestamp": "2025-11-24T00:15:30Z"
}
```

### Endpoint 3: Risk Assessment

**GET** `/api/siem/risk-assessment`

Get overall risk assessment for the environment.

**Query Parameters:**
- `time_window_hours` (int, default: 24) - Time window for assessment

**Response:**
```json
{
  "risk_score": 67.5,
  "risk_level": "high",
  "status": "Multiple threats detected",
  "factors": {
    "event_volume": 22.5,
    "pattern_complexity": 15.0,
    "critical_ips": 20.0,
    "severity": 10.0
  },
  "time_window_hours": 24,
  "metrics": {
    "total_events": 225,
    "total_patterns": 3,
    "critical_ips": 2,
    "high_severity_events": 50
  },
  "timestamp": "2025-11-24T00:15:30Z"
}
```

### Endpoint 4: SIEM Dashboard

**GET** `/api/siem/dashboard`

Get comprehensive SIEM dashboard with all security metrics.

**Response:**
```json
{
  "timestamp": "2025-11-24T00:15:30Z",
  "risk_assessment": {
    "risk_score": 67.5,
    "risk_level": "high",
    "status": "Multiple threats detected",
    "factors": {...},
    "time_window_hours": 24,
    "metrics": {...}
  },
  "top_threats": [
    {
      "ip_address": "192.168.1.100",
      "threat_score": 87.5,
      "threat_level": "critical",
      "event_count": 15,
      "attack_types": ["sql_injection", "xss_attack"]
    }
  ],
  "attack_summary": {
    "total_events_24h": 225,
    "high_severity_events": 50,
    "unique_attackers": 12,
    "critical_ips": 2,
    "patterns_detected": 3
  },
  "top_attack_types": [
    {"attack_type": "sql_injection", "count": 85},
    {"attack_type": "brute_force", "count": 42},
    {"attack_type": "xss_attack", "count": 38}
  ],
  "pattern_summary": {
    "total": 3,
    "by_type": {
      "multi_stage_attack": 1,
      "distributed_attack": 1,
      "credential_stuffing": 1
    },
    "by_severity": {
      "low": 0,
      "medium": 1,
      "high": 1,
      "critical": 1
    }
  },
  "attack_timeline": {
    "2025-11-24T00:00:00Z": 12,
    "2025-11-24T01:00:00Z": 18,
    "2025-11-24T02:00:00Z": 25
  },
  "defense_effectiveness": {
    "automated_responses": 5,
    "response_success_rate": 1.0,
    "avg_response_time": 2.5
  }
}
```

## Implementation Details

### File Structure

```
monitoring/incident-bot/
├── app/
│   ├── main.py                 # Added 4 SIEM endpoints
│   ├── threat_scoring.py       # NEW: Threat scoring engine
│   ├── correlation.py          # Existing correlation engine
│   └── metrics.py              # Incident bot metrics
```

### New Component: ThreatScoringEngine

**File**: `monitoring/incident-bot/app/threat_scoring.py` (348 lines)

```python
from typing import List, Dict, Set
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
from .correlation import AttackEvent, AttackPattern

@dataclass
class ThreatScore:
    """Represents a calculated threat score"""
    score: float          # 0-100
    level: str           # low, medium, high, critical
    factors: Dict[str, float]  # Breakdown of score components
    confidence: float    # 0.0-1.0
    recommendation: str  # Actionable security recommendation

class ThreatScoringEngine:
    """Calculates threat scores for attack events and patterns"""

    def score_ip_activity(
        self,
        ip: str,
        events: List[AttackEvent],
        time_window_minutes: int = 60
    ) -> ThreatScore:
        """Calculate threat score for specific IP address"""
        # Factor 1: Frequency (0-25 points)
        # Factor 2: Diversity (0-20 points)
        # Factor 3: Severity (0-30 points)
        # Factor 4: Attack Risk (0-25 points)
        # ...

    def score_pattern(self, pattern: AttackPattern) -> ThreatScore:
        """Calculate threat score for attack pattern"""
        # Factor 1: Pattern type weight (0-35 points)
        # Factor 2: Pattern confidence (0-25 points)
        # Factor 3: IP count (0-20 points)
        # Factor 4: Event count (0-20 points)
        # ...

    def calculate_risk_assessment(
        self,
        total_events: int,
        total_patterns: int,
        critical_ips: int,
        high_severity_events: int,
        time_window_hours: int = 24
    ) -> Dict[str, any]:
        """Calculate overall risk assessment for environment"""
        # ...
```

### Enhanced Endpoints in main.py

```python
from .threat_scoring import ThreatScoringEngine, ThreatScore
from datetime import timedelta, timezone

@app.get("/api/siem/threat-scores")
async def get_threat_scores(
    min_score: float = 0.0,
    time_window_minutes: int = 60,
    limit: int = 50
) -> JSONResponse:
    """Get threat scores for all active IPs"""
    scoring_engine = ThreatScoringEngine()
    threat_scores = []

    for ip, events in correlation_engine.ip_activity.items():
        score = scoring_engine.score_ip_activity(ip, events, time_window_minutes)

        if score.score >= min_score:
            # Filter events in time window
            cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=time_window_minutes)
            recent_events = [e for e in events if e.timestamp >= cutoff_time]

            if recent_events:
                threat_scores.append({
                    "ip_address": ip,
                    "threat_score": round(score.score, 2),
                    "threat_level": score.level,
                    "confidence": round(score.confidence, 2),
                    "factors": {k: round(v, 2) for k, v in score.factors.items()},
                    "recommendation": score.recommendation,
                    "event_count": len(recent_events),
                    "attack_types": list(set(e.attack_type for e in recent_events)),
                    "first_seen": min(e.timestamp for e in recent_events).isoformat(),
                    "last_seen": max(e.timestamp for e in recent_events).isoformat()
                })

    threat_scores.sort(key=lambda x: x["threat_score"], reverse=True)
    return JSONResponse({
        "threat_scores": threat_scores[:limit],
        "count": len(threat_scores),
        "time_window_minutes": time_window_minutes,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.get("/api/siem/pattern-scores")
async def get_pattern_scores(
    min_score: float = 0.0,
    min_confidence: float = 0.5
) -> JSONResponse:
    """Get threat scores for detected patterns"""
    # ...

@app.get("/api/siem/risk-assessment")
async def get_risk_assessment(time_window_hours: int = 24) -> JSONResponse:
    """Get overall risk assessment"""
    # ...

@app.get("/api/siem/dashboard")
async def get_siem_dashboard() -> JSONResponse:
    """Get comprehensive SIEM dashboard"""
    # ...
```

## Usage Examples

### Query Threat Scores

```bash
# Get all threat scores above 50 (high priority)
curl "http://localhost:5002/api/siem/threat-scores?min_score=50&limit=20" | jq

# Get recent threats (last 30 minutes)
curl "http://localhost:5002/api/siem/threat-scores?time_window_minutes=30" | jq
```

### Query Pattern Scores

```bash
# Get high-confidence patterns
curl "http://localhost:5002/api/siem/pattern-scores?min_confidence=0.7" | jq

# Get critical patterns
curl "http://localhost:5002/api/siem/pattern-scores?min_score=75" | jq
```

### Get Risk Assessment

```bash
# Get 24-hour risk assessment
curl "http://localhost:5002/api/siem/risk-assessment" | jq

# Get 1-hour risk assessment
curl "http://localhost:5002/api/siem/risk-assessment?time_window_hours=1" | jq
```

### Get SIEM Dashboard

```bash
# Get comprehensive dashboard
curl "http://localhost:5002/api/siem/dashboard" | jq

# Extract specific sections
curl "http://localhost:5002/api/siem/dashboard" | jq '.risk_assessment'
curl "http://localhost:5002/api/siem/dashboard" | jq '.top_threats[0:5]'
curl "http://localhost:5002/api/siem/dashboard" | jq '.attack_timeline'
```

## Integration with Existing Systems

### Correlation Engine Integration

The threat scoring engine consumes data from the existing correlation engine:

```python
# Correlation engine maintains:
correlation_engine.ip_activity       # Dict[str, List[AttackEvent]]
correlation_engine.get_patterns()    # List[AttackPattern]

# Threat scoring queries this data:
for ip, events in correlation_engine.ip_activity.items():
    score = scoring_engine.score_ip_activity(ip, events)
```

### Multi-Source Attack Detection

Threat scores incorporate events from all sources:
- **WAF**: Application-layer attacks (SQL injection, XSS, path traversal)
- **IDS**: Network-layer attacks (port scans, protocol anomalies)
- **Honeypot**: Unauthorized access attempts
- **Auth Service**: Brute force, MFA bypass attempts
- **Gateway**: Rate limiting violations, bypass attempts

### Incident Response Runbooks

Threat scores can trigger automated runbooks based on severity:

```python
if threat_score.level == "critical" and threat_score.score >= 85:
    # Trigger immediate ban + investigation runbook
    execute_runbook("critical-threat-response.json", ip_address=ip)
elif threat_score.level == "high":
    # Trigger monitoring + rate limiting runbook
    execute_runbook("high-threat-response.json", ip_address=ip)
```

## Confidence Calculation

Confidence represents how certain we are about the threat score:

### IP Confidence
```python
confidence = min(1.0, event_count / 20)  # Full confidence at 20+ events
```

- 1 event: 5% confidence
- 5 events: 25% confidence
- 10 events: 50% confidence
- 20+ events: 100% confidence

### Pattern Confidence
```python
confidence = pattern.confidence  # From correlation engine (0.0-1.0)
```

Pattern confidence is based on:
- Event sequence matching
- Time correlation
- IP relationship strength
- Attack chain completeness

## Security Recommendations

### Critical Threat (Score 75-100)

**Automated Actions:**
- Immediate IP ban (24-48h duration)
- Enable enhanced packet capture
- Trigger security team alert
- Generate incident report
- Review for successful exploitation

**Manual Actions:**
- Check for lateral movement
- Inspect for data exfiltration
- Review privilege escalation attempts
- Analyze persistence mechanisms
- Consider forensic capture

### High Threat (Score 50-74)

**Automated Actions:**
- IP ban (12-24h duration)
- Enable detailed logging
- Rate limit to 10 req/min
- Generate alert

**Manual Actions:**
- Review attack timeline
- Check for pattern evolution
- Monitor for escalation
- Prepare incident documentation

### Medium Threat (Score 25-49)

**Automated Actions:**
- Add to watchlist
- Enable rate limiting (30 req/min)
- Increase log verbosity

**Manual Actions:**
- Monitor for 24-48 hours
- Review attack diversity
- Check for reconnaissance patterns

### Low Threat (Score 0-24)

**Automated Actions:**
- Continue baseline monitoring
- Standard logging

**Manual Actions:**
- None required (routine monitoring)

## Performance Considerations

### Caching Strategy

```python
# Threat scores are calculated on-demand
# For high-traffic scenarios, consider caching:
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_cached_threat_score(ip: str, cache_duration: int = 60):
    # Cache threat scores for 60 seconds
    # ...
```

### Time Window Optimization

- **Default**: 60 minutes for IP scoring (balances recency vs. data volume)
- **Risk Assessment**: 24 hours (provides statistical significance)
- **Dashboard**: Real-time aggregation (no caching)

### Memory Usage

Estimated memory footprint:
- **ThreatScore object**: ~200 bytes
- **100 active IPs**: ~20 KB
- **50 patterns**: ~10 KB
- **Total**: < 50 KB for typical scenario

## Testing

### Unit Tests

```bash
cd monitoring/incident-bot
pytest tests/test_threat_scoring.py -v
```

### Integration Tests

```bash
# Test with simulated attack data
python tests/test_siem_endpoints.py

# Test with live attack simulation
cd attacks/multi-stage-attack
python simulate_attack.py
curl "http://localhost:5002/api/siem/dashboard" | jq
```

### Load Testing

```bash
# Generate attack traffic
for i in {1..100}; do
    curl -X POST http://localhost:5002/api/events \
        -H "Content-Type: application/json" \
        -d "{\"ip\":\"192.168.1.$((RANDOM % 10))\",\"attack_type\":\"sql_injection\"}"
done

# Query dashboard performance
time curl "http://localhost:5002/api/siem/dashboard" | jq
```

## Metrics

### Prometheus Metrics (Existing)

```
# Incident bot metrics
incident_bot_executions_total{runbook, status}
incident_bot_execution_duration_seconds{runbook}

# Correlation engine metrics
correlation_engine_events_total{attack_type, severity}
correlation_engine_patterns_detected_total{pattern_type}
correlation_engine_active_ips
```

### Future Metrics (Recommended)

```
# Threat scoring metrics
threat_score_calculations_total{result_level}
threat_score_calculation_duration_seconds
siem_dashboard_queries_total
risk_assessment_score{time_window}
```

## Future Enhancements

### Phase 2.5D Candidates

1. **Machine Learning**: Train ML models on threat patterns
2. **Behavioral Analysis**: Detect anomalies from baseline behavior
3. **Threat Intelligence Feeds**: Integrate external threat databases (AbuseIPDB, AlienVault OTX)
4. **Automated Remediation**: Auto-execute runbooks based on threat scores
5. **Attack Prediction**: Forecast next attack based on reconnaissance patterns
6. **Geo-IP Analysis**: Correlate threats by geographic origin
7. **User Entity Behavior Analytics (UEBA)**: Profile normal user behavior

### Grafana Dashboard Integration

Create new dashboard: `siem-threat-intelligence.json`

**Panels:**
- Risk Score Gauge (0-100)
- Top 10 Threat IPs (table with scores)
- Threat Level Distribution (pie chart)
- Attack Timeline (time series)
- Pattern Detection Heatmap
- Defense Effectiveness Graph

## Troubleshooting

### No Threat Scores Appearing

```bash
# Check if correlation engine has events
curl http://localhost:5002/api/stats | jq '.correlation_stats'

# Verify event ingestion
curl http://localhost:5002/api/events | jq

# Check time window settings
curl "http://localhost:5002/api/siem/threat-scores?time_window_minutes=1440" | jq
```

### Risk Assessment Shows Low Despite Attacks

```bash
# Check time window alignment
curl "http://localhost:5002/api/siem/risk-assessment?time_window_hours=1" | jq

# Verify severity classification
curl http://localhost:5002/api/events | jq '.events[] | select(.severity == "high")'

# Check pattern detection
curl http://localhost:5002/api/siem/pattern-scores | jq
```

### Dashboard Performance Issues

```bash
# Check response time
time curl "http://localhost:5002/api/siem/dashboard" | jq

# Reduce time windows
curl "http://localhost:5002/api/siem/dashboard?time_window_hours=1" | jq

# Limit top threats
curl "http://localhost:5002/api/siem/threat-scores?limit=10" | jq
```

## Conclusion

Phase 2.5C transforms the Incident Bot into a comprehensive SIEM system with:

✅ **Quantitative threat scoring** (0-100 scale)
✅ **Risk assessment** (environment-wide security posture)
✅ **SIEM dashboard API** (4 comprehensive endpoints)
✅ **Actionable recommendations** (severity-based guidance)
✅ **Multi-source correlation** (WAF + IDS + Honeypot + Auth)

This enhancement provides security teams with data-driven insights for prioritizing incident response and measuring security effectiveness.

**Next Phase**: Frontend integration to visualize SIEM dashboard in web UI.
