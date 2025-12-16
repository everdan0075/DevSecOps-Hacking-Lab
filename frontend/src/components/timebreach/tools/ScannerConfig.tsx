/**
 * Scanner Configuration Tool
 *
 * Interactive vulnerability scanner configuration for defender objectives.
 * Used for fixing scanner misconfigurations (Equifax Phase 6).
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, CheckCircle2, AlertCircle, Search, Wrench } from 'lucide-react'

interface ScannerConfigProps {
  objectiveId: string
  missionId: string
  onComplete: () => void
  isCompleted: boolean
}

interface ScanConfig {
  id: string
  name: string
  value: string
  description: string
  isCorrect: boolean
  fixed: boolean
}

export function ScannerConfig({
  objectiveId,
  missionId,
  onComplete,
  isCompleted,
}: ScannerConfigProps) {
  const [configs, setConfigs] = useState<ScanConfig[]>([
    {
      id: 'scan-target',
      name: 'Scan Target IPs',
      value: '10.10.0.0/16',
      description: 'IP range to scan for vulnerabilities',
      isCorrect: false,
      fixed: false,
    },
    {
      id: 'scan-ports',
      name: 'Target Ports',
      value: '80, 443, 8080',
      description: 'Ports to scan on target systems',
      isCorrect: true,
      fixed: false,
    },
    {
      id: 'scan-depth',
      name: 'Scan Depth',
      value: 'Deep',
      description: 'How thorough the vulnerability scan should be',
      isCorrect: true,
      fixed: false,
    },
  ])

  const [editingConfig, setEditingConfig] = useState<string | null>(null)
  const [newValue, setNewValue] = useState('')
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleEdit = (configId: string) => {
    const config = configs.find(c => c.id === configId)
    if (config) {
      setEditingConfig(configId)
      setNewValue(config.value)
    }
  }

  const handleSave = (configId: string) => {
    setConfigs(prev =>
      prev.map(config => {
        if (config.id === configId) {
          // Check if the new value fixes the misconfiguration
          let isCorrect = config.isCorrect
          let fixed = false

          if (configId === 'scan-target') {
            // User needs to add public IP range or expand the scan range
            if (
              newValue.includes('203.161.12') ||
              newValue.toLowerCase().includes('all') ||
              newValue.includes('0.0.0.0') ||
              newValue.includes('10.10.0.0/8')
            ) {
              isCorrect = true
              fixed = true
            }
          }

          return {
            ...config,
            value: newValue,
            isCorrect,
            fixed,
          }
        }
        return config
      })
    )
    setEditingConfig(null)
    setNewValue('')
    setTestResult(null)
  }

  const handleTestScan = () => {
    const targetConfig = configs.find(c => c.id === 'scan-target')

    if (!targetConfig) {
      setTestResult({
        success: false,
        message: 'Configuration error',
      })
      return
    }

    if (targetConfig.isCorrect && targetConfig.fixed) {
      setTestResult({
        success: true,
        message: 'SUCCESS: Found Apache Struts vulnerability (CVE-2017-5638) on ACIS dispute portal at 203.161.12.50:443',
      })
    } else {
      setTestResult({
        success: false,
        message: 'FAILED: No vulnerabilities detected. Scanner only checked internal IPs (10.10.x.x). The ACIS dispute portal is on a public-facing IP and was not included in the scan.',
      })
    }
  }

  const allConfigsFixed = configs.every(c => c.isCorrect)
  const testPassed = testResult?.success === true

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="scanner-config p-4 bg-cyber-bg border border-cyber-border rounded-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded">
          <Settings className="w-5 h-5 text-orange-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-orange-400">Vulnerability Scanner Configuration</h4>
          <p className="text-xs text-gray-400">Fix scanner settings to detect the dispute portal</p>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-red-300 mb-1">Scanner Failure Report</div>
            <p className="text-xs text-gray-300">
              The March 15 vulnerability scan completed but found <strong>0 critical vulnerabilities</strong>.
              However, the DHS advisory warned that ACIS dispute portal is running vulnerable Struts 2.3.28.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              <strong>Root Cause:</strong> Scanner only checked internal IP ranges. The public-facing dispute portal was excluded.
            </p>
          </div>
        </div>
      </div>

      {/* Scanner Configuration Settings */}
      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-400 mb-3">Scanner Settings:</div>
        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config.id}
              className={`p-3 border rounded transition-all ${
                config.fixed
                  ? 'bg-green-500/10 border-green-500/30'
                  : !config.isCorrect && config.id === 'scan-target'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-cyber-surface border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {config.fixed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : !config.isCorrect && config.id === 'scan-target' ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-gray-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white mb-1">{config.name}</div>
                  <div className="text-xs text-gray-400 mb-2">{config.description}</div>

                  {editingConfig === config.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-black/50 border border-gray-700 rounded text-orange-400 font-mono text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                        placeholder="Enter new value..."
                      />
                      <button
                        onClick={() => handleSave(config.id)}
                        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingConfig(null)
                          setNewValue('')
                        }}
                        className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono text-orange-300 bg-black/50 px-2 py-1 rounded">
                        {config.value}
                      </code>
                      {!isCompleted && (
                        <button
                          onClick={() => handleEdit(config.id)}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-all flex items-center gap-1"
                        >
                          <Wrench className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                    </div>
                  )}

                  {/* Hint for the misconfigured setting */}
                  {config.id === 'scan-target' && !config.fixed && !editingConfig && (
                    <div className="mt-2 text-xs text-yellow-300 bg-yellow-900/20 p-2 rounded">
                      💡 Hint: The ACIS dispute portal is on public IP 203.161.12.50. Should this IP be included in the scan range?
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Scan Button */}
      <div className="mb-4">
        <button
          onClick={handleTestScan}
          disabled={isCompleted}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded font-semibold transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          Run Test Scan
        </button>
      </div>

      {/* Test Results */}
      {testResult && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 border rounded ${
            testResult.success
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}
        >
          <div className="flex items-start gap-2">
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className={`text-sm font-semibold mb-1 ${
                testResult.success ? 'text-green-300' : 'text-red-300'
              }`}>
                {testResult.success ? 'Scan Successful' : 'Scan Failed'}
              </div>
              <p className={`text-xs ${
                testResult.success ? 'text-green-200' : 'text-gray-300'
              }`}>
                {testResult.message}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Complete Button */}
      {testPassed && !isCompleted && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onComplete}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded font-semibold transition-all shadow-lg shadow-green-500/25"
        >
          Scanner Fixed → Mark Objective as Done
        </motion.button>
      )}

      {isCompleted && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-sm text-green-300 font-semibold">Objective Completed</span>
        </div>
      )}
    </motion.div>
  )
}
