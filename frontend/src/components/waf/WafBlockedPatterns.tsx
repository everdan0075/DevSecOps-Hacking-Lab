/**
 * WAF Blocked Patterns Component
 *
 * Shows top 10 blocked patterns in last 24 hours
 */

import { useState } from 'react'
import { AlertTriangle, TrendingUp, Users, Clock } from 'lucide-react'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'
import type { SuspiciousPattern } from '@/services/wafService'

interface WafBlockedPatternsProps {
  patterns: SuspiciousPattern[]
  loading?: boolean
}

type SortField = 'count' | 'lastSeen' | 'ips'
type SortDirection = 'asc' | 'desc'

export function WafBlockedPatterns({ patterns, loading }: WafBlockedPatternsProps) {
  const [sortField, setSortField] = useState<SortField>('count')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedPatterns = [...patterns].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case 'count':
        comparison = a.count - b.count
        break
      case 'lastSeen':
        comparison = new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime()
        break
      case 'ips':
        comparison = a.attackerIps.length - b.attackerIps.length
        break
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  if (loading) {
    return <TableSkeleton />
  }

  if (patterns.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-cyber-surface border border-cyber-border">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-cyber-success" />
        <h3 className="text-lg font-semibold mb-2">No Blocked Patterns</h3>
        <p className="text-gray-400">
          No suspicious patterns detected in the last 24 hours.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-cyber-surface border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-cyber-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <AlertTriangle className="w-5 h-5 text-cyber-danger" />
            <div className="absolute inset-0 blur-lg bg-cyber-danger/30" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Blocked Patterns</h3>
            <p className="text-sm text-gray-400">
              Top {patterns.length} suspicious patterns detected
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-cyber-bg/50">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('count')}
                  className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-cyber-primary transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Pattern
                  {sortField === 'count' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('count')}
                  className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-cyber-primary transition-colors"
                >
                  Blocks
                  {sortField === 'count' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('ips')}
                  className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-cyber-primary transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Attacker IPs
                  {sortField === 'ips' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('lastSeen')}
                  className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-cyber-primary transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  Last Seen
                  {sortField === 'lastSeen' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPatterns.map((pattern, index) => (
              <PatternRow key={pattern.pattern} pattern={pattern} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface PatternRowProps {
  pattern: SuspiciousPattern
  index: number
}

function PatternRow({ pattern, index }: PatternRowProps) {
  const [expanded, setExpanded] = useState(false)

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 24) {
      return date.toLocaleDateString()
    } else if (hours > 0) {
      return `${hours}h ago`
    } else if (minutes > 0) {
      return `${minutes}m ago`
    } else {
      return 'Just now'
    }
  }

  return (
    <motion.tr
      className={cn(
        'border-t border-cyber-border',
        'hover:bg-cyber-bg/30 transition-colors',
        index % 2 === 0 ? 'bg-cyber-bg/10' : ''
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <td className="px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-left w-full group"
        >
          <code className={cn(
            'text-sm font-mono text-cyber-primary',
            'group-hover:text-cyber-secondary transition-colors',
            !expanded && 'line-clamp-1'
          )}>
            {pattern.pattern}
          </code>
        </button>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-2 px-2 py-1 rounded bg-cyber-danger/20 text-cyber-danger text-sm font-medium">
          {pattern.count}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">
            {pattern.attackerIps.length}
          </span>
          {pattern.attackerIps.length > 1 && (
            <span className="text-xs text-gray-500">unique</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-400">
          {formatTimestamp(pattern.lastSeen)}
        </span>
      </td>
    </motion.tr>
  )
}

function TableSkeleton() {
  return (
    <div className="rounded-lg bg-cyber-surface border border-cyber-border overflow-hidden">
      <div className="p-4 border-b border-cyber-border">
        <div className="w-48 h-6 rounded bg-cyber-bg animate-pulse" />
        <div className="w-64 h-4 rounded bg-cyber-bg animate-pulse mt-2" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex-1 h-4 rounded bg-cyber-bg animate-pulse" />
            <div className="w-16 h-4 rounded bg-cyber-bg animate-pulse" />
            <div className="w-16 h-4 rounded bg-cyber-bg animate-pulse" />
            <div className="w-24 h-4 rounded bg-cyber-bg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
