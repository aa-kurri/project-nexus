# Ayura OS — Development Guide (Forge Edition)

## 🚀 Autonomous Workflow
This project uses **Crucible+Jeffallan grade automation** for rapid feature parity.

- **Builder**: `scripts/story-runner.js`
- **Orchestration**: `packages/story-orchestrator`
- **Memory**: `packages/memory-forge`
- **Quality**: `packages/forge-auditor`

## 🧠 Token Optimization (Graphify + Forge Memory)
1. **Graphify**: Indexed project knowledge graph. Use `/graphify .` to refresh.
2. **Cognitive Checkpoints**: Use the **Memory Forge** to store key decisions.

## 🛠 Active Skills & Expert Personas
- **Story Orchestrator**: Build queue management.
- **Memory Forge**: Cognitive persistence.
- **Forge Auditor**: Architecture & Design System guardrails.
- **Next.js Expert**: Next.js 14 App Router standards (via `packages/jeffallan-skills/nextjs-developer`).
- **Postgres Pro**: Supabase/PostgreSQL optimization (via `packages/jeffallan-skills/postgres-pro`).
- **Spec Miner**: Gherkin & Story analysis (via `packages/jeffallan-skills/spec-miner`).

## Design Rules (Mandatory)
- Primary Color: `#0F766E` (Teal).
- BG: `hsl(220 15% 6%)`.
- All tables MUST have `tenant_id` + RLS using `public.jwt_tenant()`.
- Gherkin specs in `STORIES.md` are the source of truth for implementation.
