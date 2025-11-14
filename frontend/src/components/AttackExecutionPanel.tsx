/**
 * AttackExecutionPanel Component
 *
 * Modal panel for executing attacks with parameter inputs and results
 */

import { useState } from 'react'
import { X, Play, Loader2 } from 'lucide-react'
import type { AttackScenario, AttackLog } from '@/types/api'
import { attackService, COMMON_PASSWORDS, LEAKED_CREDENTIALS } from '@/services/attackService'
import { AttackLogger } from './AttackLogger'
import { AttackResults } from './AttackResults'
import { cn } from '@/utils/cn'

interface AttackExecutionPanelProps {
  scenario: AttackScenario
  onClose: () => void
}

interface ExecutionResult {
  success: boolean
  summary: string
  dataExtracted?: Record<string, unknown>
  metricsTriggered?: string[]
}

export function AttackExecutionPanel({ scenario, onClose }: AttackExecutionPanelProps) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [logs, setLogs] = useState<AttackLog[]>([])
  const [result, setResult] = useState<ExecutionResult | null>(null)

  // Attack parameters
  const [bruteForceTarget, setBruteForceTarget] = useState('admin')
  const [idorTargets, setIdorTargets] = useState('1,2,3,4,5')
  const [rateLimitCount, setRateLimitCount] = useState('100')
  const [mfaChallengeId, setMfaChallengeId] = useState('')
  const [tokenToReplay, setTokenToReplay] = useState('')

  const handleLogUpdate = (log: AttackLog) => {
    setLogs((prev) => [...prev, log])
  }

  const executeAttack = async () => {
    setIsExecuting(true)
    setLogs([])
    setResult(null)

    try {
      let attackResult: ExecutionResult

      switch (scenario.id) {
        case 'brute-force':
          attackResult = await attackService.executeBruteForce(
            bruteForceTarget,
            COMMON_PASSWORDS,
            handleLogUpdate
          )
          break

        case 'idor-exploit':
          attackResult = await attackService.executeIDOR(
            idorTargets.split(',').map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id)),
            handleLogUpdate
          )
          break

        case 'direct-access':
          attackResult = await attackService.executeDirectAccess(handleLogUpdate)
          break

        case 'rate-limit-bypass':
          attackResult = await attackService.executeRateLimitBypass(
            parseInt(rateLimitCount, 10),
            handleLogUpdate
          )
          break

        case 'mfa-bruteforce':
          if (!mfaChallengeId) {
            setLogs([
              {
                timestamp: new Date().toISOString(),
                level: 'error',
                message: 'Challenge ID required. Login first to get a challenge ID.',
              },
            ])
            return
          }
          attackResult = await attackService.executeMFABruteforce(
            mfaChallengeId,
            { start: 0, end: 100 },
            handleLogUpdate
          )
          break

        case 'token-replay':
          if (!tokenToReplay) {
            setLogs([
              {
                timestamp: new Date().toISOString(),
                level: 'error',
                message: 'Refresh token required. Logout first to get a revoked token.',
              },
            ])
            return
          }
          attackResult = await attackService.executeTokenReplay(tokenToReplay, handleLogUpdate)
          break

        case 'credential-stuffing':
          attackResult = await attackService.executeCredentialStuffing(
            LEAKED_CREDENTIALS,
            handleLogUpdate
          )
          break

        default:
          attackResult = {
            success: false,
            summary: 'Unknown attack scenario',
          }
      }

      setResult(attackResult)
    } catch (error: unknown) {
      const err = error as { message?: string }
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Attack execution failed: ${err.message || 'Unknown error'}`,
        },
      ])
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] bg-cyber-surface border border-cyber-border rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyber-border bg-cyber-bg/50">
          <div>
            <h2 className="text-xl font-bold text-white">{scenario.name}</h2>
            <p className="text-sm text-gray-400 mt-1">{scenario.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-cyber-bg border border-cyber-border hover:border-cyber-danger/50 text-gray-400 hover:text-cyber-danger transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Prerequisites */}
          {scenario.requires_auth && (
            <div className="p-4 bg-cyber-warning/10 border border-cyber-warning/30 rounded-lg">
              <div className="text-sm font-semibold text-cyber-warning mb-1">
                Authentication Required
              </div>
              <div className="text-xs text-gray-400">
                This attack requires you to be authenticated. Please login first using the
                authentication panel.
              </div>
            </div>
          )}

          {/* Attack Parameters */}
          <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Attack Parameters</h3>
            {renderParameters(scenario.id, {
              bruteForceTarget,
              setBruteForceTarget,
              idorTargets,
              setIdorTargets,
              rateLimitCount,
              setRateLimitCount,
              mfaChallengeId,
              setMfaChallengeId,
              tokenToReplay,
              setTokenToReplay,
            })}
          </div>

          {/* Execution */}
          {!isExecuting && !result && (
            <button
              onClick={executeAttack}
              className="w-full py-3 px-4 rounded-lg font-medium bg-cyber-primary text-cyber-bg hover:bg-cyber-primary/90 hover:shadow-lg hover:shadow-cyber-primary/30 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Execute Attack
            </button>
          )}

          {/* Loading */}
          {isExecuting && (
            <div className="flex items-center justify-center gap-2 py-8 text-cyber-primary">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Executing attack...</span>
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && <AttackLogger logs={logs} isRunning={isExecuting} />}

          {/* Results */}
          {result && !isExecuting && (
            <AttackResults
              success={result.success}
              summary={result.summary}
              dataExtracted={result.dataExtracted}
              metricsTriggered={result.metricsTriggered}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyber-border bg-cyber-bg/50 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Target: <code className="font-mono text-cyber-secondary">{scenario.target_endpoint}</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-cyber-border text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

interface ParameterProps {
  bruteForceTarget: string
  setBruteForceTarget: (value: string) => void
  idorTargets: string
  setIdorTargets: (value: string) => void
  rateLimitCount: string
  setRateLimitCount: (value: string) => void
  mfaChallengeId: string
  setMfaChallengeId: (value: string) => void
  tokenToReplay: string
  setTokenToReplay: (value: string) => void
}

function renderParameters(scenarioId: string, props: ParameterProps) {
  const inputClass =
    'w-full px-3 py-2 bg-cyber-surface border border-cyber-border rounded text-white text-sm focus:outline-none focus:border-cyber-primary'

  switch (scenarioId) {
    case 'brute-force':
      return (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Target Username</label>
          <input
            type="text"
            value={props.bruteForceTarget}
            onChange={(e) => props.setBruteForceTarget(e.target.value)}
            className={inputClass}
            placeholder="admin"
          />
          <div className="text-xs text-gray-500 mt-1">
            Will test {COMMON_PASSWORDS.length} common passwords
          </div>
        </div>
      )

    case 'idor-exploit':
      return (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Target User IDs (comma-separated)</label>
          <input
            type="text"
            value={props.idorTargets}
            onChange={(e) => props.setIdorTargets(e.target.value)}
            className={inputClass}
            placeholder="1,2,3,4,5"
          />
          <div className="text-xs text-gray-500 mt-1">
            Example: 1,2,3,4,5 will attempt to access profiles for these user IDs
          </div>
        </div>
      )

    case 'rate-limit-bypass':
      return (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Number of Requests</label>
          <input
            type="number"
            value={props.rateLimitCount}
            onChange={(e) => props.setRateLimitCount(e.target.value)}
            className={inputClass}
            placeholder="100"
            min="10"
            max="200"
          />
          <div className="text-xs text-gray-500 mt-1">
            Gateway rate limit is 60 requests per minute
          </div>
        </div>
      )

    case 'mfa-bruteforce':
      return (
        <div className="space-y-2">
          <label className="text-xs text-gray-400 mb-1 block">Challenge ID</label>
          <input
            type="text"
            value={props.mfaChallengeId}
            onChange={(e) => props.setMfaChallengeId(e.target.value)}
            className={inputClass}
            placeholder="Get this from login response"
          />
          <div className="p-3 bg-cyber-bg/50 border border-cyber-border/50 rounded text-xs text-gray-400 space-y-1">
            <div className="font-semibold text-cyber-warning">How to get Challenge ID:</div>
            <ol className="list-decimal list-inside space-y-0.5 ml-2">
              <li>Open browser DevTools (F12) → Network tab</li>
              <li>Login using Authentication Panel (admin/admin123)</li>
              <li>Find POST request to /auth/login</li>
              <li>Copy the "challenge_id" from the response JSON</li>
              <li>Paste it here and execute the attack</li>
            </ol>
          </div>
        </div>
      )

    case 'token-replay':
      return (
        <div className="space-y-2">
          <label className="text-xs text-gray-400 mb-1 block">Revoked Refresh Token</label>
          <textarea
            value={props.tokenToReplay}
            onChange={(e) => props.setTokenToReplay(e.target.value)}
            className={cn(inputClass, 'font-mono text-xs h-24')}
            placeholder="Paste a refresh token that was revoked via logout"
          />
          <div className="p-3 bg-cyber-bg/50 border border-cyber-border/50 rounded text-xs text-gray-400 space-y-1">
            <div className="font-semibold text-cyber-warning">How to get Revoked Token:</div>
            <ol className="list-decimal list-inside space-y-0.5 ml-2">
              <li>Login using Authentication Panel</li>
              <li>Click "Show Token Details" and copy the Refresh Token</li>
              <li>Click "Logout" button (this revokes the token in Redis)</li>
              <li>Paste the copied token here</li>
              <li>Execute attack - it should be rejected</li>
            </ol>
          </div>
        </div>
      )

    case 'direct-access':
    case 'credential-stuffing':
      return (
        <div className="text-xs text-gray-400">
          This attack requires no additional parameters. Click "Execute Attack" to begin.
        </div>
      )

    default:
      return (
        <div className="text-xs text-gray-400">
          No parameters required for this attack scenario.
        </div>
      )
  }
}
