/**
 * AttackTooltip Component
 *
 * Educational tooltip showing attack/defense details
 * Features:
 * - What: Description of attack/defense
 * - How: Technical explanation
 * - Impact: Security implications
 * - Prevention: How to defend
 */

import { Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { AttackType, DefenseType } from '@/types/battle'

interface TooltipContent {
  what: string
  how: string
  impact: string
  prevention: string[]
}

const ATTACK_TOOLTIPS: Record<AttackType, TooltipContent> = {
  brute_force: {
    what: 'Automated password guessing attack',
    how: 'Tries common passwords (admin123, password, etc.) in rapid succession',
    impact: 'Can compromise accounts with weak passwords in minutes',
    prevention: [
      'Strong passwords (12+ chars, mixed)',
      'Rate limiting (max attempts)',
      'MFA (multi-factor authentication)',
      'Account lockout after N failures',
    ],
  },
  mfa_bypass: {
    what: 'Multi-factor authentication bypass',
    how: 'Exploits race conditions, session hijacking, or code prediction',
    impact: 'Bypasses second layer of security, full account takeover',
    prevention: [
      'Time-based OTP with short validity',
      'Challenge-response validation',
      'Session binding to device',
      'Anomaly detection',
    ],
  },
  idor: {
    what: 'Insecure Direct Object Reference',
    how: 'Changes user IDs in requests to access other users\' data',
    impact: 'Unauthorized access to private user data and profiles',
    prevention: [
      'Authorization checks on every request',
      'Indirect references (hashes, not IDs)',
      'Access control lists (ACLs)',
      'Input validation',
    ],
  },
  gateway_bypass: {
    what: 'Direct backend access bypass',
    how: 'Connects directly to backend services, skipping gateway security',
    impact: 'Evades WAF, rate limiting, and authentication layers',
    prevention: [
      'Network segmentation',
      'Service-level authentication',
      'Internal firewall rules',
      'mTLS between services',
    ],
  },
  rate_limit_bypass: {
    what: 'Evade rate limiting controls',
    how: 'Uses IP rotation, distributed attacks, or timing manipulation',
    impact: 'Enables brute force and DDoS despite rate limits',
    prevention: [
      'Distributed rate limiting (Redis)',
      'Fingerprinting (beyond IP)',
      'CAPTCHA on suspicious traffic',
      'Progressive delays',
    ],
  },
  sql_injection: {
    what: 'Database injection attack',
    how: 'Injects malicious SQL code through input fields',
    impact: 'Data theft, deletion, or modification; full database compromise',
    prevention: [
      'Parameterized queries (prepared statements)',
      'Input sanitization and validation',
      'Least privilege DB accounts',
      'WAF with SQL injection rules',
    ],
  },
  xss: {
    what: 'Cross-site scripting attack',
    how: 'Injects malicious JavaScript into web pages',
    impact: 'Session hijacking, credential theft, defacement',
    prevention: [
      'Output encoding/escaping',
      'Content Security Policy (CSP)',
      'HTTPOnly cookies',
      'Input validation',
    ],
  },
  honeypot_probe: {
    what: 'Reconnaissance scan for hidden endpoints',
    how: 'Scans for fake/hidden services to map system architecture',
    impact: 'Reveals attack attempts early, attacker fingerprinting',
    prevention: [
      'Deploy honeypots to detect attackers',
      'Monitor for suspicious scanning',
      'Rate limit scanning attempts',
      'Log and ban aggressive scanners',
    ],
  },
}

const DEFENSE_TOOLTIPS: Record<DefenseType, TooltipContent> = {
  waf: {
    what: 'Web Application Firewall',
    how: 'Inspects HTTP traffic for malicious patterns (SQL, XSS, etc.)',
    impact: 'Blocks common web attacks before they reach the application',
    prevention: [
      'Regularly update rule sets',
      'Custom rules for app-specific threats',
      'Monitor false positives',
      'Combine with other defenses',
    ],
  },
  rate_limit: {
    what: 'Request rate limiting',
    how: 'Limits requests to N per minute per IP/user',
    impact: 'Slows down brute force and prevents resource exhaustion',
    prevention: [
      'Set appropriate thresholds',
      'Use token bucket algorithm',
      'Store limits in Redis/distributed cache',
      'Apply per-endpoint and global limits',
    ],
  },
  honeypot: {
    what: 'Decoy system for attacker detection',
    how: 'Fake endpoints that alert when accessed',
    impact: 'Early warning system for attacks, attacker profiling',
    prevention: [
      'Make honeypots look realistic',
      'Isolate from production data',
      'Log all honeypot activity',
      'Trigger automated responses',
    ],
  },
  ip_ban: {
    what: 'Block malicious IP addresses',
    how: 'Maintains blacklist of IPs with suspicious behavior',
    impact: 'Prevents repeat attacks from same source',
    prevention: [
      'Automatic ban after threshold',
      'Temporary bans with TTL',
      'Whitelist trusted IPs',
      'Combine with geo-blocking',
    ],
  },
  token_revocation: {
    what: 'Invalidate compromised tokens',
    how: 'Adds tokens to blacklist in Redis when compromised',
    impact: 'Stops ongoing attacks using stolen credentials',
    prevention: [
      'Short token expiry (5-15 min)',
      'Refresh token rotation',
      'Revoke on suspicious activity',
      'Session binding to device/IP',
    ],
  },
  incident_response: {
    what: 'Automated incident response system',
    how: 'Detects attacks via metrics and executes runbooks automatically',
    impact: 'Rapid response to attacks (seconds vs minutes)',
    prevention: [
      'Define runbooks for common attacks',
      'Integrate with monitoring',
      'Test runbooks regularly',
      'Human escalation for critical incidents',
    ],
  },
  jwt_validation: {
    what: 'JWT token validation',
    how: 'Verifies signature, expiry, and claims on every request',
    impact: 'Prevents use of forged or expired tokens',
    prevention: [
      'Strong secret key management',
      'Short expiry times',
      'Validate all claims',
      'Reject unsigned/weak algorithms',
    ],
  },
}

interface AttackTooltipProps {
  type: AttackType | DefenseType
  mode: 'attack' | 'defense'
  children?: React.ReactNode
}

export function AttackTooltip({ type, mode, children }: AttackTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  const content = mode === 'attack'
    ? ATTACK_TOOLTIPS[type as AttackType]
    : DEFENSE_TOOLTIPS[type as DefenseType]

  if (!content) return <>{children}</>

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center gap-1 cursor-help"
      >
        {children}
        <Info className="w-3 h-3 text-gray-500 hover:text-cyber-primary transition-colors" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 pointer-events-none"
          >
            <div className="bg-cyber-surface border border-cyber-border rounded-lg shadow-2xl p-4">
              <div className="space-y-3">
                {/* What */}
                <div>
                  <div className="text-xs font-bold text-cyber-primary mb-1">
                    {mode === 'attack' ? '🔓 ATTACK' : '🛡️ DEFENSE'}
                  </div>
                  <p className="text-sm text-gray-300">{content.what}</p>
                </div>

                {/* How */}
                <div>
                  <div className="text-xs font-bold text-gray-400 mb-1">HOW IT WORKS</div>
                  <p className="text-xs text-gray-400">{content.how}</p>
                </div>

                {/* Impact */}
                <div>
                  <div className="text-xs font-bold text-orange-500 mb-1">IMPACT</div>
                  <p className="text-xs text-gray-400">{content.impact}</p>
                </div>

                {/* Prevention */}
                <div>
                  <div className="text-xs font-bold text-green-500 mb-1">
                    {mode === 'attack' ? 'PREVENTION' : 'BEST PRACTICES'}
                  </div>
                  <ul className="text-xs text-gray-400 space-y-1">
                    {content.prevention.map((item, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                <div className="border-8 border-transparent border-t-cyber-border" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full">
                  <div className="border-[7px] border-transparent border-t-cyber-surface" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
