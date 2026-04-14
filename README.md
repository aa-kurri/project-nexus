# Project Nexus

> Autonomous engine that transforms any URL into a modern, production-ready ecosystem.
> **Pipeline:** Raw URL → Ghost Crawl → PRD + Gherkin Stories → Sprint Plan → Mapped Components → Web + Mobile Code.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind, Shadcn/ui, Framer Motion |
| Backend | Supabase (Auth, Postgres, Realtime, Edge Functions) |
| Crawler | Playwright + Firecrawl hybrid |
| LLM | Vercel AI SDK (primary) + LangChain (agentic chains) |
| Mobile | React Native (Expo Router) |
| Orchestration | Turborepo + pnpm workspaces |

## Monorepo Layout

```
project-nexus/
├── apps/
│   ├── web/         # Next.js 14 dashboard (App Router)
│   └── mobile/      # Expo React Native app
├── packages/
│   ├── shared-logic/      # Zod schemas + TS types shared web/mobile
│   ├── ui-kit/            # Platform-agnostic primitives (Tamagui/Nativewind)
│   ├── crawler-engine/    # Ghost crawler extractors & normalizers
│   ├── ai-orchestrator/   # Prompt chains, agents, PRD generators
│   └── sprint-engine/     # Fibonacci estimator, roadmap generator
├── supabase/
│   ├── migrations/        # SQL migrations
│   └── functions/         # Edge functions (long-running crawls)
├── examples/
│   └── ayura/             # Example output: Ayura OS Rebuild (Legacy HMS to Next.js/AI)
└── docs/architecture/     # Mermaid diagrams, ADRs
```

## Quick Start

```bash
pnpm install
cp .env.example .env.local        # fill Supabase, OpenAI/Anthropic, Firecrawl keys
pnpm db:push                      # apply migrations
pnpm dev                          # launch web on :3000
pnpm dev:mobile                   # launch Expo
```

## Core Modules

- **Ghost Crawler** — Playwright DOM + Firecrawl markdown → structured `CrawlArtifact`.
- **Feature-to-Requirement Engine** — Multi-pass LLM chain (classify → cluster → PRD → Gherkin).
- **Sprint Orchestrator** — Fibonacci point assignment + Mermaid roadmap.
- **Component Mapper** — RAG over indexed Aceternity/Magic UI/Shadcn components.

See [docs/architecture/system.md](docs/architecture/system.md) for the full system diagram.
