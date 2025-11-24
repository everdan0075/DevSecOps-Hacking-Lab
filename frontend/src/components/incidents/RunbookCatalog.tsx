/**
 * Runbook Catalog Component
 *
 * Displays available runbooks with expandable details
 */

import { useState, useEffect } from 'react'
import { Book, ChevronDown, ChevronUp, Clock, Layers, Search } from 'lucide-react'
import { incidentService } from '@/services/incidentService'
import { truncate } from '@/utils/formatters'
import type { RunbookCatalogEntry, Runbook } from '@/types/api'

export function RunbookCatalog() {
  const [runbooks, setRunbooks] = useState<RunbookCatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'priority' | 'name' | 'duration'>('priority')
  const [expandedRunbook, setExpandedRunbook] = useState<string | null>(null)
  const [runbookDetails, setRunbookDetails] = useState<Record<string, Runbook>>({})

  const fetchRunbooks = async () => {
    try {
      const data = await incidentService.getRunbookCatalog()
      setRunbooks(data.runbooks)
    } catch (error) {
      console.error('Failed to fetch runbooks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRunbooks()

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchRunbooks, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchRunbookDetails = async (runbookName: string) => {
    if (runbookDetails[runbookName]) return

    try {
      const details = await incidentService.getRunbookDetails(runbookName)
      if (details) {
        setRunbookDetails((prev) => ({ ...prev, [runbookName]: details }))
      }
    } catch (error) {
      console.error('Failed to fetch runbook details:', error)
    }
  }

  const toggleExpanded = (runbookName: string) => {
    if (expandedRunbook === runbookName) {
      setExpandedRunbook(null)
    } else {
      setExpandedRunbook(runbookName)
      fetchRunbookDetails(runbookName)
    }
  }

  // Get unique categories
  const categories = ['all', ...new Set(runbooks.map((r) => r.category))]

  // Filter and sort runbooks
  const filteredRunbooks = runbooks
    .filter((runbook) => {
      const matchesCategory = categoryFilter === 'all' || runbook.category === categoryFilter
      const matchesSearch =
        searchQuery === '' ||
        runbook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        runbook.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'priority') return b.priority - a.priority
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'duration') return a.actions_count - b.actions_count
      return 0
    })

  return (
    <div className="p-6 rounded-lg bg-cyber-surface border border-cyber-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Book className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Runbook Catalog</h3>
            <p className="text-sm text-gray-400">
              {filteredRunbooks.length} runbook{filteredRunbooks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search runbooks..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-cyber-bg border border-cyber-border text-white text-sm focus:outline-none focus:border-cyber-primary"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-cyber-bg border border-cyber-border text-white text-sm focus:outline-none focus:border-cyber-primary"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'priority' | 'name' | 'duration')}
          className="px-3 py-2 rounded-lg bg-cyber-bg border border-cyber-border text-white text-sm focus:outline-none focus:border-cyber-primary"
        >
          <option value="priority">Sort by Priority</option>
          <option value="name">Sort by Name</option>
          <option value="duration">Sort by Duration</option>
        </select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-cyber-bg animate-pulse" />
          ))}
        </div>
      ) : filteredRunbooks.length === 0 ? (
        /* Empty State */
        <div className="py-12 text-center">
          <Book className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h4 className="text-lg font-semibold text-gray-400 mb-2">No Runbooks Found</h4>
          <p className="text-sm text-gray-500">
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No runbooks are currently available'}
          </p>
        </div>
      ) : (
        /* Runbooks Grid */
        <div className="space-y-3">
          {filteredRunbooks.map((runbook) => {
            const isExpanded = expandedRunbook === runbook.name
            const details = runbookDetails[runbook.name]

            return (
              <div
                key={runbook.name}
                className="rounded-lg bg-cyber-bg border border-cyber-border hover:border-cyber-primary/50 transition-all"
              >
                {/* Runbook Card */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30">
                          {runbook.category}
                        </span>
                        <span className="text-xs text-gray-500">Priority: {runbook.priority}</span>
                      </div>
                      <h4 className="text-base font-semibold text-white mb-1">{runbook.name}</h4>
                      <p className="text-sm text-gray-400">{truncate(runbook.description, 100)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        <span>{runbook.actions_count} actions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{runbook.estimated_duration}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpanded(runbook.name)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/30 hover:bg-cyber-primary/20 transition-all"
                    >
                      {isExpanded ? (
                        <>
                          Hide Details <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          View Details <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && details && (
                  <div className="border-t border-cyber-border p-4 bg-cyber-surface/50">
                    {/* Trigger Conditions */}
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold text-gray-300 mb-2">Trigger Conditions</h5>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <span className="text-xs text-gray-500">Alert Name</span>
                          <p className="text-sm text-white font-mono">{details.trigger.alertname}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Severity</span>
                          <p className="text-sm text-white">{details.trigger.severity}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Category</span>
                          <p className="text-sm text-white">{details.trigger.category}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h5 className="text-sm font-semibold text-gray-300 mb-2">
                        Actions ({details.actions.length})
                      </h5>
                      <div className="space-y-2">
                        {details.actions.map((action, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-cyber-bg border border-cyber-border"
                          >
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyber-primary/10 text-cyber-primary text-xs font-semibold">
                              {idx + 1}
                            </span>
                            <span className="text-sm text-white font-medium">{action.type}</span>
                            {Object.keys(action.params).length > 0 && (
                              <span className="text-xs text-gray-500">
                                ({Object.keys(action.params).length} param{Object.keys(action.params).length !== 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
