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

- `GET /health` - Health check
- `POST /webhook` - Webhook dla Alertmanager
- `GET /incidents` - Historia obsłużonych incydentów
- `GET /metrics` - Metryki Prometheus

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

