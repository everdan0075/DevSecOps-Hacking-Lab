/**
 * Active Bans Panel Component
 *
 * Displays currently active IP bans with real-time countdown
 */

import { useState, useEffect } from 'react'
import { Ban, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { incidentService } from '@/services/incidentService'
import { formatRelativeTime, formatTimeRemaining, truncate } from '@/utils/formatters'
import type { ActiveBan } from '@/types/api'

export function ActiveBansPanel() {
  const [bans, setBans] = useState<ActiveBan[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(Date.now())

  const fetchBans = async () => {
    try {
      const data = await incidentService.getActiveBans()
      setBans(data.bans)
    } catch (error) {
      console.error('Failed to fetch active bans:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBans()

    // Auto-refresh every 10 seconds
    const fetchInterval = setInterval(fetchBans, 10000)

    // Update countdown every second
    const timeInterval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => {
      clearInterval(fetchInterval)
      clearInterval(timeInterval)
    }
  }, [])

  const calculateRemainingSeconds = (ban: ActiveBan): number | undefined => {
    if (ban.ban_type === 'permanent' || !ban.expires_at) {
      return undefined
    }

    const expiresAt = new Date(ban.expires_at).getTime()
    const remaining = Math.floor((expiresAt - currentTime) / 1000)
    return remaining > 0 ? remaining : 0
  }

  return (
    <div className="p-6 rounded-lg bg-cyber-surface border border-cyber-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10">
            <Ban className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Active IP Bans</h3>
            <p className="text-sm text-gray-400">
              {bans.length} active ban{bans.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-cyber-bg animate-pulse" />
          ))}
        </div>
      ) : bans.length === 0 ? (
        /* Empty State */
        <div className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h4 className="text-lg font-semibold text-gray-400 mb-2">No Active Bans</h4>
          <p className="text-sm text-gray-500">
            No IP addresses are currently banned. Bans will appear here when malicious activity is detected.
          </p>
        </div>
      ) : (
        /* Bans Table */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Banned At
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Time Left
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border">
              {bans.map((ban, index) => {
                const remainingSeconds = calculateRemainingSeconds(ban)
                return (
                  <tr
                    key={`${ban.ip_address}-${index}`}
                    className="hover:bg-cyber-bg/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-white">{ban.ip_address}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-sm text-gray-400"
                        title={ban.reason}
                      >
                        {truncate(ban.reason, 40)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                          ban.ban_type === 'permanent'
                            ? 'text-red-500 bg-red-500/10 border border-red-500/30'
                            : 'text-yellow-500 bg-yellow-500/10 border border-yellow-500/30'
                        )}
                      >
                        {ban.ban_type === 'permanent' ? 'PERMANENT' : 'TEMPORARY'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-400" title={new Date(ban.banned_at).toLocaleString()}>
                        {formatRelativeTime(ban.banned_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ban.ban_type === 'permanent' || !ban.expires_at ? (
                        <span className="text-sm text-red-400 font-semibold">Never</span>
                      ) : (
                        <span className="text-sm text-gray-400" title={new Date(ban.expires_at).toLocaleString()}>
                          {formatRelativeTime(ban.expires_at)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span
                          className={cn(
                            'text-sm font-mono',
                            ban.ban_type === 'permanent'
                              ? 'text-red-400 font-bold'
                              : remainingSeconds && remainingSeconds < 300
                              ? 'text-yellow-400'
                              : 'text-gray-400'
                          )}
                        >
                          {formatTimeRemaining(remainingSeconds)}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
