import Link from 'next/link'

export function CTASection() {
  return (
    <section
      className="gradient-primary py-20"
      aria-labelledby="cta-heading"
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-center">
        <div className="card-glass max-w-2xl w-full rounded-2xl p-10 text-center shadow-glass-lg">
          {/* Icon */}
          <div
            className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-card"
            aria-hidden="true"
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 3L3 9v10l11 6 11-6V9L14 3z"
                stroke="white"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 3v22M3 9l11 6 11-6"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
              />
            </svg>
          </div>

          {/* Headline */}
          <h2
            id="cta-heading"
            className="font-heading text-display-sm text-foreground"
          >
            Listo para sistematizar
            <br />
            tu contenido?
          </h2>

          {/* Subtitle */}
          <p className="text-foreground-secondary text-body-md mt-4 max-w-md mx-auto">
            Configura tus API keys y comienza a generar contenido de alto impacto para
            tu audiencia B2B en LinkedIn.
          </p>

          {/* Primary CTA */}
          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-primary-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-primary-600 shadow-card hover:shadow-elevated transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Crear Cuenta Gratis
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {/* Secondary login link */}
          <p className="mt-5 text-sm text-foreground-muted">
            Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="text-primary-500 hover:text-primary-600 font-medium underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
            >
              Inicia sesion
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
