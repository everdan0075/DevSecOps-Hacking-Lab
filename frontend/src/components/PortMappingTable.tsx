/**
 * PortMappingTable Component
 *
 * Displays all services with their ports, descriptions, and health status
 * with test endpoint functionality
 */

import { useState, useEffect, useCallback } from 'react'
import { Server, CheckCircle, XCircle, Loader2, AlertCircle, Play } from 'lucide-react'
import { cn } from '@/utils/cn'
import axios from 'axios'

interface Service {
  id: string
  name: string
  port: number
  description: string
  healthEndpoint: string
  category: 'Gateway' | 'Application' | 'Monitoring' | 'Storage' | 'Proxy'
  vulnerable?: boolean
}

const services: Service[] = [
  {
    id: 'traefik',
    name: 'Traefik',
    port: 8443,
    description: 'Reverse proxy with TLS termination',
    healthEndpoint: 'https://localhost:8443/health',
    category: 'Proxy',
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    port: 8080,
    description: 'Central entry point with security controls (JWT, WAF, rate limiting)',
    healthEndpoint: '/health',
    category: 'Gateway',
  },
  {
    id: 'auth-service',
    name: 'Auth Service (login-api)',
    port: 8000,
    description: 'JWT-based authentication with MFA and token management',
    healthEndpoint: '/direct/auth-service/health',
    category: 'Application',
  },
  {
    id: 'user-service',
    name: 'User Service',
    port: 8002,
    description: 'User management with intentional IDOR vulnerability',
    healthEndpoint: '/direct/user-service/health',
    category: 'Application',
    vulnerable: true,
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    port: 9090,
    description: 'Metrics collection and time-series database',
    healthEndpoint: '/prometheus/api/v1/status/config',
    category: 'Monitoring',
  },
  {
    id: 'grafana',
    name: 'Grafana',
    port: 3000,
    description: 'Visualization dashboards for metrics and security events',
    healthEndpoint: '/grafana/api/health',
    category: 'Monitoring',
  },
  {
    id: 'alertmanager',
    name: 'Alertmanager',
    port: 9093,
    description: 'Alert routing and notification management',
    healthEndpoint: 'http://localhost:9093/api/v2/status',
    category: 'Monitoring',
  },
  {
    id: 'incident-bot',
    name: 'Incident Bot',
    port: 5002,
    description: 'Automated incident response with runbook execution',
    healthEndpoint: '/incidents',
    category: 'Monitoring',
  },
  {
    id: 'redis',
    name: 'Redis',
    port: 6379,
    description: 'Session store, rate limiting, and IP ban management',
    healthEndpoint: '',
    category: 'Storage',
  },
]

interface PortMappingTableProps {
  onServiceSelect: (serviceId: string | null) => void
  selectedService: string | null
}

type HealthStatus = 'unknown' | 'checking' | 'healthy' | 'unhealthy'

export function PortMappingTable({ onServiceSelect, selectedService }: PortMappingTableProps) {
  const [healthStatus, setHealthStatus] = useState<Record<string, HealthStatus>>({})
  const [filter, setFilter] = useState<string>('all')

  const checkHealth = useCallback(async (service: Service) => {
    if (!service.healthEndpoint) {
      setHealthStatus(prev => ({ ...prev, [service.id]: 'unknown' }))
      return
    }

    setHealthStatus(prev => ({ ...prev, [service.id]: 'checking' }))

    try {
      const response = await axios.get(service.healthEndpoint, {
        timeout: 5000,
        validateStatus: (status) => status < 500, // Accept 2xx, 3xx, 4xx
      })

      if (response.status >= 200 && response.status < 400) {
        setHealthStatus(prev => ({ ...prev, [service.id]: 'healthy' }))
      } else {
        setHealthStatus(prev => ({ ...prev, [service.id]: 'unhealthy' }))
      }
    } catch {
      setHealthStatus(prev => ({ ...prev, [service.id]: 'unhealthy' }))
    }
  }, [])

  const checkAllHealth = useCallback(() => {
    services.forEach(service => {
      if (service.healthEndpoint) {
        checkHealth(service)
      }
    })
  }, [checkHealth])

  useEffect(() => {
    // Auto-check health on mount
    checkAllHealth()
  }, [checkAllHealth])

  const getStatusIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-cyber-success" />
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-cyber-danger" />
      case 'checking':
        return <Loader2 className="w-5 h-5 text-cyber-secondary animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return 'Healthy'
      case 'unhealthy':
        return 'Unhealthy'
      case 'checking':
        return 'Checking...'
      default:
        return 'Unknown'
    }
  }

  const categories = ['all', 'Gateway', 'Application', 'Monitoring', 'Storage', 'Proxy']
  const filteredServices = filter === 'all'
    ? services
    : services.filter(s => s.category === filter)

  return (
    <div>
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === cat
                  ? 'bg-cyber-primary text-cyber-bg'
                  : 'bg-cyber-bg border border-cyber-border text-gray-400 hover:border-cyber-primary/50'
              )}
            >
              {cat === 'all' ? 'All Services' : cat}
            </button>
          ))}
        </div>

        {/* Check All Button */}
        <button
          onClick={checkAllHealth}
          className="px-4 py-2 rounded-lg bg-cyber-surface border border-cyber-border hover:border-cyber-primary/50 transition-all text-sm flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Check All Health
        </button>
      </div>

      {/* Table */}
      <div className="card-glow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyber-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Service</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Port</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Category</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Description</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.map(service => (
              <tr
                key={service.id}
                onClick={() => onServiceSelect(selectedService === service.id ? null : service.id)}
                className={cn(
                  'border-b border-cyber-border/50 transition-all cursor-pointer',
                  selectedService === service.id
                    ? 'bg-cyber-primary/10'
                    : 'hover:bg-cyber-surface/50'
                )}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyber-secondary flex-shrink-0" />
                    <span className="font-medium text-gray-200">{service.name}</span>
                    {service.vulnerable && (
                      <span className="px-2 py-0.5 rounded text-xs bg-cyber-danger/20 text-cyber-danger border border-cyber-danger/30">
                        Vulnerable
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <code className="text-cyber-primary bg-black/30 px-2 py-1 rounded text-sm">
                    :{service.port}
                  </code>
                </td>
                <td className="py-3 px-4">
                  <span className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    service.category === 'Gateway' && 'bg-cyber-primary/20 text-cyber-primary',
                    service.category === 'Application' && 'bg-cyber-secondary/20 text-cyber-secondary',
                    service.category === 'Monitoring' && 'bg-cyber-warning/20 text-cyber-warning',
                    service.category === 'Storage' && 'bg-cyber-accent/20 text-cyber-accent',
                    service.category === 'Proxy' && 'bg-cyber-secondary/20 text-cyber-secondary'
                  )}>
                    {service.category}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <p className="text-sm text-gray-400">{service.description}</p>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    {getStatusIcon(healthStatus[service.id] || 'unknown')}
                    <span className="text-xs text-gray-400">
                      {getStatusText(healthStatus[service.id] || 'unknown')}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    {service.healthEndpoint ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          checkHealth(service)
                        }}
                        disabled={healthStatus[service.id] === 'checking'}
                        className={cn(
                          'px-3 py-1 rounded text-xs font-medium transition-all',
                          'bg-cyber-bg border border-cyber-border',
                          'hover:border-cyber-primary/50 hover:bg-cyber-primary/10',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        Test
                      </button>
                    ) : (
                      <span className="text-xs text-gray-600">N/A</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <p>
          Showing {filteredServices.length} of {services.length} services
        </p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-cyber-success" />
            <span>
              {Object.values(healthStatus).filter(s => s === 'healthy').length} Healthy
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-cyber-danger" />
            <span>
              {Object.values(healthStatus).filter(s => s === 'unhealthy').length} Unhealthy
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
