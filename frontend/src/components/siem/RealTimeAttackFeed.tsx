/**
 * Real-Time Attack Feed Component
 *
 * Displays live attack events in a scrollable feed with filtering
 */

import { useEffect, useState, useRef } from 'react'
import { AlertTriangle, Activity, Filter, X } from 'lucide-react'
import correlationService, { type AttackEvent } from '@/services/correlationService'
import { cn } from '@/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'

interface RealTimeAttackFeedProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
  maxEvents?: number
}

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low'
type AttackTypeFilter = 'all' | string

export function RealTimeAttackFeed({
  className,
  autoRefresh = true,
  refreshInterval = 5000, // 5 seconds for real-time feel
  maxEvents = 50,
}: RealTimeAttackFeedProps) {
  const [events, setEvents] = useState<AttackEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<AttackEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [attackTypeFilter, setAttackTypeFilter] = useState<AttackTypeFilter>('all')
  const [showFilters, setShowFilters] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  // Get unique attack types for filter dropdown
  const uniqueAttackTypes = Array.from(new Set(events.map((e) => e.attack_type)))

  const fetchAttackFeed = async () => {
    try {
      setError(null)
      const data = await correlationService.getRealTimeAttackFeed(60) // Last 60 minutes
      setEvents(data.events.slice(0, maxEvents))
      if (loading) setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attack feed')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttackFeed()

    if (autoRefresh) {
      const interval = setInterval(fetchAttackFeed, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, maxEvents])

  // Apply filters
  useEffect(() => {
    let filtered = [...events]

    if (severityFilter !== 'all') {
      filtered = filtered.filter((e) => e.severity === severityFilter)
    }

    if (attackTypeFilter !== 'all') {
      filtered = filtered.filter((e) => e.attack_type === attackTypeFilter)
    }

    setFilteredEvents(filtered)
  }, [events, severityFilter, attackTypeFilter])

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [filteredEvents, autoScroll])

  // Detect manual scroll
  const handleScroll = () => {
    if (feedRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = feedRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      setAutoScroll(isAtBottom)
    }
  }

  const clearFilters = () => {
    setSeverityFilter('all')
    setAttackTypeFilter('all')
  }

  if (loading) {
    return (
      <div className={cn('p-6 rounded-lg bg-cyber-surface border border-cyber-border', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-cyber-bg rounded" />
          <div className="space-y-2">
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
          <h3 className="text-lg font-semibold mb-2 text-red-400">Error Loading Attack Feed</h3>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchAttackFeed}
            className="px-4 py-2 rounded-lg bg-cyber-primary/20 hover:bg-cyber-primary/30 border border-cyber-primary/50 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg bg-cyber-surface border border-cyber-border flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b border-cyber-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyber-primary animate-pulse" />
              Live Attack Feed
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
              {(severityFilter !== 'all' || attackTypeFilter !== 'all') && ' (filtered)'}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'p-2 rounded-lg border transition-all',
              showFilters
                ? 'bg-cyber-primary/20 border-cyber-primary/50'
                : 'bg-cyber-bg border-cyber-border hover:border-cyber-primary/50'
            )}
            title="Toggle filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <div className="grid grid-cols-2 gap-2">
                {/* Severity Filter */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Severity</label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                    className="w-full px-2 py-1 rounded bg-cyber-bg border border-cyber-border text-sm text-white focus:border-cyber-primary focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Attack Type Filter */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Attack Type</label>
                  <select
                    value={attackTypeFilter}
                    onChange={(e) => setAttackTypeFilter(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-cyber-bg border border-cyber-border text-sm text-white focus:border-cyber-primary focus:outline-none"
                  >
                    <option value="all">All</option>
                    {uniqueAttackTypes.map((type) => (
                      <option key={type} value={type}>
                        {correlationService.getAttackTypeName(type)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(severityFilter !== 'all' || attackTypeFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-cyber-primary transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[500px]"
      >
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400">
              {events.length === 0 ? 'No recent attack events' : 'No events match filters'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredEvents.map((event, index) => (
              <AttackEventCard key={`${event.timestamp}-${index}`} event={event} index={index} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && filteredEvents.length > 0 && (
        <div className="p-2 border-t border-cyber-border bg-cyber-bg">
          <button
            onClick={() => {
              setAutoScroll(true)
              if (feedRef.current) {
                feedRef.current.scrollTop = feedRef.current.scrollHeight
              }
            }}
            className="w-full py-1 text-xs text-cyber-primary hover:text-cyber-secondary transition-colors"
          >
            Scroll to latest events
          </button>
        </div>
      )}
    </div>
  )
}

// Attack Event Card Component
interface AttackEventCardProps {
  event: AttackEvent
  index: number
}

function AttackEventCard({ event, index }: AttackEventCardProps) {
  const timestamp = new Date(event.timestamp)
  const now = new Date()
  const secondsAgo = Math.floor((now.getTime() - timestamp.getTime()) / 1000)

  const getTimeAgo = () => {
    if (secondsAgo < 60) return `${secondsAgo}s ago`
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`
    return timestamp.toLocaleDateString()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/10'
      case 'high':
        return 'border-orange-500/50 bg-orange-500/10'
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10'
      case 'low':
        return 'border-green-500/50 bg-green-500/10'
      default:
        return 'border-cyber-border bg-cyber-bg/50'
    }
  }

  const getSeverityDot = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className={cn('p-3 rounded-lg border', getSeverityColor(event.severity))}
    >
      <div className="flex items-start gap-3">
        {/* Severity Indicator */}
        <div className="flex-shrink-0 mt-1">
          <div className={cn('w-2 h-2 rounded-full', getSeverityDot(event.severity))} />
        </div>

        {/* Event Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-sm font-semibold', correlationService.getSeverityColor(event.severity))}>
                {correlationService.getAttackTypeName(event.attack_type)}
              </span>
              <span className="text-xs text-gray-500">from</span>
              <span className="text-xs font-mono text-gray-300">{event.ip_address}</span>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{getTimeAgo()}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Target:</span>
            <span className="font-mono text-gray-300">{event.target}</span>
          </div>

          {/* Additional Details */}
          {event.details && Object.keys(event.details).length > 0 && (
            <div className="mt-2 pt-2 border-t border-cyber-border/50">
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-cyber-primary transition-colors">
                  Show details
                </summary>
                <div className="mt-2 space-y-1">
                  {Object.entries(event.details).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2">
                      <span className="text-gray-500">{key}:</span>
                      <span className="text-gray-300 break-all">{JSON.stringify(value)}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
