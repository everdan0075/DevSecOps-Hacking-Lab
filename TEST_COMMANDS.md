# Test Commands - Phase 2.2

## Grupa 1: API Gateway - Podstawy ✅

### 1. Build i uruchom API Gateway

```powershell
# Build i start gateway
docker-compose build api-gateway
docker-compose up -d api-gateway

# Sprawdź status
docker-compose ps api-gateway

# Sprawdź logi
docker-compose logs -f api-gateway
```

### 2. Test Health Check

```powershell
# Health check gateway (powinien pokazać status backend services)
curl http://localhost:8080/health

# Oczekiwany output:
# {
#   "status": "healthy" lub "degraded",
#   "service": "API Gateway",
#   "version": "0.1.0",
#   "environment": "development",
#   "backends": {
#     "auth-service": {
#       "status": "healthy",
#       "url": "http://login-api:8000"
#     }
#   }
# }
```

### 3. Test Gateway Info Endpoint

```powershell
# Root endpoint
curl http://localhost:8080/

# Oczekiwany output: informacje o dostępnych endpointach
```

### 4. Test Routing do Auth Service

```powershell
# Test 1: Login endpoint przez gateway
curl -X POST http://localhost:8080/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"password\":\"admin123\"}'

# Oczekiwany output: response z challenge_id (MFA)

# Test 2: Health check auth-service przez gateway
curl http://localhost:8080/auth/../health

# Test 3: Bezpośredni dostęp do auth-service (powinien działać - będziemy to blokować w kolejnych fazach)
curl http://localhost:8000/health
```

### 5. Test Complete Auth Flow przez Gateway

```powershell
# Krok 1: Login
$loginResponse = curl -X POST http://localhost:8080/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"password\":\"admin123\"}' | ConvertFrom-Json

$challengeId = $loginResponse.challenge_id

# Krok 2: Pobierz MFA code z logów
docker-compose logs login-api | Select-String "mfa_code"

# Krok 3: MFA verify (wstaw prawdziwy kod)
curl -X POST http://localhost:8080/auth/mfa/verify `
  -H "Content-Type: application/json" `
  -d "{\"challenge_id\":\"$challengeId\",\"code\":\"123456\"}"

# Oczekiwany output: JWT tokens
```

### 6. Test Error Handling

```powershell
# Test 404 - nieistniejąca ścieżka
curl http://localhost:8080/nonexistent

# Test 503 - gdy backend jest down
docker-compose stop login-api
curl http://localhost:8080/auth/login
docker-compose start login-api
```

### 7. Weryfikacja Docker Network

```powershell
# Sprawdź czy gateway widzi inne serwisy
docker exec api-gateway ping -c 3 login-api
docker exec api-gateway ping -c 3 redis

# Sprawdź resolving DNS
docker exec api-gateway nslookup login-api
```

### 8. Performance Check

```powershell
# Test latencji przez gateway vs bezpośrednio
Measure-Command { curl http://localhost:8080/health }
Measure-Command { curl http://localhost:8000/health }

# Gateway powinien dodać ~10-50ms overhead
```

---

## ✅ Kryteria Sukcesu Grupy 1

- [ ] Gateway działa na porcie 8080
- [ ] Health check zwraca status "healthy" dla auth-service
- [ ] Routing `/auth/*` przekierowuje do login-api
- [ ] Login flow działa przez gateway
- [ ] MFA verification działa przez gateway
- [ ] Error handling zwraca sensowne komunikaty
- [ ] Gateway łączy się z login-api przez Docker network

---

## 🚀 Następny Krok

**Grupa 2: Gateway Security**
```powershell
# Po pomyślnym zakończeniu Grupy 1, wykonaj:
git add vulnerable-services/api-gateway/
git add docker-compose.yml
git commit -m "feat(gateway): Dodaj podstawowy API Gateway z routingiem do auth-service (Faza 2.2 - Krok 1)

- Stworzono strukturę api-gateway z FastAPI
- Health check z monitoringiem backend services
- Routing /auth/* -> login-api:8000
- Reverse proxy z httpx
- Error handling (503, 504, 502)
- CORS middleware
- Dodano do docker-compose.yml (port 8080)
- Health check w Dockerfile i docker-compose
"
```
