'use client'

import { useState } from 'react'
import Link from 'next/link'

export function ApiKeysBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="bg-warning-50 border border-warning-500/20 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
      <svg className="w-5 h-5 text-warning-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium text-warning-800">
          Configura tu API Key para activar funciones de IA
        </p>
        <p className="text-xs text-warning-600 mt-1">
          Las funciones de investigacion, generacion de copy y analisis requieren una API key de Google AI (Gemini).
        </p>
        <Link
          href="/settings/api-keys"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600 hover:underline mt-2"
        >
          Configurar API Keys &rarr;
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-warning-400 hover:text-warning-600 p-1"
        aria-label="Cerrar aviso"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
