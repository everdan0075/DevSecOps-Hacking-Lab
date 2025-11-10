# Incident Response Automation - Phase 2.3

## 📋 Przegląd

System automatycznego reagowania na incydenty bezpieczeństwa (Incident Response Automation) to kluczowy element DevSecOps Hacking Lab, który automatyzuje reakcję na wykryte zagrożenia i ataki.

### Cele

1. **Automatyczna detekcja** - wykrywanie incydentów przez Prometheus alerts
2. **Natychmiastowa reakcja** - wykonywanie predefiniowanych akcji obronnych
3. **Dokumentacja** - automatyczne generowanie raportów incydentów
4. **Notyfikacje** - informowanie zespołu bezpieczeństwa
5. **Minimalizacja szkód** - redukcja czasu reakcji z godzin do sekund

## 🏗️ Architektura

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  Vulnerable │────>│  Prometheus  │────>│ Alertmanager  │────>│ Incident Bot │
│  Services   │     │   (Metrics)  │     │   (Routing)   │     │  (Actions)   │
└─────────────┘     └──────────────┘     └───────────────┘     └──────────────┘
                                                                        │
                                                                        ├──> Redis (IP bans)
                                                                        ├──> Slack/Console (Notifications)
                                                                        └──> Reports (JSON/Markdown)
```

### Komponenty

#### 1. **Prometheus**
- Zbiera metryki z serwisów (login-api, user-service, api-gateway)
- Ewaluuje reguły alertów (alert_rules.yml)
- Wykrywa anomalie i ataki

#### 2. **Alertmanager**
- Otrzymuje alerty z Prometheus
- Routuje alerty według severity i kategorii
- Wysyła webhooki do incident-bot

#### 3. **Incident Bot**
- Konsumuje webhooki z Alertmanager
- Ładuje odpowiednie runbooki (playbooki)
- Wykonuje akcje automatyczne
- Eksportuje metryki do Prometheus

#### 4. **Runbooki (Playbooki)**
- Pliki JSON definiujące sekwencję akcji
- Warunki uruchomienia (trigger conditions)
- Parametry wykonania i retry logic

## 📚 Runbooki

System zawiera 8 predefiniowanych runbooków:

| Runbook | Alert | Severity | Akcje |
|---------|-------|----------|-------|
| **Brute Force Response** | LoginFailureSpike | warning | IP ban (1h), notify, report |
| **Rate Limiter Critical** | RateLimiterBlocking | critical | Notify, report, guidance |
| **MFA Brute Force** | MFABypassAttempts | warning | IP ban (2h), notify, report |
| **Token Abuse Response** | RefreshTokenAbuse | warning | Notify, report, IP ban |
| **Gateway Bypass** | DirectServiceAccessDetected | critical | IP ban (24h), critical alert |
| **IDOR Exploitation** | IDORExploitationAttempt | critical | IP ban (12h), remediation |
| **Multiple IP Bans** | IPBanThresholdReached | critical | Analysis, guidance |
| **SQL Injection** | WAFSQLInjectionAttempt | critical | IP ban (24h), full report |

### Przykład Runbooka

```json
{
  "name": "Brute Force Response",
  "trigger": {
    "alertname": "LoginFailureSpike",
    "severity": "warning",
    "category": "brute-force"
  },
  "priority": 20,
  "actions": [
    {
      "type": "notify",
      "params": {
        "channel": "console",
        "message": "🚨 Brute force attack detected!"
      }
    },
    {
      "type": "ip_ban",
      "params": {
        "duration": 3600,
        "reason": "Brute force attack"
      },
      "retry_count": 2
    },
    {
      "type": "report",
      "params": {
        "format": "json",
        "include_context": true
      }
    }
  ]
}
```

## 🔧 Action Handlers

### 1. IP Ban Handler
```python
# Blokuje IP w Redis (używane przez rate limiter)
{
  "type": "ip_ban",
  "params": {
    "ip": "192.168.1.100",        # Opcjonalnie (auto-detect z context)
    "duration": 3600,              # Sekundy
    "reason": "Brute force attack"
  }
}
```

### 2. Notification Handler
```python
# Wysyła powiadomienia
{
  "type": "notify",
  "params": {
    "channel": "console",          # console | slack
    "message": "Custom message",   # Opcjonalnie
    "severity_color": true         # Użyj koloru severity
  }
}
```

### 3. Report Handler
```python
# Generuje raporty incydentów
{
  "type": "report",
  "params": {
    "format": "json",              # json | markdown
    "include_context": true        # Dołącz kontekst wykonania
  }
}
```

## 🚀 Deployment

### Docker Compose

Incident Bot jest zintegrowany z docker-compose.yml:

```yaml
incident-bot:
  build: ./monitoring/incident-bot
  ports:
    - "5002:5002"
  environment:
    - REDIS_HOST=redis
    - RUNBOOK_DIR=/app/runbooks
  volumes:
    - ./monitoring/incident-bot/runbooks:/app/runbooks:ro
    - incident-bot-reports:/app/reports
  depends_on:
    - redis
```

### Uruchomienie

```bash
# Start całego środowiska
docker-compose up -d

# Sprawdź logi incident-bot
docker logs -f incident-bot

# Sprawdź health
curl http://localhost:5002/health

# Zobacz załadowane runbooki
curl http://localhost:5002/stats
```

## 🎯 Symulacja Incydentów

### Skrypt Symulacyjny

```bash
# Symuluj wszystkie ataki
python monitoring/incident-bot/simulate_incident.py --attack all

# Symuluj pojedynczy atak
python monitoring/incident-bot/simulate_incident.py --attack brute-force
python monitoring/incident-bot/simulate_incident.py --attack idor
python monitoring/incident-bot/simulate_incident.py --attack gateway-bypass
```

### Łańcuch Ataków

Skrypt wykonuje sekwencję ataków:

1. **Brute Force** → 10 nieudanych prób logowania
2. **Token Replay** → 20 prób z nieważnymi tokenami
3. **IDOR** → Próba dostępu do 7 nieprawnych profili
4. **Gateway Bypass** → 15 bezpośrednich dostępów do serwisu

Każdy atak powinien wygenerować alert i uruchomić odpowiedni runbook.

## 📊 Monitoring i Dashboardy

### Grafana Dashboard: "Incident Response"

Dashboard zawiera:
- **Incidents (Last Hour)** - liczba incydentów
- **Actions Executed** - wykonane akcje
- **Action Success Rate** - wskaźnik sukcesu
- **Incident Timeline** - oś czasu incydentów
- **Incidents by Category** - rozkład kategorii
- **Actions by Type** - typy wykonanych akcji
- **Runbook Execution Duration** - czas wykonania

Dostęp: http://localhost:3000/d/incident-response

### Metryki Prometheus

```promql
# Liczba incydentów według severity
sum by(severity) (increase(incident_bot_incidents_total[1h]))

# Wskaźnik sukcesu akcji
sum(incident_bot_actions_total{status="success"}) / sum(incident_bot_actions_total)

# Czas wykonania runbooków (p95)
histogram_quantile(0.95, rate(incident_bot_runbook_execution_duration_seconds_bucket[5m]))

# Incydenty w trakcie obsługi
incident_bot_incidents_processing
```

## 🧪 Testy

### Smoke Tests

```bash
cd monitoring/tests

# Wszystkie testy
pytest -v

# Tylko incident-bot
pytest test_incident_bot.py -v

# Z coverage
pytest --cov=. --cov-report=html
```

### Testy Obejmują:
- ✅ Health checks
- ✅ Ładowanie runbooków
- ✅ Przetwarzanie webhooków
- ✅ Wykonywanie akcji
- ✅ Metryki Prometheus
- ✅ Odporność na błędy
- ✅ Równoczesne webhooki

## 🔄 Workflow Incydentu

### 1. Detekcja
```
Attack → Metrics → Prometheus Rule → Alert Firing
```

### 2. Routing
```
Prometheus → Alertmanager → Routing Rules → incident-bot
```

### 3. Matching
```
Alert → Runbook Loader → Find Matching Runbook (by alertname, severity, category)
```

### 4. Execution
```
Runbook → Action 1 → Action 2 → Action 3 → Complete
```

### 5. Dokumentacja
```
Execution Results → Metrics + Reports + Notifications
```

## 📝 Konfiguracja

### Zmienne Środowiskowe

```bash
# Incident Bot Configuration
DEBUG=false                          # Debug mode
RUNBOOK_DIR=/app/runbooks           # Katalog runbooków
REDIS_HOST=redis                    # Redis host (dla IP bans)
REDIS_PORT=6379                     # Redis port
REPORT_OUTPUT_DIR=/app/reports      # Katalog raportów
SLACK_WEBHOOK_URL=https://...       # Slack webhook (opcjonalnie)
ENABLE_SLACK=false                  # Włącz Slack notifications
```

### Alertmanager Routing

```yaml
route:
  receiver: "default"
  routes:
    # Critical alerts → incident-bot
    - receiver: "incident-bot"
      matchers:
        - severity = "critical"
      continue: true
    
    # Security categories → incident-bot
    - receiver: "incident-bot"
      matchers:
        - category =~ "brute-force|idor|gateway-bypass|waf"
      continue: true
```

## 🔐 Bezpieczeństwo

### Best Practices

1. **Weryfikuj runbooki** - sprawdź logikę przed wdrożeniem
2. **Ograniczaj uprawnienia** - non-root user w kontenerze
3. **Monitoruj akcje** - każda akcja jest logowana i mierzona
4. **Rate limiting** - zapobiegaj pętlom alert → action → alert
5. **Testuj offline** - używaj smoke testów przed produkcją

### Potencjalne Ryzyka

- **False positives** - zbyt agresywne reguły mogą zbanować legit użytkowników
- **Alert fatigue** - za dużo alertów = ignorowanie
- **Automated loops** - akcja może wywołać nowy alert
- **Privilege escalation** - upewnij się że bot ma minimalne uprawnienia

## 🆘 Troubleshooting

### Incident Bot nie startuje

```bash
# Sprawdź logi
docker logs incident-bot

# Sprawdź czy Redis działa
docker ps | grep redis

# Sprawdź czy runbooki są dostępne
docker exec incident-bot ls -la /app/runbooks/
```

### Runbooki się nie wykonują

```bash
# Sprawdź czy runbooki załadowane
curl http://localhost:5002/stats

# Wymuś reload
curl -X POST http://localhost:5002/reload

# Sprawdź metryki matching
curl http://localhost:5002/metrics | grep runbook_matches
```

### Akcje failują

```bash
# Zobacz szczegóły wykonania
curl http://localhost:5002/incidents | jq '.'

# Sprawdź Redis connection
docker exec incident-bot ping redis -c 1

# Zobacz logi akcji
docker logs incident-bot | grep "Action"
```

## 📖 Przykłady Użycia

### Ręczne Wysłanie Webhooka

```bash
curl -X POST http://localhost:5002/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "version": "4",
    "status": "firing",
    "receiver": "incident-bot",
    "groupLabels": {},
    "commonLabels": {},
    "commonAnnotations": {},
    "externalURL": "http://alertmanager:9093",
    "alerts": [{
      "status": "firing",
      "labels": {
        "alertname": "LoginFailureSpike",
        "severity": "warning",
        "service": "login-api",
        "category": "brute-force"
      },
      "annotations": {
        "summary": "Test brute force alert"
      },
      "startsAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }]
  }'
```

### Dodawanie Własnego Runbooka

1. Utwórz plik JSON w `monitoring/incident-bot/runbooks/`
2. Zdefiniuj trigger conditions i actions
3. Przeładuj runbooki: `curl -X POST http://localhost:5002/reload`
4. Przetestuj z simulate_incident.py

### Integracja ze Slack

```bash
# Ustaw webhook URL
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
export ENABLE_SLACK=true

# Restart incident-bot
docker-compose restart incident-bot
```

## 🎓 Nauka i Eksperymentowanie

Ten system jest zaprojektowany do nauki:

1. **Eksperymentuj** z różnymi runbookami
2. **Modyfikuj** parametry akcji (duration, retry_count)
3. **Twórz** własne runbooki dla nowych ataków
4. **Obserwuj** metryki i dashboardy
5. **Analizuj** wygenerowane raporty

## 🔗 Powiązane Dokumenty

- [Secure Login API](../auth/SECURE_LOGIN_API.md) - API z ochronami
- [API Gateway](../gateway/README.md) - Gateway security
- [Alert Rules](../../monitoring/prometheus/alert_rules.yml) - Reguły Prometheus
- [Attack Scripts](../../attacks/) - Skrypty ataków

## 📚 Referencje

- [NIST Incident Response Guide](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf)
- [OWASP Incident Response](https://owasp.org/www-community/Incident_Response)
- [Prometheus Alerting](https://prometheus.io/docs/alerting/latest/overview/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)

---

**Phase 2.3** - Incident Response Automation  
**Status**: ✅ Completed  
**Author**: DevSecOps Team  
**Last Updated**: 2025-11-10

