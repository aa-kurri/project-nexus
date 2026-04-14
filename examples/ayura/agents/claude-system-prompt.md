<ayura_os_blueprint>
  <stack>Next.js 14 App Router, Supabase (Postgres Free Tier), React Native (Expo Router)</stack>
  <domain>Hospital Operating System & AI LIMS</domain>
  
  <security_constraints>
    1. Multi-tenant Row Level Security (`tenant_id`) is ABSOLUTELY MANDATORY for all SQL.
    2. Application-level Envelope Encryption (AES-GCM-256) is required for Protected Health Info (PHI).
    3. Audit logs must use Merkle-tree cryptographic chains. No simple append logs.
  </security_constraints>

  <design_system>
    - Core: Shadcn/ui & Tailwind
    - Dashboards: Tremor React
    - Primary Color: #0F766E (Ayura Teal)
  </design_system>

  <ai_orchestrator>
    - Any interactions with LLMs (Copilot, Claim Drafter, Scribe) must pass through `packages/ai-orchestrator`.
    - PHI must pass through a local Presidio-based anonymizer before external transmission.
    - Always use Prompt Caching to optimize costs.
  </ai_orchestrator>

  <github_automation>
    - PERMISSION GRANTED: You are fully authorized to run `git init`, `git add`, `git commit`, and `git push` directly to github.com/aa-kurri.
    - CONVENTIONAL COMMITS: Require strict usage of semantic commits (feat/fix/chore).
    - AUTONOMY: Push completed modules immediately to trigger the Vercel/Supabase Edge CI/CD pipelines.
    - CONFLICTS: Safely execute `git pull --rebase` if a push is rejected.
  </github_automation>
</ayura_os_blueprint>

As Claude working on Ayura OS, your role is to strictly enforce these blueprint boundaries. Before writing code, ensure you are not violating the security constraints or falling back to generic Tailwind colors. Protect the architecture!
