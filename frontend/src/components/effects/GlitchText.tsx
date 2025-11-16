/**
 * GlitchText Component
 *
 * Cyberpunk-style glitch animation effect for text
 * Applies RGB channel split and distortion on hover or continuous animation
 */

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from '@/utils/cn'

interface GlitchTextProps {
  children: string
  className?: string
  variant?: 'hover' | 'continuous' | 'subtle'
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'div'
  glitchOnMount?: boolean
}

export function GlitchText({
  children,
  className,
  variant = 'hover',
  as: Component = 'span',
  glitchOnMount = false
}: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false)

  // Trigger glitch on mount if enabled
  useEffect(() => {
    if (glitchOnMount) {
      setIsGlitching(true)
      const timer = setTimeout(() => setIsGlitching(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [glitchOnMount])

  // Continuous glitch effect
  useEffect(() => {
    if (variant === 'continuous') {
      const interval = setInterval(() => {
        setIsGlitching(true)
        setTimeout(() => setIsGlitching(false), 300)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [variant])

  const containerClass = cn(
    'relative inline-block',
    variant === 'hover' && 'group cursor-default',
    className
  )

  const baseTextClass = 'relative z-10'

  const glitchActiveClass = variant === 'hover' ? 'group-hover' : ''

  return (
    <motion.div
      className={containerClass}
      onMouseEnter={() => variant === 'hover' && setIsGlitching(true)}
      onMouseLeave={() => variant === 'hover' && setIsGlitching(false)}
      style={{
        // Disable animations for users who prefer reduced motion
        ...(window.matchMedia('(prefers-reduced-motion: reduce)').matches && {
          animation: 'none'
        })
      }}
    >
      <Component className={baseTextClass}>
        {children}
      </Component>

      {/* Red channel glitch */}
      <Component
        className={cn(
          'absolute inset-0 text-red-500 opacity-0 transition-opacity duration-100',
          (isGlitching || variant === 'continuous') && 'glitch-red',
          variant === 'hover' && `${glitchActiveClass}:opacity-70`,
          variant === 'subtle' && 'opacity-30'
        )}
        aria-hidden="true"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
          transform: isGlitching ? 'translate(-2px, 1px)' : 'none',
        }}
      >
        {children}
      </Component>

      {/* Blue channel glitch */}
      <Component
        className={cn(
          'absolute inset-0 text-cyan-500 opacity-0 transition-opacity duration-100',
          (isGlitching || variant === 'continuous') && 'glitch-blue',
          variant === 'hover' && `${glitchActiveClass}:opacity-70`,
          variant === 'subtle' && 'opacity-30'
        )}
        aria-hidden="true"
        style={{
          clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
          transform: isGlitching ? 'translate(2px, -1px)' : 'none',
        }}
      >
        {children}
      </Component>

      {/* Green channel glitch (for more chaotic effect) */}
      {variant === 'continuous' && (
        <Component
          className={cn(
            'absolute inset-0 text-cyber-primary opacity-0 transition-opacity duration-100',
            isGlitching && 'glitch-green'
          )}
          aria-hidden="true"
          style={{
            clipPath: 'polygon(0 20%, 100% 20%, 100% 80%, 0 80%)',
            transform: isGlitching ? 'translate(1px, 2px)' : 'none',
          }}
        >
          {children}
        </Component>
      )}

      <style>{`
        @keyframes glitch-anim-1 {
          0% { clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%); transform: translate(-2px, 1px); }
          20% { clip-path: polygon(0 15%, 100% 15%, 100% 55%, 0 55%); transform: translate(3px, -2px); }
          40% { clip-path: polygon(0 30%, 100% 30%, 100% 70%, 0 70%); transform: translate(-3px, 1px); }
          60% { clip-path: polygon(0 20%, 100% 20%, 100% 60%, 0 60%); transform: translate(2px, -1px); }
          80% { clip-path: polygon(0 10%, 100% 10%, 100% 50%, 0 50%); transform: translate(-1px, 2px); }
          100% { clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%); transform: translate(-2px, 1px); }
        }

        @keyframes glitch-anim-2 {
          0% { clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%); transform: translate(2px, -1px); }
          20% { clip-path: polygon(0 45%, 100% 45%, 100% 85%, 0 85%); transform: translate(-2px, 2px); }
          40% { clip-path: polygon(0 30%, 100% 30%, 100% 70%, 0 70%); transform: translate(3px, -1px); }
          60% { clip-path: polygon(0 40%, 100% 40%, 100% 80%, 0 80%); transform: translate(-2px, 1px); }
          80% { clip-path: polygon(0 50%, 100% 50%, 100% 90%, 0 90%); transform: translate(1px, -2px); }
          100% { clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%); transform: translate(2px, -1px); }
        }

        @keyframes glitch-anim-3 {
          0% { clip-path: polygon(0 20%, 100% 20%, 100% 80%, 0 80%); transform: translate(1px, 2px); }
          25% { clip-path: polygon(0 30%, 100% 30%, 100% 70%, 0 70%); transform: translate(-2px, -1px); }
          50% { clip-path: polygon(0 25%, 100% 25%, 100% 75%, 0 75%); transform: translate(2px, 1px); }
          75% { clip-path: polygon(0 15%, 100% 15%, 100% 85%, 0 85%); transform: translate(-1px, -2px); }
          100% { clip-path: polygon(0 20%, 100% 20%, 100% 80%, 0 80%); transform: translate(1px, 2px); }
        }

        @media (prefers-reduced-motion: no-preference) {
          .glitch-red {
            animation: glitch-anim-1 0.3s infinite;
            opacity: 0.7;
          }

          .glitch-blue {
            animation: glitch-anim-2 0.3s infinite;
            opacity: 0.7;
          }

          .glitch-green {
            animation: glitch-anim-3 0.3s infinite;
            opacity: 0.5;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .glitch-red,
          .glitch-blue,
          .glitch-green {
            animation: none;
            opacity: 0;
          }
        }
      `}</style>
    </motion.div>
  )
}
