/**
 * IDS Alerts Panel Component
 *
 * Displays recent IDS alerts from Suricata with filtering and auto-refresh
 * Platform-aware: Shows live data on Linux, mock data on Windows
 */

import { useState, useEffect } from 'react'
import { Shield, ChevronDown, ChevronUp, Filter, AlertTriangle, Activity } from 'lucide-react'
import idsService, { type IdsAlert } from '@/services/idsService'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { cn } from '@/utils/cn'

export function IdsAlertsPanel() {
  const [alerts, setAlerts] = useState<IdsAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const isLinux = idsService.isAvailable()

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      setError(null)
      const data =
        severityFilter === 'all'
          ? await idsService.getRecentAlerts(50)
          : await idsService.getAlertsBySeverity(severityFilter)
      setAlerts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch IDS alerts')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchAlerts()
  }, [severityFilter])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchAlerts, 10000)
    return () => clearInterval(interval)
  }, [severityFilter])

  // Toggle expanded state
  const toggleExpand = (alertId: string) => {
    setExpandedAlert(expandedAlert === alertId ? null : alertId)
  }

  // Format timestamp as relative time
  const formatRelativeTime = (timestamp: string): string => {
    const now = Date.now()
    const time = new Date(timestamp).getTime()
    const diffMs = now - time

    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffDay > 0) return `${diffDay}d ago`
    if (diffHour > 0) return `${diffHour}h ago`
    if (diffMin > 0) return `${diffMin}m ago`
    return `${diffSec}s ago`
  }

  // Truncate signature for display
  const truncateSignature = (signature: string, maxLength: number = 50): string => {
    return signature.length > maxLength
      ? `${signature.substring(0, maxLength)}...`
      : signature
  }

  if (loading) {
    return <LoadingSkeleton variant="card" className="h-96" />
  }

  return (
    <div className="rounded-lg bg-cyber-surface border border-cyber-border p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-primary/10 border border-cyber-primary/30">
            <Shield className="w-6 h-6 text-cyber-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {isLinux ? '🐧 Live IDS Alerts' : '💻 Mock IDS Alerts'}
            </h3>
            <p className="text-sm text-gray-400">
              {isLinux
                ? 'Real-time alerts from Suricata IDS'
                : 'Linux-only feature - showing sample data'}
            </p>
          </div>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-cyber-bg border border-cyber-border text-white text-sm focus:outline-none focus:border-cyber-primary"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-500 mb-1">Error Loading Alerts</h4>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        </div>
      )}

      {/* Alerts Count */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
        <Activity className="w-4 h-4" />
        <span>
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''} in last 24 hours
        </span>
      </div>

      {/* Alerts Table */}
      {alerts.length === 0 ? (
        <div className="py-12 text-center">
          <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No alerts detected</p>
          <p className="text-sm text-gray-600 mt-1">Your network is secure</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {alerts.map((alert, index) => {
            const alertId = `${alert.timestamp}-${index}`
            const isExpanded = expandedAlert === alertId

            return (
              <div
                key={alertId}
                className="rounded-lg border border-cyber-border bg-cyber-bg hover:bg-cyber-bg/50 transition-colors"
              >
                {/* Alert Row */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => toggleExpand(alertId)}
                >
                  {/* Timestamp */}
                  <div className="flex-shrink-0 w-20">
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(alert.timestamp)}
                    </span>
                  </div>

                  {/* Source IP */}
                  <div className="flex-shrink-0 w-32">
                    <span className="text-sm font-mono text-white">{alert.src_ip}</span>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0">
                    <span className="text-gray-600">→</span>
                  </div>

                  {/* Destination IP */}
                  <div className="flex-shrink-0 w-32">
                    <span className="text-sm font-mono text-white">{alert.dest_ip}</span>
                  </div>

                  {/* Signature */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-300 truncate block">
                      {truncateSignature(alert.signature)}
                    </span>
                  </div>

                  {/* Category */}
                  <div className="flex-shrink-0 w-40">
                    <span className="text-xs text-gray-500">{alert.category}</span>
                  </div>

                  {/* Severity Badge */}
                  <div className="flex-shrink-0">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border',
                        idsService.getSeverityColor(alert.severity)
                      )}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>

                  {/* Protocol */}
                  <div className="flex-shrink-0 w-16">
                    <span className="text-xs font-mono text-gray-400">{alert.protocol}</span>
                  </div>

                  {/* Expand Icon */}
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-cyber-border space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Full Signature:</span>
                        <p className="text-white mt-1">{alert.signature}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Timestamp:</span>
                        <p className="text-white font-mono mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {(alert.src_port || alert.dest_port) && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {alert.src_port && (
                          <div>
                            <span className="text-gray-500">Source Port:</span>
                            <p className="text-white font-mono mt-1">{alert.src_port}</p>
                          </div>
                        )}
                        {alert.dest_port && (
                          <div>
                            <span className="text-gray-500">Destination Port:</span>
                            <p className="text-white font-mono mt-1">{alert.dest_port}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {alert.payload && (
                      <div>
                        <span className="text-gray-500 text-sm">Payload:</span>
                        <pre className="mt-1 p-3 rounded-lg bg-cyber-surface border border-cyber-border text-xs text-gray-300 font-mono overflow-x-auto">
                          {alert.payload}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-cyber-border">
        <p className="text-xs text-gray-500">
          Auto-refreshes every 10 seconds • Click on alert to view details
        </p>
      </div>
    </div>
  )
}
