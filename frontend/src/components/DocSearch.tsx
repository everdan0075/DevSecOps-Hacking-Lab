/**
 * DocSearch Component
 *
 * Fuzzy search functionality with keyboard navigation using fuse.js
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Hash } from 'lucide-react'
import { DOC_SECTIONS } from '@/content/docs'
import type { DocGuide } from '@/content/docs'
import Fuse from 'fuse.js'

interface DocSearchProps {
  onResultSelect?: () => void // Callback for mobile
}

type FuseResult<T> = {
  item: T
  refIndex: number
  score?: number
  matches?: readonly { indices: readonly [number, number][]; value?: string; key?: string; arrayIndex?: number }[]
}

export function DocSearch({ onResultSelect }: DocSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FuseResult<DocGuide>[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  // Flatten all guides from all sections for searching
  const allGuides = useMemo(() => {
    return DOC_SECTIONS.flatMap(section =>
      section.guides.map(guide => ({
        ...guide,
        sectionTitle: section.title,
        tags: extractTags(guide)
      }))
    )
  }, [])

  // Configure Fuse.js fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(allGuides, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'description', weight: 1 },
        { name: 'tags', weight: 1.5 },
        { name: 'category', weight: 0.5 }
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      ignoreLocation: true
    })
  }, [allGuides])

  // Debounced fuzzy search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(() => {
      const searchResults = fuse.search(query).slice(0, 10) // Top 10 results
      setResults(searchResults)
      setShowResults(true)
      setSelectedIndex(0)
    }, 200)

    return () => clearTimeout(timer)
  }, [query, fuse])

  const handleSelectGuide = useCallback((guide: DocGuide) => {
    navigate(`/docs/${guide.slug}`)
    setQuery('')
    setShowResults(false)
    setResults([])
    inputRef.current?.blur()

    if (onResultSelect) {
      onResultSelect()
    }
  }, [navigate, onResultSelect])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search with '/' key
      if (e.key === '/' && !showResults && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
        return
      }

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
            handleSelectGuide(results[selectedIndex].item)
          }
          break
        case 'Escape':
          e.preventDefault()
          clearSearch()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showResults, results, selectedIndex, handleSelectGuide])

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
    setSelectedIndex(0)
    inputRef.current?.blur()
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
          placeholder="Search documentation... (press / to focus)"
          className="w-full pl-10 pr-10 py-2 bg-cyber-surface border border-cyber-border rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/50"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Result count */}
      {showResults && results.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
        </div>
      )}

      {/* Search results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-cyber-surface border border-cyber-border rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
          {results.map((result, index) => {
            const isSelected = index === selectedIndex
            const guide = result.item
            const score = result.score ? Math.round((1 - result.score) * 100) : 100

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
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-medium text-white truncate">
                        {guide.title}
                      </div>
                      <div className="text-xs px-1.5 py-0.5 rounded bg-cyber-primary/10 text-cyber-primary font-mono">
                        {score}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 line-clamp-2 mb-1">
                      {guide.description}
                    </div>
                    {(guide as any).sectionTitle && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Hash className="w-3 h-3" />
                        {(guide as any).sectionTitle}
                      </div>
                    )}
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

/**
 * Extract searchable tags from guide content
 */
function extractTags(guide: DocGuide): string[] {
  const tags: string[] = []

  // Add category as a tag
  if (guide.category) {
    tags.push(guide.category)
  }

  // Extract keywords from content headings
  guide.content.forEach(item => {
    if (item.type === 'heading' && typeof item.content === 'string') {
      const words = item.content.toLowerCase().split(' ')
      tags.push(...words.filter(w => w.length > 3))
    }
  })

  return tags
}
