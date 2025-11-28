/**
 * Battle Arena Type Definitions
 *
 * Types for Red Team vs Blue Team battle system
 */

// ============================================================================
// Attack Types
// ============================================================================

export type AttackType =
  | 'brute_force'
  | 'mfa_bypass'
  | 'idor'
  | 'gateway_bypass'
  | 'rate_limit_bypass'
  | 'sql_injection'
  | 'xss'
  | 'honeypot_probe'

export type AttackSeverity = 'low' | 'medium' | 'high' | 'critical'

export type AttackStatus = 'launching' | 'in_flight' | 'blocked' | 'success' | 'failed'

export interface Attack {
  id: string
  type: AttackType
  name: string
  severity: AttackSeverity
  status: AttackStatus
  progress: number // 0-100
  timestamp: number
  source: 'red_team'
  targetSystem: string // 'auth', 'user', 'gateway', 'honeypot'
}

// ============================================================================
// Defense Types
// ============================================================================

export type DefenseType =
  | 'waf'
  | 'rate_limit'
  | 'honeypot'
  | 'ip_ban'
  | 'token_revocation'
  | 'incident_response'
  | 'jwt_validation'

export type DefenseStatus = 'idle' | 'active' | 'blocking' | 'compromised'

export interface Defense {
  id: string
  type: DefenseType
  name: string
  status: DefenseStatus
  strength: number // 0-100
  timestamp: number
  blockedAttacks: number
  triggeredBy?: string // attack id
}

// ============================================================================
// Battle Events
// ============================================================================

export type BattleEventType =
  | 'attack_launched'
  | 'attack_blocked'
  | 'attack_success'
  | 'defense_activated'
  | 'honeypot_triggered'
  | 'ip_banned'
  | 'breach'
  | 'token_revoked'
  | 'phase_change'
  | 'critical_moment'

export interface BattleEvent {
  id: string
  type: BattleEventType
  timestamp: number
  team: 'red' | 'blue'
  message: string
  severity: 'info' | 'warning' | 'critical'
  points: number
  attackId?: string
  defenseId?: string
  metadata?: Record<string, any>
}

// ============================================================================
// Battle Phases
// ============================================================================

export type BattlePhase = 'reconnaissance' | 'exploitation' | 'containment' | 'complete'

export interface PhaseConfig {
  name: BattlePhase
  displayName: string
  duration: number // seconds
  description: string
  intensity: 'low' | 'medium' | 'high'
  enabledAttacks: AttackType[]
  enabledDefenses: DefenseType[]
}

// ============================================================================
// Team Scoring
// ============================================================================

export interface TeamScore {
  points: number
  attacksLaunched?: number
  attacksSuccessful?: number
  dataExfiltrated?: number // MB
  systemsCompromised?: number
  attacksBlocked?: number
  honeypotsTriggered?: number
  ipsBanned?: number
  incidentsResolved?: number
}

export interface BattleScore {
  red: TeamScore
  blue: TeamScore
  advantage: 'red' | 'blue' | 'neutral'
  advantagePoints: number // absolute difference
}

// ============================================================================
// Battle State
// ============================================================================

export interface BattleState {
  id: string
  scenario: BattleScenario
  phase: BattlePhase
  phaseStartTime: number
  phaseTimeRemaining: number
  totalDuration: number
  elapsedTime: number

  score: BattleScore

  activeAttacks: Attack[]
  attackHistory: Attack[] // All attacks (completed + active)
  activeDefenses: Defense[]
  events: BattleEvent[]

  isRunning: boolean
  isPaused: boolean
  winner?: 'red' | 'blue' | 'draw'

  metrics: BattleMetrics
}

// ============================================================================
// Battle Metrics
// ============================================================================

export interface BattleMetrics {
  // Red Team
  totalAttacks: number
  successfulAttacks: number
  blockedAttacks: number
  successRate: number // percentage
  avgResponseTime: number // ms

  // Blue Team
  totalBlocks: number
  totalHoneypotHits: number
  totalBans: number
  avgDetectionTime: number // ms

  // System
  dataLeaked: number // MB
  systemsCompromised: string[]
  systemsIntact: string[]
}

// ============================================================================
// Battle Scenarios
// ============================================================================

export type BattleScenarioType = 'full_assault' | 'stealth' | 'zero_day' | 'custom'

export interface BattleScenario {
  id: string
  type: BattleScenarioType
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  duration: number // total seconds
  phases: PhaseConfig[]

  // Scoring multipliers
  redPointsMultiplier: number
  bluePointsMultiplier: number

  // Auto-attack configuration
  autoAttackEnabled: boolean
  autoAttackInterval?: number // ms between attacks
  autoAttackTypes?: AttackType[]
}

// ============================================================================
// Visual Effects
// ============================================================================

export interface AttackArrowVisual {
  id: string
  attackId: string
  type: AttackType
  severity: AttackSeverity

  // Animation
  startX: number
  startY: number
  endX: number
  endY: number
  progress: number // 0-1
  speed: number // pixels per second

  // Rendering
  color: string
  glowIntensity: number
  particleTrail: boolean
}

export interface DefenseShieldVisual {
  id: string
  defenseId: string
  type: DefenseType

  // Animation
  x: number
  y: number
  scale: number // 0-1
  opacity: number // 0-1
  pulsePhase: number // 0-1 for pulsing animation

  // State
  isBlocking: boolean
  health: number // 0-100
  crackLevel: number // 0-3 (0=intact, 3=shattered)

  // Rendering
  color: string
  glowIntensity: number
}

export interface ParticleEffect {
  id: string
  type: 'explosion' | 'spark' | 'glow' | 'shockwave'
  x: number
  y: number
  lifetime: number // ms
  startTime: number
  color: string
  intensity: number
}

// ============================================================================
// Battle Engine Events
// ============================================================================

export interface BattleEngineEvents {
  onAttackLaunched: (attack: Attack) => void
  onAttackBlocked: (attack: Attack, defense: Defense) => void
  onAttackSuccess: (attack: Attack) => void
  onDefenseActivated: (defense: Defense) => void
  onHoneypotTriggered: (attack: Attack) => void
  onPhaseChange: (phase: BattlePhase) => void
  onBattleComplete: (winner: 'red' | 'blue' | 'draw', finalScore: BattleScore) => void
  onCriticalMoment: (event: BattleEvent) => void
  onScoreUpdate: (score: BattleScore) => void
}

// ============================================================================
// Point Values
// ============================================================================

export const POINT_VALUES = {
  // Red Team
  ATTACK_LAUNCHED: 5,
  ATTACK_SUCCESS: 50,
  IDOR_EXPLOIT: 50,
  GATEWAY_BYPASS: 30,
  BRUTE_FORCE_SUCCESS: 40,
  MFA_BYPASS: 60,
  DATA_EXFILTRATED: 20, // per MB
  SYSTEM_COMPROMISED: 100,

  // Blue Team
  ATTACK_BLOCKED: 30,
  HONEYPOT_TRIGGERED: 40,
  IP_BANNED: 30,
  TOKEN_REVOKED: 25,
  INCIDENT_RESOLVED: 50,
  ZERO_BREACHES_BONUS: 100,
  FAST_RESPONSE_BONUS: 20, // if response < 1s
} as const

// ============================================================================
// Predefined Scenarios
// ============================================================================

export const BATTLE_SCENARIOS: Record<BattleScenarioType, BattleScenario> = {
  full_assault: {
    id: 'full_assault',
    type: 'full_assault',
    name: 'Full Stack Assault',
    description: 'All attacks simultaneously - test all defenses at once',
    difficulty: 'hard',
    duration: 120, // 2 minutes
    phases: [
      {
        name: 'reconnaissance',
        displayName: 'Reconnaissance',
        duration: 30,
        description: 'Scanning and probing defenses',
        intensity: 'low',
        enabledAttacks: ['honeypot_probe', 'gateway_bypass'],
        enabledDefenses: ['honeypot', 'waf', 'rate_limit'],
      },
      {
        name: 'exploitation',
        displayName: 'Active Exploitation',
        duration: 60,
        description: 'Full attack execution',
        intensity: 'high',
        enabledAttacks: ['brute_force', 'idor', 'gateway_bypass', 'rate_limit_bypass', 'sql_injection'],
        enabledDefenses: ['waf', 'rate_limit', 'honeypot', 'ip_ban', 'incident_response'],
      },
      {
        name: 'containment',
        displayName: 'Containment',
        duration: 30,
        description: 'Defense response and remediation',
        intensity: 'medium',
        enabledAttacks: ['idor', 'gateway_bypass'],
        enabledDefenses: ['ip_ban', 'token_revocation', 'incident_response'],
      },
    ],
    redPointsMultiplier: 1.0,
    bluePointsMultiplier: 1.0,
    autoAttackEnabled: true,
    autoAttackInterval: 5000, // 5s between attacks
    autoAttackTypes: ['brute_force', 'idor', 'gateway_bypass', 'honeypot_probe'],
  },

  stealth: {
    id: 'stealth',
    type: 'stealth',
    name: 'Stealth vs Detection',
    description: 'Slow, calculated attacks vs advanced detection',
    difficulty: 'medium',
    duration: 90,
    phases: [
      {
        name: 'reconnaissance',
        displayName: 'Silent Scanning',
        duration: 40,
        description: 'Low-noise reconnaissance',
        intensity: 'low',
        enabledAttacks: ['honeypot_probe'],
        enabledDefenses: ['honeypot'],
      },
      {
        name: 'exploitation',
        displayName: 'Precision Attacks',
        duration: 40,
        description: 'Targeted exploitation',
        intensity: 'medium',
        enabledAttacks: ['idor', 'gateway_bypass'],
        enabledDefenses: ['honeypot', 'waf', 'rate_limit', 'incident_response'],
      },
      {
        name: 'containment',
        displayName: 'Evasion & Response',
        duration: 10,
        description: 'Final containment attempts',
        intensity: 'low',
        enabledAttacks: ['idor'],
        enabledDefenses: ['waf', 'rate_limit', 'ip_ban', 'incident_response'],
      },
    ],
    redPointsMultiplier: 1.0,
    bluePointsMultiplier: 1.8,
    autoAttackEnabled: true,
    autoAttackInterval: 12000, // 12s between attacks (slower)
    autoAttackTypes: ['honeypot_probe', 'idor'],
  },

  zero_day: {
    id: 'zero_day',
    type: 'zero_day',
    name: 'Zero-Day Exploit',
    description: 'Unknown vulnerability - can Blue Team adapt?',
    difficulty: 'expert',
    duration: 60,
    phases: [
      {
        name: 'reconnaissance',
        displayName: 'Discovery',
        duration: 15,
        description: 'Discovering unknown vulnerability',
        intensity: 'low',
        enabledAttacks: ['honeypot_probe'],
        enabledDefenses: ['honeypot', 'waf'],
      },
      {
        name: 'exploitation',
        displayName: 'Exploitation',
        duration: 30,
        description: 'Exploiting zero-day vulnerability',
        intensity: 'high',
        enabledAttacks: ['idor', 'gateway_bypass', 'sql_injection'],
        enabledDefenses: ['honeypot', 'waf', 'rate_limit', 'incident_response'],
      },
      {
        name: 'containment',
        displayName: 'Emergency Response',
        duration: 15,
        description: 'Emergency containment measures',
        intensity: 'high',
        enabledDefenses: ['ip_ban', 'waf', 'rate_limit', 'token_revocation', 'incident_response'],
        enabledAttacks: ['gateway_bypass', 'sql_injection'],
      },
    ],
    redPointsMultiplier: 1.3,
    bluePointsMultiplier: 1.0,
    autoAttackEnabled: true,
    autoAttackInterval: 8000,
    autoAttackTypes: ['idor', 'gateway_bypass', 'sql_injection'],
  },

  custom: {
    id: 'custom',
    type: 'custom',
    name: 'Custom Battle',
    description: 'Configure your own battle parameters',
    difficulty: 'medium',
    duration: 120,
    phases: [
      {
        name: 'exploitation',
        displayName: 'Custom Phase',
        duration: 120,
        description: 'Custom battle configuration',
        intensity: 'medium',
        enabledAttacks: ['brute_force', 'idor', 'gateway_bypass'],
        enabledDefenses: ['waf', 'rate_limit', 'honeypot', 'ip_ban'],
      },
    ],
    redPointsMultiplier: 1.0,
    bluePointsMultiplier: 1.0,
    autoAttackEnabled: false,
  },
}

// ============================================================================
// Attack Configuration
// ============================================================================

export interface AttackConfig {
  type: AttackType
  name: string
  displayName: string
  description: string
  severity: AttackSeverity
  basePoints: number
  duration: number // ms
  targetSystem: string
  color: string
  icon: string
}

export const ATTACK_CONFIGS: Record<AttackType, AttackConfig> = {
  brute_force: {
    type: 'brute_force',
    name: 'brute_force',
    displayName: 'Brute Force',
    description: 'Password guessing attack',
    severity: 'high',
    basePoints: 40,
    duration: 3000,
    targetSystem: 'auth',
    color: '#ef4444',
    icon: '🔓',
  },
  mfa_bypass: {
    type: 'mfa_bypass',
    name: 'mfa_bypass',
    displayName: 'MFA Bypass',
    description: 'Multi-factor authentication bypass',
    severity: 'critical',
    basePoints: 60,
    duration: 4000,
    targetSystem: 'auth',
    color: '#dc2626',
    icon: '🔐',
  },
  idor: {
    type: 'idor',
    name: 'idor',
    displayName: 'IDOR Exploit',
    description: 'Insecure Direct Object Reference',
    severity: 'high',
    basePoints: 50,
    duration: 2500,
    targetSystem: 'user',
    color: '#f97316',
    icon: '🎯',
  },
  gateway_bypass: {
    type: 'gateway_bypass',
    name: 'gateway_bypass',
    displayName: 'Gateway Bypass',
    description: 'Direct backend access',
    severity: 'medium',
    basePoints: 30,
    duration: 3000,
    targetSystem: 'gateway',
    color: '#f59e0b',
    icon: '🚪',
  },
  rate_limit_bypass: {
    type: 'rate_limit_bypass',
    name: 'rate_limit_bypass',
    displayName: 'Rate Limit Bypass',
    description: 'Evade rate limiting',
    severity: 'medium',
    basePoints: 25,
    duration: 2000,
    targetSystem: 'gateway',
    color: '#eab308',
    icon: '⚡',
  },
  sql_injection: {
    type: 'sql_injection',
    name: 'sql_injection',
    displayName: 'SQL Injection',
    description: 'Database injection attack',
    severity: 'critical',
    basePoints: 70,
    duration: 3500,
    targetSystem: 'database',
    color: '#dc2626',
    icon: '💉',
  },
  xss: {
    type: 'xss',
    name: 'xss',
    displayName: 'XSS Attack',
    description: 'Cross-site scripting',
    severity: 'medium',
    basePoints: 35,
    duration: 2500,
    targetSystem: 'frontend',
    color: '#f59e0b',
    icon: '📜',
  },
  honeypot_probe: {
    type: 'honeypot_probe',
    name: 'honeypot_probe',
    displayName: 'Honeypot Probe',
    description: 'Scanning for hidden endpoints',
    severity: 'low',
    basePoints: 10,
    duration: 1500,
    targetSystem: 'honeypot',
    color: '#3b82f6',
    icon: '🔍',
  },
}

// ============================================================================
// Defense Configuration
// ============================================================================

export interface DefenseConfig {
  type: DefenseType
  name: string
  displayName: string
  description: string
  basePoints: number
  color: string
  icon: string
  blocksAttacks: AttackType[]
}

export const DEFENSE_CONFIGS: Record<DefenseType, DefenseConfig> = {
  waf: {
    type: 'waf',
    name: 'waf',
    displayName: 'Web Application Firewall',
    description: 'Blocks SQL injection and XSS',
    basePoints: 30,
    color: '#3b82f6',
    icon: '🛡️',
    blocksAttacks: ['sql_injection', 'xss'],
  },
  rate_limit: {
    type: 'rate_limit',
    name: 'rate_limit',
    displayName: 'Rate Limiting',
    description: 'Throttles excessive requests',
    basePoints: 25,
    color: '#06b6d4',
    icon: '⏱️',
    blocksAttacks: ['brute_force', 'rate_limit_bypass'],
  },
  honeypot: {
    type: 'honeypot',
    name: 'honeypot',
    displayName: 'Honeypot',
    description: 'Detects reconnaissance',
    basePoints: 40,
    color: '#f59e0b',
    icon: '🍯',
    blocksAttacks: ['honeypot_probe'],
  },
  ip_ban: {
    type: 'ip_ban',
    name: 'ip_ban',
    displayName: 'IP Ban',
    description: 'Blocks malicious IPs',
    basePoints: 30,
    color: '#ef4444',
    icon: '🚫',
    blocksAttacks: ['brute_force', 'idor', 'gateway_bypass'],
  },
  token_revocation: {
    type: 'token_revocation',
    name: 'token_revocation',
    displayName: 'Token Revocation',
    description: 'Revokes compromised tokens',
    basePoints: 25,
    color: '#8b5cf6',
    icon: '🔑',
    blocksAttacks: ['idor', 'gateway_bypass'],
  },
  incident_response: {
    type: 'incident_response',
    name: 'incident_response',
    displayName: 'Incident Response',
    description: 'Automated response system',
    basePoints: 50,
    color: '#10b981',
    icon: '🤖',
    blocksAttacks: ['brute_force', 'mfa_bypass', 'idor', 'sql_injection'],
  },
  jwt_validation: {
    type: 'jwt_validation',
    name: 'jwt_validation',
    displayName: 'JWT Validation',
    description: 'Validates authentication tokens',
    basePoints: 20,
    color: '#06b6d4',
    icon: '✅',
    blocksAttacks: ['idor', 'gateway_bypass'],
  },
}
