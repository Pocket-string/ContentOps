---
name: session-lifecycle
description: Disciplina de sesion con gate checks al inicio y cierre. Carga contexto, verifica estado del proyecto, y al cerrar valida que el build pase y no haya regresiones. Activar al inicio de cada sesion de trabajo o cuando el usuario dice cerrar sesion, verificar estado, o commit final.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Session Lifecycle — Disciplina de Sesion

## Cuando Activar

- **Inicio de sesion**: Automaticamente al comenzar a trabajar
- **Cierre de sesion**: "Ya termine" / "Commit final" / "Push" / "Cerrar sesion"
- **Checkpoint**: "Verificar estado" / "Como vamos?" / "Status check"

## Fase 1: Inicializacion (Session Start)

### Gate 1: Estado del Repositorio

```bash
# Verificar que no hay trabajo sucio
git status

# Verificar rama actual
git branch --show-current

# Ver ultimos commits para contexto
git log --oneline -5
```

### Gate 2: Estado del Build

```bash
# TypeScript debe compilar sin errores
pnpm exec tsc --noEmit

# Si falla: documentar errores existentes ANTES de trabajar
# para no confundir errores propios con heredados
```

### Gate 3: Contexto del Proyecto

1. Leer `CLAUDE.md` — reglas y aprendizajes activos
2. Leer `.claude/memory/MEMORY.md` — memoria del proyecto (si existe)
3. Leer `BUSINESS_LOGIC.md` — que hace el producto (si existe)
4. Verificar `npm run dev` funciona

### Gate 4: Dev Server

```bash
# Iniciar servidor si no esta corriendo
pnpm run dev

# Verificar que responde
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

### Output de Inicializacion

Reportar al usuario:

```
Session Iniciada:
- Rama: [branch]
- Build: OK / X errores pre-existentes
- Dev server: Puerto [3000-3006]
- Contexto: [nombre del proyecto]
- Pendiente: [resumen de lo que falta hacer]
```

---

## Fase 2: Trabajo (During Session)

### Reglas Activas

- **Commits atomicos**: Una idea = un commit (Conventional Commits)
- **TypeScript errors = bloqueantes**: No acumular errores
- **Tests despues de cada feature**: Verificar que funciona antes de avanzar
- **Screenshots como evidencia**: Capturar estado visual de cambios UI

### Checkpoints (Cada 3-5 cambios significativos)

```bash
# Verificar que no se rompio nada
pnpm exec tsc --noEmit

# Si hay UI changes, verificar visualmente
npx playwright screenshot http://localhost:3000/[ruta] --output checkpoint.png
```

---

## Fase 3: Cierre (Session End)

### Gate 1: Build Verification

```bash
# OBLIGATORIO: TypeScript debe pasar
pnpm exec tsc --noEmit

# OBLIGATORIO: Build de produccion debe funcionar
pnpm run build

# Si alguno falla: NO cerrar sesion. Arreglar primero.
```

### Gate 2: Regression Check

Verificar rapidamente las rutas principales:

```bash
# Smoke test de rutas criticas
npx playwright navigate http://localhost:3000
npx playwright navigate http://localhost:3000/login
npx playwright navigate http://localhost:3000/dashboard
# Agregar rutas especificas del proyecto
```

### Gate 3: Git Status Limpio

```bash
# Ver que quedo pendiente
git status

# Si hay cambios no commiteados: preguntar al usuario
# "Hay cambios sin commitear. Quieres que haga commit?"
```

### Gate 4: Documentar (Si Aplica)

- Si se descubrio un bug y se arreglo → documentar en CLAUDE.md como Aprendizaje
- Si se tomo una decision arquitectonica → documentar en PRP o CLAUDE.md
- Si el usuario corrigio algo → guardar en `.claude/memory/feedback/`

### Output de Cierre

```
Session Cerrada:
- Commits realizados: X
- Build: OK
- Regresiones: Ninguna detectada / [lista]
- Aprendizajes documentados: [si/no]
- Pendiente para proxima sesion: [resumen]
```

---

## Resumen Visual

```
SESSION START
  ├── Git status limpio?
  ├── Build compila?
  ├── Contexto cargado?
  └── Dev server corriendo?
       ↓
WORK (commits atomicos + checkpoints)
       ↓
SESSION END
  ├── tsc --noEmit = 0 errors?
  ├── pnpm run build = OK?
  ├── Regression check = OK?
  ├── Git status limpio?
  └── Aprendizajes documentados?
```

## Anti-Patrones

- **Empezar a codear sin verificar el build** — Puede heredar errores de la sesion anterior
- **Commitear sin typecheck** — Los errores se acumulan y son mas dificiles de arreglar despues
- **Cerrar sesion con build roto** — La proxima sesion empieza con deuda tecnica
- **No documentar aprendizajes** — El mismo error va a ocurrir de nuevo
- **Push sin regression check** — Romper produccion por no verificar 2 minutos
