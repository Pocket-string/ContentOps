'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  saveApiKeyAction,
  deleteApiKeyAction,
  testApiKeyAction,
} from '@/features/settings/actions/api-key-actions'
import type { ApiKeyInfo, ApiKeyProvider } from '@/features/settings/services/api-key-service'

interface Props {
  keyInfo: Array<{
    id: string
    provider: 'google' | 'openai' | 'openrouter'
    keyHint: string
    isValid: boolean
    lastUsedAt: string | null
    updatedAt: string
  }>
}

interface ProviderConfig {
  provider: ApiKeyProvider
  label: string
  badge: 'required' | 'optional'
  description: string
  linkLabel: string
  linkUrl: string
}

const PROVIDERS: ProviderConfig[] = [
  {
    provider: 'google',
    label: 'Google AI',
    badge: 'required',
    description: 'Gemini 2.5 Flash — Generacion de copy, visuals, chat, research',
    linkLabel: 'Obtener key en Google AI Studio',
    linkUrl: 'https://aistudio.google.com/apikey',
  },
  {
    provider: 'openai',
    label: 'OpenAI',
    badge: 'optional',
    description: 'GPT-4o-mini — Reviewer de copy y visual JSON',
    linkLabel: 'Obtener key en OpenAI',
    linkUrl: 'https://platform.openai.com/api-keys',
  },
  {
    provider: 'openrouter',
    label: 'OpenRouter',
    badge: 'optional',
    description: 'Fallback cuando Gemini no esta disponible',
    linkLabel: 'Obtener key en OpenRouter',
    linkUrl: 'https://openrouter.ai/keys',
  },
]

interface CardState {
  inputValue: string
  isSaving: boolean
  isTesting: boolean
  isDeleting: boolean
  testResult: { valid: boolean; message: string } | null
  saveError: string | null
  deleteError: string | null
}

function createInitialCardState(): CardState {
  return {
    inputValue: '',
    isSaving: false,
    isTesting: false,
    isDeleting: false,
    testResult: null,
    saveError: null,
    deleteError: null,
  }
}

export function ApiKeyManager({ keyInfo }: Props) {
  const router = useRouter()

  const [states, setStates] = useState<Record<ApiKeyProvider, CardState>>({
    google: createInitialCardState(),
    openai: createInitialCardState(),
    openrouter: createInitialCardState(),
  })

  const [confirmDelete, setConfirmDelete] = useState<ApiKeyProvider | null>(null)

  const updateState = (provider: ApiKeyProvider, patch: Partial<CardState>) => {
    setStates((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], ...patch },
    }))
  }

  const getKeyInfo = (provider: ApiKeyProvider): ApiKeyInfo | undefined =>
    keyInfo.find((k) => k.provider === provider)

  const handleTest = async (provider: ApiKeyProvider) => {
    const apiKey = states[provider].inputValue.trim()
    if (!apiKey) return

    updateState(provider, { isTesting: true, testResult: null, saveError: null })
    const result = await testApiKeyAction({ provider, apiKey })
    updateState(provider, {
      isTesting: false,
      testResult: result.error
        ? { valid: false, message: result.error }
        : (result.data ?? null),
    })
  }

  const handleSave = async (provider: ApiKeyProvider) => {
    const apiKey = states[provider].inputValue.trim()
    if (!apiKey) return

    updateState(provider, { isSaving: true, saveError: null, testResult: null })
    const result = await saveApiKeyAction({ provider, apiKey })
    updateState(provider, {
      isSaving: false,
      saveError: result.error ?? null,
      inputValue: result.error ? states[provider].inputValue : '',
    })

    if (!result.error) {
      router.refresh()
    }
  }

  const handleDeleteConfirm = async (provider: ApiKeyProvider) => {
    updateState(provider, { isDeleting: true, deleteError: null })
    const result = await deleteApiKeyAction({ provider })
    updateState(provider, {
      isDeleting: false,
      deleteError: result.error ?? null,
    })
    setConfirmDelete(null)

    if (!result.error) {
      router.refresh()
    }
  }

  return (
    <div className="space-y-4" role="list" aria-label="Proveedores de API">
      {PROVIDERS.map((config) => {
        const info = getKeyInfo(config.provider)
        const state = states[config.provider]
        const isConfirmingDelete = confirmDelete === config.provider

        return (
          <article
            key={config.provider}
            role="listitem"
            className="bg-surface border border-border rounded-2xl shadow-card overflow-hidden"
          >
            {/* Card header */}
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <h2 className="font-heading font-semibold text-base text-foreground">
                    {config.label}
                  </h2>
                  <span
                    className={`inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      config.badge === 'required'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {config.badge === 'required' ? 'Requerido' : 'Opcional'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{config.description}</p>
                <a
                  href={config.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded"
                  aria-label={`${config.linkLabel} (abre en nueva ventana)`}
                >
                  {config.linkLabel}
                  <ExternalLinkIcon className="w-3 h-3" />
                </a>
              </div>

              {/* Status badge */}
              <div className="flex-shrink-0 pt-0.5">
                <StatusBadge info={info} />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Card body: input + actions */}
            <div className="px-6 py-4 space-y-3">
              {/* Key hint when configured */}
              {info && (
                <p className="text-xs text-muted-foreground">
                  Key actual:{' '}
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                    ...{info.keyHint}
                  </span>
                  {info.lastUsedAt && (
                    <span className="ml-2">
                      — Ultimo uso: {formatDate(info.lastUsedAt)}
                    </span>
                  )}
                </p>
              )}

              {/* Input row */}
              <div className="flex gap-2">
                <label className="sr-only" htmlFor={`key-input-${config.provider}`}>
                  {config.label} API Key
                </label>
                <input
                  id={`key-input-${config.provider}`}
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  value={state.inputValue}
                  onChange={(e) => updateState(config.provider, { inputValue: e.target.value, testResult: null, saveError: null })}
                  placeholder={info ? 'Nueva key (dejar vacio para mantener la actual)' : 'Pega tu API key aqui...'}
                  className="flex-1 text-sm bg-background border border-border rounded-xl px-4 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:font-sans placeholder:text-muted-foreground"
                  aria-describedby={
                    state.testResult
                      ? `test-result-${config.provider}`
                      : state.saveError
                        ? `save-error-${config.provider}`
                        : undefined
                  }
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleTest(config.provider)}
                  disabled={!state.inputValue.trim() || state.isTesting || state.isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-label={`Probar key de ${config.label}`}
                >
                  {state.isTesting ? (
                    <>
                      <SpinnerIcon className="w-4 h-4 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      Probar
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSave(config.provider)}
                  disabled={!state.inputValue.trim() || state.isSaving || state.isTesting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-label={`Guardar key de ${config.label}`}
                >
                  {state.isSaving ? (
                    <>
                      <SpinnerIcon className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="w-4 h-4" />
                      Guardar
                    </>
                  )}
                </button>

                {info && !isConfirmingDelete && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(config.provider)}
                    disabled={state.isDeleting || state.isSaving || state.isTesting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-400/40 ml-auto"
                    aria-label={`Eliminar key de ${config.label}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                    Eliminar
                  </button>
                )}

                {isConfirmingDelete && (
                  <div
                    className="ml-auto flex items-center gap-2"
                    role="group"
                    aria-label="Confirmar eliminacion"
                  >
                    <span className="text-xs text-red-600 font-medium">
                      Confirmar eliminacion?
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteConfirm(config.provider)}
                      disabled={state.isDeleting}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-400/40"
                    >
                      {state.isDeleting ? (
                        <SpinnerIcon className="w-3 h-3 animate-spin" />
                      ) : null}
                      {state.isDeleting ? 'Eliminando...' : 'Si, eliminar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {/* Feedback messages */}
              {state.testResult && (
                <div
                  id={`test-result-${config.provider}`}
                  role="status"
                  aria-live="polite"
                  className={`flex items-start gap-2 text-sm px-3 py-2.5 rounded-xl ${
                    state.testResult.valid
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {state.testResult.valid ? (
                    <CheckCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{state.testResult.message}</span>
                </div>
              )}

              {state.saveError && (
                <div
                  id={`save-error-${config.provider}`}
                  role="alert"
                  className="flex items-start gap-2 text-sm px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700"
                >
                  <AlertIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{state.saveError}</span>
                </div>
              )}

              {state.deleteError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 text-sm px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700"
                >
                  <AlertIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{state.deleteError}</span>
                </div>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

// -------------------------
// Sub-components
// -------------------------

function StatusBadge({ info }: { info: ApiKeyInfo | undefined }) {
  if (!info) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" aria-hidden="true" />
        No configurada
      </span>
    )
  }

  if (!info.isValid) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200"
        aria-label="Key configurada pero con error"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true" />
        Error
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200"
      aria-label={`Key configurada: ...${info.keyHint}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
      Configurada
    </span>
  )
}

function formatDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(isoString))
  } catch {
    return isoString
  }
}

// -------------------------
// Inline SVG icons
// -------------------------

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
