'use client'

import { useCallback } from 'react'
import { applyUnicodeFormat, type UnicodeFormatAction } from '@/shared/lib/unicode-format'

interface UnicodeToolbarProps {
  /** Ref to the textarea element */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  /** Called when text is modified by formatting */
  onTextChange: (newText: string) => void
  /** Current text content */
  value: string
}

const FORMAT_BUTTONS: Array<{
  action: UnicodeFormatAction
  label: string
  title: string
  className?: string
}> = [
  { action: 'bold', label: 'B', title: 'Negrita unicode', className: 'font-bold' },
  { action: 'italic', label: 'I', title: 'Cursiva unicode', className: 'italic' },
  { action: 'bold-italic', label: 'BI', title: 'Negrita + cursiva unicode', className: 'font-bold italic' },
  { action: 'monospace', label: 'M', title: 'Monospace unicode', className: 'font-mono' },
  { action: 'strikethrough', label: 'S', title: 'Tachado unicode', className: 'line-through' },
  { action: 'clear', label: 'Aa', title: 'Limpiar formato unicode' },
  { action: 'bullets', label: '•', title: 'Lista con vinetas' },
  { action: 'numbered', label: '1.', title: 'Lista numerada', className: 'font-mono' },
]

export function UnicodeToolbar({ textareaRef, onTextChange, value }: UnicodeToolbarProps) {
  const handleFormat = useCallback((action: UnicodeFormatAction) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    if (start === end) return // No selection

    const selectedText = value.slice(start, end)
    const formattedText = applyUnicodeFormat(selectedText, action)

    const newText = value.slice(0, start) + formattedText + value.slice(end)
    onTextChange(newText)

    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start, start + formattedText.length)
    })
  }, [textareaRef, onTextChange, value])

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-surface border border-border rounded-xl">
      <span className="text-xs text-foreground-muted mr-1">Unicode:</span>
      {FORMAT_BUTTONS.map(({ action, label, title, className }) => (
        <button
          key={action}
          type="button"
          onClick={() => handleFormat(action)}
          title={title}
          className={`px-2 py-0.5 text-xs rounded-lg border border-border hover:bg-accent-50 hover:border-accent-300 transition-colors ${className ?? ''}`}
        >
          {label}
        </button>
      ))}
      <span className="text-xs text-foreground-muted ml-1">
        Selecciona texto primero
      </span>
    </div>
  )
}
