/**
 * Incident Response System Guide
 */

import type { DocGuide } from '../docs'

export const incidentResponseGuide: DocGuide = {
  slug: 'incident-response',
  title: 'Incident Response System',
  description: 'Automated detection and response to security incidents',
  category: 'defense',
  lastUpdated: '2025-11-14',
  content: [
    {
      type: 'heading',
      level: 1,
      content: 'Incident Response System',
    },
    {
      type: 'paragraph',
      content: 'The DevSecOps Hacking Lab implements an automated incident response system that detects attacks in real-time and executes predefined runbooks to contain and mitigate threats.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'Architecture',
    },
    {
      type: 'code',
      language: 'text',
      content: `Prometheus → Alert Rules → Alertmanager → Incident Bot
                                            ↓
                                       Runbook Engine
                                            ↓
                         ┌──────────────────┼──────────────────┐
                         ↓                  ↓                  ↓
                   Notify Slack      Ban IP in Redis    Generate Report
                   Send Email        Update Firewall    Create Ticket`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Alert Flow',
    },
    {
      type: 'list',
      content: [
        'Services export metrics to Prometheus (/metrics endpoints)',
        'Prometheus evaluates alert rules every 15 seconds',
        'When threshold exceeded, alert fires to Alertmanager',
        'Alertmanager routes alert to Incident Bot via webhook',
        'Incident Bot matches alert to runbook based on labels',
        'Runbook actions execute sequentially',
        'Results logged and report generated',
      ],
    },
    {
      type: 'heading',
      level: 2,
      content: 'Runbook Structure',
    },
    {
      type: 'code',
      language: 'json',
      content: `{
  "name": "Brute Force Response",
  "description": "Automated response to login brute force attacks",
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
        "message": "Brute force attack detected from {source_ip}",
        "channels": ["security", "ops"]
      }
    },
    {
      "type": "ban_ip",
      "params": {
        "duration": 3600,
        "reason": "brute_force_attack"
      }
    },
    {
      "type": "report",
      "params": {
        "format": "json",
        "include_metrics": true
      }
    }
  ]
}`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Available Actions',
    },
    {
      type: 'table',
      content: {
        headers: ['Action Type', 'Description', 'Parameters'],
        rows: [
          ['notify', 'Send alert notification', 'message, channels, severity'],
          ['ban_ip', 'Block IP address in Redis', 'duration, reason'],
          ['report', 'Generate incident report', 'format (json/md), include_metrics'],
          ['remediate', 'Execute remediation script', 'script, args'],
        ],
      },
    },
    {
      type: 'heading',
      level: 2,
      content: 'Prebuilt Runbooks',
    },
    {
      type: 'paragraph',
      content: 'The system includes 8 predefined runbooks:',
    },
    {
      type: 'list',
      content: [
        'brute-force-response.json - Login enumeration attacks',
        'mfa-bypass-response.json - TOTP brute force attempts',
        'idor-response.json - Unauthorized profile access',
        'gateway-bypass-response.json - Direct service access',
        'rate-limit-response.json - Rate limit violations',
        'sql-injection-response.json - WAF SQL injection blocks',
        'xss-response.json - Cross-site scripting attempts',
        'credential-leak-response.json - Credential stuffing attacks',
      ],
    },
    {
      type: 'heading',
      level: 2,
      content: 'Alert Severity Levels',
    },
    {
      type: 'table',
      content: {
        headers: ['Severity', 'Response Time', 'Actions', 'Examples'],
        rows: [
          ['critical', 'Immediate', 'Ban IP, Page on-call, Lock accounts', 'Active breach, data exfiltration'],
          ['warning', '< 5 minutes', 'Ban IP, Notify team, Generate report', 'Brute force, IDOR, MFA bypass'],
          ['info', '< 1 hour', 'Log, Report, Monitor', 'Rate limit hits, WAF blocks'],
        ],
      },
    },
    {
      type: 'heading',
      level: 2,
      content: 'Incident Bot API',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Get incident bot stats
curl http://localhost:5002/stats | jq
{
  "runbooks_loaded": 8,
  "incidents_handled": 42,
  "uptime_seconds": 3600
}

# Get incident history
curl http://localhost:5002/incidents | jq
[
  {
    "id": "inc-20251114-001",
    "alert_name": "LoginFailureSpike",
    "severity": "warning",
    "timestamp": "2025-11-14T10:30:00Z",
    "source_ip": "192.168.1.100",
    "actions_executed": ["notify", "ban_ip", "report"],
    "status": "resolved"
  }
]

# Manually trigger incident simulation
cd monitoring/incident-bot
python simulate_incident.py --attack brute-force`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Report Generation',
    },
    {
      type: 'paragraph',
      content: 'Incident reports are auto-generated in multiple formats:',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Reports stored in container
docker exec incident-bot ls /app/reports/
incident-20251114-103000-brute-force.json
incident-20251114-103000-brute-force.md

# View report
docker exec incident-bot cat /app/reports/incident-20251114-103000-brute-force.json`,
    },
    {
      type: 'paragraph',
      content: 'Report contents include:',
    },
    {
      type: 'list',
      content: [
        'Incident metadata (ID, timestamp, severity, category)',
        'Alert details (name, labels, annotations)',
        'Source information (IP, user agent, geolocation)',
        'Actions taken (notifications sent, IPs banned, etc.)',
        'Prometheus metrics snapshot at time of incident',
        'Timeline of events',
        'Remediation recommendations',
      ],
    },
    {
      type: 'heading',
      level: 2,
      content: 'Integration with Grafana',
    },
    {
      type: 'paragraph',
      content: 'The Incident Response dashboard in Grafana visualizes:',
    },
    {
      type: 'list',
      content: [
        'Incident timeline (past 24 hours)',
        'Incidents by category (pie chart)',
        'Response times (histogram)',
        'Banned IPs (table)',
        'Runbook execution stats',
        'Alert fire rate',
      ],
    },
    {
      type: 'heading',
      level: 2,
      content: 'Creating Custom Runbooks',
    },
    {
      type: 'code',
      language: 'json',
      content: `{
  "name": "Custom Attack Response",
  "description": "Your custom runbook",
  "trigger": {
    "alertname": "YourAlertName",
    "severity": "warning",
    "category": "custom"
  },
  "priority": 10,
  "actions": [
    {
      "type": "notify",
      "params": {
        "message": "Custom attack detected: {{.Labels.instance}}",
        "channels": ["security"]
      }
    },
    {
      "type": "ban_ip",
      "params": {
        "duration": 7200,
        "reason": "custom_attack"
      }
    },
    {
      "type": "report",
      "params": {
        "format": "json"
      }
    }
  ]
}`,
    },
    {
      type: 'paragraph',
      content: 'Save to monitoring/incident-bot/runbooks/ and restart incident-bot service.',
    },
    {
      type: 'info',
      content: 'Runbooks are matched by priority (higher number = higher priority). If multiple runbooks match an alert, the highest priority runbook is executed.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'Testing Incident Response',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Simulate brute force attack
cd monitoring/incident-bot
python simulate_incident.py --attack brute-force

# Trigger all attack scenarios
python simulate_incident.py --attack all

# Advanced credential leak demo
python demo_credential_leak.py

# Watch Grafana Incident Response dashboard
open http://localhost:3000/d/incident-response

# Monitor incident bot logs
docker-compose logs -f incident-bot`,
    },
    {
      type: 'warning',
      content: 'IP banning is stored in Redis but not actively enforced by the gateway in the current demo. Integration with gateway middleware or iptables is required for active blocking.',
    },
  ],
}
