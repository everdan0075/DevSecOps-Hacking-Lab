/**
 * BattleCommentator Component
 *
 * Floating panel showing real-time educational commentary
 * Features:
 * - Latest critical event with explanation
 * - Animated entrance (slide in from right)
 * - Auto-dismiss after 5s
 * - Team-colored styling
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Shield, AlertTriangle, Target, Info } from 'lucide-react'
import type { BattleEvent, AttackType, DefenseType } from '@/types/battle'
import { ATTACK_CONFIGS, DEFENSE_CONFIGS } from '@/types/battle'
import { cn } from '@/utils/cn'

interface CommentaryData {
  icon: React.ReactNode
  title: string
  description: string
  educational: string
  team: 'red' | 'blue' | 'neutral'
}

function generateCommentary(event: BattleEvent, tutorialMode: boolean): CommentaryData | null {
  switch (event.type) {
    case 'attack_launched': {
      const attackType = event.metadata?.attackType as AttackType
      const config = attackType ? ATTACK_CONFIGS[attackType] : null

      if (!tutorialMode) {
        return {
          icon: <Zap className="w-5 h-5" />,
          title: 'Attack Launched',
          description: event.message,
          educational: '',
          team: 'red',
        }
      }

      return {
        icon: <Zap className="w-5 h-5" />,
        title: 'RED TEAM Attack Launched',
        description: config?.displayName || 'Attack in progress',
        educational: config
          ? `${config.description}. Target: ${config.targetSystem}. This attack exploits vulnerabilities in the system.`
          : 'Attack detected',
        team: 'red',
      }
    }

    case 'attack_blocked': {
      const defenseType = event.metadata?.defenseType as DefenseType
      const config = defenseType ? DEFENSE_CONFIGS[defenseType] : null

      if (!tutorialMode) {
        return {
          icon: <Shield className="w-5 h-5" />,
          title: 'Attack Blocked',
          description: event.message,
          educational: '',
          team: 'blue',
        }
      }

      return {
        icon: <Shield className="w-5 h-5" />,
        title: 'BLUE TEAM Defense Successful',
        description: config?.displayName ? `${config.displayName} activated` : 'Attack blocked',
        educational: config
          ? `Defense: ${config.description}. The attack was detected and neutralized before causing damage.`
          : 'Defense system blocked the attack',
        team: 'blue',
      }
    }

    case 'attack_success': {
      const attackType = event.metadata?.attackType as AttackType
      const config = attackType ? ATTACK_CONFIGS[attackType] : null

      if (!tutorialMode) {
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Breach',
          description: event.message,
          educational: '',
          team: 'red',
        }
      }

      return {
        icon: <AlertTriangle className="w-5 h-5" />,
        title: 'BREACH! System Compromised',
        description: config?.displayName ? `${config.displayName} succeeded` : 'Attack successful',
        educational: config
          ? `The attack bypassed defenses. Prevention: Deploy appropriate security controls and monitoring.`
          : 'System has been compromised',
        team: 'red',
      }
    }

    case 'honeypot_triggered': {
      return {
        icon: <Target className="w-5 h-5" />,
        title: tutorialMode ? 'Honeypot Triggered!' : 'Honeypot Hit',
        description: 'Attacker detected scanning for vulnerabilities',
        educational: tutorialMode
          ? 'Honeypots are decoy systems that detect attackers early. When triggered, they alert security teams and can trigger automated responses.'
          : '',
        team: 'blue',
      }
    }

    case 'phase_change': {
      return {
        icon: <Info className="w-5 h-5" />,
        title: 'Phase Transition',
        description: event.message,
        educational: tutorialMode
          ? 'Battle phases represent different stages of a cyber attack: reconnaissance, exploitation, and containment.'
          : '',
        team: 'neutral',
      }
    }

    default:
      return null
  }
}

interface BattleCommentatorProps {
  event: BattleEvent | null
  tutorialMode: boolean
  onDismiss?: () => void
}

export function BattleCommentator({ event, tutorialMode, onDismiss }: BattleCommentatorProps) {
  if (!event) return null

  const commentary = generateCommentary(event, tutorialMode)
  if (!commentary) return null

  const teamColors = {
    red: 'border-red-500/50 bg-red-950/40',
    blue: 'border-blue-500/50 bg-blue-950/40',
    neutral: 'border-purple-500/50 bg-purple-950/40',
  }

  const iconColors = {
    red: 'text-red-500',
    blue: 'text-blue-500',
    neutral: 'text-purple-500',
  }

  return (
    <AnimatePresence>
      <motion.div
        key={event.id}
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed top-32 left-1/2 -translate-x-1/2 z-40 w-96 max-w-[90vw] border-2 rounded-lg shadow-2xl backdrop-blur-md p-4',
          teamColors[commentary.team]
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn('mt-1', iconColors[commentary.team])}>{commentary.icon}</div>
          <div className="flex-1">
            <h3 className={cn('text-sm font-bold mb-1', iconColors[commentary.team])}>
              {commentary.title}
            </h3>
            <p className="text-xs text-gray-300">{commentary.description}</p>
          </div>
        </div>

        {/* Educational Note */}
        {tutorialMode && commentary.educational && (
          <div className="border-t border-gray-700/50 pt-3 mt-3">
            <div className="flex items-start gap-2">
              <div className="text-cyber-primary mt-0.5">💡</div>
              <p className="text-xs text-gray-400 leading-relaxed">{commentary.educational}</p>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-[10px] text-gray-600 mt-3 font-mono">
          {new Date(event.timestamp).toLocaleTimeString()}
        </div>

        {/* Auto-dismiss indicator */}
        <motion.div
          className={cn('absolute bottom-0 left-0 h-1 rounded-b-lg', iconColors[commentary.team])}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 5, ease: 'linear' }}
          onAnimationComplete={onDismiss}
        />
      </motion.div>
    </AnimatePresence>
  )
}
