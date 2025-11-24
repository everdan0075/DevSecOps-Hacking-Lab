// ============================================================================
// Authentication Types
// ============================================================================

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  requires_mfa: boolean
  challenge_id?: string
}

export interface MfaVerifyRequest {
  challenge_id: string
  code: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface LogoutRequest {
  refresh_token: string
  all_sessions?: boolean
}

export interface AuthStats {
  total_login_attempts: number
  successful_logins: number
  failed_logins: number
  mfa_attempts: number
  active_sessions: number
  ip_bans: number
}

// ============================================================================
// User Types
// ============================================================================

export interface UserProfile {
  user_id: number
  username: string
  email: string
  role: string
  full_name: string
  phone: string
  address: string
  ssn: string // SENSITIVE - intentionally exposed for IDOR demo
  credit_card: string // SENSITIVE - intentionally exposed
  created_at: string
  last_login?: string
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'auto'
  notifications_enabled: boolean
  two_factor_enabled: boolean
  api_key: string
  language: string
}

// ============================================================================
// Incident Response Types
// ============================================================================

export interface Incident {
  id: string
  timestamp: string
  severity: 'critical' | 'warning' | 'info'
  category: string
  alertname: string
  description: string
  source_ip?: string
  username?: string
  runbook_executed?: string
  actions_taken: ActionResult[]
  status: 'active' | 'resolved' | 'investigating'
}

export interface ActionResult {
  action_type: string
  status: 'success' | 'failure'
  timestamp: string
  details: Record<string, unknown>
}

export interface IncidentStats {
  total_incidents: number
  active_incidents: number
  runbooks_loaded: number
  total_actions: number
  actions_success: number
  actions_failure: number
  incidents_by_severity: {
    critical: number
    warning: number
    info: number
  }
}

// ============================================================================
// Monitoring Types
// ============================================================================

export interface ServiceHealth {
  service: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  uptime: number
  last_check: string
  version?: string
}

export interface MetricData {
  metric: string
  value: number
  timestamp: number
  labels?: Record<string, string>
}

export interface PrometheusQueryResponse {
  status: 'success' | 'error'
  data: {
    resultType: 'matrix' | 'vector' | 'scalar' | 'string'
    result: Array<{
      metric: Record<string, string>
      value?: [number, string]
      values?: Array<[number, string]>
    }>
  }
}

// ============================================================================
// Enhanced Monitoring Types (Phase 3)
// ============================================================================

export interface PrometheusMetric {
  metric: Record<string, string>
  value: [number, string] // [timestamp, value]
}

export interface PrometheusRangeMetric {
  metric: Record<string, string>
  values: Array<[number, string]> // Array of [timestamp, value]
}

export interface SecurityMetrics {
  login_attempts_total: number
  login_failures_total: number
  mfa_attempts_total: number
  idor_attempts_total: number
  rate_limit_blocks_total: number
  ip_bans_active: number
}

export interface MetricTimeSeriesPoint {
  timestamp: number
  value: number
}

export interface IncidentListResponse {
  incidents: Incident[]
  total: number
}

export interface IncidentStatsResponse {
  total_incidents: number
  runbooks_loaded: number
  total_actions: number
  actions_success: number
  actions_failure: number
  incidents_by_severity: {
    critical: number
    warning: number
    info: number
  }
  most_common_category?: string
}

// ============================================================================
// Attack Simulation Types
// ============================================================================

export interface AttackScenario {
  id: string
  name: string
  category: 'auth' | 'gateway-bypass' | 'idor' | 'injection' | 'reconnaissance' | 'credential-theft' | 'source-code-theft' | 'configuration-theft' | 'database-attacks' | 'cms-attacks' | 'api-enumeration' | 'path-traversal'
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  owasp_category: string
  target_endpoint: string
  estimated_duration: string
  requires_auth: boolean
  detection_metrics: readonly string[]
}

export interface AttackExecutionRequest {
  scenario_id: string
  parameters?: Record<string, unknown>
}

export interface AttackExecutionResponse {
  execution_id: string
  status: 'running' | 'completed' | 'failed'
  started_at: string
  progress: number
  logs: AttackLog[]
  results?: AttackResult
}

export interface AttackLog {
  timestamp: string
  level: 'info' | 'success' | 'error' | 'warning'
  message: string
}

export interface AttackResult {
  success: boolean
  vulnerabilities_found: string[]
  data_extracted?: Record<string, unknown>
  requests_made: number
  blocked_requests: number
  detection_triggered: boolean
  incident_created: boolean
  summary: string
}

// ============================================================================
// Backend Connection Types
// ============================================================================

export interface BackendStatus {
  connected: boolean
  services: {
    gateway: boolean
    auth: boolean
    user_service: boolean
    incident_bot: boolean
    prometheus: boolean
    grafana: boolean
  }
  latency?: number
  last_check: number
}

// ============================================================================
// API Error Types
// ============================================================================

export interface ApiError {
  message: string
  status: number
  code?: string
  details?: Record<string, unknown>
}

// ============================================================================
// Common Response Wrappers
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  timestamp: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}
