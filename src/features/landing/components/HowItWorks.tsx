const steps = [
  {
    number: 1,
    title: 'Research',
    description: 'Investiga tendencias con busqueda grounded en tiempo real',
    color: 'bg-primary-500',
    lightColor: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
  {
    number: 2,
    title: 'Topics',
    description: 'Define temas con senales, hipotesis y contexto de negocio',
    color: 'bg-primary-500',
    lightColor: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
  {
    number: 3,
    title: 'Campaigns',
    description: 'Planifica la semana con brief automatico y keywords',
    color: 'bg-primary-500',
    lightColor: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
  {
    number: 4,
    title: 'Posts',
    description: 'Genera y evalua 3 variantes de copy con puntuacion D/G/P/I',
    color: 'bg-primary-500',
    lightColor: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
  {
    number: 5,
    title: 'Visuals',
    description: 'Crea imagenes y carruseles de marca con un solo clic',
    color: 'bg-primary-500',
    lightColor: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
  {
    number: 6,
    title: 'Export',
    description: 'Descarga el pack completo listo para publicar en LinkedIn',
    color: 'bg-primary-500',
    lightColor: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-[#F3F2EF] py-20"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2
            id="how-it-works-heading"
            className="font-heading text-display-sm text-foreground"
          >
            De la idea al post en{' '}
            <span className="text-gradient-linkedin">6 pasos</span>
          </h2>
          <p className="text-body-lg text-foreground-secondary mt-4">
            Un flujo estructurado y repetible que convierte cualquier idea en contenido
            B2B de alto impacto para LinkedIn.
          </p>
        </div>

        {/* Steps — desktop: horizontal flow, mobile: vertical list */}
        <div
          className="mt-14"
          role="list"
          aria-label="Pasos del pipeline de contenido"
        >
          {/* Desktop horizontal layout */}
          <div className="hidden lg:flex items-start gap-0">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="flex-1 flex flex-col items-center relative"
                role="listitem"
              >
                {/* Connector line (between steps) */}
                {index < steps.length - 1 && (
                  <div
                    className="absolute top-5 left-1/2 w-full h-0.5 bg-primary-200"
                    style={{ left: '50%' }}
                    aria-hidden="true"
                  />
                )}

                {/* Number circle */}
                <div
                  className="relative z-10 w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-base shadow-card flex-shrink-0"
                  aria-hidden="true"
                >
                  {step.number}
                </div>

                {/* Text */}
                <div className="mt-4 text-center px-2">
                  <h3 className="font-heading font-semibold text-base text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-xs text-foreground-secondary mt-1.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile vertical layout */}
          <div className="lg:hidden space-y-0">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="flex gap-4"
                role="listitem"
              >
                {/* Left column: circle + connector */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-base shadow-card z-10"
                    aria-hidden="true"
                  >
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className="w-0.5 h-full min-h-[2.5rem] bg-primary-200 my-1"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Right column: content */}
                <div className="pb-8 pt-1 flex-1">
                  <h3 className="font-heading font-semibold text-base text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-foreground-secondary mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom summary card */}
        <div className="mt-14 card-glass rounded-2xl p-8 text-center shadow-glass">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
            <div>
              <div className="font-heading font-bold text-display-xs text-primary-600">6 etapas</div>
              <div className="text-sm text-foreground-secondary mt-1">pipeline completo</div>
            </div>
            <div className="w-px h-10 bg-border hidden sm:block" aria-hidden="true" />
            <div>
              <div className="font-heading font-bold text-display-xs text-primary-600">3 variantes</div>
              <div className="text-sm text-foreground-secondary mt-1">por cada post</div>
            </div>
            <div className="w-px h-10 bg-border hidden sm:block" aria-hidden="true" />
            <div>
              <div className="font-heading font-bold text-display-xs text-primary-600">D/G/P/I</div>
              <div className="text-sm text-foreground-secondary mt-1">evaluacion por rubrica</div>
            </div>
            <div className="w-px h-10 bg-border hidden sm:block" aria-hidden="true" />
            <div>
              <div className="font-heading font-bold text-display-xs text-primary-600">Export</div>
              <div className="text-sm text-foreground-secondary mt-1">pack listo para publicar</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
