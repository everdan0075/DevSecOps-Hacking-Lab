/**
 * Battle Engine Service
 *
 * Orchestrates Red Team vs Blue Team battles:
 * - Executes attacks via attackService
 * - Fetches defense data from backend
 * - Manages scoring, phases, and events
 * - Emits real-time battle updates
 */

import { attackService } from './attackService'
import { incidentService } from './incidentService'
import type {
  BattleState,
  BattleScenario,
  BattlePhase,
  Attack,
  Defense,
  BattleEvent,
  BattleScore,
  AttackType,
  DefenseType,
  BattleEngineEvents,
  TeamScore,
  BattleMetrics,
} from '@/types/battle'
import {
  POINT_VALUES,
  ATTACK_CONFIGS,
  DEFENSE_CONFIGS,
  BATTLE_SCENARIOS,
} from '@/types/battle'

type EventHandler = <K extends keyof BattleEngineEvents>(
  event: K,
  ...args: Parameters<BattleEngineEvents[K]>
) => void

class BattleEngine {
  private state: BattleState | null = null
  private phaseTimer: NodeJS.Timeout | null = null
  private autoAttackTimer: NodeJS.Timeout | null = null
  private updateTimer: NodeJS.Timeout | null = null

  private eventListeners: Partial<BattleEngineEvents> = {}

  // ============================================================================
  // Initialization & Control
  // ============================================================================

  /**
   * Start a new battle with given scenario
   */
  async startBattle(scenario: BattleScenario): Promise<BattleState> {
    // Stop any existing battle
    this.stopBattle()

    const now = Date.now()
    const firstPhase = scenario.phases[0]

    this.state = {
      id: `battle_${now}`,
      scenario,
      phase: firstPhase.name,
      phaseStartTime: now,
      phaseTimeRemaining: firstPhase.duration,
      totalDuration: scenario.duration,
      elapsedTime: 0,

      score: {
        red: { points: 0, attacksLaunched: 0, attacksSuccessful: 0, dataExfiltrated: 0, systemsCompromised: 0 },
        blue: { points: 0, attacksBlocked: 0, honeypotsTriggered: 0, ipsBanned: 0, incidentsResolved: 0 },
        advantage: 'neutral',
        advantagePoints: 0,
      },

      activeAttacks: [],
      attackHistory: [],
      activeDefenses: [],
      events: [],

      isRunning: true,
      isPaused: false,

      metrics: {
        totalAttacks: 0,
        successfulAttacks: 0,
        blockedAttacks: 0,
        successRate: 0,
        avgResponseTime: 0,
        totalBlocks: 0,
        totalHoneypotHits: 0,
        totalBans: 0,
        avgDetectionTime: 0,
        dataLeaked: 0,
        systemsCompromised: [],
        systemsIntact: ['auth', 'user', 'gateway', 'database'],
      },
    }

    // Start phase timer
    this.startPhaseTimer()

    // Start auto-attack if enabled
    if (scenario.autoAttackEnabled) {
      this.startAutoAttacks()
    }

    // Start periodic updates (fetch defense data)
    this.startPeriodicUpdates()

    // Emit initial event
    this.emit('onPhaseChange', firstPhase.name)
    this.addEvent({
      id: `event_${Date.now()}`,
      type: 'phase_change',
      timestamp: now,
      team: 'red',
      message: `Battle started: ${scenario.name}`,
      severity: 'info',
      points: 0,
    })

    // Initialize defenses
    await this.initializeDefenses()

    return this.state
  }

  /**
   * Stop current battle
   */
  stopBattle(): void {
    if (this.phaseTimer) {
      clearInterval(this.phaseTimer)
      this.phaseTimer = null
    }
    if (this.autoAttackTimer) {
      clearInterval(this.autoAttackTimer)
      this.autoAttackTimer = null
    }
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
    }

    if (this.state && this.state.isRunning) {
      this.state.isRunning = false
      this.state.phase = 'complete'

      // Determine winner
      const { red, blue } = this.state.score
      let winner: 'red' | 'blue' | 'draw'
      if (red.points > blue.points) winner = 'red'
      else if (blue.points > red.points) winner = 'blue'
      else winner = 'draw'

      this.state.winner = winner

      this.emit('onBattleComplete', winner, this.state.score)
    }
  }

  /**
   * Pause/resume battle
   */
  togglePause(): void {
    if (!this.state) return

    this.state.isPaused = !this.state.isPaused

    if (this.state.isPaused) {
      // Pause timers
      if (this.phaseTimer) clearInterval(this.phaseTimer)
      if (this.autoAttackTimer) clearInterval(this.autoAttackTimer)
      if (this.updateTimer) clearInterval(this.updateTimer)
    } else {
      // Resume timers
      this.startPhaseTimer()
      if (this.state.scenario.autoAttackEnabled) {
        this.startAutoAttacks()
      }
      this.startPeriodicUpdates()
    }
  }

  /**
   * Get current battle state
   */
  getState(): BattleState | null {
    return this.state
  }

  // ============================================================================
  // Phase Management
  // ============================================================================

  private startPhaseTimer(): void {
    if (!this.state) return

    this.phaseTimer = setInterval(() => {
      if (!this.state || this.state.isPaused) return

      const now = Date.now()
      const elapsed = Math.floor((now - this.state.phaseStartTime) / 1000)
      this.state.elapsedTime = Math.floor((now - this.state.phaseStartTime + this.getPreviousPhasesDuration()) / 1000)

      const currentPhaseConfig = this.getCurrentPhaseConfig()
      if (!currentPhaseConfig) return

      this.state.phaseTimeRemaining = Math.max(0, currentPhaseConfig.duration - elapsed)

      // Phase transition
      if (this.state.phaseTimeRemaining === 0) {
        this.transitionToNextPhase()
      }
    }, 1000)
  }

  private transitionToNextPhase(): void {
    if (!this.state) return

    const currentIndex = this.state.scenario.phases.findIndex((p) => p.name === this.state!.phase)
    const nextPhase = this.state.scenario.phases[currentIndex + 1]

    if (nextPhase) {
      // Move to next phase
      this.state.phase = nextPhase.name
      this.state.phaseStartTime = Date.now()
      this.state.phaseTimeRemaining = nextPhase.duration

      this.emit('onPhaseChange', nextPhase.name)
      this.addEvent({
        id: `event_${Date.now()}`,
        type: 'phase_change',
        timestamp: Date.now(),
        team: 'red',
        message: `Phase ${currentIndex + 2}: ${nextPhase.displayName}`,
        severity: 'warning',
        points: 0,
      })
    } else {
      // Battle complete
      this.stopBattle()
    }
  }

  private getCurrentPhaseConfig() {
    if (!this.state) return null
    return this.state.scenario.phases.find((p) => p.name === this.state!.phase)
  }

  private getPreviousPhasesDuration(): number {
    if (!this.state) return 0

    const currentIndex = this.state.scenario.phases.findIndex((p) => p.name === this.state!.phase)
    return this.state.scenario.phases
      .slice(0, currentIndex)
      .reduce((sum, phase) => sum + phase.duration * 1000, 0)
  }

  // ============================================================================
  // Attack Execution
  // ============================================================================

  /**
   * Launch manual attack
   */
  async launchAttack(type: AttackType): Promise<void> {
    if (!this.state || this.state.isPaused || !this.state.isRunning) return

    const phaseConfig = this.getCurrentPhaseConfig()
    if (!phaseConfig || !phaseConfig.enabledAttacks.includes(type)) {
      console.warn(`Attack ${type} not enabled in current phase`)
      return
    }

    const config = ATTACK_CONFIGS[type]
    const attack: Attack = {
      id: `attack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: config.displayName,
      severity: config.severity,
      status: 'launching',
      progress: 0,
      timestamp: Date.now(),
      source: 'red_team',
      targetSystem: config.targetSystem,
    }

    this.state.activeAttacks.push(attack)
    this.state.attackHistory.push(attack)
    this.updateScore('red', 'attacksLaunched', 1)
    this.addPoints('red', POINT_VALUES.ATTACK_LAUNCHED)

    this.emit('onAttackLaunched', attack)
    this.addEvent({
      id: `event_${Date.now()}`,
      type: 'attack_launched',
      timestamp: attack.timestamp,
      team: 'red',
      message: `🔴 ${config.displayName} launched → ${config.targetSystem}`,
      severity: 'info',
      points: POINT_VALUES.ATTACK_LAUNCHED,
      attackId: attack.id,
      metadata: { attackType: type },
    })

    // Simulate attack execution
    attack.status = 'in_flight'

    setTimeout(() => {
      this.resolveAttack(attack)
    }, config.duration)
  }

  /**
   * Resolve attack outcome (blocked or success)
   */
  private async resolveAttack(attack: Attack): Promise<void> {
    if (!this.state) return

    // Check if attack is blocked by active defenses
    const blockingDefense = this.checkDefenseBlocks(attack)

    if (blockingDefense) {
      // Attack blocked
      attack.status = 'blocked'
      attack.progress = 100

      this.updateScore('blue', 'attacksBlocked', 1)
      this.state.metrics.blockedAttacks++
      this.state.metrics.totalBlocks++

      const points = POINT_VALUES.ATTACK_BLOCKED
      this.addPoints('blue', points)

      blockingDefense.blockedAttacks++
      blockingDefense.status = 'blocking'

      this.emit('onAttackBlocked', attack, blockingDefense)
      this.addEvent({
        id: `event_${Date.now()}`,
        type: 'attack_blocked',
        timestamp: Date.now(),
        team: 'blue',
        message: `🔵 ${blockingDefense.name} BLOCKED ${attack.name}! +${points}pts`,
        severity: 'warning',
        points,
        attackId: attack.id,
        defenseId: blockingDefense.id,
        metadata: { defenseType: blockingDefense.type, attackType: attack.type },
      })

      // Reset defense status after animation
      setTimeout(() => {
        if (blockingDefense) blockingDefense.status = 'active'
      }, 1000)
    } else {
      // Attack succeeded
      attack.status = 'success'
      attack.progress = 100

      this.updateScore('red', 'attacksSuccessful', 1)
      this.state.metrics.successfulAttacks++

      const config = ATTACK_CONFIGS[attack.type]
      const points = config.basePoints * this.state.scenario.redPointsMultiplier
      this.addPoints('red', points)

      // Mark system as compromised
      if (!this.state.metrics.systemsCompromised.includes(attack.targetSystem)) {
        this.state.metrics.systemsCompromised.push(attack.targetSystem)
        this.state.metrics.systemsIntact = this.state.metrics.systemsIntact.filter(
          (s) => s !== attack.targetSystem
        )
        this.addPoints('red', POINT_VALUES.SYSTEM_COMPROMISED)
        this.updateScore('red', 'systemsCompromised', 1)
      }

      this.emit('onAttackSuccess', attack)
      this.addEvent({
        id: `event_${Date.now()}`,
        type: 'attack_success',
        timestamp: Date.now(),
        team: 'red',
        message: `🔴 ${attack.name} SUCCESS! ${attack.targetSystem} compromised +${points}pts`,
        severity: 'critical',
        points,
        attackId: attack.id,
        metadata: { attackType: attack.type, targetSystem: attack.targetSystem },
      })

      // Trigger critical moment
      this.emit('onCriticalMoment', this.state.events[this.state.events.length - 1])
    }

    // Update metrics
    this.state.metrics.totalAttacks++
    this.state.metrics.successRate =
      (this.state.metrics.successfulAttacks / this.state.metrics.totalAttacks) * 100

    // Remove from active attacks after delay
    setTimeout(() => {
      if (this.state) {
        this.state.activeAttacks = this.state.activeAttacks.filter((a) => a.id !== attack.id)
      }
    }, 2000)
  }

  /**
   * Check if any defense blocks this attack
   */
  private checkDefenseBlocks(attack: Attack): Defense | null {
    if (!this.state) return null

    // Get all defenses that can block this attack type
    const eligibleDefenses = this.state.activeDefenses.filter((defense) => {
      const config = DEFENSE_CONFIGS[defense.type]
      return config.blocksAttacks.includes(attack.type) && defense.status === 'active'
    })

    if (eligibleDefenses.length === 0) return null

    // Randomly select one (or use strength-based probability)
    const defense = eligibleDefenses[Math.floor(Math.random() * eligibleDefenses.length)]

    // Honeypot always detects honeypot_probe attacks (100% detection rate)
    if (defense.type === 'honeypot' && attack.type === 'honeypot_probe') {
      return defense
    }

    // Tiered block probabilities based on attack severity
    const baseBlockChance = defense.strength / 100
    const severityMultiplier: Record<string, number> = {
      low: 0.95,
      medium: 0.85,
      high: 0.75,
      critical: 0.60,
    }

    const finalChance = baseBlockChance * (severityMultiplier[attack.severity] || 0.75)

    if (Math.random() < finalChance) {
      return defense
    }

    return null
  }

  // ============================================================================
  // Defense Management
  // ============================================================================

  /**
   * Initialize defenses based on current phase
   */
  private async initializeDefenses(): Promise<void> {
    if (!this.state) return

    const phaseConfig = this.getCurrentPhaseConfig()
    if (!phaseConfig) return

    const defenses: Defense[] = phaseConfig.enabledDefenses.map((type) => {
      const config = DEFENSE_CONFIGS[type]
      return {
        id: `defense_${Date.now()}_${type}`,
        type,
        name: config.displayName,
        status: 'active',
        strength: 90 + Math.random() * 10, // 90-100% (increased for better balance)
        timestamp: Date.now(),
        blockedAttacks: 0,
      }
    })

    this.state.activeDefenses = defenses

    defenses.forEach((defense) => {
      this.emit('onDefenseActivated', defense)
    })
  }

  /**
   * Fetch live defense data from backend
   */
  private async fetchDefenseData(): Promise<void> {
    if (!this.state) return

    try {
      // Fetch active IP bans
      const bans = await incidentService.getActiveBans()
      if (bans && bans.length > 0) {
        this.updateScore('blue', 'ipsBanned', bans.length)
        this.state.metrics.totalBans = bans.length
      }

      // Fetch recent incidents
      const incidents = await incidentService.getIncidents()
      if (incidents && incidents.length > 0) {
        const resolvedIncidents = incidents.filter((i) => i.status === 'resolved').length
        this.updateScore('blue', 'incidentsResolved', resolvedIncidents)
      }

      // Check honeypot triggers (simulated from honeypot attacks)
      // This would normally fetch from Prometheus metrics
      const honeypotDefense = this.state.activeDefenses.find((d) => d.type === 'honeypot')
      if (honeypotDefense && honeypotDefense.blockedAttacks > 0) {
        this.state.metrics.totalHoneypotHits = honeypotDefense.blockedAttacks
      }
    } catch (error) {
      console.error('Failed to fetch defense data:', error)
    }
  }

  // ============================================================================
  // Auto-Attack System
  // ============================================================================

  private startAutoAttacks(): void {
    if (!this.state || !this.state.scenario.autoAttackEnabled) return

    const interval = this.state.scenario.autoAttackInterval || 5000

    this.autoAttackTimer = setInterval(() => {
      if (!this.state || this.state.isPaused || !this.state.isRunning) return

      const phaseConfig = this.getCurrentPhaseConfig()
      if (!phaseConfig || phaseConfig.enabledAttacks.length === 0) return

      // Select random attack from scenario config
      const attackTypes = this.state.scenario.autoAttackTypes || phaseConfig.enabledAttacks
      const randomType = attackTypes[Math.floor(Math.random() * attackTypes.length)]

      this.launchAttack(randomType)
    }, interval)
  }

  // ============================================================================
  // Periodic Updates
  // ============================================================================

  private startPeriodicUpdates(): void {
    this.updateTimer = setInterval(() => {
      if (!this.state || this.state.isPaused) return

      // Fetch defense data from backend
      this.fetchDefenseData()

      // Update advantage
      this.updateAdvantage()
    }, 2000) // Every 2 seconds
  }

  // ============================================================================
  // Scoring & Events
  // ============================================================================

  private addPoints(team: 'red' | 'blue', points: number): void {
    if (!this.state) return

    const multiplier = team === 'red'
      ? this.state.scenario.redPointsMultiplier
      : this.state.scenario.bluePointsMultiplier

    this.state.score[team].points += Math.round(points * multiplier)

    this.updateAdvantage()
    this.emit('onScoreUpdate', this.state.score)
  }

  private updateScore(team: 'red' | 'blue', metric: keyof TeamScore, value: number): void {
    if (!this.state) return

    const currentValue = this.state.score[team][metric]
    if (typeof currentValue === 'number') {
      ;(this.state.score[team][metric] as number) = value
    }
  }

  private updateAdvantage(): void {
    if (!this.state) return

    const diff = this.state.score.red.points - this.state.score.blue.points
    this.state.score.advantagePoints = Math.abs(diff)

    if (diff > 20) {
      this.state.score.advantage = 'red'
    } else if (diff < -20) {
      this.state.score.advantage = 'blue'
    } else {
      this.state.score.advantage = 'neutral'
    }
  }

  private addEvent(event: BattleEvent): void {
    if (!this.state) return

    this.state.events.push(event)

    // Keep only last 100 events
    if (this.state.events.length > 100) {
      this.state.events = this.state.events.slice(-100)
    }
  }

  // ============================================================================
  // Event Emitter
  // ============================================================================

  on<K extends keyof BattleEngineEvents>(event: K, handler: BattleEngineEvents[K]): void {
    this.eventListeners[event] = handler
  }

  off<K extends keyof BattleEngineEvents>(event: K): void {
    delete this.eventListeners[event]
  }

  private emit<K extends keyof BattleEngineEvents>(
    event: K,
    ...args: Parameters<BattleEngineEvents[K]>
  ): void {
    const handler = this.eventListeners[event]
    if (handler) {
      ;(handler as any)(...args)
    }
  }

  // ============================================================================
  // Public Utilities
  // ============================================================================

  /**
   * Get all available scenarios
   */
  getAvailableScenarios(): BattleScenario[] {
    return Object.values(BATTLE_SCENARIOS)
  }

  /**
   * Get scenario by type
   */
  getScenario(type: string): BattleScenario | undefined {
    return BATTLE_SCENARIOS[type as keyof typeof BATTLE_SCENARIOS]
  }
}

export const battleEngine = new BattleEngine()
