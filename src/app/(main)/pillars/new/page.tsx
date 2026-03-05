import { PillarNewClient } from './client'

export const metadata = { title: 'Nuevo Pilar | ContentOps' }

export default function NewPillarPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Nuevo Pilar de Contenido</h1>
      <PillarNewClient />
    </div>
  )
}
