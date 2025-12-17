/**
 * Architecture Overview Guide
 */

import type { DocGuide } from '../docs'

export const architectureGuide: DocGuide = {
  slug: 'architecture',
  title: 'Architecture Overview',
  description: 'Understand the service mesh, technology stack, and data flow',
  category: 'getting-started',
  lastUpdated: '2025-11-14',
  content: [
    {
      type: 'heading',
      level: 1,
      content: 'Architecture Overview',
    },
    {
      type: 'paragraph',
      content: 'The DevSecOps Hacking Lab is built as a microservices architecture with intentionally vulnerable services, security controls, and comprehensive monitoring.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'Service Mesh',
    },
    {
      type: 'code',
      language: 'text',
      content: `Client (Browser/curl)
  ↓
API Gateway (:8080) ← Security Layer
  ├── JWT Validation
  ├── Rate Limiting (60 req/min)
  ├── WAF (SQL injection, XSS, Path traversal)
  └── Security Headers
  ↓
  ├─→ Auth Service (login-api :8000)
  │   ├── JWT Token Generation (5min expiry)
  │   ├── MFA (TOTP) Verification
  │   ├── Token Refresh & Revocation
  │   └── Redis Session Store
  │
  └─→ User Service (:8002) [VULNERABLE]
      ├── User Profile (IDOR vulnerability)
      ├── Settings (No auth bypass)
      └── Direct Access (Gateway bypass)

Monitoring Stack:
  Prometheus (:9090) → Metrics Collection
  Alertmanager (:9093) → Alert Routing
  Incident Bot (:5002) → Automated Response
  Grafana (:3000) → Visualization

Backend:
  Redis (:6379) → Sessions, Rate Limits, IP Bans
  Traefik (:8443) → Reverse Proxy (TLS)`,
    },
    {
      type: 'info',
      content: 'Services are intentionally exposed on public ports to demonstrate "direct access" attacks. In production, only the gateway would be publicly accessible.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'Technology Stack',
    },
    {
      type: 'table',
      content: {
        headers: ['Component', 'Technology', 'Purpose'],
        rows: [
          ['Backend Framework', 'FastAPI (Python 3.11+)', 'High-performance async API services'],
          ['Authentication', 'JWT (HS256) + pyotp (TOTP)', 'Token-based auth with MFA'],
          ['Session Store', 'Redis', 'Distributed session management'],
          ['Monitoring', 'Prometheus + Grafana', 'Metrics collection and visualization'],
          ['Alerting', 'Alertmanager', 'Alert routing and deduplication'],
          ['Frontend', 'React 19 + TypeScript + Vite', 'Modern SPA with static deployment'],
          ['Orchestration', 'Docker Compose', 'Multi-container deployment'],
          ['HTTP Client', 'httpx (async)', 'Service-to-service communication'],
        ],
      },
    },
    {
      type: 'heading',
      level: 2,
      content: 'Port Reference',
    },
    {
      type: 'table',
      content: {
        headers: ['Port', 'Service', 'Purpose', 'Public'],
        rows: [
          ['8000', 'login-api', 'Auth Service (JWT, MFA)', 'Yes (demo only)'],
          ['8002', 'user-service', 'User management (vulnerable)', 'Yes (demo only)'],
          ['8080', 'api-gateway', 'API Gateway (security layer)', 'Yes'],
          ['8443', 'traefik', 'Reverse proxy (HTTPS)', 'Yes'],
          ['9090', 'prometheus', 'Metrics collection', 'Yes (demo only)'],
          ['3000', 'grafana', 'Dashboards', 'Yes'],
          ['9093', 'alertmanager', 'Alert routing', 'Yes (demo only)'],
          ['5002', 'incident-bot', 'Incident response automation', 'Yes (demo only)'],
          ['6379', 'redis', 'Session store', 'No (internal)'],
        ],
      },
    },
    {
      type: 'heading',
      level: 2,
      content: 'Data Flow',
    },
    {
      type: 'paragraph',
      content: 'Typical request flow through the system:',
    },
    {
      type: 'list',
      content: [
        'Client sends request to API Gateway (:8080)',
        'Gateway applies middleware: Logging → Security Headers → Rate Limiting → WAF',
        'If authenticated endpoint, Gateway validates JWT with Auth Service',
        'Gateway forwards request to backend service (Auth or User Service)',
        'Backend service processes request and returns response',
        'Prometheus scrapes /metrics endpoints every 15 seconds',
        'Alertmanager evaluates alert rules and triggers webhooks to Incident Bot',
        'Incident Bot executes runbooks (notify, ban IP, generate report)',
        'Grafana queries Prometheus for dashboard visualization',
      ],
    },
    {
      type: 'heading',
      level: 2,
      content: 'Security Layers',
    },
    {
      type: 'paragraph',
      content: 'The architecture implements defense in depth:',
    },
    {
      type: 'table',
      content: {
        headers: ['Layer', 'Controls', 'Bypass Method (Educational)'],
        rows: [
          ['Network', 'Docker networking', 'Direct service access via exposed ports'],
          ['Gateway', 'JWT validation, Rate limiting, WAF', 'Direct service access'],
          ['Application', 'MFA, Token revocation, Input validation', 'IDOR, Auth bypass on user-service'],
          ['Monitoring', 'Real-time metrics, Alerting', 'Slow attacks under threshold'],
          ['Response', 'Automated IP banning, Incident runbooks', 'IP rotation, Distributed attacks'],
        ],
      },
    },
    {
      type: 'heading',
      level: 2,
      content: 'Intentional Vulnerabilities',
    },
    {
      type: 'danger',
      content: 'These vulnerabilities are INTENTIONAL for educational purposes. Do NOT deploy this lab to production!',
    },
    {
      type: 'list',
      content: [
        'IDOR (Insecure Direct Object Reference) - /profile/{user_id} has no authorization',
        'Auth Bypass - /settings endpoint lacks JWT validation',
        'Direct Service Access - Backend services exposed on public ports',
        'Rate Limit Bypass - Rate limiting only at gateway, not on backend services',
        'Weak MFA - TOTP enumeration possible with time-based brute force',
      ],
    },
  ],
}
