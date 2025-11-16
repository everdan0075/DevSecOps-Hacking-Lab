/**
 * DocSidebar Component
 *
 * Shows documentation categories and navigation
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Rocket, Target, Shield, Code, AlertCircle } from 'lucide-react'
import { DOC_SECTIONS } from '@/content/docs'
import type { DocSection } from '@/content/docs'

interface DocSidebarProps {
  currentSlug?: string
  onGuideSelect?: () => void // Callback for mobile menu close
}

// Icon mapping
const ICON_MAP: Record<string, any> = {
  Rocket,
  Target,
  Shield,
  Code,
  AlertCircle,
}

export function DocSidebar({ currentSlug, onGuideSelect }: DocSidebarProps) {
  // Track expanded sections (default: all expanded)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(DOC_SECTIONS.map((s) => s.id))
  )

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const handleGuideClick = () => {
    if (onGuideSelect) {
      onGuideSelect()
    }
  }

  const renderSection = (section: DocSection) => {
    const isExpanded = expandedSections.has(section.id)
    const Icon = ICON_MAP[section.icon] || Rocket

    return (
      <div key={section.id} className="mb-4">
        {/* Section header */}
        <button
          onClick={() => toggleSection(section.id)}
          className="w-full flex items-center justify-between p-3 bg-cyber-surface border border-cyber-border rounded-lg hover:bg-cyber-primary/5 hover:border-cyber-primary/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-cyber-primary" />
            <span className="text-sm font-semibold text-white group-hover:text-cyber-primary transition-colors">
              {section.title}
            </span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* Guides list */}
        {isExpanded && (
          <div className="mt-2 ml-4 space-y-1">
            {section.guides.map((guide) => {
              const isActive = guide.slug === currentSlug

              return (
                <Link
                  key={guide.slug}
                  to={`/docs/${guide.slug}`}
                  onClick={handleGuideClick}
                  className={`
                    block px-4 py-2 rounded-lg text-sm transition-all
                    ${
                      isActive
                        ? 'bg-cyber-primary/10 border-l-2 border-cyber-primary text-cyber-primary font-medium'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-cyber-surface border-l-2 border-transparent'
                    }
                  `}
                >
                  <div className="font-medium mb-1">{guide.title}</div>
                  <div className="text-xs text-gray-500 line-clamp-2">
                    {guide.description}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-64 flex-shrink-0 pr-6">
      <div className="sticky top-8">
        {/* Sidebar header */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white mb-2">Documentation</h2>
          <p className="text-xs text-gray-500">
            {DOC_SECTIONS.reduce((acc, s) => acc + s.guides.length, 0)} guides available
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-2">
          {DOC_SECTIONS.map(renderSection)}
        </div>
      </div>
    </div>
  )
}
