/**
 * Forensic Tool Component
 *
 * Interactive forensic analysis with timeline builder and IOC extractor.
 * Used for investigating incidents and building attack timelines.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Calendar, Hash, FileText, CheckCircle2, AlertCircle, Globe } from 'lucide-react'
import { FORENSIC_DATA } from '../data/forensicData'

interface ForensicToolProps {
  objectiveId: string
  missionId: string
  onComplete: () => void
  isCompleted: boolean
}

interface TimelineEvent {
  id: string
  timestamp: string
  event: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  found: boolean
}

interface IOC {
  type: 'ip' | 'domain' | 'hash' | 'file' | 'user'
  value: string
  description: string
  found: boolean
}

export function ForensicTool({
  objectiveId,
  missionId,
  onComplete,
  isCompleted,
}: ForensicToolProps) {
  const key = `${missionId}-${objectiveId}`
  const forensicConfig = FORENSIC_DATA[key]

  const [activeTab, setActiveTab] = useState<'timeline' | 'iocs'>('timeline')
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(
    forensicConfig?.timeline || []
  )
  const [iocs, setIocs] = useState<IOC[]>(forensicConfig?.iocs || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchFilter, setActiveSearchFilter] = useState('')

  const markEventFound = (eventId: string) => {
    setTimelineEvents(prev =>
      prev.map(event =>
        event.id === eventId ? { ...event, found: true } : event
      )
    )
  }

  const markIOCFound = (iocValue: string) => {
    setIocs(prev =>
      prev.map(ioc =>
        ioc.value === iocValue ? { ...ioc, found: true } : ioc
      )
    )
  }

  const searchEvidence = () => {
    if (!searchQuery.trim()) {
      setActiveSearchFilter('')
      return
    }

    // FIXED BUG #3: Set active filter to show matching items
    setActiveSearchFilter(searchQuery.toLowerCase())

    // Search in timeline events
    timelineEvents.forEach(event => {
      if (event.event.toLowerCase().includes(searchQuery.toLowerCase()) && !event.found) {
        markEventFound(event.id)
      }
    })

    // Search in IOCs
    iocs.forEach(ioc => {
      if (ioc.value.toLowerCase().includes(searchQuery.toLowerCase()) && !ioc.found) {
        markIOCFound(ioc.value)
      }
    })

    // Don't clear search query - keep it visible
    // setSearchQuery('')
  }

  const timelineFound = timelineEvents.filter(e => e.found).length
  const timelineTotal = timelineEvents.length
  const iocsFound = iocs.filter(i => i.found).length
  const iocsTotal = iocs.length
  const isObjectiveComplete = timelineFound === timelineTotal && iocsFound === iocsTotal

  // FIXED BUG #3: Filter displayed items based on search
  const filteredTimelineEvents = activeSearchFilter
    ? timelineEvents.filter(event =>
        event.event.toLowerCase().includes(activeSearchFilter) ||
        event.timestamp.toLowerCase().includes(activeSearchFilter)
      )
    : timelineEvents

  const filteredIOCs = activeSearchFilter
    ? iocs.filter(ioc =>
        ioc.value.toLowerCase().includes(activeSearchFilter) ||
        ioc.description.toLowerCase().includes(activeSearchFilter)
      )
    : iocs

  const getSeverityColor = (severity: TimelineEvent['severity']) => {
    switch (severity) {
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30'
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30'
    }
  }

  const getIOCIcon = (type: IOC['type']) => {
    switch (type) {
      case 'ip': return <Globe className="w-4 h-4" />
      case 'domain': return <Globe className="w-4 h-4" />
      case 'hash': return <Hash className="w-4 h-4" />
      case 'file': return <FileText className="w-4 h-4" />
      case 'user': return <Search className="w-4 h-4" />
    }
  }

  if (!forensicConfig) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
        No forensic configuration found for this objective.
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="forensic-tool p-4 bg-cyber-bg border border-cyber-border rounded-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded">
          <Calendar className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-purple-400">Forensic Analysis Tool</h4>
          <p className="text-xs text-gray-400">{forensicConfig.description}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Progress</div>
          <div className="text-lg font-bold text-purple-400">
            {timelineFound + iocsFound} / {timelineTotal + iocsTotal}
          </div>
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
              onKeyDown={(e) => e.key === 'Enter' && searchEvidence()}
              placeholder="Search for IOCs, IPs, domains, timestamps..."
              className="w-full pl-10 pr-4 py-2 bg-black/50 border border-gray-700 rounded text-purple-400 font-mono text-sm placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          <button
            onClick={searchEvidence}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition-all"
          >
            Search
          </button>
          {activeSearchFilter && (
            <button
              onClick={() => {
                setActiveSearchFilter('')
                setSearchQuery('')
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-all"
            >
              Clear
            </button>
          )}
        </div>
        {activeSearchFilter && (
          <div className="mt-2 text-xs text-purple-300">
            Showing {filteredTimelineEvents.length + filteredIOCs.length} matching items for "{activeSearchFilter}"
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2 px-4 rounded font-medium transition-all ${
            activeTab === 'timeline'
              ? 'bg-purple-500 text-white'
              : 'bg-cyber-surface text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            Timeline ({timelineFound}/{timelineTotal})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('iocs')}
          className={`flex-1 py-2 px-4 rounded font-medium transition-all ${
            activeTab === 'iocs'
              ? 'bg-purple-500 text-white'
              : 'bg-cyber-surface text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Hash className="w-4 h-4" />
            IOCs ({iocsFound}/{iocsTotal})
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeTab === 'timeline' ? (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-2"
            >
              {filteredTimelineEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 border rounded transition-all ${
                    event.found
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-cyber-surface border-gray-700 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {event.found ? (
                      <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-purple-300">{event.timestamp}</span>
                        <span className={`px-2 py-0.5 rounded text-xs border ${getSeverityColor(event.severity)}`}>
                          {event.severity}
                        </span>
                      </div>
                      <p className={`text-sm ${event.found ? 'text-white' : 'text-gray-500'}`}>
                        {event.event}
                      </p>
                    </div>

                    {!event.found && (
                      <button
                        onClick={() => markEventFound(event.id)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-all"
                      >
                        Mark Found
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="iocs"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-2"
            >
              {filteredIOCs.map((ioc) => (
                <motion.div
                  key={ioc.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 border rounded transition-all ${
                    ioc.found
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-cyber-surface border-gray-700 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {ioc.found ? (
                      <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-purple-300">{getIOCIcon(ioc.type)}</div>
                        <span className="text-xs text-gray-500 uppercase">{ioc.type}</span>
                      </div>
                      <code className={`text-sm font-mono block mb-1 ${ioc.found ? 'text-purple-300' : 'text-gray-600'}`}>
                        {ioc.value}
                      </code>
                      <p className={`text-xs ${ioc.found ? 'text-gray-300' : 'text-gray-600'}`}>
                        {ioc.description}
                      </p>
                    </div>

                    {!ioc.found && (
                      <button
                        onClick={() => markIOCFound(ioc.value)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-all"
                      >
                        Extract IOC
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Complete Button */}
      {isObjectiveComplete && !isCompleted && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onComplete}
          className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded font-semibold transition-all shadow-lg shadow-purple-500/25"
        >
          Forensic Analysis Complete → Mark Objective as Done
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
