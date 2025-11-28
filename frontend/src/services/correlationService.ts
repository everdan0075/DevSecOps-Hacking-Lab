import { apiClient } from './apiClient';

// ============================================================================
// Correlation Service - Attack Pattern Analysis
// ============================================================================

export interface AttackEvent {
  timestamp: string;
  ip_address: string;
  attack_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  target: string;
  details: Record<string, any>;
}

export interface AttackPattern {
  pattern_id: string;
  pattern_type: 'reconnaissance' | 'multi_stage_attack' | 'distributed_attack' | 'credential_stuffing' | 'apt_indicator';
  confidence: number; // 0.0-1.0
  severity: 'low' | 'medium' | 'high' | 'critical';
  attacker_ips: string[];
  events: AttackEvent[];
  first_event_time: string;
  last_event_time: string;
  duration_minutes: number;
  description: string;
  recommended_actions: string[];
}

export interface AttackFeed {
  events: AttackEvent[];
  count: number;
  time_window_minutes: number;
  timestamp: string;
}

export interface CorrelationStatistics {
  total_events: number;
  total_patterns: number;
  unique_ips: number;
  avg_confidence: number;
  time_window_minutes: number;
  top_attack_types: Array<{
    attack_type: string;
    count: number;
  }>;
  severity_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  pattern_type_distribution: Record<string, number>;
  timestamp: string;
}

export interface DefenseMetrics {
  attacks_detected: number;
  attacks_blocked: number;
  patterns_identified: number;
  incidents_handled: number;
  success_rate: number;
  avg_response_time_seconds: number;
  time_window_hours: number;
  top_blocked_attack_types: Array<{
    attack_type: string;
    count: number;
  }>;
  defense_layers: {
    waf_blocks: number;
    rate_limit_blocks: number;
    honeypot_detections: number;
    ids_alerts: number;
    correlation_patterns: number;
  };
  timestamp: string;
}

export interface IdsAlert {
  timestamp: string;
  src_ip: string;
  dest_ip: string;
  signature: string;
  category: string;
  severity: string;
  protocol: string;
  src_port?: number;
  dest_port?: number;
  payload?: string;
}

class CorrelationService {
  // Use Vite proxy in dev mode, direct URL in production
  private baseUrl = import.meta.env.DEV ? '/incidents/api' : 'http://localhost:5002/api';

  /**
   * Report attack event for correlation analysis
   */
  async reportAttackEvent(event: AttackEvent): Promise<void> {
    await apiClient.post(`${this.baseUrl}/attack-event`, event);
  }

  /**
   * Get detected attack patterns
   */
  async getAttackPatterns(filters?: {
    minConfidence?: number;
    severityFilter?: string;
    patternType?: string;
  }): Promise<{ patterns: AttackPattern[]; count: number; timestamp: string }> {
    const response = await apiClient.get<{ patterns: AttackPattern[]; count: number; timestamp: string }>(`${this.baseUrl}/attack-patterns`, {
      params: filters,
    });
    return response;
  }

  /**
   * Get real-time attack feed (last N minutes)
   */
  async getRealTimeAttackFeed(lastMinutes: number = 60): Promise<AttackFeed> {
    const response = await apiClient.get<AttackFeed>(`${this.baseUrl}/attack-feed/realtime`, {
      params: {
        last_minutes: lastMinutes,
      },
    });
    return response;
  }

  /**
   * Correlate IDS alert with existing attack patterns
   */
  async correlateIdsAlert(alert: IdsAlert): Promise<{
    correlated: boolean;
    patterns_matched: string[];
    confidence: number;
  }> {
    const response = await apiClient.post<{ correlated: boolean; patterns_matched: string[]; confidence: number }>(`${this.baseUrl}/correlate`, alert);
    return response;
  }

  /**
   * Get correlation engine statistics
   */
  async getCorrelationStatistics(): Promise<CorrelationStatistics> {
    const response = await apiClient.get<CorrelationStatistics>(`${this.baseUrl}/correlation/statistics`);
    return response;
  }

  /**
   * Get defense effectiveness metrics
   */
  async getDefenseMetrics(timeWindowHours: number = 24): Promise<DefenseMetrics> {
    const response = await apiClient.get<DefenseMetrics>(`${this.baseUrl}/defense/metrics`, {
      params: {
        time_window_hours: timeWindowHours,
      },
    });
    return response;
  }

  /**
   * Get pattern type display name
   */
  getPatternTypeName(type: string): string {
    const names: Record<string, string> = {
      reconnaissance: 'Reconnaissance',
      multi_stage_attack: 'Multi-Stage Attack',
      distributed_attack: 'Distributed Attack',
      credential_stuffing: 'Credential Stuffing',
      apt_indicator: 'APT Indicator',
    };
    return names[type] || type;
  }

  /**
   * Get pattern type icon
   */
  getPatternTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      reconnaissance: '🔍',
      multi_stage_attack: '🎯',
      distributed_attack: '🌐',
      credential_stuffing: '🔑',
      apt_indicator: '💀',
    };
    return icons[type] || '⚠️';
  }

  /**
   * Get severity color
   */
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  }

  /**
   * Format confidence as percentage
   */
  formatConfidence(confidence: number): string {
    return `${Math.round(confidence * 100)}%`;
  }

  /**
   * Get attack type display name
   */
  getAttackTypeName(type: string): string {
    const names: Record<string, string> = {
      sql_injection: 'SQL Injection',
      xss_attack: 'XSS Attack',
      command_injection: 'Command Injection',
      path_traversal: 'Path Traversal',
      brute_force: 'Brute Force',
      scanner_detection: 'Scanner Detection',
      honeypot_access: 'Honeypot Access',
      gateway_bypass: 'Gateway Bypass',
      idor_exploitation: 'IDOR Exploitation',
      rate_limit_bypass: 'Rate Limit Bypass',
    };
    return names[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

export default new CorrelationService();
