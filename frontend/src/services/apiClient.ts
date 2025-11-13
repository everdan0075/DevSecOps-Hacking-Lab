/**
 * API Client with JWT Interceptors
 *
 * Handles:
 * - JWT token management (access + refresh)
 * - Automatic token refresh on 401
 * - Request/response interceptors
 * - Error handling and retries
 * - Backend connection checking
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios'
import { API_BASE_URL, ENDPOINTS, STORAGE_KEYS, TIMEOUTS, HTTP_STATUS } from '@/utils/constants'
import { backendDetection } from './backendDetection'
import type { ApiError, TokenResponse } from '@/types/api'

class ApiClient {
  private client: AxiosInstance
  private refreshTokenPromise: Promise<string> | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: TIMEOUTS.API_REQUEST,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Add JWT token to headers
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor - Handle 401 and refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

        // If 401 and not already retrying, attempt token refresh
        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const newAccessToken = await this.refreshAccessToken()
            if (newAccessToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed - clear tokens and redirect to login
            this.clearTokens()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(this.handleError(error))
      }
    )
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise
    }

    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      return null
    }

    this.refreshTokenPromise = (async () => {
      try {
        const response = await axios.post<TokenResponse>(
          `${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
          { refresh_token: refreshToken },
          { timeout: TIMEOUTS.API_REQUEST }
        )

        const { access_token, refresh_token: newRefreshToken, expires_in } = response.data
        this.setTokens(access_token, newRefreshToken, expires_in)
        return access_token
      } catch (error) {
        console.error('Token refresh failed:', error)
        this.clearTokens()
        throw error
      } finally {
        this.refreshTokenPromise = null
      }
    })()

    return this.refreshTokenPromise
  }

  /**
   * Handle API errors and convert to ApiError
   */
  private handleError(error: AxiosError): ApiError {
    if (!error.response) {
      // Network error or backend not reachable
      return {
        message: 'Backend services not reachable. Run docker-compose up -d to start services.',
        status: 0,
        code: 'NETWORK_ERROR',
        details: { originalError: error.message },
      }
    }

    const response = error.response
    const data = response.data as Record<string, unknown>

    return {
      message: (data.message as string) || (data.detail as string) || error.message,
      status: response.status,
      code: data.code as string,
      details: data,
    }
  }

  /**
   * Check if backend is reachable before making request
   */
  private async ensureBackendAvailable(): Promise<void> {
    if (!backendDetection.isConnected()) {
      const currentStatus = await backendDetection.checkBackendStatus()
      if (!currentStatus.connected) {
        throw {
          message: backendDetection.getDisconnectedMessage(),
          status: 0,
          code: 'BACKEND_UNAVAILABLE',
        } as ApiError
      }
    }
  }

  /**
   * Generic GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    await this.ensureBackendAvailable()
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  /**
   * Generic POST request
   */
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    await this.ensureBackendAvailable()
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  /**
   * Generic PUT request
   */
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    await this.ensureBackendAvailable()
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    await this.ensureBackendAvailable()
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  /**
   * GET request without backend check (for health checks)
   */
  async getWithoutCheck<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  }

  /**
   * Save tokens to localStorage
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(Date.now() + expiresIn * 1000))
  }

  /**
   * Clear all tokens from localStorage
   */
  clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY)
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE)
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY)

    if (!token || !expiry) {
      return false
    }

    // Check if token is expired
    const expiryTime = parseInt(expiry, 10)
    if (Date.now() >= expiryTime) {
      return false
    }

    return true
  }

  /**
   * Get time until token expiry (in seconds)
   */
  getTokenExpiryTime(): number | null {
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY)
    if (!expiry) {
      return null
    }

    const expiryTime = parseInt(expiry, 10)
    const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000))
    return remaining
  }
}

// Singleton instance
export const apiClient = new ApiClient()
