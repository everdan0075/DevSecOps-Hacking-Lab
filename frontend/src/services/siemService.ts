import { apiClient } from './apiClient';

// ============================================================================
// SIEM Service - Phase 2.5C Integration
// ============================================================================

export interface ThreatScore {
  ip_address: string;
  threat_score: number; // 0-100
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0.0-1.0
  factors: {
    frequency: number;
    diversity: number;
    severity: number;
    attack_risk: number;
  };
  recommendation: string;
  event_count: number;
  attack_types: string[];
  first_seen: string;
  last_seen: string;
}

export interface PatternScore {
  pattern_id: string;
  pattern_type: 'reconnaissance' | 'multi_stage_attack' | 'distributed_attack' | 'credential_stuffing' | 'apt_indicator';
  threat_score: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  factors: {
    pattern_type: number;
    confidence: number;
    ip_count: number;
    event_count: number;
  };
  recommendation: string;
  attacker_ips: string[];
  event_count: number;
  first_event: string;
  last_event: string;
}

export interface RiskAssessment {
  risk_score: number; // 0-100
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  factors: {
    event_volume: number;
    pattern_complexity: number;
    critical_ips: number;
    severity: number;
  };
  time_window_hours: number;
  metrics: {
    total_events: number;
    total_patterns: number;
    critical_ips: number;
    high_severity_events: number;
  };
  timestamp: string;
}

export interface SiemDashboard {
  timestamp: string;
  risk_assessment: RiskAssessment;
  top_threats: Array<{
    ip_address: string;
    threat_score: number;
    threat_level: string;
    event_count: number;
    attack_types: string[];
  }>;
  attack_summary: {
    total_events_24h: number;
    high_severity_events: number;
    unique_attackers: number;
    critical_ips: number;
    patterns_detected: number;
  };
  top_attack_types: Array<{
    attack_type: string;
    count: number;
  }>;
  pattern_summary: {
    total: number;
    by_type: Record<string, number>;
    by_severity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  attack_timeline: Record<string, number>; // timestamp -> count
  defense_effectiveness: {
    automated_responses: number;
    response_success_rate: number;
    avg_response_time: number;
  };
}

class SiemService {
  private baseUrl = 'http://localhost:5002/api/siem';

  /**
   * Get threat scores for all active IPs
   */
  async getThreatScores(
    minScore: number = 0,
    timeWindowMinutes: number = 60,
    limit: number = 50
  ): Promise<{ threat_scores: ThreatScore[]; count: number; timestamp: string }> {
    const response = await apiClient.get<{ threat_scores: ThreatScore[]; count: number; timestamp: string }>(`${this.baseUrl}/threat-scores`, {
      params: {
        min_score: minScore,
        time_window_minutes: timeWindowMinutes,
        limit,
      },
    });
    return response;
  }

  /**
   * Get threat scores for detected attack patterns
   */
  async getPatternScores(
    minScore: number = 0,
    minConfidence: number = 0.5
  ): Promise<{ pattern_scores: PatternScore[]; count: number; timestamp: string }> {
    const response = await apiClient.get<{ pattern_scores: PatternScore[]; count: number; timestamp: string }>(`${this.baseUrl}/pattern-scores`, {
      params: {
        min_score: minScore,
        min_confidence: minConfidence,
      },
    });
    return response;
  }

  /**
   * Get overall risk assessment for the environment
   */
  async getRiskAssessment(timeWindowHours: number = 24): Promise<RiskAssessment> {
    const response = await apiClient.get<RiskAssessment>(`${this.baseUrl}/risk-assessment`, {
      params: {
        time_window_hours: timeWindowHours,
      },
    });
    return response;
  }

  /**
   * Get comprehensive SIEM dashboard with all security metrics
   */
  async getSiemDashboard(): Promise<SiemDashboard> {
    const response = await apiClient.get<SiemDashboard>(`${this.baseUrl}/dashboard`);
    return response;
  }

  /**
   * Get threat level color for UI
   */
  getThreatLevelColor(level: string): string {
    switch (level) {
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
   * Get threat level background color for UI
   */
  getThreatLevelBgColor(level: string): string {
    switch (level) {
      case 'critical':
        return 'bg-red-500/20 border-red-500';
      case 'high':
        return 'bg-orange-500/20 border-orange-500';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500';
      case 'low':
        return 'bg-green-500/20 border-green-500';
      default:
        return 'bg-gray-500/20 border-gray-500';
    }
  }

  /**
   * Format threat score as percentage
   */
  formatThreatScore(score: number): string {
    return `${Math.round(score)}%`;
  }

  /**
   * Get risk level icon
   */
  getRiskLevelIcon(level: string): string {
    switch (level) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  }
}

export default new SiemService();
