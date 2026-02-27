import { Sidebar } from './sidebar'
import type { UserRole } from '@/types/database'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: UserRole
  userName: string
}

export function DashboardLayout({ children, userRole, userName }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={userRole} userName={userName} />
      <main className="ml-64">
        {children}
      </main>
    </div>
  )
}
