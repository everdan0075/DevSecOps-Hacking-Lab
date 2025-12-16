/**
 * Defense Toolkit Component
 *
 * Interactive defensive tools for defender objectives in TIME BREACH missions.
 * Makes defender side as engaging as attacker's CodePlayground.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Terminal } from 'lucide-react'
import type { Objective } from '@/types/mission'
import { LogAnalyzer } from './tools/LogAnalyzer'
import { PatchManager } from './tools/PatchManager'
import { ForensicTool } from './tools/ForensicTool'
import { ScannerConfig } from './tools/ScannerConfig'

interface DefenseToolkitProps {
  objective: Objective
  missionId: string
  onComplete: () => void
  isAlreadyCompleted: boolean
}

export function DefenseToolkit({
  objective,
  missionId,
  onComplete,
  isAlreadyCompleted,
}: DefenseToolkitProps) {
  const [showHint, setShowHint] = useState(false)

  // Determine which tool to show based on objective ID
  const renderTool = () => {
    // Equifax 2017 defender objectives
    if (objective.id === 'obj-defender-detect' && missionId === 'equifax-2017') {
      return (
        <LogAnalyzer
          objectiveId={objective.id}
          missionId={missionId}
          onComplete={onComplete}
          isCompleted={isAlreadyCompleted}
        />
      )
    }

    if (objective.id === 'obj-defender-patch' && missionId === 'equifax-2017') {
      return (
        <PatchManager
          objectiveId={objective.id}
          missionId={missionId}
          onComplete={onComplete}
          isCompleted={isAlreadyCompleted}
        />
      )
    }

    if (objective.id === 'obj-defender-detection' && missionId === 'equifax-2017') {
      return (
        <LogAnalyzer
          objectiveId={objective.id}
          missionId={missionId}
          onComplete={onComplete}
          isCompleted={isAlreadyCompleted}
        />
      )
    }

    // FIXED BUG #1: Add ScannerConfig for obj-defender-scan
    if (objective.id === 'obj-defender-scan' && missionId === 'equifax-2017') {
      return (
        <ScannerConfig
          objectiveId={objective.id}
          missionId={missionId}
          onComplete={onComplete}
          isCompleted={isAlreadyCompleted}
        />
      )
    }

    // MOVEit 2023 defender objectives
    if (objective.id === 'obj-defender-detect' && missionId === 'moveit-2023') {
      return (
        <LogAnalyzer
          objectiveId={objective.id}
          missionId={missionId}
          onComplete={onComplete}
          isCompleted={isAlreadyCompleted}
        />
      )
    }

    if (objective.id === 'obj-defender-patch' && missionId === 'moveit-2023') {
      return (
        <PatchManager
          objectiveId={objective.id}
          missionId={missionId}
          onComplete={onComplete}
          isCompleted={isAlreadyCompleted}
        />
      )
    }

    if (objective.id === 'obj-defender-forensics' && missionId === 'moveit-2023') {
      return (
        <ForensicTool
          objectiveId={objective.id}
          missionId={missionId}
          onComplete={onComplete}
          isCompleted={isAlreadyCompleted}
        />
      )
    }

    // Capital One 2019 defender objectives
    if (objective.id === 'obj-defender-detect' && missionId === 'capital-one-2019') {
      return (
        <LogAnalyzer
          objectiveId={objective.id}
          missionId={missionId}
          onComplete={onComplete}
          isCompleted={isAlreadyCompleted}
        />
      )
    }

    if (objective.id === 'obj-defender-patch' && missionId === 'capital-one-2019') {
      return (
        <PatchManager
          objectiveId={objective.id}
          missionId={missionId}
          onComplete={onComplete}
          isCompleted={isAlreadyCompleted}
        />
      )
    }

    if (objective.id === 'obj-defender-forensics' && missionId === 'capital-one-2019') {
      return (
        <ForensicTool
          objectiveId={objective.id}
          missionId={missionId}
          onComplete={onComplete}
          isCompleted={isAlreadyCompleted}
        />
      )
    }

    // Default fallback - no tool available
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-yellow-300"
      >
        No interactive tool available for this objective. Use the checklist to complete it.
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-green-500/10 rounded-lg flex-shrink-0">
            <Shield className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-green-400 mb-2">{objective.title}</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{objective.description}</p>
          </div>
        </div>

        {objective.hints && objective.hints.length > 0 && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="px-3 py-1.5 text-sm bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-colors flex-shrink-0 h-fit"
          >
            {showHint ? 'Hide' : 'Show'} Hint
          </button>
        )}
      </div>

      {/* Hints */}
      <AnimatePresence>
        {showHint && objective.hints && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4"
          >
            <div className="flex items-start gap-2">
              <Terminal className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                {objective.hints.map((hint, idx) => (
                  <p key={idx} className="text-sm text-yellow-200/80 break-words whitespace-pre-wrap overflow-wrap-anywhere">
                    {hint.text}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tool */}
      <div>{renderTool()}</div>
    </div>
  )
}
