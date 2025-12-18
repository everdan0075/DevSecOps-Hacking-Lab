/**
 * Shared types for AttackExecutionPanel components
 */

import type { AttackLog } from '@/types/api'

export interface ExecutionResult {
  success: boolean
  summary: string
  dataExtracted?: Record<string, unknown>
  metricsTriggered?: string[]
}

export interface AttackFormProps {
  onExecute: (attackFn: () => Promise<ExecutionResult>) => void
  isExecuting: boolean
}

export interface AttackState {
  isExecuting: boolean
  logs: AttackLog[]
  result: ExecutionResult | null
}
