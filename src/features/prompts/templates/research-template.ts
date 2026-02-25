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
Necesito una investigacion profunda sobre un tema del sector de operacion y mantenimiento de plantas solares fotovoltaicas (O&M FV). Los resultados se usaran para crear contenido de LinkedIn que siga la metodologia D/G/P/I (Detener scroll, Ganar atencion, Provocar reaccion, Iniciar conversacion).

## TEMA A INVESTIGAR
${tema}

${buyerPersona ? `## PERFIL OBJETIVO\n${buyerPersona} — profesional del sector fotovoltaico` : ''}
${region ? `## REGION DE INTERES\n${region}` : ''}

---

## QUE NECESITO

### 1. Resumen ejecutivo
2-3 parrafos con el contexto general y los mensajes clave de la investigacion.

### 2. Conclusiones Clave (3-8)
Lista de los hallazgos mas importantes. Cada conclusion debe ser una oracion completa con datos especificos (numeros, porcentajes, nombres de empresas, fechas).

### 3. Angulos Recomendados para LinkedIn (3-6)
Para cada angulo:
- **Titulo del post**: Debe detener el scroll (metodologia D/G/P/I)
- **Tipo de angulo**: contrarian / story / data-driven / how-to / prediction
- **Hook sugerido**: Primera linea del post con datos concretos

### 4. Links de Evidencia
Lista de URLs de las fuentes consultadas (informes, articulos, estudios).

---

## FORMATO DE RESPUESTA

Organiza tu respuesta EXACTAMENTE con estas secciones y encabezados:

**RESUMEN EJECUTIVO**
(2-3 parrafos — este texto se pegara en el campo "Contenido" del research)

**CONCLUSIONES CLAVE**
1. (conclusion con datos especificos)
2. (conclusion con datos especificos)
...

**ANGULOS RECOMENDADOS**
1. **[Titulo del post]** — [tipo de angulo] — Hook: "[primera linea sugerida]"
2. **[Titulo del post]** — [tipo de angulo] — Hook: "[primera linea sugerida]"
...

**FUENTES**
- [URL 1]
- [URL 2]
...

---

## PRIORIDADES
- Datos cuantitativos sobre opiniones
- Informacion reciente (ultimo ano) sobre informacion historica
- Relevancia para ${buyerPersona ?? 'profesionales de O&M fotovoltaico'}
- Insights accionables para contenido de LinkedIn
- Fuentes verificables con URLs

## COMO USAR ESTA RESPUESTA
Al crear un Research manual en ContentOps:
- **Titulo**: "${tema}"
- **Fuente**: "Perplexity Pro Research"
- **Contenido**: Pega el RESUMEN EJECUTIVO completo
- **Conclusiones Clave**: Copia cada conclusion como item individual
- **Angulos Recomendados**: Copia cada angulo como item individual
- **Links de Evidencia**: Copia cada URL de fuente${region ? `\n- **Region**: ${region}` : ''}${buyerPersona ? `\n- **Buyer Persona**: ${buyerPersona}` : ''}`
}
