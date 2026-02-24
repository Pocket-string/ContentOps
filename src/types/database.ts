// ============================================
// TIPOS DEL DOMINIO - LinkedIn ContentOps
// ============================================

export type UserRole = 'admin' | 'editor' | 'collaborator'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

// Permisos por Rol
export const ROLE_PERMISSIONS = {
  admin: {
    canManageWorkspace: true,
    canPublish: true,
    canApprove: true,
    canEdit: true,
    canView: true,
  },
  editor: {
    canManageWorkspace: false,
    canPublish: false,
    canApprove: true,
    canEdit: true,
    canView: true,
  },
  collaborator: {
    canManageWorkspace: false,
    canPublish: false,
    canApprove: false,
    canEdit: true,
    canView: true,
  },
} as const

export type Permission = keyof typeof ROLE_PERMISSIONS.admin

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role][permission]
}
