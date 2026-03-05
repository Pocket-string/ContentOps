export default function TopicNewLoading() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Derivar Tema desde Research</h1>
      <div className="rounded-xl border border-border bg-surface p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-50 animate-pulse">
          <svg
            className="w-6 h-6 text-accent-600 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">Derivando tema con IA...</p>
        <p className="text-xs text-foreground-muted">
          Analizando hallazgos relevantes y mapeando campos inteligentemente
        </p>
      </div>
    </div>
  )
}
