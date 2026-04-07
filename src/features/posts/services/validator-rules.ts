/**
 * Returns a text summary of all RecipeValidator rules for injection into AI prompts.
 * Extracted to a separate file (no 'use client') so it can be imported in server routes.
 */
export function getValidatorRulesSummary(): string {
  return `## REGLAS DEL VALIDATOR (el copy sera evaluado contra estos checks):
1. Hook presente: primera linea < 120 chars, con pregunta (?) o dato numerico
2. Hook anti-bot: NO empezar con emoji, NO frases genericas ("hoy quiero", "en el mundo de")
3. Sin links externos: NO incluir http/https en el cuerpo
4. Parrafos cortos: cada parrafo max 2 lineas (mobile-first)
5. CTA presente: ultimo parrafo debe tener call-to-action
6. Longitud optima: 1500-2200 caracteres (range ideal)
7. Legibilidad movil: ningun parrafo > 280 caracteres
8. Emojis moderados: maximo 2 emojis (exceso = patron bot)
9. Guardabilidad: incluir framework, lista o regla practica (optimiza saves)
10. Estructura D/G/P/I: minimo 4 bloques (Hook + Contexto + Provocacion + CTA)
11. CTA alineado al funnel: el tipo de CTA debe corresponder a la etapa
12. Hook contradictorio: paradoja "estado ideal vs problema oculto" (patron Ingeniero Poeta)
13. Personaje tecnico: componente especifico humanizado con agencia narrativa
14. Escena sensorial: min 2 elementos sensoriales (sudor, pantalla, calor, silencio)
15. Dato con fuente: cifra respaldada por fuente especifica (no "estudios dicen")
16. Pregunta especifica: cierre con pregunta de experiencia real (no "que piensas?")
17. Escalado numerico: min 2 datos con unidades (%, MW, kWh, US$) micro→macro
18. Triple leccion: lista de 3+ items guardable con vinetas
19. SIN HASHTAGS: NO incluir hashtags (#) bajo ninguna circunstancia`
}
