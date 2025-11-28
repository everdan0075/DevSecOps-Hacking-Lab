/**
 * ScoreBoard Component
 *
 * Top bar showing scores and battle status
 * Features:
 * - Left: RED score + points
 * - Center: Advantage bar (red <- neutral -> blue) with slider
 * - Right: BLUE score + points
 * - Phase indicator with countdown timer
 */

import { motion } from 'framer-motion'
import { Zap, Shield, Clock } from 'lucide-react'
import type { BattleScore, BattlePhase } from '@/types/battle'
import { cn } from '@/utils/cn'

interface ScoreBoardProps {
  score: BattleScore
  phase: BattlePhase
  phaseDisplayName: string
  phaseTimeRemaining: number
  isPaused: boolean
}

export function ScoreBoard({
  score,
  phase,
  phaseDisplayName,
  phaseTimeRemaining,
  isPaused,
}: ScoreBoardProps) {
  const { red, blue, advantage, advantagePoints } = score

  // Calculate advantage percentage for slider (0-100, where 50 is neutral)
  const maxPoints = 500 // max expected point difference for scaling
  const advantagePercentage = advantage === 'neutral'
    ? 50
    : advantage === 'red'
    ? Math.max(0, 50 - (advantagePoints / maxPoints) * 50)
    : Math.min(100, 50 + (advantagePoints / maxPoints) * 50)

  // Format time remaining
  const minutes = Math.floor(phaseTimeRemaining / 60)
  const seconds = phaseTimeRemaining % 60
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="h-20 bg-cyber-surface/95 backdrop-blur-sm border-b border-cyber-border flex items-center px-4">
      <div className="flex items-center justify-between w-full gap-4">
        {/* RED TEAM Score */}
        <div className="flex items-center gap-4 min-w-[200px]">
          <div className="relative">
            <Zap className="w-8 h-8 text-red-500" />
            <motion.div
              className="absolute inset-0 blur-xl bg-red-500/50"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <div className="text-xs text-red-400/70 font-mono uppercase">Red Team</div>
            <motion.div
              key={red.points}
              className="text-2xl font-bold text-red-500 font-mono"
              initial={{ scale: 1.2, color: '#ff0000' }}
              animate={{ scale: 1, color: '#ef4444' }}
              transition={{ duration: 0.3 }}
            >
              {red.points}
            </motion.div>
          </div>
        </div>

        {/* CENTER: Advantage Bar + Phase Info */}
        <div className="flex-1 max-w-2xl">
          {/* Phase Info */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-cyber-bg/50 border border-cyber-border rounded-lg">
              <Clock className="w-4 h-4 text-cyber-primary" />
              <span className="text-xs font-mono text-cyber-primary">
                Phase {getPhaseNumber(phase)}: {phaseDisplayName}
              </span>
              <span className={cn(
                'text-sm font-mono font-bold',
                isPaused ? 'text-yellow-500' : 'text-cyber-secondary'
              )}>
                {isPaused ? 'PAUSED' : timeString}
              </span>
            </div>
          </div>

          {/* Advantage Bar */}
          <div className="relative">
            {/* Background Track */}
            <div className="h-3 bg-gradient-to-r from-red-950 via-gray-900 to-blue-950 rounded-full border border-cyber-border/30" />

            {/* Slider Position Indicator */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 shadow-lg"
              style={{
                left: `calc(${advantagePercentage}% - 12px)`,
                borderColor: advantage === 'red' ? '#ef4444' : advantage === 'blue' ? '#3b82f6' : '#6b7280',
                backgroundColor: advantage === 'red' ? '#dc2626' : advantage === 'blue' ? '#2563eb' : '#4b5563',
                boxShadow: advantage === 'red'
                  ? '0 0 20px rgba(239, 68, 68, 0.8)'
                  : advantage === 'blue'
                  ? '0 0 20px rgba(59, 130, 246, 0.8)'
                  : '0 0 10px rgba(107, 114, 128, 0.5)',
              }}
              animate={{
                scale: isPaused ? 1 : [1, 1.2, 1],
              }}
              transition={{
                duration: 1,
                repeat: isPaused ? 0 : Infinity,
              }}
            />

            {/* Labels */}
            <div className="flex justify-between mt-2 text-xs font-mono">
              <span className="text-red-500">RED ADVANTAGE</span>
              <span className="text-gray-500">NEUTRAL</span>
              <span className="text-blue-500">BLUE ADVANTAGE</span>
            </div>

            {/* Advantage Text */}
            <div className="text-center mt-2">
              <motion.span
                key={advantage}
                className={cn(
                  'text-sm font-mono font-bold uppercase',
                  advantage === 'red' && 'text-red-500',
                  advantage === 'blue' && 'text-blue-500',
                  advantage === 'neutral' && 'text-gray-500'
                )}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {advantage === 'neutral' ? 'Balanced' : `${advantage} +${advantagePoints}`}
              </motion.span>
            </div>
          </div>
        </div>

        {/* BLUE TEAM Score */}
        <div className="flex items-center gap-4 min-w-[200px] justify-end">
          <div className="text-right">
            <div className="text-xs text-blue-400/70 font-mono uppercase">Blue Team</div>
            <motion.div
              key={blue.points}
              className="text-2xl font-bold text-blue-500 font-mono"
              initial={{ scale: 1.2, color: '#0000ff' }}
              animate={{ scale: 1, color: '#3b82f6' }}
              transition={{ duration: 0.3 }}
            >
              {blue.points}
            </motion.div>
          </div>
          <div className="relative">
            <Shield className="w-8 h-8 text-blue-500" />
            <motion.div
              className="absolute inset-0 blur-xl bg-blue-500/50"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function getPhaseNumber(phase: BattlePhase): number {
  const phases: Record<BattlePhase, number> = {
    reconnaissance: 1,
    exploitation: 2,
    containment: 3,
    complete: 4,
  }
  return phases[phase] || 0
}
