import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  // AI keys are now optional — users bring their own via BYOK
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  // Required for encrypting user API keys at rest (32 bytes = 64 hex chars)
  API_KEY_ENCRYPTION_SECRET: z.string().length(64, 'Must be 64 hex characters (32 bytes)'),
})

function validateEnv() {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('Invalid environment variables:')
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`)
    }
    throw new Error('Missing or invalid environment variables. Check .env.example for required keys.')
  }

  return parsed.data
}

export const env = validateEnv()
