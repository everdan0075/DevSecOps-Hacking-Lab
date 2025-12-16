/**
 * Mission Objectives Component
 *
 * Displays objectives for current mission phase and handles completion
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Lock, Target, Shield, Search, Lightbulb, ChevronRight } from 'lucide-react'
import type { Mission, MissionProgress, TimelinePhase, MissionRole, Objective } from '@/types/mission'
import { cn } from '@/utils/cn'
import { CodePlayground } from './CodePlayground'
import { DefenseToolkit } from './DefenseToolkit'

interface RevealCardProps {
  title: string
  content: React.ReactNode
}

function RevealCard({ title, content }: RevealCardProps) {
  const [isRevealed, setIsRevealed] = useState(false)

  return (
    <div>
      <button
        onClick={() => setIsRevealed(!isRevealed)}
        className="w-full text-left p-3 bg-cyber-bg border border-purple-500/30 rounded hover:border-purple-400 transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-purple-300">{title}</span>
          <motion.div
            animate={{ rotate: isRevealed ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-cyber-surface border-l-2 border-purple-500 ml-4 mt-2">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface MissionObjectivesProps {
  mission: Mission
  progress: MissionProgress
  currentPhase: TimelinePhase
  role: MissionRole
  onObjectiveComplete: (objectiveId: string) => void
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
  console.log('[MissionObjectives] Component rendered, onObjectiveComplete type:', typeof onObjectiveComplete)

  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null)
  const [showHints, setShowHints] = useState<Record<string, number>>({})

  // Get objectives for current phase and role
  const phaseObjectives = mission.objectives.filter(
    (obj) => obj.phaseId === currentPhase.id && obj.role === role
  )

  const getObjectiveStatus = (objective: Objective): 'locked' | 'available' | 'completed' => {
    const isCompleted = progress.completedObjectives.includes(objective.id)
    console.log(`[MissionObjectives] getObjectiveStatus for ${objective.id} (${objective.title}):`, {
      isCompleted,
      completedObjectives: progress.completedObjectives
    })

    if (isCompleted) {
      return 'completed'
    }

    // Educational mode: ALL objectives in current phase are ALWAYS available
    // No locks, no barriers - let players explore freely!
    return 'available'
  }

  const handleObjectiveClick = (objective: Objective) => {
    console.log('[MissionObjectives] handleObjectiveClick called for:', objective.id, objective.title)
    const status = getObjectiveStatus(objective)
    console.log('[MissionObjectives] Objective status:', status)
    if (status !== 'locked') {
      console.log('[MissionObjectives] Opening modal for objective:', objective.id)
      setSelectedObjective(objective)
    } else {
      console.log('[MissionObjectives] Objective is locked, not opening modal')
    }
  }

  const handleRevealHint = (objectiveId: string, hintIndex: number) => {
    setShowHints({
      ...showHints,
      [objectiveId]: Math.max(showHints[objectiveId] || 0, hintIndex + 1),
    })
  }

  const handleComplete = (objective: Objective) => {
    console.log('[MissionObjectives] handleComplete called for objective:', objective.id)
    console.log('[MissionObjectives] Objective title:', objective.title)

    onObjectiveComplete(objective.id)

    // Unlock evidence
    if (objective.unlocksEvidence) {
      objective.unlocksEvidence.forEach((evidenceId) => {
        onEvidenceDiscovered(evidenceId)
      })
    }

    // Don't auto-close - let user read the results and close manually
  }

  const handleCodePlaygroundComplete = () => {
    if (selectedObjective) {
      console.log('[MissionObjectives] handleCodePlaygroundComplete called for objective:', selectedObjective.id)
      console.log('[MissionObjectives] Objective title:', selectedObjective.title)

      onObjectiveComplete(selectedObjective.id)

      // Unlock evidence
      if (selectedObjective.unlocksEvidence) {
        selectedObjective.unlocksEvidence.forEach((evidenceId) => {
          onEvidenceDiscovered(evidenceId)
        })
      }

      // Don't auto-close - let user read the exploit results and close manually
    }
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

  // Calculate progress stats
  const totalObjectives = phaseObjectives.length
  const completedCount = phaseObjectives.filter(obj =>
    progress.completedObjectives.includes(obj.id)
  ).length
  const availableCount = phaseObjectives.filter(obj =>
    getObjectiveStatus(obj) === 'available'
  ).length
  const progressPercent = totalObjectives > 0 ? (completedCount / totalObjectives) * 100 : 0

  return (
    <div className="p-4">
      {/* Header with Stats */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-400">OBJECTIVES</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-400 font-medium">{completedCount}</span>
            <span className="text-xs text-gray-500">/</span>
            <span className="text-xs text-gray-400">{totalObjectives}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {totalObjectives > 0 && (
          <div className="relative h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        )}

        {/* Live stats */}
        {availableCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-2 text-xs"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
            />
            <span className="text-cyan-400 font-medium">{availableCount} objective{availableCount > 1 ? 's' : ''} ready</span>
          </motion.div>
        )}
      </div>

      {phaseObjectives.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-500 text-center py-8"
        >
          No objectives for this phase. Advance timeline to continue.
        </motion.div>
      ) : (
        <div className="space-y-2">
          {phaseObjectives.map((objective, idx) => {
            const status = getObjectiveStatus(objective)
            const Icon = getTypeIcon(objective.type)
            console.log('[MissionObjectives] Rendering button for:', objective.id, 'status:', status, 'disabled:', status === 'locked')

            return (
              <motion.button
                key={objective.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.3 }}
                onClick={() => {
                  console.log('[MissionObjectives] BUTTON CLICKED INLINE for:', objective.id)
                  handleObjectiveClick(objective)
                }}
                disabled={status === 'locked'}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all',
                  status === 'completed' &&
                    'bg-green-950/20 border-green-700/30 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20',
                  status === 'available' &&
                    'bg-cyber-bg border-cyber-border hover:border-cyber-primary cursor-pointer hover:bg-cyber-primary/5 hover:shadow-lg hover:shadow-cyber-primary/20 animate-pulse-slow',
                  status === 'locked' && 'bg-gray-900/20 border-gray-700/30 opacity-50 cursor-not-allowed'
                )}
                whileHover={status !== 'locked' ? { scale: 1.03, x: 4 } : {}}
                whileTap={status !== 'locked' ? { scale: 0.97 } : {}}
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
                      <div className="flex items-center gap-2">
                        {status === 'available' && (
                          <motion.span
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-xs text-cyan-400 font-medium"
                          >
                            ▶ Start
                          </motion.span>
                        )}
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-56 pb-4 px-4 overflow-y-auto"
            onClick={() => setSelectedObjective(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cyber-surface border border-cyber-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              {/* Sticky Title and Description */}
              <div className="sticky top-0 bg-cyber-surface z-10 px-6 pt-6 pb-4 border-b border-cyber-border shadow-lg">
                <h3 className="text-xl font-bold text-cyber-primary mb-2">
                  {selectedObjective.title}
                </h3>
                <p className="text-gray-300 text-sm">{selectedObjective.description}</p>
              </div>

              <div className="p-6 pt-4">
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

                {/* Hints - Only show for non-defender objectives (defender has DefenseToolkit with its own hints) */}
                {selectedObjective.type !== 'defense' &&
                 selectedObjective.type !== 'investigation' &&
                 selectedObjective.hints &&
                 selectedObjective.hints.length > 0 && (
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
                                onClick={() => handleRevealHint(selectedObjective.id, index)}
                                className="text-sm text-cyber-primary hover:text-cyber-secondary transition-colors"
                              >
                                Reveal hint
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Code Playground for exploitation objectives */}
                {selectedObjective.type === 'exploitation' && (
                  <div className="mb-4">
                    <CodePlayground
                      objective={selectedObjective}
                      missionId={mission.id}
                      onComplete={handleCodePlaygroundComplete}
                      isAlreadyCompleted={getObjectiveStatus(selectedObjective) === 'completed'}
                    />
                  </div>
                )}

                {/* Interactive Reconnaissance Story */}
                {selectedObjective.type === 'reconnaissance' && getObjectiveStatus(selectedObjective) === 'available' && (
                  <div className="mb-4">
                    <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <Search className="w-5 h-5 text-purple-400" />
                        <h4 className="font-semibold text-purple-300">Intelligence Gathering</h4>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm text-gray-300 italic">
                          "March 2017. A critical vulnerability has been discovered in Apache Struts 2. Click below to investigate..."
                        </p>

                        {/* Story cards - click to reveal */}
                        <div className="space-y-2">
                          <RevealCard
                            title="📄 CVE-2017-5638 Advisory"
                            content={
                              <>
                                <p className="text-xs text-gray-300 mb-2">
                                  <strong className="text-purple-400">Apache Security Bulletin:</strong> Remote Code Execution in Jakarta Multipart parser
                                </p>
                                <p className="text-xs text-gray-400 mb-2">
                                  Attackers can execute arbitrary code by sending a crafted <code className="text-red-400 bg-red-900/20 px-1">Content-Type</code> header with OGNL expressions.
                                </p>
                                <div className="text-xs text-orange-300 bg-orange-900/20 p-2 rounded">
                                  ⚠️ Severity: <strong>CRITICAL</strong> | CVSSv3: 10.0
                                </div>
                              </>
                            }
                          />

                          <RevealCard
                            title="🎯 Equifax Response (or lack thereof)"
                            content={
                              <>
                                <p className="text-xs text-gray-300 mb-2">
                                  <strong className="text-orange-400">Timeline:</strong>
                                </p>
                                <ul className="text-xs text-gray-400 space-y-1 ml-4">
                                  <li>• <strong>March 7:</strong> Apache releases patch</li>
                                  <li>• <strong>March 8:</strong> DHS warns Equifax</li>
                                  <li>• <strong>March 9:</strong> Internal email sent to admins</li>
                                  <li className="text-red-400 font-medium">• <strong>March 10:</strong> ACIS portal still unpatched ⚠️</li>
                                </ul>
                              </>
                            }
                          />

                          <RevealCard
                            title="⚡ Attack Vector Analysis"
                            content={
                              <>
                                <p className="text-xs text-gray-300 mb-2">
                                  <strong className="text-red-400">Exploitation Method:</strong>
                                </p>
                                <pre className="text-xs text-green-400 bg-black/70 p-3 rounded overflow-x-auto font-mono">
{`POST /struts2-showcase/action HTTP/1.1
Host: vulnerable-equifax-server.com
Content-Type: %{(#cmd='whoami').(#cmds={'/bin/bash','-c',#cmd})
.(#p=new java.lang.ProcessBuilder(#cmds)).(#process=#p.start())}`}
                                </pre>
                                <p className="text-xs text-gray-400 mt-2">
                                  This payload executes <code className="text-cyan-400">whoami</code> on the server. Ready for the real attack?
                                </p>
                              </>
                            }
                          />
                        </div>

                        {/* Complete button */}
                        <motion.button
                          onClick={() => handleComplete(selectedObjective)}
                          disabled={getObjectiveStatus(selectedObjective) === 'completed'}
                          className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded font-semibold transition-all shadow-lg shadow-purple-500/25"
                          whileHover={{ scale: getObjectiveStatus(selectedObjective) === 'completed' ? 1 : 1.02 }}
                          whileTap={{ scale: getObjectiveStatus(selectedObjective) === 'completed' ? 1 : 0.98 }}
                        >
                          {getObjectiveStatus(selectedObjective) === 'completed'
                            ? '✓ Intelligence Gathered'
                            : 'Intelligence Gathered → Continue'}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Defense Toolkit - Interactive tools for defender objectives */}
                {(selectedObjective.type === 'defense' || selectedObjective.type === 'investigation') && (
                  <div className="mb-4">
                    <DefenseToolkit
                      objective={selectedObjective}
                      missionId={mission.id}
                      onComplete={handleCodePlaygroundComplete}
                      isAlreadyCompleted={getObjectiveStatus(selectedObjective) === 'completed'}
                    />
                  </div>
                )}

                {/* Complete Button - Only for objectives without custom completion */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedObjective(null)}
                    className="flex-1 py-2 bg-cyber-bg border border-cyber-border rounded text-gray-400 hover:border-gray-500 transition-all"
                  >
                    Close
                  </button>
                  {selectedObjective.type !== 'exploitation' &&
                   selectedObjective.type !== 'reconnaissance' &&
                   selectedObjective.type !== 'defense' &&
                   selectedObjective.type !== 'investigation' &&
                   getObjectiveStatus(selectedObjective) === 'available' && (
                    <button
                      onClick={() => handleComplete(selectedObjective)}
                      className="flex-1 py-2 bg-cyber-primary text-cyber-bg rounded font-semibold hover:bg-cyber-secondary transition-all"
                    >
                      Complete
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
