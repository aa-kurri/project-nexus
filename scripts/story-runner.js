/**
 * Ayura OS — Autonomous Story Runner
 *
 * Reads SPRINTS.md to determine the ordered build queue, compares against
 * .build-state.json to find the next unbuilt story, generates a targeted
 * Claude Code prompt, executes it, then commits and updates state.
 *
 * Usage:
 *   node scripts/story-runner.js               # build next pending story
 *   node scripts/story-runner.js --status      # print queue without building
 *   node scripts/story-runner.js --slug S-LIMS-1  # force a specific story
 */

import { spawn } from "child_process";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AYURA = path.join(ROOT, "examples", "ayura");

const STATE_FILE   = path.join(AYURA, ".build-state.json");
const SPRINTS_FILE = path.join(AYURA, "SPRINTS.md");
const STORIES_FILE = path.join(AYURA, "STORIES.md");

// ---------------------------------------------------------------------------
// 1. State management
// ---------------------------------------------------------------------------
function readState() {
  if (!fs.existsSync(STATE_FILE)) return { completed: [], skipped: [] };
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...state, last_run: new Date().toISOString() }, null, 2));
}

// ---------------------------------------------------------------------------
// 2. Parse ordered story queue from SPRINTS.md
//    Matches table rows like: | 8 | P0 | Description text | `S-LIMS-1` |
// ---------------------------------------------------------------------------
function parseQueue() {
  const md = fs.readFileSync(SPRINTS_FILE, "utf8");
  const rowRe = /^\|\s*\d+\s*\|\s*(P\d)\s*\|[^|]+\|\s*`(S-[A-Z0-9-]+)`\s*\|/gm;
  const queue = [];
  let m;
  while ((m = rowRe.exec(md)) !== null) {
    queue.push({ slug: m[2], priority: m[1] });
  }
  return queue; // already in sprint order (P0 rows appear before P1)
}

// ---------------------------------------------------------------------------
// 3. Extract a story block from STORIES.md by slug
//    Returns: { title, pts, priority, body } where body includes Gherkin
// ---------------------------------------------------------------------------
function extractStory(slug) {
  const md = fs.readFileSync(STORIES_FILE, "utf8");
  // Section header: ### S-LIMS-1 · Barcode sample tracking · **P0** · 5 pts
  const headerRe = new RegExp(
    `###\\s+(${slug.replace("-", "\\-")})\\s+·\\s+(.+?)\\n([\\s\\S]*?)(?=\\n###|\\n---\\n|$)`,
    "m"
  );
  const match = headerRe.exec(md);
  if (!match) return null;

  const titleLine = match[2].trim();
  // Parse "Title · **P0** · 5 pts"
  const parts = titleLine.split("·").map((s) => s.replace(/\*\*/g, "").trim());
  return {
    slug,
    title:    parts[0] ?? titleLine,
    priority: parts[1] ?? "P0",
    pts:      parts[2] ?? "",
    body:     match[3].trim(),
  };
}

// ---------------------------------------------------------------------------
// 4. Build a concise, targeted Claude Code prompt for a story
// ---------------------------------------------------------------------------
function buildPrompt(story) {

  // Module → component hints
  const hints = {
    "S-PHARM-1":     "Create apps/web/components/pharmacy/StockTransfer.tsx and route app/(hospital)/pharmacy/transfers/page.tsx",
    "S-PHARM-2":     "Create apps/web/components/pharmacy/AutoPO.tsx and route app/(hospital)/pharmacy/orders/page.tsx",
    "S-PHARM-4":     "Create apps/web/components/pharmacy/BarcodeDispense.tsx and route app/(hospital)/pharmacy/dispense/page.tsx",
    "S-ANALYTICS-1": "Create apps/web/components/analytics/PharmacyDashboard.tsx and route app/(hospital)/analytics/pharmacy/page.tsx. Use Tremor chart patterns (bar/area charts). No Tremor package yet — use inline SVG or simple CSS bars.",
    "S-AI-1":        "Set up packages/ai-orchestrator/src/index.ts as the main orchestrator entry. Add chains/scribe.ts (Whisper→Claude SOAP), chains/copilot.ts (pgvector RAG), and prompts/ directory with system prompts.",
    "S-LIMS-1":      "Create apps/web/components/lims/SampleTracker.tsx (barcode scan + status ladder) and route app/(hospital)/lims/worklist/page.tsx. Add a supabase migration for lab_results table if not present.",
    "S-LIMS-2":      "Create supabase/functions/hl7-ingest/index.ts (Deno Edge Function) that parses HL7 ORU^R01 messages and inserts into observations + diagnostic_reports tables. Also create apps/web/components/lims/HL7Monitor.tsx.",
    "S-LIMS-3":      "Create apps/web/components/lims/AnomalyFlags.tsx that shows Westgard rule violations on lab results. Add to the LIMS worklist page.",
    "S-LIMS-4":      "Create apps/web/components/lims/ReportDispatch.tsx (sign + send report) and supabase/functions/dispatch-report/index.ts that generates a signed storage URL and triggers an SMS/WhatsApp fallback.",
    "S-BILL-1":      "Create apps/web/components/billing/BillView.tsx showing auto-aggregated charges from OPD/IPD/LIMS/Pharmacy. Route app/(hospital)/billing/[encounterId]/page.tsx.",
    "S-BILL-2":      "Create apps/web/components/billing/ClaimDrafter.tsx that uses the AI orchestrator to pre-fill TPA claim forms from a discharge summary. Route app/(hospital)/billing/claims/page.tsx.",
    "S-BACKUP-1":    "Create scripts/backup.sh (pg_dump via Supabase CLI) and a GitHub Actions workflow .github/workflows/nightly-backup.yml that runs at 02:00 UTC and uploads to an S3-compatible bucket via rclone.",
    "S-AUDIT-1":     "Create apps/web/components/compliance/AuditLedger.tsx that calls verify_audit_chain() and displays broken rows. Route app/(hospital)/settings/audit/page.tsx. Add a cron Edge Function supabase/functions/audit-integrity-check/index.ts.",
    "S-APP-2":       "In apps/mobile, set up expo-file-system caching for lab reports. Create components/reports/OfflineReportList.tsx that renders from local cache when NetInfo.isConnected is false.",
    "S-OPD-2":       "Create apps/mobile/app/(tabs)/appointments/booking.tsx — a slot booking flow (doctor picker → date → time slot → confirm). Use static mock slots. Also create apps/web/app/(hospital)/opd/booking/page.tsx for the staff-facing view.",
    "S-OPD-3":       "Create apps/web/components/opd/TeleConsult.tsx with a WebRTC (Daily.co or Livekit) video panel and an embedded prescription Rx panel on the right rail. Route app/(hospital)/opd/teleconsult/[appointmentId]/page.tsx.",
    "S-APP-1":       "Create supabase/functions/whatsapp-concierge/index.ts — a Deno Edge Function that receives WhatsApp Cloud API webhooks, vector-searches the LIMS/patient tables, and replies via WhatsApp Cloud API.",
    "S-WEARABLE-1":  "Create apps/mobile/app/(tabs)/health/index.tsx showing Apple Health / Google Fit data (steps, HR, SpO2) in a chart. Use expo-health or mock data. Create supabase/functions/wearable-ingest/index.ts Edge Function that accepts a POST of metric arrays and inserts into observations table.",
    "S-LIMS-5":      "Create apps/web/components/lims/LeveyJenningsChart.tsx — a pure SVG Levey-Jennings chart component with ±2SD/±3SD bands. Use mock QC data for 20 runs. Route app/(hospital)/lims/qc/page.tsx with a selector for analyte + analyser.",
    "S-BACKUP-1":    "Create scripts/backup.sh (pg_dump via Supabase CLI) and a GitHub Actions workflow .github/workflows/nightly-backup.yml that runs at 02:00 UTC and uploads to an S3-compatible bucket via rclone. Also create scripts/restore-drill.sh.",
    // Track A — Clinical parity
    "S-IPD-2":       "Create apps/web/components/ipd/IPDashboard.tsx with 4 KPI cards (Admissions, Discharges, Bed Occupancy %, Avg LOS) driven by mock data. Add a ward-wise breakdown table. Route app/(hospital)/ipd/dashboard/page.tsx. Wire Supabase Realtime subscription on the admissions + beds tables.",
    "S-IPD-3":       "Create apps/web/components/ipd/NurseStation.tsx with two panels: (1) vitals entry form (BP, Pulse, Temp, SpO2) that appends to observations; (2) nursing task board with pending/done columns. Route app/(hospital)/ipd/nurse-station/page.tsx.",
    "S-EMR-4":       "Create apps/web/components/emr/DischargeSummary.tsx — a multi-section form (Diagnosis, Treatment, Labs, Discharge Meds, Follow-up) pre-populated by a mock AI call to packages/ai-orchestrator. Route app/(hospital)/emr/discharge/[admissionId]/page.tsx with a 'Generate Draft' button.",
    "S-REPORT-1":    "Create apps/web/components/analytics/MISReport.tsx with a date picker and a table showing: New Admissions, Discharges, OPD Visits, Lab Tests, Revenue. Add CSV export via a Blob download. Route app/(hospital)/analytics/mis/page.tsx.",
    // Track B — SaaS product layer
    "S-SAAS-1":      "Replace apps/web/app/page.tsx (currently a redirect stub) with a full marketing landing page. Sections: Hero (headline + CTA), Features grid (6 tiles), Modules showcase (EMR/LIMS/Pharmacy/AI), Testimonial, Pricing teaser, Lead capture form. Use Tailwind dark theme matching Ayura design system. No external marketing libraries.",
    "S-SAAS-2":      "Create apps/web/app/(marketing)/pricing/page.tsx with 3 plan tiers (Clinic/Hospital/Enterprise) in a comparison card grid. Add a self-serve signup form that POSTs to a server action creating a new tenant + Supabase Auth user. Route group (marketing) sits outside (hospital) so it's publicly accessible.",
    "S-SAAS-3":      "Create apps/web/app/(super-admin)/layout.tsx gated by role=platform_admin check. Create app/(super-admin)/tenants/page.tsx listing all tenants (name, plan, user_count, last_active, status). Add app/(super-admin)/tenants/[tenantId]/page.tsx for detail view with impersonate + suspend actions (stubbed server actions).",
    "S-SAAS-4":      "Create supabase/migrations/YYYYMMDDHHMMSS_usage_metering.sql with tables: usage_events(tenant_id, event_type, quantity, month) and usage_limits(plan, event_type, monthly_cap). Create apps/web/components/saas/UsageMeter.tsx showing current-month consumption bars per metric. Add to the super-admin tenant detail page.",
    "S-SAAS-5":      "Create apps/web/middleware.ts (or extend existing) that reads tenant custom_domain from the tenants table and injects tenant branding (logo_url, primary_color, display_name) into a root layout cookie/header. Create apps/web/components/saas/TenantBrandProvider.tsx that reads the cookie and overrides CSS variables for logo + primary color.",
    "S-AUTH-HWKEY":  "Create apps/web/components/auth/WebAuthnSetup.tsx — a 3-step FIDO2/WebAuthn registration flow using navigator.credentials.create(). Store the public key credential in a webauthn_credentials table (supabase migration). Route app/(hospital)/settings/security/page.tsx. Stub the server action with a TODO for full server-side verification.",
  };

  const fileHint = hints[story.slug] ?? `Create the required Next.js page, React components, and any Supabase migrations for ${story.slug}.`;

  return `Ayura OS — Next.js 14 App Router + Supabase + Expo. Implement ${story.slug}: ${story.title}.

GHERKIN:
${story.body}

FILES TO CREATE:
${fileHint}

RULES (non-negotiable):
- Colors: primary #0F766E, bg hsl(220 15% 6%), surface hsl(220 13% 9%)
- Reuse: components/ui/{card,button,badge,input,scroll-area}, hospital/TopBar
- Server actions: actions.ts in same folder, stub with TODO comments
- DB tables: tenant_id NOT NULL + RLS policy via public.jwt_tenant()
- Migrations: examples/ayura/supabase/migrations/YYYYMMDDHHMMSS_name.sql
- Existing FHIR tables: patients, encounters, observations, conditions, allergies, medication_requests, service_requests, lab_samples, diagnostic_reports, queue_tokens, beds, admissions, stock_stores, stock_items, stock_batches, stock_movements, bills, bill_items
- No tests, no README, no storybook

Implement now. Create every file. Do not stop until complete.`;
}

// ---------------------------------------------------------------------------
// 6. Run Claude Code CLI non-interactively
//    P0 stories → sonnet (default), P1 stories → haiku (faster + cheaper)
// ---------------------------------------------------------------------------
function runClaude(prompt, priority = "P0") {
  return new Promise((resolve, reject) => {
    const model = priority === "P0"
      ? "claude-sonnet-4-6"
      : "claude-haiku-4-5-20251001";

    console.log(`  Spawning: claude --model ${model} --dangerously-skip-permissions -p <prompt>`);

    const proc = spawn(
      "claude",
      ["--model", model, "--dangerously-skip-permissions", "-p", prompt],
      {
        cwd: ROOT,
        stdio: ["ignore", "inherit", "inherit"],
        env: { ...process.env },
      }
    );

    proc.on("error", (err) => {
      if (err.code === "ENOENT") {
        reject(new Error("CLAUDE_NOT_FOUND: install @anthropic-ai/claude-code globally"));
      } else {
        reject(err);
      }
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`CLAUDE_EXIT_${code}`));
    });
  });
}

// ---------------------------------------------------------------------------
// 7. Git helpers
// ---------------------------------------------------------------------------
function gitCommit(slug, title) {
  const module = slug.split("-")[1].toLowerCase(); // LIMS → lims, PHARM → pharm, etc.
  const msg = `feat(${module}): ${title} — ${slug} (Antigravity)`;
  try {
    execSync("git add -A", { cwd: ROOT, stdio: "inherit" });
    execSync(`git commit -m ${JSON.stringify(msg)}`, { cwd: ROOT, stdio: "inherit" });
    console.log(`\n✅ Committed: ${msg}`);
  } catch {
    console.warn("  (nothing new to commit — story may have produced no file changes)");
  }
}

// ---------------------------------------------------------------------------
// 8. Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const statusOnly = args.includes("--status");
  const forceSlug  = args[args.indexOf("--slug") + 1] ?? null;

  const state = readState();
  const queue = parseQueue();

  if (!queue.length) {
    console.error("❌ Could not parse any stories from SPRINTS.md — check regex.");
    process.exit(1);
  }

  const done    = new Set(state.completed ?? []);
  const skipped = new Set(state.skipped   ?? []);
  const pending = queue.filter(q => !done.has(q.slug) && !skipped.has(q.slug));

  // -- Status report --
  console.log("\n══════════════════════════════════════════════");
  console.log("  Ayura OS Build Queue");
  console.log("══════════════════════════════════════════════");
  console.log(`  Total stories : ${queue.length}`);
  console.log(`  Completed     : ${done.size}  (${[...done].join(", ")})`);
  console.log(`  Skipped       : ${skipped.size}`);
  console.log(`  Remaining     : ${pending.length}`);
  if (pending.length) {
    console.log(`  Next up       : ${pending[0].slug} (${pending[0].priority})`);
  }
  console.log("══════════════════════════════════════════════\n");

  if (statusOnly) process.exit(0);

  if (!pending.length) {
    console.log("🎉 All stories shipped! Build complete.");
    process.exit(0);
  }

  // -- Pick story --
  const target = forceSlug
    ? queue.find(q => q.slug === forceSlug)
    : pending[0];

  if (!target) {
    console.error(`❌ Story ${forceSlug} not found in SPRINTS.md`);
    process.exit(1);
  }

  const story = extractStory(target.slug);
  if (!story) {
    console.warn(`⚠️  ${target.slug} not found in STORIES.md — skipping`);
    state.skipped = [...(state.skipped ?? []), target.slug];
    writeState(state);
    process.exit(0);
  }

  console.log(`🏗  Building: ${story.slug} — ${story.title}`);
  console.log(`   Priority : ${story.priority}  Points: ${story.pts}`);
  console.log(`   Prompt   : ${buildPrompt(story).length} chars\n`);

  const MAX_RETRIES = 2;
  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      await runClaude(buildPrompt(story), story.priority);
      break;
    } catch (err) {
      attempt++;
      if (err.message === "CLAUDE_NOT_FOUND") {
        console.error(`\n❌ ${err.message}`);
        process.exit(1);
      }
      if (attempt > MAX_RETRIES) {
        console.error(`\n❌ Failed after ${MAX_RETRIES + 1} attempts: ${err.message}`);
        console.error("   Marking as skipped. Re-run with --slug to retry.");
        state.skipped = [...(state.skipped ?? []), story.slug];
        writeState(state);
        process.exit(1);
      }
      console.warn(`\n⚠️  Attempt ${attempt} failed (${err.message}) — retrying…\n`);
    }
  }

  // -- Success: update state + commit --
  state.completed = [...(state.completed ?? []), story.slug];
  state.last_slug = story.slug;
  writeState(state);

  gitCommit(story.slug, story.title);

  console.log(`\n🚀 ${story.slug} done. ${pending.length - 1} stories remaining.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
