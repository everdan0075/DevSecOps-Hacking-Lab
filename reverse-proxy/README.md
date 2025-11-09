# Reverse Proxy (Traefik) Setup

Phase 2.1 introduces a hardened entrypoint in front of the authentication service. We use [Traefik](https://doc.traefik.io/) to terminate TLS, inject security headers, and apply rate limits before traffic reaches `login-api`.

## Features

- HTTPS endpoint exposed on `https://localhost:8443`
- HSTS, CSP, referrer policy, and permissions policy headers
- Basic rate limiting (30 requests/minute average, burst 60) for the `/auth` path
- Internal routing to `login-api` over the Docker network
- Hot-reloadable configuration via file provider
- Prometheus metrics emitted by Traefik (scrape via `reverse-proxy:8080/metrics` in future phases)

## Directory Structure

```
reverse-proxy/
├── traefik.yml               # Static configuration (entry points, providers)
├── dynamic/
│   └── dynamic.yml           # Routers, services, middlewares
└── README.md
```

## Usage

1. Ensure the service is running:
   ```bash
   docker-compose up -d reverse-proxy login-api redis
   ```

2. Access the API through HTTPS (self-signed Traefik default certificate):
   ```bash
   # macOS / Linux
   curl -k https://localhost:8443/health

   # Windows PowerShell
   curl.exe -k https://localhost:8443/health
   ```
   > `-k` skips certificate verification; import the Traefik default cert into your trust store if you prefer not to disable verification.

3. HTTP (`http://localhost:8081`) automatically redirects to HTTPS. It is exposed solely for testing redirection or attaching scanners.

3. The reverse proxy automatically forwards requests to the FastAPI service. Existing direct access on `http://localhost:8000` remains available temporarily for backwards compatibility; it will be phased out in later milestones.

## Notes

- The configuration currently routes all `Host("localhost")` traffic. Update the rule if you map a custom hostname in `/etc/hosts`.
- Traefik emits a default self-signed certificate. In later steps we will provide our own certificates and enable mutual TLS downstream.
- Access logs are enabled to support monitoring and further security analysis.

For full details about the Secure Login API 2.0 rollout, see [`docs/auth/SECURE_LOGIN_API.md`](../docs/auth/SECURE_LOGIN_API.md).

