# Incident Response Bot

Automatyczny system reagowania na incydenty bezpieczeństwa w DevSecOps Hacking Lab.

## Cel

Incident Bot konsumuje alerty z Alertmanager i automatycznie wykonuje akcje obronne zgodnie z predefiniowanymi runbookami (playbooks). System realizuje koncepcję "security automation" i incident response.

## Architektura

```
Prometheus → Alertmanager → Incident Bot → Action Handlers
                                ↓
                           Runbook Engine
                                ↓
                    [IP Ban, Notify, Report, etc.]
```

## Funkcjonalności

### 🔥 Obsługiwane Akcje

- **IP Ban**: Blokowanie złośliwych IP w Redis (używane przez rate limiter)
- **Notification**: Wysyłanie powiadomień (konsola, Slack)
- **Report Generation**: Generowanie raportów incydentów (JSON, markdown)
- **Service Command**: Wykonywanie poleceń na usługach (restart, scale)

### 📚 Runbooki

Runbooki to pliki JSON definiujące sekwencję akcji dla konkretnego typu alertu:

```json
{
  "name": "Brute Force Response",
  "trigger": {
    "alertname": "LoginFailureSpike",
    "severity": "warning"
  },
  "actions": [
    {"type": "ip_ban", "duration": 3600},
    {"type": "notify", "channel": "security"},
    {"type": "report", "format": "json"}
  ]
}
```

## Konfiguracja

Zmienne środowiskowe:

- `RUNBOOK_DIR`: Katalog z runbookami (default: `/app/runbooks`)
- `REDIS_HOST`: Host Redis dla IP banów
- `SLACK_WEBHOOK_URL`: URL webhooka Slack (opcjonalnie)
- `DEBUG`: Tryb debugowania

## Uruchomienie

```bash
docker-compose up incident-bot
```

Bot nasłuchuje na porcie `5002` i odbiera webhooki od Alertmanager.

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `POST /webhook` - Webhook dla Alertmanager
- `GET /incidents` - Historia obsłużonych incydentów
- `GET /stats` - Statystyki incident bot
- `POST /reload` - Przeładuj runbooki z dysku
- `GET /metrics` - Metryki Prometheus

### Attack Correlation (Phase 2.5C)
- `POST /api/attack-event` - Zgłoszenie zdarzenia ataku do silnika korelacji
- `GET /api/attack-patterns` - Lista wykrytych wzorców ataków
- `GET /api/attack-feed/realtime` - Real-time feed zdarzeń ataku
- `POST /api/correlate` - Korelacja alertu IDS z wzorcami
- `GET /api/correlation/statistics` - Statystyki silnika korelacji
- `GET /api/defense/metrics` - Metryki skuteczności obrony

### SIEM Threat Scoring (Phase 2.5C)
- `GET /api/siem/threat-scores` - Threat scoring dla IP
- `GET /api/siem/pattern-scores` - Threat scoring dla wzorców
- `GET /api/siem/risk-assessment` - Ocena ryzyka środowiska
- `GET /api/siem/dashboard` - Kompletny dashboard SIEM

### Incident Management (Phase 2.7)
- `GET /api/incidents/reports` - Lista wygenerowanych raportów incydentów
- `GET /api/incidents/{filename}/report` - Pobierz konkretny raport (JSON/Markdown)
- `GET /api/bans/active` - Lista aktywnych banów IP (z Redis)
- `GET /api/runbooks` - Katalog dostępnych runbooków
- `GET /api/runbooks/{name}` - Szczegóły konkretnego runbooka

### Infrastructure Monitoring (Phase 2.7)
- `GET /api/gateway/health` - Metryki zdrowia API Gateway (proxy/mock)
- `GET /api/jwt/validation-stats` - Statystyki walidacji JWT (mock)
- `GET /api/ids/alerts` - Alerty IDS z Suricata (mock na Windows, Linux TODO)
- `GET /api/ids/statistics` - Statystyki silnika IDS

## Integracja z Alertmanager

W `alertmanager.yml`:

```yaml
receivers:
  - name: "incident-bot"
    webhook_configs:
      - url: "http://incident-bot:5002/webhook"
        send_resolved: true
```

## Rozwój

Struktura projektu:

```
incident-bot/
├── app/
│   ├── models/          # Modele Pydantic
│   ├── services/        # Logika biznesowa
│   ├── handlers/        # Action handlers
│   ├── config.py        # Konfiguracja
│   └── main.py          # FastAPI app
├── runbooks/            # Runbooki JSON
├── Dockerfile
└── requirements.txt
```

## Metryki

Bot eksponuje metryki Prometheus:

- `incident_bot_incidents_total{severity, category}` - Liczba obsłużonych incydentów
- `incident_bot_actions_total{action_type, status}` - Liczba wykonanych akcji
- `incident_bot_runbook_execution_duration_seconds` - Czas wykonania runbooka

