/**
 * useMetrics Hook
 *
 * React hook for fetching and auto-refreshing Prometheus metrics
 */

import { useState, useEffect, useCallback } from 'react'
import { metricsService } from '@/services/metricsService'
import { REFRESH_INTERVALS } from '@/utils/constants'
import type { SecurityMetrics } from '@/types/api'

interface UseMetricsReturn {
  metrics: SecurityMetrics | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const DEFAULT_METRICS: SecurityMetrics = {
  login_attempts_total: 0,
  login_failures_total: 0,
  mfa_attempts_total: 0,
  idor_attempts_total: 0,
  rate_limit_blocks_total: 0,
  ip_bans_active: 0,
}

export function useMetrics(autoRefresh: boolean = true): UseMetricsReturn {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null)
      const data = await metricsService.getSecurityMetrics()
      setMetrics(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
      setMetrics(DEFAULT_METRICS)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchMetrics()

    if (!autoRefresh) return

    // Auto-refresh interval
    const intervalId = setInterval(() => {
      fetchMetrics()
    }, REFRESH_INTERVALS.METRICS)

    return () => {
      clearInterval(intervalId)
    }
  }, [fetchMetrics, autoRefresh])

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  }
}
