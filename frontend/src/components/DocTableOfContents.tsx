/**
 * DocTableOfContents Component
 *
 * Extracts and displays headings for quick navigation
 */

import { useState, useEffect, useMemo } from 'react'
import { List } from 'lucide-react'
import type { DocGuide } from '@/content/docs'

interface DocTableOfContentsProps {
  guide: DocGuide
}

interface TocItem {
  id: string
  title: string
  level: number
}

export function DocTableOfContents({ guide }: DocTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  // Extract headings from guide content using useMemo to avoid cascading renders
  const tocItems = useMemo<TocItem[]>(() => {
    return guide.content
      .filter((content) => content.type === 'heading')
      .map((content) => ({
        id: slugify(content.content as string),
        title: content.content as string,
        level: (content.level || 2) as number,
      }))
  }, [guide])

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -80% 0px',
      }
    )

    // Observe all heading elements
    tocItems.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [tocItems])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -80 // Account for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  if (tocItems.length === 0) {
    return null
  }

  return (
    <div className="w-48 flex-shrink-0 pl-6">
      <div className="sticky top-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <List className="w-4 h-4 text-cyber-primary" />
          <h3 className="text-sm font-semibold text-white">On This Page</h3>
        </div>

        {/* TOC Items */}
        <nav className="space-y-2">
          {tocItems.map((item) => {
            // Skip H1 (page title)
            if (item.level === 1) return null

            const isActive = activeId === item.id
            const indentClass = item.level === 3 ? 'ml-4' : ''

            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`
                  w-full text-left text-xs leading-relaxed transition-all
                  ${indentClass}
                  ${
                    isActive
                      ? 'text-cyber-primary font-medium'
                      : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                {item.title}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

/**
 * Convert text to URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
