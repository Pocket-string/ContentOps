const features = [
  {
    title: 'Investigacion con IA',
    description:
      'Busqueda grounded con Google para descubrir tendencias, datos y oportunidades de contenido en tu sector.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.75" />
        <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M10 7v3M10 13h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: '3 Variantes de Copy',
    description:
      'Genera automaticamente variantes Contrarian, Narrativa y Dato de Shock para cada post.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
        <rect x="3" y="9" width="12" height="2" rx="1" fill="currentColor" opacity="0.5" />
        <rect x="3" y="13" width="14" height="2" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="3" y="17" width="9" height="2" rx="1" fill="currentColor" opacity="0.3" />
        <path d="M18 13l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Evaluacion D/G/P/I',
    description:
      'Rubrica automatizada que evalua Detener, Ganar, Provocar e Iniciar en cada variante.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="2" y="14" width="4" height="6" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="9" y="9" width="4" height="11" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="16" y="4" width="4" height="16" rx="1" fill="currentColor" opacity="0.9" />
        <path d="M3 8L9 5L14 7L20 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Campanas Semanales',
    description:
      'Planifica campanas TOFU/MOFU/BOFU con temas, keywords y brief semanal generado con IA.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="2" y="5" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M7 2v4M15 2v4M2 10h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <rect x="6" y="13" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.6" />
        <rect x="13" y="13" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    title: 'Generacion Visual',
    description:
      'Imagenes y carruseles generados con IA, alineados con tu marca y el contenido de cada post.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="2" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="7.5" cy="9" r="1.5" fill="currentColor" opacity="0.5" />
        <path d="M2 14l5-5 4 4 3-3 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Chat Orquestador',
    description:
      'Asistente de IA contextual en cada pantalla para guiarte en todo el proceso de creacion.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M4 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7l-4 3V6a2 2 0 0 1 2-2z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8 9h6M8 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function Features() {
  return (
    <section id="features" className="bg-white py-20" aria-labelledby="features-heading">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2
            id="features-heading"
            className="font-heading text-display-sm text-foreground"
          >
            Todo lo que necesitas para{' '}
            <span className="text-gradient-linkedin">LinkedIn B2B</span>
          </h2>
          <p className="text-body-lg text-foreground-secondary mt-4">
            Un pipeline completo de operaciones de contenido, desde la investigacion
            hasta la publicacion, impulsado por inteligencia artificial.
          </p>
        </div>

        {/* Feature grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12"
          role="list"
          aria-label="Lista de funcionalidades"
        >
          {features.map((feature) => (
            <article
              key={feature.title}
              role="listitem"
              className="bg-surface border border-border rounded-2xl p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
            >
              {/* Icon */}
              <div
                className="w-12 h-12 bg-primary-50 text-primary-500 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors duration-200"
                aria-hidden="true"
              >
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="font-heading font-semibold text-lg text-foreground mt-4">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-foreground-secondary text-sm mt-2 leading-relaxed">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
