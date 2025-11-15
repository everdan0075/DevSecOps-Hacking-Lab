/**
 * Service Health Panel Component
 *
 * Displays health status of all backend services
 */

import { Server, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { useBackendStatus } from '@/hooks/useBackendStatus'
import { cn } from '@/utils/cn'

interface ServiceHealthPanelProps {
  className?: string
}

interface ServiceInfo {
  name: string
  key: keyof ReturnType<typeof useBackendStatus>['services']
  port: string
  url?: string
  description: string
}

const SERVICES: ServiceInfo[] = [
  {
    name: 'API Gateway',
    key: 'gateway',
    port: '8080',
    url: 'http://localhost:8080',
    description: 'Central routing, JWT validation, rate limiting, WAF',
  },
  {
    name: 'Auth Service',
    key: 'auth',
    port: '8000',
    url: 'http://localhost:8000',
    description: 'JWT authentication, MFA, token management',
  },
  {
    name: 'User Service',
    key: 'user_service',
    port: '8002',
    url: 'http://localhost:8002',
    description: 'User profiles and settings (intentionally vulnerable)',
  },
  {
    name: 'Prometheus',
    key: 'prometheus',
    port: '9090',
    url: 'http://localhost:9090',
    description: 'Metrics collection and querying',
  },
  {
    name: 'Grafana',
    key: 'grafana',
    port: '3000',
    url: 'http://localhost:3000',
    description: 'Metrics visualization dashboards',
  },
  {
    name: 'Incident Bot',
    key: 'incident_bot',
    port: '5002',
    url: 'http://localhost:5002',
    description: 'Automated incident response system',
  },
]

export function ServiceHealthPanel({ className }: ServiceHealthPanelProps) {
  const { services, latency, lastCheck, isChecking, checkStatus } = useBackendStatus()

  const timeSinceCheck = Math.floor((Date.now() - lastCheck) / 1000)
  const onlineCount = Object.values(services).filter(Boolean).length
  const totalCount = Object.keys(services).length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Header */}
      <div className="p-4 rounded-lg bg-cyber-surface border border-cyber-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Service Health Overview</h3>
            <p className="text-sm text-gray-400">
              {onlineCount} of {totalCount} services online
              {latency && ` • ${latency}ms latency`}
            </p>
          </div>
          <button
            onClick={checkStatus}
            disabled={isChecking}
            className={cn(
              'p-2 rounded-lg bg-cyber-bg border border-cyber-border',
              'hover:border-cyber-primary/50 transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title="Refresh service status"
          >
            <RefreshCw className={cn('w-4 h-4', isChecking && 'animate-spin')} />
          </button>
        </div>

        {/* Health Bar */}
        <div className="mt-3">
          <div className="w-full bg-cyber-bg rounded-full h-2">
            <div
              className={cn(
                'rounded-full h-2 transition-all',
                onlineCount === totalCount ? 'bg-cyber-success' : 'bg-cyber-warning'
              )}
              style={{ width: `${(onlineCount / totalCount) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Last checked {timeSinceCheck}s ago
          </p>
        </div>
      </div>

      {/* Service List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SERVICES.map((service) => (
          <ServiceCard
            key={service.key}
            service={service}
            isOnline={services[service.key]}
          />
        ))}
      </div>

      {/* Help Text */}
      {onlineCount < totalCount && (
        <div className="p-4 rounded-lg bg-cyber-warning/10 border border-cyber-warning/30">
          <h4 className="font-semibold text-cyber-warning mb-2">Some Services Offline</h4>
          <p className="text-sm text-gray-400 mb-2">
            To start all services, run:
          </p>
          <code className="block px-3 py-2 bg-cyber-bg border border-cyber-border rounded text-sm text-cyber-primary">
            docker-compose up -d
          </code>
          <p className="text-xs text-gray-500 mt-2">
            Check service logs: <code className="text-cyber-primary">docker-compose logs &lt;service-name&gt;</code>
          </p>
        </div>
      )}
    </div>
  )
}

interface ServiceCardProps {
  service: ServiceInfo
  isOnline: boolean
}

function ServiceCard({ service, isOnline }: ServiceCardProps) {
  const StatusIcon = isOnline ? CheckCircle : XCircle
  const statusColor = isOnline ? 'text-cyber-success' : 'text-gray-500'
  const borderColor = isOnline ? 'border-cyber-success/30' : 'border-cyber-border'
  const bgColor = isOnline ? 'bg-cyber-success/5' : 'bg-cyber-surface'

  return (
    <div className={cn('p-4 rounded-lg border transition-all', bgColor, borderColor)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-gray-400" />
          <h4 className="font-semibold text-white">{service.name}</h4>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn('w-2 h-2 rounded-full', isOnline ? 'bg-cyber-success' : 'bg-gray-500')} />
          <StatusIcon className={cn('w-4 h-4', statusColor)} />
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3">{service.description}</p>

      <div className="flex items-center justify-between">
        <div className="text-xs">
          <span className="text-gray-500">Port:</span>{' '}
          <span className="text-white font-medium">{service.port}</span>
        </div>
        <div className="text-xs">
          <span className="text-gray-500">Status:</span>{' '}
          <span className={cn('font-medium', statusColor)}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {isOnline && service.url && (
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'mt-3 flex items-center justify-center gap-1.5',
            'px-3 py-1.5 rounded-lg',
            'bg-cyber-bg border border-cyber-border',
            'hover:border-cyber-primary/50 transition-all',
            'text-xs text-cyber-primary'
          )}
        >
          <span>Open Service</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}
