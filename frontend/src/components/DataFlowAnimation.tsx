/**
 * DataFlowAnimation Component
 *
 * Animated visualization showing HTTP request flow through the system
 * and alternative attack paths bypassing security controls
 */

import { useState } from 'react'
import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/cn'

type FlowType = 'normal' | 'attack'

export function DataFlowAnimation() {
  const [activeFlow, setActiveFlow] = useState<FlowType>('normal')

  return (
    <div>
      {/* Flow Type Selector */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <button
          onClick={() => setActiveFlow('normal')}
          className={cn(
            'px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2',
            activeFlow === 'normal'
              ? 'bg-cyber-primary text-cyber-bg'
              : 'bg-cyber-bg border border-cyber-border text-gray-400 hover:border-cyber-primary/50'
          )}
        >
          <Shield className="w-4 h-4" />
          Normal Flow (Secure)
        </button>
        <button
          onClick={() => setActiveFlow('attack')}
          className={cn(
            'px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2',
            activeFlow === 'attack'
              ? 'bg-cyber-danger text-white'
              : 'bg-cyber-bg border border-cyber-border text-gray-400 hover:border-cyber-danger/50'
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Attack Path (Gateway Bypass)
        </button>
      </div>

      {/* Animation Container */}
      <div className="relative bg-cyber-bg/50 rounded-lg p-8 min-h-[400px]">
        {activeFlow === 'normal' ? <NormalFlow /> : <AttackFlow />}
      </div>

      {/* Flow Description */}
      <div className="mt-6 p-4 rounded-lg bg-cyber-bg border border-cyber-border">
        {activeFlow === 'normal' ? (
          <div>
            <h4 className="font-semibold text-cyber-primary mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Secure Request Flow
            </h4>
            <ol className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-cyber-primary font-mono">1.</span>
                <span>Client sends request to API Gateway (port 8080)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyber-primary font-mono">2.</span>
                <span>Gateway validates JWT token signature and expiration</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyber-primary font-mono">3.</span>
                <span>Rate limiter checks request quota (60 req/min per IP)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyber-primary font-mono">4.</span>
                <span>WAF scans for SQL injection, XSS, and path traversal patterns</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyber-primary font-mono">5.</span>
                <span>Gateway forwards request to backend service (Auth or User Service)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyber-primary font-mono">6.</span>
                <span>Backend processes request and returns response</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyber-primary font-mono">7.</span>
                <span>Response flows back through Gateway with security headers</span>
              </li>
            </ol>
          </div>
        ) : (
          <div>
            <h4 className="font-semibold text-cyber-danger mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Attack Path (Direct Service Access)
            </h4>
            <ol className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-cyber-danger font-mono">1.</span>
                <span>Attacker discovers backend services exposed on public ports</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyber-danger font-mono">2.</span>
                <span>Direct connection to User Service (port 8002) bypassing Gateway</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyber-danger font-mono">3.</span>
                <span className="text-cyber-danger font-semibold">No JWT validation performed</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyber-danger font-mono">4.</span>
                <span className="text-cyber-danger font-semibold">No rate limiting enforced</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyber-danger font-mono">5.</span>
                <span className="text-cyber-danger font-semibold">No WAF protection active</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyber-danger font-mono">6.</span>
                <span>Attacker can exploit IDOR vulnerability freely</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyber-danger font-mono">7.</span>
                <span>Unlimited requests possible for brute force attacks</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

function NormalFlow() {
  return (
    <div className="flex flex-col items-center gap-8">
      {/* Client */}
      <FlowNode
        icon="👤"
        label="Client"
        color="text-cyber-secondary"
        description="User Browser"
      />

      <FlowArrow label="HTTP Request" color="border-cyber-primary" />

      {/* API Gateway with Security Layers */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 blur-xl bg-cyber-primary/10 rounded-lg" />
        <div className="relative bg-cyber-surface border-2 border-cyber-primary rounded-lg p-6">
          <div className="text-center mb-4">
            <Shield className="w-8 h-8 text-cyber-primary mx-auto mb-2" />
            <h3 className="font-semibold text-cyber-primary">API Gateway :8080</h3>
          </div>
          <div className="space-y-3">
            <SecurityLayer icon={Lock} label="JWT Validation" active />
            <SecurityLayer icon={Shield} label="Rate Limiting (60/min)" active />
            <SecurityLayer icon={Eye} label="WAF (SQLi, XSS, Path Traversal)" active />
            <SecurityLayer icon={Shield} label="Security Headers" active />
          </div>
        </div>
      </div>

      <FlowArrow label="Validated Request" color="border-cyber-success" />

      {/* Backend Services */}
      <div className="flex gap-6">
        <FlowNode
          icon="🔐"
          label="Auth Service"
          color="text-cyber-secondary"
          description=":8000"
        />
        <FlowNode
          icon="👥"
          label="User Service"
          color="text-cyber-secondary"
          description=":8002"
        />
      </div>

      <FlowArrow label="Response" color="border-cyber-success" direction="up" />
    </div>
  )
}

function AttackFlow() {
  return (
    <div className="flex flex-col items-center gap-8">
      {/* Attacker */}
      <FlowNode
        icon="⚠️"
        label="Attacker"
        color="text-cyber-danger"
        description="Malicious Actor"
      />

      <div className="relative w-full max-w-2xl">
        {/* Normal Path (Crossed Out) */}
        <div className="absolute left-0 right-0 opacity-30">
          <div className="flex flex-col items-center">
            <FlowArrow label="Blocked by Gateway" color="border-gray-600" dashed />
            <div className="relative mt-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-cyber-danger rotate-45" style={{ height: '2px' }} />
                <div className="w-full h-0.5 bg-cyber-danger -rotate-45" style={{ height: '2px' }} />
              </div>
              <div className="bg-cyber-surface border border-gray-600 rounded-lg p-4 opacity-50">
                <Shield className="w-6 h-6 text-gray-600 mx-auto" />
                <p className="text-xs text-gray-600 text-center mt-1">API Gateway</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attack Path (Direct) */}
        <div className="relative z-10 flex items-center justify-center gap-8">
          <div className="flex-1 text-right">
            <p className="text-sm text-gray-500 mb-2">Gateway</p>
            <p className="text-xs text-gray-600">(bypassed)</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-cyber-danger/20 rounded-full animate-pulse" />
            <div className="relative bg-cyber-danger/20 border-2 border-cyber-danger rounded-lg px-6 py-3">
              <p className="text-cyber-danger font-semibold text-center animate-pulse">
                Direct Access
              </p>
              <p className="text-xs text-center text-cyber-danger/80 mt-1">
                Port Discovery
              </p>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-2">No Security</p>
            <p className="text-xs text-gray-600">Controls</p>
          </div>
        </div>
      </div>

      <div className="my-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-cyber-danger animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Vulnerable Backend */}
      <div className="relative">
        <div className="absolute inset-0 blur-xl bg-cyber-danger/20 rounded-lg animate-pulse" />
        <div className="relative bg-cyber-surface border-2 border-cyber-danger rounded-lg p-6">
          <AlertTriangle className="w-8 h-8 text-cyber-danger mx-auto mb-2" />
          <h3 className="font-semibold text-cyber-danger text-center mb-3">User Service :8002</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-cyber-danger">
              <XMark />
              <span>No JWT validation</span>
            </div>
            <div className="flex items-center gap-2 text-cyber-danger">
              <XMark />
              <span>No rate limiting</span>
            </div>
            <div className="flex items-center gap-2 text-cyber-danger">
              <XMark />
              <span>No WAF protection</span>
            </div>
            <div className="flex items-center gap-2 text-cyber-danger">
              <XMark />
              <span>IDOR vulnerability exploitable</span>
            </div>
          </div>
        </div>
      </div>

      <FlowArrow label="Unrestricted Data Access" color="border-cyber-danger" direction="up" />
    </div>
  )
}

interface FlowNodeProps {
  icon: string
  label: string
  color: string
  description?: string
}

function FlowNode({ icon, label, color, description }: FlowNodeProps) {
  return (
    <div className="text-center">
      <div className={cn('text-4xl mb-2', color)}>{icon}</div>
      <p className={cn('font-semibold', color)}>{label}</p>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  )
}

interface FlowArrowProps {
  label: string
  color: string
  direction?: 'down' | 'up'
  dashed?: boolean
}

function FlowArrow({ label, color, direction = 'down', dashed = false }: FlowArrowProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div
          className={cn(
            'w-0.5 h-12',
            color.replace('border-', 'bg-'),
            dashed && 'opacity-50'
          )}
          style={dashed ? { backgroundImage: 'linear-gradient(to bottom, currentColor 50%, transparent 50%)', backgroundSize: '1px 8px' } : {}}
        />
        {direction === 'down' ? (
          <div className={cn('absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent', color.replace('border-', 'border-t-'))} />
        ) : (
          <div className={cn('absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent', color.replace('border-', 'border-b-'))} />
        )}
      </div>
      <span className="text-xs text-gray-500 font-mono">{label}</span>
    </div>
  )
}

interface SecurityLayerProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
}

function SecurityLayer({ icon: Icon, label, active }: SecurityLayerProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-2 rounded border transition-all',
      active
        ? 'border-cyber-success/30 bg-cyber-success/5'
        : 'border-cyber-border bg-cyber-bg'
    )}>
      <Icon className={cn('w-4 h-4', active ? 'text-cyber-success' : 'text-gray-500')} />
      <span className={cn('text-sm', active ? 'text-gray-200' : 'text-gray-500')}>{label}</span>
      {active && (
        <div className="ml-auto w-2 h-2 rounded-full bg-cyber-success animate-pulse" />
      )}
    </div>
  )
}

function XMark() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
