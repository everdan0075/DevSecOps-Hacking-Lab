/**
 * Architecture Page
 *
 * Visualizes the DevSecOps Hacking Lab architecture with interactive diagrams,
 * service health status, port mappings, and data flow animations
 */

import { useState } from 'react'
import { Server, Database, Activity, Shield, AlertTriangle, Eye, Zap } from 'lucide-react'
import { ServiceDiagram } from '@/components/ServiceDiagram'
import { PortMappingTable } from '@/components/PortMappingTable'
import { DataFlowAnimation } from '@/components/DataFlowAnimation'
import { TechStackBadges } from '@/components/TechStackBadges'
import { useBackendStatus } from '@/hooks/useBackendStatus'
import { cn } from '@/utils/cn'

export function Architecture() {
  const { isConnected } = useBackendStatus()
  const [selectedService, setSelectedService] = useState<string | null>(null)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-block mb-4">
          <Server className="w-16 h-16 text-cyber-primary mx-auto animate-pulse-glow" />
        </div>
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-matrix">System Architecture</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Interactive visualization of the DevSecOps Hacking Lab microservices architecture,
          security layers, and monitoring infrastructure
        </p>
      </div>

      {/* Backend Status Warning */}
      {!isConnected && (
        <div className="mb-8 p-4 rounded-lg bg-cyber-warning/10 border border-cyber-warning/30 max-w-4xl mx-auto">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-cyber-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-cyber-warning font-semibold mb-1">
                Backend Services Not Connected
              </p>
              <p className="text-xs text-gray-400">
                Service health checks will show as unknown. Start the Docker stack to see live status:
              </p>
              <code className="block mt-2 px-3 py-2 bg-black/50 rounded text-cyber-primary text-xs">
                docker-compose up -d
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Service Diagram */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-cyber-secondary" />
          Service Mesh Diagram
        </h2>
        <div className="card-glow">
          <ServiceDiagram
            selectedService={selectedService}
            onServiceSelect={setSelectedService}
            isConnected={isConnected}
          />
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          Click on services to highlight connections • Hover for details
        </p>
      </section>

      {/* Data Flow Animation */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Zap className="w-6 h-6 text-cyber-warning" />
          Request Flow Visualization
        </h2>
        <div className="card-glow">
          <DataFlowAnimation />
        </div>
      </section>

      {/* Port Mapping Table */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Database className="w-6 h-6 text-cyber-success" />
          Service Port Mapping
        </h2>
        <PortMappingTable
          onServiceSelect={setSelectedService}
          selectedService={selectedService}
        />
      </section>

      {/* Architecture Layers */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Shield className="w-6 h-6 text-cyber-primary" />
          Security Layers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LayerCard
            title="Gateway Layer"
            icon={Shield}
            color="text-cyber-primary"
            items={[
              'JWT Token Validation',
              'Rate Limiting (60 req/min)',
              'WAF Rules (SQLi, XSS, Path Traversal)',
              'Security Headers (CSP, X-Frame-Options)',
              'Request Size Validation (10MB max)',
            ]}
          />
          <LayerCard
            title="Application Layer"
            icon={Server}
            color="text-cyber-secondary"
            items={[
              'Auth Service (JWT + MFA)',
              'User Service (CRUD + Profiles)',
              'Redis Session Store',
              'Token Refresh & Revocation',
              'Business Logic',
            ]}
          />
          <LayerCard
            title="Monitoring Layer"
            icon={Eye}
            color="text-cyber-warning"
            items={[
              'Prometheus (Metrics Collection)',
              'Grafana (Visualization)',
              'Alertmanager (Alert Routing)',
              'Incident Bot (Automated Response)',
              'Real-time Security Events',
            ]}
          />
        </div>
      </section>

      {/* Intentional Vulnerabilities */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-cyber-danger" />
          Educational Vulnerabilities
        </h2>
        <div className="card-glow bg-cyber-danger/5 border-cyber-danger/30">
          <p className="text-sm text-gray-400 mb-4">
            The following vulnerabilities are <strong>intentionally included</strong> for educational purposes.
            They demonstrate common security flaws found in real-world applications:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VulnerabilityCard
              title="IDOR (Insecure Direct Object Reference)"
              service="User Service"
              endpoint="/profile/{user_id}"
              description="Any authenticated user can access any profile by changing the user_id parameter. No authorization checks implemented."
              owasp="A01:2021 - Broken Access Control"
            />
            <VulnerabilityCard
              title="Authentication Bypass"
              service="User Service"
              endpoint="/settings"
              description="Settings endpoint lacks JWT validation, allowing unauthenticated access to sensitive operations."
              owasp="A07:2021 - Identification & Authentication Failures"
            />
            <VulnerabilityCard
              title="Gateway Bypass"
              service="All Backend Services"
              endpoint="Direct port access (8000, 8002)"
              description="Backend services exposed on public ports, allowing attackers to bypass gateway security controls."
              owasp="A05:2021 - Security Misconfiguration"
            />
            <VulnerabilityCard
              title="Rate Limit Bypass"
              service="Backend Services"
              endpoint="All endpoints via direct access"
              description="Rate limiting only enforced at gateway level. Direct service access allows unlimited requests."
              owasp="A04:2021 - Insecure Design"
            />
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Technology Stack</h2>
        <TechStackBadges />
      </section>

      {/* Architecture Insights */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InsightCard
            title="Microservices Design"
            description="Each service runs independently in Docker containers with dedicated responsibilities. Services communicate via HTTP APIs with centralized monitoring."
          />
          <InsightCard
            title="Defense in Depth"
            description="Multiple security layers: Gateway (WAF, rate limiting) → Auth Service (JWT, MFA) → Redis (session management) → Monitoring (incident response)."
          />
          <InsightCard
            title="Observability First"
            description="Prometheus metrics exported by every service. Grafana dashboards for real-time visibility. Alertmanager for automated incident routing."
          />
          <InsightCard
            title="Educational Focus"
            description="Intentional vulnerabilities demonstrate real-world attack vectors. All attacks tracked in metrics. Incident bot provides automated response examples."
          />
        </div>
      </section>
    </div>
  )
}

interface LayerCardProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  items: string[]
}

function LayerCard({ title, icon: Icon, color, items }: LayerCardProps) {
  return (
    <div className="card-glow">
      <div className="flex items-center gap-3 mb-4">
        <Icon className={cn('w-8 h-8', color)} />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
            <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0', color.replace('text-', 'bg-'))} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface VulnerabilityCardProps {
  title: string
  service: string
  endpoint: string
  description: string
  owasp: string
}

function VulnerabilityCard({ title, service, endpoint, description, owasp }: VulnerabilityCardProps) {
  return (
    <div className="p-4 rounded-lg bg-cyber-bg border border-cyber-danger/30 hover:border-cyber-danger/50 transition-all">
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-cyber-danger flex-shrink-0 mt-0.5" />
        <h4 className="font-semibold text-cyber-danger">{title}</h4>
      </div>
      <div className="space-y-2 text-xs">
        <div>
          <span className="text-gray-500">Service:</span>{' '}
          <span className="text-gray-300">{service}</span>
        </div>
        <div>
          <span className="text-gray-500">Endpoint:</span>{' '}
          <code className="text-cyber-primary bg-black/50 px-1 py-0.5 rounded">{endpoint}</code>
        </div>
        <p className="text-gray-400">{description}</p>
        <div className="pt-2 border-t border-cyber-border">
          <span className="text-gray-500">OWASP:</span>{' '}
          <span className="text-cyber-warning">{owasp}</span>
        </div>
      </div>
    </div>
  )
}

interface InsightCardProps {
  title: string
  description: string
}

function InsightCard({ title, description }: InsightCardProps) {
  return (
    <div className="p-6 rounded-lg bg-cyber-surface border border-cyber-border hover:border-cyber-primary/50 transition-all">
      <h3 className="text-lg font-semibold mb-2 text-cyber-primary">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  )
}
