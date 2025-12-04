/**
 * Evidence Panel Component
 *
 * Displays discovered evidence (documents, logs, code, network diagrams)
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Code, Database, Network, Mail, Lock, Eye, Download } from 'lucide-react'
import type { Mission, MissionProgress, TimelinePhase, Evidence } from '@/types/mission'
import { CodeBlock } from '@/components/CodeBlock'
import { cn } from '@/utils/cn'

interface EvidencePanelProps {
  mission: Mission
  progress: MissionProgress
  currentPhase: TimelinePhase
  onEvidenceDiscovered: (evidenceId: string) => void
}

export function EvidencePanel({
  mission,
  progress,
  currentPhase,
  onEvidenceDiscovered,
}: EvidencePanelProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)

  // Get available evidence for current phase
  const availableEvidence = mission.evidence.filter((evidence) => {
    // Check if evidence is discovered
    if (progress.discoveredEvidence.includes(evidence.id)) {
      return true
    }

    // Check if evidence should be auto-discovered in this phase
    if (evidence.discoveredAt === currentPhase.id) {
      // Auto-discover
      if (!progress.discoveredEvidence.includes(evidence.id)) {
        onEvidenceDiscovered(evidence.id)
      }
      return true
    }

    return false
  })

  const getEvidenceIcon = (type: Evidence['type']) => {
    switch (type) {
      case 'document':
        return FileText
      case 'log':
        return FileText
      case 'code':
        return Code
      case 'database':
        return Database
      case 'network':
        return Network
      case 'email':
        return Mail
      default:
        return FileText
    }
  }

  const getEvidenceColor = (type: Evidence['type']) => {
    switch (type) {
      case 'code':
        return 'blue'
      case 'database':
        return 'purple'
      case 'network':
        return 'cyan'
      case 'email':
        return 'orange'
      case 'log':
        return 'yellow'
      default:
        return 'green'
    }
  }

  const handleDownload = (evidence: Evidence) => {
    // Create downloadable file
    const blob = new Blob([evidence.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${evidence.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Evidence Collected</h3>
        <div className="text-sm text-gray-400">
          {availableEvidence.length} / {mission.evidence.length} items
        </div>
      </div>

      {availableEvidence.length === 0 ? (
        <div className="text-center py-12">
          <Lock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <div className="text-sm text-gray-500">
            No evidence discovered yet. Complete objectives to unlock evidence.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableEvidence.map((evidence) => {
            const Icon = getEvidenceIcon(evidence.type)
            const color = getEvidenceColor(evidence.type)

            return (
              <motion.button
                key={evidence.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedEvidence(evidence)}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all hover:scale-[1.02]',
                  color === 'blue' && 'bg-blue-950/20 border-blue-700/30 hover:border-blue-500',
                  color === 'purple' && 'bg-purple-950/20 border-purple-700/30 hover:border-purple-500',
                  color === 'cyan' && 'bg-cyan-950/20 border-cyan-700/30 hover:border-cyan-500',
                  color === 'orange' && 'bg-orange-950/20 border-orange-700/30 hover:border-orange-500',
                  color === 'yellow' && 'bg-yellow-950/20 border-yellow-700/30 hover:border-yellow-500',
                  color === 'green' && 'bg-green-950/20 border-green-700/30 hover:border-green-500'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'p-2 rounded',
                      color === 'blue' && 'bg-blue-500/20',
                      color === 'purple' && 'bg-purple-500/20',
                      color === 'cyan' && 'bg-cyan-500/20',
                      color === 'orange' && 'bg-orange-500/20',
                      color === 'yellow' && 'bg-yellow-500/20',
                      color === 'green' && 'bg-green-500/20'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        color === 'blue' && 'text-blue-500',
                        color === 'purple' && 'text-purple-500',
                        color === 'cyan' && 'text-cyan-500',
                        color === 'orange' && 'text-orange-500',
                        color === 'yellow' && 'text-yellow-500',
                        color === 'green' && 'text-green-500'
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 uppercase mb-1">{evidence.type}</div>
                    <div className="font-semibold text-white mb-1">{evidence.title}</div>
                    <div className="text-xs text-gray-400 line-clamp-2">{evidence.description}</div>

                    {evidence.metadata && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        {evidence.metadata.author && <span>By: {evidence.metadata.author}</span>}
                        {evidence.metadata.timestamp && (
                          <span>• {new Date(evidence.metadata.timestamp).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <Eye className="w-3 h-3" />
                  Click to view
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Evidence Detail Modal */}
      <AnimatePresence>
        {selectedEvidence && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEvidence(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cyber-surface border border-cyber-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-cyber-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {(() => {
                        const Icon = getEvidenceIcon(selectedEvidence.type)
                        return <Icon className="w-5 h-5 text-cyber-primary" />
                      })()}
                      <span className="text-xs text-gray-500 uppercase">{selectedEvidence.type}</span>
                    </div>
                    <h3 className="text-xl font-bold text-cyber-primary mb-1">
                      {selectedEvidence.title}
                    </h3>
                    <p className="text-sm text-gray-400">{selectedEvidence.description}</p>

                    {selectedEvidence.metadata && (
                      <div className="mt-3 flex flex-wrap gap-3 text-xs">
                        {selectedEvidence.metadata.author && (
                          <div>
                            <span className="text-gray-500">Author:</span>{' '}
                            <span className="text-gray-300">{selectedEvidence.metadata.author}</span>
                          </div>
                        )}
                        {selectedEvidence.metadata.timestamp && (
                          <div>
                            <span className="text-gray-500">Date:</span>{' '}
                            <span className="text-gray-300">
                              {new Date(selectedEvidence.metadata.timestamp).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {selectedEvidence.metadata.source && (
                          <div>
                            <span className="text-gray-500">Source:</span>{' '}
                            <span className="text-gray-300">{selectedEvidence.metadata.source}</span>
                          </div>
                        )}
                        {selectedEvidence.metadata.classification && (
                          <div>
                            <span className="text-gray-500">Classification:</span>{' '}
                            <span className="text-red-400">{selectedEvidence.metadata.classification}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDownload(selectedEvidence)}
                    className="ml-4 p-2 rounded-lg bg-cyber-bg border border-cyber-border hover:border-cyber-primary transition-all"
                    title="Download"
                  >
                    <Download className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedEvidence.type === 'code' ? (
                  <CodeBlock
                    code={selectedEvidence.content.replace(/```\w*\n?/g, '')}
                    language="python"
                  />
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <pre className="bg-cyber-bg border border-cyber-border rounded-lg p-4 overflow-x-auto text-sm text-gray-300 whitespace-pre-wrap font-mono">
                      {selectedEvidence.content}
                    </pre>
                  </div>
                )}

                {/* MITRE Mapping */}
                {selectedEvidence.mitreMapping && selectedEvidence.mitreMapping.length > 0 && (
                  <div className="mt-6 p-4 bg-cyber-bg border border-cyber-border rounded-lg">
                    <div className="text-sm font-semibold text-gray-400 mb-2">
                      MITRE ATT&CK Techniques
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvidence.mitreMapping.map((techId) => {
                        const technique = mission.mitreTechniques.find((t) => t.id === techId)
                        return (
                          <a
                            key={techId}
                            href={technique?.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-cyber-primary/10 border border-cyber-primary/30 rounded text-xs font-mono text-cyber-primary hover:bg-cyber-primary hover:text-cyber-bg transition-all"
                            title={technique?.name}
                          >
                            {techId}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-cyber-border">
                <button
                  onClick={() => setSelectedEvidence(null)}
                  className="w-full py-2 bg-cyber-primary text-cyber-bg rounded font-semibold hover:bg-cyber-secondary transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
