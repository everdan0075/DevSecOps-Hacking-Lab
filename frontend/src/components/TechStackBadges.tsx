/**
 * TechStackBadges Component
 *
 * Displays technology stack badges with icons and descriptions
 */

import { Code, Database, Activity, Container, Shield, Zap } from 'lucide-react'

interface Technology {
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  category: 'Backend' | 'Database' | 'Monitoring' | 'Infrastructure' | 'Security' | 'Frontend'
  color: string
}

const technologies: Technology[] = [
  {
    name: 'FastAPI',
    icon: Zap,
    description: 'High-performance Python web framework for all microservices',
    category: 'Backend',
    color: 'text-cyber-success',
  },
  {
    name: 'Python 3.11+',
    icon: Code,
    description: 'Modern Python with async/await support',
    category: 'Backend',
    color: 'text-cyber-secondary',
  },
  {
    name: 'Redis',
    icon: Database,
    description: 'In-memory data store for sessions, rate limiting, IP bans',
    category: 'Database',
    color: 'text-cyber-danger',
  },
  {
    name: 'Prometheus',
    icon: Activity,
    description: 'Time-series metrics collection and alerting',
    category: 'Monitoring',
    color: 'text-cyber-warning',
  },
  {
    name: 'Grafana',
    icon: Activity,
    description: 'Visualization dashboards for security metrics',
    category: 'Monitoring',
    color: 'text-cyber-warning',
  },
  {
    name: 'Docker',
    icon: Container,
    description: 'Containerization for all services',
    category: 'Infrastructure',
    color: 'text-cyber-secondary',
  },
  {
    name: 'Docker Compose',
    icon: Container,
    description: 'Multi-container orchestration',
    category: 'Infrastructure',
    color: 'text-cyber-secondary',
  },
  {
    name: 'JWT',
    icon: Shield,
    description: 'JSON Web Tokens for stateless authentication',
    category: 'Security',
    color: 'text-cyber-primary',
  },
  {
    name: 'TOTP (MFA)',
    icon: Shield,
    description: 'Time-based One-Time Passwords for multi-factor auth',
    category: 'Security',
    color: 'text-cyber-primary',
  },
  {
    name: 'React + TypeScript',
    icon: Code,
    description: 'Modern frontend with type safety',
    category: 'Frontend',
    color: 'text-cyber-secondary',
  },
  {
    name: 'Vite',
    icon: Zap,
    description: 'Lightning-fast build tool and dev server',
    category: 'Frontend',
    color: 'text-cyber-accent',
  },
  {
    name: 'Tailwind CSS',
    icon: Code,
    description: 'Utility-first CSS framework for cyberpunk theme',
    category: 'Frontend',
    color: 'text-cyber-secondary',
  },
]

export function TechStackBadges() {
  const categories = ['Backend', 'Frontend', 'Database', 'Security', 'Monitoring', 'Infrastructure'] as const

  return (
    <div className="space-y-8">
      {categories.map(category => {
        const categoryTechs = technologies.filter(t => t.category === category)
        if (categoryTechs.length === 0) return null

        return (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-4 text-gray-300">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTechs.map(tech => (
                <TechBadge key={tech.name} tech={tech} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface TechBadgeProps {
  tech: Technology
}

function TechBadge({ tech }: TechBadgeProps) {
  const Icon = tech.icon

  return (
    <div className="group card-glow hover:scale-105 transition-transform">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-cyber-bg border border-cyber-border group-hover:border-current transition-colors ${tech.color}`}>
          <Icon className={`w-5 h-5 ${tech.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold mb-1 ${tech.color}`}>{tech.name}</h4>
          <p className="text-xs text-gray-400 leading-relaxed">{tech.description}</p>
        </div>
      </div>
    </div>
  )
}
