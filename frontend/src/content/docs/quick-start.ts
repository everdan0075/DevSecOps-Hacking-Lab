/**
 * Quick Start Guide
 */

import type { DocGuide } from '../docs'

export const quickStartGuide: DocGuide = {
  slug: 'quick-start',
  title: 'Quick Start Guide',
  description: 'Get the DevSecOps Hacking Lab up and running in 5 minutes',
  category: 'getting-started',
  lastUpdated: '2025-11-14',
  content: [
    {
      type: 'heading',
      level: 1,
      content: 'Quick Start Guide',
    },
    {
      type: 'paragraph',
      content: 'Welcome to the DevSecOps Hacking Lab! This guide will help you set up the environment and run your first attack in under 5 minutes.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'Prerequisites',
    },
    {
      type: 'paragraph',
      content: 'Before starting, ensure you have the following installed on your system:',
    },
    {
      type: 'list',
      content: [
        'Docker Desktop (version 20.10 or higher)',
        'Docker Compose (version 2.0 or higher)',
        'Node.js (version 18 or higher) - for frontend development',
        'Git for version control',
        'At least 4GB of available RAM',
        'Ports 8000, 8002, 8080, 9090, 3000, 5002, 6379 available',
      ],
    },
    {
      type: 'heading',
      level: 2,
      content: 'Installation',
    },
    {
      type: 'paragraph',
      content: 'Follow these steps to clone and start the lab environment:',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Clone the repository
git clone https://github.com/yourusername/DevSecOps-Hacking-Lab.git
cd DevSecOps-Hacking-Lab

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps`,
    },
    {
      type: 'info',
      content: 'Initial startup may take 2-3 minutes as Docker pulls images and builds containers. Subsequent starts will be much faster.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'Verify Installation',
    },
    {
      type: 'paragraph',
      content: 'Check that all services are healthy:',
    },
    {
      type: 'code',
      language: 'bash',
      content: `# Check service health
curl http://localhost:8000/health  # Auth Service
curl http://localhost:8080/health  # API Gateway
curl http://localhost:8002/health  # User Service
curl http://localhost:5002/health  # Incident Bot

# All should return: {"status": "healthy"}`,
    },
    {
      type: 'heading',
      level: 2,
      content: 'Access the Frontend',
    },
    {
      type: 'paragraph',
      content: 'For local development, start the React frontend:',
    },
    {
      type: 'code',
      language: 'bash',
      content: `cd frontend
npm install
npm run dev`,
    },
    {
      type: 'paragraph',
      content: 'Open your browser to http://localhost:5173. You should see the DevSecOps Hacking Lab homepage with a green "Connected" status indicator.',
    },
    {
      type: 'heading',
      level: 2,
      content: 'First Steps',
    },
    {
      type: 'list',
      content: [
        'Navigate to Attack Playground to see available attack scenarios',
        'Click "Authenticate" to get a JWT token (username: admin, password: admin123)',
        'Complete MFA verification using the code from Docker logs',
        'Launch your first attack - try the Brute Force Attack',
        'View real-time metrics in the Monitoring Dashboard',
        'Check Grafana at http://localhost:3000 (admin/admin) for detailed visualizations',
      ],
    },
    {
      type: 'heading',
      level: 2,
      content: 'Default Credentials',
    },
    {
      type: 'warning',
      content: 'These credentials are for the demo environment ONLY. Never use default credentials in production!',
    },
    {
      type: 'table',
      content: {
        headers: ['Service', 'Username', 'Password', 'Notes'],
        rows: [
          ['Auth Service', 'admin', 'admin123', 'MFA enabled (TOTP)'],
          ['Grafana', 'admin', 'admin', 'Change on first login'],
          ['User Service', 'user1', 'password1', 'Vulnerable test account'],
          ['User Service', 'user2', 'password2', 'Vulnerable test account'],
        ],
      },
    },
    {
      type: 'heading',
      level: 2,
      content: 'Next Steps',
    },
    {
      type: 'paragraph',
      content: 'Now that your environment is running, explore these topics:',
    },
    {
      type: 'list',
      content: [
        'Read the Architecture Overview to understand the service mesh',
        'Study individual Attack Guides to learn exploitation techniques',
        'Review Defense & Mitigation strategies to understand security controls',
        'Explore the API Reference for integration examples',
      ],
    },
  ],
}
