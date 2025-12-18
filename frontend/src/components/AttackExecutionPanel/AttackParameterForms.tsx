/**
 * Attack Parameter Form Components
 *
 * Extracted from AttackExecutionPanel to reduce file size
 */

import { Loader2, Copy, Check } from 'lucide-react'
import { COMMON_PASSWORDS } from '@/services/attackService'
import { cn } from '@/utils/cn'

const inputClass =
  'w-full px-3 py-2 bg-cyber-surface border border-cyber-border rounded text-white text-sm focus:outline-none focus:border-cyber-primary'

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

export function BruteForceParameterForm(props: Pick<ParameterProps, 'bruteForceTarget' | 'setBruteForceTarget'>) {
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
}

export function IdorParameterForm(props: Pick<ParameterProps, 'idorTargets' | 'setIdorTargets'>) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">
        Target User IDs (comma-separated)
      </label>
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
}

export function RateLimitParameterForm(props: Pick<ParameterProps, 'rateLimitCount' | 'setRateLimitCount'>) {
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
}

export function MfaParameterForm(
  props: Pick<ParameterProps, 'mfaChallengeId' | 'setMfaChallengeId' | 'challengeIdLoading' | 'fetchChallengeId'>
) {
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
}

export function TokenReplayParameterForm(
  props: Pick<ParameterProps, 'tokenToReplay' | 'setTokenToReplay' | 'currentRefreshToken' | 'tokenCopied' | 'copyRefreshToken'>
) {
  return (
    <div className="space-y-3">
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
}

export function NoParametersForm() {
  return (
    <div className="text-xs text-gray-400">
      This attack requires no additional parameters. Click "Execute Attack" to begin.
    </div>
  )
}

export function HoneypotParametersForm() {
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-400">
        This reconnaissance attack scans for common attacker targets. No parameters required.
      </div>
      <div className="p-3 bg-cyber-warning/10 border border-cyber-warning/30 rounded-lg">
        <div className="text-xs font-semibold text-cyber-warning mb-1">Honeypot Detection</div>
        <div className="text-xs text-gray-400">
          This attack will trigger honeypots and log your activity. Perfect for testing intrusion
          detection systems.
        </div>
      </div>
    </div>
  )
}

export function renderParameters(scenarioId: string, props: ParameterProps) {
  switch (scenarioId) {
    case 'brute-force':
      return <BruteForceParameterForm {...props} />
    case 'idor-exploit':
      return <IdorParameterForm {...props} />
    case 'rate-limit-bypass':
      return <RateLimitParameterForm {...props} />
    case 'mfa-bruteforce':
      return <MfaParameterForm {...props} />
    case 'token-replay':
      return <TokenReplayParameterForm {...props} />
    case 'direct-access':
    case 'credential-stuffing':
      return <NoParametersForm />
    case 'honeypot-admin':
    case 'honeypot-secrets':
    case 'honeypot-git':
    case 'honeypot-config':
    case 'honeypot-dbadmin':
    case 'honeypot-wordpress':
    case 'honeypot-apidocs':
    case 'honeypot-dirtraversal':
      return <HoneypotParametersForm />
    default:
      return (
        <div className="text-xs text-gray-400">
          No parameters required for this attack scenario.
        </div>
      )
  }
}
