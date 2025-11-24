/**
 * JWT Validation Stats Component
 *
 * Displays JWT validation statistics with success rate gauge and failure breakdown
 */

import { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import gatewayService, { type JwtValidationStats as JwtStats } from '@/services/gatewayService'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { cn } from '@/utils/cn'

export function JwtValidationStats() {
  const [stats, setStats] = useState<JwtStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch JWT validation stats
  const fetchStats = async () => {
    try {
      setError(null)
      const data = await gatewayService.getJwtValidationStats(24)
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch JWT validation stats')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchStats()
  }, [])

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchStats, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <LoadingSkeleton variant="card" />
  }

  if (!stats) {
    return (
      <div className="rounded-lg bg-cyber-surface border border-cyber-border p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-500 mb-1">Unable to Load JWT Stats</h4>
            <p className="text-sm text-gray-400">{error || 'Unknown error occurred'}</p>
          </div>
        </div>
      </div>
    )
  }

  // Success rate percentage
  const successPercent = stats.success_rate * 100

  return (
    <div className="rounded-lg bg-cyber-surface border border-cyber-border p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyber-primary/10 border border-cyber-primary/30">
          <Shield className="w-6 h-6 text-cyber-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">JWT Validation Stats</h3>
          <p className="text-sm text-gray-400">Token validation metrics (24h)</p>
        </div>
      </div>

      {/* Success Rate Gauge */}
      <div className="mb-6 p-6 rounded-lg bg-cyber-bg border border-cyber-border">
        <div className="flex items-center justify-center mb-4">
          {/* Radial Gauge */}
          <div className="relative w-40 h-40">
            <svg className="transform -rotate-90 w-40 h-40">
              {/* Background Circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-cyber-border"
              />
              {/* Progress Circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - stats.success_rate)}`}
                className={cn(
                  successPercent >= 95 ? 'text-green-500' :
                  successPercent >= 85 ? 'text-yellow-500' :
                  'text-red-500'
                )}
                strokeLinecap="round"
              />
            </svg>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn(
                'text-3xl font-bold',
                successPercent >= 95 ? 'text-green-500' :
                successPercent >= 85 ? 'text-yellow-500' :
                'text-red-500'
              )}>
                {successPercent.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-400">Success Rate</span>
            </div>
          </div>
        </div>

        {/* Total Validations */}
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{stats.total_validations.toLocaleString()}</p>
          <p className="text-sm text-gray-400">Total Validations</p>
        </div>
      </div>

      {/* Success/Failure Counts */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Successful */}
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-400">Successful</span>
          </div>
          <p className="text-xl font-bold text-green-500">
            {stats.successful_validations.toLocaleString()}
          </p>
        </div>

        {/* Failed */}
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-400">Failed</span>
          </div>
          <p className="text-xl font-bold text-red-500">
            {stats.failed_validations.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Failure Reasons Breakdown */}
      <div className="mb-6 p-4 rounded-lg bg-cyber-bg border border-cyber-border">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Failure Reasons
        </h4>
        <div className="space-y-3">
          {/* Expired */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-400">Expired Token</span>
              <span className="text-white font-mono">{stats.failure_reasons.expired}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all duration-300"
                style={{ width: `${stats.failed_validations > 0 ? (stats.failure_reasons.expired / stats.failed_validations) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Invalid Signature */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-400">Invalid Signature</span>
              <span className="text-white font-mono">{stats.failure_reasons.invalid_signature}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${stats.failed_validations > 0 ? (stats.failure_reasons.invalid_signature / stats.failed_validations) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Malformed */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-400">Malformed Token</span>
              <span className="text-white font-mono">{stats.failure_reasons.malformed}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${stats.failed_validations > 0 ? (stats.failure_reasons.malformed / stats.failed_validations) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Revoked */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-400">Revoked Token</span>
              <span className="text-white font-mono">{stats.failure_reasons.revoked}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${stats.failed_validations > 0 ? (stats.failure_reasons.revoked / stats.failed_validations) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Other */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-400">Other Errors</span>
              <span className="text-white font-mono">{stats.failure_reasons.other}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-gray-500 transition-all duration-300"
                style={{ width: `${stats.failed_validations > 0 ? (stats.failure_reasons.other / stats.failed_validations) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Average Validation Time */}
      <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-400">Avg Validation Time</span>
          </div>
          <span className={cn(
            'text-xl font-bold',
            stats.avg_validation_time_ms < 5 ? 'text-green-500' :
            stats.avg_validation_time_ms < 10 ? 'text-yellow-500' :
            'text-red-500'
          )}>
            {stats.avg_validation_time_ms.toFixed(2)}ms
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-cyber-border">
        <p className="text-xs text-gray-500">
          Auto-refreshes every 15 seconds • Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
