/**
 * Common Issues Guide
 */

import type { DocGuide } from '../docs'

export const commonIssuesGuide: DocGuide = {
  slug: 'common-issues',
  title: 'Common Issues',
  description: 'Solutions to frequently encountered problems',
  category: 'troubleshooting',
  lastUpdated: '2025-11-14',
  content: [
    {
      type: 'heading',
      level: 1,
      content: 'Common Issues',
    },
    {
      type: 'paragraph',
      content: 'This guide covers common problems you may encounter and their solutions.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'Backend Connection Failed',
    },
    {
      type: 'paragraph',
      content: 'Frontend shows "Backend Disconnected" or attacks fail with connection errors.',
    },
    {
      type: 'info',
      content: 'Verify all Docker services are running',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Check service status
docker-compose ps

# Expected output: All services should be "Up"
# If any service is "Exit 1" or missing, restart it:
docker-compose restart <service-name>

# If issues persist, rebuild:
docker-compose down
docker-compose up -d --build`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Port Conflicts',
    },
    {
      type: 'paragraph',
      content: 'Docker fails to start with "port is already allocated" error.',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Find process using the port (example: port 8080)
# Windows:
netstat -ano | findstr :8080

# Linux/Mac:
lsof -i :8080

# Kill the process or change ports in docker-compose.yml:
ports:
  - "8081:8080"  # Map to different host port`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Authentication Fails',
    },
    {
      type: 'paragraph',
      content: 'Unable to login or MFA verification fails.',
    },
    {
      type: 'list',
      content: [
        'Verify credentials: admin / admin123',
        'Check MFA code is current (30-second window)',
        'View MFA code in Docker logs: docker-compose logs login-api | grep mfa_code',
        'Ensure system time is synchronized (TOTP requires accurate time)',
        'Check Redis is running: docker-compose ps redis',
      ],
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Generate MFA code manually
docker exec login-api python -c "import pyotp; print(pyotp.TOTP('DEVSECOPSTWENTYFOURHACKINGLAB', interval=30).now())"

# Check Redis connectivity
docker exec redis redis-cli ping
# Should return: PONG`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Attack Scripts Not Working',
    },
    {
      type: 'paragraph',
      content: 'Python attack scripts fail with import or connection errors.',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Install dependencies
cd attacks/brute-force
pip install -r requirements.txt

# Verify backend is accessible
curl http://localhost:8000/health

# Check for port conflicts or firewall blocking
telnet localhost 8000`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Metrics Not Appearing',
    },
    {
      type: 'paragraph',
      content: 'Grafana shows no data or Prometheus has no targets.',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq

# Verify metrics endpoints
curl http://localhost:8080/metrics
curl http://localhost:8002/metrics

# Restart Prometheus
docker-compose restart prometheus

# Check Grafana datasource
# Navigate to: http://localhost:3000/datasources
# Ensure Prometheus datasource URL is: http://prometheus:9090`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Incident Bot Not Responding',
    },
    {
      type: 'paragraph',
      content: 'Alerts fire but incident bot doesn\'t execute runbooks.',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Check incident bot logs
docker-compose logs incident-bot

# Verify runbooks loaded
curl http://localhost:5002/stats | jq

# Check Alertmanager routing
curl http://localhost:9093/api/v2/status | jq

# Test webhook manually
curl -X POST http://localhost:5002/webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "alerts": [{
      "labels": {
        "alertname": "LoginFailureSpike",
        "severity": "warning",
        "category": "brute-force"
      }
    }]
  }'`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Frontend Build Fails',
    },
    {
      type: 'paragraph',
      content: 'npm run build or npm run dev fails with errors.',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite

# Check Node version (requires 18+)
node --version

# Try with legacy OpenSSL (if Node 18 on older systems)
export NODE_OPTIONS=--openssl-legacy-provider
npm run dev`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Docker Out of Memory',
    },
    {
      type: 'paragraph',
      content: 'Services crash or fail to start due to memory limits.',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Check Docker memory allocation
docker stats

# Increase Docker Desktop memory:
# Settings → Resources → Memory → Increase to 4GB+

# Reduce running services (start only what you need)
docker-compose up -d login-api api-gateway user-service redis prometheus grafana`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Database/Redis Connection Errors',
    },
    {
      type: 'paragraph',
      content: 'Services fail with Redis connection errors.',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis

# Verify Redis network connectivity from service
docker exec login-api ping redis`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Clean Restart',
    },
    {
      type: 'paragraph',
      content: 'When all else fails, perform a complete clean restart:',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Stop all services and remove volumes
docker-compose down -v

# Remove all images (optional, forces rebuild)
docker-compose down --rmi all

# Rebuild and start
docker-compose build --no-cache
docker-compose up -d

# Verify all services
docker-compose ps
curl http://localhost:8080/health`,
    },
    {
      type: 'warning',
      content: 'Using -v flag removes ALL volumes including Redis data. You will lose session data, banned IPs, and any persistent state.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'FAQ',
    },
    {
      type: 'paragraph',
      content: 'Frequently asked questions:',
    },
    {
      type: 'table',
      content: {
        headers: ['Question', 'Answer'],
        rows: [
          ['Where do I find MFA codes?', 'Docker logs: docker-compose logs login-api | grep mfa_code'],
          ['How do I reset the demo environment?', 'docker-compose down -v && docker-compose up -d'],
          ['Why are attacks not working?', 'Check backend is running: curl http://localhost:8000/health'],
          ['How do I view service logs?', 'docker-compose logs -f <service-name>'],
          ['Can I change ports?', 'Yes, edit docker-compose.yml ports section'],
          ['How do I access Grafana?', 'http://localhost:3000 (admin/admin)'],
          ['Where are incident reports?', 'docker exec incident-bot ls /app/reports/'],
          ['How do I add new attacks?', 'See attacks/ directory, copy existing structure'],
        ],
      },
    },
  ],
}
