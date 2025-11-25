/**
 * Backend Status Indicator Component
 *
 * Displays connection status to backend services with visual feedback
 */

import { useState, useEffect } from 'react'
import { useBackendStatus } from '@/hooks/useBackendStatus'
import { Activity, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'

interface BackendStatusIndicatorProps {
  variant?: 'compact' | 'detailed'
  className?: string
}

export function BackendStatusIndicator({ variant = 'compact', className }: BackendStatusIndicatorProps) {
  const { isConnected, isChecking, checkStatus, services, latency, lastCheck } = useBackendStatus()
  const [currentTime, setCurrentTime] = useState(Date.now())

  const statusIcon = isConnected ? (
    <CheckCircle className="w-4 h-4" />
  ) : (
    <AlertCircle className="w-4 h-4" />
  )

  const statusText = isConnected ? 'Connected' : 'Disconnected'
  const statusColor = isConnected ? 'text-cyber-success' : 'text-cyber-danger'

  // Update current time every second for accurate "time since check" display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const timeSinceCheck = Math.floor((currentTime - lastCheck) / 1000)

  if (variant === 'compact') {
    return (
      <button
        onClick={checkStatus}
        disabled={isChecking}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg relative',
          'bg-cyber-surface border border-cyber-border',
          'hover:border-cyber-primary/50 transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        title="Click to refresh connection status"
      >
        {/* Pulsing glow effect when connected */}
        {isConnected && !isChecking && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-cyber-success/20 blur-md"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [0.98, 1.02, 0.98]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{
              zIndex: -1,
              filter: 'blur(8px)'
            }}
          />
        )}

        {isChecking ? (
          <RefreshCw className="w-4 h-4 animate-spin text-cyber-primary" />
        ) : (
          <div className={cn(statusColor, 'flex items-center gap-2')}>
            <motion.div
              animate={isConnected ? {
                scale: [1, 1.2, 1],
              } : {}}
              transition={{
                duration: 2,
                repeat: isConnected ? Infinity : 0,
                ease: 'easeInOut'
              }}
            >
              {statusIcon}
            </motion.div>
            <span className="text-sm font-medium">{statusText}</span>
          </div>
        )}
        {isConnected && latency && (
          <span className="text-xs text-gray-400">({latency}ms)</span>
        )}
      </button>
    )
  }

  // Detailed variant
  return (
    <div className={cn('p-4 rounded-lg bg-cyber-surface border border-cyber-border', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Activity className={cn('w-5 h-5', statusColor)} />
          <div>
            <h3 className="text-lg font-semibold">Backend Status</h3>
            <p className="text-sm text-gray-400">
              Last checked {timeSinceCheck}s ago
            </p>
          </div>
        </div>
        <button
          onClick={checkStatus}
          disabled={isChecking}
          className={cn(
            'p-2 rounded-lg bg-cyber-bg border border-cyber-border',
            'hover:border-cyber-primary/50 transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', isChecking && 'animate-spin')} />
        </button>
      </div>

      <div className="space-y-2">
        <ServiceStatus name="API Gateway" isUp={services.gateway} />
        <ServiceStatus name="Auth Service" isUp={services.auth} />
        <ServiceStatus name="User Service" isUp={services.user_service} />
        <ServiceStatus name="Incident Bot" isUp={services.incident_bot} />
        <ServiceStatus name="Prometheus" isUp={services.prometheus} />
        <ServiceStatus name="Grafana" isUp={services.grafana} />
      </div>

      {!isConnected && (
        <div className="mt-4 p-3 rounded-lg bg-cyber-danger/10 border border-cyber-danger/30">
          <p className="text-sm text-cyber-danger">
            Backend not detected. Run <code className="px-1 bg-black/50 rounded">docker-compose up -d</code> to start services.
          </p>
        </div>
      )}
    </div>
  )
}

interface ServiceStatusProps {
  name: string
  isUp: boolean
}

function ServiceStatus({ name, isUp }: ServiceStatusProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-cyber-bg/50">
      <span className="text-sm">{name}</span>
      <div className={cn('flex items-center gap-2', isUp ? 'text-cyber-success' : 'text-gray-500')}>
        <div className={cn('w-2 h-2 rounded-full', isUp ? 'bg-cyber-success' : 'bg-gray-500')} />
        <span className="text-xs">{isUp ? 'UP' : 'DOWN'}</span>
      </div>
    </div>
  )
}
