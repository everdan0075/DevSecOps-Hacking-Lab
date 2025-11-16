/**
 * DocSearch Component
 *
 * Search functionality with keyboard navigation
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { searchGuides, DOC_SECTIONS } from '@/content/docs'
import type { DocGuide } from '@/content/docs'

interface DocSearchProps {
  onResultSelect?: () => void // Callback for mobile
}

export function DocSearch({ onResultSelect }: DocSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DocGuide[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(() => {
      const searchResults = searchGuides(query)
      setResults(searchResults)
      setShowResults(true)
      setSelectedIndex(0)
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showResults || results.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % results.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleSelectGuide(results[selectedIndex])
          }
          break
        case 'Escape':
          setShowResults(false)
          inputRef.current?.blur()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showResults, results, selectedIndex])

  const handleSelectGuide = (guide: DocGuide) => {
    navigate(`/docs/${guide.slug}`)
    setQuery('')
    setShowResults(false)
    setResults([])
    inputRef.current?.blur()

    if (onResultSelect) {
      onResultSelect()
    }
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
    setSelectedIndex(0)
  }

  // Get category name for a guide
  const getCategoryName = (guide: DocGuide): string => {
    for (const section of DOC_SECTIONS) {
      if (section.guides.some((g) => g.slug === guide.slug)) {
        return section.title
      }
    }
    return ''
  }

  return (
    <div className="relative">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true)
          }}
          placeholder="Search documentation..."
          className="w-full pl-10 pr-10 py-2 bg-cyber-surface border border-cyber-border rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-cyber-surface border border-cyber-border rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
          {results.map((guide, index) => {
            const isSelected = index === selectedIndex

            return (
              <button
                key={guide.slug}
                onClick={() => handleSelectGuide(guide)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`
                  w-full text-left px-4 py-3 border-b border-cyber-border last:border-b-0 transition-colors
                  ${isSelected ? 'bg-cyber-primary/10' : 'hover:bg-cyber-surface/50'}
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white mb-1 truncate">
                      {guide.title}
                    </div>
                    <div className="text-xs text-gray-400 line-clamp-2">
                      {guide.description}
                    </div>
                  </div>
                  <div className="text-xs text-cyber-primary font-mono whitespace-nowrap">
                    {getCategoryName(guide)}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* No results */}
      {showResults && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-cyber-surface border border-cyber-border rounded-lg shadow-xl p-4 z-50">
          <p className="text-sm text-gray-500 text-center">
            No results found for "{query}"
          </p>
        </div>
      )}
    </div>
  )
}
