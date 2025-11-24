/**
 * Attack Pattern Timeline Component
 *
 * Displays detected attack patterns in timeline format with detailed information
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Target, Activity, Clock } from 'lucide-react'
import correlationService, { type AttackPattern } from '@/services/correlationService'
import { cn } from '@/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'

interface AttackPatternTimelineProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

export function AttackPatternTimeline({
  className,
  autoRefresh = true,
  refreshInterval = 15000, // 15 seconds
}: AttackPatternTimelineProps) {
  const [patterns, setPatterns] = useState<AttackPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null)

  const fetchAttackPatterns = async () => {
    try {
      setError(null)
      const data = await correlationService.getAttackPatterns()
      setPatterns(data.patterns)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attack patterns')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttackPatterns()

    if (autoRefresh) {
      const interval = setInterval(fetchAttackPatterns, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const togglePattern = (patternId: string) => {
    setExpandedPattern(expandedPattern === patternId ? null : patternId)
  }

  if (loading) {
    return (
      <div className={cn('p-6 rounded-lg bg-cyber-surface border border-cyber-border', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-cyber-bg rounded" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-cyber-bg rounded" />
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
          <h3 className="text-lg font-semibold mb-2 text-red-400">Error Loading Patterns</h3>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchAttackPatterns}
            className="px-4 py-2 rounded-lg bg-cyber-primary/20 hover:bg-cyber-primary/30 border border-cyber-primary/50 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (patterns.length === 0) {
    return (
      <div className={cn('p-6 rounded-lg bg-cyber-surface border border-cyber-border', className)}>
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <h3 className="text-lg font-semibold mb-2 text-gray-400">No Attack Patterns</h3>
          <p className="text-gray-500">No correlated attack patterns detected</p>
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
              <Target className="w-5 h-5 text-cyber-primary" />
              Attack Patterns
            </h2>
            <p className="text-sm text-gray-400 mt-1">{patterns.length} patterns detected</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Activity className="w-3 h-3" />
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
        {patterns.map((pattern, index) => (
          <PatternCard
            key={pattern.pattern_id}
            pattern={pattern}
            index={index}
            expanded={expandedPattern === pattern.pattern_id}
            onToggle={() => togglePattern(pattern.pattern_id)}
          />
        ))}
      </div>
    </div>
  )
}

// Pattern Card Component
interface PatternCardProps {
  pattern: AttackPattern
  index: number
  expanded: boolean
  onToggle: () => void
}

function PatternCard({ pattern, index, expanded, onToggle }: PatternCardProps) {
  const firstEventTime = new Date(pattern.first_event_time)
  const lastEventTime = new Date(pattern.last_event_time)
  const now = new Date()
  const timeSinceLastEvent = Math.floor((now.getTime() - lastEventTime.getTime()) / 1000 / 60) // minutes

  return (
    <motion.div
      className={cn(
        'rounded-lg border transition-all cursor-pointer',
        'hover:border-cyber-primary/50',
        expanded ? 'border-cyber-primary/50 bg-cyber-bg/50' : 'border-cyber-border bg-cyber-bg/20'
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onToggle}
    >
      <div className="p-4">
        {/* Pattern Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{correlationService.getPatternTypeIcon(pattern.pattern_type)}</span>
              <h3 className="text-lg font-semibold text-white">
                {correlationService.getPatternTypeName(pattern.pattern_type)}
              </h3>
              <SeverityBadge severity={pattern.severity} />
            </div>
            <p className="text-sm text-gray-400">{pattern.description}</p>
          </div>
          <div className="ml-4">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Pattern Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <StatItem
            label="Confidence"
            value={`${Math.round(pattern.confidence * 100)}%`}
            icon={Target}
          />
          <StatItem
            label="Attackers"
            value={pattern.attacker_ips.length.toString()}
            icon={AlertTriangle}
          />
          <StatItem
            label="Events"
            value={pattern.events.length.toString()}
            icon={Activity}
          />
          <StatItem
            label="Duration"
            value={`${Math.round(pattern.duration_minutes)}m`}
            icon={Clock}
          />
        </div>

        {/* Timeline Visualization */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Timeline</span>
            <span>{timeSinceLastEvent < 1 ? 'Active now' : `${timeSinceLastEvent}m ago`}</span>
          </div>
          <TimelineBar
            firstEvent={firstEventTime}
            lastEvent={lastEventTime}
            severity={pattern.severity}
          />
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>{firstEventTime.toLocaleTimeString()}</span>
            <span>{lastEventTime.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-4 border-t border-cyber-border"
            >
              {/* Attacker IPs */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Attacker IPs</h4>
                <div className="flex flex-wrap gap-2">
                  {pattern.attacker_ips.map((ip) => (
                    <span
                      key={ip}
                      className="px-2 py-1 rounded text-sm font-mono bg-red-500/20 text-red-400 border border-red-500/30"
                    >
                      {ip}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recent Events */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">
                  Recent Events ({pattern.events.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {pattern.events.slice(0, 5).map((event, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-cyber-surface text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn('font-semibold', correlationService.getSeverityColor(event.severity))}>
                          {event.attack_type}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="text-gray-400">{event.target}</span>
                      </div>
                      <span className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                  {pattern.events.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{pattern.events.length - 5} more events
                    </p>
                  )}
                </div>
              </div>

              {/* Recommended Actions */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Recommended Actions</h4>
                <div className="space-y-2">
                  {pattern.recommended_actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-cyber-primary font-bold">{i + 1}.</span>
                      <span className="text-gray-300">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pattern ID */}
              <div className="pt-3 border-t border-cyber-border">
                <p className="text-xs text-gray-500">
                  Pattern ID: <span className="font-mono text-gray-400">{pattern.pattern_id}</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Severity Badge Component
function SeverityBadge({ severity }: { severity: string }) {
  const colorClasses = {
    critical: 'bg-red-500/20 border-red-500/50 text-red-400',
    high: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
    medium: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
    low: 'bg-green-500/20 border-green-500/50 text-green-400',
  }

  return (
    <span
      className={cn(
        'px-2 py-1 rounded text-xs font-semibold border',
        colorClasses[severity as keyof typeof colorClasses] || colorClasses.low
      )}
    >
      {severity.toUpperCase()}
    </span>
  )
}

// Stat Item Component
interface StatItemProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}

function StatItem({ label, value, icon: Icon }: StatItemProps) {
  return (
    <div className="p-2 rounded bg-cyber-surface border border-cyber-border">
      <div className="flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3 text-gray-400" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  )
}

// Timeline Bar Component
interface TimelineBarProps {
  firstEvent: Date
  lastEvent: Date
  severity: string
}

function TimelineBar({ firstEvent, lastEvent, severity }: TimelineBarProps) {
  const now = new Date()
  const windowStart = new Date(now.getTime() - 60 * 60 * 1000) // Last hour
  const windowEnd = now

  // Calculate position percentages
  const windowDuration = windowEnd.getTime() - windowStart.getTime()
  const startPercent = Math.max(0, ((firstEvent.getTime() - windowStart.getTime()) / windowDuration) * 100)
  const endPercent = Math.min(100, ((lastEvent.getTime() - windowStart.getTime()) / windowDuration) * 100)
  const durationPercent = endPercent - startPercent

  const colorClasses = {
    critical: 'bg-gradient-to-r from-red-500 to-red-600',
    high: 'bg-gradient-to-r from-orange-500 to-orange-600',
    medium: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    low: 'bg-gradient-to-r from-green-500 to-green-600',
  }

  return (
    <div className="relative h-3 bg-cyber-bg rounded-full overflow-hidden">
      <div
        className={cn(
          'absolute inset-y-0 rounded-full',
          colorClasses[severity as keyof typeof colorClasses] || colorClasses.low
        )}
        style={{
          left: `${startPercent}%`,
          width: `${Math.max(durationPercent, 2)}%`,
        }}
      />
    </div>
  )
}
