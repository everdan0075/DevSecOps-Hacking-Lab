/**
 * Mission Objectives Component
 *
 * Displays objectives for current mission phase and handles completion
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Lock, Target, Shield, Search, Lightbulb, Award } from 'lucide-react'
import type { Mission, MissionProgress, TimelinePhase, MissionRole, Objective } from '@/types/mission'
import { cn } from '@/utils/cn'

interface MissionObjectivesProps {
  mission: Mission
  progress: MissionProgress
  currentPhase: TimelinePhase
  role: MissionRole
  onObjectiveComplete: (objectiveId: string, points: number) => void
  onEvidenceDiscovered: (evidenceId: string) => void
}

export function MissionObjectives({
  mission,
  progress,
  currentPhase,
  role,
  onObjectiveComplete,
  onEvidenceDiscovered,
}: MissionObjectivesProps) {
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null)
  const [showHints, setShowHints] = useState<Record<string, number>>({})

  // Get objectives for current phase and role
  const phaseObjectives = mission.objectives.filter(
    (obj) => obj.phaseId === currentPhase.id && obj.role === role
  )

  const getObjectiveStatus = (objective: Objective): 'locked' | 'available' | 'completed' => {
    if (progress.completedObjectives.includes(objective.id)) {
      return 'completed'
    }

    // Check if requirements are met
    if (objective.requiredObjectives) {
      const allRequired = objective.requiredObjectives.every((reqId) =>
        progress.completedObjectives.includes(reqId)
      )
      if (!allRequired) return 'locked'
    }

    if (objective.requiredEvidence) {
      const allEvidence = objective.requiredEvidence.every((evidenceId) =>
        progress.discoveredEvidence.includes(evidenceId)
      )
      if (!allEvidence) return 'locked'
    }

    return 'available'
  }

  const handleObjectiveClick = (objective: Objective) => {
    const status = getObjectiveStatus(objective)
    if (status !== 'locked') {
      setSelectedObjective(objective)
    }
  }

  const handleRevealHint = (objectiveId: string, hintIndex: number, cost: number) => {
    setShowHints({
      ...showHints,
      [objectiveId]: Math.max(showHints[objectiveId] || 0, hintIndex + 1),
    })

    // Deduct points (optional - можno добавить в progress)
  }

  const handleComplete = (objective: Objective) => {
    onObjectiveComplete(objective.id, objective.points)

    // Unlock evidence
    if (objective.unlocksEvidence) {
      objective.unlocksEvidence.forEach((evidenceId) => {
        onEvidenceDiscovered(evidenceId)
      })
    }

    setSelectedObjective(null)
  }

  const getTypeIcon = (type: Objective['type']) => {
    switch (type) {
      case 'reconnaissance':
        return Search
      case 'exploitation':
        return Target
      case 'defense':
        return Shield
      default:
        return Target
    }
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">OBJECTIVES</h3>

      {phaseObjectives.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-8">
          No objectives for this phase. Advance timeline to continue.
        </div>
      ) : (
        <div className="space-y-2">
          {phaseObjectives.map((objective) => {
            const status = getObjectiveStatus(objective)
            const Icon = getTypeIcon(objective.type)

            return (
              <motion.button
                key={objective.id}
                onClick={() => handleObjectiveClick(objective)}
                disabled={status === 'locked'}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all',
                  status === 'completed' &&
                    'bg-green-950/20 border-green-700/30 hover:border-green-500',
                  status === 'available' &&
                    'bg-cyber-bg border-cyber-border hover:border-cyber-primary',
                  status === 'locked' && 'bg-gray-900/20 border-gray-700/30 opacity-50 cursor-not-allowed'
                )}
                whileHover={status !== 'locked' ? { scale: 1.02 } : {}}
                whileTap={status !== 'locked' ? { scale: 0.98 } : {}}
              >
                <div className="flex items-start gap-3">
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : status === 'locked' ? (
                    <Lock className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-cyber-primary flex-shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500 capitalize">{objective.type}</span>
                    </div>
                    <div className="font-medium text-white text-sm mb-1">{objective.title}</div>
                    <div className="text-xs text-gray-400 line-clamp-2">{objective.description}</div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-cyber-primary" />
                        <span className="text-xs text-cyber-primary font-medium">
                          {objective.points} pts
                        </span>
                      </div>

                      {objective.mitreTechniques.length > 0 && (
                        <div className="flex gap-1">
                          {objective.mitreTechniques.slice(0, 2).map((techId) => (
                            <span
                              key={techId}
                              className="px-1.5 py-0.5 bg-cyber-primary/10 border border-cyber-primary/30 rounded text-xs font-mono text-cyber-primary"
                            >
                              {techId}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Objective Detail Modal */}
      <AnimatePresence>
        {selectedObjective && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedObjective(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cyber-surface border border-cyber-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-cyber-primary mb-2">
                  {selectedObjective.title}
                </h3>
                <p className="text-gray-300 mb-4">{selectedObjective.description}</p>

                {/* Requirements */}
                {(selectedObjective.requiredObjectives || selectedObjective.requiredEvidence) && (
                  <div className="mb-4 p-3 bg-cyber-bg border border-cyber-border rounded">
                    <div className="text-sm font-semibold text-gray-400 mb-2">Requirements:</div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {selectedObjective.requiredObjectives?.map((reqId) => {
                        const reqObj = mission.objectives.find((o) => o.id === reqId)
                        return (
                          <li key={reqId} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            {reqObj?.title || reqId}
                          </li>
                        )
                      })}
                      {selectedObjective.requiredEvidence?.map((evidenceId) => {
                        const evidence = mission.evidence.find((e) => e.id === evidenceId)
                        return (
                          <li key={evidenceId} className="flex items-center gap-2">
                            {progress.discoveredEvidence.includes(evidenceId) ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-500" />
                            )}
                            {evidence?.title || evidenceId}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {/* Hints */}
                {selectedObjective.hints.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-400 mb-2">Hints:</div>
                    <div className="space-y-2">
                      {selectedObjective.hints.map((hint, index) => {
                        const isRevealed = (showHints[selectedObjective.id] || 0) > index

                        return (
                          <div
                            key={index}
                            className="p-3 bg-cyber-bg border border-cyber-border rounded"
                          >
                            {isRevealed ? (
                              <div className="flex items-start gap-2">
                                <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-gray-300">{hint.text}</div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleRevealHint(selectedObjective.id, index, hint.cost)}
                                className="text-sm text-cyber-primary hover:text-cyber-secondary transition-colors"
                              >
                                Reveal hint ({hint.cost} pts)
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Complete Button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedObjective(null)}
                    className="flex-1 py-2 bg-cyber-bg border border-cyber-border rounded text-gray-400 hover:border-gray-500 transition-all"
                  >
                    Close
                  </button>
                  {getObjectiveStatus(selectedObjective) === 'available' && (
                    <button
                      onClick={() => handleComplete(selectedObjective)}
                      className="flex-1 py-2 bg-cyber-primary text-cyber-bg rounded font-semibold hover:bg-cyber-secondary transition-all"
                    >
                      Complete (+{selectedObjective.points} pts)
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
