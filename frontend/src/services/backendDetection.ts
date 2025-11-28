/**
 * Backend Detection Service
 *
 * This service implements the "hybrid mode" logic:
 * - Detects if backend services are running locally
 * - Provides real-time connection status
 * - Falls back to "disconnected" mode on GitHub Pages
 *
 * Key Principle: We NEVER mock attack execution or metrics.
 * Mock mode only affects UI state, not functionality.
 */

import { ENDPOINTS, TIMEOUTS } from '@/utils/constants'
import type { BackendStatus } from '@/types/api'

class BackendDetectionService {
  private status: BackendStatus = {
    connected: false,
    services: {
      gateway: false,
      auth: false,
      user_service: false,
      incident_bot: false,
      prometheus: false,
      grafana: false,
    },
    last_check: Date.now(),
  }

  private checkInterval: number | null = null
  private subscribers: Array<(status: BackendStatus) => void> = []

  /**
   * Check if a specific service is reachable
   */
  private async checkService(url: string, timeout: number = TIMEOUTS.BACKEND_HEALTH_CHECK): Promise<boolean> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-cache',
      })
      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      clearTimeout(timeoutId)
      console.debug(`Service check failed for ${url}:`, error)
      return false
    }
  }

  /**
   * Perform comprehensive backend health check
   */
  async checkBackendStatus(): Promise<BackendStatus> {
    const startTime = Date.now()

    // Check all services in parallel
    // In dev mode: use Vite proxy paths
    // In prod: use direct localhost URLs (will fail on GitHub Pages - expected)
    const isDev = import.meta.env.DEV

    const [gateway, auth, userService, incidentBot, prometheus, grafana] = await Promise.all([
      this.checkService(ENDPOINTS.GATEWAY.HEALTH),
      this.checkService(isDev ? '/direct/auth-service/health' : 'http://localhost:8000/health'),
      this.checkService(isDev ? '/direct/user-service/health' : 'http://localhost:8002/health'),
      this.checkService(isDev ? '/incidents/health' : 'http://localhost:5002/health'),
      this.checkService(`${ENDPOINTS.PROMETHEUS.QUERY.replace('/api/v1/query', '')}/api/v1/status/buildinfo`),
      this.checkService(`${ENDPOINTS.GRAFANA.BASE}/api/health`),
    ])

    const latency = Date.now() - startTime

    this.status = {
      connected: gateway || auth || userService, // At least one core service must be up
      services: {
        gateway,
        auth,
        user_service: userService,
        incident_bot: incidentBot,
        prometheus,
        grafana,
      },
      latency,
      last_check: Date.now(),
    }

    // Notify all subscribers
    this.notifySubscribers()

    return this.status
  }

  /**
   * Get current backend status (cached)
   */
  getStatus(): BackendStatus {
    return this.status
  }

  /**
   * Check if backend is connected
   */
  isConnected(): boolean {
    return this.status.connected
  }

  /**
   * Start automatic backend monitoring
   */
  startMonitoring(interval: number = 10000): void {
    if (this.checkInterval !== null) {
      console.warn('Backend monitoring already started')
      return
    }

    // Initial check
    this.checkBackendStatus()

    // Periodic checks
    this.checkInterval = window.setInterval(() => {
      this.checkBackendStatus()
    }, interval)

    console.log('Backend monitoring started')
  }

  /**
   * Stop automatic backend monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log('Backend monitoring stopped')
    }
  }

  /**
   * Subscribe to backend status changes
   */
  subscribe(callback: (status: BackendStatus) => void): () => void {
    this.subscribers.push(callback)

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback)
    }
  }

  /**
   * Notify all subscribers of status change
   */
  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(this.status)
      } catch (error) {
        console.error('Error in backend status subscriber:', error)
      }
    })
  }

  /**
   * Get user-friendly error message for disconnected state
   */
  getDisconnectedMessage(): string {
    if (!this.status.connected) {
      return 'Backend services not detected. To execute real attacks and view live metrics, run the Docker stack locally:\n\n' +
        'docker-compose up -d\n\n' +
        'See QUICKSTART.md for setup instructions.'
    }

    // Partial connection
    const disconnectedServices = Object.entries(this.status.services)
      .filter(([, isUp]) => !isUp)
      .map(([name]) => name)

    if (disconnectedServices.length > 0) {
      return `Some services are unavailable: ${disconnectedServices.join(', ')}.\n\n` +
        'Check service health:\ndocker-compose ps\ndocker-compose logs <service-name>'
    }

    return ''
  }

  /**
   * Check if a specific feature is available
   */
  isFeatureAvailable(feature: 'attacks' | 'metrics' | 'incidents' | 'grafana'): boolean {
    switch (feature) {
      case 'attacks':
        return this.status.services.gateway && this.status.services.auth
      case 'metrics':
        return this.status.services.prometheus
      case 'incidents':
        return this.status.services.incident_bot
      case 'grafana':
        return this.status.services.grafana
      default:
        return false
    }
  }
}

// Singleton instance
export const backendDetection = new BackendDetectionService()

// Auto-start monitoring when module loads (only in browser)
if (typeof window !== 'undefined') {
  backendDetection.startMonitoring()
}
