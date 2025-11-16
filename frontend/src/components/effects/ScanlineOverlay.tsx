/**
 * ScanlineOverlay Component
 *
 * CRT monitor scanline effect for retro terminal aesthetics
 * Adds animated horizontal lines that move down the screen
 */

import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface ScanlineOverlayProps {
  className?: string
  intensity?: 'subtle' | 'medium' | 'strong'
  speed?: number // Animation duration in seconds
  enabled?: boolean
}

export function ScanlineOverlay({
  className,
  intensity = 'subtle',
  speed = 8,
  enabled = true
}: ScanlineOverlayProps) {
  if (!enabled) return null

  // Respect user preference for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const intensityMap = {
    subtle: 0.03,
    medium: 0.05,
    strong: 0.08
  }

  const opacityValue = intensityMap[intensity]

  return (
    <div
      className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}
      aria-hidden="true"
    >
      {/* Horizontal scanlines - static */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, ' + opacityValue + ') 2px, rgba(0, 255, 65, ' + opacityValue + ') 4px)',
          pointerEvents: 'none',
        }}
      />

      {/* Animated scanline moving down */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            className="absolute inset-x-0 h-24"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 65, 0.1), transparent)',
              filter: 'blur(2px)',
            }}
            animate={{
              y: ['-100%', '100%']
            }}
            transition={{
              duration: speed,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Secondary slower scanline for depth */}
          <motion.div
            className="absolute inset-x-0 h-16"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 65, 0.05), transparent)',
              filter: 'blur(4px)',
            }}
            animate={{
              y: ['-50%', '150%']
            }}
            transition={{
              duration: speed * 1.5,
              repeat: Infinity,
              ease: 'linear',
              delay: speed * 0.3,
            }}
          />
        </>
      )}

      {/* CRT screen curvature vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.3) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle flicker effect */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 bg-black"
          animate={{
            opacity: [0, 0.02, 0, 0.03, 0]
          }}
          transition={{
            duration: 0.15,
            repeat: Infinity,
            repeatDelay: 3,
            ease: 'easeInOut',
          }}
        />
      )}

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          /* Disable all animations for accessibility */
          .scanline-overlay * {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
