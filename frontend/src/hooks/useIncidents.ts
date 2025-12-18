/**
 * useIncidents Hook
 *
 * React hook for fetching and auto-refreshing security incidents using React Query
 */

import { useQueries } from '@tanstack/react-query'
import { incidentService } from '@/services/incidentService'
import { REFRESH_INTERVALS } from '@/utils/constants'
import type { Incident, IncidentStatsResponse } from '@/types/api'

interface UseIncidentsReturn {
  incidents: Incident[]
  stats: IncidentStatsResponse | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useIncidents(autoRefresh: boolean = true): UseIncidentsReturn {
  const results = useQueries({
    queries: [
      {
        queryKey: ['incidents', 'list'],
        queryFn: () => incidentService.getIncidents(),
        refetchInterval: autoRefresh ? REFRESH_INTERVALS.INCIDENT_LIST : false,
      },
      {
        queryKey: ['incidents', 'stats'],
        queryFn: () => incidentService.getIncidentStats(),
        refetchInterval: autoRefresh ? REFRESH_INTERVALS.INCIDENT_LIST : false,
      },
    ],
  })

  const [incidentsQuery, statsQuery] = results

  const loading = incidentsQuery.isLoading || statsQuery.isLoading
  const error = incidentsQuery.error || statsQuery.error

  return {
    incidents: incidentsQuery.data || [],
    stats: statsQuery.data || null,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch incidents') : null,
    refetch: () => {
      incidentsQuery.refetch()
      statsQuery.refetch()
    },
  }
}
