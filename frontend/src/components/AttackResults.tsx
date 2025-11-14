/**
 * AttackResults Component
 *
 * Displays attack execution results and metrics
 */

import { CheckCircle, XCircle, AlertTriangle, Database, TrendingUp, ExternalLink } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ENDPOINTS } from '@/utils/constants'

interface AttackResultsProps {
  success: boolean
  summary: string
  dataExtracted?: Record<string, unknown>
  metricsTriggered?: string[]
}

export function AttackResults({
  success,
  summary,
  dataExtracted,
  metricsTriggered,
}: AttackResultsProps) {
  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div
        className={cn(
          'p-4 rounded-lg border-2 flex items-center gap-3',
          success
            ? 'bg-cyber-success/10 border-cyber-success/50'
            : 'bg-cyber-danger/10 border-cyber-danger/50'
        )}
      >
        {success ? (
          <CheckCircle className="w-6 h-6 text-cyber-success flex-shrink-0" />
        ) : (
          <XCircle className="w-6 h-6 text-cyber-danger flex-shrink-0" />
        )}
        <div>
          <div className={cn('font-semibold', success ? 'text-cyber-success' : 'text-cyber-danger')}>
            {success ? 'Attack Successful' : 'Attack Failed'}
          </div>
          <div className="text-sm text-gray-400 mt-1">{summary}</div>
        </div>
      </div>

      {/* Extracted Data */}
      {dataExtracted && Object.keys(dataExtracted).length > 0 && (
        <div className="bg-cyber-surface border border-cyber-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-cyber-primary" />
            <h3 className="text-sm font-semibold text-white">Data Extracted</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(dataExtracted).map(([key, value]) => (
              <DataField key={key} label={key} value={value} />
            ))}
          </div>
        </div>
      )}

      {/* Metrics Triggered */}
      {metricsTriggered && metricsTriggered.length > 0 && (
        <div className="bg-cyber-surface border border-cyber-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-cyber-primary" />
            <h3 className="text-sm font-semibold text-white">Detection Metrics</h3>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-gray-400 mb-3">
              This attack should trigger the following Prometheus metrics:
            </p>
            {metricsTriggered.map((metric) => (
              <div
                key={metric}
                className="flex items-center justify-between p-2 bg-cyber-bg rounded border border-cyber-border/50"
              >
                <code className="text-xs font-mono text-cyber-secondary">{metric}</code>
                <a
                  href={`${ENDPOINTS.PROMETHEUS.QUERY}?query=${metric}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyber-primary hover:text-cyber-secondary transition-colors flex items-center gap-1"
                >
                  Query
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-cyber-warning/10 border border-cyber-warning/30 rounded">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-cyber-warning flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-400">
                <strong className="text-cyber-warning">Note:</strong> Metrics are collected by
                Prometheus. View dashboards in{' '}
                <a
                  href={ENDPOINTS.GRAFANA.DASHBOARDS.ATTACK_VISIBILITY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyber-primary hover:underline"
                >
                  Grafana
                </a>{' '}
                for real-time visualization.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-cyber-surface border border-cyber-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Next Steps</h3>
        <ul className="space-y-2 text-xs text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-cyber-primary">•</span>
            <span>
              Check{' '}
              <a
                href={ENDPOINTS.GRAFANA.DASHBOARDS.ATTACK_VISIBILITY}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyber-primary hover:underline"
              >
                Attack Visibility Dashboard
              </a>{' '}
              to see real-time metrics
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyber-primary">•</span>
            <span>
              Review{' '}
              <a
                href={ENDPOINTS.INCIDENTS.LIST}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyber-primary hover:underline"
              >
                Incident Bot
              </a>{' '}
              for automated responses
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyber-primary">•</span>
            <span>
              Query{' '}
              <a
                href={ENDPOINTS.PROMETHEUS.QUERY}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyber-primary hover:underline"
              >
                Prometheus
              </a>{' '}
              directly for detailed metrics
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}

function DataField({ label, value }: { label: string; value: unknown }) {
  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return 'null'
    if (typeof val === 'object') return JSON.stringify(val, null, 2)
    return String(val)
  }

  const isObject = typeof value === 'object' && value !== null

  return (
    <div>
      <div className="text-xs text-gray-500 mb-1 font-mono">
        {label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}:
      </div>
      <div
        className={cn(
          'p-2 rounded border border-cyber-border/50 text-xs',
          isObject ? 'bg-cyber-bg font-mono overflow-x-auto' : 'bg-cyber-bg/50 text-gray-400'
        )}
      >
        {isObject ? (
          <pre className="text-cyber-secondary whitespace-pre-wrap">{formatValue(value)}</pre>
        ) : (
          <span className="text-gray-400">{formatValue(value)}</span>
        )}
      </div>
    </div>
  )
}
