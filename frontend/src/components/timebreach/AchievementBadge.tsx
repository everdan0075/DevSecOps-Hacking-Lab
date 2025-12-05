import { motion } from 'framer-motion'
import { Lock, Award, Star } from 'lucide-react'
import type { Achievement, AchievementTier } from '../../types/mission'
import { cn } from '../../utils/cn'

interface AchievementBadgeProps {
  achievement: Achievement
  unlocked: boolean
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

const getTierColor = (tier: AchievementTier) => {
  switch (tier) {
    case 'bronze':
      return 'from-amber-700 to-amber-900'
    case 'silver':
      return 'from-gray-400 to-gray-600'
    case 'gold':
      return 'from-yellow-400 to-yellow-600'
    case 'platinum':
      return 'from-cyan-400 to-blue-600'
  }
}

const getTierBorderColor = (tier: AchievementTier) => {
  switch (tier) {
    case 'bronze':
      return 'border-amber-700/50'
    case 'silver':
      return 'border-gray-500/50'
    case 'gold':
      return 'border-yellow-500/50'
    case 'platinum':
      return 'border-cyan-500/50'
  }
}

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        container: 'w-16 h-16',
        icon: 'text-2xl',
        badge: 'text-xs'
      }
    case 'md':
      return {
        container: 'w-24 h-24',
        icon: 'text-4xl',
        badge: 'text-sm'
      }
    case 'lg':
      return {
        container: 'w-32 h-32',
        icon: 'text-5xl',
        badge: 'text-base'
      }
  }
}

export function AchievementBadge({
  achievement,
  unlocked,
  showDetails = false,
  size = 'md',
  animated = true
}: AchievementBadgeProps) {
  const sizeClasses = getSizeClasses(size)

  if (achievement.hidden && !unlocked) {
    return (
      <div className={cn(
        'relative rounded-full bg-gray-900/50 border-2 border-gray-700/50 flex items-center justify-center',
        sizeClasses.container
      )}>
        <Lock className="w-6 h-6 text-gray-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 group">
      <motion.div
        className={cn(
          'relative rounded-full border-2 flex items-center justify-center transition-all',
          sizeClasses.container,
          unlocked
            ? cn('bg-gradient-to-br', getTierColor(achievement.tier), getTierBorderColor(achievement.tier), 'shadow-lg')
            : 'bg-gray-900/50 border-gray-700/50 grayscale opacity-50'
        )}
        initial={animated && unlocked ? { scale: 0, rotate: -180 } : {}}
        animate={animated && unlocked ? { scale: 1, rotate: 0 } : {}}
        transition={{ type: 'spring', duration: 0.6, delay: 0.2 }}
        whileHover={unlocked ? { scale: 1.1, rotate: 5 } : {}}
      >
        {/* Shine effect for unlocked */}
        {unlocked && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        )}

        {/* Icon */}
        <div className={cn(sizeClasses.icon, unlocked ? 'filter-none' : 'grayscale')}>
          {achievement.icon}
        </div>

        {/* Tier badge */}
        {unlocked && (
          <div className={cn(
            'absolute -top-1 -right-1 bg-gradient-to-br rounded-full p-1',
            getTierColor(achievement.tier),
            'shadow-lg'
          )}>
            {achievement.tier === 'platinum' ? (
              <Star className="w-3 h-3 text-white fill-white" />
            ) : (
              <Award className="w-3 h-3 text-white" />
            )}
          </div>
        )}

        {/* Rarity indicator for rare achievements */}
        {unlocked && achievement.rarity && achievement.rarity <= 10 && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-purple-600 rounded-full text-xs font-bold text-white whitespace-nowrap">
            {achievement.rarity}%
          </div>
        )}
      </motion.div>

      {/* Details */}
      {showDetails && (
        <div className="text-center space-y-1">
          <div className={cn(
            'font-semibold text-sm',
            unlocked ? 'text-white' : 'text-gray-500'
          )}>
            {achievement.title}
          </div>
          <div className="text-xs text-gray-400 max-w-xs">
            {achievement.description}
          </div>
          <div className={cn(
            'text-xs font-mono',
            unlocked ? 'text-cyber-primary' : 'text-gray-600'
          )}>
            +{achievement.points} pts
          </div>
        </div>
      )}
    </div>
  )
}
