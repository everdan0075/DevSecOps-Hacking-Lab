/**
 * useMetrics Hook
 *
 * React hook for fetching and auto-refreshing Prometheus metrics using React Query
 */

import { useQuery } from '@tanstack/react-query'
import { metricsService } from '@/services/metricsService'
import { REFRESH_INTERVALS } from '@/utils/constants'
import type { SecurityMetrics } from '@/types/api'

interface UseMetricsReturn {
  metrics: SecurityMetrics | null
  loading: boolean
  error: string | null
  refetch: () => void
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
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['metrics', 'security'],
    queryFn: () => metricsService.getSecurityMetrics(),
    refetchInterval: autoRefresh ? REFRESH_INTERVALS.METRICS : false,
    placeholderData: DEFAULT_METRICS,
  })

  return {
    metrics: data || DEFAULT_METRICS,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch metrics') : null,
    refetch,
  }
}
