---
name: harden
description: Security hardening automatizado del proyecto. Agrega CSP headers, rate limiting, validacion de env vars con Zod, sanitizacion de inputs, y mejores practicas de seguridad. Activar cuando el usuario dice seguridad, hardening, proteger, CSP, rate limit, headers, o antes de deploy a produccion.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Harden — Security Hardening Automatizado

## Cuando Activar

- "Necesito seguridad" / "Proteger la app"
- "Agregar CSP" / "Security headers"
- "Rate limiting" / "Proteger endpoints"
- Antes de cualquier deploy a produccion
- Cuando se crean endpoints publicos o de AI

## Que Hace

Aplica 6 capas de seguridad probadas en produccion:

1. **Security Headers** en next.config.ts
2. **Validacion de Env Vars** con Zod al arrancar
3. **Rate Limiting** en endpoints publicos y AI
4. **Sanitizacion de Inputs** (filenames, user data)
5. **Gitignore Audit** (.env, secrets, keys)
6. **Verificacion de RLS** en Supabase

## Capa 1: Security Headers

Agregar a `next.config.ts`:

```typescript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai",
    ].join('; '),
  },
];

const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

**Adaptar CSP** segun el proyecto: agregar dominios de APIs externas, CDNs, etc.

## Capa 2: Validacion de Env Vars

Crear `src/lib/env.ts`:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  // Agregar todas las env vars del proyecto
});

export const env = envSchema.parse(process.env);
```

Importar en `src/app/layout.tsx` o punto de entrada para que falle al arrancar si falta algo.

## Capa 3: Rate Limiting

Crear `src/lib/rate-limit.ts`:

```typescript
const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function createRateLimiter(maxRequests: number, windowMs: number) {
  return function checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const record = rateLimit.get(identifier);

    if (!record || now > record.resetTime) {
      rateLimit.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  };
}

// Limiters pre-configurados
export const aiLimiter = createRateLimiter(10, 60_000);      // 10/min
export const imageLimiter = createRateLimiter(5, 60_000);     // 5/min
export const publicLimiter = createRateLimiter(30, 60_000);   // 30/min
export const exportLimiter = createRateLimiter(5, 60_000);    // 5/min
```

Uso en API routes:

```typescript
import { aiLimiter } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (!aiLimiter(user.id)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  // ... logica
}
```

## Capa 4: Sanitizacion

```typescript
// src/lib/sanitize.ts

/** Sanitiza filenames para Content-Disposition headers */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Sanitiza inputs de usuario para prevenir XSS basico */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

## Capa 5: Gitignore Audit

Verificar que `.gitignore` incluye:

```
.env
.env.local
.env.*.local
.mcp.json
settings.local.json
*.pem
*.key
credentials.json
```

**CRITICO**: Verificar ANTES del primer commit. Secrets en git history son irrecuperables.

## Capa 6: RLS Verification

Despues de crear tablas, ejecutar via Supabase MCP:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

Todas las tablas con datos de usuario DEBEN tener `rowsecurity = true`.

## Checklist de Verificacion

```bash
# 1. Headers
curl -sI https://[DOMINIO] | grep -E "(X-Frame|Content-Type-Options|Strict-Transport|CSP|Permissions)"

# 2. Env vars validadas
pnpm run dev  # Si falta algo, crashea al arrancar (no horas despues)

# 3. Rate limiting
for i in {1..15}; do curl -s -o /dev/null -w "%{http_code}\n" https://[DOMINIO]/api/ai/generate; done
# Debe retornar 429 despues de 10 requests

# 4. RLS
# Via Supabase MCP: get_advisors(type: "security")
```

## Cron Secret para Endpoints Scheduled

Si el proyecto tiene endpoints llamados por cron:

```typescript
// src/app/api/cron/[job]/route.ts
export async function POST(req: Request) {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  // ... logica del cron
}
```

Agregar `CRON_SECRET` a `.env.example`.
