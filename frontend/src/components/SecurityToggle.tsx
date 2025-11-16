/**
 * Security Toggle Component
 *
 * Allows switching between "Security ON" (gateway-protected) and "Security OFF" (direct access) modes
 */

import { Shield, ShieldOff } from 'lucide-react'
import { useSecurity } from '@/contexts/SecurityContext'
import { cn } from '@/utils/cn'

export function SecurityToggle() {
  const { securityEnabled, toggleSecurity } = useSecurity()

  return (
    <button
      onClick={toggleSecurity}
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
        'border-2 font-medium shadow-sm',
        'hover:scale-105 hover:shadow-lg active:scale-95',
        securityEnabled
          ? 'bg-cyber-primary/10 border-cyber-primary text-cyber-primary hover:bg-cyber-primary/20 hover:shadow-cyber-primary/30'
          : 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20 hover:shadow-red-500/30'
      )}
      title={securityEnabled
        ? 'Security ON: Requests via API Gateway (WAF, Rate Limit, JWT). Click to disable.'
        : 'Security OFF: Direct service access bypassing protections. Click to enable.'}
    >
      {/* Icon & Status */}
      <div className="flex items-center gap-2">
        {securityEnabled ? (
          <Shield className="w-4 h-4" />
        ) : (
          <ShieldOff className="w-4 h-4" />
        )}
        <span className="text-xs font-bold whitespace-nowrap uppercase tracking-wide">
          Security {securityEnabled ? 'ON' : 'OFF'}
        </span>
      </div>

      {/* Compact mode description */}
      <div className={cn(
        'hidden xl:flex items-center gap-1.5 text-xs border-l pl-2',
        securityEnabled ? 'border-cyber-primary/30' : 'border-red-500/30'
      )}>
        {securityEnabled ? (
          <span className="whitespace-nowrap opacity-80">via <span className="font-semibold">API Gateway</span></span>
        ) : (
          <span className="whitespace-nowrap font-semibold">Direct Access</span>
        )}
      </div>

      {/* Glow effect on hover */}
      <div className={cn(
        'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-md -z-10',
        securityEnabled ? 'bg-cyber-primary/20' : 'bg-red-500/20'
      )} />
    </button>
  )
}
