import { apiClient } from './apiClient';

// ============================================================================
// IDS Service - Phase 2.6B Integration
// ============================================================================

export interface IdsAlert {
  timestamp: string;
  src_ip: string;
  dest_ip: string;
  signature: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'HTTP';
  src_port?: number;
  dest_port?: number;
  payload?: string;
}

export interface IdsStatistics {
  total_alerts: number;
  alerts_by_severity: Record<string, number>;
  alerts_by_category: Record<string, number>;
  alerts_by_protocol: Record<string, number>;
  top_source_ips: Array<{ ip: string; count: number }>;
  top_signatures: Array<{ signature: string; count: number }>;
  time_window_hours: number;
  timestamp: string;
}

class IdsService {
  // Use Vite proxy in dev mode, direct URL in production
  private baseUrl = import.meta.env.DEV ? '/incidents/api' : 'http://localhost:5002/api';
  private isLinux = !navigator.platform.toLowerCase().includes('win');

  /**
   * Get recent IDS alerts from Suricata
   * Returns mock data on Windows (Suricata is Linux-only)
   */
  async getRecentAlerts(limit: number = 50): Promise<IdsAlert[]> {
    if (!this.isLinux) {
      console.warn('IDS integration requires Linux platform (Suricata)');
      return this.getMockAlerts(limit);
    }

    try {
      const response = await apiClient.get<{ alerts: IdsAlert[] }>(
        `${this.baseUrl}/ids/alerts`,
        { params: { limit } }
      );
      return response.alerts;
    } catch (error) {
      console.error('Failed to fetch IDS alerts:', error);
      // Fallback to mock data if backend is unavailable
      return this.getMockAlerts(Math.min(limit, 5));
    }
  }

  /**
   * Get alerts filtered by category
   */
  async getAlertsByCategory(category: string): Promise<IdsAlert[]> {
    if (!this.isLinux) {
      return this.getMockAlerts(5).filter(alert =>
        alert.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    try {
      const response = await apiClient.get<{ alerts: IdsAlert[] }>(
        `${this.baseUrl}/ids/alerts`,
        { params: { category } }
      );
      return response.alerts;
    } catch (error) {
      console.error('Failed to fetch IDS alerts by category:', error);
      return [];
    }
  }

  /**
   * Get alerts filtered by severity
   */
  async getAlertsBySeverity(severity: string): Promise<IdsAlert[]> {
    if (!this.isLinux) {
      return this.getMockAlerts(5).filter(alert => alert.severity === severity);
    }

    try {
      const response = await apiClient.get<{ alerts: IdsAlert[] }>(
        `${this.baseUrl}/ids/alerts`,
        { params: { severity } }
      );
      return response.alerts;
    } catch (error) {
      console.error('Failed to fetch IDS alerts by severity:', error);
      return [];
    }
  }

  /**
   * Get aggregate alert statistics
   */
  async getAlertStatistics(): Promise<IdsStatistics> {
    if (!this.isLinux) {
      return this.getMockStatistics();
    }

    try {
      const response = await apiClient.get<IdsStatistics>(
        `${this.baseUrl}/ids/statistics`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch IDS statistics:', error);
      return this.getMockStatistics();
    }
  }

  /**
   * Get severity color classes for UI
   */
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'high':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'low':
        return 'text-green-500 bg-green-500/10 border-green-500/30';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  }

  /**
   * Check if IDS is available on current platform
   */
  isAvailable(): boolean {
    return this.isLinux;
  }

  /**
   * Generate mock alerts for Windows users
   */
  private getMockAlerts(limit: number): IdsAlert[] {
    const mockAlerts: IdsAlert[] = [
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        src_ip: '192.168.1.100',
        dest_ip: '10.0.0.10',
        signature: 'ET SCAN Potential SSH Scan',
        category: 'Attempted Information Leak',
        severity: 'medium',
        protocol: 'TCP',
        src_port: 52341,
        dest_port: 22,
        payload: 'SSH-2.0-OpenSSH_8.2'
      },
      {
        timestamp: new Date(Date.now() - 180000).toISOString(),
        src_ip: '203.0.113.42',
        dest_ip: '10.0.0.1',
        signature: 'ET EXPLOIT SQL Injection Attempt',
        category: 'Web Application Attack',
        severity: 'high',
        protocol: 'HTTP',
        src_port: 43210,
        dest_port: 8080,
        payload: "GET /api/users?id=1' OR '1'='1"
      },
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        src_ip: '198.51.100.25',
        dest_ip: '10.0.0.10',
        signature: 'ET POLICY Port Scan Detected',
        category: 'Attempted Reconnaissance',
        severity: 'medium',
        protocol: 'TCP',
        src_port: 60123,
        dest_port: 8443
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        src_ip: '192.0.2.150',
        dest_ip: '10.0.0.1',
        signature: 'ET WEB_SERVER Path Traversal Attempt',
        category: 'Web Application Attack',
        severity: 'critical',
        protocol: 'HTTP',
        src_port: 51234,
        dest_port: 8080,
        payload: 'GET /../../../etc/passwd'
      },
      {
        timestamp: new Date(Date.now() - 30000).toISOString(),
        src_ip: '203.0.113.99',
        dest_ip: '10.0.0.10',
        signature: 'ET POLICY Suspicious User Agent',
        category: 'Potential Corporate Privacy Violation',
        severity: 'low',
        protocol: 'HTTP',
        src_port: 49876,
        dest_port: 8080,
        payload: 'User-Agent: sqlmap/1.5'
      }
    ];

    return mockAlerts.slice(0, Math.min(limit, mockAlerts.length));
  }

  /**
   * Generate mock statistics for Windows users
   */
  private getMockStatistics(): IdsStatistics {
    return {
      total_alerts: 342,
      alerts_by_severity: {
        critical: 12,
        high: 45,
        medium: 123,
        low: 162
      },
      alerts_by_category: {
        'Web Application Attack': 89,
        'Attempted Reconnaissance': 76,
        'Attempted Information Leak': 54,
        'Potential Corporate Privacy Violation': 43,
        'Misc Attack': 80
      },
      alerts_by_protocol: {
        HTTP: 187,
        TCP: 112,
        UDP: 32,
        ICMP: 11
      },
      top_source_ips: [
        { ip: '192.168.1.100', count: 45 },
        { ip: '203.0.113.42', count: 38 },
        { ip: '198.51.100.25', count: 29 },
        { ip: '192.0.2.150', count: 24 },
        { ip: '203.0.113.99', count: 18 }
      ],
      top_signatures: [
        { signature: 'ET SCAN Potential SSH Scan', count: 67 },
        { signature: 'ET EXPLOIT SQL Injection Attempt', count: 52 },
        { signature: 'ET POLICY Port Scan Detected', count: 43 },
        { signature: 'ET WEB_SERVER Path Traversal Attempt', count: 31 },
        { signature: 'ET POLICY Suspicious User Agent', count: 28 }
      ],
      time_window_hours: 24,
      timestamp: new Date().toISOString()
    };
  }
}

export default new IdsService();
