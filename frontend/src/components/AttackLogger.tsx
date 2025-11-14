/**
 * AttackLogger Component
 *
 * Terminal-style log output for attack execution
 */

import { useEffect, useRef } from 'react'
import { Terminal, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import type { AttackLog } from '@/types/api'
import { cn } from '@/utils/cn'

interface AttackLoggerProps {
  logs: AttackLog[]
  isRunning?: boolean
  className?: string
}

const LEVEL_ICONS = {
  info: Info,
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
}

const LEVEL_COLORS = {
  info: 'text-cyber-secondary',
  success: 'text-cyber-success',
  error: 'text-cyber-danger',
  warning: 'text-cyber-warning',
}

export function AttackLogger({ logs, isRunning, className }: AttackLoggerProps) {
  const logEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div
      className={cn(
        'bg-cyber-bg border border-cyber-border rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-cyber-surface border-b border-cyber-border">
        <Terminal className="w-4 h-4 text-cyber-primary" />
        <span className="text-sm font-mono text-gray-400">Attack Execution Log</span>
        {isRunning && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-cyber-success rounded-full animate-pulse" />
            <span className="text-xs text-cyber-success">Running...</span>
          </div>
        )}
      </div>

      {/* Log Content */}
      <div className="h-96 overflow-y-auto p-4 space-y-2 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No logs yet. Start an attack to see execution output.
          </div>
        ) : (
          <>
            {logs.map((log, index) => (
              <LogEntry key={index} log={log} />
            ))}
            <div ref={logEndRef} />
          </>
        )}
      </div>
    </div>
  )
}

function LogEntry({ log }: { log: AttackLog }) {
  const Icon = LEVEL_ICONS[log.level]
  const color = LEVEL_COLORS[log.level]

  const timestamp = new Date(log.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="flex items-start gap-2 group">
      <span className="text-gray-600 select-none">{timestamp}</span>
      <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', color)} />
      <span className={cn('flex-1', color)}>{log.message}</span>
    </div>
  )
}
