/**
 * Security Context
 *
 * Global state for security settings (gateway bypass toggle)
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { attackService } from '@/services/attackService'
import { authService } from '@/services/authService'
import honeypotService from '@/services/honeypotService'

interface SecurityContextType {
  securityEnabled: boolean
  toggleSecurity: () => void
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [securityEnabled, setSecurityEnabled] = useState(true)

  const toggleSecurity = () => {
    setSecurityEnabled((prev) => !prev)
  }

  // Sync security mode with attackService, authService, and honeypotService whenever it changes
  useEffect(() => {
    attackService.setSecurityMode(securityEnabled)
    authService.setSecurityMode(securityEnabled)
    honeypotService.setSecurityMode(securityEnabled)
  }, [securityEnabled])

  return (
    <SecurityContext.Provider value={{ securityEnabled, toggleSecurity }}>
      {children}
    </SecurityContext.Provider>
  )
}

export function useSecurity() {
  const context = useContext(SecurityContext)
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider')
  }
  return context
}
