'use client'

import { useState } from 'react'
import { togglePlatformAdminAction } from '@/features/admin/actions/admin-actions'

export interface PlatformUser {
  user_id: string
  email: string
  workspace_name: string
  role: string
  joined_at: string
  last_sign_in_at: string | null
  has_api_keys: boolean
  is_platform_admin: boolean
}

interface AdminPanelProps {
  users: PlatformUser[]
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

function formatLastLogin(isoString: string | null): string {
  if (!isoString) return 'Nunca'
  try {
    const date = new Date(isoString)
    const diffMs = Date.now() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} dias`
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`

    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return isoString
  }
}

export function AdminPanel({ users }: AdminPanelProps) {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalUsers = users.length
  const platformAdminCount = users.filter((u) => u.is_platform_admin).length
  const withApiKeysCount = users.filter((u) => u.has_api_keys).length

  const handleToggleAdmin = async (userId: string) => {
    setLoadingUserId(userId)
    setErrors((prev) => ({ ...prev, [userId]: '' }))

    const result = await togglePlatformAdminAction({ targetUserId: userId })

    setLoadingUserId(null)

    if (result.error) {
      setErrors((prev) => ({ ...prev, [userId]: result.error ?? 'Error desconocido' }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4" role="list" aria-label="Estadisticas de la plataforma">
        <StatCard label="Total usuarios" value={totalUsers} />
        <StatCard label="Admins plataforma" value={platformAdminCount} />
        <StatCard label="Con API Keys" value={withApiKeysCount} />
      </div>

      {/* Users table */}
      <div className="bg-surface border border-border-light rounded-2xl overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-border-light">
          <h2 className="font-heading font-semibold text-base text-foreground">
            Usuarios de la Plataforma
          </h2>
          <p className="text-sm text-foreground-secondary mt-0.5">
            Todos los usuarios registrados en ContentOps.
          </p>
        </div>

        {users.length === 0 ? (
          <div className="px-6 py-12 text-center text-foreground-muted text-sm">
            No hay usuarios registrados en la plataforma.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Lista de usuarios de la plataforma">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left px-6 py-3 text-xs uppercase text-foreground-muted tracking-wider font-semibold">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs uppercase text-foreground-muted tracking-wider font-semibold">
                    Workspace
                  </th>
                  <th className="text-left px-6 py-3 text-xs uppercase text-foreground-muted tracking-wider font-semibold">
                    Se unio
                  </th>
                  <th className="text-left px-6 py-3 text-xs uppercase text-foreground-muted tracking-wider font-semibold">
                    Ultimo acceso
                  </th>
                  <th className="text-left px-6 py-3 text-xs uppercase text-foreground-muted tracking-wider font-semibold">
                    API Keys
                  </th>
                  <th className="text-left px-6 py-3 text-xs uppercase text-foreground-muted tracking-wider font-semibold">
                    Admin plataforma
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isLoading = loadingUserId === user.user_id
                  const rowError = errors[user.user_id]

                  return (
                    <tr
                      key={user.user_id}
                      className="border-b border-border-light last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {/* Email + admin badge */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium truncate max-w-[200px]">
                            {user.email}
                          </span>
                          {user.is_platform_admin && (
                            <span
                              className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 shrink-0"
                              aria-label="Admin de plataforma"
                            >
                              Admin
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Workspace name */}
                      <td className="px-6 py-4 text-foreground-secondary truncate max-w-[160px]">
                        {user.workspace_name}
                      </td>

                      {/* Joined date */}
                      <td className="px-6 py-4 text-foreground-secondary whitespace-nowrap">
                        {formatDate(user.joined_at)}
                      </td>

                      {/* Last login */}
                      <td className="px-6 py-4 text-foreground-secondary whitespace-nowrap">
                        {formatLastLogin(user.last_sign_in_at)}
                      </td>

                      {/* API Keys status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              user.has_api_keys ? 'bg-success-500' : 'bg-foreground-muted/30'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="text-foreground-secondary text-xs">
                            {user.has_api_keys ? 'Configuradas' : 'Sin configurar'}
                          </span>
                        </div>
                      </td>

                      {/* Toggle platform admin */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleAdmin(user.user_id)}
                            disabled={isLoading}
                            aria-label={
                              user.is_platform_admin
                                ? `Revocar admin de plataforma a ${user.email}`
                                : `Dar admin de plataforma a ${user.email}`
                            }
                            className={`
                              relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/40
                              disabled:opacity-50 disabled:cursor-not-allowed
                              ${user.is_platform_admin ? 'bg-primary-500' : 'bg-foreground-muted/30'}
                            `}
                          >
                            <span
                              aria-hidden="true"
                              className={`
                                pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0
                                transition duration-200 ease-in-out
                                ${user.is_platform_admin ? 'translate-x-4' : 'translate-x-0'}
                              `}
                            />
                          </button>
                          {isLoading && (
                            <span className="text-xs text-foreground-muted flex items-center gap-1" aria-live="polite">
                              <SpinnerIcon className="w-3 h-3 animate-spin" />
                              Guardando...
                            </span>
                          )}
                          {rowError && (
                            <span
                              className="text-xs text-red-600 max-w-[140px]"
                              role="alert"
                              aria-live="assertive"
                            >
                              {rowError}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// -------------------------
// Sub-components
// -------------------------

interface StatCardProps {
  label: string
  value: number
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div
      role="listitem"
      className="bg-surface border border-border-light rounded-2xl p-4"
    >
      <p className="text-xs uppercase text-foreground-muted tracking-wider font-semibold mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold font-heading text-foreground">{value}</p>
    </div>
  )
}

// -------------------------
// Inline SVG icons
// -------------------------

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
