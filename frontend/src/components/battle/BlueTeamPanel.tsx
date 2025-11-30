/**
 * BlueTeamPanel Component
 *
 * Right panel showing BLUE TEAM defensive dashboard
 * Features:
 * - Active defenses grid (using DefenseShieldGrid component)
 * - Metrics: attacks blocked, honeypots triggered, IPs banned, incidents resolved
 * - Defense log (incident responses)
 * - Blue/cyan cyberpunk theme
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Ban, Crosshair, Bot, Zap, Key, CheckCircle } from 'lucide-react'
import type { Defense, BattleMetrics, TeamScore, DefenseType } from '@/types/battle'
import { DEFENSE_CONFIGS } from '@/types/battle'
import { cn } from '@/utils/cn'
import { AttackTooltip } from './AttackTooltip'
import { DefenseActivationFeed } from './DefenseActivationFeed'

interface BlueTeamPanelProps {
  activeDefenses: Defense[]
  score: TeamScore
  metrics: BattleMetrics
  events: Array<{ id: string; message: string; timestamp: number; team: 'red' | 'blue' }>
  blockingDefenseId?: string
  onBlockComplete?: (defenseId: string) => void
}

const DEFENSE_ICONS: Record<DefenseType, React.ElementType> = {
  waf: Shield,
  rate_limit: Zap,
  honeypot: Crosshair,
  ip_ban: Ban,
  token_revocation: Key,
  incident_response: Bot,
  jwt_validation: CheckCircle,
}

const DEFENSE_COLORS: Record<DefenseType, string> = {
  waf: '#3b82f6',
  rate_limit: '#06b6d4',
  honeypot: '#f59e0b',
  ip_ban: '#ef4444',
  token_revocation: '#8b5cf6',
  incident_response: '#10b981',
  jwt_validation: '#06b6d4',
}

export function BlueTeamPanel({
  activeDefenses,
  score,
  metrics,
  events,
  blockingDefenseId,
  onBlockComplete,
}: BlueTeamPanelProps) {
  const blueEvents = events.filter((e) => e.team === 'blue').slice(-20).reverse()

  return (
    <div className="h-full flex flex-col bg-gradient-to-bl from-blue-950/40 to-cyan-950/40 border-l border-blue-900/50 relative">
      {/* Header */}
      <div className="p-3 border-b border-blue-900/50 bg-blue-950/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="w-6 h-6 text-blue-500" />
            <motion.div
              className="absolute inset-0 blur-xl bg-blue-500/50"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-500 font-mono">BLUE TEAM</h2>
            <p className="text-xs text-blue-400/70">Defensive Operations</p>
          </div>
        </div>

        {/* Score Display */}
        <div className="mt-3 p-3 bg-black/30 rounded-lg border border-blue-900/30">
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-400/70">POINTS</span>
            <motion.span
              key={score.points}
              className="text-2xl font-bold text-blue-500 font-mono"
              initial={{ scale: 1.3, color: '#0000ff' }}
              animate={{ scale: 1, color: '#3b82f6' }}
              transition={{ duration: 0.3 }}
            >
              {score.points}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-3 border-b border-blue-900/50">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Blocked"
            value={score.attacksBlocked || 0}
            icon={Shield}
            color="blue"
          />
          <MetricCard
            label="Honeypots"
            value={score.honeypotsTriggered || 0}
            icon={Crosshair}
            color="cyan"
          />
          <MetricCard
            label="IPs Banned"
            value={score.ipsBanned || 0}
            icon={Ban}
            color="blue"
          />
          <MetricCard
            label="Incidents"
            value={score.incidentsResolved || 0}
            icon={Bot}
            color="cyan"
          />
        </div>
      </div>

      {/* Active Defenses - No Scroll */}
      <div className="p-2 border-b border-blue-900/50 shrink-0">
        <h3 className="text-[10px] font-semibold text-blue-400/70 mb-2 uppercase tracking-wider">
          Active Defenses ({activeDefenses.length})
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {activeDefenses.length === 0 ? (
            <div className="text-xs text-blue-400/50 text-center py-4 col-span-3">
              No active defenses
            </div>
          ) : (
            activeDefenses.map((defense) => (
              <SimpleDefenseIcon
                key={defense.id}
                defense={defense}
                isBlocking={defense.id === blockingDefenseId}
                onBlockComplete={onBlockComplete}
              />
            ))
          )}
        </div>
      </div>

      {/* Defense Log */}
      <div className="flex-1 p-2 overflow-y-auto custom-scrollbar-blue min-h-0">
        <h3 className="text-[10px] font-semibold text-blue-400/70 mb-2 uppercase tracking-wider">
          Defense Log
        </h3>
        <div className="space-y-1">
          <AnimatePresence>
            {blueEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.05 }}
                className="text-xs font-mono text-blue-400/70 p-2 bg-black/20 rounded border border-blue-900/20"
              >
                <span className="text-blue-500/50">
                  [{new Date(event.timestamp).toLocaleTimeString()}]
                </span>{' '}
                {event.message}
              </motion.div>
            ))}
          </AnimatePresence>
          {blueEvents.length === 0 && (
            <div className="text-xs text-blue-400/50 text-center py-4">
              No events yet
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="p-2 border-t border-blue-900/50 bg-blue-950/30 shrink-0">
        <h3 className="text-[10px] font-semibold text-blue-400/70 mb-2 uppercase tracking-wider">
          System Status
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-blue-400/70">Systems Intact</span>
            <motion.span
              key={metrics.systemsIntact.length}
              className="text-blue-500 font-mono font-bold"
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {metrics.systemsIntact.length}
            </motion.span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-blue-400/70">Systems Compromised</span>
            <motion.span
              key={metrics.systemsCompromised.length}
              className="text-red-500 font-mono font-bold"
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {metrics.systemsCompromised.length}
            </motion.span>
          </div>
          <div className="mt-3 space-y-1">
            {metrics.systemsIntact.map((system) => (
              <div
                key={system}
                className="flex items-center gap-2 p-1 bg-green-950/30 border border-green-900/30 rounded text-xs"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 font-mono">{system}</span>
              </div>
            ))}
            {metrics.systemsCompromised.map((system) => (
              <div
                key={system}
                className="flex items-center gap-2 p-1 bg-red-950/30 border border-red-900/30 rounded text-xs"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 font-mono line-through">{system}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'cyan'
}

function MetricCard({ label, value, icon: Icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-500 bg-blue-950/30 border-blue-900/30',
    cyan: 'text-cyan-500 bg-cyan-950/30 border-cyan-900/30',
  }

  return (
    <div className={cn('p-2 rounded border', colorClasses[color])}>
      <div className="flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3" />
        <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
      </div>
      <motion.div
        key={value}
        className="text-lg font-bold font-mono"
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {value}
      </motion.div>
    </div>
  )
}

interface SimpleDefenseIconProps {
  defense: Defense
  isBlocking: boolean
  onBlockComplete?: (defenseId: string) => void
}

function SimpleDefenseIcon({ defense, isBlocking, onBlockComplete }: SimpleDefenseIconProps) {
  const config = DEFENSE_CONFIGS[defense.type]
  const color = DEFENSE_COLORS[defense.type]

  return (
    <div className="w-full">
      <AttackTooltip type={defense.type} mode="defense">
        <motion.div
          className={cn(
            'p-2 rounded border flex flex-col items-center justify-center gap-1 min-h-[60px] cursor-help w-full',
            'bg-blue-950/50 border-blue-700/50 text-blue-400 hover:bg-blue-900/50'
          )}
          animate={{
            scale: isBlocking ? [1, 1.1, 1] : 1,
            borderColor: isBlocking ? [color, '#ffffff', color] : undefined,
          }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={() => {
            if (isBlocking && onBlockComplete) {
              onBlockComplete(defense.id)
            }
          }}
        >
          <span className="text-lg">{config.icon}</span>
          <span className="text-[8px] leading-tight text-center w-full px-1">{config.displayName}</span>
        </motion.div>
      </AttackTooltip>
    </div>
  )
}

// Custom scrollbar styles for blue team (add to global CSS)
const scrollbarStyles = `
  .custom-scrollbar-blue::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar-blue::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }
  .custom-scrollbar-blue::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.3);
    border-radius: 2px;
  }
  .custom-scrollbar-blue::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.5);
  }
`
