/**
 * Risk Assessment Gauge Component
 *
 * Displays overall environment risk as a circular gauge with color-coded indicators
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, TrendingUp, Activity, Shield } from 'lucide-react'
import siemService, { type RiskAssessment } from '@/services/siemService'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'

interface RiskAssessmentGaugeProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

export function RiskAssessmentGauge({
  className,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: RiskAssessmentGaugeProps) {
  const [risk, setRisk] = useState<RiskAssessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRiskAssessment = async () => {
    try {
      setError(null)
      const data = await siemService.getRiskAssessment(24)
      setRisk(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk assessment')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRiskAssessment()

    if (autoRefresh) {
      const interval = setInterval(fetchRiskAssessment, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  if (loading) {
    return (
      <div className={cn('p-6 rounded-lg bg-cyber-surface border border-cyber-border', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-cyber-bg rounded" />
          <div className="mx-auto w-64 h-64 rounded-full bg-cyber-bg" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-cyber-bg rounded" />
            <div className="h-20 bg-cyber-bg rounded" />
            <div className="h-20 bg-cyber-bg rounded" />
            <div className="h-20 bg-cyber-bg rounded" />
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
          <h3 className="text-lg font-semibold mb-2 text-red-400">Error Loading Risk Assessment</h3>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchRiskAssessment}
            className="px-4 py-2 rounded-lg bg-cyber-primary/20 hover:bg-cyber-primary/30 border border-cyber-primary/50 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!risk) {
    return (
      <div className={cn('p-6 rounded-lg bg-cyber-surface border border-cyber-border', className)}>
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <p className="text-gray-400">No risk data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-6 rounded-lg bg-cyber-surface border border-cyber-border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyber-primary" />
            Risk Assessment
          </h2>
          <p className="text-sm text-gray-400 mt-1">Environment security status</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Activity className="w-3 h-3" />
          <span>Live</span>
        </div>
      </div>

      {/* Circular Gauge */}
      <div className="flex flex-col items-center mb-6">
        <CircularGauge score={risk.risk_score} level={risk.risk_level} />
        <div className="mt-4 text-center">
          <div className={cn('text-sm font-medium', siemService.getThreatLevelColor(risk.risk_level))}>
            {risk.risk_level.toUpperCase()}
          </div>
          <p className="text-xs text-gray-400 mt-1">{risk.status}</p>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FactorCard
          label="Event Volume"
          value={risk.factors.event_volume}
          icon={Activity}
          color="blue"
        />
        <FactorCard
          label="Pattern Complexity"
          value={risk.factors.pattern_complexity}
          icon={TrendingUp}
          color="purple"
        />
        <FactorCard
          label="Critical IPs"
          value={risk.factors.critical_ips}
          icon={AlertTriangle}
          color="orange"
        />
        <FactorCard
          label="Severity"
          value={risk.factors.severity}
          icon={Shield}
          color="red"
        />
      </div>

      {/* Metrics Summary */}
      <div className="border-t border-cyber-border pt-4 space-y-2">
        <MetricRow label="Total Events" value={risk.metrics.total_events} />
        <MetricRow label="Patterns Detected" value={risk.metrics.total_patterns} />
        <MetricRow label="Critical IPs" value={risk.metrics.critical_ips} />
        <MetricRow label="High Severity Events" value={risk.metrics.high_severity_events} />
      </div>

      {/* Time Window */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Analysis window: {risk.time_window_hours}h
      </div>
    </div>
  )
}

// Circular Gauge Component
function CircularGauge({ score, level }: { score: number; level: string }) {
  const radius = 100
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  // Get color based on risk level
  const getGaugeColor = () => {
    switch (level) {
      case 'critical':
        return '#ef4444' // red
      case 'high':
        return '#f97316' // orange
      case 'medium':
        return '#eab308' // yellow
      case 'low':
        return '#22c55e' // green
      default:
        return '#6b7280' // gray
    }
  }

  const color = getGaugeColor()

  return (
    <div className="relative w-64 h-64">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="128"
          cy="128"
          r={radius}
          stroke="#1f2937"
          strokeWidth="20"
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx="128"
          cy="128"
          r={radius}
          stroke={color}
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>
      {/* Center score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="text-5xl font-bold text-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {Math.round(score)}
        </motion.div>
        <div className="text-sm text-gray-400">Risk Score</div>
      </div>
    </div>
  )
}

// Factor Card Component
interface FactorCardProps {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'purple' | 'orange' | 'red'
}

function FactorCard({ label, value, icon: Icon, color }: FactorCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
  }

  return (
    <div className={cn('p-3 rounded-lg border', colorClasses[color])}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value.toFixed(1)}</div>
    </div>
  )
}

// Metric Row Component
function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-white">{value.toLocaleString()}</span>
    </div>
  )
}
