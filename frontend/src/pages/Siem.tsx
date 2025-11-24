/**
 * SIEM Dashboard Page
 *
 * Comprehensive Security Information and Event Management dashboard
 * displaying threat scores, risk assessment, attack patterns, and real-time feed
 */

import { Shield, Activity } from 'lucide-react'
import { RiskAssessmentGauge } from '@/components/siem/RiskAssessmentGauge'
import { ThreatScoreGrid } from '@/components/siem/ThreatScoreGrid'
import { DefenseEffectivenessDashboard } from '@/components/siem/DefenseEffectivenessDashboard'
import { AttackPatternTimeline } from '@/components/siem/AttackPatternTimeline'
import { RealTimeAttackFeed } from '@/components/siem/RealTimeAttackFeed'
import { SEOHead } from '@/components/SEOHead'

export function Siem() {
  return (
    <>
      <SEOHead
        title="SIEM Dashboard | DevSecOps Hacking Lab"
        description="Security Information and Event Management dashboard with real-time threat scoring, risk assessment, attack pattern detection, and defense effectiveness metrics"
        keywords="SIEM, threat intelligence, risk assessment, attack patterns, security monitoring, threat scoring, defense metrics"
      />

      <div className="min-h-screen bg-cyber-bg">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-cyber-border bg-gradient-to-b from-cyber-surface/50 to-transparent">
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-10 w-72 h-72 bg-cyber-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyber-secondary/20 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyber-primary/20 border border-cyber-primary/50 mb-6">
                <Shield className="w-8 h-8 text-cyber-primary" />
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-matrix">
                SIEM Dashboard
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
                Comprehensive security intelligence with real-time threat scoring, risk assessment,
                attack pattern detection, and defense effectiveness monitoring
              </p>

              {/* Features */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <FeatureBadge icon={Shield} text="Threat Intelligence" />
                <FeatureBadge icon={Activity} text="Real-Time Monitoring" />
                <FeatureBadge icon={Shield} text="Pattern Detection" />
                <FeatureBadge icon={Activity} text="Defense Metrics" />
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Grid */}
        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Threats (2/3 width on large screens) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Risk Assessment */}
              <RiskAssessmentGauge />

              {/* Threat Score Grid */}
              <ThreatScoreGrid />
            </div>

            {/* Right Column - Activity & Patterns (1/3 width on large screens) */}
            <div className="space-y-6">
              {/* Defense Effectiveness */}
              <DefenseEffectivenessDashboard />

              {/* Attack Patterns */}
              <AttackPatternTimeline />

              {/* Real-Time Feed */}
              <RealTimeAttackFeed />
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="container mx-auto px-4 py-8 mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="p-6 rounded-lg bg-cyber-surface border border-cyber-border">
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyber-primary" />
                About SIEM Dashboard
              </h2>
              <div className="space-y-3 text-gray-300 text-sm">
                <p>
                  The Security Information and Event Management (SIEM) dashboard provides a centralized view
                  of all security-related events and threats in the DevSecOps Hacking Lab environment.
                </p>
                <p>
                  <strong className="text-cyber-primary">Key Features:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-400">
                  <li>
                    <strong className="text-white">Threat Scoring:</strong> Advanced scoring algorithm that evaluates
                    IP addresses based on attack frequency, diversity, severity, and risk factors
                  </li>
                  <li>
                    <strong className="text-white">Risk Assessment:</strong> Real-time environment risk calculation
                    considering event volume, pattern complexity, critical IPs, and severity distribution
                  </li>
                  <li>
                    <strong className="text-white">Attack Pattern Detection:</strong> Correlation engine that identifies
                    reconnaissance, multi-stage attacks, distributed attacks, credential stuffing, and APT indicators
                  </li>
                  <li>
                    <strong className="text-white">Defense Effectiveness:</strong> Metrics on how well security controls
                    are performing, including WAF blocks, rate limiting, honeypot detections, and IDS alerts
                  </li>
                  <li>
                    <strong className="text-white">Real-Time Feed:</strong> Live stream of attack events with filtering
                    and auto-refresh capabilities for immediate threat awareness
                  </li>
                </ul>
                <p className="pt-3 border-t border-cyber-border text-gray-500 italic">
                  All components auto-refresh to provide up-to-date security intelligence. Data is aggregated
                  from multiple sources including the API Gateway, Auth Service, User Service, and Incident Bot.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

// Feature Badge Component
interface FeatureBadgeProps {
  icon: React.ComponentType<{ className?: string }>
  text: string
}

function FeatureBadge({ icon: Icon, text }: FeatureBadgeProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-surface border border-cyber-border">
      <Icon className="w-4 h-4 text-cyber-primary" />
      <span className="text-gray-300">{text}</span>
    </div>
  )
}

export default Siem
