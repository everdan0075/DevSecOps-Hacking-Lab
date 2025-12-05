/**
 * Mission Types - TIME BREACH Feature
 *
 * Type definitions for historical breach recreation missions
 */

export type MissionRole = 'attacker' | 'defender' | 'forensics'
export type MissionDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type EvidenceType = 'document' | 'log' | 'code' | 'network' | 'email' | 'database'
export type ObjectiveStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'failed'
export type EndingType = 'success' | 'detected' | 'prevented' | 'partial'

/**
 * MITRE ATT&CK Technique Reference
 */
export interface MitreTechnique {
  id: string // T1190, T1078, etc.
  name: string
  tactic: string // Initial Access, Execution, etc.
  description: string
  url: string // Link to MITRE ATT&CK page
}

/**
 * Historical Timeline Phase
 */
export interface TimelinePhase {
  id: string
  date: string // ISO 8601 format
  displayDate: string // "March 7, 2017"
  title: string
  description: string
  type: 'discovery' | 'notification' | 'exploitation' | 'breach' | 'detection' | 'disclosure' | 'response'
  importance: 'critical' | 'high' | 'medium' | 'low'
  actors?: string[] // ["Apache Foundation", "Equifax IT Team", "Attackers"]
}

/**
 * Mission Evidence/Artifact
 */
export interface Evidence {
  id: string
  type: EvidenceType
  title: string
  description: string
  content: string // Markdown or code content
  discoveredAt?: string // Phase ID when this becomes available
  requiredFor?: string[] // Objective IDs that need this evidence
  mitreMapping?: string[] // Technique IDs this evidence relates to
  metadata?: {
    author?: string
    timestamp?: string
    source?: string
    classification?: string
  }
}

/**
 * Mission Objective/Task
 */
export interface Objective {
  id: string
  phaseId: string // Which timeline phase this objective belongs to
  title: string
  description: string
  role: MissionRole // Which role can complete this objective
  type: 'reconnaissance' | 'exploitation' | 'defense' | 'investigation' | 'remediation'

  // Requirements
  requiredEvidence?: string[] // Evidence IDs needed
  requiredObjectives?: string[] // Must complete these first

  // Validation
  validation?: {
    type: 'code_execution' | 'api_call' | 'file_upload' | 'quiz' | 'manual'
    endpoint?: string // API endpoint to validate
    expectedResponse?: any
    payload?: string // Expected payload/answer
  }

  // Rewards
  points: number
  mitreTechniques: string[] // Technique IDs unlocked
  unlocksEvidence?: string[] // Evidence IDs revealed upon completion

  // Hints
  hints: Array<{
    cost: number // Points cost to reveal
    text: string
  }>
}

/**
 * Mission Ending/Outcome
 */
export interface MissionEnding {
  id: string
  type: EndingType
  title: string
  description: string
  condition: {
    type: 'objectives_completed' | 'time_limit' | 'detection_threshold' | 'custom'
    value?: any
  }
  debriefing: {
    summary: string
    realWorldComparison: string // What actually happened in history
    lessonsLearned: string[]
    metrics: {
      objectivesCompleted: number
      totalObjectives: number
      timeElapsed: number // seconds
      detectionEvents: number
      mitreTechniquesUsed: string[]
    }
  }
  rewards: {
    points: number
    achievements: string[]
    badges: string[]
  }
}

/**
 * Complete Mission Definition
 */
export interface Mission {
  // Metadata
  id: string
  title: string
  subtitle: string
  description: string
  difficulty: MissionDifficulty
  estimatedDuration: number // minutes

  // Historical Context
  realIncident: {
    date: string // "2017-09-07"
    organization: string // "Equifax"
    impact: string
    cve?: string
    attribution?: string // "Chinese APT Group"
  }

  // Mission Configuration
  availableRoles: MissionRole[]
  timeline: TimelinePhase[]
  objectives: Objective[]
  evidence: Evidence[]
  endings: MissionEnding[]

  // MITRE ATT&CK Coverage
  mitreTechniques: MitreTechnique[]

  // Media Assets
  media: {
    coverImage?: string
    introVideo?: string
    documentaryClips?: string[]
    networkDiagrams?: string[]
  }

  // Tags
  tags: string[] // ["web", "rce", "patching", "supply-chain"]

  // Metadata
  createdAt: string
  updatedAt: string
  version: string
}

/**
 * Player's Mission Progress
 */
export interface MissionProgress {
  missionId: string
  role: MissionRole
  currentPhaseId: string

  completedObjectives: string[]
  discoveredEvidence: string[]
  unlockedMitreTechniques: string[]

  score: number
  hintsUsed: number

  startedAt: string
  lastPlayedAt: string
  completedAt?: string

  ending?: string // Ending ID if completed
}

/**
 * Mission Stats (for leaderboard/achievements)
 */
export interface MissionStats {
  missionId: string
  totalPlays: number
  completionRate: number
  averageTime: number // seconds
  fastestTime: number
  mostUsedRole: MissionRole
  endingDistribution: Record<EndingType, number>
}

/**
 * Achievement System
 */
export type AchievementCategory = 'technique' | 'mission' | 'role' | 'special' | 'speedrun'
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface Achievement {
  id: string
  title: string
  description: string
  category: AchievementCategory
  tier: AchievementTier
  icon: string // Emoji or icon name

  // Unlock conditions
  condition: {
    type: 'mitre_technique' | 'mission_complete' | 'role_mastery' | 'perfect_score' | 'speed' | 'custom'
    value?: any // Technique ID, mission ID, time threshold, etc.
  }

  // Rewards
  points: number
  unlocks?: string[] // What this achievement unlocks (new missions, roles, etc.)

  // Metadata
  rarity?: number // 0-100, percentage of players who unlocked
  hidden?: boolean // Secret achievement not shown until unlocked
}

export interface AchievementProgress {
  userId?: string

  // Unlocked achievements
  unlockedAchievements: string[]

  // MITRE technique mastery
  unlockedTechniques: string[]
  techniqueUsageCount: Record<string, number> // T1190: 5, T1505: 3, etc.

  // Mission completion
  completedMissions: string[]
  missionsByRole: Record<MissionRole, string[]> // attacker: [equifax, capitalone], etc.

  // Stats
  totalPoints: number
  totalPlayTime: number // seconds
  fastestCompletions: Record<string, number> // missionId: timeInSeconds
  perfectMissions: string[] // 100% completion

  // Metadata
  firstAchievementAt?: string
  lastUpdatedAt: string
}
