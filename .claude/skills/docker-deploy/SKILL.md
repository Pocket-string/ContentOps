---
name: docker-deploy
description: Deploy a produccion con Docker multi-stage + Dokploy en VPS. Crear Dockerfile optimizado, configurar health checks, dominios SSL, env vars, y ejecutar deploy. Activar cuando el usuario dice deploy, publicar, subir a produccion, configurar VPS, Dokploy, Docker, o necesita poner la app online.
argument-hint: "[dominio]"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Docker Deploy — Deploy a Produccion con Dokploy

## Cuando Activar

- "Quiero hacer deploy" / "Subir a produccion"
- "Configurar VPS" / "Configurar Dokploy"
- "Necesito un Dockerfile" / "Docker build"
- "Poner la app online" / "Dominio SSL"

## Pre-requisitos

- VPS con Dokploy instalado (o Vercel como alternativa)
- Dominio apuntando al VPS (A record)
- Variables de entorno listas (.env.local)

## Paso 1: Crear Dockerfile Multi-Stage

Crear `Dockerfile` en la raiz del proyecto:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args para variables publicas
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN pnpm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=384"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
```

## Paso 2: Configurar next.config.ts

Agregar `output: 'standalone'` al config de Next.js:

```typescript
const nextConfig = {
  output: 'standalone',
  experimental: {
    mcpServer: true,
  },
};
```

## Paso 3: Crear Health Endpoint

Crear `src/app/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

## Paso 4: Crear .dockerignore

```
node_modules
.next
.git
.env*
*.md
.claude/
```

## Paso 5: Deploy con Dokploy

### Via MCP (si Dokploy MCP esta configurado):

1. Crear aplicacion en Dokploy
2. Configurar env vars (copiar de .env.local)
3. Configurar dominio + SSL (Let's Encrypt automatico)
4. Deploy

### Via CLI:

```bash
# Obtener credenciales de .env.local
source <(grep -E '^DOKPLOY_' .env.local | sed 's/^/export /')

# Deploy
curl -X POST "${DOKPLOY_URL}/api/application.redeploy" \
  -H "x-api-key: ${DOKPLOY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"applicationId": "'${DOKPLOY_APP_ID}'"}'
```

## Gotchas Criticos

### Docker Build Cache
Docker build cache acumula GBs en VPS con deploys frecuentes. Configurar cron diario:

```bash
# Agregar a crontab del VPS
0 3 * * * docker builder prune -f --filter "until=48h"
```

Log rotation del daemon Docker:
```json
// /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### Dokploy Auth
- **CRITICO**: Dokploy usa header `x-api-key`, NO `Authorization: Bearer`
- Error comun que causa 401 silencioso

### Frozen Lockfile
- Siempre commitear `pnpm-lock.yaml` antes de deploy
- Docker build falla con `--frozen-lockfile` si el lockfile no esta actualizado

### Health Check
- Usar `127.0.0.1`, NO `localhost` en Docker HEALTHCHECK (resolucion DNS no disponible)
- El endpoint `/api/health` NO debe requerir auth

### Memory en VPS Pequenos
- `NODE_OPTIONS="--max-old-space-size=384"` para VPS con 1GB RAM
- Next.js standalone reduce el tamano de la imagen ~70%

### Public Directory
- Crear `public/` vacio si no existe (Next.js standalone lo requiere)
- `mkdir -p public` en el Dockerfile si necesario

## Verificacion Post-Deploy

```bash
# Health check
curl -s https://[DOMINIO]/api/health | jq .

# Headers de seguridad
curl -sI https://[DOMINIO] | grep -E "(X-Frame|Content-Type|Strict-Transport)"

# SSL
curl -vI https://[DOMINIO] 2>&1 | grep "SSL certificate"
```
