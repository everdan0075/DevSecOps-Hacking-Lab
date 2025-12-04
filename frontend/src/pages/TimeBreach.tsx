/**
 * TIME BREACH Page
 *
 * Interactive historical cyber breach recreation platform
 * Allows users to replay famous security incidents as attacker or defender
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Shield, Target, Award, BookOpen, ArrowLeft } from 'lucide-react'
import { MissionBriefing } from '@/components/timebreach/MissionBriefing'
import { InteractiveTimeline } from '@/components/timebreach/InteractiveTimeline'
import { MissionObjectives } from '@/components/timebreach/MissionObjectives'
import { EvidencePanel } from '@/components/timebreach/EvidencePanel'
import { MissionDebrief } from '@/components/timebreach/MissionDebrief'
import type { Mission, MissionRole, MissionProgress, TimelinePhase } from '@/types/mission'
import { cn } from '@/utils/cn'

// Import mission data
import equifaxMission from '@/data/missions/equifax-2017.json'

const AVAILABLE_MISSIONS: Mission[] = [equifaxMission as Mission]

type GamePhase = 'select' | 'briefing' | 'playing' | 'debrief'

export function TimeBreach() {
  const { missionId } = useParams<{ missionId: string }>()
  const navigate = useNavigate()

  const [gamePhase, setGamePhase] = useState<GamePhase>('select')
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [selectedRole, setSelectedRole] = useState<MissionRole | null>(null)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [progress, setProgress] = useState<MissionProgress | null>(null)

  // Load mission from URL parameter
  useEffect(() => {
    if (missionId) {
      const mission = AVAILABLE_MISSIONS.find((m) => m.id === missionId)
      if (mission) {
        setSelectedMission(mission)
        setGamePhase('briefing')
      }
    }
  }, [missionId])

  const handleSelectMission = (mission: Mission) => {
    setSelectedMission(mission)
    navigate(`/time-breach/${mission.id}`)
    setGamePhase('briefing')
  }

  const handleStartMission = (role: MissionRole) => {
    if (!selectedMission) return

    setSelectedRole(role)

    // Initialize progress
    const initialProgress: MissionProgress = {
      missionId: selectedMission.id,
      role,
      currentPhaseId: selectedMission.timeline[0].id,
      completedObjectives: [],
      discoveredEvidence: [],
      unlockedMitreTechniques: [],
      score: 0,
      hintsUsed: 0,
      startedAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
    }

    setProgress(initialProgress)
    setGamePhase('playing')
  }

  const handleBackToSelect = () => {
    setGamePhase('select')
    setSelectedMission(null)
    setSelectedRole(null)
    setProgress(null)
    setCurrentPhaseIndex(0)
    navigate('/time-breach')
  }

  const handlePhaseChange = (phaseIndex: number) => {
    setCurrentPhaseIndex(phaseIndex)
    if (selectedMission && progress) {
      const newPhaseId = selectedMission.timeline[phaseIndex].id
      setProgress({
        ...progress,
        currentPhaseId: newPhaseId,
        lastPlayedAt: new Date().toISOString(),
      })
    }
  }

  const handleObjectiveComplete = (objectiveId: string, pointsEarned: number) => {
    if (!progress) return

    setProgress({
      ...progress,
      completedObjectives: [...progress.completedObjectives, objectiveId],
      score: progress.score + pointsEarned,
      lastPlayedAt: new Date().toISOString(),
    })
  }

  const handleEvidenceDiscovered = (evidenceId: string) => {
    if (!progress) return

    setProgress({
      ...progress,
      discoveredEvidence: [...progress.discoveredEvidence, evidenceId],
      lastPlayedAt: new Date().toISOString(),
    })
  }

  const handleMissionComplete = (endingId: string) => {
    if (!progress) return

    setProgress({
      ...progress,
      completedAt: new Date().toISOString(),
      ending: endingId,
    })

    setGamePhase('debrief')
  }

  const currentPhase = selectedMission?.timeline[currentPhaseIndex]

  return (
    <div className="min-h-screen bg-cyber-bg">
      <AnimatePresence mode="wait">
        {/* Mission Selection Screen */}
        {gamePhase === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container mx-auto px-4 py-8"
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-cyber-primary/10 border border-cyber-primary/30 rounded-lg">
                  <Clock className="w-8 h-8 text-cyber-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">TIME BREACH</h1>
                  <p className="text-gray-400 mt-1">
                    Recreate history's most infamous cyber attacks
                  </p>
                </div>
              </div>

              {/* Info Banner */}
              <div className="p-4 bg-cyber-warning/10 border border-cyber-warning/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-cyber-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-cyber-warning mb-1">
                      Educational Experience
                    </div>
                    <div className="text-sm text-gray-400">
                      These missions recreate real security incidents for learning purposes. Play
                      as attacker to understand how breaches happen, or as defender to learn how
                      they could have been prevented.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mission Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {AVAILABLE_MISSIONS.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onSelect={() => handleSelectMission(mission)}
                />
              ))}

              {/* Coming Soon Cards */}
              <ComingSoonCard
                title="Capital One Cloud Breach"
                subtitle="SSRF + AWS Metadata Exploitation"
                date="2019"
              />
              <ComingSoonCard
                title="Log4Shell Zero-Day"
                subtitle="CVE-2021-44228: The Internet on Fire"
                date="2021"
              />
            </div>
          </motion.div>
        )}

        {/* Mission Briefing */}
        {gamePhase === 'briefing' && selectedMission && (
          <MissionBriefing
            key="briefing"
            mission={selectedMission}
            onStart={handleStartMission}
            onBack={handleBackToSelect}
          />
        )}

        {/* Playing Mission */}
        {gamePhase === 'playing' && selectedMission && progress && selectedRole && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen flex flex-col overflow-hidden"
          >
            {/* Header Bar */}
            <div className="bg-cyber-surface border-b border-cyber-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToSelect}
                    className="p-2 rounded-lg bg-cyber-bg border border-cyber-border hover:border-cyber-primary transition-all"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-cyber-primary">
                      {selectedMission.title}
                    </h2>
                    <p className="text-sm text-gray-400">{selectedMission.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Role Badge */}
                  <div className="flex items-center gap-2">
                    {selectedRole === 'attacker' ? (
                      <Target className="w-5 h-5 text-red-500" />
                    ) : (
                      <Shield className="w-5 h-5 text-blue-500" />
                    )}
                    <span className="text-sm font-medium text-gray-300 capitalize">
                      {selectedRole}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-cyber-primary" />
                    <span className="text-lg font-bold text-cyber-primary">
                      {progress.score} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Left Panel - Timeline & Objectives */}
              <div className="w-96 shrink-0 border-r border-cyber-border flex flex-col overflow-hidden">
                {/* Timeline */}
                <div className="border-b border-cyber-border p-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">TIMELINE</h3>
                  <InteractiveTimeline
                    phases={selectedMission.timeline}
                    currentPhaseIndex={currentPhaseIndex}
                    onPhaseChange={handlePhaseChange}
                  />
                </div>

                {/* Objectives */}
                <div className="flex-1 overflow-y-auto">
                  <MissionObjectives
                    mission={selectedMission}
                    progress={progress}
                    currentPhase={currentPhase!}
                    role={selectedRole}
                    onObjectiveComplete={handleObjectiveComplete}
                    onEvidenceDiscovered={handleEvidenceDiscovered}
                  />
                </div>
              </div>

              {/* Center Panel - Evidence & Code */}
              <div className="flex-1 overflow-y-auto">
                <EvidencePanel
                  mission={selectedMission}
                  progress={progress}
                  currentPhase={currentPhase!}
                  onEvidenceDiscovered={handleEvidenceDiscovered}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Mission Debrief */}
        {gamePhase === 'debrief' && selectedMission && progress && (
          <MissionDebrief
            key="debrief"
            mission={selectedMission}
            progress={progress}
            onRestart={() => {
              setGamePhase('briefing')
              setProgress(null)
            }}
            onBackToSelect={handleBackToSelect}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

interface MissionCardProps {
  mission: Mission
  onSelect: () => void
}

function MissionCard({ mission, onSelect }: MissionCardProps) {
  const difficultyColors = {
    beginner: 'text-green-500',
    intermediate: 'text-yellow-500',
    advanced: 'text-orange-500',
    expert: 'text-red-500',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="p-6 bg-cyber-surface border border-cyber-border rounded-lg cursor-pointer hover:border-cyber-primary transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-cyber-primary/10 border border-cyber-primary/30 rounded">
          <Clock className="w-6 h-6 text-cyber-primary" />
        </div>
        <span className={cn('text-xs font-bold uppercase', difficultyColors[mission.difficulty])}>
          {mission.difficulty}
        </span>
      </div>

      <h3 className="text-xl font-bold text-cyber-primary group-hover:text-cyber-secondary mb-2">
        {mission.title}
      </h3>
      <p className="text-sm text-gray-400 mb-4">{mission.subtitle}</p>

      <div className="space-y-2 text-xs mb-4">
        <div className="flex justify-between">
          <span className="text-gray-500">Organization</span>
          <span className="text-cyber-primary font-medium">{mission.realIncident.organization}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Date</span>
          <span className="text-cyber-primary font-medium">{mission.realIncident.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">CVE</span>
          <span className="text-cyber-primary font-mono">{mission.realIncident.cve}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Duration</span>
          <span className="text-cyber-primary font-medium">{mission.estimatedDuration} min</span>
        </div>
      </div>

      <button className="w-full py-2 bg-cyber-primary/10 border border-cyber-primary/30 rounded text-cyber-primary font-semibold hover:bg-cyber-primary hover:text-cyber-bg transition-all">
        Start Mission
      </button>
    </motion.div>
  )
}

interface ComingSoonCardProps {
  title: string
  subtitle: string
  date: string
}

function ComingSoonCard({ title, subtitle, date }: ComingSoonCardProps) {
  return (
    <div className="p-6 bg-cyber-surface/50 border border-cyber-border/50 rounded-lg opacity-60">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-gray-700/30 border border-gray-600/30 rounded">
          <Clock className="w-6 h-6 text-gray-500" />
        </div>
        <span className="text-xs font-bold uppercase text-gray-500">Coming Soon</span>
      </div>

      <h3 className="text-xl font-bold text-gray-400 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{subtitle}</p>

      <div className="space-y-2 text-xs mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Date</span>
          <span className="text-gray-500">{date}</span>
        </div>
      </div>

      <div className="w-full py-2 bg-gray-700/20 border border-gray-600/30 rounded text-gray-500 font-semibold text-center">
        In Development
      </div>
    </div>
  )
}
