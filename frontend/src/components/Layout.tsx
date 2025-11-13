/**
 * Main Layout Component
 *
 * Provides navigation, header, and consistent structure across all pages
 */

import { Link, Outlet } from 'react-router-dom'
import { Shield, Target, Activity, BookOpen, Github } from 'lucide-react'
import { BackendStatusIndicator } from './BackendStatusIndicator'
import { cn } from '@/utils/cn'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-cyber-surface/95 backdrop-blur-sm border-b border-cyber-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Shield className="w-8 h-8 text-cyber-primary group-hover:text-cyber-secondary transition-colors" />
                <div className="absolute inset-0 blur-xl bg-cyber-primary/30 group-hover:bg-cyber-secondary/30 transition-colors" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-matrix">DevSecOps Hacking Lab</h1>
                <p className="text-xs text-gray-400">Interactive Security Testing Platform</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <NavLink to="/" icon={Shield}>Home</NavLink>
              <NavLink to="/attacks" icon={Target}>Attacks</NavLink>
              <NavLink to="/monitoring" icon={Activity}>Monitoring</NavLink>
              <NavLink to="/docs" icon={BookOpen}>Docs</NavLink>
            </nav>

            {/* Status & GitHub */}
            <div className="flex items-center gap-3">
              <BackendStatusIndicator variant="compact" />
              <a
                href="https://github.com/yourusername/DevSecOps-Hacking-Lab"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-cyber-bg border border-cyber-border hover:border-cyber-primary/50 transition-all"
                title="View on GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-cyber-surface border-t border-cyber-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h3 className="text-lg font-semibold text-cyber-primary mb-3">About</h3>
              <p className="text-sm text-gray-400">
                Educational security testing environment demonstrating offensive and defensive techniques
                in containerized microservices.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-cyber-primary mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/docs/quickstart" className="text-gray-400 hover:text-cyber-primary transition-colors">Quick Start Guide</Link></li>
                <li><Link to="/docs/architecture" className="text-gray-400 hover:text-cyber-primary transition-colors">Architecture</Link></li>
                <li><Link to="/attacks" className="text-gray-400 hover:text-cyber-primary transition-colors">Attack Scenarios</Link></li>
                <li><a href="https://github.com/yourusername/DevSecOps-Hacking-Lab" className="text-gray-400 hover:text-cyber-primary transition-colors">GitHub Repository</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-lg font-semibold text-cyber-primary mb-3">Legal</h3>
              <p className="text-sm text-gray-400 mb-2">
                For educational purposes only. See <Link to="/docs/disclaimer" className="text-cyber-primary hover:underline">DISCLAIMER</Link> for terms.
              </p>
              <p className="text-xs text-gray-500">
                MIT License &copy; 2024
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

interface NavLinkProps {
  to: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}

function NavLink({ to, icon: Icon, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'text-gray-300 hover:text-cyber-primary',
        'hover:bg-cyber-bg/50 transition-all',
        'border border-transparent hover:border-cyber-border'
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{children}</span>
    </Link>
  )
}
