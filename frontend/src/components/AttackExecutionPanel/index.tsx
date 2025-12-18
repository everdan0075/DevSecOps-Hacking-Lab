/**
 * AttackExecutionPanel Component
 *
 * Modal panel for executing attacks with parameter inputs and results
 */

import { useState, useEffect } from 'react'
import { X, Play, Loader2 } from 'lucide-react'
import type { AttackScenario, AttackLog } from '@/types/api'
import { attackService, COMMON_PASSWORDS, LEAKED_CREDENTIALS } from '@/services/attackService'
import honeypotService from '@/services/honeypotService'
import { AttackLogger } from './AttackLogger'
import { AttackResults } from './AttackResults'
import { renderParameters } from './AttackParameterForms'
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

  // Cleanup timer for tokenCopied state
  useEffect(() => {
    if (tokenCopied) {
      const timer = setTimeout(() => setTokenCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [tokenCopied])

  const copyRefreshToken = () => {
    navigator.clipboard.writeText(currentRefreshToken)
    setTokenCopied(true)
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

      // Try with correct password - backend returns challenge_id for MFA
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.challenge_id) {
        setMfaChallengeId(data.challenge_id)
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            level: 'success',
            message: `Challenge ID obtained: ${data.challenge_id}`,
          },
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `You can now execute the MFA brute force attack.`,
          },
        ])
      } else if (data.access_token) {
        // Already logged in, no MFA required
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            level: 'warning',
            message: `Login succeeded without MFA - this user may not have MFA enabled.`,
          },
        ])
      } else {
        throw new Error('Backend did not return challenge_id or access_token. Response: ' + JSON.stringify(data))
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
        {/* Header - Attack Name */}
        <div className="flex items-center justify-between p-4 border-b border-cyber-border bg-gradient-to-r from-cyber-bg via-cyber-surface to-cyber-bg">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-cyber-primary rounded-full"></div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-wide">{scenario.name}</h2>
                <p className="text-sm text-gray-400 mt-1">{scenario.description}</p>
              </div>
            </div>
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
