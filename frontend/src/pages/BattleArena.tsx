/**
 * BattleArena Page
 *
 * Main container for Red vs Blue Team battle visualization
 * Orchestrates all battle components and manages battle engine
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, Settings, Trophy, X, BookOpen, BookOpenCheck } from 'lucide-react'
import { battleEngine } from '@/services/battleEngine'
import { RedTeamPanel } from '@/components/battle/RedTeamPanel'
import { BlueTeamPanel } from '@/components/battle/BlueTeamPanel'
import { Battlefield } from '@/components/battle/Battlefield'
import { ScoreBoard } from '@/components/battle/ScoreBoard'
import { EventTimeline } from '@/components/battle/EventTimeline'
import { BattleCommentator } from '@/components/battle/BattleCommentator'
import { BattleReport } from '@/components/battle/BattleReport'
import { useTutorial } from '@/contexts/TutorialContext'
import { BATTLE_SCENARIOS, type BattleState, type BattleScenario, type BattleEvent } from '@/types/battle'
import { cn } from '@/utils/cn'

export function BattleArena() {
  const { tutorialEnabled, toggleTutorial } = useTutorial()
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const [showScenarioModal, setShowScenarioModal] = useState(true)
  const [blockingDefenseId, setBlockingDefenseId] = useState<string | undefined>()
  const [showBattleReport, setShowBattleReport] = useState(false)
  const [battleWinner, setBattleWinner] = useState<'red' | 'blue' | null>(null)
  const [latestEvent, setLatestEvent] = useState<BattleEvent | null>(null)

  // Subscribe to battle engine events
  useEffect(() => {
    battleEngine.on('onAttackLaunched', (attack) => {
      updateState()
    })

    battleEngine.on('onAttackBlocked', (attack, defense) => {
      setBlockingDefenseId(defense.id)
      setTimeout(() => setBlockingDefenseId(undefined), 1000)
      updateState()
    })

    battleEngine.on('onAttackSuccess', (attack) => {
      updateState()
    })

    battleEngine.on('onDefenseActivated', (defense) => {
      updateState()
    })

    battleEngine.on('onPhaseChange', (phase) => {
      updateState()
    })

    battleEngine.on('onBattleComplete', (winner, finalScore) => {
      updateState()
      setBattleWinner(winner)
      setShowBattleReport(true)
    })

    battleEngine.on('onScoreUpdate', () => {
      updateState()
    })

    // Periodic state updates
    const interval = setInterval(() => {
      const state = battleEngine.getState()
      if (state && state.isRunning) {
        setBattleState({ ...state })
      }
    }, 100)

    return () => {
      clearInterval(interval)
      battleEngine.stopBattle()
    }
  }, [])

  const updateState = () => {
    const state = battleEngine.getState()
    if (state) {
      setBattleState({ ...state })
      // Update latest event for commentary
      if (state.events.length > 0) {
        setLatestEvent(state.events[state.events.length - 1])
      }
    }
  }

  const handleStartBattle = async (scenario: BattleScenario) => {
    const state = await battleEngine.startBattle(scenario)
    setBattleState(state)
    setShowScenarioModal(false)
    setShowBattleReport(false)
    setBattleWinner(null)
    setLatestEvent(null)
  }

  const handleLaunchAttack = (attackType: string) => {
    battleEngine.launchAttack(attackType as any)
  }

  const handleTogglePause = () => {
    battleEngine.togglePause()
    updateState()
  }

  const handleStop = () => {
    battleEngine.stopBattle()
    setShowScenarioModal(true)
    setBattleState(null)
  }

  const getCurrentPhaseConfig = () => {
    if (!battleState) return null
    return battleState.scenario.phases.find((p) => p.name === battleState.phase)
  }

  const phaseConfig = getCurrentPhaseConfig()

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-cyber-bg">
      {/* Scenario Selection Modal */}
      <AnimatePresence>
        {showScenarioModal && (
          <ScenarioModal onSelectScenario={handleStartBattle} onClose={() => setShowScenarioModal(false)} />
        )}
      </AnimatePresence>

      {battleState && (
        <>
          {/* ScoreBoard */}
          <ScoreBoard
            score={battleState.score}
            phase={battleState.phase}
            phaseDisplayName={phaseConfig?.displayName || 'Unknown'}
            phaseTimeRemaining={battleState.phaseTimeRemaining}
            isPaused={battleState.isPaused}
          />

          {/* Main Battle Area - Fixed height for 2K resolution */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Event Timeline (Left - Vertical) */}
            <div className="w-56 shrink-0 overflow-hidden">
              <EventTimeline events={battleState.events} />
            </div>

            {/* Red Team Panel (Left-Center) */}
            <div className="w-80 shrink-0 overflow-hidden">
              <RedTeamPanel
                activeAttacks={battleState.activeAttacks}
                score={battleState.score.red}
                metrics={battleState.metrics}
                events={battleState.events}
                onLaunchAttack={handleLaunchAttack}
                enabledAttacks={phaseConfig?.enabledAttacks || []}
                isPaused={battleState.isPaused}
              />
            </div>

            {/* Battlefield (Center) */}
            <div className="flex-1 relative min-h-0">
              <Battlefield
                activeAttacks={battleState.activeAttacks}
                metrics={battleState.metrics}
                blockingDefenseId={blockingDefenseId}
                activeDefenses={battleState.activeDefenses}
                onAttackComplete={(attackId) => {
                  // Attack animation complete
                }}
                onAttackCollision={(attackId) => {
                  // Attack was blocked
                }}
              />

              {/* Control Panel Overlay */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
                <ControlPanel
                  isRunning={battleState.isRunning}
                  isPaused={battleState.isPaused}
                  onTogglePause={handleTogglePause}
                  onStop={handleStop}
                  onShowScenarios={() => setShowScenarioModal(true)}
                />
              </div>

              {/* Tutorial Toggle Button */}
              <div className="absolute top-20 right-4 z-30">
                <motion.button
                  onClick={toggleTutorial}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'p-3 rounded-lg border backdrop-blur-md transition-all shadow-lg',
                    tutorialEnabled
                      ? 'bg-green-950/90 border-green-700/50 text-green-400 hover:bg-green-900/90'
                      : 'bg-gray-900/90 border-gray-700/50 text-gray-400 hover:bg-gray-800/90'
                  )}
                  title={tutorialEnabled ? 'Tutorial Mode: ON' : 'Tutorial Mode: OFF'}
                >
                  {tutorialEnabled ? (
                    <BookOpenCheck className="w-5 h-5" />
                  ) : (
                    <BookOpen className="w-5 h-5" />
                  )}
                </motion.button>
              </div>

              {/* Battle Commentator - Top right inside battlefield */}
              <BattleCommentator
                event={latestEvent}
                tutorialMode={tutorialEnabled}
                onDismiss={() => setLatestEvent(null)}
              />
            </div>

            {/* Blue Team Panel (Right) */}
            <div className="w-80 shrink-0 overflow-hidden">
              <BlueTeamPanel
                activeDefenses={battleState.activeDefenses}
                score={battleState.score.blue}
                metrics={battleState.metrics}
                events={battleState.events}
                blockingDefenseId={blockingDefenseId}
                onBlockComplete={(defenseId) => {
                  setBlockingDefenseId(undefined)
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Empty state when no battle */}
      {!battleState && !showScenarioModal && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-cyber-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-cyber-primary mb-2">Battle Arena</h2>
            <p className="text-gray-400 mb-6">Select a scenario to begin</p>
            <button
              onClick={() => setShowScenarioModal(true)}
              className="px-6 py-3 bg-cyber-primary text-cyber-bg rounded-lg font-semibold hover:bg-cyber-secondary transition-colors"
            >
              Start Battle
            </button>
          </div>
        </div>
      )}

      {/* Battle Report Modal */}
      {showBattleReport && battleState && battleWinner && (
        <BattleReport
          winner={battleWinner}
          finalScore={battleState.score}
          successfulAttacks={battleState.attackHistory.filter((a) => a.status === 'success')}
          blockedAttacks={battleState.attackHistory.filter((a) => a.status === 'blocked')}
          metrics={battleState.metrics}
          onClose={() => setShowBattleReport(false)}
        />
      )}
    </div>
  )
}

interface ControlPanelProps {
  isRunning: boolean
  isPaused: boolean
  onTogglePause: () => void
  onStop: () => void
  onShowScenarios: () => void
}

function ControlPanel({ isRunning, isPaused, onTogglePause, onStop, onShowScenarios }: ControlPanelProps) {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center gap-2 bg-cyber-surface/90 backdrop-blur-md border border-cyber-border rounded-lg px-4 py-2 shadow-lg"
    >
      {/* Play/Pause */}
      <button
        onClick={onTogglePause}
        className="p-2 rounded-lg bg-cyber-bg border border-cyber-border hover:border-cyber-primary transition-all"
        title={isPaused ? 'Resume' : 'Pause'}
      >
        {isPaused ? <Play className="w-5 h-5 text-green-500" /> : <Pause className="w-5 h-5 text-yellow-500" />}
      </button>

      {/* Stop */}
      <button
        onClick={onStop}
        className="p-2 rounded-lg bg-cyber-bg border border-cyber-border hover:border-red-500 transition-all"
        title="Stop Battle"
      >
        <Square className="w-5 h-5 text-red-500" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-cyber-border" />

      {/* Scenarios */}
      <button
        onClick={onShowScenarios}
        className="p-2 rounded-lg bg-cyber-bg border border-cyber-border hover:border-cyber-primary transition-all"
        title="Change Scenario"
      >
        <Settings className="w-5 h-5 text-cyber-primary" />
      </button>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 ml-2 px-3 py-1 bg-cyber-bg/50 rounded-lg">
        <motion.div
          className={cn('w-2 h-2 rounded-full', isPaused ? 'bg-yellow-500' : 'bg-green-500')}
          animate={{ opacity: isPaused ? 1 : [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: isPaused ? 0 : Infinity }}
        />
        <span className="text-xs font-mono text-gray-400">
          {isPaused ? 'PAUSED' : 'LIVE'}
        </span>
      </div>
    </motion.div>
  )
}

interface ScenarioModalProps {
  onSelectScenario: (scenario: BattleScenario) => void
  onClose: () => void
}

function ScenarioModal({ onSelectScenario, onClose }: ScenarioModalProps) {
  const scenarios = [
    BATTLE_SCENARIOS.full_assault,
    BATTLE_SCENARIOS.stealth,
    BATTLE_SCENARIOS.zero_day,
  ]

  const difficultyColors = {
    easy: 'text-green-500',
    medium: 'text-yellow-500',
    hard: 'text-orange-500',
    expert: 'text-red-500',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-cyber-surface border border-cyber-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-cyber-border flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-cyber-primary">Select Battle Scenario</h2>
            <p className="text-sm text-gray-400 mt-1">Choose your combat configuration</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-cyber-bg border border-cyber-border hover:border-cyber-primary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenarios Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((scenario) => (
            <motion.div
              key={scenario.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectScenario(scenario)}
              className="p-4 bg-cyber-bg border border-cyber-border rounded-lg cursor-pointer hover:border-cyber-primary transition-all group"
            >
              <h3 className="text-lg font-bold text-cyber-primary group-hover:text-cyber-secondary mb-2">
                {scenario.name}
              </h3>
              <p className="text-sm text-gray-400 mb-3">{scenario.description}</p>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Difficulty</span>
                  <span className={cn('font-bold uppercase', difficultyColors[scenario.difficulty])}>
                    {scenario.difficulty}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="text-cyber-primary font-mono">{scenario.duration}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phases</span>
                  <span className="text-cyber-primary font-mono">{scenario.phases.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Auto-Attack</span>
                  <span className={cn('font-mono', scenario.autoAttackEnabled ? 'text-green-500' : 'text-red-500')}>
                    {scenario.autoAttackEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-cyber-border/30">
                <button className="w-full py-2 bg-cyber-primary/10 border border-cyber-primary/30 rounded text-cyber-primary font-semibold hover:bg-cyber-primary hover:text-cyber-bg transition-all">
                  Start Battle
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
