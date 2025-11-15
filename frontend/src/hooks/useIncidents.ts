/**
 * useIncidents Hook
 *
 * React hook for fetching and auto-refreshing security incidents
 */

import { useState, useEffect, useCallback } from 'react'
import { incidentService } from '@/services/incidentService'
import { REFRESH_INTERVALS } from '@/utils/constants'
import type { Incident, IncidentStatsResponse } from '@/types/api'

interface UseIncidentsReturn {
  incidents: Incident[]
  stats: IncidentStatsResponse | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useIncidents(autoRefresh: boolean = true): UseIncidentsReturn {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState<IncidentStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIncidents = useCallback(async () => {
    try {
      setError(null)
      const [incidentsList, statsData] = await Promise.all([
        incidentService.getIncidents(),
        incidentService.getIncidentStats(),
      ])
      setIncidents(incidentsList)
      setStats(statsData)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch incidents')
      setIncidents([])
      setStats(null)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchIncidents()

    if (!autoRefresh) return

    // Auto-refresh interval (more frequent for incidents)
    const intervalId = setInterval(() => {
      fetchIncidents()
    }, REFRESH_INTERVALS.INCIDENT_LIST)

    return () => {
      clearInterval(intervalId)
    }
  }, [fetchIncidents, autoRefresh])

  return {
    incidents,
    stats,
    loading,
    error,
    refetch: fetchIncidents,
  }
}
