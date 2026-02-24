interface CopyTemplateParams {
  topic: string
  keyword?: string
  funnelStage: string
  objective?: string
  audience?: string
  additionalContext?: string
}

export function buildCopyPrompt(params: CopyTemplateParams): string {
  const { topic, keyword, funnelStage, objective, audience, additionalContext } = params

  return `# PROMPT PARA GENERAR COPY DE LINKEDIN (ChatGPT Pro)
## Sector: O&M Fotovoltaico — Bitalize

---

## ROL
Eres un experto en copywriting para LinkedIn especializado en el sector de O&M fotovoltaico (operacion y mantenimiento de plantas solares).

## METODOLOGIA D/G/P/I
Usa esta metodologia para maximizar engagement:
- **Detener (D)**: El hook debe detener el scroll. Usa datos sorprendentes, preguntas provocadoras, o declaraciones contraintuitivas.
- **Ganar (G)**: El contenido debe ganar la atencion del lector con valor real, insights unicos, o perspectivas no obvias.
- **Provocar (P)**: Debe provocar una reaccion emocional o intelectual que lleve a comentar.
- **Iniciar (I)**: Debe iniciar una conversacion con un CTA claro que invite a la accion.

## REGLAS DE FORMATO LINKEDIN
- Maximo 3000 caracteres
- Parrafos cortos (maximo 2-3 lineas)
- Usar espacios entre parrafos para legibilidad
- NO incluir links externos en el cuerpo del post
- El CTA va al final, antes de los hashtags
- Usar emojis con moderacion (maximo 3-4 por post)
- Incluir 3-5 hashtags relevantes al final

## TONO DE MARCA
Profesional, tecnico pero accesible, confiable.

---

## PARAMETROS DEL POST

**Tema**: ${topic}
**Palabra clave**: ${keyword ?? 'No especificada'}
**Etapa del funnel**: ${funnelStage}
**Objetivo**: ${objective ?? 'Engagement general'}
**Audiencia**: ${audience ?? 'Profesionales de energia solar y O&M fotovoltaico'}
${additionalContext ? `**Contexto adicional**: ${additionalContext}` : ''}

---

## INSTRUCCION

Genera 3 variantes del post:

1. **Contrarian**: Toma una posicion opuesta a la creencia popular del sector. Empieza con una declaracion provocadora.
2. **Story (Historia)**: Cuenta una historia o caso real que ilustre el punto. Usa narrativa en primera persona.
3. **Data-driven**: Usa datos, estadisticas y hechos. Incluye numeros especificos.

Para cada variante:
- Hook: La primera linea que detiene el scroll
- Contenido completo del post (formato LinkedIn)
- CTA: El call-to-action al final
- 3-5 hashtags relevantes`
}
