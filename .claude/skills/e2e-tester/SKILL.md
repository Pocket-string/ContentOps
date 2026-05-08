---
name: e2e-tester
description: Testing autonomo con Karpathy Loop. Navega la app, detecta bugs, los corrige, y retestea. Evaluaciones binarias (pass/fail). Limites de seguridad para tokens. Activar cuando el usuario dice testea todo, revisa regresiones, QA completo, testing autonomo, o despues de implementar multiples features.
argument-hint: "[feature o URL]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# E2E Tester — Testing Autonomo con Karpathy Loop

## Cuando Activar

- "Testea todo" / "QA completo"
- "Revisa regresiones" / "Verifica que nada se rompio"
- "Testing autonomo" / "Corre los tests"
- Despues de implementar multiples features
- Antes de deploy a produccion

## Filosofia

Testing como loop de auto-mejora, no como checklist estatica:

```
TEST → FIND BUGS → FIX → RETEST → IMPROVE
```

- **Evaluaciones binarias**: Pass/Fail. NUNCA escalas (1-10, A-F, etc.)
- **Limites estrictos**: Max 5 fixes por ciclo, max 2 ciclos por sesion
- **Screenshots obligatorios**: Evidencia visual antes y despues de cada fix

## Limites de Seguridad (Token Budget)

| Regla | Limite | Razon |
|-------|--------|-------|
| Fixes por ciclo | Max 5 | Forzar triage, no cambios masivos |
| Ciclos por sesion | Max 2 | Hard stop, sin excepciones |
| Screenshots | Obligatorios | Evidencia, no suposiciones |
| Modelo | Sonnet (default) | Balance costo/calidad |

## Proceso: Karpathy Loop

### Ciclo 1: Discovery

#### 1. SETUP — Definir que testear

Leer la app y definir feature groups con prioridad:

| Prioridad | Feature | Criterio |
|-----------|---------|----------|
| P0 (GATE) | Auth | Si falla, nada funciona |
| P1 | Dashboard | Primera pantalla post-login |
| P2 | [Feature principal] | Core del negocio |
| P3 | [Feature secundaria] | Importante pero no critica |
| ... | ... | ... |

#### 2. NAVIGATE — Explorar cada feature

```bash
# Asegurar que dev server esta corriendo
pnpm run dev

# Navegar a la app
npx playwright navigate http://localhost:3000

# Screenshot de cada pantalla
npx playwright screenshot http://localhost:3000/dashboard --output .qa-reports/dashboard.png
```

#### 3. TEST — Ejecutar tests feature por feature

Para cada feature group:

1. Navegar a la ruta
2. Screenshot ANTES
3. Interactuar (click, fill, submit)
4. Verificar resultado esperado
5. Screenshot DESPUES
6. Registrar: PASS o FAIL

```bash
# Ejemplo: testear login
npx playwright navigate http://localhost:3000/login
npx playwright fill "#email" "test@example.com"
npx playwright fill "#password" "testpassword"
npx playwright click "button[type=submit]"
npx playwright screenshot http://localhost:3000/dashboard --output .qa-reports/post-login.png
```

#### 4. TRIAGE — Priorizar los bugs encontrados

De todos los bugs encontrados, seleccionar MAX 5 para corregir:

1. P0: Bloqueantes (auth roto, crash, data loss)
2. P1: Funcionalidad core rota
3. P2: UX degradada pero funcional
4. P3: Cosmeticos (diferir)

#### 5. FIX — Corregir los bugs seleccionados

Para cada bug (max 5):

1. Identificar root cause (leer codigo relevante)
2. Aplicar fix minimo (no refactorizar)
3. Screenshot POST-FIX como evidencia
4. Registrar en reporte

### Ciclo 2: Regression

Repetir el proceso COMPLETO:
- Verificar que los 5 fixes del ciclo 1 funcionan
- Verificar que no se rompio nada mas
- Si aparecen nuevos bugs: solo documentar, NO corregir (max 2 ciclos)

## Formato de Reporte

Crear `.qa-reports/[YYYY-MM-DD]-[nombre]/report.md`:

```markdown
# QA Report — [Fecha]

## Resumen
- Features testeadas: X
- Tests ejecutados: X
- PASS: X | FAIL: X | SKIP: X
- Bugs encontrados: X
- Bugs corregidos: X

## Resultados por Feature

### P0: Auth
| Test | Resultado | Evidencia |
|------|-----------|-----------|
| Login con email valido | PASS | screenshot-01.png |
| Login con password incorrecta | PASS | screenshot-02.png |
| Signup nuevo usuario | FAIL → FIXED | screenshot-03-before.png, screenshot-03-after.png |

### P1: Dashboard
...

## Bugs Corregidos (Ciclo 1)
1. **[BUG-001]**: Signup no validaba email — Fix: agregar Zod schema
2. **[BUG-002]**: Dashboard crasheaba sin datos — Fix: agregar empty state

## Bugs Pendientes (No Corregidos)
1. **[BUG-006]**: Boton submit desalineado en mobile — Prioridad: P3
```

## Evaluaciones Binarias

SIEMPRE usar pass/fail. Ejemplos:

| Evaluacion | Pass | Fail |
|-----------|------|------|
| Login funciona | Usuario llega a dashboard | Error o redirect loop |
| Form se envia | Toast de exito + datos en DB | Error en consola o no guarda |
| Pagina carga | Contenido visible en <3s | Blank page o spinner infinito |
| Mobile responsive | Contenido legible sin scroll horizontal | Elementos cortados o superpuestos |

## Anti-Patrones

- **NUNCA** escalas subjetivas (1-10, "bastante bien", "casi funciona")
- **NUNCA** mas de 5 fixes por ciclo (fuerza triage)
- **NUNCA** mas de 2 ciclos por sesion (respeta budget)
- **NUNCA** refactorizar durante testing (fix minimo, no mejoras)
- **NUNCA** testear sin screenshots (sin evidencia = no paso)
- **NUNCA** asumir que funciona sin verificar (el bias de confirmacion es real)
