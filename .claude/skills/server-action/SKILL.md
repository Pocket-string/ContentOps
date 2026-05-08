---
name: server-action
description: Patron estandarizado de 4 pasos para Server Actions en Next.js + Supabase. Garantiza auth, validacion Zod, ejecucion segura, y side effects consistentes. Activar cuando se crean server actions, CRUD, formularios, o cualquier operacion que modifique datos.
user-invocable: false
context: fork
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Server Action — Patron Estandarizado de 4 Pasos

## Cuando Activar (Automatico)

Este skill se activa automaticamente cuando Claude detecta que necesita crear o modificar un Server Action:
- Crear CRUD para una feature
- Procesar formularios
- Operaciones que modifican datos en Supabase
- Cualquier `'use server'` function

## El Patron de 4 Pasos

TODO Server Action sigue esta estructura. Sin excepciones.

```typescript
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// Schema de validacion (fuera de la funcion, reutilizable)
const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  // .nullable().optional() porque clientes envian null, no undefined
});

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function createItem(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {

  // ── PASO 1: AUTH ──────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'No autenticado' };
  }

  // ── PASO 2: VALIDATE (Zod) ───────────────────────────────
  const raw = {
    name: formData.get('name'),
    description: formData.get('description'),
  };

  const parsed = createItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // ── PASO 3: EXECUTE (Supabase) ────────────────────────────
  const { data, error } = await supabase
    .from('items')
    .insert({
      ...parsed.data,
      user_id: user.id,
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // ── PASO 4: SIDE EFFECTS ─────────────────────────────────
  revalidatePath('/items');

  return { success: true, data: { id: data.id } };
}
```

## Reglas del Patron

### Paso 1: Auth
- SIEMPRE verificar auth, incluso en rutas "protegidas"
- Usar `supabase.auth.getUser()`, no `getSession()` (getUser valida el JWT)
- Retornar error claro, no lanzar excepciones

### Paso 2: Validate
- SIEMPRE usar Zod para validar inputs
- NUNCA confiar en data del cliente (formData, JSON body)
- NUNCA usar `as Type` — siempre `safeParse()` o `parse()`
- Usar `.nullable().optional()` para campos opcionales (clientes envian `null`)

### Paso 3: Execute
- Una sola operacion de Supabase por action (principio de responsabilidad unica)
- Si necesitas multiples operaciones, usar `supabase.rpc()` con una function SQL
- SIEMPRE usar `.select()` despues de `.insert()` / `.update()` para obtener el resultado
- Para operaciones sensibles, usar `supabaseServiceRole` (no el cliente del usuario)

### Paso 4: Side Effects
- `revalidatePath()` para invalidar cache de ISR
- Audit logging si aplica
- Email/notificacion si aplica
- NUNCA poner logica de negocio aqui — solo efectos secundarios

## Variantes Comunes

### Update
```typescript
export async function updateItem(id: string, formData: FormData): Promise<ActionResult> {
  // 1. Auth
  // 2. Validate
  // 3. Execute
  const { error } = await supabase
    .from('items')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id); // RLS adicional en codigo
  // 4. Side effects
}
```

### Delete
```typescript
export async function deleteItem(id: string): Promise<ActionResult> {
  // 1. Auth
  // 2. Validate (solo el id)
  const idSchema = z.string().uuid();
  // 3. Execute
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  // 4. Side effects
}
```

### Con Archivo (Upload)
```typescript
export async function uploadFile(formData: FormData): Promise<ActionResult<{ url: string }>> {
  // 1. Auth
  // 2. Validate
  const file = formData.get('file') as File;
  if (!file || file.size > 5_000_000) {
    return { success: false, error: 'Archivo invalido o muy grande (max 5MB)' };
  }
  // 3. Execute
  const filename = sanitizeFilename(file.name);
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(`${user.id}/${filename}`, file);
  // 4. Side effects
}
```

## Anti-Patrones (NUNCA Hacer)

- **No validar**: Confiar en que el form HTML ya valido
- **`as Type`**: Castear data externa sin validar
- **Try/catch generico**: Retornar `{ error: 'Algo salio mal' }` sin contexto
- **Multiples mutaciones**: Hacer INSERT + UPDATE + DELETE en un solo action
- **Logica de negocio en side effects**: Calculos, condicionales, o queries adicionales en paso 4
- **Olvidar revalidatePath**: La UI no se actualiza despues de la mutacion
