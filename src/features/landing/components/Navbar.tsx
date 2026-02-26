'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on route/scroll
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
          scrolled ? 'glass-header shadow-card' : 'bg-transparent'
        }`}
        role="banner"
      >
        <nav
          className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between"
          aria-label="Navegacion principal"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
            aria-label="ContentOps - Inicio"
          >
            <span className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-600 transition-colors">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <rect x="1" y="7" width="4" height="10" rx="1" fill="white" />
                <rect x="7" y="4" width="4" height="13" rx="1" fill="white" opacity="0.85" />
                <rect x="13" y="1" width="4" height="16" rx="1" fill="white" opacity="0.7" />
              </svg>
            </span>
            <span className="font-heading font-semibold text-lg text-foreground leading-none">
              ContentOps
            </span>
          </Link>

          {/* Desktop center links */}
          <div className="hidden md:flex items-center gap-1" role="list">
            <a
              href="#features"
              className="px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-white/60 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Funcionalidades
            </a>
            <a
              href="#how-it-works"
              className="px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-white/60 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Como Funciona
            </a>
          </div>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
            >
              Iniciar Sesion
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-all duration-200 shadow-card hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Empezar Gratis
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-white/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu'}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 6H17M3 10H17M3 14H17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile menu panel */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-label="Menu de navegacion"
        aria-modal="true"
        className={`fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-modal md:hidden transform transition-transform duration-300 ease-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 h-16 border-b border-border-light">
            <span className="font-heading font-semibold text-lg text-foreground">Menu</span>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Cerrar menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3 3L15 15M15 3L3 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col gap-1 p-4 flex-1" aria-label="Menu movil">
            <a
              href="#features"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Funcionalidades
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Como Funciona
            </a>
          </nav>

          <div className="flex flex-col gap-3 p-6 border-t border-border-light">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="w-full px-5 py-3 text-sm font-medium text-center text-foreground border border-border rounded-xl hover:bg-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Iniciar Sesion
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="w-full px-5 py-3 text-sm font-semibold text-center text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-all shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Empezar Gratis
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
