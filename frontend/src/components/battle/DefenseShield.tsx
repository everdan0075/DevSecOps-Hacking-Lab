/**
 * DefenseShield Component
 *
 * Animated defense shield that blocks attacks
 * Features:
 * - Pulsing glow animation
 * - Crack/break effect on hit
 * - Victory sparkles on successful block
 * - Different types: WAF, Rate Limit, Honeypot, etc.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, Crosshair, Ban, Key, Bot, CheckCircle } from 'lucide-react'
import { DEFENSE_CONFIGS, type Defense, type DefenseType } from '@/types/battle'
import { cn } from '@/utils/cn'

interface DefenseShieldProps {
  defense: Defense
  isBlocking?: boolean
  onBlockComplete?: () => void
}

const DEFENSE_ICONS: Record<DefenseType, React.ElementType> = {
  waf: Shield,
  rate_limit: Zap,
  honeypot: Crosshair,
  ip_ban: Ban,
  token_revocation: Key,
  incident_response: Bot,
  jwt_validation: CheckCircle,
}

const DEFENSE_COLORS = {
  waf: '#3b82f6',
  rate_limit: '#06b6d4',
  honeypot: '#f59e0b',
  ip_ban: '#ef4444',
  token_revocation: '#8b5cf6',
  incident_response: '#10b981',
  jwt_validation: '#06b6d4',
} as const

export function DefenseShield({ defense, isBlocking = false, onBlockComplete }: DefenseShieldProps) {
  const config = DEFENSE_CONFIGS[defense.type]
  const Icon = DEFENSE_ICONS[defense.type]
  const color = DEFENSE_COLORS[defense.type]

  // Calculate health-based opacity and crack level
  const healthPercentage = defense.strength
  const crackLevel = Math.floor((100 - healthPercentage) / 25) // 0-4
  const opacity = 0.3 + (healthPercentage / 100) * 0.7 // 0.3-1.0

  return (
    <div className="relative w-24 h-24">
      {/* Pulsing Glow Background */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{ backgroundColor: color }}
        animate={{
          opacity: defense.status === 'active' ? [0.2, 0.4, 0.2] : 0.1,
          scale: defense.status === 'active' ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Shield Base */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 flex items-center justify-center"
        style={{
          borderColor: color,
          backgroundColor: `${color}20`,
          opacity,
        }}
        animate={{
          scale: defense.status === 'blocking' ? [1, 1.3, 1] : 1,
          rotate: defense.status === 'blocking' ? [0, -10, 10, 0] : 0,
        }}
        transition={{
          duration: 0.5,
          ease: 'easeOut',
        }}
      >
        {/* Shield Icon */}
        <Icon className="w-10 h-10" style={{ color }} />
      </motion.div>

      {/* Blocking Animation - Expanding Shield */}
      <AnimatePresence>
        {isBlocking && (
          <>
            {/* Impact Flash */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: color }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 0], scale: [0.8, 1.5, 1.8] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              onAnimationComplete={() => onBlockComplete?.()}
            />

            {/* Shockwave Rings */}
            {[0, 0.15, 0.3].map((delay, index) => (
              <motion.div
                key={index}
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: color }}
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{ opacity: 0, scale: 2.5 }}
                transition={{ duration: 0.8, delay, ease: 'easeOut' }}
              />
            ))}

            {/* Victory Sparkles */}
            {[...Array(8)].map((_, index) => {
              const angle = (index * 360) / 8
              const distance = 50
              const x = Math.cos((angle * Math.PI) / 180) * distance
              const y = Math.sin((angle * Math.PI) / 180) * distance

              return (
                <motion.div
                  key={index}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: color,
                    left: '50%',
                    top: '50%',
                    boxShadow: `0 0 10px ${color}`,
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: x,
                    y: y,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                />
              )
            })}
          </>
        )}
      </AnimatePresence>

      {/* Crack Overlay (if damaged) */}
      {crackLevel > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          style={{ opacity: crackLevel * 0.3 }}
        >
          {/* Crack lines - more cracks as health decreases */}
          {crackLevel >= 1 && (
            <path
              d="M 50 0 L 50 100"
              stroke={color}
              strokeWidth="2"
              fill="none"
              opacity="0.5"
            />
          )}
          {crackLevel >= 2 && (
            <>
              <path
                d="M 20 30 L 80 70"
                stroke={color}
                strokeWidth="2"
                fill="none"
                opacity="0.5"
              />
              <path
                d="M 80 30 L 20 70"
                stroke={color}
                strokeWidth="2"
                fill="none"
                opacity="0.5"
              />
            </>
          )}
          {crackLevel >= 3 && (
            <>
              <path
                d="M 50 50 L 0 50"
                stroke={color}
                strokeWidth="2"
                fill="none"
                opacity="0.5"
              />
              <path
                d="M 50 50 L 100 50"
                stroke={color}
                strokeWidth="2"
                fill="none"
                opacity="0.5"
              />
            </>
          )}
        </svg>
      )}

      {/* Health Bar */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-20">
        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: '100%' }}
            animate={{ width: `${healthPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Defense Label */}
      <div
        className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-mono text-center"
        style={{ color }}
      >
        {config.displayName}
        <div className="text-gray-500 text-[10px]">
          {defense.blockedAttacks} blocks
        </div>
      </div>

      {/* Status Indicator */}
      {defense.status === 'active' && (
        <motion.div
          className="absolute -top-2 -right-2 w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {defense.status === 'compromised' && (
        <motion.div
          className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-red-500"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </div>
  )
}

/**
 * DefenseShieldGrid - Renders multiple defense shields
 */
interface DefenseShieldGridProps {
  defenses: Defense[]
  blockingDefenseId?: string
  onBlockComplete?: (defenseId: string) => void
}

export function DefenseShieldGrid({ defenses, blockingDefenseId, onBlockComplete }: DefenseShieldGridProps) {
  return (
    <div className="grid grid-cols-2 gap-8 p-4">
      {defenses.map((defense) => (
        <div key={defense.id} className="flex justify-center">
          <DefenseShield
            defense={defense}
            isBlocking={defense.id === blockingDefenseId}
            onBlockComplete={() => onBlockComplete?.(defense.id)}
          />
        </div>
      ))}
    </div>
  )
}
