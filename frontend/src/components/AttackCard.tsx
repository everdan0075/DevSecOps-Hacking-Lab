/**
 * AttackCard Component
 *
 * Displays individual attack scenario card with metadata
 */

import { Target, Lock, Shield, Zap, Eye, Activity, AlertTriangle } from 'lucide-react'
import type { AttackScenario } from '@/types/api'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'

interface AttackCardProps {
  scenario: AttackScenario
  disabled?: boolean
  onLaunch: () => void
}

const ICON_MAP = {
  'brute-force': Lock,
  'mfa-bruteforce': Shield,
  'token-replay': Activity,
  'credential-stuffing': AlertTriangle,
  'idor-exploit': Eye,
  'direct-access': Target,
  'rate-limit-bypass': Zap,
}

const DIFFICULTY_COLORS = {
  easy: 'text-cyber-success border-cyber-success/30 bg-cyber-success/10',
  medium: 'text-cyber-warning border-cyber-warning/30 bg-cyber-warning/10',
  hard: 'text-cyber-danger border-cyber-danger/30 bg-cyber-danger/10',
}

export function AttackCard({ scenario, disabled, onLaunch }: AttackCardProps) {
  const Icon = ICON_MAP[scenario.id as keyof typeof ICON_MAP] || Target

  return (
    <motion.div
      className={cn(
        'group relative bg-cyber-surface border border-cyber-border rounded-lg p-6',
        'transition-all duration-300',
        !disabled && 'hover:border-cyber-primary/50 hover:shadow-lg hover:shadow-cyber-primary/10',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      whileHover={!disabled ? {
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2, ease: 'easeOut' }
      } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {/* Glow effect on hover */}
      {!disabled && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyber-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-3 rounded-lg border transition-colors',
                !disabled
                  ? 'bg-cyber-bg border-cyber-primary/30 text-cyber-primary group-hover:border-cyber-primary'
                  : 'bg-cyber-bg/50 border-cyber-border text-gray-500'
              )}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">{scenario.name}</h3>
              <div className="flex items-center gap-2">
                <DifficultyBadge difficulty={scenario.difficulty} />
                {scenario.requires_auth && (
                  <span className="text-xs px-2 py-0.5 rounded bg-cyber-warning/10 border border-cyber-warning/30 text-cyber-warning">
                    Auth Required
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">{scenario.description}</p>

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Target:</span>
            <code className="font-mono text-cyber-secondary">{scenario.target_endpoint}</code>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Duration:</span>
            <span className="text-gray-400">{scenario.estimated_duration}</span>
          </div>
        </div>

        {/* OWASP Category */}
        <div className="mb-4 p-3 bg-cyber-bg/50 rounded border border-cyber-border">
          <div className="text-xs text-gray-500 mb-1">OWASP Category</div>
          <div className="text-xs font-mono text-cyber-primary">{scenario.owasp_category}</div>
        </div>

        {/* Detection Metrics */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Detection Metrics:</div>
          <div className="flex flex-wrap gap-1">
            {scenario.detection_metrics.map((metric) => (
              <span
                key={metric}
                className="text-xs px-2 py-1 rounded bg-cyber-bg border border-cyber-border/50 text-gray-400 font-mono"
              >
                {metric}
              </span>
            ))}
          </div>
        </div>

        {/* Launch Button */}
        <button
          onClick={onLaunch}
          disabled={disabled}
          className={cn(
            'w-full py-3 px-4 rounded-lg font-medium transition-all',
            'flex items-center justify-center gap-2',
            !disabled
              ? 'bg-cyber-primary text-cyber-bg hover:bg-cyber-primary/90 hover:shadow-lg hover:shadow-cyber-primary/30'
              : 'bg-cyber-border text-gray-500 cursor-not-allowed'
          )}
        >
          <Target className="w-4 h-4" />
          Launch Attack
        </button>
      </div>
    </motion.div>
  )
}

function DifficultyBadge({ difficulty }: { difficulty: 'easy' | 'medium' | 'hard' }) {
  return (
    <span
      className={cn(
        'text-xs px-2 py-0.5 rounded border font-medium',
        DIFFICULTY_COLORS[difficulty]
      )}
    >
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  )
}
