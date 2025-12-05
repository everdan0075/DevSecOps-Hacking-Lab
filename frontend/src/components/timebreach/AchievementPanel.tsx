import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Target, Award, Zap, Star, ChevronDown, ChevronUp } from 'lucide-react'
import type { Achievement, AchievementProgress, AchievementCategory } from '../../types/mission'
import { AchievementBadge } from './AchievementBadge'
import achievementsData from '../../data/achievements.json'

interface AchievementPanelProps {
  progress: AchievementProgress
  newAchievements?: string[] // Newly unlocked achievement IDs (for animation)
}

const getCategoryIcon = (category: AchievementCategory) => {
  switch (category) {
    case 'technique':
      return Target
    case 'mission':
      return Trophy
    case 'role':
      return Award
    case 'speedrun':
      return Zap
    case 'special':
      return Star
  }
}

const getCategoryTitle = (category: AchievementCategory) => {
  switch (category) {
    case 'technique':
      return 'MITRE ATT&CK Techniques'
    case 'mission':
      return 'Mission Completion'
    case 'role':
      return 'Role Mastery'
    case 'speedrun':
      return 'Speedrun'
    case 'special':
      return 'Special Achievements'
  }
}

export function AchievementPanel({ progress, newAchievements = [] }: AchievementPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<AchievementCategory[]>([
    'special',
    'technique',
    'mission'
  ])

  const achievements = useMemo(() => achievementsData as Achievement[], [])

  // Group achievements by category
  const achievementsByCategory = useMemo(() => {
    const grouped: Record<AchievementCategory, Achievement[]> = {
      technique: [],
      mission: [],
      role: [],
      speedrun: [],
      special: []
    }

    achievements.forEach((achievement) => {
      grouped[achievement.category].push(achievement)
    })

    return grouped
  }, [achievements])

  // Calculate stats
  const stats = useMemo(() => {
    const totalAchievements = achievements.filter((a) => !a.hidden || progress.unlockedAchievements.includes(a.id)).length
    const unlockedCount = progress.unlockedAchievements.length
    const totalPoints = achievements
      .filter((a) => progress.unlockedAchievements.includes(a.id))
      .reduce((sum, a) => sum + a.points, 0)

    return {
      totalAchievements,
      unlockedCount,
      completionRate: Math.round((unlockedCount / totalAchievements) * 100),
      totalPoints
    }
  }, [achievements, progress])

  const toggleCategory = (category: AchievementCategory) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const isAchievementUnlocked = (achievement: Achievement): boolean => {
    return progress.unlockedAchievements.includes(achievement.id)
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cyber-primary">{stats.unlockedCount}</div>
          <div className="text-xs text-gray-400 mt-1">Unlocked</div>
        </div>

        <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.totalAchievements}</div>
          <div className="text-xs text-gray-400 mt-1">Total</div>
        </div>

        <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-500">{stats.completionRate}%</div>
          <div className="text-xs text-gray-400 mt-1">Complete</div>
        </div>

        <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{stats.totalPoints}</div>
          <div className="text-xs text-gray-400 mt-1">Points</div>
        </div>
      </div>

      {/* Achievement Categories */}
      <div className="space-y-4">
        {(Object.keys(achievementsByCategory) as AchievementCategory[]).map((category) => {
          const categoryAchievements = achievementsByCategory[category]
          if (categoryAchievements.length === 0) return null

          const Icon = getCategoryIcon(category)
          const isExpanded = expandedCategories.includes(category)
          const unlockedInCategory = categoryAchievements.filter((a) => isAchievementUnlocked(a)).length

          return (
            <div key={category} className="bg-cyber-surface border border-cyber-border rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-cyber-bg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-cyber-primary" />
                  <span className="font-semibold text-white">{getCategoryTitle(category)}</span>
                  <span className="text-sm text-gray-400">
                    {unlockedInCategory}/{categoryAchievements.length}
                  </span>
                </div>

                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Category Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {categoryAchievements.map((achievement) => {
                        const isNew = newAchievements.includes(achievement.id)

                        return (
                          <motion.div
                            key={achievement.id}
                            initial={isNew ? { scale: 0, rotate: -180 } : {}}
                            animate={isNew ? { scale: 1, rotate: 0 } : {}}
                            transition={{ type: 'spring', duration: 0.6 }}
                            className="relative"
                          >
                            <AchievementBadge
                              achievement={achievement}
                              unlocked={isAchievementUnlocked(achievement)}
                              showDetails={true}
                              size="md"
                              animated={isNew}
                            />

                            {/* NEW badge */}
                            {isNew && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-xs font-bold text-white shadow-lg"
                              >
                                NEW!
                              </motion.div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* MITRE Techniques Progress */}
      {progress.unlockedTechniques.length > 0 && (
        <div className="bg-cyber-surface border border-cyber-border rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            MITRE ATT&CK Techniques Mastered
          </h3>

          <div className="flex flex-wrap gap-2">
            {progress.unlockedTechniques.map((techniqueId) => (
              <div
                key={techniqueId}
                className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-sm font-mono text-purple-300 flex items-center gap-2"
              >
                <span>{techniqueId}</span>
                {progress.techniqueUsageCount[techniqueId] > 1 && (
                  <span className="px-1.5 py-0.5 bg-purple-500/20 rounded text-xs">
                    x{progress.techniqueUsageCount[techniqueId]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
