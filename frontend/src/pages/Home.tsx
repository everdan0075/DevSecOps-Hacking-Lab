/**
 * Home Page
 *
 * Landing page with hero section, features, and quick start
 */

import { Link } from 'react-router-dom'
import { Shield, Target, Activity, AlertTriangle, Lock, Eye, Zap } from 'lucide-react'
import { BackendStatusIndicator } from '@/components/BackendStatusIndicator'
import { useBackendStatus } from '@/hooks/useBackendStatus'
import { cn } from '@/utils/cn'

export function Home() {
  const { isConnected } = useBackendStatus()

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6">
              <div className="relative">
                <Shield className="w-24 h-24 text-cyber-primary mx-auto animate-pulse-glow" />
                <div className="absolute inset-0 blur-3xl bg-cyber-primary/20" />
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-matrix">DevSecOps</span>
              <br />
              <span className="text-gray-100">Hacking Lab</span>
            </h1>

            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Interactive security testing environment demonstrating real-world offensive and defensive
              techniques in containerized microservices
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                to="/attacks"
                className={cn(
                  'btn-glow px-8 py-3 rounded-lg',
                  'bg-cyber-primary text-cyber-bg font-semibold',
                  'hover:bg-cyber-secondary transition-all',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Explore Attacks
              </Link>
              <Link
                to="/docs/quickstart"
                className={cn(
                  'px-8 py-3 rounded-lg',
                  'bg-cyber-surface border border-cyber-border',
                  'hover:border-cyber-primary transition-all'
                )}
              >
                Quick Start
              </Link>
            </div>

            <div className="inline-block">
              <BackendStatusIndicator variant="compact" />
            </div>

            {!isConnected && (
              <div className="mt-6 p-4 rounded-lg bg-cyber-warning/10 border border-cyber-warning/30 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-cyber-warning flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm text-cyber-warning font-semibold mb-1">
                      Backend Not Connected
                    </p>
                    <p className="text-xs text-gray-400">
                      To execute real attacks and view live metrics, run the Docker stack locally:
                    </p>
                    <code className="block mt-2 px-3 py-2 bg-black/50 rounded text-cyber-primary text-xs">
                      docker-compose up -d
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-matrix">
            What You'll Learn
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Target}
              title="Offensive Techniques"
              description="7 real-world attack scenarios: brute force, MFA bypass, IDOR, gateway bypass, and more"
              color="text-cyber-danger"
            />
            <FeatureCard
              icon={Shield}
              title="Defensive Controls"
              description="JWT validation, rate limiting, WAF, IP banning, and automated incident response"
              color="text-cyber-success"
            />
            <FeatureCard
              icon={Activity}
              title="Live Monitoring"
              description="Prometheus metrics, Grafana dashboards, and real-time security visibility"
              color="text-cyber-secondary"
            />
            <FeatureCard
              icon={Zap}
              title="Incident Response"
              description="Automated runbooks with 9 prebuilt scenarios for rapid threat mitigation"
              color="text-cyber-warning"
            />
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-16 bg-cyber-surface/50 relative z-10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-matrix">
            Architecture Overview
          </h2>

          <div className="max-w-4xl mx-auto">
            <div className="card-glow p-8">
              <div className="space-y-6">
                <ArchitectureLayer
                  name="API Gateway"
                  port="8080"
                  description="Central security layer with JWT validation, WAF, rate limiting"
                  status={isConnected}
                />
                <div className="flex gap-4">
                  <ArchitectureLayer
                    name="Auth Service"
                    port="8000"
                    description="JWT + MFA + Token Management"
                    status={isConnected}
                  />
                  <ArchitectureLayer
                    name="User Service"
                    port="8002"
                    description="User CRUD (Vulnerable: IDOR)"
                    status={isConnected}
                    vulnerable
                  />
                </div>
                <div className="flex gap-4">
                  <ArchitectureLayer
                    name="Prometheus"
                    port="9090"
                    description="Metrics Collection"
                    status={isConnected}
                  />
                  <ArchitectureLayer
                    name="Grafana"
                    port="3000"
                    description="Visualization"
                    status={isConnected}
                  />
                  <ArchitectureLayer
                    name="Incident Bot"
                    port="5002"
                    description="Automated Response"
                    status={isConnected}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Lock className="w-16 h-16 text-cyber-primary mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Ready to Start Hacking?</h2>
            <p className="text-gray-400 mb-8">
              Explore attack scenarios, monitor security events, and learn offensive/defensive techniques
              in a safe, educational environment
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/attacks"
                className="btn-glow px-8 py-3 rounded-lg bg-cyber-primary text-cyber-bg font-semibold hover:bg-cyber-secondary transition-all"
              >
                Browse Attack Scenarios
              </Link>
              <Link
                to="/monitoring"
                className="px-8 py-3 rounded-lg bg-cyber-surface border border-cyber-border hover:border-cyber-primary transition-all"
              >
                View Monitoring
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
}

function FeatureCard({ icon: Icon, title, description, color }: FeatureCardProps) {
  return (
    <div className="card-glow group">
      <Icon className={cn('w-12 h-12 mb-4', color, 'group-hover:scale-110 transition-transform')} />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  )
}

interface ArchitectureLayerProps {
  name: string
  port: string
  description: string
  status: boolean
  vulnerable?: boolean
}

function ArchitectureLayer({ name, port, description, status, vulnerable }: ArchitectureLayerProps) {
  return (
    <div className="flex-1 p-4 rounded-lg bg-cyber-bg border border-cyber-border hover:border-cyber-primary/50 transition-all">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">{name}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">:{port}</span>
          <div className={cn('w-2 h-2 rounded-full', status ? 'bg-cyber-success' : 'bg-gray-600')} />
        </div>
      </div>
      <p className="text-xs text-gray-400">{description}</p>
      {vulnerable && (
        <div className="mt-2 flex items-center gap-1 text-cyber-danger text-xs">
          <Eye className="w-3 h-3" />
          <span>Intentionally Vulnerable</span>
        </div>
      )}
    </div>
  )
}
