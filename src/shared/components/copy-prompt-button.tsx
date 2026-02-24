'use client'

import { useState, useCallback } from 'react'

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

interface CopyPromptButtonProps {
  getPrompt: () => string
  label?: string
  className?: string
}

export function CopyPromptButton({ getPrompt, label = 'Copiar Prompt', className = '' }: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getPrompt())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = getPrompt()
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [getPrompt])

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
        copied
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-surface text-foreground-muted border-border hover:text-foreground hover:border-border-dark'
      } ${className}`}
      aria-label={copied ? 'Copiado al portapapeles' : label}
    >
      {copied ? (
        <>
          <CheckIcon className="w-3.5 h-3.5" />
          Copiado!
        </>
      ) : (
        <>
          <ClipboardIcon className="w-3.5 h-3.5" />
          {label}
        </>
      )}
    </button>
  )
}
