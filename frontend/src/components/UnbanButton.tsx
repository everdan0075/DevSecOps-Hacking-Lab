/**
 * Unban Button Component
 *
 * Allows user to unban their IP address for testing purposes
 */

import { useState } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { apiClient } from '@/services/apiClient'
import { ENDPOINTS } from '@/utils/constants'
import { cn } from '@/utils/cn'

export function UnbanButton() {
  const [isUnbanning, setIsUnbanning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleUnban = async () => {
    setIsUnbanning(true)
    setMessage(null)

    try {
      const response = await apiClient.post<{
        success: boolean
        message: string
        was_banned: boolean
      }>(ENDPOINTS.AUTH.UNBAN_ME, {})

      if (response.was_banned) {
        setMessage('IP unbanned successfully!')
      } else {
        setMessage('IP was not banned')
      }

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error: unknown) {
      console.error('Unban failed:', error)
      setMessage(error instanceof Error ? error.message : 'Failed to unban')
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsUnbanning(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleUnban}
        disabled={isUnbanning}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg',
          'bg-cyber-bg border border-cyber-border',
          'hover:border-cyber-primary/50 hover:bg-cyber-primary/10',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title="Unban my IP address (demo only)"
      >
        {isUnbanning ? (
          <Loader2 className="w-4 h-4 animate-spin text-cyber-primary" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-cyber-primary" />
        )}
        <span className="text-sm font-medium text-gray-300">
          {isUnbanning ? 'Unbanning...' : 'Unban Me'}
        </span>
      </button>

      {/* Success/Error Message */}
      {message && (
        <span className={cn(
          'text-sm font-medium',
          message.includes('successfully') || message.includes('not banned')
            ? 'text-green-400'
            : 'text-red-400'
        )}>
          {message}
        </span>
      )}
    </div>
  )
}
