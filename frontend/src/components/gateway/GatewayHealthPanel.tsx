/**
 * Gateway Health Panel Component
 *
 * Displays API Gateway health metrics including status, uptime, and connection pool
 */

import { useState, useEffect } from 'react'
import { Activity, AlertTriangle, CheckCircle, XCircle, Wifi, WifiOff, Server } from 'lucide-react'
import gatewayService, { type GatewayHealth } from '@/services/gatewayService'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { cn } from '@/utils/cn'

export function GatewayHealthPanel() {
  const [health, setHealth] = useState<GatewayHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch health data
  const fetchHealth = async () => {
    try {
      setError(null)
      const data = await gatewayService.getHealth()
      setHealth(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gateway health')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchHealth()
  }, [])

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchHealth, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <LoadingSkeleton variant="card" />
  }

  if (!health) {
    return (
      <div className="rounded-lg bg-cyber-surface border border-cyber-border p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-500 mb-1">Unable to Load Gateway Health</h4>
            <p className="text-sm text-gray-400">{error || 'Unknown error occurred'}</p>
          </div>
        </div>
      </div>
    )
  }

  // Status icon and color
  const StatusIcon = health.status === 'healthy' ? CheckCircle : health.status === 'degraded' ? AlertTriangle : XCircle
  const statusColor = health.status === 'healthy' ? 'text-green-500' : health.status === 'degraded' ? 'text-yellow-500' : 'text-red-500'

  // Circuit breaker icon
  const CircuitIcon = health.circuit_breaker.state === 'closed' ? Wifi : WifiOff

  return (
    <div className="rounded-lg bg-cyber-surface border border-cyber-border p-6">
      {/* Header with Status */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-primary/10 border border-cyber-primary/30">
            <Server className="w-6 h-6 text-cyber-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Gateway Health</h3>
            <p className="text-sm text-gray-400">API Gateway monitoring</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={cn('flex items-center gap-2 px-4 py-2 rounded-lg border', gatewayService.getStatusColor(health.status))}>
          <StatusIcon className={cn('w-5 h-5', statusColor)} />
          <span className={cn('font-semibold text-sm uppercase', statusColor)}>
            {health.status}
          </span>
        </div>
      </div>

      {/* Uptime */}
      <div className="mb-6 p-4 rounded-lg bg-cyber-bg border border-cyber-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Uptime</span>
          <span className="text-lg font-bold text-white">
            {gatewayService.formatUptime(health.uptime_seconds)}
          </span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Requests */}
        <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Total Requests</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {health.total_requests.toLocaleString()}
          </p>
        </div>

        {/* Error Rate */}
        <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Error Rate</span>
          </div>
          <p className={cn(
            'text-2xl font-bold',
            health.error_rate > 0.1 ? 'text-red-500' : health.error_rate > 0.05 ? 'text-yellow-500' : 'text-green-500'
          )}>
            {gatewayService.formatPercentage(health.error_rate)}
          </p>
        </div>

        {/* Avg Response Time */}
        <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Avg Response Time</span>
          </div>
          <p className={cn(
            'text-2xl font-bold',
            health.avg_response_time_ms > 200 ? 'text-yellow-500' : 'text-green-500'
          )}>
            {health.avg_response_time_ms.toFixed(1)}ms
          </p>
        </div>

        {/* Connection Pool Utilization */}
        <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Pool Utilization</span>
          </div>
          <p className={cn(
            'text-2xl font-bold',
            health.connection_pool.utilization > 0.8 ? 'text-red-500' : health.connection_pool.utilization > 0.6 ? 'text-yellow-500' : 'text-green-500'
          )}>
            {gatewayService.formatPercentage(health.connection_pool.utilization)}
          </p>
        </div>
      </div>

      {/* Connection Pool Visualization */}
      <div className="mb-6 p-4 rounded-lg bg-cyber-bg border border-cyber-border">
        <h4 className="text-sm font-semibold text-white mb-3">Connection Pool</h4>

        {/* Pool Stats */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Active: <span className="text-white font-mono">{health.connection_pool.active}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-400">Idle: <span className="text-white font-mono">{health.connection_pool.idle}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-gray-400">Max: <span className="text-white font-mono">{health.connection_pool.max}</span></span>
          </div>
        </div>

        {/* Pool Bar */}
        <div className="relative h-8 rounded-lg bg-gray-700 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-green-500 transition-all duration-300"
            style={{ width: `${(health.connection_pool.active / health.connection_pool.max) * 100}%` }}
          />
          <div
            className="absolute inset-y-0 bg-blue-500 transition-all duration-300"
            style={{
              left: `${(health.connection_pool.active / health.connection_pool.max) * 100}%`,
              width: `${(health.connection_pool.idle / health.connection_pool.max) * 100}%`
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {health.connection_pool.active + health.connection_pool.idle} / {health.connection_pool.max}
            </span>
          </div>
        </div>
      </div>

      {/* Circuit Breaker Status */}
      <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CircuitIcon className={cn('w-5 h-5', gatewayService.getCircuitBreakerColor(health.circuit_breaker.state))} />
            <div>
              <h4 className="text-sm font-semibold text-white">Circuit Breaker</h4>
              <p className="text-xs text-gray-400">
                State: <span className={cn('font-mono', gatewayService.getCircuitBreakerColor(health.circuit_breaker.state))}>
                  {health.circuit_breaker.state.toUpperCase()}
                </span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Failures</p>
            <p className={cn(
              'text-xl font-bold',
              health.circuit_breaker.failure_count > 0 ? 'text-red-500' : 'text-green-500'
            )}>
              {health.circuit_breaker.failure_count}
            </p>
          </div>
        </div>
        {health.circuit_breaker.last_failure_time && (
          <p className="text-xs text-gray-500 mt-2">
            Last failure: {new Date(health.circuit_breaker.last_failure_time).toLocaleString()}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-cyber-border">
        <p className="text-xs text-gray-500">
          Auto-refreshes every 5 seconds • Last updated: {new Date(health.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
