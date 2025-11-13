/**
 * useBackendStatus Hook
 *
 * React hook for accessing backend connection status
 */

import { useState, useEffect } from 'react'
import { backendDetection } from '@/services/backendDetection'
import type { BackendStatus } from '@/types/api'

export function useBackendStatus() {
  const [status, setStatus] = useState<BackendStatus>(backendDetection.getStatus())
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = backendDetection.subscribe((newStatus) => {
      setStatus(newStatus)
    })

    // Cleanup subscription on unmount
    return unsubscribe
  }, [])

  /**
   * Manually trigger backend check
   */
  const checkStatus = async () => {
    setIsChecking(true)
    try {
      const newStatus = await backendDetection.checkBackendStatus()
      setStatus(newStatus)
    } finally {
      setIsChecking(false)
    }
  }

  return {
    status,
    isConnected: status.connected,
    isChecking,
    checkStatus,
    services: status.services,
    latency: status.latency,
    lastCheck: status.last_check,
    disconnectedMessage: backendDetection.getDisconnectedMessage(),
    isFeatureAvailable: backendDetection.isFeatureAvailable.bind(backendDetection),
  }
}
