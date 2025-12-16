/**
 * Threat Intel Search Tool
 *
 * Search for IOCs in threat intelligence databases.
 * Provides threat scores, associated campaigns, and MITRE ATT&CK techniques.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ThreatIntelSearchProps {
  objectiveId: string
  missionId: string
  onComplete: () => void
  isCompleted: boolean
}

interface ThreatIntelResult {
  ioc: string
  type: 'ip' | 'domain' | 'hash'
  threatScore: number
  malicious: boolean
  campaigns: string[]
  mitreTechniques: string[]
  lastSeen: string
}

export function ThreatIntelSearch({
  objectiveId,
  missionId,
  onComplete,
  isCompleted,
}: ThreatIntelSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<ThreatIntelResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Sample threat intel database
  const threatIntelDB: Record<string, ThreatIntelResult> = {
    '185.220.101.47': {
      ioc: '185.220.101.47',
      type: 'ip',
      threatScore: 95,
      malicious: true,
      campaigns: ['Cl0p Ransomware', 'MOVEit Mass Exploitation'],
      mitreTechniques: ['T1190', 'T1505.003', 'T1041'],
      lastSeen: '2023-06-15',
    },
    '98.207.15.143': {
      ioc: '98.207.15.143',
      type: 'ip',
      threatScore: 88,
      malicious: true,
      campaigns: ['Capital One Cloud Breach', 'SSRF Exploitation'],
      mitreTechniques: ['T1190', 'T1552.005', 'T1530'],
      lastSeen: '2019-07-29',
    },
    '61.135.169.125': {
      ioc: '61.135.169.125',
      type: 'ip',
      threatScore: 92,
      malicious: true,
      campaigns: ['Equifax Data Breach', 'PLA Unit 54th'],
      mitreTechniques: ['T1190', 'T1505', 'T1041'],
      lastSeen: '2017-07-30',
    },
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchResult(null)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    const result = threatIntelDB[searchQuery.trim()]
    setSearchResult(result || {
      ioc: searchQuery.trim(),
      type: 'ip',
      threatScore: 0,
      malicious: false,
      campaigns: [],
      mitreTechniques: [],
      lastSeen: 'N/A',
    })

    setIsSearching(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="threat-intel-search p-4 bg-cyber-bg border border-cyber-border rounded-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded">
          <Shield className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-blue-400">Threat Intelligence Search</h4>
          <p className="text-xs text-gray-400">Search for IOCs in global threat databases</p>
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
              placeholder="Enter IP address, domain, or file hash..."
              className="w-full pl-10 pr-4 py-2 bg-black/50 border border-gray-700 rounded text-blue-400 font-mono text-sm placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded font-semibold transition-all"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 border rounded ${
            searchResult.malicious
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-green-500/10 border-green-500/30'
          }`}
        >
          <div className="flex items-start gap-3 mb-3">
            {searchResult.malicious ? (
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="text-lg font-bold text-white mb-1">{searchResult.ioc}</div>
              <div className="text-xs text-gray-400 mb-2">Type: {searchResult.type.toUpperCase()}</div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-400">Threat Score:</span>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${searchResult.threatScore}%` }}
                    className={`h-full ${
                      searchResult.threatScore >= 80
                        ? 'bg-red-500'
                        : searchResult.threatScore >= 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  />
                </div>
                <span className={`text-sm font-bold ${
                  searchResult.threatScore >= 80
                    ? 'text-red-400'
                    : searchResult.threatScore >= 50
                    ? 'text-yellow-400'
                    : 'text-green-400'
                }`}>
                  {searchResult.threatScore}/100
                </span>
              </div>

              {searchResult.campaigns.length > 0 && (
                <div className="mb-2">
                  <div className="text-sm text-gray-400 mb-1">Associated Campaigns:</div>
                  <div className="flex flex-wrap gap-1">
                    {searchResult.campaigns.map((campaign, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-500/20 border border-red-500/40 rounded text-xs text-red-300"
                      >
                        {campaign}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {searchResult.mitreTechniques.length > 0 && (
                <div className="mb-2">
                  <div className="text-sm text-gray-400 mb-1">MITRE ATT&CK Techniques:</div>
                  <div className="flex flex-wrap gap-1">
                    {searchResult.mitreTechniques.map((technique, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded text-xs text-purple-300 font-mono"
                      >
                        {technique}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">Last seen: {searchResult.lastSeen}</div>
            </div>
          </div>
        </motion.div>
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
