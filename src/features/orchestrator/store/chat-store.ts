import { create } from 'zustand'
import type { ChatMessage, PageContext } from '../types'

interface ChatState {
  // UI state
  isOpen: boolean
  isLoading: boolean

  // Messages
  messages: ChatMessage[]

  // Current page context
  pageContext: PageContext

  // Actions
  setOpen: (open: boolean) => void
  toggle: () => void
  setLoading: (loading: boolean) => void
  addMessage: (message: ChatMessage) => void
  updateLastAssistantMessage: (content: string) => void
  setPageContext: (context: PageContext) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  isLoading: false,
  messages: [],
  pageContext: { module: 'dashboard', path: '/dashboard' },

  setOpen: (open) => set({ isOpen: open }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setLoading: (loading) => set({ isLoading: loading }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateLastAssistantMessage: (content) =>
    set((state) => {
      const msgs = [...state.messages]
      // Find last assistant message and update it (for streaming)
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], content }
          break
        }
      }
      return { messages: msgs }
    }),

  setPageContext: (context) => set({ pageContext: context }),
  clearMessages: () => set({ messages: [] }),
}))
