/**
 * Metrics Grid Component
 *
 * Displays key security metrics in card format
 */

import { Shield, AlertTriangle, Key, Lock, Ban, Activity } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { SecurityMetrics } from '@/types/api'

interface MetricsGridProps {
  metrics: SecurityMetrics | null
  loading?: boolean
  className?: string
}

interface MetricCardData {
  name: string
  key: keyof SecurityMetrics
  icon: React.ComponentType<{ className?: string }>
  colorClass: string
  thresholdWarning?: number
  thresholdCritical?: number
}

const METRIC_CARDS: MetricCardData[] = [
  {
    name: 'Total Login Attempts',
    key: 'login_attempts_total',
    icon: Activity,
    colorClass: 'text-blue-400',
  },
  {
    name: 'Failed Logins',
    key: 'login_failures_total',
    icon: AlertTriangle,
    colorClass: 'text-yellow-400',
    thresholdWarning: 5,
    thresholdCritical: 20,
  },
  {
    name: 'MFA Attempts',
    key: 'mfa_attempts_total',
    icon: Key,
    colorClass: 'text-cyber-primary',
  },
  {
    name: 'IDOR Attempts',
    key: 'idor_attempts_total',
    icon: Shield,
    colorClass: 'text-purple-400',
    thresholdWarning: 3,
    thresholdCritical: 10,
  },
  {
    name: 'Rate Limit Blocks',
    key: 'rate_limit_blocks_total',
    icon: Lock,
    colorClass: 'text-orange-400',
    thresholdWarning: 5,
    thresholdCritical: 15,
  },
  {
    name: 'IP Bans Active',
    key: 'ip_bans_active',
    icon: Ban,
    colorClass: 'text-red-400',
    thresholdWarning: 1,
    thresholdCritical: 5,
  },
]

export function MetricsGrid({ metrics, loading, className }: MetricsGridProps) {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
        {METRIC_CARDS.map((card) => (
          <MetricCardSkeleton key={card.key} />
        ))}
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className={cn('p-8 text-center rounded-lg bg-cyber-surface border border-cyber-border', className)}>
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-cyber-warning" />
        <h3 className="text-lg font-semibold mb-2">No Metrics Available</h3>
        <p className="text-gray-400">
          Prometheus is not connected. Start the backend services to view metrics.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {METRIC_CARDS.map((card) => (
        <MetricCard key={card.key} card={card} value={metrics[card.key]} />
      ))}
    </div>
  )
}

interface MetricCardProps {
  card: MetricCardData
  value: number
}

function MetricCard({ card, value }: MetricCardProps) {
  const Icon = card.icon

  // Determine status color based on thresholds
  let statusColor = 'text-cyber-success'
  let bgColor = 'bg-cyber-success/10'
  let borderColor = 'border-cyber-success/30'

  if (card.thresholdCritical && value >= card.thresholdCritical) {
    statusColor = 'text-cyber-danger'
    bgColor = 'bg-cyber-danger/10'
    borderColor = 'border-cyber-danger/30'
  } else if (card.thresholdWarning && value >= card.thresholdWarning) {
    statusColor = 'text-cyber-warning'
    bgColor = 'bg-cyber-warning/10'
    borderColor = 'border-cyber-warning/30'
  }

  return (
    <div
      className={cn(
        'relative p-4 rounded-lg bg-cyber-surface border transition-all',
        'hover:border-cyber-primary/50',
        borderColor
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-lg', bgColor)}>
          <Icon className={cn('w-5 h-5', card.colorClass)} />
        </div>
        <div className={cn('px-2 py-1 rounded text-xs font-medium', bgColor, statusColor)}>
          {getStatusLabel(value, card.thresholdWarning, card.thresholdCritical)}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm text-gray-400">{card.name}</h3>
        <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
      </div>

      {/* Trend indicator placeholder - could be enhanced in future */}
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <Activity className="w-3 h-3" />
        <span>Live metric</span>
      </div>
    </div>
  )
}

function MetricCardSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-cyber-surface border border-cyber-border animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-cyber-bg" />
        <div className="w-16 h-6 rounded bg-cyber-bg" />
      </div>
      <div className="space-y-2">
        <div className="w-32 h-4 rounded bg-cyber-bg" />
        <div className="w-24 h-8 rounded bg-cyber-bg" />
      </div>
    </div>
  )
}

function getStatusLabel(value: number, warning?: number, critical?: number): string {
  if (critical && value >= critical) return 'CRITICAL'
  if (warning && value >= warning) return 'WARNING'
  return 'NORMAL'
}
