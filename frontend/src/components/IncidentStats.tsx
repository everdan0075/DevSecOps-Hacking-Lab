/**
 * Incident Stats Component
 *
 * Displays summary statistics for security incidents
 */

import { Shield, AlertCircle, AlertTriangle, Info, Activity, CheckCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { IncidentStatsResponse } from '@/types/api'

interface IncidentStatsProps {
  stats: IncidentStatsResponse | null
  loading?: boolean
  className?: string
}

export function IncidentStats({ stats, loading, className }: IncidentStatsProps) {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3', className)}>
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={cn('p-4 rounded-lg bg-cyber-surface border border-cyber-border text-center', className)}>
        <p className="text-sm text-gray-400">No statistics available</p>
      </div>
    )
  }

  const successRate = stats.total_actions > 0
    ? Math.round((stats.actions_success / stats.total_actions) * 100)
    : 0

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Shield}
          label="Total Incidents"
          value={stats.total_incidents}
          color="blue"
        />
        <StatCard
          icon={AlertCircle}
          label="Critical"
          value={stats.incidents_by_severity.critical}
          color="red"
        />
        <StatCard
          icon={AlertTriangle}
          label="Warning"
          value={stats.incidents_by_severity.warning}
          color="yellow"
        />
        <StatCard
          icon={Info}
          label="Info"
          value={stats.incidents_by_severity.info}
          color="blue"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-lg bg-cyber-surface border border-cyber-border">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-cyber-primary" />
            <h4 className="text-sm font-semibold text-gray-400">Automated Actions</h4>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total_actions}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.actions_success} successful, {stats.actions_failure} failed
          </p>
        </div>

        <div className="p-4 rounded-lg bg-cyber-surface border border-cyber-border">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-cyber-success" />
            <h4 className="text-sm font-semibold text-gray-400">Success Rate</h4>
          </div>
          <p className="text-2xl font-bold text-white">{successRate}%</p>
          <div className="w-full bg-cyber-bg rounded-full h-2 mt-2">
            <div
              className="bg-cyber-success rounded-full h-2 transition-all"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-cyber-surface border border-cyber-border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-semibold text-gray-400">Runbooks Loaded</h4>
          </div>
          <p className="text-2xl font-bold text-white">{stats.runbooks_loaded}</p>
          <p className="text-xs text-gray-500 mt-1">
            Available response playbooks
          </p>
        </div>
      </div>

      {/* Most Common Category */}
      {stats.most_common_category && (
        <div className="p-3 rounded-lg bg-cyber-primary/10 border border-cyber-primary/30">
          <p className="text-sm text-gray-400">
            Most common attack type:{' '}
            <span className="text-cyber-primary font-semibold">{stats.most_common_category}</span>
          </p>
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: 'red' | 'yellow' | 'blue' | 'green'
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorConfig = {
    red: {
      icon: 'text-cyber-danger',
      bg: 'bg-cyber-danger/10',
      border: 'border-cyber-danger/30',
    },
    yellow: {
      icon: 'text-cyber-warning',
      bg: 'bg-cyber-warning/10',
      border: 'border-cyber-warning/30',
    },
    blue: {
      icon: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/30',
    },
    green: {
      icon: 'text-cyber-success',
      bg: 'bg-cyber-success/10',
      border: 'border-cyber-success/30',
    },
  }[color]

  return (
    <div className={cn('p-3 rounded-lg bg-cyber-surface border', colorConfig.border)}>
      <div className={cn('inline-flex p-2 rounded-lg mb-2', colorConfig.bg)}>
        <Icon className={cn('w-4 h-4', colorConfig.icon)} />
      </div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="p-3 rounded-lg bg-cyber-surface border border-cyber-border animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-cyber-bg mb-2" />
      <div className="w-16 h-3 rounded bg-cyber-bg mb-1" />
      <div className="w-12 h-6 rounded bg-cyber-bg" />
    </div>
  )
}
