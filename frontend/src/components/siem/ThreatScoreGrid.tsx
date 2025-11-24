/**
 * Threat Score Grid Component
 *
 * Displays top threat IPs in a table format with detailed information
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Shield, Activity } from 'lucide-react'
import siemService, { type ThreatScore } from '@/services/siemService'
import { cn } from '@/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'

interface ThreatScoreGridProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
  limit?: number
}

export function ThreatScoreGrid({
  className,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  limit = 50,
}: ThreatScoreGridProps) {
  const [threats, setThreats] = useState<ThreatScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const fetchThreatScores = async () => {
    try {
      setError(null)
      const data = await siemService.getThreatScores(0, 60, limit)
      setThreats(data.threat_scores)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch threat scores')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThreatScores()

    if (autoRefresh) {
      const interval = setInterval(fetchThreatScores, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, limit])

  const toggleRow = (ip: string) => {
    setExpandedRow(expandedRow === ip ? null : ip)
  }

  if (loading) {
    return (
      <div className={cn('p-6 rounded-lg bg-cyber-surface border border-cyber-border', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-cyber-bg rounded" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-cyber-bg rounded" />
            ))}
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
          <h3 className="text-lg font-semibold mb-2 text-red-400">Error Loading Threat Scores</h3>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchThreatScores}
            className="px-4 py-2 rounded-lg bg-cyber-primary/20 hover:bg-cyber-primary/30 border border-cyber-primary/50 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (threats.length === 0) {
    return (
      <div className={cn('p-6 rounded-lg bg-cyber-surface border border-cyber-border', className)}>
        <div className="text-center py-8">
          <Shield className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <h3 className="text-lg font-semibold mb-2 text-green-400">No Threats Detected</h3>
          <p className="text-gray-400">The environment is currently secure</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg bg-cyber-surface border border-cyber-border', className)}>
      {/* Header */}
      <div className="p-6 border-b border-cyber-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-cyber-primary" />
              Threat Scores
            </h2>
            <p className="text-sm text-gray-400 mt-1">{threats.length} active threats detected</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Activity className="w-3 h-3" />
            <span>Auto-refresh</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyber-border">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Threat Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Events
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Attack Types
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {threats.map((threat, index) => (
              <ThreatRow
                key={threat.ip_address}
                threat={threat}
                index={index}
                expanded={expandedRow === threat.ip_address}
                onToggle={() => toggleRow(threat.ip_address)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Threat Row Component
interface ThreatRowProps {
  threat: ThreatScore
  index: number
  expanded: boolean
  onToggle: () => void
}

function ThreatRow({ threat, index, expanded, onToggle }: ThreatRowProps) {
  return (
    <>
      <motion.tr
        className="border-b border-cyber-border hover:bg-cyber-bg/50 transition-colors cursor-pointer"
        onClick={onToggle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <td className="px-6 py-4">
          <span className="font-mono text-sm text-white">{threat.ip_address}</span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-cyber-bg rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  threat.threat_level === 'critical' && 'bg-red-500',
                  threat.threat_level === 'high' && 'bg-orange-500',
                  threat.threat_level === 'medium' && 'bg-yellow-500',
                  threat.threat_level === 'low' && 'bg-green-500'
                )}
                style={{ width: `${threat.threat_score}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-white">{Math.round(threat.threat_score)}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <ThreatLevelBadge level={threat.threat_level} />
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-gray-300">{Math.round(threat.confidence * 100)}%</span>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm font-semibold text-white">{threat.event_count}</span>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-wrap gap-1">
            {threat.attack_types.slice(0, 3).map((type) => (
              <span
                key={type}
                className="px-2 py-1 rounded text-xs bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30"
              >
                {type}
              </span>
            ))}
            {threat.attack_types.length > 3 && (
              <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                +{threat.attack_types.length - 3}
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 text-center">
          {expanded ? (
            <ChevronUp className="w-4 h-4 mx-auto text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 mx-auto text-gray-400" />
          )}
        </td>
      </motion.tr>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <td colSpan={7} className="px-6 py-4 bg-cyber-bg/50">
              <div className="space-y-4">
                {/* Factors */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Threat Factors</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <FactorItem label="Frequency" value={threat.factors.frequency.toFixed(2)} />
                    <FactorItem label="Diversity" value={threat.factors.diversity.toFixed(2)} />
                    <FactorItem label="Severity" value={threat.factors.severity.toFixed(2)} />
                    <FactorItem label="Attack Risk" value={threat.factors.attack_risk.toFixed(2)} />
                  </div>
                </div>

                {/* All Attack Types */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Attack Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {threat.attack_types.map((type) => (
                      <span
                        key={type}
                        className="px-3 py-1 rounded text-sm bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Timeline</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div>
                      <span className="text-gray-500">First seen:</span>{' '}
                      <span className="text-white">{new Date(threat.first_seen).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last seen:</span>{' '}
                      <span className="text-white">{new Date(threat.last_seen).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Recommendation</h4>
                  <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-sm text-gray-300">{threat.recommendation}</p>
                  </div>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  )
}

// Threat Level Badge Component
function ThreatLevelBadge({ level }: { level: string }) {
  const getIcon = () => {
    switch (level) {
      case 'critical':
        return '🔴'
      case 'high':
        return '🟠'
      case 'medium':
        return '🟡'
      case 'low':
        return '🟢'
      default:
        return '⚪'
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border',
        siemService.getThreatLevelBgColor(level)
      )}
    >
      <span>{getIcon()}</span>
      <span className={siemService.getThreatLevelColor(level)}>{level.toUpperCase()}</span>
    </span>
  )
}

// Factor Item Component
function FactorItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded bg-cyber-surface">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  )
}
