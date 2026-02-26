import Link from 'next/link'

export function Hero() {
  return (
    <section
      className="bg-[#F3F2EF] pt-32 pb-20 overflow-hidden"
      aria-label="Seccion principal"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left column — text */}
          <div className="flex-1 max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span
                className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"
                aria-hidden="true"
              />
              Operaciones de contenido con IA
            </div>

            {/* Headline */}
            <h1 className="font-heading text-display-lg lg:text-display-xl text-foreground leading-tight">
              Sistematiza tu contenido{' '}
              <span className="text-gradient-linkedin">LinkedIn</span>{' '}
              con inteligencia artificial
            </h1>

            {/* Subtitle */}
            <p className="text-body-lg text-foreground-secondary max-w-xl mt-6 leading-relaxed">
              De la investigacion al post publicado. ContentOps automatiza tu pipeline de
              contenido B2B con IA, evaluacion D/G/P/I y export listo para LinkedIn.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-primary-500 text-white px-8 py-3.5 rounded-xl font-semibold shadow-card hover:bg-primary-600 hover:shadow-elevated transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                Empezar Gratis
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 border-2 border-primary-500 text-primary-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-primary-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                Ver como funciona
              </a>
            </div>

            {/* Social proof hint */}
            <p className="mt-6 text-sm text-foreground-muted">
              Pipeline completo: Research → Topics → Campaigns → Posts → Visuals → Export
            </p>
          </div>

          {/* Right column — mock dashboard visual */}
          <div className="hidden lg:flex flex-1 justify-center items-center">
            <div className="relative w-full max-w-md">
              {/* Decorative background blobs */}
              <div
                className="absolute -top-8 -right-8 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-60"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-8 -left-8 w-48 h-48 bg-secondary-100 rounded-full blur-3xl opacity-50"
                aria-hidden="true"
              />

              {/* Main glass card */}
              <div
                className="relative card-glass p-6 rounded-2xl shadow-glass-lg"
                role="img"
                aria-label="Vista previa del dashboard de ContentOps"
              >
                {/* Mini header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary-500 rounded-md flex items-center justify-center" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <rect x="0.5" y="5" width="3" height="6.5" rx="0.5" fill="white" />
                        <rect x="4.5" y="3" width="3" height="8.5" rx="0.5" fill="white" opacity="0.85" />
                        <rect x="8.5" y="0.5" width="3" height="11" rx="0.5" fill="white" opacity="0.7" />
                      </svg>
                    </div>
                    <span className="font-heading font-semibold text-sm text-foreground">Pipeline Activo</span>
                  </div>
                  <span className="text-xs bg-success-100 text-success-700 px-2.5 py-1 rounded-full font-medium">
                    En curso
                  </span>
                </div>

                {/* Stat cards row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-primary-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-heading font-bold text-primary-600">3</div>
                    <div className="text-xs text-primary-500 font-medium mt-0.5">Variantes</div>
                  </div>
                  <div className="bg-success-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-heading font-bold text-success-600">8.5</div>
                    <div className="text-xs text-success-600 font-medium mt-0.5">Score</div>
                  </div>
                  <div className="bg-secondary-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-heading font-bold text-secondary-600">6</div>
                    <div className="text-xs text-secondary-600 font-medium mt-0.5">Pasos</div>
                  </div>
                </div>

                {/* Mini pipeline steps */}
                <div className="space-y-2">
                  {[
                    { label: 'Research', done: true },
                    { label: 'Topics', done: true },
                    { label: 'Posts', done: false, active: true },
                    { label: 'Export', done: false },
                  ].map((step) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.done
                            ? 'bg-success-500'
                            : step.active
                            ? 'bg-primary-500'
                            : 'bg-border'
                        }`}
                        aria-hidden="true"
                      >
                        {step.done ? (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : step.active ? (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        ) : null}
                      </div>
                      <div className={`text-xs font-medium ${step.done ? 'text-foreground-secondary line-through' : step.active ? 'text-primary-600' : 'text-foreground-muted'}`}>
                        {step.label}
                      </div>
                      {step.active && (
                        <span className="ml-auto text-xs bg-primary-50 text-primary-500 px-2 py-0.5 rounded-full font-medium">
                          Activo
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom variant preview */}
                <div className="mt-5 pt-4 border-t border-white/60">
                  <div className="text-xs text-foreground-muted font-medium mb-2">Variante recomendada</div>
                  <div className="flex items-center justify-between bg-white/70 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary-500 rounded-full" aria-hidden="true" />
                      <span className="text-xs font-semibold text-foreground">Dato de Shock</span>
                    </div>
                    <div className="flex gap-1" aria-label="Scores D/G/P/I">
                      {['D', 'G', 'P', 'I'].map((letter, i) => (
                        <span
                          key={letter}
                          className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center ${
                            i < 3 ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-600'
                          }`}
                        >
                          {letter}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge top-left */}
              <div
                className="absolute -top-4 -left-4 glass rounded-xl px-3 py-2 shadow-card flex items-center gap-2"
                aria-hidden="true"
              >
                <span className="text-base">🔍</span>
                <span className="text-xs font-medium text-foreground">Research IA</span>
              </div>

              {/* Floating badge bottom-right */}
              <div
                className="absolute -bottom-4 -right-4 glass rounded-xl px-3 py-2 shadow-card flex items-center gap-2"
                aria-hidden="true"
              >
                <span className="text-base">📦</span>
                <span className="text-xs font-medium text-foreground">Export Pack</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
