/**
 * RedTeamPanel Component
 *
 * Left panel showing RED TEAM offensive dashboard
 * Features:
 * - Score and metrics display
 * - Attack launchers grid
 * - Active attacks feed
 * - Attack event log
 * - Red/orange cyberpunk theme
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Zap, TrendingUp, Database, AlertTriangle, Target } from 'lucide-react'
import { ATTACK_CONFIGS, type Attack, type BattleMetrics, type TeamScore } from '@/types/battle'
import { cn } from '@/utils/cn'
import { AttackTooltip } from './AttackTooltip'

interface RedTeamPanelProps {
  activeAttacks: Attack[]
  score: TeamScore
  metrics: BattleMetrics
  events: Array<{ id: string; message: string; timestamp: number; team: 'red' | 'blue' }>
  onLaunchAttack: (attackType: string) => void
  enabledAttacks: string[]
  isPaused: boolean
}

export function RedTeamPanel({
  activeAttacks,
  score,
  metrics,
  events,
  onLaunchAttack,
  enabledAttacks,
  isPaused,
}: RedTeamPanelProps) {
  const redEvents = events.filter((e) => e.team === 'red').slice(-20).reverse()

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-950/40 to-orange-950/40 border-r border-red-900/50 relative">
      {/* Header */}
      <div className="p-3 border-b border-red-900/50 bg-red-950/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="w-6 h-6 text-red-500" />
            <motion.div
              className="absolute inset-0 blur-xl bg-red-500/50"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-500 font-mono">RED TEAM</h2>
            <p className="text-xs text-red-400/70">Offensive Operations</p>
          </div>
        </div>

        {/* Score Display */}
        <div className="mt-3 p-3 bg-black/30 rounded-lg border border-red-900/30">
          <div className="flex justify-between items-center">
            <span className="text-xs text-red-400/70">POINTS</span>
            <motion.span
              key={score.points}
              className="text-2xl font-bold text-red-500 font-mono"
              initial={{ scale: 1.3, color: '#ff0000' }}
              animate={{ scale: 1, color: '#ef4444' }}
              transition={{ duration: 0.3 }}
            >
              {score.points}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-3 border-b border-red-900/50">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Attacks"
            value={score.attacksLaunched || 0}
            icon={Zap}
            color="red"
          />
          <MetricCard
            label="Success"
            value={`${Math.round(metrics.successRate || 0)}%`}
            icon={TrendingUp}
            color="orange"
          />
          <MetricCard
            label="Breaches"
            value={score.systemsCompromised || 0}
            icon={AlertTriangle}
            color="red"
          />
          <MetricCard
            label="Data"
            value={`${Math.round(score.dataExfiltrated || 0)}MB`}
            icon={Database}
            color="orange"
          />
        </div>
      </div>

      {/* Attack Launchers */}
      <div className="p-2 border-b border-red-900/50 shrink-0">
        <h3 className="text-[10px] font-semibold text-red-400/70 mb-2 uppercase tracking-wider">
          Attack Arsenal
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ATTACK_CONFIGS).map(([type, config]) => {
            const isEnabled = enabledAttacks.includes(type)
            return (
              <AttackTooltip key={type} type={type as any} mode="attack">
                <button
                  onClick={() => isEnabled && !isPaused && onLaunchAttack(type)}
                  disabled={!isEnabled || isPaused}
                  className={cn(
                    'p-2 rounded border text-xs flex flex-col items-center justify-center gap-1 min-h-[60px]',
                    isEnabled && !isPaused
                      ? 'bg-red-950/50 border-red-700/50 text-red-400 hover:bg-red-900/50 cursor-pointer'
                      : 'bg-gray-900/30 border-gray-800/50 text-gray-600 cursor-not-allowed opacity-50'
                  )}
                >
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-[8px] leading-tight text-center">{config.displayName}</span>
                </button>
              </AttackTooltip>
            )
          })}
        </div>
      </div>

      {/* Active Attacks */}
      <div className="p-2 border-b border-red-900/50 shrink-0">
        <h3 className="text-[10px] font-semibold text-red-400/70 mb-2 uppercase tracking-wider">
          Active Attacks ({activeAttacks.length})
        </h3>
        <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar-red">
          {activeAttacks.length === 0 ? (
            <div className="text-xs text-red-400/50 text-center py-4">
              No active attacks
            </div>
          ) : (
            activeAttacks.slice(0, 5).map((attack) => (
              <motion.div
                key={attack.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-2 bg-black/20 rounded border border-red-900/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-red-400 font-mono truncate">{attack.name}</span>
                  <span className="text-[10px] text-red-500/70">{attack.progress}%</span>
                </div>
                <div className="h-1.5 bg-red-950/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${attack.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Attack Log */}
      <div className="flex-1 p-2 overflow-y-auto custom-scrollbar-red min-h-0">
        <h3 className="text-[10px] font-semibold text-red-400/70 mb-2 uppercase tracking-wider">
          Attack Log
        </h3>
        <div className="space-y-1">
          <AnimatePresence>
            {redEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.05 }}
                className="text-xs font-mono text-red-400/70 p-2 bg-black/20 rounded border border-red-900/20"
              >
                <span className="text-red-500/50">
                  [{new Date(event.timestamp).toLocaleTimeString()}]
                </span>{' '}
                {event.message}
              </motion.div>
            ))}
          </AnimatePresence>
          {redEvents.length === 0 && (
            <div className="text-xs text-red-400/50 text-center py-4">
              No events yet
            </div>
          )}
        </div>
      </div>

      {/* Attack Stats */}
      <div className="p-2 border-t border-red-900/50 bg-red-950/30 shrink-0">
        <h3 className="text-[10px] font-semibold text-red-400/70 mb-2 uppercase tracking-wider">
          Combat Stats
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-red-400/70">Success Rate</span>
            <motion.span
              key={metrics.successRate}
              className="text-red-500 font-mono font-bold"
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {Math.round(metrics.successRate || 0)}%
            </motion.span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-red-400/70">Systems Compromised</span>
            <motion.span
              key={score.systemsCompromised}
              className="text-orange-500 font-mono font-bold"
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {score.systemsCompromised || 0}
            </motion.span>
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
  color: 'red' | 'orange'
}

function MetricCard({ label, value, icon: Icon, color }: MetricCardProps) {
  const colorClasses = {
    red: 'text-red-500 bg-red-950/30 border-red-900/30',
    orange: 'text-orange-500 bg-orange-950/30 border-orange-900/30',
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

// Custom scrollbar styles for red team (add to global CSS)
const scrollbarStyles = `
  .custom-scrollbar-red::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar-red::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }
  .custom-scrollbar-red::-webkit-scrollbar-thumb {
    background: rgba(239, 68, 68, 0.3);
    border-radius: 2px;
  }
  .custom-scrollbar-red::-webkit-scrollbar-thumb:hover {
    background: rgba(239, 68, 68, 0.5);
  }
`
