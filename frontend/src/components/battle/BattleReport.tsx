/**
 * BattleReport Component
 *
 * Post-battle analysis modal with comprehensive breakdown
 * Features:
 * - Winner announcement with confetti
 * - Score breakdown
 * - Attack analysis (successful vs blocked)
 * - Recommendations for improvement
 * - Key lessons learned
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X, CheckCircle, XCircle, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react'
import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import type { BattleScore, Attack, BattleMetrics } from '@/types/battle'
import { ATTACK_CONFIGS } from '@/types/battle'
import { cn } from '@/utils/cn'

interface BattleReportProps {
  winner: 'red' | 'blue' | 'draw'
  finalScore: BattleScore
  successfulAttacks: Attack[]
  blockedAttacks: Attack[]
  metrics: BattleMetrics
  onClose: () => void
}

export function BattleReport({
  winner,
  finalScore,
  successfulAttacks,
  blockedAttacks,
  metrics,
  onClose,
}: BattleReportProps) {
  useEffect(() => {
    if (winner === 'blue') {
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#3b82f6', '#06b6d4', '#0ea5e9'],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#3b82f6', '#06b6d4', '#0ea5e9'],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()
    }
  }, [winner])

  const winnerColor = {
    red: 'text-red-500',
    blue: 'text-blue-500',
    draw: 'text-purple-500',
  }

  const winnerBg = {
    red: 'bg-red-950/40 border-red-500/50',
    blue: 'bg-blue-950/40 border-blue-500/50',
    draw: 'bg-purple-950/40 border-purple-500/50',
  }

  const recommendations = generateRecommendations(winner, metrics, successfulAttacks)
  const lessons = generateLessons(successfulAttacks, blockedAttacks, metrics)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-cyber-surface border border-cyber-border rounded-lg max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className={cn('p-4 border-b-2 flex-shrink-0', winnerBg[winner])}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Trophy className={cn('w-8 h-8', winnerColor[winner])} />
                <div>
                  <h2 className={cn('text-3xl font-bold', winnerColor[winner])}>
                    {winner === 'draw' ? 'DRAW!' : `${winner.toUpperCase()} TEAM WINS!`}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">Battle Analysis Report</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-cyber-bg border border-cyber-border hover:border-cyber-primary transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <ScoreCard
                team="red"
                score={finalScore.red}
                highlight={winner === 'red'}
                totalAttacks={successfulAttacks.length + blockedAttacks.length}
              />
              <ScoreCard team="blue" score={finalScore.blue} highlight={winner === 'blue'} />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Attack Analysis */}
            <div className="p-4 border-b border-cyber-border">
            <h3 className="text-lg font-bold text-cyber-primary mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Attack Analysis
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Successful Attacks */}
              <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4">
                <h4 className="text-sm font-bold text-red-500 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Successful Attacks ({successfulAttacks.length})
                </h4>
                <div className="space-y-2">
                  {successfulAttacks.length === 0 ? (
                    <p className="text-xs text-gray-500">No attacks succeeded</p>
                  ) : (
                    successfulAttacks.map((attack) => {
                      const config = ATTACK_CONFIGS[attack.type]
                      return (
                        <div key={attack.id} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>{config.icon}</span>
                            <span className="text-red-400">{config.displayName}</span>
                          </div>
                          <p className="text-gray-500 ml-5 mt-1">{config.description}</p>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Blocked Attacks */}
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-500 mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Blocked Attacks ({blockedAttacks.length})
                </h4>
                <div className="space-y-2">
                  {blockedAttacks.length === 0 ? (
                    <p className="text-xs text-gray-500">No attacks blocked</p>
                  ) : (
                    blockedAttacks.slice(0, 5).map((attack) => {
                      const config = ATTACK_CONFIGS[attack.type]
                      return (
                        <div key={attack.id} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>{config.icon}</span>
                            <span className="text-blue-400">{config.displayName}</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                  {blockedAttacks.length > 5 && (
                    <p className="text-xs text-gray-500">
                      +{blockedAttacks.length - 5} more...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="p-4 border-b border-cyber-border">
              <h3 className="text-lg font-bold text-orange-500 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-500 mt-1">▸</span>
                    <span className="text-gray-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Lessons */}
          <div className="p-4">
            <h3 className="text-lg font-bold text-cyber-primary mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Key Lessons Learned
            </h3>
            <ul className="space-y-2">
              {lessons.map((lesson, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-300">{lesson}</span>
                </li>
              ))}
            </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-cyber-border bg-cyber-bg/50 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full py-2 bg-cyber-primary text-cyber-bg rounded-lg font-semibold hover:bg-cyber-secondary transition-all"
            >
              Close Report
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

interface ScoreCardProps {
  team: 'red' | 'blue'
  score: any
  highlight: boolean
  totalAttacks?: number
}

function ScoreCard({ team, score, highlight, totalAttacks }: ScoreCardProps) {
  const colors = {
    red: 'border-red-500/50 bg-red-950/20',
    blue: 'border-blue-500/50 bg-blue-950/20',
  }

  const textColors = {
    red: 'text-red-500',
    blue: 'text-blue-500',
  }

  return (
    <div
      className={cn(
        'p-4 rounded-lg border-2',
        colors[team],
        highlight && 'ring-2 ring-yellow-500/50'
      )}
    >
      <h4 className={cn('text-lg font-bold mb-3', textColors[team])}>
        {team.toUpperCase()} TEAM
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Points</span>
          <span className={cn('font-bold font-mono', textColors[team])}>{score.points}</span>
        </div>
        {team === 'red' && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-400">Attacks</span>
              <span className="text-gray-300">{totalAttacks ?? score.attacksLaunched}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Successful</span>
              <span className="text-gray-300">{score.attacksSuccessful}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Systems</span>
              <span className="text-gray-300">{score.systemsCompromised}</span>
            </div>
          </>
        )}
        {team === 'blue' && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-400">Blocked</span>
              <span className="text-gray-300">{score.attacksBlocked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Honeypots</span>
              <span className="text-gray-300">{score.honeypotsTriggered}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Incidents</span>
              <span className="text-gray-300">{score.incidentsResolved}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function generateRecommendations(
  winner: 'red' | 'blue' | 'draw',
  metrics: BattleMetrics,
  successfulAttacks: Attack[]
): string[] {
  const recommendations: string[] = []

  if (winner === 'red') {
    if (metrics.totalBlocks < 2) {
      recommendations.push('Enable more defensive layers (WAF, rate limiting, honeypots)')
    }
    if (successfulAttacks.some((a) => a.type === 'brute_force')) {
      recommendations.push('Implement MFA for all accounts to prevent brute force attacks')
    }
    if (successfulAttacks.some((a) => a.type === 'idor')) {
      recommendations.push('Add authorization checks on every API endpoint')
    }
    if (successfulAttacks.some((a) => a.type === 'gateway_bypass')) {
      recommendations.push('Implement network segmentation and service-level authentication')
    }
    if (metrics.systemsCompromised.length > 2) {
      recommendations.push('Deploy faster incident response automation')
    }
  } else if (winner === 'blue') {
    recommendations.push('Excellent defense! Consider these advanced improvements:')
    recommendations.push('Implement threat intelligence feeds for proactive blocking')
    recommendations.push('Add deception technology (honeytokens, honeypots)')
    recommendations.push('Deploy automated threat hunting')
  }

  return recommendations
}

function generateLessons(
  successfulAttacks: Attack[],
  blockedAttacks: Attack[],
  metrics: BattleMetrics
): string[] {
  const lessons: string[] = []

  lessons.push('Defense in depth: Multiple security layers provide better protection')

  if (blockedAttacks.length > 0) {
    lessons.push('Rate limiting effectiveness: Slows down attackers significantly')
  }

  if (successfulAttacks.some((a) => a.type === 'idor')) {
    lessons.push('IDOR prevention: Always validate authorization, not just authentication')
  }

  if (blockedAttacks.some((a) => a.type === 'honeypot_probe')) {
    lessons.push('Honeypots provide early warning: Detect attacks before they succeed')
  }

  lessons.push('Monitoring is crucial: What you can\'t see, you can\'t defend')

  if (metrics.successRate > 50) {
    lessons.push('High attack success rate indicates need for stronger defenses')
  } else {
    lessons.push('Low attack success rate shows effective security controls')
  }

  return lessons
}
