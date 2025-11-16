/**
 * DocViewer Component
 *
 * Renders documentation content from DocGuide
 */

import { useEffect } from 'react'
import { AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { CodeBlock } from './CodeBlock'
import type { DocGuide, DocContent, TableContent } from '@/content/docs'

interface DocViewerProps {
  guide: DocGuide
}

export function DocViewer({ guide }: DocViewerProps) {
  // Scroll to top when guide changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [guide])

  const renderContent = (content: DocContent, index: number) => {
    switch (content.type) {
      case 'heading':
        const level = content.level || 2
        const headingId = slugify(content.content as string)
        const headingText = content.content as string

        if (level === 1) {
          return (
            <h1 key={index} id={headingId} className="text-3xl font-bold text-cyber-primary mb-4">
              {headingText}
            </h1>
          )
        } else if (level === 3) {
          return (
            <h3 key={index} id={headingId} className="text-xl font-semibold text-gray-200 mt-6 mb-3">
              {headingText}
            </h3>
          )
        } else {
          return (
            <h2 key={index} id={headingId} className="text-2xl font-semibold text-white mt-8 mb-4">
              {headingText}
            </h2>
          )
        }

      case 'paragraph':
        return (
          <p key={index} className="text-base text-gray-300 leading-relaxed mb-4">
            {content.content as string}
          </p>
        )

      case 'code':
        return (
          <div key={index} className="mb-4">
            <CodeBlock code={content.content as string} language={content.language} />
          </div>
        )

      case 'list':
        return (
          <ul key={index} className="list-disc list-inside mb-4 space-y-2">
            {(content.content as string[]).map((item, i) => (
              <li key={i} className="text-gray-300 leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        )

      case 'warning':
        return (
          <div
            key={index}
            className="mb-4 p-4 bg-cyber-warning/10 border border-cyber-warning/30 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-cyber-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300 leading-relaxed">
                {content.content as string}
              </div>
            </div>
          </div>
        )

      case 'info':
        return (
          <div
            key={index}
            className="mb-4 p-4 bg-cyber-primary/10 border border-cyber-primary/30 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-cyber-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300 leading-relaxed">
                {content.content as string}
              </div>
            </div>
          </div>
        )

      case 'danger':
        return (
          <div
            key={index}
            className="mb-4 p-4 bg-cyber-danger/10 border border-cyber-danger/30 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-cyber-danger flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300 leading-relaxed">
                {content.content as string}
              </div>
            </div>
          </div>
        )

      case 'table':
        const tableData = content.content as TableContent
        return (
          <div key={index} className="mb-4 overflow-x-auto">
            <table className="w-full border border-cyber-border rounded-lg overflow-hidden">
              <thead className="bg-cyber-surface">
                <tr>
                  {tableData.headers.map((header, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left text-sm font-semibold text-cyber-primary border-b border-cyber-border"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-cyber-bg">
                {tableData.rows.map((row, i) => (
                  <tr key={i} className="border-b border-cyber-border last:border-b-0">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="px-4 py-3 text-sm text-gray-300 font-mono"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Guide metadata */}
      <div className="mb-8 pb-4 border-b border-cyber-border">
        <p className="text-sm text-gray-500 mb-2">
          Last updated: {new Date(guide.lastUpdated).toLocaleDateString()}
        </p>
        <p className="text-gray-400">{guide.description}</p>
      </div>

      {/* Guide content */}
      <div className="prose prose-invert max-w-none">
        {guide.content.map((content, index) => renderContent(content, index))}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-cyber-border">
        <p className="text-sm text-gray-500 text-center">
          DevSecOps Hacking Lab - Educational Security Testing Environment
        </p>
      </div>
    </div>
  )
}

/**
 * Convert text to URL-friendly slug for anchor links
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
