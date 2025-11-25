/**
 * AttackArrow Component
 *
 * Animated attack projectile flying from Red Team to Blue Team
 * Features:
 * - Framer Motion animation (left to right)
 * - Particle trail effect
 * - Color based on severity
 * - Collision detection
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ATTACK_CONFIGS, type Attack, type AttackSeverity } from '@/types/battle'
import { cn } from '@/utils/cn'

interface AttackArrowProps {
  attack: Attack
  onComplete?: () => void
  onCollision?: () => void
}

const SEVERITY_COLORS = {
  low: '#3b82f6', // blue
  medium: '#f59e0b', // amber
  high: '#ef4444', // red
  critical: '#dc2626', // dark red
} as const

const SEVERITY_GLOW = {
  low: '0 0 10px #3b82f6',
  medium: '0 0 15px #f59e0b',
  high: '0 0 20px #ef4444',
  critical: '0 0 30px #dc2626, 0 0 50px #dc2626',
} as const

export function AttackArrow({ attack, onComplete, onCollision }: AttackArrowProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])
  const config = ATTACK_CONFIGS[attack.type]
  const color = SEVERITY_COLORS[attack.severity]
  const glow = SEVERITY_GLOW[attack.severity]

  // Generate trail particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) => {
        const newParticle = {
          id: Date.now(),
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
        }
        // Keep only last 5 particles
        return [...prev, newParticle].slice(-5)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Clear old particles
  useEffect(() => {
    const timeout = setTimeout(() => {
      setParticles((prev) => prev.slice(1))
    }, 1000)

    return () => clearTimeout(timeout)
  }, [particles])

  const animationDuration = config.duration / 1000 // ms to seconds

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Main Arrow */}
      <motion.div
        className="absolute top-1/2 left-0"
        initial={{ x: '10%', y: '-50%', scale: 0.5, opacity: 0 }}
        animate={{
          x: attack.status === 'blocked' ? '60%' : '90%',
          y: '-50%',
          scale: 1,
          opacity: attack.status === 'in_flight' ? 1 : 0,
        }}
        transition={{
          duration: animationDuration,
          ease: 'linear',
        }}
        onAnimationComplete={() => {
          if (attack.status === 'blocked') {
            onCollision?.()
          }
          onComplete?.()
        }}
      >
        {/* Arrow Body */}
        <div className="relative">
          {/* Glow Effect */}
          <div
            className="absolute inset-0 blur-lg opacity-60"
            style={{
              background: color,
              boxShadow: glow,
            }}
          />

          {/* Arrow Shape */}
          <svg
            width="60"
            height="24"
            viewBox="0 0 60 24"
            className="relative z-10"
            style={{ filter: `drop-shadow(${glow})` }}
          >
            {/* Arrow body */}
            <path
              d="M 0 12 L 45 12 L 60 12 L 50 6 M 60 12 L 50 18"
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Arrow tip */}
            <polygon points="45,6 60,12 45,18" fill={color} opacity="0.8" />
          </svg>

          {/* Attack Icon */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs"
            style={{ color }}
          >
            {config.icon}
          </div>

          {/* Particle Trail */}
          {particles.map((particle, index) => (
            <motion.div
              key={particle.id}
              className="absolute w-1 h-1 rounded-full"
              style={{
                backgroundColor: color,
                left: `${-20 + particle.x}px`,
                top: `${12 + particle.y}px`,
                boxShadow: glow,
              }}
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.8 }}
            />
          ))}

          {/* Pulse Wave (for critical attacks) */}
          {attack.severity === 'critical' && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2"
              style={{ borderColor: color }}
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </div>

        {/* Attack Label */}
        <motion.div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap text-xs font-mono"
          style={{ color }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {config.displayName}
        </motion.div>
      </motion.div>
    </div>
  )
}

/**
 * AttackArrowBatch - Renders multiple attack arrows
 */
interface AttackArrowBatchProps {
  attacks: Attack[]
  onAttackComplete?: (attackId: string) => void
  onAttackCollision?: (attackId: string) => void
}

export function AttackArrowBatch({ attacks, onAttackComplete, onAttackCollision }: AttackArrowBatchProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {attacks
        .filter((attack) => attack.status === 'in_flight' || attack.status === 'blocked')
        .map((attack, index) => (
          <div
            key={attack.id}
            className="absolute inset-0"
            style={{
              // Stagger vertical position to avoid overlap
              top: `${40 + (index % 3) * 20}%`,
            }}
          >
            <AttackArrow
              attack={attack}
              onComplete={() => onAttackComplete?.(attack.id)}
              onCollision={() => onAttackCollision?.(attack.id)}
            />
          </div>
        ))}
    </div>
  )
}
