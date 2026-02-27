import { Sidebar } from '@/components/layout/sidebar'
import { ChatWidget } from '@/features/orchestrator/components'
import { getProfile } from '@/lib/auth'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        userRole={profile?.role ?? 'admin'}
        userName={profile?.full_name ?? profile?.email?.split('@')[0] ?? 'Usuario'}
      />
      <main className="ml-64">
        {children}
      </main>
      <ChatWidget />
    </div>
  )
}
