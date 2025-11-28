/**
 * DefenseActivationFeed Component
 *
 * Displays a floating feed of recent defense activations on the right edge of Blue Team panel.
 * Shows which defenses were activated with animated icons that slide in and fade out.
 *
 * Features:
 * - Slide-in animation from right
 * - Colored glow based on defense type
 * - Auto-removes after 3.5 seconds
 * - Stacks up to 5 recent activations
 * - Defense type icon and name
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { DefenseType } from '@/types/battle'
import { DEFENSE_CONFIGS } from '@/types/battle'
import { Shield, Ban, Crosshair, Bot, Zap, Key, CheckCircle } from 'lucide-react'

const DEFENSE_ICONS: Record<DefenseType, React.ElementType> = {
  waf: Shield,
  rate_limit: Zap,
  honeypot: Crosshair,
  ip_ban: Ban,
  token_revocation: Key,
  incident_response: Bot,
  jwt_validation: CheckCircle,
}

const DEFENSE_COLORS: Record<DefenseType, string> = {
  waf: '#3b82f6',
  rate_limit: '#06b6d4',
  honeypot: '#f59e0b',
  ip_ban: '#ef4444',
  token_revocation: '#8b5cf6',
  incident_response: '#10b981',
  jwt_validation: '#06b6d4',
}

interface DefenseActivation {
  id: string
  defenseId: string
  defenseType: DefenseType
  timestamp: number
}

interface DefenseActivationFeedProps {
  blockingDefenseId?: string
  activeDefenses: Array<{ id: string; type: DefenseType }>
}

const MAX_ACTIVATIONS = 5
const ACTIVATION_LIFETIME = 3500 // ms

export function DefenseActivationFeed({ blockingDefenseId, activeDefenses }: DefenseActivationFeedProps) {
  const [activations, setActivations] = useState<DefenseActivation[]>([])

  // Track defense activations
  useEffect(() => {
    if (!blockingDefenseId) return

    const defense = activeDefenses.find((d) => d.id === blockingDefenseId)
    if (!defense) return

    const newActivation: DefenseActivation = {
      id: `${blockingDefenseId}-${Date.now()}`,
      defenseId: blockingDefenseId,
      defenseType: defense.type,
      timestamp: Date.now(),
    }

    setActivations((prev) => {
      // Add new activation at the beginning, limit to MAX_ACTIVATIONS
      const updated = [newActivation, ...prev].slice(0, MAX_ACTIVATIONS)
      return updated
    })

    // Auto-remove after lifetime
    const timer = setTimeout(() => {
      setActivations((prev) => prev.filter((a) => a.id !== newActivation.id))
    }, ACTIVATION_LIFETIME)

    return () => clearTimeout(timer)
  }, [blockingDefenseId, activeDefenses])

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
      <div className="flex flex-col gap-2 pr-2">
        <AnimatePresence mode="popLayout">
          {activations.map((activation, index) => (
            <DefenseActivationIcon
              key={activation.id}
              activation={activation}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface DefenseActivationIconProps {
  activation: DefenseActivation
  index: number
}

function DefenseActivationIcon({ activation, index }: DefenseActivationIconProps) {
  const config = DEFENSE_CONFIGS[activation.defenseType]
  const Icon = DEFENSE_ICONS[activation.defenseType]
  const color = DEFENSE_COLORS[activation.defenseType]

  return (
    <motion.div
      className="relative"
      initial={{ x: 100, opacity: 0, scale: 0.8 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 100, opacity: 0, scale: 0.5 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        delay: index * 0.05,
      }}
      layout
    >
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{ backgroundColor: color }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Icon Container */}
      <div
        className="relative w-12 h-12 rounded-full border-2 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        style={{ borderColor: color, boxShadow: `0 0 20px ${color}40` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>

      {/* Defense Name Tooltip (appears on right) */}
      <motion.div
        className="absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border backdrop-blur-sm"
          style={{
            backgroundColor: `${color}20`,
            borderColor: `${color}40`,
            color: color,
            boxShadow: `0 0 10px ${color}20`,
          }}
        >
          {config.displayName}
        </div>
      </motion.div>

      {/* Activation Ripple */}
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: color }}
        initial={{ scale: 1, opacity: 0.8 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </motion.div>
  )
}
