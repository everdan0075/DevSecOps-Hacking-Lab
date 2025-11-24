/**
 * WAF Analytics Dashboard Page
 *
 * Comprehensive view of Web Application Firewall metrics and configuration
 */

import { useState, useEffect } from 'react'
import { Shield, RefreshCw, AlertTriangle, Activity } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { WafSignatureBreakdown } from '@/components/waf/WafSignatureBreakdown'
import { WafBlockedPatterns } from '@/components/waf/WafBlockedPatterns'
import { UserAgentFiltering } from '@/components/waf/UserAgentFiltering'
import { EndpointRateLimits } from '@/components/waf/EndpointRateLimits'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import wafService from '@/services/wafService'
import type { WafDashboardData } from '@/services/wafService'

const REFRESH_INTERVAL = 30000 // 30 seconds

export function WafAnalytics() {
  const [data, setData] = useState<WafDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const dashboardData = await wafService.getWafDashboardData()
      setData(dashboardData)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Failed to fetch WAF data:', err)
      setError('Failed to load WAF analytics. Backend may be unavailable.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()

    const interval = setInterval(() => {
      fetchData(true)
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    fetchData(true)
  }

  if (loading && !data) {
    return <LoadingSkeleton variant="page" />
  }

  if (error && !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-8 text-center rounded-lg bg-cyber-surface border border-cyber-border">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-cyber-danger" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load WAF Analytics</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-lg bg-cyber-primary hover:bg-cyber-primary/80 text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero Section */}
        <div className="relative mb-8 p-8 rounded-lg bg-gradient-to-br from-cyber-surface to-cyber-bg border border-cyber-border overflow-hidden">
          {/* Background glow effect */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyber-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyber-secondary/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Shield className="w-12 h-12 text-cyber-primary" />
                  <div className="absolute inset-0 blur-xl bg-cyber-primary/50" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-matrix mb-2">
                    WAF Analytics Dashboard
                  </h1>
                  <p className="text-gray-400">
                    Web Application Firewall monitoring and signature analysis
                  </p>
                </div>
              </div>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-cyber-surface border border-cyber-border',
                  'hover:border-cyber-primary/50 transition-all',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                title="Refresh data"
              >
                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                <span className="text-sm">Refresh</span>
              </button>
            </div>

            {/* Stats */}
            {data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Total Blocks"
                  value={data.totalBlocks}
                  icon={Shield}
                  color="primary"
                />
                <StatCard
                  label="Active Signatures"
                  value={data.activeSignatures}
                  icon={Activity}
                  color="secondary"
                />
                <StatCard
                  label="Protected Endpoints"
                  value={data.protectedEndpoints}
                  icon={Shield}
                  color="success"
                />
              </div>
            )}

            {/* Last updated */}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <Activity className="w-3 h-3" />
              <span>
                Last updated: {lastUpdate.toLocaleTimeString()} (auto-refresh every 30s)
              </span>
            </div>
          </div>
        </div>

        {data && (
          <div className="space-y-8">
            {/* WAF Signature Breakdown */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyber-primary" />
                WAF Signature Categories
              </h2>
              <WafSignatureBreakdown
                categories={data.signatureCategories}
                loading={loading}
              />
            </section>

            {/* Endpoint Rate Limits */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyber-primary" />
                Endpoint Rate Limits
              </h2>
              <EndpointRateLimits
                rateLimits={data.endpointRateLimits}
                loading={loading}
              />
            </section>

            {/* Blocked Patterns & User-Agent Filtering */}
            <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Blocked Patterns (60%) */}
              <div className="lg:col-span-3">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-cyber-danger" />
                  Blocked Attack Patterns
                </h2>
                <WafBlockedPatterns
                  patterns={data.suspiciousPatterns}
                  loading={loading}
                />
              </div>

              {/* User-Agent Filtering (40%) */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyber-primary" />
                  User-Agent Filtering
                </h2>
                <UserAgentFiltering
                  userAgentBlocks={data.userAgentBlocks}
                  blockedCategories={wafService.getBlockedUserAgentCategories()}
                  whitelistedAgents={wafService.getWhitelistedUserAgents()}
                  loading={loading}
                />
              </div>
            </section>

            {/* Info Banner */}
            {data.totalBlocks === 0 && data.suspiciousPatterns.length === 0 && (
              <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-border">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-cyber-warning mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Live Metrics Require Backend Connection
                    </h3>
                    <p className="text-sm text-gray-400">
                      WAF configuration is visible, but live block metrics require Prometheus connection.
                      Start the backend services with <code className="text-cyber-primary">docker-compose up -d</code> to see real-time data.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning'
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    primary: {
      bg: 'bg-cyber-primary/10',
      text: 'text-cyber-primary',
      border: 'border-cyber-primary/30',
    },
    secondary: {
      bg: 'bg-cyber-secondary/10',
      text: 'text-cyber-secondary',
      border: 'border-cyber-secondary/30',
    },
    success: {
      bg: 'bg-cyber-success/10',
      text: 'text-cyber-success',
      border: 'border-cyber-success/30',
    },
    danger: {
      bg: 'bg-cyber-danger/10',
      text: 'text-cyber-danger',
      border: 'border-cyber-danger/30',
    },
    warning: {
      bg: 'bg-cyber-warning/10',
      text: 'text-cyber-warning',
      border: 'border-cyber-warning/30',
    },
  }

  const colors = colorClasses[color]

  return (
    <div className={cn(
      'relative p-4 rounded-lg bg-cyber-surface border transition-all',
      'hover:border-cyber-primary/50',
      colors.border
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn('p-2 rounded-lg', colors.bg)}>
          <Icon className={cn('w-5 h-5', colors.text)} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-white mb-1">
          {value.toLocaleString()}
        </div>
        <div className="text-sm text-gray-400">
          {label}
        </div>
      </div>
    </div>
  )
}
