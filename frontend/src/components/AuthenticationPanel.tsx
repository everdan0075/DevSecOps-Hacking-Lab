/**
 * AuthenticationPanel Component
 *
 * Handles login + MFA flow for attack scenarios requiring authentication
 */

import { useState, useEffect } from 'react'
import { User, Lock, Shield, LogOut, Clock, Key } from 'lucide-react'
import { authService } from '@/services/authService'
import { DEMO_USERS } from '@/utils/constants'
import { cn } from '@/utils/cn'
import type { LoginResponse } from '@/types/api'

interface AuthenticationPanelProps {
  onAuthSuccess?: () => void
}

export function AuthenticationPanel({ onAuthSuccess }: AuthenticationPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null)

  // Login form state
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // MFA state
  const [showMfa, setShowMfa] = useState(false)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false)
  const [mfaError, setMfaError] = useState<string | null>(null)

  // Token display state
  const [showTokenDetails, setShowTokenDetails] = useState(false)

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated()
      setIsAuthenticated(authenticated)

      if (authenticated) {
        const token = authService.getAccessToken()
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            setCurrentUser(payload.sub || 'Unknown')
          } catch {
            setCurrentUser('Unknown')
          }
        }

        const expiry = authService.getTokenExpiryTime()
        setTokenExpiry(expiry)
      }
    }

    checkAuth()
    const interval = setInterval(checkAuth, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setIsLoggingIn(true)

    try {
      const response: LoginResponse = await authService.login({ username, password })

      if (response.requires_mfa && response.challenge_id) {
        setChallengeId(response.challenge_id)
        setShowMfa(true)
      } else {
        setLoginError('Unexpected response from server')
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      setLoginError(err.message || 'Login failed')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challengeId) return

    setMfaError(null)
    setIsVerifyingMfa(true)

    try {
      await authService.verifyMfa({ challenge_id: challengeId, code: mfaCode })

      setIsAuthenticated(true)
      setCurrentUser(username)
      setShowMfa(false)
      setChallengeId(null)
      setMfaCode('')

      onAuthSuccess?.()
    } catch (error: unknown) {
      const err = error as { message?: string }
      setMfaError(err.message || 'MFA verification failed')
    } finally {
      setIsVerifyingMfa(false)
    }
  }

  const handleLogout = async () => {
    await authService.logout()
    setIsAuthenticated(false)
    setCurrentUser(null)
    setTokenExpiry(null)
    setShowMfa(false)
    setChallengeId(null)
    setMfaCode('')
  }

  const selectDemoUser = (user: (typeof DEMO_USERS)[number]) => {
    setUsername(user.username)
    setPassword(user.password)
  }

  if (isAuthenticated) {
    return (
      <div className="bg-cyber-surface border border-cyber-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyber-success/10 border border-cyber-success/30 rounded-lg">
              <User className="w-5 h-5 text-cyber-success" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Authenticated</div>
              <div className="text-xs text-gray-400">User: {currentUser}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger hover:bg-cyber-danger/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Token Expiry */}
        {tokenExpiry !== null && (
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <Clock className="w-3 h-3" />
            Token expires in: {Math.floor(tokenExpiry / 60)}m {tokenExpiry % 60}s
          </div>
        )}

        {/* Token Details Toggle */}
        <button
          onClick={() => setShowTokenDetails(!showTokenDetails)}
          className="text-xs text-cyber-primary hover:text-cyber-secondary transition-colors"
        >
          {showTokenDetails ? 'Hide' : 'Show'} Token Details
        </button>

        {showTokenDetails && (
          <div className="mt-3 p-3 bg-cyber-bg rounded border border-cyber-border">
            <div className="text-xs text-gray-500 mb-1">Access Token:</div>
            <div className="text-xs font-mono text-gray-400 break-all">
              {authService.getAccessToken()?.substring(0, 100)}...
            </div>
          </div>
        )}
      </div>
    )
  }

  if (showMfa) {
    return (
      <div className="bg-cyber-surface border border-cyber-border rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-cyber-warning/10 border border-cyber-warning/30 rounded-lg">
            <Shield className="w-5 h-5 text-cyber-warning" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">MFA Verification Required</div>
            <div className="text-xs text-gray-400">Enter 6-digit code</div>
          </div>
        </div>

        <div className="p-3 bg-cyber-bg/50 rounded border border-cyber-border mb-4">
          <div className="text-xs text-gray-500 mb-1">Demo Environment:</div>
          <div className="text-xs text-gray-400">
            Check backend logs for MFA code or use TOTP with secret:
          </div>
          <code className="text-xs font-mono text-cyber-primary">
            DEVSECOPSTWENTYFOURHACKINGLAB
          </code>
        </div>

        <form onSubmit={handleMfaVerify} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">MFA Code</label>
            <input
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-cyber-primary"
              autoFocus
            />
          </div>

          {mfaError && (
            <div className="p-2 bg-cyber-danger/10 border border-cyber-danger/30 rounded text-xs text-cyber-danger">
              {mfaError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowMfa(false)
                setChallengeId(null)
                setMfaCode('')
              }}
              className="flex-1 py-2 px-4 rounded bg-cyber-bg border border-cyber-border text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifyingMfa || mfaCode.length !== 6}
              className={cn(
                'flex-1 py-2 px-4 rounded font-medium transition-all',
                'flex items-center justify-center gap-2',
                isVerifyingMfa || mfaCode.length !== 6
                  ? 'bg-cyber-border text-gray-500 cursor-not-allowed'
                  : 'bg-cyber-primary text-cyber-bg hover:bg-cyber-primary/90'
              )}
            >
              <Shield className="w-4 h-4" />
              {isVerifyingMfa ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="bg-cyber-surface border border-cyber-border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-cyber-primary/10 border border-cyber-primary/30 rounded-lg">
          <Lock className="w-5 h-5 text-cyber-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Authentication Required</div>
          <div className="text-xs text-gray-400">Login with demo credentials</div>
        </div>
      </div>

      {/* Demo Users Quick Select */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">Quick Select:</div>
        <div className="flex gap-2">
          {DEMO_USERS.map((user) => (
            <button
              key={user.username}
              onClick={() => selectDemoUser(user)}
              className="text-xs px-3 py-1.5 rounded bg-cyber-bg border border-cyber-border text-gray-400 hover:border-cyber-primary/50 hover:text-cyber-primary transition-colors"
            >
              {user.username}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded text-white focus:outline-none focus:border-cyber-primary"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded text-white focus:outline-none focus:border-cyber-primary"
            autoComplete="current-password"
          />
        </div>

        {loginError && (
          <div className="p-2 bg-cyber-danger/10 border border-cyber-danger/30 rounded text-xs text-cyber-danger">
            {loginError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoggingIn}
          className={cn(
            'w-full py-2 px-4 rounded font-medium transition-all',
            'flex items-center justify-center gap-2',
            isLoggingIn
              ? 'bg-cyber-border text-gray-500 cursor-not-allowed'
              : 'bg-cyber-primary text-cyber-bg hover:bg-cyber-primary/90'
          )}
        >
          <Key className="w-4 h-4" />
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
