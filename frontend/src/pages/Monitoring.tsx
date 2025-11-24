/**
 * Monitoring Page
 *
 * Security monitoring dashboard with real-time metrics and incident tracking
 */

import { useState } from 'react'
import { Activity, AlertCircle, BarChart3, Server, Shield } from 'lucide-react'
import { useBackendStatus } from '@/hooks/useBackendStatus'
import { useMetrics } from '@/hooks/useMetrics'
import { useIncidents } from '@/hooks/useIncidents'
import { MetricsGrid } from '@/components/MetricsGrid'
import { MetricsChart } from '@/components/MetricsChart'
import { IncidentTimeline } from '@/components/IncidentTimeline'
import { IncidentStats } from '@/components/IncidentStats'
import { GrafanaDashboardViewer } from '@/components/GrafanaDashboardViewer'
import { ServiceHealthPanel } from '@/components/ServiceHealthPanel'
import { IdsAlertsPanel } from '@/components/ids/IdsAlertsPanel'
import { GatewayHealthPanel } from '@/components/gateway/GatewayHealthPanel'
import { JwtValidationStats } from '@/components/gateway/JwtValidationStats'
import { cn } from '@/utils/cn'

type Tab = 'metrics' | 'incidents' | 'grafana' | 'health'

interface TabConfig {
  id: Tab
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const TABS: TabConfig[] = [
  {
    id: 'metrics',
    label: 'Real-time Metrics',
    icon: Activity,
    description: 'Live security metrics from Prometheus',
  },
  {
    id: 'incidents',
    label: 'Incident Timeline',
    icon: AlertCircle,
    description: 'Security incidents and automated responses',
  },
  {
    id: 'grafana',
    label: 'Grafana Dashboards',
    icon: BarChart3,
    description: 'Advanced visualization dashboards',
  },
  {
    id: 'health',
    label: 'Service Health',
    icon: Server,
    description: 'Backend service status monitoring',
  },
]

export function Monitoring() {
  const [activeTab, setActiveTab] = useState<Tab>('metrics')
  const { isConnected, services } = useBackendStatus()

  // Data hooks (only fetch when needed)
  const metricsData = useMetrics(activeTab === 'metrics')
  const incidentsData = useIncidents(activeTab === 'incidents')

  const showBackendWarning = !isConnected || !services.prometheus

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Security Monitoring</h1>
        <p className="text-gray-400">
          Real-time visibility into security metrics, incidents, and system health
        </p>
      </div>

      {/* Backend Warning */}
      {showBackendWarning && (
        <div className="mb-6 p-4 rounded-lg bg-cyber-warning/10 border border-cyber-warning/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-cyber-warning flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-cyber-warning mb-1">Backend Not Connected</h3>
              <p className="text-sm text-gray-400 mb-2">
                Monitoring features require Prometheus, Grafana, and Incident Bot services.
              </p>
              <code className="block px-3 py-2 bg-cyber-bg border border-cyber-border rounded text-sm text-cyber-primary">
                docker-compose up -d prometheus grafana incident-bot
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-cyber-border">
          <nav className="flex gap-2 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap',
                    isActive
                      ? 'border-cyber-primary text-cyber-primary'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {TABS.find((t) => t.id === activeTab)?.description}
        </p>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'metrics' && (
          <>
            <MetricsGrid metrics={metricsData.metrics} loading={metricsData.loading} />
            <MetricsChart />

            {/* Gateway & Network Security Section */}
            <section className="mt-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-cyber-primary" />
                Gateway & Network Security
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Left: Gateway Health */}
                <GatewayHealthPanel />

                {/* Right: JWT Validation */}
                <JwtValidationStats />
              </div>

              {/* Full-width: IDS Alerts */}
              <div className="mt-6">
                <IdsAlertsPanel />
              </div>
            </section>
          </>
        )}

        {activeTab === 'incidents' && (
          <>
            <IncidentStats stats={incidentsData.stats} loading={incidentsData.loading} />
            <IncidentTimeline incidents={incidentsData.incidents} loading={incidentsData.loading} />
          </>
        )}

        {activeTab === 'grafana' && <GrafanaDashboardViewer />}

        {activeTab === 'health' && <ServiceHealthPanel />}
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 rounded-lg bg-cyber-surface border border-cyber-border">
        <h3 className="text-sm font-semibold text-gray-400 mb-2">About Security Monitoring</h3>
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong className="text-gray-400">Metrics:</strong> Auto-refreshes every 15 seconds from Prometheus
          </p>
          <p>
            <strong className="text-gray-400">Incidents:</strong> Auto-refreshes every 5 seconds from Incident Bot
          </p>
          <p>
            <strong className="text-gray-400">Grafana:</strong> Embedded dashboards in kiosk mode (click "Open in new tab" for full access)
          </p>
          <p>
            <strong className="text-gray-400">Service Health:</strong> Monitors all backend services and their availability
          </p>
        </div>
      </div>
    </div>
  )
}
