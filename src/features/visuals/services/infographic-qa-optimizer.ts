/**
 * PRP-011 Phase 6: QA-First Infographic Engine
 * Rules injected into the system prompt BEFORE generating infographics,
 * so the AI produces output closer to QA standards from the first iteration.
 */

export function getInfographicQARules(): string {
  return `## QA PRE-CHECK RULES (OBLIGATORIO — el visual sera evaluado contra estas reglas)

COMPOSICION:
- UNA SOLA idea central por pieza. No mezclar multiples conceptos.
- Maximo 2 columnas de layout. Preferir 1 columna centrada.
- Jerarquia visual clara: headline > subtitle > body > footer.
- NO reservar zona inferior. El logo se composita automaticamente como pill en esquina inferior derecha.

TEXTO:
- Headline: MAXIMO 8 palabras. Impactante y legible a distancia.
- Subtitle: MAXIMO 15 palabras. Contextualizador.
- Body text: MAXIMO 30 palabras. Solo datos clave.
- NINGUN texto debe superponerse a imagenes o graficos.
- Contraste minimo: texto oscuro sobre fondo claro, o texto blanco sobre overlay oscuro.

LEGIBILIDAD MOVIL:
- Todo texto debe ser legible en pantalla de 375px de ancho.
- Fuente minima equivalente a 14px en mobile.
- Evitar textos en diagonal, curvos o con efectos que dificulten lectura.

BRANDING:
- Logo Bitalize: composited automaticamente como pill glass-morphism en esquina inferior derecha (NO dibujar).
- Firma "Jonathan Navarrete | Bitalize" composited automaticamente junto al logo pill.
- Colores de marca: primary (#1E3A5F), secondary (#F97316), accent (#10B981).
- NO inventar colores fuera de la paleta de marca.

PROHIBIDO:
- Fotos stock genericas.
- Texto borroso o pixelado.
- Logos de competidores.
- Mas de 4 elementos de texto en total.
- Elementos decorativos que no aporten informacion.`
}
