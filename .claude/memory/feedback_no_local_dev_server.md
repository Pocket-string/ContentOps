---
name: No local dev server — work against deployed app
description: This project works directly against the deployed app at contentops.jonadata.cloud, not localhost — skip the dev-server gate at session start
type: feedback
---

For this project, do NOT start a local dev server (`pnpm run dev`) as part of
session start, smoke tests, or QA flows. We work directly against the deployed
app at `https://contentops.jonadata.cloud`.

**Why:** Already established for Karpathy loops
(`feedback_karpathy_in_production.md`), but it applies more broadly — Jonathan
iterates on real prod data, not local seed state, so localhost adds noise
(stale data, different DB, env drift) without any benefit. Starting the dev
server also wastes ~2 minutes of compile time on first hit.

**How to apply:**
- **Session-lifecycle skill Gate 4 (dev server):** skip it. Replace with a
  `curl https://contentops.jonadata.cloud` 200 check.
- **Playwright / E2E:** always target `https://contentops.jonadata.cloud`
  (never `http://localhost:3000`).
- **Manual verification of UI changes:** deploy first via Dokploy MCP, then
  verify in production. Don't ask "does this look right locally?"
- If a flow genuinely requires local-only state (e.g., debugging a build error
  that only surfaces in `pnpm run build`), ask first before spinning up
  `pnpm run dev` — it should be the exception, not the default.
