/**
 * AttackExecutionPanel Component
 *
 * Modal panel for executing attacks with parameter inputs and results
 */

import { useState, useEffect } from 'react'
import { X, Play, Loader2, Copy, Check } from 'lucide-react'
import type { AttackScenario, AttackLog } from '@/types/api'
import { attackService, COMMON_PASSWORDS, LEAKED_CREDENTIALS } from '@/services/attackService'
import honeypotService from '@/services/honeypotService'
import { AttackLogger } from './AttackLogger'
import { AttackResults } from './AttackResults'
import { cn } from '@/utils/cn'
import { STORAGE_KEYS } from '@/utils/constants'

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

  // Auto-load refresh token for Token Replay attack
  const [currentRefreshToken, setCurrentRefreshToken] = useState('')
  const [tokenCopied, setTokenCopied] = useState(false)
  const [challengeIdLoading, setChallengeIdLoading] = useState(false)

  useEffect(() => {
    if (scenario.id === 'token-replay') {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      if (refreshToken) {
        setCurrentRefreshToken(refreshToken)
      }
    }
  }, [scenario.id])

  const copyRefreshToken = () => {
    navigator.clipboard.writeText(currentRefreshToken)
    setTokenCopied(true)
    setTimeout(() => setTokenCopied(false), 2000)
  }

  const fetchChallengeId = async () => {
    setChallengeIdLoading(true)
    setLogs([
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Attempting login to get challenge_id...',
      },
    ])

    try {
      // Use Vite proxy path in dev, direct URL in prod
      const isDev = import.meta.env.DEV
      const loginUrl = isDev ? '/auth/login' : 'http://localhost:8080/auth/login'

      // IMPORTANT: Use WRONG password to ensure we get challenge_id
      // (correct password might skip to MFA directly)
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'WRONG_PASSWORD_TO_GET_CHALLENGE' }),
      })

      const data = await response.json()

      // If wrong password, backend should return challenge_id for retry
      // Let's try with correct password if first attempt didn't work
      if (!data.challenge_id) {
        const retryResponse = await fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin123' }),
        })
        const retryData = await retryResponse.json()

        if (retryData.challenge_id) {
          setMfaChallengeId(retryData.challenge_id)
          setLogs((prev) => [
            ...prev,
            {
              timestamp: new Date().toISOString(),
              level: 'success',
              message: `Challenge ID obtained: ${retryData.challenge_id}`,
            },
          ])
          return
        }
      }

      if (data.challenge_id) {
        setMfaChallengeId(data.challenge_id)
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            level: 'success',
            message: `Challenge ID obtained: ${data.challenge_id}`,
          },
        ])
      } else {
        throw new Error('Backend did not return challenge_id. Check backend logs.')
      }
    } catch (error) {
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Failed to get challenge ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ])
    } finally {
      setChallengeIdLoading(false)
    }
  }

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

        // Honeypot Attack Scenarios
        case 'honeypot-admin': {
          const honeypotResult = await honeypotService.scanAdminPanels()
          attackResult = {
            success: honeypotResult.success,
            summary: `Admin Panel Scan: ${honeypotResult.targets_probed} targets probed, ${honeypotResult.honeypots_triggered} honeypots triggered`,
            dataExtracted: {
              targets_found: honeypotResult.targets_found,
              honeypots_triggered: honeypotResult.honeypots_triggered,
              attack_detected: honeypotResult.attack_detected,
              metrics: honeypotResult.metrics,
            },
            metricsTriggered: ['gateway_honeypot_hits_total{path="/admin"}'],
          }
          setLogs(honeypotResult.logs)
          break
        }

        case 'honeypot-secrets': {
          const honeypotResult = await honeypotService.scanSecretFiles()
          attackResult = {
            success: honeypotResult.success,
            summary: `Secrets Scan: ${honeypotResult.targets_probed} targets probed, ${honeypotResult.honeypots_triggered} honeypots triggered`,
            dataExtracted: {
              targets_found: honeypotResult.targets_found,
              honeypots_triggered: honeypotResult.honeypots_triggered,
              attack_detected: honeypotResult.attack_detected,
              metrics: honeypotResult.metrics,
            },
            metricsTriggered: ['gateway_honeypot_hits_total{path="/.env"}'],
          }
          setLogs(honeypotResult.logs)
          break
        }

        case 'honeypot-git': {
          const honeypotResult = await honeypotService.scanGitExposure()
          attackResult = {
            success: honeypotResult.success,
            summary: `Git Exposure Scan: ${honeypotResult.targets_probed} targets probed, ${honeypotResult.honeypots_triggered} honeypots triggered`,
            dataExtracted: {
              targets_found: honeypotResult.targets_found,
              honeypots_triggered: honeypotResult.honeypots_triggered,
              attack_detected: honeypotResult.attack_detected,
              metrics: honeypotResult.metrics,
            },
            metricsTriggered: ['gateway_honeypot_hits_total{path="/.git/config"}'],
          }
          setLogs(honeypotResult.logs)
          break
        }

        case 'honeypot-config': {
          const honeypotResult = await honeypotService.scanConfigFiles()
          attackResult = {
            success: honeypotResult.success,
            summary: `Config File Scan: ${honeypotResult.targets_probed} targets probed, ${honeypotResult.honeypots_triggered} honeypots triggered`,
            dataExtracted: {
              targets_found: honeypotResult.targets_found,
              honeypots_triggered: honeypotResult.honeypots_triggered,
              attack_detected: honeypotResult.attack_detected,
              metrics: honeypotResult.metrics,
            },
            metricsTriggered: ['gateway_honeypot_hits_total{path="/config.json"}'],
          }
          setLogs(honeypotResult.logs)
          break
        }

        case 'honeypot-dbadmin': {
          const honeypotResult = await honeypotService.scanDatabaseAdmin()
          attackResult = {
            success: honeypotResult.success,
            summary: `Database Admin Scan: ${honeypotResult.targets_probed} targets probed, ${honeypotResult.honeypots_triggered} honeypots triggered`,
            dataExtracted: {
              targets_found: honeypotResult.targets_found,
              honeypots_triggered: honeypotResult.honeypots_triggered,
              attack_detected: honeypotResult.attack_detected,
              metrics: honeypotResult.metrics,
            },
            metricsTriggered: ['gateway_honeypot_hits_total{path="/phpmyadmin"}'],
          }
          setLogs(honeypotResult.logs)
          break
        }

        case 'honeypot-wordpress': {
          const honeypotResult = await honeypotService.scanWordPress()
          attackResult = {
            success: honeypotResult.success,
            summary: `WordPress Scan: ${honeypotResult.targets_probed} targets probed, ${honeypotResult.honeypots_triggered} honeypots triggered`,
            dataExtracted: {
              targets_found: honeypotResult.targets_found,
              honeypots_triggered: honeypotResult.honeypots_triggered,
              attack_detected: honeypotResult.attack_detected,
              metrics: honeypotResult.metrics,
            },
            metricsTriggered: ['gateway_honeypot_hits_total{path="/wp-admin"}'],
          }
          setLogs(honeypotResult.logs)
          break
        }

        case 'honeypot-apidocs': {
          const honeypotResult = await honeypotService.scanApiDocs()
          attackResult = {
            success: honeypotResult.success,
            summary: `API Documentation Scan: ${honeypotResult.targets_probed} targets probed, ${honeypotResult.honeypots_triggered} honeypots triggered`,
            dataExtracted: {
              targets_found: honeypotResult.targets_found,
              honeypots_triggered: honeypotResult.honeypots_triggered,
              attack_detected: honeypotResult.attack_detected,
              metrics: honeypotResult.metrics,
            },
            metricsTriggered: ['gateway_honeypot_hits_total{path="/swagger.json"}'],
          }
          setLogs(honeypotResult.logs)
          break
        }

        case 'honeypot-dirtraversal': {
          const honeypotResult = await honeypotService.scanSensitivePaths()
          attackResult = {
            success: honeypotResult.success,
            summary: `Directory Traversal Scan: ${honeypotResult.targets_probed} targets probed, ${honeypotResult.honeypots_triggered} honeypots triggered`,
            dataExtracted: {
              targets_found: honeypotResult.targets_found,
              honeypots_triggered: honeypotResult.honeypots_triggered,
              attack_detected: honeypotResult.attack_detected,
              metrics: honeypotResult.metrics,
            },
            metricsTriggered: ['gateway_honeypot_hits_total'],
          }
          setLogs(honeypotResult.logs)
          break
        }

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
              currentRefreshToken,
              tokenCopied,
              copyRefreshToken,
              challengeIdLoading,
              fetchChallengeId,
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
  currentRefreshToken: string
  tokenCopied: boolean
  copyRefreshToken: () => void
  challengeIdLoading: boolean
  fetchChallengeId: () => Promise<void>
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
        <div className="space-y-3">
          <div className="p-3 bg-cyber-primary/10 border border-cyber-primary/30 rounded-lg space-y-2">
            <div className="text-xs font-semibold text-cyber-primary mb-2">Demo Environment</div>
            <button
              type="button"
              onClick={props.fetchChallengeId}
              disabled={props.challengeIdLoading}
              className="w-full py-2 px-3 rounded bg-cyber-primary/20 hover:bg-cyber-primary/30 text-cyber-primary text-sm font-medium transition-colors border border-cyber-primary/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {props.challengeIdLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Getting Challenge ID...
                </>
              ) : (
                <>Get Challenge ID (Auto Login)</>
              )}
            </button>
            <div className="text-xs text-gray-500">
              Clicks login endpoint with admin credentials and retrieves challenge_id automatically
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Challenge ID</label>
            <input
              type="text"
              value={props.mfaChallengeId}
              onChange={(e) => props.setMfaChallengeId(e.target.value)}
              className={inputClass}
              placeholder="Click button above to get challenge ID"
              readOnly={props.challengeIdLoading}
            />
          </div>
        </div>
      )

    case 'token-replay':
      return (
        <div className="space-y-3">
          {/* Current Token Display */}
          {props.currentRefreshToken && (
            <div className="p-3 bg-cyber-primary/5 border border-cyber-primary/30 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-cyber-primary">Current Refresh Token</div>
                <button
                  onClick={props.copyRefreshToken}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-cyber-primary/20 hover:bg-cyber-primary/30 text-cyber-primary text-xs transition-colors"
                >
                  {props.tokenCopied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Token
                    </>
                  )}
                </button>
              </div>
              <div className="text-xs font-mono text-gray-400 break-all bg-cyber-bg/50 p-2 rounded">
                {props.currentRefreshToken.substring(0, 100)}...
              </div>
              <div className="text-xs text-cyber-warning">
                ⚠️ Copy this token, then logout to revoke it
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Revoked Refresh Token</label>
            <textarea
              value={props.tokenToReplay}
              onChange={(e) => props.setTokenToReplay(e.target.value)}
              className={cn(inputClass, 'font-mono text-xs h-24')}
              placeholder="Paste the revoked token here after logout"
            />
          </div>

          <div className="p-3 bg-cyber-bg/50 border border-cyber-border/50 rounded text-xs text-gray-400 space-y-1">
            <div className="font-semibold text-cyber-warning">Steps to Test Token Replay:</div>
            <ol className="list-decimal list-inside space-y-0.5 ml-2">
              <li>Login using Authentication Panel below</li>
              <li>Click "Copy Token" button above</li>
              <li>Click "Logout" in Authentication Panel (this revokes the token)</li>
              <li>Paste the copied token in the textarea above</li>
              <li>Execute attack - backend should reject the revoked token</li>
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

    case 'honeypot-admin':
    case 'honeypot-secrets':
    case 'honeypot-git':
    case 'honeypot-config':
    case 'honeypot-dbadmin':
    case 'honeypot-wordpress':
    case 'honeypot-apidocs':
    case 'honeypot-dirtraversal':
      return (
        <div className="space-y-2">
          <div className="text-xs text-gray-400">
            This reconnaissance attack scans for common attacker targets. No parameters required.
          </div>
          <div className="p-3 bg-cyber-warning/10 border border-cyber-warning/30 rounded-lg">
            <div className="text-xs font-semibold text-cyber-warning mb-1">Honeypot Detection</div>
            <div className="text-xs text-gray-400">
              This attack will trigger honeypots and log your activity. Perfect for testing intrusion detection systems.
            </div>
          </div>
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
