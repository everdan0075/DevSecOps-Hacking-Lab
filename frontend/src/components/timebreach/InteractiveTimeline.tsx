/**
 * Interactive Timeline Component
 *
 * Horizontal timeline slider showing mission phases
 */

import { motion } from 'framer-motion'
import { Clock, AlertCircle, CheckCircle, Shield, Target, Bell } from 'lucide-react'
import type { TimelinePhase } from '@/types/mission'
import { cn } from '@/utils/cn'

interface InteractiveTimelineProps {
  phases: TimelinePhase[]
  currentPhaseIndex: number
  onPhaseChange: (phaseIndex: number) => void
}

export function InteractiveTimeline({ phases, currentPhaseIndex, onPhaseChange }: InteractiveTimelineProps) {
  const getPhaseIcon = (type: TimelinePhase['type']) => {
    switch (type) {
      case 'discovery':
        return AlertCircle
      case 'notification':
        return Bell
      case 'exploitation':
        return Target
      case 'breach':
        return AlertCircle
      case 'detection':
        return Shield
      case 'disclosure':
        return Bell
      case 'response':
        return CheckCircle
      default:
        return Clock
    }
  }

  const getPhaseColor = (type: TimelinePhase['type'], importance: TimelinePhase['importance']) => {
    if (importance === 'critical') {
      return type === 'exploitation' || type === 'breach' ? 'red' : 'orange'
    }
    if (importance === 'high') {
      return 'yellow'
    }
    return 'blue'
  }

  return (
    <div className="relative">
      {/* Timeline Bar */}
      <div className="relative h-2 bg-cyber-border rounded-full mb-6">
        {/* Progress */}
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyber-primary to-cyber-secondary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentPhaseIndex + 1) / phases.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />

        {/* Phase Dots */}
        <div className="absolute inset-0 flex justify-between items-center px-1">
          {phases.map((phase, index) => {
            const Icon = getPhaseIcon(phase.type)
            const color = getPhaseColor(phase.type, phase.importance)
            const isActive = index === currentPhaseIndex
            const isCompleted = index < currentPhaseIndex

            return (
              <motion.button
                key={phase.id}
                onClick={() => onPhaseChange(index)}
                className={cn(
                  'relative z-10 w-6 h-6 rounded-full border-2 transition-all',
                  isActive && 'scale-125',
                  isCompleted && 'bg-cyber-primary border-cyber-primary',
                  !isCompleted && !isActive && 'bg-cyber-bg border-cyber-border',
                  isActive && color === 'red' && 'bg-red-500 border-red-500',
                  isActive && color === 'orange' && 'bg-orange-500 border-orange-500',
                  isActive && color === 'yellow' && 'bg-yellow-500 border-yellow-500',
                  isActive && color === 'blue' && 'bg-blue-500 border-blue-500'
                )}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 1.1 }}
              >
                {isActive && (
                  <motion.div
                    className={cn(
                      'absolute inset-0 rounded-full',
                      color === 'red' && 'bg-red-500',
                      color === 'orange' && 'bg-orange-500',
                      color === 'yellow' && 'bg-yellow-500',
                      color === 'blue' && 'bg-blue-500'
                    )}
                    animate={{ opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Current Phase Info */}
      <motion.div
        key={currentPhaseIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="p-4 bg-cyber-bg border border-cyber-border rounded-lg"
      >
        <div className="flex items-start gap-3">
          {(() => {
            const Icon = getPhaseIcon(phases[currentPhaseIndex].type)
            const color = getPhaseColor(phases[currentPhaseIndex].type, phases[currentPhaseIndex].importance)
            return (
              <div
                className={cn(
                  'p-2 rounded',
                  color === 'red' && 'bg-red-500/20',
                  color === 'orange' && 'bg-orange-500/20',
                  color === 'yellow' && 'bg-yellow-500/20',
                  color === 'blue' && 'bg-blue-500/20'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5',
                    color === 'red' && 'text-red-500',
                    color === 'orange' && 'text-orange-500',
                    color === 'yellow' && 'text-yellow-500',
                    color === 'blue' && 'text-blue-500'
                  )}
                />
              </div>
            )
          })()}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500">{phases[currentPhaseIndex].displayDate}</span>
              <span className="text-xs text-gray-600">•</span>
              <span className="text-xs text-gray-500 capitalize">{phases[currentPhaseIndex].type}</span>
            </div>
            <div className="font-semibold text-white mb-1">{phases[currentPhaseIndex].title}</div>
            <div className="text-sm text-gray-400">{phases[currentPhaseIndex].description}</div>

            {phases[currentPhaseIndex].actors && phases[currentPhaseIndex].actors!.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {phases[currentPhaseIndex].actors!.map((actor) => (
                  <span
                    key={actor}
                    className="px-2 py-0.5 bg-cyber-primary/10 border border-cyber-primary/30 rounded text-xs text-cyber-primary"
                  >
                    {actor}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Phase Counter */}
      <div className="mt-3 text-center text-xs text-gray-500">
        Phase {currentPhaseIndex + 1} of {phases.length}
      </div>
    </div>
  )
}
