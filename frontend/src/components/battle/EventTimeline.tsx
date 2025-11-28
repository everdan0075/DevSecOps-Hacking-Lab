/**
 * EventTimeline Component
 *
 * Bottom timeline showing horizontal scrolling event feed
 * Features:
 * - Events with icons, timestamp, team color
 * - Auto-scroll to latest
 * - Max height ~100px
 * - Color-coded by event type
 */

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Shield,
  AlertTriangle,
  Ban,
  Crosshair,
  Key,
  Activity,
  CheckCircle,
} from 'lucide-react'
import type { BattleEvent, BattleEventType } from '@/types/battle'
import { cn } from '@/utils/cn'

interface EventTimelineProps {
  events: BattleEvent[]
  maxEvents?: number
}

const EVENT_ICONS: Record<BattleEventType, React.ComponentType<{ className?: string }>> = {
  attack_launched: Zap,
  attack_blocked: Shield,
  attack_success: AlertTriangle,
  defense_activated: Shield,
  honeypot_triggered: Crosshair,
  ip_banned: Ban,
  breach: AlertTriangle,
  token_revoked: Key,
  phase_change: Activity,
  critical_moment: AlertTriangle,
}

const EVENT_COLORS: Record<BattleEventType, { bg: string; border: string; text: string }> = {
  attack_launched: {
    bg: 'bg-red-950/40',
    border: 'border-red-900/50',
    text: 'text-red-400',
  },
  attack_blocked: {
    bg: 'bg-blue-950/40',
    border: 'border-blue-900/50',
    text: 'text-blue-400',
  },
  attack_success: {
    bg: 'bg-red-950/60',
    border: 'border-red-700/70',
    text: 'text-red-300',
  },
  defense_activated: {
    bg: 'bg-blue-950/40',
    border: 'border-blue-900/50',
    text: 'text-blue-400',
  },
  honeypot_triggered: {
    bg: 'bg-yellow-950/40',
    border: 'border-yellow-900/50',
    text: 'text-yellow-400',
  },
  ip_banned: {
    bg: 'bg-purple-950/40',
    border: 'border-purple-900/50',
    text: 'text-purple-400',
  },
  breach: {
    bg: 'bg-red-950/70',
    border: 'border-red-600/80',
    text: 'text-red-200',
  },
  token_revoked: {
    bg: 'bg-purple-950/40',
    border: 'border-purple-900/50',
    text: 'text-purple-400',
  },
  phase_change: {
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-900/50',
    text: 'text-cyan-400',
  },
  critical_moment: {
    bg: 'bg-orange-950/60',
    border: 'border-orange-700/70',
    text: 'text-orange-300',
  },
}

export function EventTimeline({ events, maxEvents = 50 }: EventTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest event
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [events])

  const displayEvents = events.slice(-maxEvents)

  return (
    <div className="h-20 bg-cyber-surface/95 backdrop-blur-sm border-t border-cyber-border overflow-hidden">
      <div className="px-4 py-1.5 border-b border-cyber-border/50">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-cyber-primary font-mono uppercase tracking-wider">
            Event Timeline
          </h3>
          <span className="text-xs text-gray-500 font-mono">
            {displayEvents.length} events
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-[calc(100%-2rem)] overflow-x-auto overflow-y-hidden px-4 py-1.5 custom-scrollbar-timeline"
      >
        <div className="flex gap-3 h-full items-center">
          <AnimatePresence initial={false}>
            {displayEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500 font-mono"
              >
                Waiting for events...
              </motion.div>
            ) : (
              displayEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

interface EventCardProps {
  event: BattleEvent
  index: number
}

function EventCard({ event, index }: EventCardProps) {
  const Icon = EVENT_ICONS[event.type] || Activity
  const colors = EVENT_COLORS[event.type] || EVENT_COLORS.phase_change

  return (
    <motion.div
      initial={{ opacity: 0, x: -50, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={cn(
        'flex-shrink-0 flex items-center gap-3 px-4 py-2 rounded-lg border min-w-[280px] max-w-[400px]',
        colors.bg,
        colors.border
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <div className="relative">
          <Icon className={cn('w-5 h-5', colors.text)} />
          {event.severity === 'critical' && (
            <motion.div
              className="absolute inset-0 blur-lg bg-red-500/50"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={cn('text-xs font-mono', colors.text)}>
            {formatEventType(event.type)}
          </span>
          <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">
            {formatTime(event.timestamp)}
          </span>
        </div>
        <p className="text-xs text-gray-400 truncate">{event.message}</p>
      </div>

      {/* Points Badge */}
      {event.points > 0 && (
        <motion.div
          className={cn(
            'flex-shrink-0 px-2 py-1 rounded text-xs font-bold font-mono',
            event.team === 'red' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
          )}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          +{event.points}
        </motion.div>
      )}

      {/* Severity Indicator */}
      {event.severity === 'critical' && (
        <motion.div
          className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  )
}

function formatEventType(type: BattleEventType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

// Custom scrollbar styles for timeline (add to global CSS)
const scrollbarStyles = `
  .custom-scrollbar-timeline::-webkit-scrollbar {
    height: 4px;
  }
  .custom-scrollbar-timeline::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }
  .custom-scrollbar-timeline::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.3);
    border-radius: 2px;
  }
  .custom-scrollbar-timeline::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.5);
  }
`
