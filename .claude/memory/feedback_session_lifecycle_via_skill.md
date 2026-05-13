---
name: Session-lifecycle via Skill tool (start + end)
description: For session start AND end triggers, invoke the session-lifecycle skill via the Skill tool — do not improvise gates inline
type: feedback
---

When the user uses session-lifecycle trigger phrases, invoke the
`session-lifecycle` skill via the Skill tool — do NOT improvise the gate
sequence by running tsc / build / smoke tests on my own.

**Triggers for `args: start`** (inicio de sesión):
- "inicia sesion" / "inicia sesión" / "comencemos" / "empezar sesion"
- "carga contexto" / "status inicial" / first message of a working session

**Triggers for `args: end`** (cierre de sesión):
- "prepara el cierre de sesion" / "cerrar sesion" / "cerremos"
- "ya termine" / "ya terminé" / "commit final" / "push final"

**Triggers for checkpoint** (mid-session status):
- "verificar estado" / "como vamos" / "como vamos?" / "status check"

**Why:** The skill at `.claude/skills/session-lifecycle/SKILL.md` defines the
exact gate order (build, regression, git, learnings), anti-patterns, and report
format the project expects. Running gates ad-hoc skips structure and can miss
steps. The skill handles BOTH start and end — one entry point, two args.

**How to apply:**
- Match the trigger → call Skill tool with `skill: session-lifecycle` and the
  correct `args` (`start` | `end`).
- After the skill launches, follow its instructions (run the gates it
  prescribes, deliver the report format it specifies).
- Same rule applies to other procedural project skills (e.g. `prp`,
  `bucle-agentico`, `e2e-tester`) — when a skill matches user intent, invoke
  via the Skill tool first.
