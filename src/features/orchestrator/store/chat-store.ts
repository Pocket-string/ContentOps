import { create } from 'zustand'
import type { ChatMessage, PageContext } from '../types'

// Track feedback per message: null = no feedback, true = thumbs up, false = thumbs down
type FeedbackMap = Record<string, boolean>

interface ChatState {
  // UI state
  isOpen: boolean
  isLoading: boolean

  // Messages
  messages: ChatMessage[]

  // Feedback
  feedback: FeedbackMap

  // Current page context
  pageContext: PageContext

  // Actions
  setOpen: (open: boolean) => void
  toggle: () => void
  setLoading: (loading: boolean) => void
  addMessage: (message: ChatMessage) => void
  updateLastAssistantMessage: (content: string) => void
  setPageContext: (context: PageContext) => void
  setFeedback: (messageId: string, positive: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  isLoading: false,
  messages: [],
  feedback: {},
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
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], content }
          break
        }
      }
      return { messages: msgs }
    }),

  setPageContext: (context) => set({ pageContext: context }),

  setFeedback: (messageId, positive) =>
    set((state) => ({
      feedback: { ...state.feedback, [messageId]: positive },
    })),

  clearMessages: () => set({ messages: [], feedback: {} }),
}))
