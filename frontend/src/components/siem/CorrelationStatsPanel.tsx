/**
 * Correlation Statistics Panel Component
 *
 * Displays attack correlation engine statistics
 */

import { useState, useEffect } from 'react'
import { Activity, TrendingUp, Shield, Clock } from 'lucide-react'
import { cn } from '@/utils/cn'
import correlationService, { type CorrelationStatistics } from '@/services/correlationService'

export function CorrelationStatsPanel() {
  const [stats, setStats] = useState<CorrelationStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const data = await correlationService.getCorrelationStatistics()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch correlation stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Auto-refresh every 20 seconds
    const interval = setInterval(fetchStats, 20000)
    return () => clearInterval(interval)
  }, [])

  const avgConfidence = stats ? Math.round(stats.avg_confidence * 100) : 0

  return (
    <div className="p-6 rounded-lg bg-cyber-surface border border-cyber-border">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <Activity className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Correlation Engine</h3>
          <p className="text-sm text-gray-400">Attack pattern analysis</p>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-cyber-bg animate-pulse" />
          ))}
        </div>
      ) : !stats ? (
        /* Error State */
        <div className="py-12 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h4 className="text-lg font-semibold text-gray-400 mb-2">No Data Available</h4>
          <p className="text-sm text-gray-500">Correlation statistics will appear here when events are detected</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Total Events */}
            <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Total Events</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.total_events.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Last {stats.time_window_minutes}min</p>
            </div>

            {/* Patterns Detected */}
            <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Patterns</span>
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.total_patterns}</p>
              <p className="text-xs text-gray-500 mt-1">
                Avg confidence: <span className="text-cyan-400 font-semibold">{avgConfidence}%</span>
              </p>
            </div>

            {/* Unique IPs */}
            <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Unique IPs</span>
                <Shield className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.unique_ips}</p>
              <p className="text-xs text-gray-500 mt-1">Active sources</p>
            </div>

            {/* Time Window */}
            <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Time Window</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.time_window_minutes}</p>
              <p className="text-xs text-gray-500 mt-1">Minutes</p>
            </div>
          </div>

          {/* Pattern Type Distribution */}
          {Object.keys(stats.pattern_type_distribution).length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Pattern Types</h4>
              <div className="space-y-2">
                {Object.entries(stats.pattern_type_distribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => {
                    const percentage = stats.total_patterns > 0 ? (count / stats.total_patterns) * 100 : 0
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-400">
                            {correlationService.getPatternTypeIcon(type)} {correlationService.getPatternTypeName(type)}
                          </span>
                          <span className="text-white font-semibold">{count}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-cyber-bg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Severity Distribution */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Severity Distribution</h4>
            <div className="flex items-center gap-2">
              {(['critical', 'high', 'medium', 'low'] as const).map((severity) => {
                const count = stats.severity_distribution[severity] || 0
                const total = Object.values(stats.severity_distribution).reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0

                const colors = {
                  critical: 'bg-red-500',
                  high: 'bg-orange-500',
                  medium: 'bg-yellow-500',
                  low: 'bg-green-500',
                }

                return (
                  <div
                    key={severity}
                    className="flex-1"
                    title={`${severity}: ${count} (${percentage.toFixed(1)}%)`}
                  >
                    <div className={cn('h-2 rounded-full', colors[severity])} style={{ opacity: percentage / 100 }} />
                    <div className="text-center mt-1">
                      <p className="text-xs text-gray-500">{severity}</p>
                      <p className="text-xs font-semibold text-white">{count}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Attack Types */}
          {stats.top_attack_types.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Top Attack Types</h4>
              <div className="space-y-2">
                {stats.top_attack_types.slice(0, 5).map((attackType, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-cyber-bg border border-cyber-border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyber-primary/10 text-cyber-primary text-xs font-semibold">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-white">{correlationService.getAttackTypeName(attackType.attack_type)}</span>
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                      {attackType.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Timestamp */}
          <div className="mt-4 pt-4 border-t border-cyber-border">
            <p className="text-xs text-gray-500 text-center">
              Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
