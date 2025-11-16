/**
 * Attack Execution Service
 *
 * Provides real attack execution functions for all 7 scenarios
 * NO MOCKING - All attacks execute real API calls
 */

import { apiClient } from './apiClient'
import { ENDPOINTS, DEMO_USERS } from '@/utils/constants'
import type { AttackLog, UserProfile } from '@/types/api'

export type AttackProgressCallback = (log: AttackLog) => void

interface AttackExecutionResult {
  success: boolean
  logs: AttackLog[]
  summary: string
  dataExtracted?: Record<string, unknown>
  metricsTriggered?: string[]
}

class AttackService {
  private securityEnabled: boolean = true

  /**
   * Set security mode (affects which endpoints are used)
   * @param enabled - true = use gateway (security ON), false = direct access (security OFF)
   */
  setSecurityMode(enabled: boolean): void {
    console.log(`[AttackService] Security mode changed: ${enabled ? 'ON (gateway)' : 'OFF (direct access)'}`)
    this.securityEnabled = enabled
  }

  /**
   * Get current security mode
   */
  getSecurityMode(): boolean {
    return this.securityEnabled
  }

  /**
   * Get endpoint URL based on security mode
   * Security ON: use gateway endpoints (with JWT, WAF, rate limiting)
   * Security OFF: use direct service access (bypass all protections)
   */
  private getLoginEndpoint(): string {
    return this.securityEnabled ? ENDPOINTS.AUTH.LOGIN : ENDPOINTS.DIRECT_ACCESS.AUTH.LOGIN
  }

  private getMFAVerifyEndpoint(): string {
    return this.securityEnabled ? ENDPOINTS.AUTH.MFA_VERIFY : ENDPOINTS.DIRECT_ACCESS.AUTH.MFA_VERIFY
  }

  private getRefreshEndpoint(): string {
    return this.securityEnabled ? ENDPOINTS.AUTH.REFRESH : ENDPOINTS.DIRECT_ACCESS.AUTH.REFRESH
  }

  private getUserProfileEndpoint(userId: number): string {
    return this.securityEnabled ? ENDPOINTS.USER.PROFILE(userId) : ENDPOINTS.DIRECT_ACCESS.USER.PROFILE(userId)
  }

  private getUserHealthEndpoint(): string {
    return this.securityEnabled ? ENDPOINTS.GATEWAY.HEALTH : ENDPOINTS.DIRECT_ACCESS.USER.HEALTH
  }

  /**
   * Add log entry with timestamp
   */
  private log(
    message: string,
    level: 'info' | 'success' | 'error' | 'warning',
    callback?: AttackProgressCallback
  ): AttackLog {
    const logEntry: AttackLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
    }
    if (callback) {
      callback(logEntry)
    }
    return logEntry
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Execute POST request (respects security mode)
   * Security ON: use apiClient (goes through gateway with JWT)
   * Security OFF: use fetch (direct access, bypass gateway)
   */
  private async post<T>(url: string, data: unknown): Promise<T> {
    if (this.securityEnabled) {
      // Security ON: use apiClient (gateway + JWT + WAF + rate limiting)
      return apiClient.post<T>(url, data)
    } else {
      // Security OFF: direct access (bypass all protections)
      // Use full URL to bypass Vite proxy
      const fullUrl = url.startsWith('http') ? url : `http://localhost:8000${url.replace('/direct/auth-service', '')}`
      console.log(`[POST] Fetching: ${fullUrl}`)

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Direct-Access': 'true', // Signal to backend: bypass rate limiting
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw {
          status: response.status,
          message: response.statusText || 'Request failed',
        }
      }

      return response.json()
    }
  }

  /**
   * Execute GET request (respects security mode)
   */
  private async get<T>(url: string): Promise<T> {
    if (this.securityEnabled) {
      // Security ON: use apiClient
      return apiClient.get<T>(url)
    } else {
      // Security OFF: direct access
      // Determine service port based on URL
      let fullUrl = url
      if (!url.startsWith('http')) {
        if (url.includes('/direct/user-service')) {
          fullUrl = `http://localhost:8002${url.replace('/direct/user-service', '')}`
        } else if (url.includes('/direct/auth-service')) {
          fullUrl = `http://localhost:8000${url.replace('/direct/auth-service', '')}`
        }
      }
      console.log(`[GET] Fetching: ${fullUrl}`)

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Direct-Access': 'true', // Signal to backend: bypass rate limiting
        },
      })

      if (!response.ok) {
        throw {
          status: response.status,
          message: response.statusText || 'Request failed',
        }
      }

      return response.json()
    }
  }

  /**
   * ATTACK 1: Brute Force
   * Try multiple username/password combinations
   */
  async executeBruteForce(
    targetUsername: string,
    passwordList: string[],
    onProgress?: AttackProgressCallback
  ): Promise<AttackExecutionResult> {
    const logs: AttackLog[] = []
    let successfulAttempts = 0
    let blockedRequests = 0

    console.log(`[BruteForce] Security mode: ${this.securityEnabled ? 'ON' : 'OFF'}`)
    console.log(`[BruteForce] Endpoint: ${this.getLoginEndpoint()}`)

    logs.push(this.log(`Starting brute force attack on user: ${targetUsername}`, 'info', onProgress))
    logs.push(this.log(`Testing ${passwordList.length} passwords...`, 'info', onProgress))

    for (let i = 0; i < passwordList.length; i++) {
      const password = passwordList[i]

      try {
        logs.push(
          this.log(`[${i + 1}/${passwordList.length}] Trying: ${password}`, 'info', onProgress)
        )

        const response = await this.post<{ success: boolean }>(this.getLoginEndpoint(), {
          username: targetUsername,
          password,
        })

        if (response && response.success) {
          successfulAttempts++
          logs.push(
            this.log(
              `SUCCESS! Valid credentials found: ${targetUsername}:${password}`,
              'success',
              onProgress
            )
          )
          break
        }

        // Small delay to avoid overwhelming the server
        await this.delay(100)
      } catch (error: unknown) {
        const err = error as { status?: number; message?: string }
        if (err.status === 429) {
          blockedRequests++
          logs.push(
            this.log(`Rate limit triggered! Request blocked by gateway`, 'warning', onProgress)
          )
        } else {
          logs.push(
            this.log(
              `Failed attempt ${i + 1}: ${err.message || 'Unknown error'}`,
              'error',
              onProgress
            )
          )
        }
      }
    }

    const summary =
      successfulAttempts > 0
        ? `Brute force successful! Found ${successfulAttempts} valid credential(s). Blocked requests: ${blockedRequests}`
        : `Brute force failed. All ${passwordList.length} passwords rejected. Blocked requests: ${blockedRequests}`

    logs.push(this.log(summary, successfulAttempts > 0 ? 'success' : 'info', onProgress))

    return {
      success: successfulAttempts > 0,
      logs,
      summary,
      metricsTriggered: ['login_attempts_total', 'login_failures_total', 'gateway_rate_limit_blocks_total'],
    }
  }

  /**
   * ATTACK 2: IDOR Exploitation
   * Access other users' profiles without authorization
   */
  async executeIDOR(
    targetUserIds: number[],
    onProgress?: AttackProgressCallback
  ): Promise<AttackExecutionResult> {
    const logs: AttackLog[] = []
    const extractedProfiles: UserProfile[] = []

    logs.push(this.log('Starting IDOR exploitation...', 'info', onProgress))
    logs.push(this.log(`Attempting to access ${targetUserIds.length} user profiles`, 'info', onProgress))

    for (const userId of targetUserIds) {
      try {
        logs.push(this.log(`Requesting profile for user_id: ${userId}`, 'info', onProgress))

        const profile = await this.get<UserProfile>(this.getUserProfileEndpoint(userId))

        extractedProfiles.push(profile)
        logs.push(
          this.log(
            `SUCCESS! Extracted profile: ${profile.username} (SSN: ${profile.ssn})`,
            'success',
            onProgress
          )
        )

        await this.delay(200)
      } catch (error: unknown) {
        const err = error as { status?: number; message?: string }
        logs.push(
          this.log(`Failed to access user_id ${userId}: ${err.message || 'Unknown error'}`, 'error', onProgress)
        )
      }
    }

    const summary = `IDOR exploitation complete. Extracted ${extractedProfiles.length}/${targetUserIds.length} profiles with sensitive data (SSN, credit cards).`

    logs.push(this.log(summary, extractedProfiles.length > 0 ? 'success' : 'warning', onProgress))

    return {
      success: extractedProfiles.length > 0,
      logs,
      summary,
      dataExtracted: {
        profiles: extractedProfiles,
        sensitiveFieldsExposed: ['ssn', 'credit_card', 'email', 'phone', 'address'],
      },
      metricsTriggered: ['user_service_idor_attempts_total'],
    }
  }

  /**
   * ATTACK 3: Direct Access (Gateway Bypass)
   * Access backend services directly, bypassing gateway security
   */
  async executeDirectAccess(onProgress?: AttackProgressCallback): Promise<AttackExecutionResult> {
    const logs: AttackLog[] = []
    const bypassedEndpoints: string[] = []

    logs.push(this.log('Starting gateway bypass attack...', 'info', onProgress))
    logs.push(
      this.log('Attempting to access services directly on exposed ports', 'info', onProgress)
    )

    // Direct access endpoints (bypass gateway)
    const directEndpoints = [
      { url: ENDPOINTS.DIRECT_ACCESS.USER.HEALTH, service: 'User Service' },
      { url: ENDPOINTS.DIRECT_ACCESS.USER.SETTINGS, service: 'User Settings (no auth)' },
      { url: ENDPOINTS.DIRECT_ACCESS.AUTH.HEALTH, service: 'Auth Service' },
    ]

    for (const endpoint of directEndpoints) {
      try {
        logs.push(
          this.log(`Accessing ${endpoint.service} directly: ${endpoint.url}`, 'info', onProgress)
        )

        // Use fetch instead of apiClient to bypass gateway
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          bypassedEndpoints.push(endpoint.url)
          const data = await response.json()
          logs.push(
            this.log(
              `SUCCESS! Bypassed gateway for ${endpoint.service}: ${JSON.stringify(data).substring(0, 100)}...`,
              'success',
              onProgress
            )
          )
        }

        await this.delay(200)
      } catch (error: unknown) {
        const err = error as { message?: string }
        logs.push(
          this.log(
            `Failed to access ${endpoint.service}: ${err.message || 'Unknown error'}`,
            'error',
            onProgress
          )
        )
      }
    }

    const summary = `Gateway bypass successful! Accessed ${bypassedEndpoints.length}/${directEndpoints.length} services directly, evading JWT validation, rate limiting, and WAF.`

    logs.push(this.log(summary, bypassedEndpoints.length > 0 ? 'success' : 'warning', onProgress))

    return {
      success: bypassedEndpoints.length > 0,
      logs,
      summary,
      dataExtracted: {
        bypassedEndpoints,
        securityControlsEvaded: ['JWT validation', 'Rate limiting', 'WAF', 'Security headers'],
      },
      metricsTriggered: ['user_service_direct_access_total'],
    }
  }

  /**
   * ATTACK 4: Rate Limit Bypass
   * Evade rate limiting by accessing services directly
   */
  async executeRateLimitBypass(
    requestCount: number,
    onProgress?: AttackProgressCallback
  ): Promise<AttackExecutionResult> {
    const logs: AttackLog[] = []
    let gatewayBlocked = 0
    let directSuccess = 0

    logs.push(this.log(`Starting rate limit bypass attack...`, 'info', onProgress))
    logs.push(
      this.log(
        `Will send ${requestCount} requests - first via gateway, then via direct access`,
        'info',
        onProgress
      )
    )

    // Phase 1: Trigger rate limiting via gateway
    logs.push(this.log('Phase 1: Triggering gateway rate limiting...', 'info', onProgress))

    for (let i = 0; i < Math.min(requestCount, 70); i++) {
      try {
        await apiClient.get(ENDPOINTS.GATEWAY.HEALTH)
      } catch (error: unknown) {
        const err = error as { status?: number }
        if (err.status === 429) {
          gatewayBlocked++
          logs.push(
            this.log(`Request ${i + 1} blocked by gateway rate limiter`, 'warning', onProgress)
          )
          break
        }
      }
    }

    logs.push(
      this.log(
        `Gateway rate limit triggered after ${gatewayBlocked} blocked requests`,
        'success',
        onProgress
      )
    )

    // Phase 2: Bypass via direct access
    logs.push(
      this.log('Phase 2: Bypassing rate limit via direct service access...', 'info', onProgress)
    )

    const directUrl = ENDPOINTS.DIRECT_ACCESS.USER.HEALTH

    for (let i = 0; i < Math.min(requestCount, 50); i++) {
      try {
        const response = await fetch(directUrl, {
          method: 'GET',
        })

        if (response.ok) {
          directSuccess++
        }

        await this.delay(50)
      } catch (error) {
        // Ignore errors for demo purposes
      }
    }

    logs.push(
      this.log(
        `Successfully bypassed rate limit: ${directSuccess} requests completed via direct access`,
        'success',
        onProgress
      )
    )

    const summary = `Rate limit bypass successful! Gateway blocked ${gatewayBlocked} requests, but ${directSuccess} requests succeeded via direct service access.`

    logs.push(this.log(summary, directSuccess > 0 ? 'success' : 'warning', onProgress))

    return {
      success: directSuccess > 0,
      logs,
      summary,
      dataExtracted: {
        gatewayBlockedRequests: gatewayBlocked,
        directAccessSuccessful: directSuccess,
      },
      metricsTriggered: [
        'gateway_rate_limit_blocks_total',
        'user_service_direct_access_total',
      ],
    }
  }

  /**
   * ATTACK 5: MFA Bruteforce
   * Enumerate TOTP codes (educational - shows why rate limiting is critical)
   */
  async executeMFABruteforce(
    challengeId: string,
    codeRange: { start: number; end: number },
    onProgress?: AttackProgressCallback
  ): Promise<AttackExecutionResult> {
    const logs: AttackLog[] = []
    let attempts = 0
    let blocked = 0

    logs.push(this.log('Starting MFA bruteforce attack...', 'info', onProgress))
    logs.push(
      this.log(
        `Testing codes from ${codeRange.start} to ${codeRange.end}`,
        'info',
        onProgress
      )
    )

    for (let code = codeRange.start; code <= codeRange.end; code++) {
      const codeStr = code.toString().padStart(6, '0')
      attempts++

      try {
        logs.push(this.log(`Trying MFA code: ${codeStr}`, 'info', onProgress))

        await this.post(this.getMFAVerifyEndpoint(), {
          challenge_id: challengeId,
          code: codeStr,
        })

        logs.push(
          this.log(`SUCCESS! Valid MFA code found: ${codeStr}`, 'success', onProgress)
        )

        return {
          success: true,
          logs,
          summary: `MFA bypass successful! Found valid code ${codeStr} after ${attempts} attempts.`,
          dataExtracted: { validCode: codeStr, attempts },
          metricsTriggered: ['mfa_attempts_total', 'mfa_failures_total'],
        }
      } catch (error: unknown) {
        const err = error as { status?: number; message?: string }
        if (err.status === 429) {
          blocked++
          logs.push(this.log(`Rate limited after ${attempts} attempts`, 'warning', onProgress))
          break
        }
      }

      await this.delay(100)
    }

    const summary = `MFA bruteforce blocked by rate limiting after ${attempts} attempts. This demonstrates why rate limiting is critical for MFA endpoints.`

    logs.push(this.log(summary, 'info', onProgress))

    return {
      success: false,
      logs,
      summary,
      dataExtracted: { attempts, blocked },
      metricsTriggered: ['mfa_attempts_total', 'mfa_failures_total'],
    }
  }

  /**
   * ATTACK 6: Token Replay
   * Attempt to reuse revoked refresh tokens
   */
  async executeTokenReplay(
    revokedToken: string,
    onProgress?: AttackProgressCallback
  ): Promise<AttackExecutionResult> {
    const logs: AttackLog[] = []

    logs.push(this.log('Starting token replay attack...', 'info', onProgress))
    logs.push(this.log(`Attempting to use revoked token: ${revokedToken.substring(0, 20)}...`, 'info', onProgress))

    try {
      await this.post(this.getRefreshEndpoint(), {
        refresh_token: revokedToken,
      })

      logs.push(this.log('Token replay SUCCESSFUL! Security vulnerability detected.', 'error', onProgress))

      return {
        success: true,
        logs,
        summary: 'CRITICAL: Revoked token was accepted! This indicates a serious security flaw.',
        metricsTriggered: ['refresh_token_attempts_total'],
      }
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string }
      logs.push(
        this.log(
          `Token replay blocked: ${err.message || 'Unknown error'}`,
          'success',
          onProgress
        )
      )

      return {
        success: false,
        logs,
        summary: 'Token replay PREVENTED. Revoked token was correctly rejected by the system.',
        metricsTriggered: ['refresh_token_attempts_total'],
      }
    }
  }

  /**
   * ATTACK 7: Credential Stuffing
   * Test leaked username/password pairs
   */
  async executeCredentialStuffing(
    credentialPairs: Array<{ username: string; password: string }>,
    onProgress?: AttackProgressCallback
  ): Promise<AttackExecutionResult> {
    const logs: AttackLog[] = []
    const validCredentials: Array<{ username: string; password: string }> = []
    let blockedRequests = 0

    logs.push(this.log('Starting credential stuffing attack...', 'info', onProgress))
    logs.push(
      this.log(`Testing ${credentialPairs.length} leaked credential pairs`, 'info', onProgress)
    )

    for (let i = 0; i < credentialPairs.length; i++) {
      const { username, password } = credentialPairs[i]

      try {
        logs.push(
          this.log(`[${i + 1}/${credentialPairs.length}] Testing: ${username}`, 'info', onProgress)
        )

        const response = await this.post<{ success: boolean }>(this.getLoginEndpoint(), {
          username,
          password,
        })

        if (response && response.success) {
          validCredentials.push({ username, password })
          logs.push(
            this.log(`SUCCESS! Valid credentials: ${username}:${password}`, 'success', onProgress)
          )
        }

        await this.delay(150)
      } catch (error: unknown) {
        const err = error as { status?: number; message?: string }
        if (err.status === 429) {
          blockedRequests++
          logs.push(
            this.log(`Rate limit triggered! Attack detection successful`, 'warning', onProgress)
          )
          break
        }
      }
    }

    const summary =
      validCredentials.length > 0
        ? `Credential stuffing found ${validCredentials.length} valid accounts. Blocked: ${blockedRequests}`
        : `Credential stuffing blocked after testing ${credentialPairs.length} pairs. Rate limiting effective.`

    logs.push(
      this.log(summary, validCredentials.length > 0 ? 'success' : 'info', onProgress)
    )

    return {
      success: validCredentials.length > 0,
      logs,
      summary,
      dataExtracted: { validCredentials, blockedRequests },
      metricsTriggered: ['login_attempts_total', 'rate_limit_blocks_total'],
    }
  }
}

export const attackService = new AttackService()

// Predefined password lists for testing
export const COMMON_PASSWORDS = [
  'password',
  '123456',
  'admin',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'master',
  'admin123', // This will succeed for admin user
  'password123',
]

// Leaked credentials for credential stuffing demo
export const LEAKED_CREDENTIALS = [
  { username: 'admin', password: 'admin' },
  { username: 'admin', password: '123456' },
  { username: 'user1', password: 'password' },
  { username: 'user1', password: 'password123' },
  { username: 'alice', password: 'alice123' },
  { username: 'bob', password: 'bob123' },
  ...DEMO_USERS.map((u) => ({ username: u.username, password: u.password })),
]
