/**
 * API Configuration
 *
 * In production (GitHub Pages): APIs are not accessible, UI shows connection error
 * In local development: Vite proxy forwards requests to localhost:8080
 */

// Determine if we're in production or development
export const IS_PRODUCTION = import.meta.env.PROD
export const IS_DEVELOPMENT = import.meta.env.DEV

// Base URL configuration
// In dev: use proxy (empty string = same origin)
// In prod: would need CORS-enabled backend or show disconnected state
export const API_BASE_URL = IS_DEVELOPMENT ? '' : 'http://localhost:8080'

// Service endpoints
export const ENDPOINTS = {
  // Authentication Service (via Gateway)
  AUTH: {
    LOGIN: '/auth/login',
    MFA_VERIFY: '/auth/mfa/verify',
    REFRESH: '/auth/token/refresh',
    LOGOUT: '/auth/logout',
    STATS: '/auth/stats',
    UNBAN_ME: '/demo/unban-me',
  },

  // User Service (via Gateway)
  USER: {
    PROFILE: (userId: number) => `/api/users/profile/${userId}`,
    SETTINGS: '/api/users/settings',
  },

  // Gateway
  GATEWAY: {
    HEALTH: '/health',
    PROTECTED: '/protected',
    METRICS: '/metrics',
  },

  // Incident Bot (via Vite proxy in dev)
  INCIDENTS: {
    LIST: IS_DEVELOPMENT ? '/incidents' : 'http://localhost:5002/incidents',
    STATS: IS_DEVELOPMENT ? '/incidents/stats' : 'http://localhost:5002/stats',
    HEALTH: IS_DEVELOPMENT ? '/incidents/health' : 'http://localhost:5002/health',
  },

  // Incident Bot API endpoints (direct access)
  INCIDENT_BOT: {
    HEALTH: IS_DEVELOPMENT ? '/api/incidents/health' : 'http://localhost:5002/health',
    REPORTS: IS_DEVELOPMENT ? '/api/incidents/reports' : 'http://localhost:5002/api/incidents/reports',
    BANS: IS_DEVELOPMENT ? '/api/incidents/bans' : 'http://localhost:5002/api/bans/active',
    RUNBOOKS: IS_DEVELOPMENT ? '/api/incidents/runbooks' : 'http://localhost:5002/api/runbooks',
    GATEWAY_HEALTH: IS_DEVELOPMENT ? '/api/incidents/gateway-health' : 'http://localhost:5002/api/gateway/health',
    JWT_STATS: IS_DEVELOPMENT ? '/api/incidents/jwt-stats' : 'http://localhost:5002/api/jwt/validation-stats',
    IDS_ALERTS: IS_DEVELOPMENT ? '/api/incidents/ids-alerts' : 'http://localhost:5002/api/ids/alerts',
    IDS_STATS: IS_DEVELOPMENT ? '/api/incidents/ids-stats' : 'http://localhost:5002/api/ids/statistics',
    CORRELATION_STATS: IS_DEVELOPMENT ? '/api/incidents/correlation-stats' : 'http://localhost:5002/api/correlation/statistics',
    DEFENSE_METRICS: IS_DEVELOPMENT ? '/api/incidents/defense-metrics' : 'http://localhost:5002/api/defense/metrics',
  },

  // Prometheus (via Vite proxy in dev)
  PROMETHEUS: {
    QUERY: IS_DEVELOPMENT ? '/prometheus/api/v1/query' : 'http://localhost:9090/api/v1/query',
    QUERY_RANGE: IS_DEVELOPMENT ? '/prometheus/api/v1/query_range' : 'http://localhost:9090/api/v1/query_range',
    TARGETS: IS_DEVELOPMENT ? '/prometheus/api/v1/targets' : 'http://localhost:9090/api/v1/targets',
  },

  // Grafana (embedded, via Vite proxy in dev)
  GRAFANA: {
    BASE: IS_DEVELOPMENT ? '/grafana' : 'http://localhost:3000',
    DASHBOARDS: {
      AUTH_SECURITY: IS_DEVELOPMENT ? '/grafana/d/auth-security' : 'http://localhost:3000/d/auth-security',
      ATTACK_VISIBILITY: IS_DEVELOPMENT ? '/grafana/d/devsecops-attack-visibility' : 'http://localhost:3000/d/devsecops-attack-visibility',
      SERVICE_MESH: IS_DEVELOPMENT ? '/grafana/d/service-mesh-security' : 'http://localhost:3000/d/service-mesh-security',
      INCIDENT_RESPONSE: IS_DEVELOPMENT ? '/grafana/d/incident-response' : 'http://localhost:3000/d/incident-response',
    },
  },

  // Direct Service Access (bypassing gateway) - for attack demos
  DIRECT_ACCESS: {
    AUTH: {
      LOGIN: IS_DEVELOPMENT ? '/direct/auth-service/auth/login' : 'http://localhost:8000/auth/login',
      MFA_VERIFY: IS_DEVELOPMENT ? '/direct/auth-service/auth/mfa/verify' : 'http://localhost:8000/auth/mfa/verify',
      REFRESH: IS_DEVELOPMENT ? '/direct/auth-service/auth/token/refresh' : 'http://localhost:8000/auth/token/refresh',
      HEALTH: IS_DEVELOPMENT ? '/direct/auth-service/health' : 'http://localhost:8000/health',
    },
    USER: {
      PROFILE: (userId: number) => IS_DEVELOPMENT ? `/direct/user-service/profile/${userId}` : `http://localhost:8002/profile/${userId}`,
      SETTINGS: IS_DEVELOPMENT ? '/direct/user-service/settings' : 'http://localhost:8002/settings',
      HEALTH: IS_DEVELOPMENT ? '/direct/user-service/health' : 'http://localhost:8002/health',
    },
  },
} as const

// Attack scenarios metadata
export const ATTACK_SCENARIOS = [
  {
    id: 'brute-force',
    name: 'Brute Force Attack',
    category: 'auth',
    difficulty: 'easy',
    description: 'Automated password guessing against login endpoint',
    owasp_category: 'A07:2021 - Identification and Authentication Failures',
    target_endpoint: 'POST /auth/login',
    estimated_duration: '2-5 minutes',
    requires_auth: false,
    detection_metrics: ['login_attempts_total', 'login_failures_total', 'ip_bans_total'],
  },
  {
    id: 'mfa-bruteforce',
    name: 'MFA Bypass (Bruteforce)',
    category: 'auth',
    difficulty: 'medium',
    description: 'TOTP code enumeration (000000-999999)',
    owasp_category: 'A07:2021 - Identification and Authentication Failures',
    target_endpoint: 'POST /auth/mfa/verify',
    estimated_duration: '1-3 minutes',
    requires_auth: false,
    detection_metrics: ['mfa_attempts_total', 'mfa_failures_total'],
  },
  {
    id: 'token-replay',
    name: 'Token Replay Attack',
    category: 'auth',
    difficulty: 'easy',
    description: 'Reuse revoked refresh tokens',
    owasp_category: 'A07:2021 - Identification and Authentication Failures',
    target_endpoint: 'POST /auth/token/refresh',
    estimated_duration: '< 1 minute',
    requires_auth: true,
    detection_metrics: ['refresh_token_attempts_total'],
  },
  {
    id: 'credential-stuffing',
    name: 'Credential Stuffing',
    category: 'auth',
    difficulty: 'medium',
    description: 'Test leaked username/password pairs from breach databases',
    owasp_category: 'A07:2021 - Identification and Authentication Failures',
    target_endpoint: 'POST /auth/login',
    estimated_duration: '3-10 minutes',
    requires_auth: false,
    detection_metrics: ['login_attempts_total', 'rate_limit_blocks_total'],
  },
  {
    id: 'idor-exploit',
    name: 'IDOR Exploitation',
    category: 'idor',
    difficulty: 'easy',
    description: 'Access other users\' profiles without authorization',
    owasp_category: 'A01:2021 - Broken Access Control',
    target_endpoint: 'GET /api/users/profile/{user_id}',
    estimated_duration: '< 1 minute',
    requires_auth: true,
    detection_metrics: ['user_service_idor_attempts_total'],
  },
  {
    id: 'direct-access',
    name: 'Gateway Bypass (Direct Access)',
    category: 'gateway-bypass',
    difficulty: 'easy',
    description: 'Bypass API Gateway security by accessing services directly',
    owasp_category: 'A01:2021 - Broken Access Control',
    target_endpoint: 'http://localhost:8002 (User Service)',
    estimated_duration: '< 1 minute',
    requires_auth: false,
    detection_metrics: ['user_service_direct_access_total'],
  },
  {
    id: 'rate-limit-bypass',
    name: 'Rate Limit Bypass',
    category: 'gateway-bypass',
    difficulty: 'medium',
    description: 'Evade gateway rate limiting via direct service access',
    owasp_category: 'A04:2021 - Insecure Design',
    target_endpoint: 'Backend services on public ports',
    estimated_duration: '1-2 minutes',
    requires_auth: false,
    detection_metrics: ['gateway_rate_limit_blocks_total', 'user_service_direct_access_total'],
  },
  // Honeypot Attack Scenarios (Reconnaissance)
  {
    id: 'honeypot-admin',
    name: 'Admin Panel Reconnaissance',
    category: 'reconnaissance',
    difficulty: 'easy',
    description: 'Scan for admin interfaces (/admin, /admin/login, /administrator)',
    owasp_category: 'A05:2021 - Security Misconfiguration',
    target_endpoint: 'GET /admin/*',
    estimated_duration: '< 1 minute',
    requires_auth: false,
    detection_metrics: ['gateway_honeypot_hits_total{path="/admin"}'],
  },
  {
    id: 'honeypot-secrets',
    name: 'Secrets Enumeration',
    category: 'credential-theft',
    difficulty: 'easy',
    description: 'Search for exposed secret files (.env, backup.zip, backup.sql)',
    owasp_category: 'A01:2021 - Broken Access Control',
    target_endpoint: 'GET /.env, /backup.*',
    estimated_duration: '< 1 minute',
    requires_auth: false,
    detection_metrics: ['gateway_honeypot_hits_total{path="/.env"}'],
  },
  {
    id: 'honeypot-git',
    name: 'Git Exposure Scan',
    category: 'source-code-theft',
    difficulty: 'easy',
    description: 'Check for exposed git repositories (.git/config, .git/HEAD)',
    owasp_category: 'A05:2021 - Security Misconfiguration',
    target_endpoint: 'GET /.git/*',
    estimated_duration: '< 1 minute',
    requires_auth: false,
    detection_metrics: ['gateway_honeypot_hits_total{path="/.git/config"}'],
  },
  {
    id: 'honeypot-config',
    name: 'Config File Scanner',
    category: 'configuration-theft',
    difficulty: 'easy',
    description: 'Search for config files (config.json, config.yml, settings.json)',
    owasp_category: 'A05:2021 - Security Misconfiguration',
    target_endpoint: 'GET /config.*, /settings.*',
    estimated_duration: '< 1 minute',
    requires_auth: false,
    detection_metrics: ['gateway_honeypot_hits_total{path="/config.json"}'],
  },
  {
    id: 'honeypot-dbadmin',
    name: 'Database Admin Brute Force',
    category: 'database-attacks',
    difficulty: 'medium',
    description: 'Attempt to access database admin tools (/phpmyadmin, /pma, /adminer)',
    owasp_category: 'A07:2021 - Identification and Authentication Failures',
    target_endpoint: 'GET /phpmyadmin, /pma',
    estimated_duration: '< 1 minute',
    requires_auth: false,
    detection_metrics: ['gateway_honeypot_hits_total{path="/phpmyadmin"}'],
  },
  {
    id: 'honeypot-wordpress',
    name: 'WordPress Attack',
    category: 'cms-attacks',
    difficulty: 'medium',
    description: 'Target WordPress admin and login pages (/wp-admin/, /wp-login.php)',
    owasp_category: 'A05:2021 - Security Misconfiguration',
    target_endpoint: 'GET /wp-admin/, /wp-login.php',
    estimated_duration: '< 1 minute',
    requires_auth: false,
    detection_metrics: ['gateway_honeypot_hits_total{path="/wp-admin"}'],
  },
  {
    id: 'honeypot-apidocs',
    name: 'API Documentation Scan',
    category: 'api-enumeration',
    difficulty: 'easy',
    description: 'Search for API docs (/api/v1/docs, /swagger.json, /openapi.json)',
    owasp_category: 'A05:2021 - Security Misconfiguration',
    target_endpoint: 'GET /swagger.json, /api/docs',
    estimated_duration: '< 1 minute',
    requires_auth: false,
    detection_metrics: ['gateway_honeypot_hits_total{path="/swagger.json"}'],
  },
  {
    id: 'honeypot-dirtraversal',
    name: 'Directory Traversal',
    category: 'path-traversal',
    difficulty: 'medium',
    description: 'Scan sensitive directories (/private/, /internal/, /admin-backup/)',
    owasp_category: 'A01:2021 - Broken Access Control',
    target_endpoint: 'GET /private/, /internal/',
    estimated_duration: '< 1 minute',
    requires_auth: false,
    detection_metrics: ['gateway_honeypot_hits_total'],
  },
] as const

// Demo users (from backend)
export const DEMO_USERS = [
  {
    user_id: 1,
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    mfa_secret: 'DEVSECOPSTWENTYFOURHACKINGLAB',
  },
  {
    user_id: 2,
    username: 'user1',
    password: 'password123',
    role: 'user',
    mfa_secret: 'DEVSECOPSTWENTYFOURHACKINGLAB',
  },
] as const

// Timeout configurations
export const TIMEOUTS = {
  API_REQUEST: 10000, // 10 seconds
  BACKEND_HEALTH_CHECK: 5000, // 5 seconds
  ATTACK_EXECUTION: 300000, // 5 minutes
} as const

// Local storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'devsecops_access_token',
  REFRESH_TOKEN: 'devsecops_refresh_token',
  TOKEN_EXPIRY: 'devsecops_token_expiry',
  USER_PROFILE: 'devsecops_user_profile',
  THEME: 'devsecops_theme',
} as const

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

// Refresh intervals (milliseconds)
export const REFRESH_INTERVALS = {
  BACKEND_STATUS: 10000, // 10 seconds
  INCIDENT_LIST: 5000, // 5 seconds
  METRICS: 15000, // 15 seconds
  ATTACK_PROGRESS: 1000, // 1 second
} as const
