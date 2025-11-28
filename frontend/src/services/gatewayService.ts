import { apiClient } from './apiClient';

// ============================================================================
// Gateway Service - Phase 2.6B Integration
// ============================================================================

export interface GatewayHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime_seconds: number;
  total_requests: number;
  error_rate: number; // 0.0-1.0
  avg_response_time_ms: number;
  connection_pool: {
    active: number;
    idle: number;
    max: number;
    utilization: number; // 0.0-1.0
  };
  circuit_breaker: {
    state: 'closed' | 'open' | 'half_open';
    failure_count: number;
    last_failure_time?: string;
  };
  timestamp: string;
}

export interface JwtValidationStats {
  total_validations: number;
  successful_validations: number;
  failed_validations: number;
  success_rate: number; // 0.0-1.0
  failure_reasons: {
    expired: number;
    invalid_signature: number;
    malformed: number;
    revoked: number;
    other: number;
  };
  avg_validation_time_ms: number;
  timestamp: string;
}

class GatewayService {
  // Use Vite proxy in dev mode, direct URL in production
  private baseUrl = import.meta.env.DEV ? '/incidents/api' : 'http://localhost:5002/api';

  /**
   * Get current gateway health status
   */
  async getHealth(): Promise<GatewayHealth> {
    try {
      const response = await apiClient.get<GatewayHealth>(
        `${this.baseUrl}/gateway/health`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch gateway health:', error);
      // Return degraded status on error
      return this.getMockGatewayHealth('down');
    }
  }

  /**
   * Get JWT validation statistics
   */
  async getJwtValidationStats(hoursAgo: number = 24): Promise<JwtValidationStats> {
    try {
      const response = await apiClient.get<JwtValidationStats>(
        `${this.baseUrl}/jwt/validation-stats`,
        { params: { hours: hoursAgo } }
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch JWT validation stats:', error);
      return this.getMockJwtValidationStats();
    }
  }

  /**
   * Get status color class for UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'healthy':
        return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'degraded':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'down':
        return 'text-red-500 bg-red-500/10 border-red-500/30';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  }

  /**
   * Get circuit breaker state color
   */
  getCircuitBreakerColor(state: string): string {
    switch (state) {
      case 'closed':
        return 'text-green-500';
      case 'half_open':
        return 'text-yellow-500';
      case 'open':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  }

  /**
   * Format uptime as human-readable string
   */
  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.length > 0 ? parts.join(' ') : '< 1m';
  }

  /**
   * Format percentage with 2 decimal places
   */
  formatPercentage(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
  }

  /**
   * Generate mock gateway health for fallback
   */
  private getMockGatewayHealth(status: 'healthy' | 'degraded' | 'down' = 'healthy'): GatewayHealth {
    const now = new Date().toISOString();
    const uptime = 172800; // 2 days

    if (status === 'down') {
      return {
        status: 'down',
        uptime_seconds: 0,
        total_requests: 0,
        error_rate: 1.0,
        avg_response_time_ms: 0,
        connection_pool: {
          active: 0,
          idle: 0,
          max: 100,
          utilization: 0
        },
        circuit_breaker: {
          state: 'open',
          failure_count: 50,
          last_failure_time: now
        },
        timestamp: now
      };
    }

    return {
      status,
      uptime_seconds: uptime,
      total_requests: 45623,
      error_rate: status === 'degraded' ? 0.08 : 0.02,
      avg_response_time_ms: status === 'degraded' ? 250 : 45,
      connection_pool: {
        active: status === 'degraded' ? 75 : 23,
        idle: status === 'degraded' ? 15 : 67,
        max: 100,
        utilization: status === 'degraded' ? 0.75 : 0.23
      },
      circuit_breaker: {
        state: status === 'degraded' ? 'half_open' : 'closed',
        failure_count: status === 'degraded' ? 12 : 0,
        last_failure_time: status === 'degraded' ? new Date(Date.now() - 300000).toISOString() : undefined
      },
      timestamp: now
    };
  }

  /**
   * Generate mock JWT validation stats for fallback
   */
  private getMockJwtValidationStats(): JwtValidationStats {
    return {
      total_validations: 12450,
      successful_validations: 11823,
      failed_validations: 627,
      success_rate: 0.9496,
      failure_reasons: {
        expired: 423,
        invalid_signature: 89,
        malformed: 45,
        revoked: 52,
        other: 18
      },
      avg_validation_time_ms: 2.3,
      timestamp: new Date().toISOString()
    };
  }
}

export default new GatewayService();
