/**
 * Gateway Bypass (Direct Access) Guide
 */

import type { DocGuide } from '../docs'

export const gatewayBypassGuide: DocGuide = {
  slug: 'gateway-bypass',
  title: 'Gateway Bypass (Direct Access)',
  description: 'Bypass API gateway security controls by accessing services directly',
  category: 'attack-guides',
  lastUpdated: '2025-11-14',
  content: [
    {
      type: 'heading',
      level: 1,
      content: 'Gateway Bypass (Direct Access)',
    },
    {
      type: 'paragraph',
      content: 'When backend services are exposed on public ports, attackers can bypass API gateway security controls (JWT validation, rate limiting, WAF) by accessing services directly.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'The Architecture Problem',
    },
    {
      type: 'paragraph',
      content: 'In a typical microservices architecture:',
    },
    {
      type: 'code',
      language: 'text',
      content: `Intended Flow:
Client → API Gateway (:8080) → Backend Service (:8002)
         ↑ Security controls applied here

Bypass Flow:
Client ────────────────────────→ Backend Service (:8002)
         ↑ NO security controls!`,
    },
    {
      type: 'danger',
      content: 'If backend services are accessible on public networks, all gateway security controls are USELESS!',
    },
    {
      type: 'heading',
      level: 2,
      content: 'What Gets Bypassed?',
    },
    {
      type: 'table',
      content: {
        headers: ['Security Control', 'Gateway (:8080)', 'Direct Access (:8002)'],
        rows: [
          ['JWT Validation', 'Enforced', 'BYPASSED'],
          ['Rate Limiting', '60 req/min', 'UNLIMITED'],
          ['WAF (SQL Injection, XSS)', 'Blocked', 'BYPASSED'],
          ['Security Headers', 'Added', 'MISSING'],
          ['Logging', 'Comprehensive', 'Basic only'],
          ['IP Banning', 'Enforced', 'BYPASSED'],
        ],
      },
    },
    {
      type: 'heading',
      level: 2,
      content: 'How This Attack Works',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# 1. Normal flow through gateway (REQUIRES JWT)
curl http://localhost:8080/profile/admin
# Response: 401 Unauthorized - Missing JWT token

# 2. Direct access to user-service (BYPASSES gateway)
curl http://localhost:8002/profile/admin
# Response: 200 OK - Returns profile WITHOUT authentication!

# 3. Bypass rate limiting
for i in {1..1000}; do
  curl http://localhost:8002/profile/user$i &
done
# Gateway would block after 60 requests
# Direct access: ALL 1000 requests succeed!`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Discovery Methods',
    },
    {
      type: 'paragraph',
      content: 'How attackers discover direct service access:',
    },
    {
      type: 'list',
      content: [
        'Port Scanning: nmap, masscan reveal open ports (8000, 8002, etc.)',
        'Error Messages: Stack traces may reveal internal service URLs',
        'Documentation: Accidentally published API docs with internal endpoints',
        'DNS Records: Internal service names in DNS (service.internal.company.com)',
        'GitHub: Leaked docker-compose.yml files showing port mappings',
        'Cloud Metadata: AWS/GCP metadata endpoints revealing internal IPs',
      ],
    },
    {
      type: 'heading',
      level: 2,
      content: 'Step-by-Step Execution',
    },
    {
      type: 'list',
      content: [
        'Navigate to Attack Playground',
        'Find "Gateway Bypass (Direct Access)" attack',
        'Click "Launch Attack"',
        'Choose attack type: Profile Enumeration or Settings Manipulation',
        'Execute attack against port 8002 (bypassing gateway on 8080)',
        'Observe successful requests WITHOUT JWT tokens',
        'Compare with same requests through gateway (would fail)',
      ],
    },
    {
      type: 'heading',
      level: 2,
      content: 'Detection Indicators',
    },
    {
      type: 'table',
      content: {
        headers: ['Indicator', 'Description', 'Metric'],
        rows: [
          ['Request Discrepancy', 'Backend receives more requests than gateway logs', 'Compare http_requests_total'],
          ['Unauthenticated Access', 'Successful requests without JWT', 'user_service_direct_access_total'],
          ['Rate Limit Bypass', 'High request rate without rate limit blocks', 'gateway_rate_limit_blocks_total = 0'],
          ['Port Access Patterns', 'Connections to port 8002 from external IPs', 'Network flow logs'],
        ],
      },
    },
    {
      type: 'heading',
      level: 2,
      content: 'Mitigation Strategies',
    },
    {
      type: 'list',
      content: [
        'Network Segmentation: Backend services on private network, NOT publicly accessible',
        'Firewall Rules: Only allow gateway IP to access backend services',
        'Docker Networking: Use internal networks, no port exposure (ports: vs expose:)',
        'Service Mesh: Use Istio, Linkerd for mutual TLS and traffic management',
        'Defense in Depth: Implement security at EVERY layer, not just gateway',
        'Monitoring: Alert on direct backend access from external IPs',
        'Load Balancer: Frontend load balancer as single entry point',
      ],
    },
    {
      type: 'heading',
      level: 2,
      content: 'Docker Compose Configuration',
    },
    {
      type: 'paragraph',
      content: 'Vulnerable configuration (current demo):',
    },
    {
      type: 'code',
      language: 'yaml',
      content: `# VULNERABLE: Exposes service on host port
user-service:
  ports:
    - "8002:8000"  # Publicly accessible!
  networks:
    - app-network`,
    },
    {
      type: 'paragraph',
      content: 'Secure configuration:',
    },
    {
      type: 'code',
      language: 'yaml',
      content: `# SECURE: Only gateway exposed, backend internal
user-service:
  # Use 'expose' instead of 'ports'
  expose:
    - "8000"  # Only accessible within Docker network
  networks:
    - backend  # Separate network from public gateway

api-gateway:
  ports:
    - "8080:8080"  # Only entry point
  networks:
    - frontend  # Public network
    - backend   # Can access backend services`,
    },
    {
      type: 'warning',
      content: 'In this demo lab, backend services are intentionally exposed to demonstrate the vulnerability. Production deployments must NEVER expose backend services publicly!',
    },
    {
      type: 'heading',
      level: 2,
      content: 'Real-World Impact',
    },
    {
      type: 'paragraph',
      content: 'Gateway bypass vulnerabilities have caused major breaches:',
    },
    {
      type: 'list',
      content: [
        'Capital One (2019): Server-Side Request Forgery (SSRF) bypassed WAF to access AWS metadata',
        'Elasticsearch Instances: Thousands exposed publicly with no authentication (bypassing intended access controls)',
        'MongoDB Databases: Direct access without authentication led to data dumps',
        'Internal APIs: Accidentally exposed microservices allowed complete system compromise',
      ],
    },
  ],
}
