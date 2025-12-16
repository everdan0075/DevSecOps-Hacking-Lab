/**
 * Log Analyzer Tool
 *
 * Interactive terminal-style log viewer with search functionality.
 * Used for detecting web shell activity, suspicious patterns, and IOCs.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Terminal, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { LOG_DATA } from '../data/logData'

interface LogAnalyzerProps {
  objectiveId: string
  missionId: string
  onComplete: () => void
  isCompleted: boolean
}

interface SearchResult {
  lineNumber: number
  content: string
  isMatch: boolean
}

export function LogAnalyzer({
  objectiveId,
  missionId,
  onComplete,
  isCompleted,
}: LogAnalyzerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [matchCount, setMatchCount] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [logLines, setLogLines] = useState<string[]>([])
  const [completionCriteria, setCompletionCriteria] = useState<{ found: string[], required: string[] }>({
    found: [],
    required: []
  })

  // Get log data for this objective
  useEffect(() => {
    const key = `${missionId}-${objectiveId}`
    const data = LOG_DATA[key]

    if (data) {
      setLogLines(data.logs.split('\n').filter(line => line.trim() !== ''))
      setCompletionCriteria({
        found: [],
        required: data.requiredPatterns
      })
    }
  }, [objectiveId, missionId])

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setMatchCount(0)
      setHasSearched(false)
      return
    }

    setHasSearched(true)

    try {
      // Support both plain text and regex
      const isRegex = searchQuery.startsWith('/') && searchQuery.endsWith('/')
      const pattern = isRegex
        ? new RegExp(searchQuery.slice(1, -1), 'i')
        : new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')

      const results: SearchResult[] = logLines.map((line, index) => ({
        lineNumber: index + 1,
        content: line,
        isMatch: pattern.test(line)
      }))

      const matches = results.filter(r => r.isMatch)
      setSearchResults(results)
      setMatchCount(matches.length)

      // FIXED BUG #2: Auto-complete when user searches for required patterns
      // Check if search query matches required patterns or finds them
      const newFound = [...completionCriteria.found]
      completionCriteria.required.forEach(required => {
        if (!newFound.includes(required)) {
          try {
            // Create pattern from required string
            const reqPattern = new RegExp(required, 'i')
            const userSearchClean = searchQuery.replace(/^\/|\/$/g, '') // Remove regex slashes

            // Mark as found if:
            // 1. User's search query contains/matches the required pattern, OR
            // 2. User's search found log lines containing the required pattern
            const userQueryMatches = reqPattern.test(userSearchClean) || userSearchClean.includes(required) || required.includes(userSearchClean)
            const resultsContainPattern = matches.length > 0 && matches.some(m => reqPattern.test(m.content))

            if (userQueryMatches || resultsContainPattern) {
              newFound.push(required)
            }
          } catch (e) {
            // Ignore regex errors
          }
        }
      })

      setCompletionCriteria({
        ...completionCriteria,
        found: newFound
      })
    } catch (error) {
      console.error('Invalid regex pattern:', error)
    }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !hasSearched) return text

    try {
      const isRegex = query.startsWith('/') && query.endsWith('/')
      const pattern = isRegex
        ? new RegExp(query.slice(1, -1), 'gi')
        : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')

      return text.replace(pattern, (match) => `<mark class="bg-yellow-400 text-black font-semibold px-1">${match}</mark>`)
    } catch {
      return text
    }
  }

  const isObjectiveComplete = completionCriteria.found.length === completionCriteria.required.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="log-analyzer p-4 bg-cyber-bg border border-cyber-border rounded-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-500/10 border border-green-500/30 rounded">
          <Terminal className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-green-400">Security Log Analyzer</h4>
          <p className="text-xs text-gray-400">Search for suspicious patterns and IOCs</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Total Lines</div>
          <div className="text-lg font-bold text-green-400">{logLines.length}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter search pattern (e.g., 'POST', '/\.aspx/', '169.254.169.254')"
              className="w-full pl-10 pr-4 py-2 bg-black/50 border border-gray-700 rounded text-green-400 font-mono text-sm placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-all"
          >
            Search
          </button>
        </div>

        {/* Search Tips */}
        <div className="mt-2 text-xs text-gray-500">
          <strong className="text-gray-400">Tips:</strong> Use plain text or regex (e.g., <code className="text-green-400 bg-black/50 px-1">/POST.*\.aspx/</code>)
        </div>
      </div>

      {/* Match Counter */}
      {hasSearched && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-center gap-2"
        >
          <FileText className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-yellow-300">
            Found <strong className="text-yellow-100">{matchCount}</strong> matches in {logLines.length} lines
          </span>
        </motion.div>
      )}

      {/* Log Viewer - Terminal Style */}
      <div className="bg-black border border-green-500/30 rounded-lg overflow-hidden">
        <div className="bg-green-900/20 border-b border-green-500/30 px-3 py-1.5 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
          <span className="text-xs text-green-400 font-mono ml-2">access.log</span>
        </div>

        <div className="h-64 overflow-y-auto p-3 font-mono text-xs">
          {hasSearched && searchResults.length > 0 ? (
            <AnimatePresence mode="wait">
              {searchResults.map((result) => (
                result.isMatch && (
                  <motion.div
                    key={result.lineNumber}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-1 hover:bg-green-500/5 px-1 rounded"
                  >
                    <span className="text-gray-600 mr-2">{String(result.lineNumber).padStart(4, '0')}</span>
                    <span
                      className="text-green-300"
                      dangerouslySetInnerHTML={{ __html: highlightMatch(result.content, searchQuery) }}
                    />
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          ) : hasSearched ? (
            <div className="text-gray-500 text-center py-8">No matches found. Try a different pattern.</div>
          ) : (
            logLines.map((line, index) => (
              <div key={index} className="mb-1 hover:bg-green-500/5 px-1 rounded">
                <span className="text-gray-600 mr-2">{String(index + 1).padStart(4, '0')}</span>
                <span className="text-green-300">{line}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Completion Progress */}
      {completionCriteria.required.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded"
        >
          <div className="text-sm font-semibold text-purple-300 mb-2">Investigation Progress</div>
          <div className="space-y-1.5">
            {completionCriteria.required.map((pattern, index) => {
              const found = completionCriteria.found.includes(pattern)
              return (
                <div key={index} className="flex items-center gap-2 text-xs">
                  {found ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-600" />
                  )}
                  <span className={found ? 'text-green-300' : 'text-gray-400'}>
                    Search for: <code className="bg-black/50 px-1.5 py-0.5 rounded text-purple-300">{pattern}</code>
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Complete Button */}
      {isObjectiveComplete && !isCompleted && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onComplete}
          className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded font-semibold transition-all shadow-lg shadow-green-500/25"
        >
          Analysis Complete → Mark Objective as Done
        </motion.button>
      )}

      {isCompleted && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-sm text-green-300 font-semibold">Objective Completed</span>
        </div>
      )}
    </motion.div>
  )
}
