import { apiClient } from './apiClient';

// ============================================================================
// Honeypot Service - Attacker Detection & Profiling
// ============================================================================

export interface HoneypotTarget {
  path: string;
  method: string;
  description: string;
}

export interface HoneypotAttackResult {
  success: boolean;
  targets_probed: number;
  targets_found: number;
  honeypots_triggered: number;
  attack_detected: boolean;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'success' | 'warning' | 'error';
    message: string;
  }>;
  metrics: {
    response_times: number[];
    status_codes: Record<number, number>;
  };
}

class HoneypotService {
  private gatewayUrl = 'http://localhost:8080';
  private securityEnabled: boolean = true;

  /**
   * Set security mode (called by SecurityContext)
   * @param enabled - true = use gateway (security ON), false = direct access (security OFF)
   */
  setSecurityMode(enabled: boolean): void {
    console.log(`[HoneypotService] Security mode changed: ${enabled ? 'ON (gateway)' : 'OFF (direct access)'}`)
    this.securityEnabled = enabled;
  }

  /**
   * Get current security mode
   */
  getSecurityMode(): boolean {
    return this.securityEnabled;
  }

  /**
   * Admin Panel Reconnaissance
   * Probes for admin interfaces that attackers commonly target
   */
  async scanAdminPanels(): Promise<HoneypotAttackResult> {
    const targets: HoneypotTarget[] = [
      { path: '/admin', method: 'GET', description: 'Admin panel root' },
      { path: '/admin/login', method: 'GET', description: 'Admin login page' },
      { path: '/administrator', method: 'GET', description: 'Alternative admin path' },
    ];

    return this.executeHoneypotScan('Admin Panel Reconnaissance', targets);
  }

  /**
   * Secrets Enumeration
   * Searches for commonly exposed secret files
   */
  async scanSecretFiles(): Promise<HoneypotAttackResult> {
    const targets: HoneypotTarget[] = [
      { path: '/.env', method: 'GET', description: 'Environment variables file' },
      { path: '/backup.zip', method: 'GET', description: 'Backup archive' },
      { path: '/database.sql', method: 'GET', description: 'Database dump' },
    ];

    return this.executeHoneypotScan('Secrets Enumeration', targets);
  }

  /**
   * Git Exposure Scan
   * Checks for exposed git repositories
   */
  async scanGitExposure(): Promise<HoneypotAttackResult> {
    const targets: HoneypotTarget[] = [
      { path: '/.git/config', method: 'GET', description: 'Git config file' },
      { path: '/.git/HEAD', method: 'GET', description: 'Git HEAD file' },
      { path: '/.gitignore', method: 'GET', description: 'Git ignore file' },
    ];

    return this.executeHoneypotScan('Git Exposure Scan', targets);
  }

  /**
   * Config File Scanner
   * Searches for exposed configuration files
   */
  async scanConfigFiles(): Promise<HoneypotAttackResult> {
    const targets: HoneypotTarget[] = [
      { path: '/config.json', method: 'GET', description: 'JSON config file' },
      { path: '/config.yml', method: 'GET', description: 'YAML config file' },
      { path: '/settings.json', method: 'GET', description: 'Settings file' },
    ];

    return this.executeHoneypotScan('Config File Scanner', targets);
  }

  /**
   * Database Admin Brute Force
   * Attempts to access database administration tools
   */
  async scanDatabaseAdmin(): Promise<HoneypotAttackResult> {
    const targets: HoneypotTarget[] = [
      { path: '/phpmyadmin', method: 'GET', description: 'PHPMyAdmin root' },
      { path: '/pma', method: 'GET', description: 'PHPMyAdmin short path' },
      { path: '/adminer', method: 'GET', description: 'Adminer tool' },
    ];

    return this.executeHoneypotScan('Database Admin Scan', targets);
  }

  /**
   * WordPress Attack
   * Targets WordPress admin and login pages
   */
  async scanWordPress(): Promise<HoneypotAttackResult> {
    const targets: HoneypotTarget[] = [
      { path: '/wp-admin/', method: 'GET', description: 'WordPress admin panel' },
      { path: '/wp-login.php', method: 'GET', description: 'WordPress login page' },
      { path: '/xmlrpc.php', method: 'POST', description: 'WordPress XML-RPC' },
    ];

    return this.executeHoneypotScan('WordPress Attack', targets);
  }

  /**
   * API Documentation Scan
   * Searches for API documentation endpoints
   */
  async scanApiDocs(): Promise<HoneypotAttackResult> {
    const targets: HoneypotTarget[] = [
      { path: '/api/docs', method: 'GET', description: 'API documentation' },
      { path: '/swagger.json', method: 'GET', description: 'Swagger JSON' },
      { path: '/openapi.json', method: 'GET', description: 'OpenAPI schema' },
    ];

    return this.executeHoneypotScan('API Documentation Scan', targets);
  }

  /**
   * Directory Traversal
   * Scans for sensitive directories
   */
  async scanSensitivePaths(): Promise<HoneypotAttackResult> {
    const targets: HoneypotTarget[] = [
      { path: '/private/', method: 'GET', description: 'Private directory' },
      { path: '/internal/', method: 'GET', description: 'Internal directory' },
      { path: '/admin-backup/', method: 'GET', description: 'Admin backup directory' },
    ];

    return this.executeHoneypotScan('Sensitive Paths Scan', targets);
  }

  /**
   * Execute honeypot scan with multiple targets
   */
  private async executeHoneypotScan(
    scanName: string,
    targets: HoneypotTarget[]
  ): Promise<HoneypotAttackResult> {
    const logs: Array<{ timestamp: string; level: 'info' | 'success' | 'warning' | 'error'; message: string }> = [];
    const response_times: number[] = [];
    const status_codes: Record<number, number> = {};

    let targets_found = 0;
    let honeypots_triggered = 0;

    logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Starting ${scanName}...`,
    });

    logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Security mode: ${this.securityEnabled ? 'ON (via Gateway)' : 'OFF (Direct Access)'}`,
    });

    for (const target of targets) {
      const startTime = Date.now();

      try {
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Probing ${target.method} ${target.path} - ${target.description}`,
        });

        // Use Vite proxy in development, direct URL in production
        const isDev = import.meta.env.DEV;
        const url = isDev ? target.path : `${this.gatewayUrl}${target.path}`;

        const response = await fetch(url, {
          method: target.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: target.method === 'POST' ? JSON.stringify({ username: 'admin', password: 'admin' }) : undefined,
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        response_times.push(responseTime);

        const statusCode = response.status;
        status_codes[statusCode] = (status_codes[statusCode] || 0) + 1;

        if (statusCode === 404) {
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `  └─ Not found (404) - ${responseTime}ms`,
          });
        } else if (statusCode === 429) {
          // Rate limit hit
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'warning',
            message: `  └─ Rate limit exceeded (429) - Gateway protection active - ${responseTime}ms`,
          });
        } else if (statusCode === 200) {
          targets_found++;
          honeypots_triggered++;
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'success',
            message: `  └─ FOUND! Status ${statusCode} - ${responseTime}ms - HONEYPOT TRIGGERED! 🍯`,
          });
        } else {
          honeypots_triggered++;
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'warning',
            message: `  └─ Response ${statusCode} - ${responseTime}ms - Potential honeypot!`,
          });
        }

        // Delay to avoid rate limiting
        // Honeypot endpoints have aggressive rate limiting: 5 req/min, burst 2
        // Security ON: 13 seconds between requests (60s / 5 requests + buffer)
        // Security OFF: 1 second (no rate limiting on direct access)
        const delay = this.securityEnabled ? 13000 : 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `  └─ Error probing ${target.path}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    const attack_detected = honeypots_triggered > 0;

    logs.push({
      timestamp: new Date().toISOString(),
      level: attack_detected ? 'warning' : 'info',
      message: `\n${scanName} complete:`,
    });
    logs.push({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `  Targets probed: ${targets.length}`,
    });
    logs.push({
      timestamp: new Date().toISOString(),
      level: 'success',
      message: `  Targets found: ${targets_found}`,
    });
    logs.push({
      timestamp: new Date().toISOString(),
      level: 'warning',
      message: `  Honeypots triggered: ${honeypots_triggered}`,
    });

    if (attack_detected) {
      logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `\n⚠️  ATTACK DETECTED! Your IP has been logged by honeypot system.`,
      });
      logs.push({
        timestamp: new Date().toISOString(),
        level: 'warning',
        message: `Check Prometheus metrics: gateway_honeypot_hits_total`,
      });
    }

    return {
      success: true,
      targets_probed: targets.length,
      targets_found,
      honeypots_triggered,
      attack_detected,
      logs,
      metrics: {
        response_times,
        status_codes,
      },
    };
  }

  /**
   * Get honeypot hit statistics from Prometheus
   */
  async getHoneypotStatistics(): Promise<{
    total_hits: number;
    unique_attackers: number;
    top_paths: Array<{ path: string; count: number }>;
  }> {
    try {
      const response = await apiClient.get<any>('http://localhost:9090/api/v1/query', {
        params: {
          query: 'gateway_honeypot_hits_total',
        },
      });

      const data = response;
      // Process Prometheus response
      return {
        total_hits: data?.data?.result?.length || 0,
        unique_attackers: 0, // Would need to query separate metric
        top_paths: [],
      };
    } catch (error) {
      console.error('Failed to fetch honeypot statistics:', error);
      return {
        total_hits: 0,
        unique_attackers: 0,
        top_paths: [],
      };
    }
  }
}

export default new HoneypotService();
