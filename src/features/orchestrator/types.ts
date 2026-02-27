import { z } from 'zod'

// Message roles
export const MESSAGE_ROLES = ['user', 'assistant', 'system'] as const
export type MessageRole = (typeof MESSAGE_ROLES)[number]

// Page context - what the user is currently looking at
export interface PageContext {
  module:
    | 'dashboard'
    | 'research'
    | 'topics'
    | 'campaigns'
    | 'posts'
    | 'visuals'
    | 'patterns'
    | 'insights'
    | 'settings'
    | 'other'
  path: string
  // Optional data IDs for deeper context
  campaignId?: string
  postId?: string
  topicId?: string
  researchId?: string
  dayOfWeek?: number
  funnelStage?: string
  selectedVariant?: string
  visualFormat?: string
}

// Chat message
export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  // Metadata
  agentType?: string // which specialist agent responded
  actionTaken?: string // if the agent performed an action
}

// Orchestrator input schema (for API validation)
export const chatInputSchema = z.object({
  message: z
    .string()
    .min(1, 'Mensaje requerido')
    .max(2000, 'Mensaje demasiado largo'),
  context: z.object({
    module: z.string(),
    path: z.string(),
    campaignId: z.string().optional(),
    postId: z.string().optional(),
    topicId: z.string().optional(),
    researchId: z.string().optional(),
    dayOfWeek: z.number().optional(),
    funnelStage: z.string().optional(),
    selectedVariant: z.string().optional(),
    visualFormat: z.string().optional(),
  }),
  // Previous messages for context (last 10 max for token efficiency)
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .max(10)
    .default([]),
  // Session ID for persistence
  sessionId: z.string().uuid().optional(),
})

export type ChatInput = z.infer<typeof chatInputSchema>
