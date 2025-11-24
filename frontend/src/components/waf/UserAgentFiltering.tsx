/**
 * User-Agent Filtering Component
 *
 * Displays User-Agent filtering rules and block statistics
 */

import { Shield, Ban, CheckCircle, Search, Bot } from 'lucide-react'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'
import type { UserAgentBlock } from '@/services/wafService'

interface UserAgentFilteringProps {
  userAgentBlocks: UserAgentBlock[]
  blockedCategories: {
    scanners: string[]
    scrapers: string[]
    bots: string[]
  }
  whitelistedAgents: string[]
  loading?: boolean
}

export function UserAgentFiltering({
  userAgentBlocks,
  blockedCategories,
  whitelistedAgents,
  loading,
}: UserAgentFilteringProps) {
  if (loading) {
    return <FilteringSkeleton />
  }

  // Group blocks by category
  const blocksByCategory = {
    scanner: userAgentBlocks.filter(b => b.category === 'scanner'),
    scraper: userAgentBlocks.filter(b => b.category === 'scraper'),
    bot: userAgentBlocks.filter(b => b.category === 'bot'),
  }

  const totalBlocks = userAgentBlocks.reduce((sum, b) => sum + b.count, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-lg bg-cyber-surface border border-cyber-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Shield className="w-5 h-5 text-cyber-primary" />
            <div className="absolute inset-0 blur-lg bg-cyber-primary/30" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">User-Agent Filtering</h3>
            <p className="text-sm text-gray-400">
              {totalBlocks > 0
                ? `${totalBlocks} malicious agents blocked`
                : 'No malicious agents detected'}
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Scanners"
            count={blocksByCategory.scanner.length}
            total={blockedCategories.scanners.length}
            color="red"
          />
          <StatCard
            label="Scrapers"
            count={blocksByCategory.scraper.length}
            total={blockedCategories.scrapers.length}
            color="orange"
          />
          <StatCard
            label="Bots"
            count={blocksByCategory.bot.length}
            total={blockedCategories.bots.length}
            color="yellow"
          />
        </div>
      </div>

      {/* Blocked Categories */}
      <div className="p-4 rounded-lg bg-cyber-surface border border-cyber-border">
        <div className="flex items-center gap-2 mb-3">
          <Ban className="w-4 h-4 text-cyber-danger" />
          <h4 className="text-sm font-semibold text-white">Blocked Categories</h4>
        </div>

        <div className="space-y-3">
          {/* Security Scanners */}
          <CategorySection
            title="Security Scanners"
            agents={blockedCategories.scanners}
            blocks={blocksByCategory.scanner}
            color="red"
            icon={Search}
          />

          {/* Scrapers */}
          <CategorySection
            title="Scrapers"
            agents={blockedCategories.scrapers}
            blocks={blocksByCategory.scraper}
            color="orange"
            icon={Bot}
          />

          {/* Known Bad Bots */}
          <CategorySection
            title="Known Bad Bots"
            agents={blockedCategories.bots}
            blocks={blocksByCategory.bot}
            color="yellow"
            icon={Ban}
          />
        </div>
      </div>

      {/* Whitelisted Bots */}
      <div className="p-4 rounded-lg bg-cyber-surface border border-cyber-border">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-cyber-success" />
          <h4 className="text-sm font-semibold text-white">Whitelisted Good Bots</h4>
        </div>

        <div className="flex flex-wrap gap-2">
          {whitelistedAgents.map((agent, index) => (
            <motion.span
              key={agent}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium',
                'bg-cyber-success/20 text-cyber-success',
                'border border-cyber-success/30'
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
            >
              {agent}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  count: number
  total: number
  color: 'red' | 'orange' | 'yellow'
}

function StatCard({ label, count, total, color }: StatCardProps) {
  const colorClasses = {
    red: 'text-red-400 bg-red-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
  }

  return (
    <div className={cn('p-3 rounded-lg', colorClasses[color])}>
      <div className={cn('text-2xl font-bold', colorClasses[color].split(' ')[0])}>
        {count}/{total}
      </div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  )
}

interface CategorySectionProps {
  title: string
  agents: string[]
  blocks: UserAgentBlock[]
  color: 'red' | 'orange' | 'yellow'
  icon: React.ComponentType<{ className?: string }>
}

function CategorySection({ title, agents, blocks, color, icon: Icon }: CategorySectionProps) {
  const colorClasses = {
    red: {
      badge: 'bg-red-500/20 text-red-300 border-red-500/30',
      count: 'bg-red-500/30 text-red-200',
    },
    orange: {
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      count: 'bg-orange-500/30 text-orange-200',
    },
    yellow: {
      badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      count: 'bg-yellow-500/30 text-yellow-200',
    },
  }

  const colors = colorClasses[color]

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3 h-3 text-gray-400" />
        <span className="text-xs font-medium text-gray-400">{title}</span>
        <span className="text-xs text-gray-500">({agents.length})</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {agents.map((agent, index) => {
          const blockData = blocks.find(b => b.agent.toLowerCase().includes(agent.toLowerCase()))
          const blockCount = blockData?.count || 0

          return (
            <motion.span
              key={agent}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border',
                'flex items-center gap-2',
                colors.badge
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
            >
              {agent}
              {blockCount > 0 && (
                <span className={cn('px-1.5 py-0.5 rounded text-xs', colors.count)}>
                  {blockCount}
                </span>
              )}
            </motion.span>
          )
        })}
      </div>
    </div>
  )
}

function FilteringSkeleton() {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-cyber-surface border border-cyber-border">
        <div className="w-48 h-6 rounded bg-cyber-bg animate-pulse mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg bg-cyber-bg animate-pulse h-20" />
          ))}
        </div>
      </div>
      <div className="p-4 rounded-lg bg-cyber-surface border border-cyber-border">
        <div className="w-32 h-4 rounded bg-cyber-bg animate-pulse mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full h-16 rounded bg-cyber-bg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
