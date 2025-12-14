/**
 * Interactive Timeline Component
 *
 * Horizontal timeline slider showing mission phases
 */

import { motion } from 'framer-motion'
import { Clock, AlertCircle, CheckCircle, Shield, Target, Bell, ChevronLeft, ChevronRight } from 'lucide-react'
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
      <div className="flex items-center gap-4">
        {/* Previous Button */}
        <button
          onClick={() => currentPhaseIndex > 0 && onPhaseChange(currentPhaseIndex - 1)}
          disabled={currentPhaseIndex === 0}
          className={cn(
            'p-2 rounded-lg transition-all',
            currentPhaseIndex === 0
              ? 'opacity-30 cursor-not-allowed bg-gray-800'
              : 'bg-cyber-bg border border-cyber-border hover:border-cyber-primary hover:bg-cyber-primary/10'
          )}
          title="Previous phase"
        >
          <ChevronLeft className="w-5 h-5 text-cyber-primary" />
        </button>

        <div className="flex-1">
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
            <div className="absolute inset-0 flex justify-between items-center px-2">
          {phases.map((phase, index) => {
            const Icon = getPhaseIcon(phase.type)
            const color = getPhaseColor(phase.type, phase.importance)
            const isActive = index === currentPhaseIndex
            const isCompleted = index < currentPhaseIndex

            return (
              <motion.button
                key={phase.id}
                onClick={() => onPhaseChange(index)}
                title={`${phase.displayDate} - ${phase.title}`}
                className={cn(
                  'relative z-10 w-3 h-3 rounded-full border-2 transition-all cursor-pointer',
                  isActive && 'w-4 h-4 ring-2 ring-offset-2 ring-offset-cyber-bg',
                  isCompleted && 'bg-cyber-primary border-cyber-primary hover:ring-2 hover:ring-cyber-primary hover:ring-offset-2 hover:ring-offset-cyber-bg',
                  !isCompleted && !isActive && 'bg-cyber-bg border-cyber-border hover:ring-2 hover:ring-gray-500 hover:ring-offset-2 hover:ring-offset-cyber-bg',
                  isActive && color === 'red' && 'bg-red-500 border-red-500 ring-red-500 shadow-lg shadow-red-500/50',
                  isActive && color === 'orange' && 'bg-orange-500 border-orange-500 ring-orange-500 shadow-lg shadow-orange-500/50',
                  isActive && color === 'yellow' && 'bg-yellow-500 border-yellow-500 ring-yellow-500 shadow-lg shadow-yellow-500/50',
                  isActive && color === 'blue' && 'bg-blue-500 border-blue-500 ring-blue-500 shadow-lg shadow-blue-500/50'
                )}
                whileHover={{ scale: isActive ? 1.3 : 1.2 }}
                whileTap={{ scale: 0.95 }}
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

        {/* Next Button */}
        <button
          onClick={() => currentPhaseIndex < phases.length - 1 && onPhaseChange(currentPhaseIndex + 1)}
          disabled={currentPhaseIndex === phases.length - 1}
          className={cn(
            'p-2 rounded-lg transition-all',
            currentPhaseIndex === phases.length - 1
              ? 'opacity-30 cursor-not-allowed bg-gray-800'
              : 'bg-cyber-bg border border-cyber-border hover:border-cyber-primary hover:bg-cyber-primary/10'
          )}
          title="Next phase"
        >
          <ChevronRight className="w-5 h-5 text-cyber-primary" />
        </button>
      </div>
    </div>
  )
}
