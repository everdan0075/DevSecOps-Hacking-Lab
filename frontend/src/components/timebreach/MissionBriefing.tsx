/**
 * Mission Briefing Component
 *
 * Shows mission introduction, context, and role selection
 */

import { motion } from 'framer-motion'
import { Shield, Target, Search, ArrowLeft, Play, AlertTriangle, Calendar, Users } from 'lucide-react'
import type { Mission, MissionRole } from '@/types/mission'
import { cn } from '@/utils/cn'

interface MissionBriefingProps {
  mission: Mission
  onStart: (role: MissionRole) => void
  onBack: () => void
}

export function MissionBriefing({ mission, onStart, onBack }: MissionBriefingProps) {
  const roleConfig: Record<MissionRole, { icon: typeof Target; color: string; description: string }> = {
    attacker: {
      icon: Target,
      color: 'red',
      description: 'Execute the attack as it happened in history. Exploit vulnerabilities, exfiltrate data, and achieve mission objectives.',
    },
    defender: {
      icon: Shield,
      color: 'blue',
      description: 'Prevent the breach before it happens. Apply patches, detect anomalies, and defend the infrastructure.',
    },
    forensics: {
      icon: Search,
      color: 'purple',
      description: 'Investigate the breach after the fact. Analyze evidence, trace attacker movements, and build the timeline.',
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-cyber-bg"
    >
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-cyber-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Missions
        </button>

        {/* Mission Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cyber-primary mb-2">{mission.title}</h1>
          <p className="text-xl text-gray-300 mb-4">{mission.subtitle}</p>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400">{mission.realIncident.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400">{mission.realIncident.organization}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400">{mission.realIncident.cve}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="p-6 bg-cyber-surface border border-cyber-border rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4">Mission Briefing</h2>
              <p className="text-gray-300 leading-relaxed">{mission.description}</p>
            </div>

            {/* Historical Context */}
            <div className="p-6 bg-cyber-surface border border-cyber-border rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4">Historical Impact</h2>
              <p className="text-gray-300 leading-relaxed mb-4">{mission.realIncident.impact}</p>

              {mission.realIncident.attribution && (
                <div className="p-4 bg-cyber-danger/10 border border-cyber-danger/30 rounded">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-cyber-danger flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-cyber-danger mb-1">Attribution</div>
                      <div className="text-sm text-gray-400">{mission.realIncident.attribution}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Overview */}
            <div className="p-6 bg-cyber-surface border border-cyber-border rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4">
                Timeline ({mission.timeline.length} phases)
              </h2>
              <div className="space-y-3">
                {mission.timeline.slice(0, 5).map((phase, index) => (
                  <div key={phase.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-24 text-xs text-gray-500 pt-1">
                      {phase.displayDate}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-cyber-primary">{phase.title}</div>
                      <div className="text-xs text-gray-400">{phase.description}</div>
                    </div>
                  </div>
                ))}
                {mission.timeline.length > 5 && (
                  <div className="text-xs text-gray-500 italic">
                    + {mission.timeline.length - 5} more phases...
                  </div>
                )}
              </div>
            </div>

            {/* MITRE ATT&CK Coverage */}
            <div className="p-6 bg-cyber-surface border border-cyber-border rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4">
                MITRE ATT&CK Techniques ({mission.mitreTechniques.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {mission.mitreTechniques.map((technique) => (
                  <a
                    key={technique.id}
                    href={technique.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-cyber-bg border border-cyber-primary/30 rounded text-xs font-mono text-cyber-primary hover:bg-cyber-primary hover:text-cyber-bg transition-all"
                    title={technique.name}
                  >
                    {technique.id}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Role Selection */}
          <div className="space-y-6">
            <div className="p-6 bg-cyber-surface border border-cyber-border rounded-lg sticky top-8">
              <h2 className="text-lg font-semibold text-white mb-4">Select Your Role</h2>

              <div className="space-y-3">
                {mission.availableRoles.map((role) => {
                  const config = roleConfig[role]
                  const Icon = config.icon

                  return (
                    <motion.button
                      key={role}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onStart(role)}
                      className={cn(
                        'w-full p-4 rounded-lg border-2 text-left transition-all',
                        role === 'attacker' &&
                          'bg-red-950/20 border-red-700/30 hover:bg-red-950/40 hover:border-red-500',
                        role === 'defender' &&
                          'bg-blue-950/20 border-blue-700/30 hover:bg-blue-950/40 hover:border-blue-500',
                        role === 'forensics' &&
                          'bg-purple-950/20 border-purple-700/30 hover:bg-purple-950/40 hover:border-purple-500'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'p-2 rounded',
                            role === 'attacker' && 'bg-red-500/20',
                            role === 'defender' && 'bg-blue-500/20',
                            role === 'forensics' && 'bg-purple-500/20'
                          )}
                        >
                          <Icon
                            className={cn(
                              'w-5 h-5',
                              role === 'attacker' && 'text-red-500',
                              role === 'defender' && 'text-blue-500',
                              role === 'forensics' && 'text-purple-500'
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white capitalize mb-1">{role}</div>
                          <div className="text-xs text-gray-400">{config.description}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-2 text-sm font-medium">
                        <Play className="w-4 h-4" />
                        <span>Start as {role}</span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Mission Stats */}
              <div className="mt-6 pt-6 border-t border-cyber-border space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Difficulty</span>
                  <span className="text-cyber-primary font-medium capitalize">
                    {mission.difficulty}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated Duration</span>
                  <span className="text-cyber-primary font-medium">
                    {mission.estimatedDuration} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Objectives</span>
                  <span className="text-cyber-primary font-medium">{mission.objectives.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Evidence</span>
                  <span className="text-cyber-primary font-medium">{mission.evidence.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
