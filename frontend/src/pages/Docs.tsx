/**
 * Docs Page
 *
 * Main documentation hub with sidebar, search, and content viewer
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BookOpen, Menu, X } from 'lucide-react'
import { getGuideBySlug } from '@/content/docs'
import { DocSidebar } from '@/components/DocSidebar'
import { DocSearch } from '@/components/DocSearch'
import { DocViewer } from '@/components/DocViewer'
import { DocTableOfContents } from '@/components/DocTableOfContents'

export function Docs() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Default to quick-start if no slug provided
  const currentSlug = slug || 'quick-start'
  const guide = getGuideBySlug(currentSlug)

  // Redirect to quick-start if slug not found
  useEffect(() => {
    if (!guide && currentSlug !== 'quick-start') {
      navigate('/docs/quick-start')
    }
  }, [guide, currentSlug, navigate])

  // Close sidebar on mobile when guide changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [currentSlug])

  if (!guide) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyber-primary/10 border border-cyber-primary/30 rounded-lg">
              <BookOpen className="w-8 h-8 text-cyber-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Documentation</h1>
              <p className="text-gray-400 mt-1">
                Guides, API references, and troubleshooting
              </p>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 bg-cyber-surface border border-cyber-border rounded-lg hover:bg-cyber-primary/10 hover:border-cyber-primary/50 transition-all"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6 text-gray-400" />
            ) : (
              <Menu className="w-6 h-6 text-gray-400" />
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="max-w-2xl">
          <DocSearch onResultSelect={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex gap-8 relative">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block">
          <DocSidebar currentSlug={currentSlug} />
        </div>

        {/* Sidebar - Mobile (overlay) */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-cyber-bg/95 backdrop-blur-sm">
            <div className="h-full overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Documentation</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 bg-cyber-surface border border-cyber-border rounded-lg hover:bg-cyber-danger/10 hover:border-cyber-danger/50 transition-all"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <DocSidebar
                currentSlug={currentSlug}
                onGuideSelect={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="bg-cyber-surface border border-cyber-border rounded-lg p-8">
            <DocViewer guide={guide} />
          </div>
        </div>

        {/* Table of Contents - Desktop only */}
        <div className="hidden xl:block">
          <DocTableOfContents guide={guide} />
        </div>
      </div>
    </div>
  )
}
