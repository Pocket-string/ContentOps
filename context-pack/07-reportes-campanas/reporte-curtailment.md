# Reporte semanal LinkedIn Bitalize: Curtailment (2–6 feb 2026)

## 1) Resumen ejecutivo
Durante esta semana construimos una mini campaña alrededor de un problema típico de performance reporting: **confundir “techo plano” con curtailment**. El hilo conductor fue **elevar el estándar de evidencia** para que el reporte sea defendible frente a Asset Managers y fondos.

El “producto” de la semana fue doble:
- **Contenido**: una secuencia editorial con gancho técnico, educación por falsos positivos y cierre de conversión.
- **Recurso**: **Checklist SCADA “5 min”** y una plantilla mínima tipo **fila auditable por intervalo** (la idea de “Fila Dorada”).

## 2) Objetivo de la semana y lógica de funnel
- **TOFU (alcance)**: instalar el problema mental: “techo plano ≠ curtailment”.
- **MOFU (nutrición)**: entregar un marco simple para clasificar por evidencia y drivers.
- **BOFU (conversión)**: empujar una acción concreta: comentar **CURTAILMENT** para recibir el checklist y plantilla por DM.

## 3) Entregables producidos en este chat
### 3.1 Copy y conversación
- Variaciones de copy (narrativa, shock, contrarian) para miércoles, jueves y viernes.
- Respuestas a comentarios en LinkedIn (ejemplo: interacción con Félix) con foco técnico y tono colaborativo.
- Ajustes de estilo: evitar exceso de símbolos, mantener lenguaje directo, y sostener el CTA semanal.

### 3.2 Sistema visual
- Iteraciones de **prompts JSON** para:
  - Carrusel estilo periódico.
  - Infografía técnica estilo periódico.
  - Versiones “hechas a mano” (cuaderno) para aumentar autenticidad.
- Criterios de control:
  - Formato cuadrado 1:1 cuando aplica.
  - Textos exactos (o se omite el bloque si hay riesgo de error).
  - Logo Bitalize sin reinterpretación.
  - Zonas vacías controladas para evitar ruido visual.

### 3.3 Activo de conversión
- Base para el recurso “Checklist SCADA (5 min)” con estructura de:
  - Datos mínimos.
  - Árbol Q1–Q4.
  - Tabla de firmas.
  - Edge cases.
  - Mini guía de reporting.

## 4) Metodología implementada
### 4.1 Ciclo de trabajo (repetible semanal)
1. **Elegir el tema** (un dolor operacional que se vea en SCADA).
2. **Definir una tesis única** (una frase que “cierra” la discusión).
3. **Diseñar el contenido por funnel** (problema → solución → conversión).
4. **Redactar copy con el framework “Detener, Ganar, Provocar, Iniciar”**:
   - Detener: frase de choque o contraria que frena el scroll.
   - Ganar: credibilidad técnica en 2–3 líneas.
   - Provocar: tensión real (KPIs sucios, discusiones, decisiones erradas).
   - Iniciar: pregunta o CTA accionable.
5. **Elegir un concepto visual mínimo** (el 20 por ciento que produce el 80 por ciento):
   - Una sola idea por pieza.
   - Un ejemplo comparativo.
   - Una plantilla descargable.
6. **Producir el visual con prompt JSON** + QA:
   - Jerarquía tipográfica.
   - Control de texto.
   - Consistencia editorial.
7. **Publicar y operar comentarios**:
   - Pregunta final para disparar conversación.
   - Responder con rigor y cercanía.
8. **Retroalimentación**:
   - Revisar qué gatilló comentarios.
   - Ajustar copy y visual del día siguiente.

### 4.2 Principio rector de la semana
**No discutimos curvas: discutimos evidencia.**

Esto aterriza el mensaje a algo accionable y auditable: “si no hay setpoint o flag, no declares curtailment; investiga driver”.

## 5) Aprendizajes técnicos convertidos en mensajes de marketing
### 5.1 Lo que más funcionó como idea
- “**Un PR sin evidencia no es una métrica, es una opinión**.”
- Cambia la conversación desde interpretación a **trazabilidad**.

### 5.2 Los tres falsos positivos (que sostienen el argumento)
- Control por tensión (Volt-Watt).
- Derating por frecuencia.
- Derating térmico.

En comentarios además apareció un cuarto que conviene integrar como “confusión frecuente”:
- **Clipping** por DC AC ratio.

### 5.3 La mejor palanca para conversión
- No vender “otro dashboard”.
- Vender una herramienta simple: **registro auditable por intervalo**.

## 6) Aprendizajes de diseño y producción (lo más importante de la semana)
### 6.1 Lo que salió mal (y por qué)
- **Gráficos físicos**: los generadores de imagen tienden a dibujar curvas “bonitas”, no necesariamente correctas.
- **Texto**: errores mínimos de ortografía destruyen credibilidad técnica.
- **Sobre carga**: demasiados bloques y elementos “decorativos” bajan legibilidad.

### 6.2 Decisiones que mejoraron resultados
- **Reducir complejidad**: menos elementos por slide.
- **Regla de texto estricto**: si no sale perfecto, se deja vacío.
- **Separar lo de alta precisión**:
  - El gráfico idealmente se inserta como SVG o plot real (hecho con datos o una curva diseñada), y el generador hace el marco editorial.

### 6.3 Lección de estilo (importante)
El look “cuaderno” tiene que sentirse imperfecto de verdad: trazos irregulares, alineación imperfecta, pequeñas variaciones, sombreado a mano. Si se ve demasiado limpio, se percibe como “imitación”.

## 7) Aprendizajes de interacción con el público
- Los comentarios de pares (ejemplo: clipping y térmico) confirman que el tema es real y frecuente.
- Las mejores respuestas son las que:
  - Validan el punto.
  - Aportan un criterio de verificación.
  - Cierran con una pregunta concreta de práctica (monitoreo térmico y correlación con potencia).

## 8) Recomendaciones para la próxima semana
### 8.1 Contenido
- Mantener el mismo hilo conductor (evidencia) pero rotar el “gancho visual” para no repetir.
- Alternar:
  - 1 post con evidencia visual dura (captura SCADA o curva correcta).
  - 1 post con framework.
  - 1 post con checklist.

### 8.2 Visual
- Estándar recomendado para rigor:
  - Generar el gráfico como **SVG** o imagen real (Matplotlib o Figma).
  - Usar el generador de imagen solo para “papel periódico”, bordes y composición.

### 8.3 Conversión
- Mantener el CTA “CURTAILMENT” por semana.
- Asegurar que el DM entregue:
  - Checklist.
  - Plantilla de registro.
  - Un ejemplo de línea completa.

## 9) Plantillas reutilizables
### 9.1 Copy base para conversión (esqueleto)
- Frase de detención.
- Problema operativo.
- Solución mínima.
- Beneficio defendible.
- CTA.
- Pregunta final cerrada (opciones 1, 2 o 3).

### 9.2 Visual base para conversión (esqueleto)
- Titular fuerte.
- Comparativa “sin evidencia” vs “auditable”.
- Un solo bloque de framework (máximo 1).
- CTA en una línea.

---

## Cierre
El mayor aprendizaje de la semana fue que el contenido técnico sí escala en LinkedIn cuando se traduce a una regla simple y auditable. La clave no fue explicar más, sino **poner un estándar mínimo de evidencia** y convertirlo en un recurso descargable.

