# Monitoring Tests

Smoke tests dla systemów monitoringu i incident response w DevSecOps Hacking Lab.

## Testy

### `monitoring_smoke_test.py`
- Testy podstawowej funkcjonalności monitoringu (Prometheus, Alertmanager, Grafana)
- Sprawdza dostępność endpointów i podstawową konfigurację

### `test_incident_bot.py` (Phase 2.3)
- Testy automatycznego systemu incident response
- Weryfikuje:
  - Health checks incident-bot
  - Ładowanie runbooków
  - Przetwarzanie webhooków z Alertmanager
  - Wykonywanie akcji automatycznych
  - Metryki Prometheus
  - Odporność na błędy

## Uruchomienie

### Wszystkie testy
```bash
cd monitoring/tests
pip install -r requirements.txt
pytest -v
```

### Tylko incident-bot
```bash
pytest test_incident_bot.py -v
```

### Z coverage
```bash
pytest --cov=. --cov-report=html
```

## Wymagania

- Wszystkie serwisy muszą być uruchomione (`docker-compose up`)
- Porty domyślne:
  - Prometheus: 9090
  - Alertmanager: 9093  
  - Grafana: 3000
  - Alert Receiver: 5001
  - Incident Bot: 5002

## Struktura testów

```
tests/
├── README.md                    # Ten plik
├── requirements.txt             # Zależności
├── monitoring_smoke_test.py     # Testy monitoringu (Phase 2.1)
└── test_incident_bot.py         # Testy incident response (Phase 2.3)
```

## Integracja z CI/CD

Testy mogą być uruchomione w pipeline CI/CD:

```yaml
- name: Run monitoring smoke tests
  run: |
    cd monitoring/tests
    pytest -v --junitxml=test-results.xml
```

## Troubleshooting

### Testy failują z connection errors
- Sprawdź czy wszystkie kontenery działają: `docker ps`
- Sprawdź logi: `docker logs incident-bot`
- Upewnij się że porty nie są zajęte

### Timeout errors
- Zwiększ timeout w testach (parametr `timeout`)
- Sprawdź czy serwisy odpowiadają: `curl http://localhost:5002/health`

### Testy runbooków nie wykonują akcji
- Sprawdź czy Redis działa: `docker logs redis`
- Sprawdź runbooki: `ls monitoring/incident-bot/runbooks/`
- Zobacz logi incident-bot: `docker logs incident-bot -f`

