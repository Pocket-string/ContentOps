interface ResearchTemplateParams {
  tema: string
  buyerPersona?: string
  region?: string
}

export function buildResearchPromptTemplate(params: ResearchTemplateParams): string {
  const { tema, buyerPersona, region } = params

  return `# PROMPT DE INVESTIGACION (Perplexity Pro)
## Sector: O&M Fotovoltaico — Bitalize

---

## CONTEXTO
Necesito una investigacion profunda sobre un tema del sector de operacion y mantenimiento de plantas solares fotovoltaicas (O&M FV). Los resultados se usaran para crear contenido de LinkedIn que siga la metodologia D/G/P/I.

## TEMA A INVESTIGAR
${tema}

${buyerPersona ? `## PERFIL OBJETIVO\n${buyerPersona} — profesional del sector fotovoltaico` : ''}
${region ? `## REGION DE INTERES\n${region}` : ''}

---

## QUE NECESITO

### 1. Hallazgos Clave (3-10)
Para cada hallazgo incluye:
- **Dato o hecho especifico** (numeros, porcentajes, nombres de empresas)
- **Relevancia** para profesionales de O&M fotovoltaico
- **Fuente** (nombre del informe, empresa, medio)

### 2. Topics Sugeridos para LinkedIn (3-8)
Para cada topic sugerido:
- **Titulo del post**: Debe detener el scroll (metodologia D/G/P/I — Detener, Ganar, Provocar, Iniciar)
- **Angulo narrativo**: contrarian / story / data-driven / how-to / prediction
- **Idea de hook**: Primera linea especifica con datos

### 3. Contexto de Mercado
Resumen de 2-3 parrafos sobre el estado actual del mercado relacionado con el tema.

---

## FORMATO DE RESPUESTA

Organiza la respuesta con estas secciones:
1. **Resumen ejecutivo** (2-3 lineas)
2. **Hallazgos clave** (lista numerada con datos especificos)
3. **Topics sugeridos para LinkedIn** (lista con titulo + angulo + hook)
4. **Contexto de mercado** (parrafos cortos)
5. **Fuentes consultadas** (lista de URLs o nombres de informes)

## PRIORIDADES
- Datos cuantitativos sobre opiniones
- Informacion reciente (ultimo ano) sobre informacion historica
- Relevancia para el buyer persona del sector O&M fotovoltaico
- Insights accionables para contenido de LinkedIn`
}
