/**
 * Grafana Dashboard Viewer Component
 *
 * Embeds Grafana dashboards in iframe
 */

import { useState } from 'react'
import { BarChart3, AlertCircle } from 'lucide-react'
import { ENDPOINTS } from '@/utils/constants'
import { useBackendStatus } from '@/hooks/useBackendStatus'
import { cn } from '@/utils/cn'

interface GrafanaDashboardViewerProps {
  className?: string
}

interface Dashboard {
  name: string
  url: string
  description: string
}

const DASHBOARDS: Dashboard[] = [
  {
    name: 'Auth Security',
    url: ENDPOINTS.GRAFANA.DASHBOARDS.AUTH_SECURITY,
    description: 'Login metrics, MFA attempts, JWT validation, rate limiting',
  },
  {
    name: 'Attack Visibility',
    url: ENDPOINTS.GRAFANA.DASHBOARDS.ATTACK_VISIBILITY,
    description: 'IDOR attempts, direct access, WAF blocks, rate limit violations',
  },
  {
    name: 'Service Mesh Security',
    url: ENDPOINTS.GRAFANA.DASHBOARDS.SERVICE_MESH,
    description: 'Service health, security gauges, performance metrics',
  },
  {
    name: 'Incident Response',
    url: ENDPOINTS.GRAFANA.DASHBOARDS.INCIDENT_RESPONSE,
    description: 'Incident timeline, automated actions, runbook execution',
  },
]

export function GrafanaDashboardViewer({ className }: GrafanaDashboardViewerProps) {
  const [selectedDashboard, setSelectedDashboard] = useState(DASHBOARDS[0])
  const { services } = useBackendStatus()

  // Append kiosk mode and dark theme parameters
  const iframeUrl = `${selectedDashboard.url}?kiosk&theme=dark`

  if (!services.grafana) {
    return (
      <div className={cn('p-8 text-center rounded-lg bg-cyber-surface border border-cyber-border', className)}>
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-cyber-warning" />
        <h3 className="text-lg font-semibold mb-2">Grafana Not Connected</h3>
        <p className="text-gray-400 mb-4">
          Start Grafana to view dashboards:
        </p>
        <code className="px-3 py-1 bg-cyber-bg border border-cyber-border rounded text-sm text-cyber-primary">
          docker-compose up -d grafana
        </code>
        <p className="text-xs text-gray-500 mt-4">
          Default credentials: admin / admin
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dashboard Selector */}
      <div className="p-4 rounded-lg bg-cyber-surface border border-cyber-border">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-cyber-primary" />
          <h3 className="text-lg font-semibold">Select Dashboard</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {DASHBOARDS.map((dashboard) => (
            <button
              key={dashboard.name}
              onClick={() => setSelectedDashboard(dashboard)}
              className={cn(
                'p-3 rounded-lg text-left transition-all',
                'border',
                selectedDashboard.name === dashboard.name
                  ? 'bg-cyber-primary/10 border-cyber-primary text-white'
                  : 'bg-cyber-bg border-cyber-border text-gray-400 hover:border-cyber-primary/50'
              )}
            >
              <h4 className="font-semibold text-sm mb-1">{dashboard.name}</h4>
              <p className="text-xs opacity-80">{dashboard.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Iframe */}
      <div className="rounded-lg bg-cyber-surface border border-cyber-border overflow-hidden">
        <div className="p-3 bg-cyber-bg border-b border-cyber-border">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{selectedDashboard.name}</h4>
            <a
              href={selectedDashboard.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyber-primary hover:underline"
            >
              Open in new tab
            </a>
          </div>
        </div>

        <iframe
          src={iframeUrl}
          title={`Grafana Dashboard - ${selectedDashboard.name}`}
          className="w-full border-0"
          style={{ height: '600px', minHeight: '500px' }}
          loading="lazy"
        />
      </div>

      {/* Help Text */}
      <div className="p-3 rounded-lg bg-cyber-bg border border-cyber-border">
        <p className="text-xs text-gray-500">
          <strong className="text-gray-400">Tip:</strong> Dashboards are in kiosk mode for clean embedding.
          Click "Open in new tab" for full Grafana interface with editing capabilities.
        </p>
      </div>
    </div>
  )
}
