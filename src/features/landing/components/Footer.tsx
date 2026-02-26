import Link from 'next/link'

const footerLinks = {
  producto: [
    { label: 'Funcionalidades', href: '#features' },
    { label: 'Como Funciona', href: '#how-it-works' },
  ],
  cuenta: [
    { label: 'Iniciar Sesion', href: '/login' },
    { label: 'Crear Cuenta', href: '/signup' },
  ],
}

export function Footer() {
  return (
    <footer
      className="bg-primary-600 text-white py-12"
      role="contentinfo"
      aria-label="Pie de pagina"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Main footer content */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          {/* Left: brand */}
          <div className="lg:flex-1 max-w-xs">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-lg"
              aria-label="ContentOps - Inicio"
            >
              <span
                className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors"
                aria-hidden="true"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="7" width="4" height="10" rx="1" fill="white" />
                  <rect x="7" y="4" width="4" height="13" rx="1" fill="white" opacity="0.85" />
                  <rect x="13" y="1" width="4" height="16" rx="1" fill="white" opacity="0.7" />
                </svg>
              </span>
              <span className="font-heading font-semibold text-lg text-white leading-none">
                ContentOps
              </span>
            </Link>
            <p className="text-white/60 text-sm mt-3 leading-relaxed">
              Operaciones de contenido LinkedIn, sistematizadas con IA. Pipeline completo
              de Research a Export para equipos B2B.
            </p>
          </div>

          {/* Right: link groups */}
          <div className="flex flex-col sm:flex-row gap-10 lg:gap-16">
            {/* Producto */}
            <nav aria-label="Producto">
              <h3 className="font-heading font-semibold text-sm text-white uppercase tracking-wider mb-4">
                Producto
              </h3>
              <ul className="space-y-2.5" role="list">
                {footerLinks.producto.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-white/60 hover:text-white text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Cuenta */}
            <nav aria-label="Cuenta">
              <h3 className="font-heading font-semibold text-sm text-white uppercase tracking-wider mb-4">
                Cuenta
              </h3>
              <ul className="space-y-2.5" role="list">
                {footerLinks.cuenta.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/60 hover:text-white text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom divider + copyright */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs">
            2026 ContentOps by Bitalize. Todos los derechos reservados.
          </p>
          <p className="text-white/30 text-xs">
            contentops.jonadata.cloud
          </p>
        </div>
      </div>
    </footer>
  )
}
