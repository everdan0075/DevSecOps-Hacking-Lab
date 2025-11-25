/**
 * Authentication Service
 *
 * Handles all authentication-related API calls:
 * - Login (password + MFA)
 * - Token refresh
 * - Logout
 * - Auth statistics
 *
 * Respects Security Toggle (securityEnabled):
 * - Security ON: Use API Gateway (WAF, rate limiting, JWT validation)
 * - Security OFF: Direct access to auth-service (bypass all protections)
 */

import { apiClient } from './apiClient'
import { ENDPOINTS } from '@/utils/constants'
import type {
  LoginRequest,
  LoginResponse,
  MfaVerifyRequest,
  TokenResponse,
  LogoutRequest,
  AuthStats,
} from '@/types/api'

class AuthService {
  private securityEnabled: boolean = true

  /**
   * Set security mode (called by SecurityContext)
   * @param enabled - true = use gateway (security ON), false = direct access (security OFF)
   */
  setSecurityMode(enabled: boolean): void {
    console.log(`[AuthService] Security mode changed: ${enabled ? 'ON (gateway)' : 'OFF (direct access)'}`)
    this.securityEnabled = enabled
  }

  /**
   * Get current security mode
   */
  getSecurityMode(): boolean {
    return this.securityEnabled
  }

  /**
   * Execute POST request respecting security mode
   */
  private async post<T>(url: string, data: unknown): Promise<T> {
    if (this.securityEnabled) {
      // Security ON: use apiClient (gateway with WAF, rate limiting, JWT)
      return apiClient.post<T>(url, data)
    } else {
      // Security OFF: direct access bypassing all protections
      const fullUrl = url.startsWith('http') ? url : `http://localhost:8000${url.replace('/direct/auth-service', '')}`
      console.log(`[AuthService] Direct POST: ${fullUrl}`)

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Direct-Access': 'true',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || response.statusText)
      }

      return response.json()
    }
  }

  /**
   * Get endpoint URL based on security mode
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

  /**
   * Step 1: Password authentication
   * Returns challenge_id if MFA is required
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.post<LoginResponse>(this.getLoginEndpoint(), credentials)
  }

  /**
   * Step 2: MFA verification
   * Returns JWT tokens on success
   */
  async verifyMfa(request: MfaVerifyRequest): Promise<TokenResponse> {
    const response = await this.post<TokenResponse>(this.getMFAVerifyEndpoint(), request)

    // Store tokens
    apiClient.setTokens(response.access_token, response.refresh_token, response.expires_in)

    return response
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = apiClient.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await this.post<TokenResponse>(this.getRefreshEndpoint(), {
      refresh_token: refreshToken,
    })

    // Update stored tokens
    apiClient.setTokens(response.access_token, response.refresh_token, response.expires_in)

    return response
  }

  /**
   * Logout and revoke tokens
   */
  async logout(allSessions: boolean = false): Promise<void> {
    const refreshToken = apiClient.getRefreshToken()
    if (!refreshToken) {
      // No token to revoke, just clear local storage
      apiClient.clearTokens()
      return
    }

    try {
      const request: LogoutRequest = {
        refresh_token: refreshToken,
        all_sessions: allSessions,
      }
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT, request)
    } finally {
      // Always clear local tokens, even if API call fails
      apiClient.clearTokens()
    }
  }

  /**
   * Get authentication statistics
   */
  async getStats(): Promise<AuthStats> {
    return apiClient.get<AuthStats>(ENDPOINTS.AUTH.STATS)
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated()
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return apiClient.getAccessToken()
  }

  /**
   * Get time until token expiry (seconds)
   */
  getTokenExpiryTime(): number | null {
    return apiClient.getTokenExpiryTime()
  }
}

export const authService = new AuthService()
