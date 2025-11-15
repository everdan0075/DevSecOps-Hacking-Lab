/**
 * Metrics Service
 *
 * Service for querying Prometheus API to retrieve security metrics
 */

import { ENDPOINTS, TIMEOUTS } from '@/utils/constants'
import type {
  PrometheusQueryResponse,
  SecurityMetrics,
  MetricTimeSeriesPoint,
} from '@/types/api'

class MetricsService {
  /**
   * Execute instant Prometheus query
   */
  async queryInstant(query: string): Promise<PrometheusQueryResponse | null> {
    try {
      const url = `${ENDPOINTS.PROMETHEUS.QUERY}?query=${encodeURIComponent(query)}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST)

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`Prometheus query failed: ${response.status}`)
        return null
      }

      return await response.json()
    } catch (error) {
      console.debug('Prometheus instant query failed:', error)
      return null
    }
  }

  /**
   * Execute range Prometheus query (for charts)
   */
  async queryRange(
    query: string,
    start: number,
    end: number,
    step: string = '15s'
  ): Promise<PrometheusQueryResponse | null> {
    try {
      const params = new URLSearchParams({
        query,
        start: start.toString(),
        end: end.toString(),
        step,
      })

      const url = `${ENDPOINTS.PROMETHEUS.QUERY_RANGE}?${params.toString()}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.API_REQUEST)

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`Prometheus range query failed: ${response.status}`)
        return null
      }

      return await response.json()
    } catch (error) {
      console.debug('Prometheus range query failed:', error)
      return null
    }
  }

  /**
   * Extract scalar value from Prometheus response
   */
  private extractScalarValue(response: PrometheusQueryResponse | null): number {
    if (!response || response.status !== 'success') return 0
    if (response.data.result.length === 0) return 0

    const value = response.data.result[0].value
    if (!value) return 0

    return parseFloat(value[1]) || 0
  }

  /**
   * Extract time series data from Prometheus range response
   */
  private extractTimeSeries(response: PrometheusQueryResponse | null): MetricTimeSeriesPoint[] {
    if (!response || response.status !== 'success') return []
    if (response.data.result.length === 0) return []

    const values = response.data.result[0].values
    if (!values) return []

    return values.map(([timestamp, value]) => ({
      timestamp: timestamp * 1000, // Convert to milliseconds
      value: parseFloat(value) || 0,
    }))
  }

  /**
   * Fetch all key security metrics
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    // Query all metrics in parallel
    const [
      loginAttempts,
      loginFailures,
      mfaAttempts,
      idorAttempts,
      rateLimitBlocks,
      ipBans,
    ] = await Promise.all([
      this.queryInstant('login_attempts_total'),
      this.queryInstant('login_failures_total'),
      this.queryInstant('mfa_attempts_total'),
      this.queryInstant('user_service_idor_attempts_total'),
      this.queryInstant('gateway_rate_limit_blocks_total'),
      this.queryInstant('login_ip_bans_active'),
    ])

    return {
      login_attempts_total: this.extractScalarValue(loginAttempts),
      login_failures_total: this.extractScalarValue(loginFailures),
      mfa_attempts_total: this.extractScalarValue(mfaAttempts),
      idor_attempts_total: this.extractScalarValue(idorAttempts),
      rate_limit_blocks_total: this.extractScalarValue(rateLimitBlocks),
      ip_bans_active: this.extractScalarValue(ipBans),
    }
  }

  /**
   * Fetch metric time series for charting (last 1 hour by default)
   */
  async getMetricTimeSeries(
    metricName: string,
    durationMinutes: number = 60
  ): Promise<MetricTimeSeriesPoint[]> {
    const now = Math.floor(Date.now() / 1000)
    const start = now - durationMinutes * 60
    const step = Math.max(15, Math.floor(durationMinutes * 60 / 100)).toString() + 's'

    const response = await this.queryRange(metricName, start, now, step)
    return this.extractTimeSeries(response)
  }

  /**
   * Check if Prometheus is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.queryInstant('up')
      return response !== null && response.status === 'success'
    } catch {
      return false
    }
  }
}

// Singleton instance
export const metricsService = new MetricsService()
