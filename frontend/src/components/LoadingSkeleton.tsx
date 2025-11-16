/**
 * LoadingSkeleton Component
 *
 * Loading state placeholder for Suspense fallback
 * Matches layout to prevent layout shift
 */

import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface LoadingSkeletonProps {
  variant?: 'page' | 'card' | 'list' | 'full'
  className?: string
}

export function LoadingSkeleton({ variant = 'page', className }: LoadingSkeletonProps) {
  if (variant === 'full') {
    return (
      <div className={cn('min-h-screen flex items-center justify-center bg-cyber-bg', className)}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (variant === 'page') {
    return (
      <div className={cn('space-y-6 animate-pulse', className)}>
        {/* Page header skeleton */}
        <div className="space-y-3">
          <div className="h-10 bg-cyber-surface rounded-lg w-1/3" />
          <div className="h-5 bg-cyber-surface rounded-lg w-2/3" />
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return <CardSkeleton className={className} />
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-4 animate-pulse', className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-cyber-surface rounded-lg" />
        ))}
      </div>
    )
  }

  return null
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 rounded-lg bg-cyber-surface border border-cyber-border animate-pulse', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-cyber-bg" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-cyber-bg rounded" />
            <div className="h-3 w-20 bg-cyber-bg rounded" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-cyber-bg rounded w-full" />
        <div className="h-3 bg-cyber-bg rounded w-5/6" />
        <div className="h-3 bg-cyber-bg rounded w-4/6" />
      </div>
      <div className="mt-4 h-10 bg-cyber-bg rounded" />
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <motion.div
        className={cn('border-4 border-cyber-border border-t-cyber-primary rounded-full', sizeClasses[size])}
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      <motion.p
        className="text-sm text-gray-400 font-mono"
        animate={{
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        Loading<motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >...</motion.span>
      </motion.p>
    </div>
  )
}
