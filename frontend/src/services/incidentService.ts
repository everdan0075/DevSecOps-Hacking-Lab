/**
 * Incident Service
 *
 * Service for querying incident-bot API to retrieve security incidents
 */

import { ENDPOINTS, TIMEOUTS } from '@/utils/constants'
import type { Incident, IncidentStatsResponse, IncidentListResponse } from '@/types/api'

class IncidentService {
  /**
   * Fetch list of incidents
   */
  async getIncidents(): Promise<Incident[]> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST)

      const response = await fetch(ENDPOINTS.INCIDENTS.LIST, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`Incident list fetch failed: ${response.status}`)
        return []
      }

      const data: IncidentListResponse = await response.json()
      return data.incidents || []
    } catch (error) {
      console.debug('Incident list fetch failed:', error)
      return []
    }
  }

  /**
   * Fetch incident statistics
   */
  async getIncidentStats(): Promise<IncidentStatsResponse | null> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST)

      const response = await fetch(ENDPOINTS.INCIDENTS.STATS, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`Incident stats fetch failed: ${response.status}`)
        return null
      }

      return await response.json()
    } catch (error) {
      console.debug('Incident stats fetch failed:', error)
      return null
    }
  }

  /**
   * Check if incident bot is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.BACKEND_HEALTH_CHECK)

      const response = await fetch(ENDPOINTS.INCIDENTS.HEALTH, {
        method: 'GET',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Get most common attack category from stats
   */
  getMostCommonCategory(stats: IncidentStatsResponse | null): string {
    if (!stats || !stats.incidents_by_severity) return 'N/A'

    // Find category with highest count
    const categories = Object.entries(stats.incidents_by_severity || {})
    if (categories.length === 0) return 'N/A'

    const [category] = categories.reduce((max, current) =>
      current[1] > max[1] ? current : max
    )

    return category || 'N/A'
  }
}

// Singleton instance
export const incidentService = new IncidentService()
