/**
 * Formatting Utility Functions
 */

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Format timestamp as relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const now = new Date()
  const then = new Date(timestamp)
  const secondsAgo = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (secondsAgo < 0) return 'just now'
  if (secondsAgo < 60) return `${secondsAgo}s ago`
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`

  return then.toLocaleDateString()
}

/**
 * Format duration in seconds to human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`
  return `${Math.floor(seconds / 86400)} days`
}

/**
 * Format time remaining countdown (e.g., "5m 30s")
 */
export function formatTimeRemaining(remainingSeconds?: number): string {
  if (!remainingSeconds || remainingSeconds <= 0) return '∞'

  if (remainingSeconds < 60) return `${remainingSeconds}s`
  if (remainingSeconds < 3600) {
    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
  }
  if (remainingSeconds < 86400) {
    const hours = Math.floor(remainingSeconds / 3600)
    const minutes = Math.floor((remainingSeconds % 3600) / 60)
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  const days = Math.floor(remainingSeconds / 86400)
  const hours = Math.floor((remainingSeconds % 86400) / 3600)
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`
}

/**
 * Truncate string with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}
