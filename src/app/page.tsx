import { LandingPage } from '@/features/landing/components'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ContentOps | Operaciones de Contenido LinkedIn con IA',
  description:
    'Sistematiza tu contenido LinkedIn: investiga, planifica, crea y publica contenido B2B de alto impacto con inteligencia artificial.',
}

export default function Home() {
  return <LandingPage />
}
