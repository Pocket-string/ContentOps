'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useChatStore } from '../store/chat-store'
import type { ChatMessage, PageContext } from '../types'

// ============================================
// Icons
// ============================================

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}

function ThumbsUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
    </svg>
  )
}

function ThumbsDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" />
    </svg>
  )
}

// ============================================
// Helpers
// ============================================

function detectModule(pathname: string): PageContext['module'] {
  if (pathname.startsWith('/research')) return 'research'
  if (pathname.startsWith('/topics')) return 'topics'
  if (pathname.includes('/posts/')) return 'posts'
  if (pathname.includes('/visuals/')) return 'visuals'
  if (pathname.startsWith('/campaigns')) return 'campaigns'
  if (pathname.startsWith('/patterns')) return 'patterns'
  if (pathname.startsWith('/insights')) return 'insights'
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  return 'other'
}

function extractIdsFromPath(pathname: string): Partial<PageContext> {
  const ids: Partial<PageContext> = {}

  // /campaigns/[id]
  const campaignMatch = pathname.match(/\/campaigns\/([a-f0-9-]+)/)
  if (campaignMatch) ids.campaignId = campaignMatch[1]

  // /campaigns/[id]/posts/[day]
  const postDayMatch = pathname.match(/\/posts\/(\d+)/)
  if (postDayMatch) ids.dayOfWeek = parseInt(postDayMatch[1], 10)

  // /topics/[id]
  const topicMatch = pathname.match(/\/topics\/([a-f0-9-]+)/)
  if (topicMatch) ids.topicId = topicMatch[1]

  // /research/[id]
  const researchMatch = pathname.match(/\/research\/([a-f0-9-]+)/)
  if (researchMatch) ids.researchId = researchMatch[1]

  return ids
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ============================================
// Main Component
// ============================================

export function ChatWidget() {
  const pathname = usePathname()
  const {
    isOpen,
    isLoading,
    messages,
    feedback,
    pageContext,
    toggle,
    setLoading,
    addMessage,
    updateLastAssistantMessage,
    setPageContext,
    setFeedback,
    clearMessages,
  } = useChatStore()

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-update page context when route changes
  useEffect(() => {
    const module = detectModule(pathname)
    const ids = extractIdsFromPath(pathname)
    setPageContext({ module, path: pathname, ...ids })
  }, [pathname, setPageContext])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    setInput('')
    setLoading(true)

    // Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    }
    addMessage(userMsg)

    // Add placeholder assistant message for streaming
    const assistantMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
    addMessage(assistantMsg)

    try {
      // Build history from last 10 messages (excluding the new ones)
      const historyMessages = messages.slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          context: pageContext,
          history: historyMessages,
        }),
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({ error: 'Error del servidor' }))
        updateLastAssistantMessage((errJson as { error?: string }).error ?? 'Error al procesar tu mensaje')
        setLoading(false)
        return
      }

      // Stream the response
      const reader = response.body?.getReader()
      if (!reader) {
        updateLastAssistantMessage('Error: no se pudo leer la respuesta')
        setLoading(false)
        return
      }

      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        updateLastAssistantMessage(accumulated)
      }
    } catch {
      updateLastAssistantMessage('Error de red. Verifica tu conexion e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [input, isLoading, messages, pageContext, addMessage, updateLastAssistantMessage, setLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFeedback = useCallback(async (messageId: string, positive: boolean) => {
    setFeedback(messageId, positive)
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          positive,
          module: pageContext.module,
        }),
      })
    } catch {
      // Feedback is best-effort — don't disrupt UX on failure
    }
  }, [setFeedback, pageContext.module])

  // Module label for display
  const MODULE_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    research: 'Research',
    topics: 'Topics',
    campaigns: 'Campaigns',
    posts: 'Posts',
    visuals: 'Visuals',
    patterns: 'Patterns',
    insights: 'Insights',
    settings: 'Settings',
    other: 'App',
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggle}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          shadow-lg transition-all duration-200
          flex items-center justify-center
          ${isOpen
            ? 'bg-gray-600 hover:bg-gray-700 scale-90'
            : 'bg-primary-500 hover:bg-primary-600 hover:scale-105'
          }
        `}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir orquestador'}
      >
        {isOpen ? (
          <XIcon className="w-6 h-6 text-white" />
        ) : (
          <ChatIcon className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="
            fixed bottom-24 right-6 z-50
            w-[400px] max-w-[calc(100vw-3rem)]
            h-[560px] max-h-[calc(100vh-8rem)]
            bg-surface border border-border
            rounded-2xl shadow-2xl
            flex flex-col overflow-hidden
          "
          role="dialog"
          aria-label="Orquestador ContentOps"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary-500">
            <div>
              <h2 className="text-sm font-bold text-white">Orquestador</h2>
              <p className="text-xs text-primary-200">
                {MODULE_LABELS[pageContext.module] ?? 'App'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearMessages}
                className="p-1.5 rounded-lg hover:bg-primary-400 transition-colors"
                aria-label="Limpiar conversacion"
                title="Limpiar conversacion"
              >
                <TrashIcon className="w-4 h-4 text-primary-200" />
              </button>
              <button
                onClick={toggle}
                className="p-1.5 rounded-lg hover:bg-primary-400 transition-colors"
                aria-label="Cerrar chat"
              >
                <XIcon className="w-4 h-4 text-primary-200" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
                  <ChatIcon className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Hola! Soy tu Orquestador</p>
                  <p className="text-xs text-foreground-muted mt-1">
                    Preguntame sobre el flujo de contenido, te guio en cada etapa.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                  {[
                    'Como empiezo un research?',
                    'Que variante es mejor?',
                    'Como mejoro el D/G/P/I?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion); inputRef.current?.focus() }}
                      className="text-xs px-3 py-1.5 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%]">
                  <div
                    className={`
                      rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-primary-500 text-white rounded-br-md'
                        : 'bg-gray-100 text-foreground rounded-bl-md'
                      }
                    `}
                  >
                    {msg.content || (
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </div>
                  {/* Feedback buttons for assistant messages */}
                  {msg.role === 'assistant' && msg.content && !isLoading && (
                    <div className="flex items-center gap-1 mt-1 ml-1">
                      <button
                        onClick={() => handleFeedback(msg.id, true)}
                        className={`p-1 rounded transition-colors ${
                          feedback[msg.id] === true
                            ? 'text-green-600'
                            : 'text-gray-300 hover:text-green-500'
                        }`}
                        aria-label="Buena respuesta"
                        title="Buena respuesta"
                      >
                        <ThumbsUpIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, false)}
                        className={`p-1 rounded transition-colors ${
                          feedback[msg.id] === false
                            ? 'text-red-500'
                            : 'text-gray-300 hover:text-red-400'
                        }`}
                        aria-label="Mala respuesta"
                        title="Mala respuesta"
                      >
                        <ThumbsDownIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                rows={1}
                className="
                  flex-1 px-3 py-2
                  bg-background text-foreground text-sm
                  border border-border rounded-xl
                  placeholder:text-foreground-muted
                  resize-none
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  max-h-24 overflow-y-auto
                "
                disabled={isLoading}
                aria-label="Mensaje al orquestador"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="
                  p-2.5 rounded-xl
                  bg-primary-500 text-white
                  hover:bg-primary-600
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors shrink-0
                "
                aria-label="Enviar mensaje"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
