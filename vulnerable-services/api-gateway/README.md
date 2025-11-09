# API Gateway

API Gateway dla DevSecOps Hacking Lab - centralna brama dla wszystkich microservices.

## Funkcjonalność (Faza 2.2 - Krok 1)

### ✅ Zaimplementowane
- **Health check endpoint** (`/health`)
- **Routing do auth-service** (`/auth/*`)
- **Podstawowy reverse proxy** (HTTPX)
- **Error handling** (503, 504, 502)
- **CORS middleware**

### 🚧 Do zrobienia (kolejne kroki)
- JWT validation middleware
- WAF rules (rate limiting, request validation)
- Routing do user-service (`/api/users/*`)
- mTLS do backend services
- Metryki Prometheus

## Architektura

```
Client → API Gateway (8080) → Backend Services
                                ├── auth-service (8000)
                                └── user-service (8001)
```

## Endpointy

### Gateway
- `GET /` - Informacje o gateway
- `GET /health` - Health check + status backend services

### Proxied Routes
- `POST /auth/login` → `auth-service:8000/auth/login`
- `POST /auth/mfa/verify` → `auth-service:8000/auth/mfa/verify`
- `POST /auth/token/refresh` → `auth-service:8000/auth/token/refresh`
- `POST /auth/logout` → `auth-service:8000/auth/logout`

## Konfiguracja

### Zmienne środowiskowe

```env
# Application
ENVIRONMENT=development
DEBUG=false
HOST=0.0.0.0
PORT=8080

# Backend Services
AUTH_SERVICE_URL=http://login-api:8000
USER_SERVICE_URL=http://user-service:8001

# JWT (for validation)
SECRET_KEY=dev-secret-key-change-in-production
JWT_ALGORITHM=HS256

# Security
ENABLE_CORS=true
LOG_LEVEL=INFO
```

## Development

### Local Run
```bash
cd vulnerable-services/api-gateway
pip install -r requirements.txt
python -m app.main
```

### Docker
```bash
docker build -t api-gateway:latest .
docker run -p 8080:8080 api-gateway:latest
```

### Docker Compose
```bash
docker-compose up -d api-gateway
docker-compose logs -f api-gateway
```

## Testing

```bash
# Health check
curl http://localhost:8080/health

# Gateway info
curl http://localhost:8080/

# Test auth routing
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Następne kroki

**Grupa 2: Gateway Security**
- JWT verification middleware
- WAF rules (rate limiting, IP filtering)
- Request validation
- Metryki Prometheus

