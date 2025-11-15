/**
 * Incident Timeline Component
 *
 * Displays security incidents in chronological order
 */

import { AlertCircle, AlertTriangle, Info, CheckCircle, Clock, Shield } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Incident } from '@/types/api'

interface IncidentTimelineProps {
  incidents: Incident[]
  loading?: boolean
  className?: string
}

export function IncidentTimeline({ incidents, loading, className }: IncidentTimelineProps) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <IncidentCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (incidents.length === 0) {
    return (
      <div className={cn('p-8 text-center rounded-lg bg-cyber-surface border border-cyber-border', className)}>
        <Shield className="w-12 h-12 mx-auto mb-4 text-cyber-success" />
        <h3 className="text-lg font-semibold mb-2">No Incidents Detected</h3>
        <p className="text-gray-400">
          All systems operating normally. Incidents will appear here when security events are detected.
        </p>
      </div>
    )
  }

  // Sort incidents by timestamp (most recent first)
  const sortedIncidents = [...incidents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className={cn('space-y-3', className)}>
      {sortedIncidents.map((incident) => (
        <IncidentCard key={incident.id} incident={incident} />
      ))}
    </div>
  )
}

interface IncidentCardProps {
  incident: Incident
}

function IncidentCard({ incident }: IncidentCardProps) {
  const severityConfig = getSeverityConfig(incident.severity)
  const SeverityIcon = severityConfig.icon
  const statusConfig = getStatusConfig(incident.status)
  const StatusIcon = statusConfig.icon

  return (
    <div
      className={cn(
        'p-4 rounded-lg bg-cyber-surface border transition-all',
        'hover:border-cyber-primary/50',
        severityConfig.borderClass
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg', severityConfig.bgClass)}>
            <SeverityIcon className={cn('w-5 h-5', severityConfig.iconClass)} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{incident.alertname}</h3>
            <p className="text-sm text-gray-400 mt-1">{incident.description}</p>
          </div>
        </div>
        <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium', statusConfig.bgClass, statusConfig.textClass)}>
          <StatusIcon className="w-3 h-3" />
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
        <div>
          <span className="text-gray-500">Severity</span>
          <p className={cn('font-medium', severityConfig.textClass)}>
            {incident.severity.toUpperCase()}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Category</span>
          <p className="font-medium text-white">{incident.category}</p>
        </div>
        <div>
          <span className="text-gray-500">Source IP</span>
          <p className="font-medium text-white">{incident.source_ip || 'N/A'}</p>
        </div>
        <div>
          <span className="text-gray-500">User</span>
          <p className="font-medium text-white">{incident.username || 'N/A'}</p>
        </div>
      </div>

      {/* Actions Taken */}
      {incident.actions_taken && incident.actions_taken.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-400 mb-2">Automated Actions</h4>
          <div className="flex flex-wrap gap-2">
            {incident.actions_taken.map((action, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded text-xs bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/30"
              >
                {typeof action === 'string' ? action : action.action_type || 'Action'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Runbook */}
      {incident.runbook_executed && (
        <div className="mb-3">
          <span className="text-xs text-gray-500">Runbook: </span>
          <span className="text-xs text-cyber-primary">{incident.runbook_executed}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 pt-3 border-t border-cyber-border">
        <Clock className="w-3 h-3 text-gray-500" />
        <span className="text-xs text-gray-500">
          {new Date(incident.timestamp).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

function IncidentCardSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-cyber-surface border border-cyber-border animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-cyber-bg" />
        <div className="flex-1 space-y-2">
          <div className="w-48 h-5 rounded bg-cyber-bg" />
          <div className="w-64 h-4 rounded bg-cyber-bg" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <div className="w-16 h-3 rounded bg-cyber-bg" />
            <div className="w-20 h-4 rounded bg-cyber-bg" />
          </div>
        ))}
      </div>
    </div>
  )
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case 'critical':
      return {
        icon: AlertCircle,
        iconClass: 'text-cyber-danger',
        textClass: 'text-cyber-danger',
        bgClass: 'bg-cyber-danger/10',
        borderClass: 'border-cyber-danger/30',
      }
    case 'warning':
      return {
        icon: AlertTriangle,
        iconClass: 'text-cyber-warning',
        textClass: 'text-cyber-warning',
        bgClass: 'bg-cyber-warning/10',
        borderClass: 'border-cyber-warning/30',
      }
    default:
      return {
        icon: Info,
        iconClass: 'text-blue-400',
        textClass: 'text-blue-400',
        bgClass: 'bg-blue-400/10',
        borderClass: 'border-blue-400/30',
      }
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'resolved':
      return {
        icon: CheckCircle,
        label: 'RESOLVED',
        textClass: 'text-cyber-success',
        bgClass: 'bg-cyber-success/10',
      }
    case 'investigating':
      return {
        icon: AlertTriangle,
        label: 'INVESTIGATING',
        textClass: 'text-cyber-warning',
        bgClass: 'bg-cyber-warning/10',
      }
    default:
      return {
        icon: AlertCircle,
        label: 'ACTIVE',
        textClass: 'text-cyber-danger',
        bgClass: 'bg-cyber-danger/10',
      }
  }
}
