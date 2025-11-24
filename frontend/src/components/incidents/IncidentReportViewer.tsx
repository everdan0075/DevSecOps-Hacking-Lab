/**
 * Incident Report Viewer Component
 *
 * Displays available incident reports with download functionality
 */

import { useState, useEffect } from 'react'
import { FileText, Download, Filter } from 'lucide-react'
import { cn } from '@/utils/cn'
import { incidentService } from '@/services/incidentService'
import { formatFileSize, formatRelativeTime } from '@/utils/formatters'
import type { IncidentReport } from '@/types/api'

export function IncidentReportViewer() {
  const [reports, setReports] = useState<IncidentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [formatFilter, setFormatFilter] = useState<'all' | 'json' | 'markdown'>('all')
  const [downloading, setDownloading] = useState<string | null>(null)

  const fetchReports = async () => {
    try {
      const data = await incidentService.getIncidentReports()
      setReports(data.reports)
    } catch (error) {
      console.error('Failed to fetch incident reports:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchReports, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleDownload = async (incidentId: string, format: 'json' | 'markdown') => {
    setDownloading(incidentId)
    try {
      const blob = await incidentService.downloadIncidentReport(incidentId, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `incident-${incidentId}.${format === 'json' ? 'json' : 'md'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download report:', error)
      alert('Failed to download report. Please try again.')
    } finally {
      setDownloading(null)
    }
  }

  const filteredReports = reports.filter(
    (report) => formatFilter === 'all' || report.format === formatFilter
  )

  return (
    <div className="p-6 rounded-lg bg-cyber-surface border border-cyber-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyber-primary/10">
            <FileText className="w-5 h-5 text-cyber-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Incident Reports</h3>
            <p className="text-sm text-gray-400">
              {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value as 'all' | 'json' | 'markdown')}
            className="px-3 py-1.5 rounded-lg bg-cyber-bg border border-cyber-border text-white text-sm focus:outline-none focus:border-cyber-primary"
          >
            <option value="all">All Formats</option>
            <option value="json">JSON Only</option>
            <option value="markdown">Markdown Only</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-cyber-bg animate-pulse" />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        /* Empty State */
        <div className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h4 className="text-lg font-semibold text-gray-400 mb-2">No Reports Available</h4>
          <p className="text-sm text-gray-500">
            Incident reports will appear here after security incidents are handled
          </p>
        </div>
      ) : (
        /* Reports Table */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Incident ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Format
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border">
              {filteredReports.map((report) => (
                <tr
                  key={report.incident_id}
                  className="hover:bg-cyber-bg/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-white">{report.incident_id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400" title={new Date(report.created_at).toLocaleString()}>
                      {formatRelativeTime(report.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                        report.format === 'json'
                          ? 'text-blue-400 bg-blue-400/10 border border-blue-400/30'
                          : 'text-purple-400 bg-purple-400/10 border border-purple-400/30'
                      )}
                    >
                      {report.format.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-400">{formatFileSize(report.size_bytes)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDownload(report.incident_id, report.format)}
                      disabled={downloading === report.incident_id}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        downloading === report.incident_id
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/30 hover:bg-cyber-primary/20'
                      )}
                    >
                      <Download className="w-4 h-4" />
                      {downloading === report.incident_id ? 'Downloading...' : 'Download'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
