/**
 * Patch Manager Tool
 *
 * Interactive system for deploying security patches.
 * Shows affected servers, patch progress, and status updates.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Server, CheckCircle2, AlertTriangle, Play, Shield, Loader2 } from 'lucide-react'
import { PATCH_DATA } from '../data/patchData'

interface PatchManagerProps {
  objectiveId: string
  missionId: string
  onComplete: () => void
  isCompleted: boolean
}

interface ServerStatus {
  id: string
  hostname: string
  currentVersion: string
  patchedVersion: string
  criticality: 'production' | 'staging' | 'development'
  status: 'vulnerable' | 'patching' | 'secured'
  progress: number
  lastSeen: string
}

export function PatchManager({
  objectiveId,
  missionId,
  onComplete,
  isCompleted,
}: PatchManagerProps) {
  const key = `${missionId}-${objectiveId}`
  const patchConfig = PATCH_DATA[key]

  const [servers, setServers] = useState<ServerStatus[]>(
    patchConfig?.servers || []
  )
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set())
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentLog, setDeploymentLog] = useState<string[]>([])

  const toggleServer = (serverId: string) => {
    const server = servers.find(s => s.id === serverId)
    if (server && server.status === 'vulnerable') {
      const newSelected = new Set(selectedServers)
      if (newSelected.has(serverId)) {
        newSelected.delete(serverId)
      } else {
        newSelected.add(serverId)
      }
      setSelectedServers(newSelected)
    }
  }

  const selectAll = () => {
    const vulnerableServers = servers.filter(s => s.status === 'vulnerable').map(s => s.id)
    setSelectedServers(new Set(vulnerableServers))
  }

  const deployPatches = async () => {
    if (selectedServers.size === 0) return

    setIsDeploying(true)
    setDeploymentLog([`[${new Date().toLocaleTimeString()}] Starting patch deployment...`])

    for (const serverId of Array.from(selectedServers)) {
      const server = servers.find(s => s.id === serverId)
      if (!server) continue

      // Update to patching status
      setServers(prev => prev.map(s =>
        s.id === serverId ? { ...s, status: 'patching', progress: 0 } : s
      ))

      setDeploymentLog(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Deploying to ${server.hostname}...`
      ])

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setServers(prev => prev.map(s =>
          s.id === serverId ? { ...s, progress } : s
        ))
      }

      // Mark as secured
      setServers(prev => prev.map(s =>
        s.id === serverId ? { ...s, status: 'secured', progress: 100 } : s
      ))

      setDeploymentLog(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ✓ ${server.hostname} patched successfully (${server.currentVersion} → ${server.patchedVersion})`
      ])
    }

    setDeploymentLog(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Patch deployment complete!`
    ])

    setIsDeploying(false)
    setSelectedServers(new Set())
  }

  const vulnerableCount = servers.filter(s => s.status === 'vulnerable').length
  const patchedCount = servers.filter(s => s.status === 'secured').length
  const isObjectiveComplete = vulnerableCount === 0

  const getCriticalityColor = (criticality: ServerStatus['criticality']) => {
    switch (criticality) {
      case 'production': return 'text-red-400 bg-red-500/10 border-red-500/30'
      case 'staging': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'development': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    }
  }

  const getStatusIcon = (status: ServerStatus['status']) => {
    switch (status) {
      case 'vulnerable':
        return <AlertTriangle className="w-5 h-5 text-red-400" />
      case 'patching':
        return <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
      case 'secured':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />
    }
  }

  if (!patchConfig) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
        No patch configuration found for this objective.
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="patch-manager p-4 bg-cyber-bg border border-cyber-border rounded-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded">
          <Shield className="w-5 h-5 text-orange-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-orange-400">Emergency Patch Deployment</h4>
          <p className="text-xs text-gray-400">{patchConfig.description}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Secured / Total</div>
          <div className="text-lg font-bold text-orange-400">{patchedCount} / {servers.length}</div>
        </div>
      </div>

      {/* CVE Info */}
      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold text-red-300">{patchConfig.cve}</span>
        </div>
        <p className="text-xs text-gray-300">{patchConfig.cveName}</p>
        <div className="mt-2 text-xs text-red-300">
          Patch: <code className="bg-black/50 px-1.5 py-0.5 rounded text-orange-300">{patchConfig.patchVersion}</code>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={selectAll}
          disabled={isDeploying || vulnerableCount === 0}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-all"
        >
          Select All Vulnerable
        </button>
        <button
          onClick={deployPatches}
          disabled={selectedServers.size === 0 || isDeploying}
          className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded font-semibold transition-all flex items-center justify-center gap-2"
        >
          {isDeploying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Deploy Patch ({selectedServers.size} selected)
            </>
          )}
        </button>
      </div>

      {/* Server List */}
      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
        {servers.map((server) => (
          <motion.div
            key={server.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-3 border rounded transition-all ${
              server.status === 'secured'
                ? 'bg-green-500/5 border-green-500/30'
                : server.status === 'patching'
                ? 'bg-yellow-500/5 border-yellow-500/30'
                : selectedServers.has(server.id)
                ? 'bg-orange-500/10 border-orange-500/50'
                : 'bg-cyber-surface border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Checkbox */}
              {server.status === 'vulnerable' && (
                <input
                  type="checkbox"
                  checked={selectedServers.has(server.id)}
                  onChange={() => toggleServer(server.id)}
                  className="w-4 h-4 rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                />
              )}

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {getStatusIcon(server.status)}
              </div>

              {/* Server Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Server className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-white text-sm">{server.hostname}</span>
                  <span className={`px-2 py-0.5 rounded text-xs border ${getCriticalityColor(server.criticality)}`}>
                    {server.criticality}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Current: <code className="text-red-400">{server.currentVersion}</code></span>
                  <span>→</span>
                  <span>Target: <code className="text-green-400">{server.patchedVersion}</code></span>
                  <span className="ml-auto">Last seen: {server.lastSeen}</span>
                </div>

                {/* Progress Bar */}
                {server.status === 'patching' && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${server.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-yellow-400">{server.progress}% complete</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Deployment Log */}
      {deploymentLog.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black border border-orange-500/30 rounded-lg overflow-hidden"
        >
          <div className="bg-orange-900/20 border-b border-orange-500/30 px-3 py-1.5">
            <span className="text-xs text-orange-400 font-mono">deployment.log</span>
          </div>
          <div className="h-32 overflow-y-auto p-3 font-mono text-xs space-y-0.5">
            <AnimatePresence>
              {deploymentLog.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-orange-300"
                >
                  {log}
                </motion.div>
              ))}
            </AnimatePresence>
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
          All Systems Secured → Mark Objective as Done
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
