'use client'

import { useState, useRef, useCallback, useId } from 'react'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  label?: string
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Escribe y presiona Enter...',
  label,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const labelId = useId()

  const filteredSuggestions = suggestions.filter(
    (s) =>
      inputValue.trim().length > 0 &&
      s.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(s)
  )

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim().toLowerCase()
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed])
      }
      setInputValue('')
      setShowDropdown(false)
      inputRef.current?.focus()
    },
    [value, onChange]
  )

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onChange(value.filter((t) => t !== tagToRemove))
    },
    [value, onChange]
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (raw.endsWith(',')) {
      const candidate = raw.slice(0, -1)
      if (candidate.trim()) addTag(candidate)
    } else {
      setInputValue(raw)
      setShowDropdown(true)
    }
  }

  function handleBlur() {
    // Delay to allow click on suggestion to fire first
    setTimeout(() => setShowDropdown(false), 150)
  }

  return (
    <div className="w-full">
      {label && (
        <label
          id={labelId}
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Tag chips + input field */}
      <div
        className="min-h-[44px] w-full px-3 py-2 bg-surface border border-border rounded-xl
          hover:border-border-dark transition-all duration-200
          focus-within:ring-2 focus-within:ring-accent-500 focus-within:border-transparent
          flex flex-wrap gap-1.5 items-center cursor-text"
        onClick={() => inputRef.current?.focus()}
        role="group"
        aria-labelledby={label ? labelId : undefined}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
              bg-accent-100 text-accent-700"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="ml-0.5 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center
                hover:bg-accent-200 transition-colors focus:outline-none focus-visible:ring-1
                focus-visible:ring-accent-500"
              aria-label={`Eliminar etiqueta ${tag}`}
            >
              <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="currentColor" aria-hidden="true">
                <path d="M6.414 5l2.293-2.293a1 1 0 00-1.414-1.414L5 3.586 2.707 1.293A1 1 0 001.293 2.707L3.586 5 1.293 7.293a1 1 0 001.414 1.414L5 6.414l2.293 2.293a1 1 0 001.414-1.414L6.414 5z" />
              </svg>
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-foreground
            placeholder:text-foreground-muted outline-none"
          aria-label={label ? undefined : placeholder}
          aria-autocomplete="list"
        />
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && filteredSuggestions.length > 0 && (
        <ul
          role="listbox"
          className="mt-1 bg-surface border border-border rounded-xl shadow-md
            max-h-48 overflow-y-auto z-50 animate-fade-in"
        >
          {filteredSuggestions.map((suggestion) => (
            <li
              key={suggestion}
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault()
                addTag(suggestion)
              }}
              className="px-4 py-2 text-sm text-foreground cursor-pointer
                hover:bg-primary-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-1.5 text-xs text-foreground-muted">
        Presiona Enter o coma para agregar. Backspace para eliminar el ultimo.
      </p>
    </div>
  )
}
