/**
 * Battlefield Component
 *
 * Center visualization showing the epic cyber battle
 * Features:
 * - Hexagon grid background
 * - Matrix rain effect (simple version)
 * - Render AttackArrowBatch (flying projectiles)
 * - Center metrics overlay
 * - Collision effects area
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AttackArrowBatch } from './AttackArrow'
import { Zap, Shield, Database, Server } from 'lucide-react'
import type { Attack, BattleMetrics, Defense, DefenseType } from '@/types/battle'
import { DEFENSE_CONFIGS } from '@/types/battle'
import { Ban, Crosshair, Bot, Key, CheckCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

interface BattlefieldProps {
  activeAttacks: Attack[]
  metrics: BattleMetrics
  blockingDefenseId?: string
  activeDefenses?: Defense[]
  onAttackComplete?: (attackId: string) => void
  onAttackCollision?: (attackId: string) => void
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

const DEFENSE_COLORS: Record<DefenseType, string> = {
  waf: '#3b82f6',
  rate_limit: '#06b6d4',
  honeypot: '#f59e0b',
  ip_ban: '#ef4444',
  token_revocation: '#8b5cf6',
  incident_response: '#10b981',
  jwt_validation: '#06b6d4',
}

export function Battlefield({
  activeAttacks,
  metrics,
  blockingDefenseId,
  activeDefenses = [],
  onAttackComplete,
  onAttackCollision,
}: BattlefieldProps) {
  const [matrixChars, setMatrixChars] = useState<Array<{ id: number; x: number; char: string }>>([])
  const [flyingDefense, setFlyingDefense] = useState<{ id: string; type: DefenseType } | null>(null)

  // Trigger defense shield animation when blocking
  useEffect(() => {
    if (blockingDefenseId) {
      const defense = activeDefenses.find((d) => d.id === blockingDefenseId)
      if (defense) {
        setFlyingDefense({ id: defense.id, type: defense.type })
        setTimeout(() => setFlyingDefense(null), 2000) // Clear after animation
      }
    }
  }, [blockingDefenseId, activeDefenses])

  // Generate matrix rain effect
  useEffect(() => {
    const chars = '01アイウエオカキクケコサシスセソタチツテト'
    const interval = setInterval(() => {
      setMatrixChars((prev) => {
        // Add new character
        const newChar = {
          id: Date.now() + Math.random(),
          x: Math.random() * 100,
          char: chars[Math.floor(Math.random() * chars.length)],
        }
        // Keep only last 15 characters
        return [...prev, newChar].slice(-15)
      })
    }, 300)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950">
      {/* Hexagon Grid Background */}
      <HexagonGrid />

      {/* Matrix Rain Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <AnimatePresence>
          {matrixChars.map((item) => (
            <motion.div
              key={item.id}
              className="absolute text-cyber-primary font-mono text-sm"
              style={{ left: `${item.x}%`, top: -20 }}
              initial={{ y: 0, opacity: 0.8 }}
              animate={{ y: '100vh', opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3, ease: 'linear' }}
            >
              {item.char}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Attack Arrows */}
      <AttackArrowBatch
        attacks={activeAttacks}
        onAttackComplete={onAttackComplete}
        onAttackCollision={onAttackCollision}
      />

      {/* Flying Defense Shield (RIGHT to LEFT, opposite of attacks) */}
      <AnimatePresence>
        {flyingDefense && (
          <FlyingDefenseShield defenseType={flyingDefense.type} />
        )}
      </AnimatePresence>

      {/* Center Metrics Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <motion.div
          className="bg-black/60 backdrop-blur-md border border-cyber-border rounded-lg p-6 min-w-[300px]"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-center text-cyber-primary font-mono text-sm mb-4 uppercase tracking-wider">
            Battle Metrics
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Attacks Launched vs Blocked */}
            <MetricDisplay
              label="Attacks"
              value={metrics.totalAttacks}
              icon={Zap}
              color="red"
            />
            <MetricDisplay
              label="Blocked"
              value={metrics.totalBlocks}
              icon={Shield}
              color="blue"
            />

            {/* Data Leaked */}
            <MetricDisplay
              label="Data Leaked"
              value={`${Math.round(metrics.dataLeaked)}MB`}
              icon={Database}
              color="orange"
            />

            {/* Systems Status */}
            <MetricDisplay
              label="Intact"
              value={`${metrics.systemsIntact.length}/${metrics.systemsIntact.length + metrics.systemsCompromised.length}`}
              icon={Server}
              color="green"
            />
          </div>

          {/* Success Rate Bar */}
          <div className="mt-4 pt-4 border-t border-cyber-border/30">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Attack Success Rate</span>
              <span className="font-mono text-cyber-primary">
                {Math.round(metrics.successRate)}%
              </span>
            </div>
            <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${metrics.successRate}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Collision Effects Area */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Collision sparks would be rendered here based on attack status */}
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-4 left-4 text-red-500/20 font-mono text-xs">
        RED OFFENSIVE ZONE
      </div>
      <div className="absolute top-4 right-4 text-blue-500/20 font-mono text-xs">
        BLUE DEFENSIVE ZONE
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-cyber-primary/20 font-mono text-xs">
        ACTIVE COMBAT ZONE
      </div>
    </div>
  )
}

interface MetricDisplayProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: 'red' | 'blue' | 'orange' | 'green'
}

function MetricDisplay({ label, value, icon: Icon, color }: MetricDisplayProps) {
  const colorClasses = {
    red: 'text-red-500',
    blue: 'text-blue-500',
    orange: 'text-orange-500',
    green: 'text-green-500',
  }

  return (
    <div className="text-center">
      <Icon className={cn('w-6 h-6 mx-auto mb-2', colorClasses[color])} />
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <motion.div
        key={value}
        className={cn('text-xl font-bold font-mono', colorClasses[color])}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {value}
      </motion.div>
    </div>
  )
}

/**
 * Hexagon Grid Background
 */
function HexagonGrid() {
  const hexagons: Array<{ id: number; x: number; y: number; delay: number }> = []

  // Generate hexagon grid positions
  const rows = 8
  const cols = 12
  const hexWidth = 80
  const hexHeight = 70

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * hexWidth + (row % 2) * (hexWidth / 2)
      const y = row * hexHeight * 0.75
      hexagons.push({
        id: row * cols + col,
        x,
        y,
        delay: (row + col) * 0.05,
      })
    }
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-10"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <pattern
          id="hexPattern"
          patternUnits="userSpaceOnUse"
          width={hexWidth}
          height={hexHeight}
        >
          {hexagons.slice(0, 2).map((hex) => (
            <Hexagon key={hex.id} size={30} x={hex.x} y={hex.y} delay={hex.delay} />
          ))}
        </pattern>
      </defs>
      <g>
        {hexagons.map((hex) => (
          <Hexagon key={hex.id} size={30} x={hex.x} y={hex.y} delay={hex.delay} />
        ))}
      </g>
    </svg>
  )
}

interface HexagonProps {
  size: number
  x: number
  y: number
  delay: number
}

function Hexagon({ size, x, y, delay }: HexagonProps) {
  const points = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i
    const px = x + size * Math.cos(angle)
    const py = y + size * Math.sin(angle)
    points.push(`${px},${py}`)
  }

  return (
    <motion.polygon
      points={points.join(' ')}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className="text-cyber-primary"
      initial={{ opacity: 0.1 }}
      animate={{ opacity: [0.1, 0.3, 0.1] }}
      transition={{
        duration: 4,
        repeat: Infinity,
        delay: delay,
        ease: 'easeInOut',
      }}
    />
  )
}

/**
 * Flying Defense Shield - Animates from RIGHT to LEFT (opposite of attack arrows)
 */
interface FlyingDefenseShieldProps {
  defenseType: DefenseType
}

function FlyingDefenseShield({ defenseType }: FlyingDefenseShieldProps) {
  const config = DEFENSE_CONFIGS[defenseType]
  const Icon = DEFENSE_ICONS[defenseType]
  const color = DEFENSE_COLORS[defenseType]

  return (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 right-0"
        initial={{ x: 0 }}
        animate={{ x: '-80%' }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 1.2, ease: 'linear' }}
      >
        <div className="relative">
          {/* Glow Effect */}
          <motion.div
            className="absolute inset-0 rounded-full blur-2xl"
            style={{ backgroundColor: color }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Shield Icon Container */}
          <div
            className="relative w-20 h-20 rounded-full border-4 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            style={{
              borderColor: color,
              boxShadow: `0 0 40px ${color}80, 0 0 80px ${color}40`,
            }}
          >
            <Icon className="w-10 h-10" style={{ color }} />
          </div>

          {/* Defense Name Label */}
          <motion.div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className="px-4 py-2 rounded-lg text-sm font-mono font-bold border-2 backdrop-blur-sm"
              style={{
                backgroundColor: `${color}30`,
                borderColor: color,
                color: color,
                boxShadow: `0 0 20px ${color}40`,
                textShadow: `0 0 10px ${color}`,
              }}
            >
              {config.displayName}
            </div>
          </motion.div>

          {/* Expanding Ripple */}
          <motion.div
            className="absolute inset-0 rounded-full border-4"
            style={{ borderColor: color }}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </div>
  )
}
