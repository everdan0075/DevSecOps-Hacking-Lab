/**
 * RedTeamPanel Component
 *
 * Left panel showing RED TEAM offensive dashboard
 * Features:
 * - Active attacks list with progress bars
 * - Metrics: attempts, success rate, breaches, data exfiltrated
 * - Live attack feed (scrolling logs)
 * - Manual attack launcher buttons
 * - Red/orange cyberpunk theme
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Zap, TrendingUp, Database, AlertTriangle } from 'lucide-react'
import { ATTACK_CONFIGS, type Attack, type BattleMetrics, type TeamScore } from '@/types/battle'
import { cn } from '@/utils/cn'

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
    <div className="h-full flex flex-col bg-gradient-to-br from-red-950/40 to-orange-950/40 border-r border-red-900/50">
      {/* Header */}
      <div className="p-4 border-b border-red-900/50 bg-red-950/50">
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
      <div className="p-4 border-b border-red-900/50">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Attacks"
            value={score.attacksLaunched || 0}
            icon={Zap}
            color="red"
          />
          <MetricCard
            label="Success Rate"
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
            label="Data (MB)"
            value={Math.round(score.dataExfiltrated || 0)}
            icon={Database}
            color="orange"
          />
        </div>
      </div>

      {/* Active Attacks */}
      <div className="p-4 border-b border-red-900/50 max-h-48 overflow-y-auto custom-scrollbar">
        <h3 className="text-xs font-semibold text-red-400/70 mb-3 uppercase tracking-wider">
          Active Attacks ({activeAttacks.length})
        </h3>
        <div className="space-y-2">
          <AnimatePresence>
            {activeAttacks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-400/50 text-center py-4"
              >
                No active attacks
              </motion.div>
            ) : (
              activeAttacks.map((attack) => (
                <motion.div
                  key={attack.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-2 bg-black/30 rounded border border-red-900/30"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono text-red-400">
                      {ATTACK_CONFIGS[attack.type]?.icon} {attack.name}
                    </span>
                    <span className="text-xs text-red-400/50">
                      {attack.status}
                    </span>
                  </div>
                  <div className="h-1 bg-red-950/50 rounded-full overflow-hidden">
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
          </AnimatePresence>
        </div>
      </div>

      {/* Attack Feed */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <h3 className="text-xs font-semibold text-red-400/70 mb-3 uppercase tracking-wider">
          Attack Feed
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

      {/* Attack Launchers */}
      <div className="p-4 border-t border-red-900/50 bg-red-950/30">
        <h3 className="text-xs font-semibold text-red-400/70 mb-3 uppercase tracking-wider">
          Launch Attack
        </h3>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
          {Object.entries(ATTACK_CONFIGS).map(([type, config]) => {
            const isEnabled = enabledAttacks.includes(type)
            return (
              <motion.button
                key={type}
                onClick={() => isEnabled && !isPaused && onLaunchAttack(type)}
                disabled={!isEnabled || isPaused}
                whileHover={isEnabled && !isPaused ? { scale: 1.05 } : {}}
                whileTap={isEnabled && !isPaused ? { scale: 0.95 } : {}}
                className={cn(
                  'p-2 rounded border text-xs font-mono transition-all',
                  isEnabled && !isPaused
                    ? 'bg-red-950/50 border-red-700/50 text-red-400 hover:bg-red-900/50 hover:border-red-600 cursor-pointer'
                    : 'bg-gray-900/30 border-gray-800/50 text-gray-600 cursor-not-allowed opacity-50'
                )}
              >
                <div className="flex items-center gap-1">
                  <span>{config.icon}</span>
                  <span className="truncate">{config.displayName}</span>
                </div>
                <div className="text-[10px] text-red-400/50 mt-1">
                  {config.basePoints}pts
                </div>
              </motion.button>
            )
          })}
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

// Custom scrollbar styles (add to global CSS)
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(239, 68, 68, 0.3);
    border-radius: 2px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(239, 68, 68, 0.5);
  }
`
