'use client'

import { useState } from 'react'
import { updateMemberRoleAction } from '@/features/admin/actions/admin-actions'

export interface Member {
  user_id: string
  email: string
  role: string
  joined_at: string
  last_sign_in_at: string | null
  has_api_keys: boolean
}

interface AdminPanelProps {
  members: Member[]
  workspaceId: string
}

type AppRole = 'admin' | 'editor' | 'collaborator'

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  collaborator: 'Colaborador',
}

function formatJoinedDate(isoString: string): string {
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
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
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

export function AdminPanel({ members, workspaceId: _workspaceId }: AdminPanelProps) {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalMembers = members.length
  const adminCount = members.filter((m) => m.role === 'admin').length
  const editorCount = members.filter((m) => m.role === 'editor').length
  const collaboratorCount = members.filter((m) => m.role === 'collaborator').length

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingUserId(userId)
    setErrors((prev) => ({ ...prev, [userId]: '' }))

    const result = await updateMemberRoleAction({ userId, newRole })

    setLoadingUserId(null)

    if (result.error) {
      setErrors((prev) => ({ ...prev, [userId]: result.error ?? 'Error desconocido' }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="list" aria-label="Estadisticas del workspace">
        <StatCard label="Total miembros" value={totalMembers} />
        <StatCard label="Admins" value={adminCount} />
        <StatCard label="Editores" value={editorCount} />
        <StatCard label="Colaboradores" value={collaboratorCount} />
      </div>

      {/* Members table */}
      <div className="bg-surface border border-border-light rounded-2xl overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-border-light">
          <h2 className="font-heading font-semibold text-base text-foreground">Miembros del Workspace</h2>
          <p className="text-sm text-foreground-secondary mt-0.5">
            Gestiona roles y permisos de los usuarios.
          </p>
        </div>

        {members.length === 0 ? (
          <div className="px-6 py-12 text-center text-foreground-muted text-sm">
            No hay miembros en este workspace.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Lista de miembros">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left px-6 py-3 text-xs uppercase text-foreground-muted tracking-wider font-semibold">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs uppercase text-foreground-muted tracking-wider font-semibold">
                    Rol
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
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const isLoading = loadingUserId === member.user_id
                  const rowError = errors[member.user_id]

                  return (
                    <tr
                      key={member.user_id}
                      className="border-b border-border-light last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {/* Email */}
                      <td className="px-6 py-4 text-foreground font-medium truncate max-w-[220px]">
                        {member.email}
                      </td>

                      {/* Role selector */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                            disabled={isLoading}
                            aria-label={`Cambiar rol de ${member.email}`}
                            className="bg-surface border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {(Object.keys(ROLE_LABELS) as AppRole[]).map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                          {isLoading && (
                            <span className="text-xs text-foreground-muted flex items-center gap-1" aria-live="polite">
                              <SpinnerIcon className="w-3 h-3 animate-spin" />
                              Guardando...
                            </span>
                          )}
                          {rowError && (
                            <span
                              className="text-xs text-red-600"
                              role="alert"
                              aria-live="assertive"
                            >
                              {rowError}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Joined date */}
                      <td className="px-6 py-4 text-foreground-secondary whitespace-nowrap">
                        {formatJoinedDate(member.joined_at)}
                      </td>

                      {/* Last login */}
                      <td className="px-6 py-4 text-foreground-secondary whitespace-nowrap">
                        {formatLastLogin(member.last_sign_in_at)}
                      </td>

                      {/* API Keys status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              member.has_api_keys ? 'bg-success-500' : 'bg-foreground-muted/30'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="text-foreground-secondary text-xs">
                            {member.has_api_keys ? 'Configuradas' : 'Sin configurar'}
                          </span>
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
