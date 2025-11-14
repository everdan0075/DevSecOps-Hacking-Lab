/**
 * Attacks Page
 *
 * Main attack playground with scenario grid and execution panels
 */

import { useState } from 'react'
import { Target, AlertTriangle, Shield } from 'lucide-react'
import { ATTACK_SCENARIOS } from '@/utils/constants'
import { useBackendStatus } from '@/hooks/useBackendStatus'
import { AttackCard } from '@/components/AttackCard'
import { AttackExecutionPanel } from '@/components/AttackExecutionPanel'
import { AuthenticationPanel } from '@/components/AuthenticationPanel'
import type { AttackScenario } from '@/types/api'

export function Attacks() {
  const { isConnected, disconnectedMessage } = useBackendStatus()
  const [selectedScenario, setSelectedScenario] = useState<AttackScenario | null>(null)

  const handleLaunchAttack = (scenario: AttackScenario) => {
    if (!isConnected) return
    setSelectedScenario(scenario)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-cyber-primary/10 border border-cyber-primary/30 rounded-lg">
            <Target className="w-8 h-8 text-cyber-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Attack Playground</h1>
            <p className="text-gray-400 mt-1">
              Execute real security attacks against vulnerable services
            </p>
          </div>
        </div>

        {/* Backend Status Warning */}
        {!isConnected && (
          <div className="p-4 bg-cyber-danger/10 border border-cyber-danger/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-cyber-danger flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-cyber-danger mb-1">Backend Required</div>
                <div className="text-sm text-gray-400">{disconnectedMessage}</div>
                <div className="text-sm text-gray-400 mt-2">
                  Run <code className="font-mono text-cyber-primary">docker-compose up -d</code> to
                  enable attack execution.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Educational Notice */}
        {isConnected && (
          <div className="p-4 bg-cyber-warning/10 border border-cyber-warning/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-cyber-warning flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-cyber-warning mb-1">
                  Educational Purpose Only
                </div>
                <div className="text-sm text-gray-400">
                  All attacks execute in a controlled lab environment. Do not use these techniques
                  against systems you don't own or have explicit permission to test.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Authentication Panel */}
      {isConnected && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Authentication</h2>
          <AuthenticationPanel />
        </div>
      )}

      {/* Attack Scenarios Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Attack Scenarios</h2>
          <div className="text-sm text-gray-400">
            {ATTACK_SCENARIOS.length} scenarios available
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ATTACK_SCENARIOS.map((scenario) => (
            <AttackCard
              key={scenario.id}
              scenario={scenario}
              disabled={!isConnected}
              onLaunch={() => handleLaunchAttack(scenario)}
            />
          ))}
        </div>
      </div>

      {/* OWASP Reference */}
      <div className="bg-cyber-surface border border-cyber-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-3">OWASP Top 10 Coverage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-mono text-cyber-primary mb-1">A01:2021 - Broken Access Control</div>
            <div className="text-gray-400 text-xs ml-4">
              • IDOR Exploitation
              <br />• Gateway Bypass
            </div>
          </div>
          <div>
            <div className="font-mono text-cyber-primary mb-1">
              A07:2021 - Identification and Authentication Failures
            </div>
            <div className="text-gray-400 text-xs ml-4">
              • Brute Force Attack
              <br />• MFA Bypass
              <br />• Token Replay
              <br />• Credential Stuffing
            </div>
          </div>
          <div>
            <div className="font-mono text-cyber-primary mb-1">A04:2021 - Insecure Design</div>
            <div className="text-gray-400 text-xs ml-4">• Rate Limit Bypass</div>
          </div>
        </div>
      </div>

      {/* Attack Execution Modal */}
      {selectedScenario && (
        <AttackExecutionPanel
          scenario={selectedScenario}
          onClose={() => setSelectedScenario(null)}
        />
      )}
    </div>
  )
}
