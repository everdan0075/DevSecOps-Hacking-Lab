/**
 * ErrorBoundary Component
 *
 * React error boundary for graceful error handling
 */

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-cyber-bg p-4">
          <div className="max-w-2xl w-full bg-cyber-surface border border-cyber-border rounded-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-cyber-danger" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
                <p className="text-gray-400">
                  An unexpected error occurred. Please try refreshing the page or contact support if
                  the problem persists.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6 p-4 bg-cyber-bg border border-cyber-border rounded-lg">
                <div className="text-sm font-mono text-cyber-danger mb-2">
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-400 transition-colors">
                      Stack trace
                    </summary>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-cyber-primary text-cyber-bg hover:bg-cyber-primary/90 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-cyber-border text-gray-400 hover:text-white rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
