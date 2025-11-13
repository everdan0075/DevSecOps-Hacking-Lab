/**
 * Authentication Service
 *
 * Handles all authentication-related API calls:
 * - Login (password + MFA)
 * - Token refresh
 * - Logout
 * - Auth statistics
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
  /**
   * Step 1: Password authentication
   * Returns challenge_id if MFA is required
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, credentials)
  }

  /**
   * Step 2: MFA verification
   * Returns JWT tokens on success
   */
  async verifyMfa(request: MfaVerifyRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>(ENDPOINTS.AUTH.MFA_VERIFY, request)

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

    const response = await apiClient.post<TokenResponse>(ENDPOINTS.AUTH.REFRESH, {
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
