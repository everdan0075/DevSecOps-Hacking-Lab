/**
 * Mission Debrief Component
 *
 * Shows mission completion results, historical comparison, and lessons learned
 */

import { motion } from 'framer-motion'
import {
  Trophy,
  Target,
  Shield,
  Clock,
  Award,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react'
import type { Mission, MissionProgress } from '@/types/mission'
import { cn } from '@/utils/cn'

interface MissionDebriefProps {
  mission: Mission
  progress: MissionProgress
  onRestart: () => void
  onBackToSelect: () => void
}

export function MissionDebrief({ mission, progress, onRestart, onBackToSelect }: MissionDebriefProps) {
  const ending = mission.endings.find((e) => e.id === progress.ending)

  if (!ending) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="text-gray-500">No ending data available</div>
      </div>
    )
  }

  const completionRate = (ending.debriefing.metrics.objectivesCompleted / ending.debriefing.metrics.totalObjectives) * 100
  const timeElapsedMinutes = Math.floor(ending.debriefing.metrics.timeElapsed / 60)

  const getEndingColor = () => {
    switch (ending.type) {
      case 'success':
        return 'green'
      case 'prevented':
        return 'blue'
      case 'detected':
        return 'yellow'
      case 'partial':
        return 'orange'
      default:
        return 'gray'
    }
  }

  const getEndingIcon = () => {
    switch (ending.type) {
      case 'success':
        return Trophy
      case 'prevented':
        return Shield
      case 'detected':
        return AlertTriangle
      case 'partial':
        return TrendingUp
      default:
        return Trophy
    }
  }

  const color = getEndingColor()
  const EndingIcon = getEndingIcon()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-cyber-bg"
    >
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className={cn(
              'inline-flex p-6 rounded-full mb-4',
              color === 'green' && 'bg-green-500/20',
              color === 'blue' && 'bg-blue-500/20',
              color === 'yellow' && 'bg-yellow-500/20',
              color === 'orange' && 'bg-orange-500/20'
            )}
          >
            <EndingIcon
              className={cn(
                'w-16 h-16',
                color === 'green' && 'text-green-500',
                color === 'blue' && 'text-blue-500',
                color === 'yellow' && 'text-yellow-500',
                color === 'orange' && 'text-orange-500'
              )}
            />
          </motion.div>

          <h1 className="text-4xl font-bold text-cyber-primary mb-2">{ending.title}</h1>
          <p className="text-xl text-gray-300 mb-4">{ending.description}</p>

          <div className="text-sm text-gray-500">
            {mission.title} • {progress.role.charAt(0).toUpperCase() + progress.role.slice(1)} Role
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-cyber-surface border border-cyber-border rounded-lg text-center">
            <Award className="w-6 h-6 text-cyber-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-cyber-primary">{progress.score}</div>
            <div className="text-xs text-gray-500">Total Points</div>
          </div>

          <div className="p-4 bg-cyber-surface border border-cyber-border rounded-lg text-center">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{timeElapsedMinutes}</div>
            <div className="text-xs text-gray-500">Minutes</div>
          </div>

          <div className="p-4 bg-cyber-surface border border-cyber-border rounded-lg text-center">
            <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {ending.debriefing.metrics.objectivesCompleted}/{ending.debriefing.metrics.totalObjectives}
            </div>
            <div className="text-xs text-gray-500">Objectives</div>
          </div>

          <div className="p-4 bg-cyber-surface border border-cyber-border rounded-lg text-center">
            <TrendingUp className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{Math.round(completionRate)}%</div>
            <div className="text-xs text-gray-500">Completion</div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Summary */}
          <div className="p-6 bg-cyber-surface border border-cyber-border rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-4">Mission Summary</h2>
            <p className="text-gray-300 leading-relaxed">{ending.debriefing.summary}</p>
          </div>

          {/* Historical Comparison */}
          <div className="p-6 bg-cyber-surface border border-cyber-border rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-4">What Really Happened</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              {ending.debriefing.realWorldComparison}
            </p>

            <div className="p-4 bg-cyber-bg border border-cyber-border rounded">
              <div className="text-sm font-semibold text-gray-400 mb-2">Historical Impact</div>
              <p className="text-sm text-gray-300">{mission.realIncident.impact}</p>
            </div>
          </div>

          {/* Lessons Learned */}
          <div className="p-6 bg-cyber-surface border border-cyber-border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-cyber-primary" />
              <h2 className="text-lg font-semibold text-white">Lessons Learned</h2>
            </div>

            <ul className="space-y-3">
              {ending.debriefing.lessonsLearned.map((lesson, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-cyber-bg border border-cyber-border rounded"
                >
                  <CheckCircle2 className="w-5 h-5 text-cyber-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300">{lesson}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* MITRE ATT&CK Techniques Used */}
          {ending.debriefing.metrics.mitreTechniquesUsed.length > 0 && (
            <div className="p-6 bg-cyber-surface border border-cyber-border rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4">
                MITRE ATT&CK Techniques Used ({ending.debriefing.metrics.mitreTechniquesUsed.length})
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ending.debriefing.metrics.mitreTechniquesUsed.map((techId) => {
                  const technique = mission.mitreTechniques.find((t) => t.id === techId)
                  return (
                    <a
                      key={techId}
                      href={technique?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-cyber-bg border border-cyber-primary/30 rounded hover:border-cyber-primary transition-all"
                    >
                      <div className="font-mono text-sm text-cyber-primary mb-1">{techId}</div>
                      <div className="text-xs text-gray-400">{technique?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 mt-1">{technique?.tactic}</div>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Achievements */}
          {ending.rewards.achievements.length > 0 && (
            <div className="p-6 bg-cyber-surface border border-cyber-border rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-white">Achievements Unlocked</h2>
              </div>

              <div className="flex flex-wrap gap-3">
                {ending.rewards.achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                  >
                    <div className="text-sm font-semibold text-yellow-500">{achievement}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Badge */}
          {ending.rewards.badges.length > 0 && (
            <div className="p-6 bg-gradient-to-r from-cyber-primary/10 to-cyber-secondary/10 border border-cyber-primary/30 rounded-lg text-center">
              <Trophy className="w-12 h-12 text-cyber-primary mx-auto mb-3" />
              <h3 className="text-xl font-bold text-cyber-primary mb-2">Badge Earned</h3>
              {ending.rewards.badges.map((badge) => (
                <div key={badge} className="text-lg text-white capitalize">
                  {badge.replace(/-/g, ' ')}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={onBackToSelect}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-cyber-bg border border-cyber-border rounded-lg text-gray-400 hover:border-gray-500 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Missions
          </button>

          <button
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-cyber-primary text-cyber-bg rounded-lg font-semibold hover:bg-cyber-secondary transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Replay Mission
          </button>
        </div>
      </div>
    </motion.div>
  )
}
