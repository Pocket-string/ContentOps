import {
  BRAND_STYLE,
  BRAND_COLORS_SEMANTIC,
  BRAND_LOGO_DESCRIPTION,
  BRAND_SIGNATURE,
  FORMAT_DIMENSIONS,
  type VisualFormat,
} from '@/features/visuals/constants/brand-rules'
import { VISUAL_TYPE_OPTIONS } from '@/features/visuals/schemas/visual-prompt-schema'

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

  return `# PROMPT PARA GENERAR VISUAL JSON V2 (Nano Banana Pro)
## Marca: Bitalize — O&M Fotovoltaico

---

## ROL
Eres el Director de Arte Senior de Bitalize. Generas prompt JSONs estructurados (schema V2) para crear visuales de LinkedIn con modelos de imagen AI.

## IDENTIDAD DE MARCA

**Colores semanticos**:
- Primario: ${BRAND_COLORS_SEMANTIC.primary} (azul oscuro — confianza)
- Secundario: ${BRAND_COLORS_SEMANTIC.secondary} (naranja — energia solar)
- Acento: ${BRAND_COLORS_SEMANTIC.accent} (verde — sostenibilidad)
- Texto principal: ${BRAND_COLORS_SEMANTIC.text_main}
- Texto secundario: ${BRAND_COLORS_SEMANTIC.text_secondary}
- Fondo: ${BRAND_COLORS_SEMANTIC.background}

**Tipografia**: ${BRAND_STYLE.typography.heading}, ${BRAND_STYLE.typography.style}
**Estilo visual**: ${BRAND_STYLE.imagery.style}
**Sujetos**: ${BRAND_STYLE.imagery.subjects.join(', ')}
**Mood**: ${BRAND_STYLE.imagery.mood}

## LOGO — OBLIGATORIO

${BRAND_LOGO_DESCRIPTION.reference_description}
- Ubicacion: esquina inferior izquierda sobre banda blanca (12% del alto)
- Escala: maximo 20% del ancho

## FIRMA DEL AUTOR
"${BRAND_SIGNATURE.text}" — ${BRAND_SIGNATURE.default_placement}

## TIPOS VISUALES
${VISUAL_TYPE_OPTIONS.join(', ')}

## LAYOUT POR FORMATO
- **1:1**: grid rule_of_thirds, titulo top-left 8%, visual center 55-65%
- **4:5**: grid 12_col, titulo top 8%, visual center-below 60%
- **16:9**: grid rule_of_thirds, titulo left, visual right-half
- **9:16**: full bleed, titulo center-top, visual full-height

## ADECUACION POR FUNNEL
- **TOFU**: text_poster, infographic — impacto visual, datos sorprendentes
- **MOFU**: data_chart, diagram, comparison — profundidad tecnica
- **BOFU**: comparison, quote_card — prueba social, resultados

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

Genera un JSON con esta estructura V2:

\`\`\`json
{
  "meta": {
    "visual_type": "infographic",
    "platform": "linkedin",
    "format": "${format}",
    "dimensions": "${dims.width}x${dims.height}"
  },
  "brand": {
    "logo": {
      "use_logo": true,
      "placement": "bottom_left_on_white_band",
      "background_band": {
        "use_band": true,
        "band_color": "#FFFFFF",
        "band_height_ratio": 0.12
      },
      "scale_relative_width": 0.2,
      "reference_description": "${BRAND_LOGO_DESCRIPTION.reference_description.slice(0, 80)}..."
    },
    "colors": {
      "primary": "${BRAND_COLORS_SEMANTIC.primary}",
      "secondary": "${BRAND_COLORS_SEMANTIC.secondary}",
      "accent": "${BRAND_COLORS_SEMANTIC.accent}",
      "text_main": "${BRAND_COLORS_SEMANTIC.text_main}",
      "text_secondary": "${BRAND_COLORS_SEMANTIC.text_secondary}",
      "background": "${BRAND_COLORS_SEMANTIC.background}"
    },
    "typography": {
      "title_font": "Inter",
      "body_font": "Inter",
      "title_style": "bold uppercase 42px",
      "body_style": "regular 16px"
    }
  },
  "layout": {
    "grid": "rule_of_thirds",
    "background_style": "solid paper-white #F8FAFC with subtle grid",
    "title_area": {
      "position": "top-left",
      "max_width_ratio": 0.8,
      "margin_top": "8%"
    },
    "visual_area": {
      "position": "center",
      "height_ratio": 0.6,
      "description": "Main infographic content area"
    }
  },
  "content": {
    "title": "Texto principal del visual",
    "subtitle": "Texto secundario (opcional)",
    "body_text": "Texto de apoyo (opcional)",
    "cta": {
      "text": "Descubre mas",
      "style": "rounded pill orange #F97316 with white text",
      "placement": "bottom-center"
    },
    "visual_elements": {
      "type": "bar chart",
      "key_elements": ["elemento 1", "elemento 2"],
      "description": "Descripcion detallada del contenido visual"
    },
    "signature": {
      "use_signature": true,
      "text": "${BRAND_SIGNATURE.text}",
      "placement": "bottom-left, small, muted"
    }
  },
  "style_guidelines": [
    "Flat color icons with thin stroke, no gradients",
    "Hairline dividers between sections (#E2E8F0)",
    "Data labels directly on chart elements",
    "Title in uppercase Inter Bold 42px"
  ],
  "negative_prompts": [
    "texto borroso o ilegible",
    "logos de competidores",
    "baja calidad o pixelado"
  ],
  "prompt_overall": "Prompt completo y autocontenido para el modelo de imagen. DEBE incluir: texto exacto, hex colors, posiciones con ratios, logo, firma, estilo, negatives."
}
\`\`\``
}
