// Reads examples/<slug>/crawl.json → generates PRD, Gherkin stories,
// Fibonacci sprint plan, Mermaid roadmap, component mappings.
// Everything is written as readable markdown into the same folder.

import Anthropic from "@anthropic-ai/sdk";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const SLUG = process.argv[2] || "vaidyo";
const OUT  = resolve(HERE, "..", "examples", SLUG);

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY missing in .env.local");
  process.exit(1);
}

const client = new Anthropic();
const MODEL = "claude-opus-4-5-20250929"; // Opus 4.5 — widely available; swap to 4.6 when enabled on your org
const log = (m) => console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`);

const artifact = JSON.parse(await readFile(resolve(OUT, "crawl.json"), "utf8"));

const systemPrompt = `You are Apex, a senior product architect and full-stack tech lead.
You reverse-engineer an existing website into a rigorous rebuild plan on a modern stack:
Next.js 14 (App Router), Supabase (Postgres + Auth + RLS), Shadcn/ui + Tailwind, Aceternity / Magic UI for motion, React Native (Expo Router) for mobile, Vercel AI SDK for any LLM features.

Output must be:
- Concrete and specific to the source artifact. Never generic.
- Measurable (every AC is testable).
- Respectful of the existing design tokens unless they violate accessibility.
- Modern-stack-first. Do not propose the legacy stack.`;

async function callJson(user, schemaHint) {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
    messages: [{
      role: "user",
      content: `${user}\n\nReturn ONLY valid minified JSON matching this shape:\n${schemaHint}\nNo prose, no markdown fences.`,
    }],
  });
  const text = res.content.map(b => b.type === "text" ? b.text : "").join("").trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
}

async function callText(user) {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 6000,
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  });
  return res.content.map(b => b.type === "text" ? b.text : "").join("");
}

// ── Compress artifact to fit comfortably in context ─────────────────
const compactArtifact = {
  url: artifact.url,
  seo: artifact.seo,
  designTokens: artifact.designTokens,
  pageMap: Object.fromEntries(
    Object.entries(artifact.pages).map(([href, p]) => [
      href,
      { title: p.title, h1: p.h1, headings: (p.headings ?? []).slice(0, 12) },
    ])
  ),
  forms: artifact.forms,
};
const artifactStr = JSON.stringify(compactArtifact);

log("📋 Generating PRD");
const prd = await callJson(
  `Source artifact:\n\`\`\`json\n${artifactStr}\n\`\`\`\n\nProduce a PRD for rebuilding this product on the modern stack.`,
  `{ "title": string, "vision": string, "personas": [{ "name": string, "role": string, "goals": string[] }], "successMetrics": string[], "epics": [{ "slug": string, "title": string, "summary": string, "features": string[] }], "nonFunctional": string[] }`
);
log(`   ${prd.epics.length} epics, ${prd.personas.length} personas`);

log("📖 Generating Gherkin user stories per epic");
const storiesByEpic = {};
for (const epic of prd.epics) {
  const out = await callJson(
    `Epic:\n${JSON.stringify(epic)}\n\nWrite 3-5 user stories with Gherkin scenarios. Each story: slug, epicSlug, asA, iWant, soThat, priority (p0|p1|p2|p3), scenarios[{ name, given[], when[], then[] }].`,
    `{ "stories": [{ "slug": string, "epicSlug": string, "asA": string, "iWant": string, "soThat": string, "priority": "p0"|"p1"|"p2"|"p3", "scenarios": [{ "name": string, "given": string[], "when": string[], "then": string[] }] }] }`
  );
  storiesByEpic[epic.slug] = out.stories;
  log(`   ${epic.slug}: ${out.stories.length} stories`);
}
const allStories = Object.values(storiesByEpic).flat();

log("📊 Estimating Fibonacci points (batched)");
const estimates = await callJson(
  `Estimate story points (Fibonacci: 1,2,3,5,8,13,21) for each story. Calibration:
- 1: trivial config (<2h)
- 2: single component, no new state
- 3: component + local state + one API touchpoint
- 5: multi-component + schema change
- 8: cross-cutting (auth/migration)
- 13: epic-level; likely should be split
- 21: only if splitting deferred

Stories:\n${JSON.stringify(allStories.map(s => ({ slug: s.slug, asA: s.asA, iWant: s.iWant, scenarios: s.scenarios.length })))}`,
  `{ "estimates": [{ "slug": string, "points": 1|2|3|5|8|13|21 }] }`
);
const pointsBySlug = Object.fromEntries(estimates.estimates.map(e => [e.slug, e.points]));

// ── Pack into sprints (capacity 30, 2-week cadence) ─────────────────
const CAPACITY = 30;
const priorityRank = { p0: 0, p1: 1, p2: 2, p3: 3 };
const sorted = [...allStories].sort((a, b) => {
  const r = priorityRank[a.priority] - priorityRank[b.priority];
  return r !== 0 ? r : (pointsBySlug[b.slug] ?? 3) - (pointsBySlug[a.slug] ?? 3);
});

const sprints = [];
let current = null;
let startDate = new Date();
startDate.setDate(startDate.getDate() + (1 - startDate.getDay() + 7) % 7); // next Monday
const fmt = d => d.toISOString().slice(0, 10);

for (const s of sorted) {
  const pts = pointsBySlug[s.slug] ?? 3;
  if (!current || current.totalPts + pts > CAPACITY) {
    if (current) sprints.push(current);
    const ends = new Date(startDate); ends.setDate(ends.getDate() + 13);
    current = { number: sprints.length + 1, goal: s.iWant, starts: fmt(startDate), ends: fmt(ends), totalPts: 0, tasks: [] };
    startDate = new Date(ends); startDate.setDate(startDate.getDate() + 1);
  }
  current.tasks.push({ ...s, points: pts });
  current.totalPts += pts;
}
if (current) sprints.push(current);

// ── Mermaid gantt ───────────────────────────────────────────────────
const mermaidLines = ["gantt", `  title ${prd.title} — Roadmap`, "  dateFormat YYYY-MM-DD", "  axisFormat %b %d"];
for (const sp of sprints) {
  mermaidLines.push(`  section Sprint ${sp.number}`);
  for (const t of sp.tasks) {
    const safe = t.iWant.replace(/:/g, "—").slice(0, 55);
    mermaidLines.push(`    ${safe} :${sp.starts}, ${sp.ends}`);
  }
}
const mermaid = mermaidLines.join("\n");

// ── Component mapping (single call, modern registries) ──────────────
log("🧩 Mapping features → modern components");
const mapping = await callJson(
  `For each epic feature, recommend 1-2 best components from Shadcn, Aceternity UI, Magic UI, or Tremor. Include install command (e.g. "npx shadcn@latest add button") and a short justification.
Epics:\n${JSON.stringify(prd.epics)}`,
  `{ "mappings": [{ "epicSlug": string, "feature": string, "registry": "shadcn"|"aceternity"|"magic_ui"|"tremor", "component": string, "install": string, "why": string }] }`
);

// ── Emit markdown artifacts ─────────────────────────────────────────
await mkdir(OUT, { recursive: true });

const prdMd = `# ${prd.title}

## Vision
${prd.vision}

## Personas
${prd.personas.map(p => `### ${p.name} — ${p.role}\n${p.goals.map(g => `- ${g}`).join("\n")}`).join("\n\n")}

## Success Metrics
${prd.successMetrics.map(m => `- ${m}`).join("\n")}

## Epics
${prd.epics.map(e => `### ${e.title} \`${e.slug}\`\n${e.summary}\n\n**Features:**\n${e.features.map(f => `- ${f}`).join("\n")}`).join("\n\n")}

## Non-Functional Requirements
${prd.nonFunctional.map(n => `- ${n}`).join("\n")}
`;

const storiesMd = `# User Stories (Gherkin)

${prd.epics.map(e => `## Epic: ${e.title}

${storiesByEpic[e.slug].map(s => `### ${s.iWant} \`${s.slug}\` — **${s.priority.toUpperCase()}** · ${pointsBySlug[s.slug] ?? "?"} pts

**As a** ${s.asA}
**I want** ${s.iWant}
**So that** ${s.soThat}

${s.scenarios.map(sc => `\`\`\`gherkin
Scenario: ${sc.name}
${sc.given.map(g => `  Given ${g}`).join("\n")}
${sc.when.map(w => `   When ${w}`).join("\n")}
${sc.then.map(t => `   Then ${t}`).join("\n")}
\`\`\``).join("\n\n")}`).join("\n\n")}`).join("\n\n---\n\n")}
`;

const sprintMd = `# Sprint Plan

${sprints.map(sp => `## Sprint ${sp.number} — ${sp.starts} → ${sp.ends}  \`${sp.totalPts} pts\`
**Goal:** ${sp.goal}

| Points | Priority | Story |
|---|---|---|
${sp.tasks.map(t => `| ${t.points} | ${t.priority.toUpperCase()} | ${t.iWant} (\`${t.slug}\`) |`).join("\n")}
`).join("\n\n")}

## Roadmap (Mermaid)

\`\`\`mermaid
${mermaid}
\`\`\`
`;

const mappingMd = `# Component Mapping — Modern Stack

| Epic | Feature | Registry | Component | Install | Why |
|---|---|---|---|---|---|
${mapping.mappings.map(m => `| \`${m.epicSlug}\` | ${m.feature} | ${m.registry} | **${m.component}** | \`${m.install}\` | ${m.why} |`).join("\n")}
`;

await writeFile(resolve(OUT, "PRD.md"), prdMd);
await writeFile(resolve(OUT, "STORIES.md"), storiesMd);
await writeFile(resolve(OUT, "SPRINTS.md"), sprintMd);
await writeFile(resolve(OUT, "COMPONENT_MAPPING.md"), mappingMd);
await writeFile(resolve(OUT, "roadmap.mmd"), mermaid);
await writeFile(resolve(OUT, "prd.json"), JSON.stringify({ prd, storiesByEpic, estimates, sprints, mapping }, null, 2));

log(`✨ Wrote PRD.md STORIES.md SPRINTS.md COMPONENT_MAPPING.md roadmap.mmd prd.json`);
log(`📂 ${OUT}`);
