/**
 * Environment Configuration
 *
 * Centralized configuration for backend service URLs
 * Uses Vite environment variables with fallback defaults
 */

export const config = {
  // Backend Services
  apiGatewayUrl: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080',
  authServiceUrl: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8000',
  userServiceUrl: import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8002',

  // Monitoring Stack
  prometheusUrl: import.meta.env.VITE_PROMETHEUS_URL || 'http://localhost:9090',
  grafanaUrl: import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3000',
  incidentBotUrl: import.meta.env.VITE_INCIDENT_BOT_URL || 'http://localhost:5002',
  alertmanagerUrl: import.meta.env.VITE_ALERTMANAGER_URL || 'http://localhost:9093',

  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const

// Type-safe config access
export type Config = typeof config
