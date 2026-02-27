import type { ReactNode } from 'react'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getWorkspaceId } from '@/lib/workspace'
import { hasRequiredApiKeys } from '@/features/settings/services/api-key-service'

export const metadata = {
  title: 'Configuracion | ContentOps',
}

interface SettingsCard {
  title: string
  description: string
  href: string
  icon: ReactNode
  badge?: ReactNode
}

function BrandIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    </svg>
  )
}

function ApiKeyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  )
}

export default async function SettingsPage() {
  await requireAuth()
  const workspaceId = await getWorkspaceId()
  const hasKeys = await hasRequiredApiKeys(workspaceId)

  const cards: SettingsCard[] = [
    {
      title: 'Perfil de Marca',
      description: 'Colores, tipografia, tono y reglas visuales para la generacion de contenido.',
      href: '/settings/brand',
      icon: <BrandIcon />,
    },
    {
      title: 'API Keys',
      description: 'Configura tus claves de acceso para los modelos de IA.',
      href: '/settings/api-keys',
      icon: <ApiKeyIcon />,
      badge: !hasKeys ? (
        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-warning-100 text-warning-700">
          Requerido
        </span>
      ) : undefined,
    },
  ]

  const visibleCards = cards

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Configuracion</h1>
        <p className="text-foreground-secondary mt-1">
          Administra las preferencias y configuraciones de tu workspace.
        </p>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        role="list"
        aria-label="Opciones de configuracion"
      >
        {visibleCards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="group block"
            role="listitem"
          >
            <div className="bg-surface border border-border-light shadow-card rounded-2xl p-6 hover:shadow-card-hover transition-shadow h-full">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500 shrink-0"
                  aria-hidden="true"
                >
                  {card.icon}
                </div>
                {card.badge && <div>{card.badge}</div>}
              </div>

              <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                {card.title}
              </h2>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                {card.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
