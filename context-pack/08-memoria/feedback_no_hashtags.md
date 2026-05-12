---
name: No hashtags in copy
description: Never generate hashtags (#) in any LinkedIn post copy - user explicitly requested removal
type: feedback
---

El usuario pidio eliminar hashtags de TODA la generacion de copy para LinkedIn.
- No incluir # en ninguna variante de post
- Aplica a: generate-copy route, pipeline orchestrator, iterate route
- El campo `hashtags` en `structured_content` se mantiene en el schema por backward compat pero siempre debe ser array vacio
