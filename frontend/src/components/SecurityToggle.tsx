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
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-cyber-bg border border-cyber-border">
      {/* Security Status Indicator */}
      <div className="flex items-center gap-2">
        {securityEnabled ? (
          <Shield className="w-5 h-5 text-cyber-primary" />
        ) : (
          <ShieldOff className="w-5 h-5 text-red-500" />
        )}
        <span className="text-sm font-medium text-gray-300">
          {securityEnabled ? 'Security ON' : 'Security OFF'}
        </span>
      </div>

      {/* Toggle Switch */}
      <button
        onClick={toggleSecurity}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          securityEnabled ? 'bg-cyber-primary' : 'bg-red-500'
        )}
        role="switch"
        aria-checked={securityEnabled}
        title={securityEnabled ? 'Disable security (direct access)' : 'Enable security (gateway protection)'}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            securityEnabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>

      {/* Mode Description */}
      <div className="hidden lg:block">
        <p className="text-xs text-gray-500">
          {securityEnabled ? (
            <>Requests via <span className="text-cyber-primary font-medium">API Gateway</span> (WAF, Rate Limit, JWT)</>
          ) : (
            <>Direct service access - <span className="text-red-400 font-medium">bypassing protections</span></>
          )}
        </p>
      </div>
    </div>
  )
}
