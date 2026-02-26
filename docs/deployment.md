# Deployment y Operaciones -- LinkedIn ContentOps

> Ultima actualizacion: 2026-02-26

## 1. Arquitectura de Deployment

```
Desarrollo local (pnpm run dev)
        |
        v
GitHub (main branch)
        |
        v  (manual trigger via Dokploy MCP)
Dokploy (App ID: T5h12sWPliBOeXYVLC75h)
        |
        v  (Docker build 4-stage)
VPS Hostinger (72.60.143.251)
        |
        v
Traefik (SSL via Let's Encrypt + Cloudflare)
        |
        v
https://contentops.jonadata.cloud
```

- **VPS**: Hostinger, Ubuntu 24.04, 2 vCPU / 8 GB RAM / 100 GB NVMe
- **Orquestador**: Dokploy (Docker Swarm mode)
- **Proxy**: Traefik (gestionado por Dokploy)
- **SSL**: Let's Encrypt + Cloudflare Full Strict

## 2. Docker Build (4 etapas)

El `Dockerfile` usa multi-stage build optimizado:

| Etapa | Base | Que hace |
|-------|------|----------|
| `base` | `node:20-alpine` | Habilita corepack, pnpm@9.15.4 |
| `deps` | `base` | `pnpm install --frozen-lockfile` + `pnpm store prune` |
| `builder` | `base` | Copia source + node_modules, ejecuta `pnpm run build` |
| `runner` | `node:20-alpine` | Imagen minima: solo `.next/standalone/` + `.next/static/` + `public/` |

**Detalles clave**:
- `output: 'standalone'` en `next.config.ts` produce un `server.js` autocontenido
- Build ARGs para variables publicas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`
- `NODE_OPTIONS=--max-old-space-size=512` limita memoria durante build
- Usuario non-root `nextjs:nodejs` (uid 1001) en produccion
- Puerto: 3000

### .dockerignore

Excluye agresivamente para minimizar contexto de build:
- `node_modules`, `.next`, `.git` — se reconstruyen/no necesarios
- `.env*` (excepto `.env.example`) — secrets vienen de Dokploy
- `docs/`, `*.md`, `.claude/`, `supabase/`, `scripts/`, `e2e/`

## 3. Procedimiento de Deploy

### Pre-requisitos
1. Migraciones aplicadas en Supabase (SIEMPRE antes de deploy)
2. `pnpm exec tsc --noEmit` = 0 errores
3. Cambios commiteados y pusheados a `main`

### Deploy via Dokploy MCP
```
1. Verificar migraciones: apply_migration si hay SQL pendiente
2. Push a main: git push origin main
3. Trigger deploy: via Dokploy MCP o panel web
4. Monitorear: build tarda ~2 min con cleanCache: true
```

### Cuando usar `cleanCache: true`
- Cambios en `package.json` o `pnpm-lock.yaml`
- Problemas de cache inexplicables
- **No usar** para cambios solo de codigo (el build cache acelera)

## 4. Variables de Entorno

### Build-time (NEXT_PUBLIC_*)
Estas se inyectan como Docker build ARGs. Next.js las inlinea en el bundle JS.

| Variable | Requerida | Ejemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Si | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Si | `eyJhbGci...` |
| `NEXT_PUBLIC_SITE_URL` | No | `https://contentops.jonadata.cloud` |

### Runtime (server-only)
Estas se configuran como env vars en Dokploy. NUNCA se bake-an en la imagen.

| Variable | Requerida | Proposito |
|----------|-----------|-----------|
| `SUPABASE_SERVICE_ROLE_KEY` | No | Operaciones admin (upload storage) |
| `GOOGLE_AI_API_KEY` | Si | Gemini 2.5 Flash (AI primario) |
| `OPENAI_API_KEY` | No | GPT-4o-mini (reviewer) |
| `OPENROUTER_API_KEY` | No | Fallback cuando Gemini falla |
| `NODE_ENV` | Si | `production` |

### Validacion
`src/lib/env.ts` valida con Zod al arrancar. Si `GOOGLE_AI_API_KEY` falta, la app no arranca.

## 5. Mantenimiento VPS

### Acceso SSH
```bash
ssh vps-bitalize          # Alias configurado en ~/.ssh/config
# Equivalente: ssh -i ~/.ssh/id_ed25519_vps ops@72.60.143.251
```

### Cron Jobs (usuario ops)
| Horario | Script | Proposito |
|---------|--------|-----------|
| `0 6 * * *` | `/home/ops/scripts/backup-n8n.sh` | Backup n8n |
| `0 3 * * *` | `/home/ops/scripts/docker-cleanup.sh` | Limpieza Docker (containers, images, cache) |
| `0 */6 * * *` | `/home/ops/scripts/disk-monitor.sh 80` | Monitor de disco (alerta si >80%) |

### Sudo
- Password requerido para sudo general
- **Sin password** para scripts en `/etc/sudoers.d/ops-scripts`
- `ops` esta en grupo `docker` — no necesita sudo para comandos Docker

### Docker Log Rotation
Configurado en `/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
```

### Comandos Utiles
```bash
# Estado del disco
df -h /
docker system df

# Limpieza manual
docker system prune -f
docker builder prune --keep-storage 2GB

# Logs de un contenedor
docker logs --tail 100 <container_name>

# Ver servicios Dokploy
docker service ls
```

## 6. Operaciones Supabase

### Aplicar Migraciones
Las migraciones estan en `supabase/migrations/`. Se aplican via Supabase MCP (`apply_migration`) o SQL Editor en el dashboard.

**ORDEN CRITICO**: Siempre `apply_migration` ANTES de deploy. Nunca al reves.

### Verificar RLS
```sql
-- Tablas sin RLS (deberia dar 0 resultados)
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE c.relrowsecurity = true
);
```

### Funcion swap_post_days
Usa `DEFERRABLE INITIALLY IMMEDIATE` constraint para swap atomico:
```sql
-- La funcion SET CONSTRAINTS uq_posts_campaign_day DEFERRED internamente
SELECT swap_post_days('post_a_id', 'post_b_id');
```

## 7. Troubleshooting

### Docker build OOM
**Sintoma**: Build falla con "JavaScript heap out of memory"
**Fix**: Ya configurado `NODE_OPTIONS=--max-old-space-size=512` en Dockerfile

### Disco lleno en VPS
**Sintoma**: df -h muestra >80%
**Fix**:
```bash
# Opcion 1: ejecutar cleanup script
/home/ops/scripts/docker-cleanup.sh
# Opcion 2: limpieza agresiva
/home/ops/scripts/docker-cleanup.sh --force
```
**Causa comun**: Build cache acumulado de deploys frecuentes con `cleanCache: true`

### RLS Violation
**Sintoma**: Error "new row violates row-level security policy"
**Fix**: Verificar que el usuario tiene `workspace_members` entry para el workspace. Para operaciones server-side, usar `SUPABASE_SERVICE_ROLE_KEY`.

### Build failure por tipos
**Sintoma**: `pnpm run build` falla con errores TypeScript
**Fix**: `pnpm exec tsc --noEmit` localmente, corregir errores, push de nuevo.

### Dokploy stuck
**Sintoma**: Deploy no avanza o falla silenciosamente
**Fix**: Trigger nuevo deploy con `cleanCache: true`. Si persiste, reiniciar servicio Docker en VPS.
