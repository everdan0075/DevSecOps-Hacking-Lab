/**
 * Incident Service
 *
 * Service for querying incident-bot API to retrieve security incidents
 */

import { ENDPOINTS, TIMEOUTS } from '@/utils/constants'
import type { Incident, IncidentStatsResponse } from '@/types/api'

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

      const data: any = await response.json()
      // Backend returns { count, executions } not { incidents, total }
      const executions = data.executions || data.incidents || []

      // Map backend execution format to frontend Incident format
      return executions.map((exec: any, index: number) => ({
        id: exec.alert_fingerprint || `incident-${index}`,
        timestamp: exec.started_at || new Date().toISOString(),
        alertname: exec.runbook_name || 'Unknown Alert',
        description: this.extractDescription(exec.runbook_name, exec.status),
        severity: exec.status === 'completed' || exec.status === 'success' ? 'info' : exec.status === 'partial' ? 'warning' : 'critical',
        category: this.extractCategory(exec.runbook_name),
        source_ip: exec.source_ip,
        username: exec.username,
        runbook_executed: exec.runbook_name,
        actions_taken: this.extractActions(exec.action_results || []),
        status: exec.status === 'completed' || exec.status === 'success' ? 'resolved' : 'active',
      })) as Incident[]
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

      const data: any = await response.json()

      // Backend returns { runbook_stats, execution_stats }
      // Frontend expects { total_incidents, incidents_by_severity, ... }
      // We need to fetch incidents list to calculate severity breakdown
      const incidents = await this.getIncidents()

      const severityCounts = incidents.reduce(
        (acc, incident) => {
          acc[incident.severity] = (acc[incident.severity] || 0) + 1
          return acc
        },
        { critical: 0, warning: 0, info: 0 } as Record<string, number>
      )

      const totalActions = incidents.reduce((sum, incident) => sum + (incident.actions_taken?.length || 0), 0)
      const actionsSuccess = incidents.reduce(
        (sum, incident) => sum + (incident.actions_taken?.filter((a) => a.status === 'success').length || 0),
        0
      )

      return {
        total_incidents: data.execution_stats?.total_executions || 0,
        runbooks_loaded: data.runbook_stats?.total_runbooks || 0,
        total_actions: totalActions,
        actions_success: actionsSuccess,
        actions_failure: totalActions - actionsSuccess,
        incidents_by_severity: {
          critical: severityCounts.critical || 0,
          warning: severityCounts.warning || 0,
          info: severityCounts.info || 0,
        },
      }
    } catch (error) {
      console.debug('Incident stats fetch failed:', error)
      return null
    }
  }

  /**
   * Extract human-readable description from runbook name and status
   */
  private extractDescription(runbookName: string, status: string): string {
    if (!runbookName) return 'Security incident detected'

    const category = this.extractCategory(runbookName)
    const action = status === 'completed' || status === 'success' ? 'mitigated' : status === 'partial' ? 'partially mitigated' : 'detected'

    const descriptions: Record<string, string> = {
      'brute-force': `Brute force attack ${action}`,
      'mfa-bypass': `MFA bypass attempt ${action}`,
      'idor': `IDOR exploitation ${action}`,
      'gateway-bypass': `Gateway bypass ${action}`,
      'rate-limit': `Rate limit violation ${action}`,
      'token-replay': `Token replay attack ${action}`,
      'credential-stuffing': `Credential stuffing ${action}`,
    }

    return descriptions[category] || `${runbookName} ${action}`
  }

  /**
   * Extract category from runbook name
   */
  private extractCategory(runbookName: string): string {
    if (!runbookName) return 'unknown'
    const lower = runbookName.toLowerCase()
    if (lower.includes('brute')) return 'brute-force'
    if (lower.includes('mfa')) return 'mfa-bypass'
    if (lower.includes('idor')) return 'idor'
    if (lower.includes('gateway')) return 'gateway-bypass'
    if (lower.includes('rate') || lower.includes('limiter')) return 'rate-limit'
    if (lower.includes('token')) return 'token-replay'
    if (lower.includes('credential')) return 'credential-stuffing'
    return 'other'
  }

  /**
   * Extract action descriptions from action results
   */
  private extractActions(actionResults: any[]): any[] {
    if (!actionResults || actionResults.length === 0) return []

    return actionResults.map((action, idx) => ({
      action_type: action.action_type || action.description || 'Unknown Action',
      status: action.success ? 'success' : 'failure',
      timestamp: action.timestamp || new Date().toISOString(),
      details: action.details || {},
    }))
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
