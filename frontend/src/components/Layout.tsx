/**
 * Main Layout Component
 *
 * Provides navigation, header, and consistent structure across all pages
 */

import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Shield, Target, Activity, BookOpen, Github, Server, Menu, X, Database, ShieldCheck, Swords } from 'lucide-react'
import { BackendStatusIndicator } from './BackendStatusIndicator'
import { SecurityToggle } from './SecurityToggle'
import { cn } from '@/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  const handleNavClick = () => {
    setMobileMenuOpen(false)
  }

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
              <NavLink to="/battle" icon={Swords}>Battle</NavLink>
              <NavLink to="/monitoring" icon={Activity}>Monitoring</NavLink>
              <NavLink to="/waf" icon={ShieldCheck}>WAF</NavLink>
              <NavLink to="/siem" icon={Database}>SIEM</NavLink>
              <NavLink to="/architecture" icon={Server}>Architecture</NavLink>
              <NavLink to="/docs" icon={BookOpen}>Docs</NavLink>
            </nav>

            {/* Status, Security Toggle & GitHub */}
            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <SecurityToggle />
              </div>
              <BackendStatusIndicator variant="compact" />
              <a
                href="https://github.com/yourusername/DevSecOps-Hacking-Lab"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex p-2 rounded-lg bg-cyber-bg border border-cyber-border hover:border-cyber-primary/50 transition-all"
                title="View on GitHub"
              >
                <Github className="w-5 h-5" />
              </a>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg bg-cyber-bg border border-cyber-border hover:border-cyber-primary/50 transition-all"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden mt-4 pb-4 border-t border-cyber-border pt-4"
              >
                <nav className="flex flex-col gap-2">
                  <MobileNavLink to="/" icon={Shield} onClick={handleNavClick}>Home</MobileNavLink>
                  <MobileNavLink to="/attacks" icon={Target} onClick={handleNavClick}>Attacks</MobileNavLink>
                  <MobileNavLink to="/battle" icon={Swords} onClick={handleNavClick}>Battle</MobileNavLink>
                  <MobileNavLink to="/monitoring" icon={Activity} onClick={handleNavClick}>Monitoring</MobileNavLink>
                  <MobileNavLink to="/waf" icon={ShieldCheck} onClick={handleNavClick}>WAF</MobileNavLink>
                  <MobileNavLink to="/siem" icon={Database} onClick={handleNavClick}>SIEM</MobileNavLink>
                  <MobileNavLink to="/architecture" icon={Server} onClick={handleNavClick}>Architecture</MobileNavLink>
                  <MobileNavLink to="/docs" icon={BookOpen} onClick={handleNavClick}>Docs</MobileNavLink>
                </nav>
                <div className="mt-4 pt-4 border-t border-cyber-border space-y-3">
                  <BackendStatusIndicator variant="detailed" />
                  <SecurityToggle />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content with page transition */}
      <main className="flex-1 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-cyber-surface border-t border-cyber-border mt-8 md:mt-16">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
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
  onClick?: () => void
}

function NavLink({ to, icon: Icon, children }: NavLinkProps) {
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'text-gray-300 hover:text-cyber-primary',
        'hover:bg-cyber-bg/50 transition-all',
        'border border-transparent hover:border-cyber-border',
        isActive && 'text-cyber-primary border-cyber-primary/50 bg-cyber-bg/50'
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{children}</span>
    </Link>
  )
}

function MobileNavLink({ to, icon: Icon, children, onClick }: NavLinkProps) {
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg',
        'text-gray-300 hover:text-cyber-primary',
        'hover:bg-cyber-bg/50 transition-all min-h-[44px]',
        'border border-transparent hover:border-cyber-border',
        isActive && 'text-cyber-primary border-cyber-primary/50 bg-cyber-bg/50'
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-base font-medium">{children}</span>
    </Link>
  )
}
