/**
 * WAF Analytics Service
 *
 * Fetches WAF metrics from Prometheus and provides WAF configuration data
 */

import { apiClient } from './apiClient'
import { ENDPOINTS } from '@/utils/constants'
import type { PrometheusQueryResponse } from '@/types/api'

// ============================================================================
// Types
// ============================================================================

export interface WafBlockStats {
  reason: string
  count: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  color: string
}

export interface SuspiciousPattern {
  pattern: string
  count: number
  lastSeen: string
  attackerIps: string[]
}

export interface EndpointRateLimit {
  endpoint: string
  rate: number
  burst: number
  window: string
  status: 'active' | 'inactive'
  currentBlocks?: number
  note?: string
}

export interface UserAgentBlock {
  category: 'scanner' | 'scraper' | 'bot'
  agent: string
  count: number
}

export interface ScannerStats {
  scanner: string
  count: number
  lastSeen: string
}

export interface WafSignatureCategory {
  name: string
  count: number
  severity: 'critical' | 'high' | 'medium'
  color: string
  blockCount?: number
}

export interface WafDashboardData {
  signatureCategories: WafSignatureCategory[]
  blocksByReason: WafBlockStats[]
  suspiciousPatterns: SuspiciousPattern[]
  endpointRateLimits: EndpointRateLimit[]
  userAgentBlocks: UserAgentBlock[]
  blockedScanners: ScannerStats[]
  totalBlocks: number
  activeSignatures: number
  protectedEndpoints: number
}

// ============================================================================
// Configuration Data (Hardcoded - from Gateway implementation)
// ============================================================================

const WAF_SIGNATURES: Record<string, WafSignatureCategory> = {
  sql_injection: { name: 'SQL Injection', count: 8, severity: 'critical', color: 'red' },
  xss: { name: 'Cross-Site Scripting (XSS)', count: 7, severity: 'high', color: 'orange' },
  command_injection: { name: 'Command Injection', count: 4, severity: 'critical', color: 'red' },
  path_traversal: { name: 'Path Traversal', count: 3, severity: 'high', color: 'orange' },
  xxe: { name: 'XML External Entity (XXE)', count: 2, severity: 'critical', color: 'red' },
  ssrf: { name: 'Server-Side Request Forgery', count: 2, severity: 'critical', color: 'red' },
  ldap_injection: { name: 'LDAP Injection', count: 1, severity: 'medium', color: 'yellow' },
  template_injection: { name: 'Template Injection', count: 1, severity: 'high', color: 'orange' },
}

const ENDPOINT_RATE_LIMITS: EndpointRateLimit[] = [
  { endpoint: '/auth/login', rate: 10, burst: 3, window: '1 minute', status: 'active', note: 'Critical auth endpoint' },
  { endpoint: '/auth/mfa/verify', rate: 15, burst: 5, window: '1 minute', status: 'active', note: 'MFA verification' },
  { endpoint: '/auth/token/refresh', rate: 20, burst: 5, window: '1 minute', status: 'active' },
  { endpoint: '/api/users/profile/*', rate: 30, burst: 10, window: '1 minute', status: 'active' },
  { endpoint: '/api/users/settings', rate: 20, burst: 5, window: '1 minute', status: 'active' },
  { endpoint: '/admin*', rate: 5, burst: 2, window: '1 minute', status: 'active', note: 'Honeypot protection' },
  { endpoint: '/.env', rate: 5, burst: 2, window: '1 minute', status: 'active', note: 'Honeypot protection' },
]

const BLOCKED_USER_AGENTS = {
  scanners: [
    'nikto', 'nmap', 'masscan', 'zgrab', 'sqlmap', 'havij', 'acunetix',
    'nessus', 'openvas', 'w3af', 'burp', 'metasploit'
  ],
  scrapers: [
    'scrapy', 'python-requests', 'curl', 'wget'
  ],
  bots: [
    'semrush', 'ahrefs', 'mj12bot', 'dotbot'
  ]
}

const WHITELISTED_USER_AGENTS = [
  'googlebot', 'bingbot', 'duckduckbot', 'slackbot', 'twitterbot',
  'facebookexternalhit', 'uptimerobot', 'pingdom'
]

// ============================================================================
// Service Class
// ============================================================================

class WafService {
  /**
   * Get WAF blocks by reason from Prometheus
   */
  async getWafBlocksByReason(): Promise<WafBlockStats[]> {
    try {
      const response = await apiClient.get<PrometheusQueryResponse>(
        ENDPOINTS.PROMETHEUS.QUERY,
        {
          params: {
            query: 'gateway_waf_blocks_total',
          },
        }
      )

      if (response.status === 'success' && response.data.result.length > 0) {
        return response.data.result.map((item) => {
          const reason = item.metric.reason || 'unknown'
          const count = parseInt(item.value?.[1] || '0', 10)

          // Map reason to severity and color
          let severity: 'critical' | 'high' | 'medium' | 'low' = 'low'
          let color = 'gray'

          if (reason.includes('sql') || reason.includes('command') || reason.includes('xxe') || reason.includes('ssrf')) {
            severity = 'critical'
            color = 'red'
          } else if (reason.includes('xss') || reason.includes('path') || reason.includes('template')) {
            severity = 'high'
            color = 'orange'
          } else if (reason.includes('ldap')) {
            severity = 'medium'
            color = 'yellow'
          }

          return { reason, count, severity, color }
        })
      }

      return []
    } catch (error) {
      console.error('Failed to fetch WAF blocks:', error)
      return []
    }
  }

  /**
   * Get suspicious patterns detected
   */
  async getSuspiciousPatterns(): Promise<SuspiciousPattern[]> {
    try {
      const response = await apiClient.get<PrometheusQueryResponse>(
        ENDPOINTS.PROMETHEUS.QUERY,
        {
          params: {
            query: 'gateway_waf_suspicious_patterns',
          },
        }
      )

      if (response.status === 'success' && response.data.result.length > 0) {
        // Group by pattern
        const patternMap = new Map<string, { count: number; ips: Set<string>; lastSeen: number }>()

        response.data.result.forEach((item) => {
          const pattern = item.metric.pattern || 'unknown'
          const clientIp = item.metric.client_ip || 'unknown'
          const count = parseInt(item.value?.[1] || '0', 10)
          const timestamp = item.value?.[0] || Date.now() / 1000

          if (patternMap.has(pattern)) {
            const existing = patternMap.get(pattern)!
            existing.count += count
            existing.ips.add(clientIp)
            existing.lastSeen = Math.max(existing.lastSeen, timestamp)
          } else {
            patternMap.set(pattern, {
              count,
              ips: new Set([clientIp]),
              lastSeen: timestamp,
            })
          }
        })

        // Convert to array and sort by count
        return Array.from(patternMap.entries())
          .map(([pattern, data]) => ({
            pattern,
            count: data.count,
            lastSeen: new Date(data.lastSeen * 1000).toISOString(),
            attackerIps: Array.from(data.ips),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10) // Top 10
      }

      return []
    } catch (error) {
      console.error('Failed to fetch suspicious patterns:', error)
      return []
    }
  }

  /**
   * Get per-endpoint rate limit configuration
   */
  getEndpointRateLimits(): EndpointRateLimit[] {
    return ENDPOINT_RATE_LIMITS
  }

  /**
   * Get User-Agent filtering stats
   */
  async getUserAgentBlocks(): Promise<UserAgentBlock[]> {
    try {
      const response = await apiClient.get<PrometheusQueryResponse>(
        ENDPOINTS.PROMETHEUS.QUERY,
        {
          params: {
            query: 'gateway_user_agent_blocks_total',
          },
        }
      )

      if (response.status === 'success' && response.data.result.length > 0) {
        return response.data.result.map((item) => {
          const agent = item.metric.user_agent || 'unknown'
          const count = parseInt(item.value?.[1] || '0', 10)

          // Determine category
          let category: 'scanner' | 'scraper' | 'bot' = 'bot'
          if (BLOCKED_USER_AGENTS.scanners.some(s => agent.toLowerCase().includes(s))) {
            category = 'scanner'
          } else if (BLOCKED_USER_AGENTS.scrapers.some(s => agent.toLowerCase().includes(s))) {
            category = 'scraper'
          }

          return { category, agent, count }
        })
      }

      return []
    } catch (error) {
      console.error('Failed to fetch User-Agent blocks:', error)
      return []
    }
  }

  /**
   * Get blocked scanner statistics
   */
  async getBlockedScanners(): Promise<ScannerStats[]> {
    const userAgentBlocks = await this.getUserAgentBlocks()
    const scannerBlocks = userAgentBlocks.filter(b => b.category === 'scanner')

    return scannerBlocks.map(block => ({
      scanner: block.agent,
      count: block.count,
      lastSeen: new Date().toISOString(), // Could be enhanced with actual last seen from Prometheus
    }))
  }

  /**
   * Get WAF signature categories with block counts
   */
  async getSignatureCategories(): Promise<WafSignatureCategory[]> {
    const blocksByReason = await this.getWafBlocksByReason()

    // Map block reasons to signature categories
    return Object.entries(WAF_SIGNATURES).map(([key, category]) => {
      const matchingBlocks = blocksByReason.filter(b =>
        b.reason.toLowerCase().includes(key.replace('_', ' '))
      )
      const blockCount = matchingBlocks.reduce((sum, b) => sum + b.count, 0)

      return {
        ...category,
        blockCount: blockCount > 0 ? blockCount : undefined,
      }
    })
  }

  /**
   * Get complete WAF dashboard data
   */
  async getWafDashboardData(): Promise<WafDashboardData> {
    try {
      const [
        signatureCategories,
        blocksByReason,
        suspiciousPatterns,
        userAgentBlocks,
        blockedScanners,
      ] = await Promise.all([
        this.getSignatureCategories(),
        this.getWafBlocksByReason(),
        this.getSuspiciousPatterns(),
        this.getUserAgentBlocks(),
        this.getBlockedScanners(),
      ])

      const endpointRateLimits = this.getEndpointRateLimits()

      const totalBlocks = blocksByReason.reduce((sum, b) => sum + b.count, 0)
      const activeSignatures = Object.keys(WAF_SIGNATURES).length
      const protectedEndpoints = ENDPOINT_RATE_LIMITS.length

      return {
        signatureCategories,
        blocksByReason,
        suspiciousPatterns,
        endpointRateLimits,
        userAgentBlocks,
        blockedScanners,
        totalBlocks,
        activeSignatures,
        protectedEndpoints,
      }
    } catch (error) {
      console.error('Failed to fetch WAF dashboard data:', error)

      // Return default data with hardcoded configuration
      return {
        signatureCategories: Object.values(WAF_SIGNATURES),
        blocksByReason: [],
        suspiciousPatterns: [],
        endpointRateLimits: ENDPOINT_RATE_LIMITS,
        userAgentBlocks: [],
        blockedScanners: [],
        totalBlocks: 0,
        activeSignatures: Object.keys(WAF_SIGNATURES).length,
        protectedEndpoints: ENDPOINT_RATE_LIMITS.length,
      }
    }
  }

  /**
   * Get blocked User-Agent categories
   */
  getBlockedUserAgentCategories() {
    return BLOCKED_USER_AGENTS
  }

  /**
   * Get whitelisted User-Agents
   */
  getWhitelistedUserAgents() {
    return WHITELISTED_USER_AGENTS
  }
}

export default new WafService()
