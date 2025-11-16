/**
 * CodeBlock Component
 *
 * Displays code with syntax highlighting and copy functionality
 */

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Simple syntax highlighting for common languages
  const highlightCode = (code: string, lang: string): string => {
    if (lang === 'bash' || lang === 'sh') {
      return code
        .replace(/(#.*$)/gm, '<span class="text-gray-500">$1</span>')
        .replace(/^(\$|\>)/gm, '<span class="text-cyber-warning">$1</span>')
        .replace(/(".*?")/g, '<span class="text-cyber-success">$1</span>')
        .replace(/('.*?')/g, '<span class="text-cyber-success">$1</span>')
    }

    if (lang === 'python' || lang === 'py') {
      return code
        .replace(/(#.*$)/gm, '<span class="text-gray-500">$1</span>')
        .replace(/\b(def|class|import|from|if|else|elif|for|while|return|try|except|with|as|async|await)\b/g, '<span class="text-cyber-primary">$1</span>')
        .replace(/(".*?")/g, '<span class="text-cyber-success">$1</span>')
        .replace(/('.*?')/g, '<span class="text-cyber-success">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="text-cyber-warning">$1</span>')
    }

    if (lang === 'typescript' || lang === 'javascript' || lang === 'ts' || lang === 'js') {
      return code
        .replace(/(\/\/.*$)/gm, '<span class="text-gray-500">$1</span>')
        .replace(/\b(const|let|var|function|if|else|return|import|export|from|async|await|class|interface|type)\b/g, '<span class="text-cyber-primary">$1</span>')
        .replace(/(".*?")/g, '<span class="text-cyber-success">$1</span>')
        .replace(/('.*?')/g, '<span class="text-cyber-success">$1</span>')
        .replace(/(`.*?`)/g, '<span class="text-cyber-success">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="text-cyber-warning">$1</span>')
    }

    if (lang === 'json') {
      return code
        .replace(/(".*?")\s*:/g, '<span class="text-cyber-primary">$1</span>:')
        .replace(/:\s*(".*?")/g, ': <span class="text-cyber-success">$1</span>')
        .replace(/:\s*(\d+)/g, ': <span class="text-cyber-warning">$1</span>')
        .replace(/:\s*(true|false|null)/g, ': <span class="text-purple-400">$1</span>')
    }

    if (lang === 'yaml' || lang === 'yml') {
      return code
        .replace(/(#.*$)/gm, '<span class="text-gray-500">$1</span>')
        .replace(/^(\s*)([\w-]+):/gm, '$1<span class="text-cyber-primary">$2</span>:')
        .replace(/:\s*(".*?")/g, ': <span class="text-cyber-success">$1</span>')
        .replace(/:\s*(\d+)/g, ': <span class="text-cyber-warning">$1</span>')
    }

    // Default: no highlighting
    return code
  }

  const highlighted = highlightCode(code, language)

  return (
    <div className="relative group">
      {/* Language badge and copy button */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
        {language && language !== 'text' && (
          <span className="px-2 py-1 bg-cyber-surface text-xs text-cyber-primary border border-cyber-border rounded font-mono uppercase">
            {language}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="p-2 bg-cyber-surface border border-cyber-border rounded hover:bg-cyber-primary/10 hover:border-cyber-primary/50 transition-all opacity-0 group-hover:opacity-100"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-cyber-success" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Code block */}
      <pre className="bg-cyber-bg border border-cyber-border rounded-lg p-4 overflow-x-auto">
        <code
          className="text-sm font-mono text-gray-300"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  )
}
