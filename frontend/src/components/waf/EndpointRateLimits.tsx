/**
 * Endpoint Rate Limits Component
 *
 * Displays per-endpoint rate limit configuration
 */

import { Activity, Clock, Zap, AlertCircle, ShieldCheck } from 'lucide-react'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'
import type { EndpointRateLimit } from '@/services/wafService'

interface EndpointRateLimitsProps {
  rateLimits: EndpointRateLimit[]
  loading?: boolean
}

export function EndpointRateLimits({ rateLimits, loading }: EndpointRateLimitsProps) {
  if (loading) {
    return <TableSkeleton />
  }

  if (rateLimits.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-cyber-surface border border-cyber-border">
        <Activity className="w-12 h-12 mx-auto mb-4 text-cyber-primary" />
        <h3 className="text-lg font-semibold mb-2">No Rate Limits Configured</h3>
        <p className="text-gray-400">
          Rate limiting configuration not available.
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
            <Activity className="w-5 h-5 text-cyber-primary" />
            <div className="absolute inset-0 blur-lg bg-cyber-primary/30" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Endpoint Rate Limits</h3>
            <p className="text-sm text-gray-400">
              Per-endpoint rate limiting configuration
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-cyber-bg/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                Endpoint
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Rate
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Burst
                </div>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                Window
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {rateLimits.map((limit, index) => (
              <RateLimitRow key={limit.endpoint} limit={limit} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface RateLimitRowProps {
  limit: EndpointRateLimit
  index: number
}

function RateLimitRow({ limit, index }: RateLimitRowProps) {
  const isCritical = limit.endpoint.includes('/auth')
  const isHoneypot = limit.note?.toLowerCase().includes('honeypot')

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
      {/* Endpoint */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isHoneypot && (
            <div title="Honeypot endpoint">
              <AlertCircle className="w-4 h-4 text-cyber-warning" />
            </div>
          )}
          {isCritical && !isHoneypot && (
            <div title="Critical endpoint">
              <ShieldCheck className="w-4 h-4 text-cyber-primary" />
            </div>
          )}
          <code className={cn(
            'text-sm font-mono',
            isCritical ? 'text-cyber-primary' : 'text-gray-300'
          )}>
            {limit.endpoint}
          </code>
        </div>
      </td>

      {/* Rate */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-white">
            {limit.rate}
          </span>
          <span className="text-xs text-gray-400">
            req/min
          </span>
        </div>
      </td>

      {/* Burst */}
      <td className="px-4 py-3">
        <span className="text-sm text-gray-300">
          {limit.burst}
        </span>
      </td>

      {/* Window */}
      <td className="px-4 py-3">
        <span className="text-sm text-gray-400">
          {limit.window}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
          limit.status === 'active'
            ? 'bg-cyber-success/20 text-cyber-success'
            : 'bg-gray-500/20 text-gray-400'
        )}>
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            limit.status === 'active' ? 'bg-cyber-success' : 'bg-gray-400'
          )} />
          {limit.status}
        </span>
      </td>

      {/* Notes */}
      <td className="px-4 py-3">
        {limit.note && (
          <span className={cn(
            'text-xs',
            isHoneypot ? 'text-cyber-warning' : 'text-gray-400'
          )}>
            {limit.note}
          </span>
        )}
        {limit.currentBlocks !== undefined && limit.currentBlocks > 0 && (
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyber-danger/20 text-cyber-danger text-xs">
            {limit.currentBlocks} blocks (1h)
          </span>
        )}
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
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex-1 h-4 rounded bg-cyber-bg animate-pulse" />
            <div className="w-16 h-4 rounded bg-cyber-bg animate-pulse" />
            <div className="w-12 h-4 rounded bg-cyber-bg animate-pulse" />
            <div className="w-20 h-4 rounded bg-cyber-bg animate-pulse" />
            <div className="w-16 h-4 rounded bg-cyber-bg animate-pulse" />
            <div className="w-32 h-4 rounded bg-cyber-bg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
