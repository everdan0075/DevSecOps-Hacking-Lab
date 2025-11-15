/**
 * Metrics Chart Component
 *
 * Line chart showing metric over time using recharts
 */

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, AlertCircle } from 'lucide-react'
import { metricsService } from '@/services/metricsService'
import { REFRESH_INTERVALS } from '@/utils/constants'
import { cn } from '@/utils/cn'
import type { MetricTimeSeriesPoint } from '@/types/api'

interface MetricsChartProps {
  className?: string
}

interface MetricOption {
  label: string
  value: string
  color: string
}

const METRIC_OPTIONS: MetricOption[] = [
  { label: 'Login Attempts', value: 'login_attempts_total', color: '#3b82f6' },
  { label: 'Failed Logins', value: 'login_failures_total', color: '#eab308' },
  { label: 'MFA Attempts', value: 'mfa_attempts_total', color: '#00ff41' },
  { label: 'IDOR Attempts', value: 'user_service_idor_attempts_total', color: '#a855f7' },
  { label: 'Rate Limit Blocks', value: 'gateway_rate_limit_blocks_total', color: '#f97316' },
]

export function MetricsChart({ className }: MetricsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState(METRIC_OPTIONS[0])
  const [data, setData] = useState<MetricTimeSeriesPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const timeSeries = await metricsService.getMetricTimeSeries(selectedMetric.value, 60)
        setData(timeSeries)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metric data')
        setData([])
        setLoading(false)
      }
    }

    fetchData()

    // Auto-refresh
    const intervalId = setInterval(fetchData, REFRESH_INTERVALS.METRICS)

    return () => {
      clearInterval(intervalId)
    }
  }, [selectedMetric])

  // Format data for recharts
  const chartData = data.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    value: point.value,
  }))

  return (
    <div className={cn('p-4 rounded-lg bg-cyber-surface border border-cyber-border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyber-primary" />
          <h3 className="text-lg font-semibold">Metric Time Series</h3>
        </div>
        <select
          value={selectedMetric.value}
          onChange={(e) => {
            const option = METRIC_OPTIONS.find((opt) => opt.value === e.target.value)
            if (option) setSelectedMetric(option)
          }}
          className={cn(
            'px-3 py-1.5 rounded-lg',
            'bg-cyber-bg border border-cyber-border',
            'text-sm text-white',
            'focus:outline-none focus:border-cyber-primary',
            'cursor-pointer'
          )}
        >
          {METRIC_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-400">Loading chart data...</div>
        </div>
      ) : error || data.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-4">
          <AlertCircle className="w-12 h-12 mb-3 text-cyber-warning" />
          <p className="text-gray-400">
            {error || 'No data available. Metrics will appear when Prometheus is connected.'}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickMargin={8}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickMargin={8}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#141b2d',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={selectedMetric.color}
              strokeWidth={2}
              dot={{ fill: selectedMetric.color, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Footer info */}
      <div className="mt-3 pt-3 border-t border-cyber-border">
        <p className="text-xs text-gray-500">
          Last 60 minutes • Auto-refreshes every 15 seconds
        </p>
      </div>
    </div>
  )
}
