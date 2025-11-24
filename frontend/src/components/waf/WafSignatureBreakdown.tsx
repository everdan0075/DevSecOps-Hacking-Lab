/**
 * WAF Signature Breakdown Component
 *
 * Displays 8 WAF signature categories with counts and severity
 */

import { Shield, AlertTriangle, Code, FileCode, Database, Network, Key, Braces } from 'lucide-react'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'
import type { WafSignatureCategory } from '@/services/wafService'

interface WafSignatureBreakdownProps {
  categories: WafSignatureCategory[]
  loading?: boolean
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'SQL Injection': Database,
  'Cross-Site Scripting (XSS)': Code,
  'Command Injection': FileCode,
  'Path Traversal': Shield,
  'XML External Entity (XXE)': Braces,
  'Server-Side Request Forgery': Network,
  'LDAP Injection': Key,
  'Template Injection': AlertTriangle,
}

export function WafSignatureBreakdown({ categories, loading }: WafSignatureBreakdownProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CategoryCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-cyber-surface border border-cyber-border">
        <Shield className="w-12 h-12 mx-auto mb-4 text-cyber-primary" />
        <h3 className="text-lg font-semibold mb-2">No Signature Data</h3>
        <p className="text-gray-400">
          WAF signatures are loaded but no metrics available yet.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((category, index) => (
        <CategoryCard key={category.name} category={category} index={index} />
      ))}
    </div>
  )
}

interface CategoryCardProps {
  category: WafSignatureCategory
  index: number
}

function CategoryCard({ category, index }: CategoryCardProps) {
  const Icon = CATEGORY_ICONS[category.name] || Shield

  // Color mapping
  const colorClasses = {
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      glow: 'bg-red-500/30',
      badge: 'bg-red-500/20 text-red-300',
    },
    orange: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      glow: 'bg-orange-500/30',
      badge: 'bg-orange-500/20 text-orange-300',
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      glow: 'bg-yellow-500/30',
      badge: 'bg-yellow-500/20 text-yellow-300',
    },
  }

  const colors = colorClasses[category.color as keyof typeof colorClasses] || colorClasses.red

  return (
    <motion.div
      className={cn(
        'relative p-4 rounded-lg bg-cyber-surface border transition-all',
        'hover:border-cyber-primary/50',
        colors.border
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{
        scale: 1.03,
        y: -2,
        transition: { duration: 0.2, ease: 'easeOut' }
      }}
    >
      {/* Icon with glow */}
      <div className={cn('relative inline-flex p-3 rounded-lg mb-3', colors.bg)}>
        <Icon className={cn('w-6 h-6', colors.text)} />
        <div className={cn('absolute inset-0 blur-xl', colors.glow, 'opacity-50')} />
      </div>

      {/* Category name */}
      <h3 className="text-sm font-medium text-gray-300 mb-2">
        {category.name}
      </h3>

      {/* Signature count */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-white">
          {category.count}
        </span>
        <span className="text-xs text-gray-400">
          {category.count === 1 ? 'signature' : 'signatures'}
        </span>
      </div>

      {/* Severity badge */}
      <div className="flex items-center justify-between">
        <span className={cn('px-2 py-1 rounded text-xs font-medium uppercase', colors.badge)}>
          {category.severity}
        </span>

        {/* Block count (if available) */}
        {category.blockCount !== undefined && (
          <span className="text-xs text-gray-400">
            {category.blockCount} {category.blockCount === 1 ? 'block' : 'blocks'}
          </span>
        )}
        {category.blockCount === undefined && (
          <span className="text-xs text-gray-500">
            N/A
          </span>
        )}
      </div>
    </motion.div>
  )
}

function CategoryCardSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-cyber-surface border border-cyber-border animate-pulse">
      <div className="w-12 h-12 rounded-lg bg-cyber-bg mb-3" />
      <div className="w-32 h-4 rounded bg-cyber-bg mb-2" />
      <div className="w-20 h-8 rounded bg-cyber-bg mb-3" />
      <div className="flex items-center justify-between">
        <div className="w-16 h-6 rounded bg-cyber-bg" />
        <div className="w-12 h-4 rounded bg-cyber-bg" />
      </div>
    </div>
  )
}
