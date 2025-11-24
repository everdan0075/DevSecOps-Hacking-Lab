/**
 * Defense Effectiveness Dashboard Component
 *
 * Displays metrics on how well defense mechanisms are performing
 */

import { useEffect, useState } from 'react'
import { Shield, CheckCircle, Clock, Target, AlertTriangle } from 'lucide-react'
import correlationService, { type DefenseMetrics } from '@/services/correlationService'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'

interface DefenseEffectivenessDashboardProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

export function DefenseEffectivenessDashboard({
  className,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: DefenseEffectivenessDashboardProps) {
  const [metrics, setMetrics] = useState<DefenseMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDefenseMetrics = async () => {
    try {
      setError(null)
      const data = await correlationService.getDefenseMetrics(24)
      setMetrics(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch defense metrics')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDefenseMetrics()

    if (autoRefresh) {
      const interval = setInterval(fetchDefenseMetrics, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  if (loading) {
    return (
      <div className={cn('p-6 rounded-lg bg-cyber-surface border border-cyber-border', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-56 bg-cyber-bg rounded" />
          <div className="h-32 bg-cyber-bg rounded" />
          <div className="space-y-3">
            <div className="h-16 bg-cyber-bg rounded" />
            <div className="h-16 bg-cyber-bg rounded" />
            <div className="h-16 bg-cyber-bg rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('p-6 rounded-lg bg-cyber-surface border border-red-500/30', className)}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <h3 className="text-lg font-semibold mb-2 text-red-400">Error Loading Defense Metrics</h3>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchDefenseMetrics}
            className="px-4 py-2 rounded-lg bg-cyber-primary/20 hover:bg-cyber-primary/30 border border-cyber-primary/50 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className={cn('p-6 rounded-lg bg-cyber-surface border border-cyber-border', className)}>
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <p className="text-gray-400">No defense metrics available</p>
        </div>
      </div>
    )
  }

  const blockedPercentage = metrics.attacks_detected > 0
    ? (metrics.attacks_blocked / metrics.attacks_detected) * 100
    : 0

  return (
    <div className={cn('p-6 rounded-lg bg-cyber-surface border border-cyber-border', className)}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyber-primary" />
          Defense Effectiveness
        </h2>
        <p className="text-sm text-gray-400 mt-1">Last {metrics.time_window_hours}h performance</p>
      </div>

      {/* Success Rate - Large Display */}
      <div className="mb-6 p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/30">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Success Rate</span>
          </div>
          <motion.div
            className="text-5xl font-bold text-green-400"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {Math.round(metrics.success_rate * 100)}%
          </motion.div>
          <p className="text-xs text-gray-500 mt-2">
            {metrics.attacks_blocked.toLocaleString()} of {metrics.attacks_detected.toLocaleString()} attacks blocked
          </p>
        </div>
      </div>

      {/* Attacks Detected vs Blocked */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Attacks Blocked</span>
          <span className="text-white font-semibold">
            {metrics.attacks_blocked} / {metrics.attacks_detected}
          </span>
        </div>
        <div className="relative h-3 bg-cyber-bg rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${blockedPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MetricCard
          icon={Target}
          label="Patterns Identified"
          value={metrics.patterns_identified}
          color="purple"
        />
        <MetricCard
          icon={Shield}
          label="Incidents Handled"
          value={metrics.incidents_handled}
          color="blue"
        />
        <MetricCard
          icon={Clock}
          label="Avg Response Time"
          value={`${metrics.avg_response_time_seconds.toFixed(1)}s`}
          color="cyan"
          isString
        />
        <MetricCard
          icon={CheckCircle}
          label="Detection Rate"
          value={`${Math.round((metrics.attacks_detected / (metrics.attacks_detected + 1)) * 100)}%`}
          color="green"
          isString
        />
      </div>

      {/* Defense Layers Breakdown */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-gray-300">Defense Layers</h3>
        <DefenseLayerBar
          label="WAF Blocks"
          value={metrics.defense_layers.waf_blocks}
          color="red"
        />
        <DefenseLayerBar
          label="Rate Limit"
          value={metrics.defense_layers.rate_limit_blocks}
          color="orange"
        />
        <DefenseLayerBar
          label="Honeypot"
          value={metrics.defense_layers.honeypot_detections}
          color="yellow"
        />
        <DefenseLayerBar
          label="IDS Alerts"
          value={metrics.defense_layers.ids_alerts}
          color="purple"
        />
        <DefenseLayerBar
          label="Correlation"
          value={metrics.defense_layers.correlation_patterns}
          color="cyan"
        />
      </div>

      {/* Top Blocked Attack Types */}
      {metrics.top_blocked_attack_types.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Top Blocked Attacks</h3>
          <div className="space-y-2">
            {metrics.top_blocked_attack_types.slice(0, 5).map((attack, index) => (
              <div
                key={attack.attack_type}
                className="flex items-center justify-between text-sm p-2 rounded bg-cyber-bg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-4">#{index + 1}</span>
                  <span className="text-gray-300">{correlationService.getAttackTypeName(attack.attack_type)}</span>
                </div>
                <span className="font-semibold text-cyber-primary">{attack.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  color: 'purple' | 'blue' | 'cyan' | 'green'
  isString?: boolean
}

function MetricCard({ icon: Icon, label, value, color, isString }: MetricCardProps) {
  const colorClasses = {
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
  }

  return (
    <div className={cn('p-3 rounded-lg border', colorClasses[color])}>
      <Icon className="w-4 h-4 mb-2" />
      <div className="text-xl font-bold mb-1">
        {isString ? value : typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  )
}

// Defense Layer Bar Component
interface DefenseLayerBarProps {
  label: string
  value: number
  color: 'red' | 'orange' | 'yellow' | 'purple' | 'cyan'
}

function DefenseLayerBar({ label, value, color }: DefenseLayerBarProps) {
  const maxValue = 100 // Adjust based on your scale
  const percentage = Math.min((value / maxValue) * 100, 100)

  const colorClasses = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
  }

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-semibold">{value.toLocaleString()}</span>
      </div>
      <div className="relative h-2 bg-cyber-bg rounded-full overflow-hidden">
        <motion.div
          className={cn('absolute inset-y-0 left-0 rounded-full', colorClasses[color])}
          initial={{ width: 0 }}
          animate={{ width: value > 0 ? `${Math.max(percentage, 5)}%` : '0%' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
