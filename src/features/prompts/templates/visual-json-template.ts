import { BRAND_STYLE, FORMAT_DIMENSIONS, type VisualFormat } from '@/features/visuals/constants/brand-rules'

interface VisualTemplateParams {
  postContent: string
  funnelStage: string
  format: VisualFormat
  topicTitle?: string
  keyword?: string
  additionalInstructions?: string
}

export function buildVisualJsonPrompt(params: VisualTemplateParams): string {
  const { postContent, funnelStage, format, topicTitle, keyword, additionalInstructions } = params
  const dims = FORMAT_DIMENSIONS[format]

  return `# PROMPT PARA GENERAR VISUAL JSON (Nano Banana Pro)
## Marca: Bitalize — O&M Fotovoltaico

---

## ROL
Eres un director de arte experto en contenido visual para LinkedIn especializado en la marca Bitalize.

## IDENTIDAD DE MARCA

**Colores**:
- Primario: ${BRAND_STYLE.colors.primary} (azul oscuro — confianza)
- Secundario: ${BRAND_STYLE.colors.secondary} (naranja — energia solar)
- Acento: ${BRAND_STYLE.colors.accent} (verde — sostenibilidad)
- Fondo: ${BRAND_STYLE.colors.background}
- Texto: ${BRAND_STYLE.colors.text}

**Tipografia**: ${BRAND_STYLE.typography.heading}, ${BRAND_STYLE.typography.style}
**Estilo visual**: ${BRAND_STYLE.imagery.style}
**Sujetos**: ${BRAND_STYLE.imagery.subjects.join(', ')}
**Mood**: ${BRAND_STYLE.imagery.mood}
**Logo**: siempre en ${BRAND_STYLE.logo.placement}, discreto

## COMPOSICION POR FORMATO
- **1:1**: focal point centrado, texto en zona inferior o superior
- **4:5**: composicion en tercios, texto en tercio inferior
- **16:9**: composicion panoramica, texto a izquierda o derecha
- **9:16**: full bleed, texto centrado en zona media

## ADECUACION POR FUNNEL
- **TOFU**: imagenes impactantes, colores vibrantes naranja/verde
- **MOFU**: infografias, graficos, azul dominante
- **BOFU**: casos de exito, resultados, mezcla de colores de marca

---

## PARAMETROS

**Contenido del post**:
${postContent}

**Etapa del funnel**: ${funnelStage}
**Formato**: ${format} (${dims.width}x${dims.height}px)
${topicTitle ? `**Tema**: ${topicTitle}` : ''}
${keyword ? `**Keyword**: ${keyword}` : ''}
${additionalInstructions ? `**Instrucciones adicionales**: ${additionalInstructions}` : ''}

---

## INSTRUCCION

Genera un JSON con esta estructura exacta:

\`\`\`json
{
  "scene": {
    "description": "Descripcion detallada de la escena",
    "mood": "Estado de animo visual",
    "setting": "Ambientacion"
  },
  "composition": {
    "layout": "Disposicion de elementos",
    "focal_point": "Punto focal principal",
    "text_placement": "Ubicacion del texto"
  },
  "text_overlay": {
    "headline": "Texto principal del visual",
    "subheadline": "Texto secundario (opcional)",
    "cta_text": "Texto del CTA (opcional)"
  },
  "style": {
    "aesthetic": "Estetica general",
    "color_palette": ["#hex1", "#hex2", "#hex3"],
    "photography_style": "Estilo fotografico",
    "lighting": "Tipo de iluminacion"
  },
  "brand": {
    "logo_placement": "esquina inferior derecha",
    "brand_colors_used": ["#hex1", "#hex2"],
    "typography_notes": "Notas de tipografia"
  },
  "technical": {
    "format": "${format}",
    "dimensions": "${dims.width}x${dims.height}",
    "resolution_notes": "Notas de resolucion"
  },
  "negative_prompts": [
    "texto borroso o ilegible",
    "logos de competidores",
    "baja calidad o pixelado"
  ]
}
\`\`\``
}
