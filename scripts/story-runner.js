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
    "S-MOB-RBAC":   "Refactor apps/mobile/app/_layout.tsx and apps/mobile/app/(tabs)/_layout.tsx to read the user's role from Supabase profiles table after OTP login (zustand store). Render role-specific tab groups: patient tabs (Home/Appointments/Reports/Health/Profile), doctor tabs (Queue/Patients/Scribe/Rx/More), admin tabs (Dashboard/Beds/Billing/Staff/More), staff tabs (Tasks/Vitals/Dispense/Lab/More). Create apps/mobile/app/(tabs)/admin/feature-flags.tsx — a role×feature matrix toggle screen that updates a mobile_feature_flags table. Create examples/ayura/supabase/migrations/YYYYMMDDHHMMSS_mobile_rbac.sql with profiles.role enum extension and mobile_feature_flags table.",
    "S-MOB-DOCTOR": "Create apps/mobile/app/(tabs)/queue/index.tsx (today's OPD token list with patient name, complaint, wait time; tap to open chart). Create apps/mobile/app/(tabs)/patients/[id].tsx (last 3 encounters, active meds, allergies). Create apps/mobile/app/(tabs)/scribe/index.tsx (microphone button, live SOAP transcript using expo-av or mock, Save Note action). Create apps/mobile/app/(tabs)/rx/index.tsx (drug search input, dose/frequency/duration fields, Sign & Send creates medication_request). Use NativeWind, primary #0F766E.",
    "S-MOB-ADMIN":  "Create apps/mobile/app/(tabs)/dashboard/index.tsx (4 KPI cards: admissions today, discharges, bed occupancy %, revenue — mock data with Supabase stubs). Create apps/mobile/app/(tabs)/beds/index.tsx (colour-coded FlatList grid of wards and bed statuses). Create apps/mobile/app/(tabs)/billing/index.tsx (today's charges summary). Create apps/mobile/app/(tabs)/staff/index.tsx (FlatList of users with role picker — updates profiles.role via server action stub). Use NativeWind.",
    "S-MOB-STAFF":  "Create apps/mobile/app/(tabs)/vitals/index.tsx (patient selector + BP/HR/SpO2/temp/pain score form → inserts observation). Create apps/mobile/app/(tabs)/dispense/index.tsx (pending Rx list, barcode scan mock, confirm dispense → stock_movement insert stub). Create apps/mobile/app/(tabs)/lab/index.tsx (pending worklist FlatList, tap to enter results → diagnostic_report insert stub). Create apps/mobile/app/(tabs)/tasks/index.tsx (task board with pending/in-progress/done columns). Use NativeWind.",
    "S-MOB-PATIENT-V2": "1) Replace apps/mobile/components/app/BiometricLockScreen.tsx with expo-local-authentication (LocalAuthentication.authenticateAsync) inactivity guard in apps/mobile/app/_layout.tsx. 2) Create apps/mobile/app/(tabs)/prescriptions/index.tsx listing active medication_requests with drug/dose/doctor. 3) Create apps/mobile/app/(tabs)/appointments/teleconsult.tsx video call screen (WebView or mock video panel). 4) Add expo-notifications setup in apps/mobile/lib/notifications.ts with registerForPushNotificationsAsync() and a useNotifications() hook. Update apps/mobile/package.json to add expo-local-authentication and expo-notifications.",

    // Sprint 12 — De-stub AI + Auth
    "S-AI-SCRIBE-LIVE": "Wire the existing apps/web/components/ai/ClinicalScribe.tsx to a real server action. Create apps/web/app/api/ai/scribe/route.ts that: (1) accepts a FormData with an audio blob, (2) calls Groq Whisper API (or stubs transcription if key missing) for speech-to-text, (3) calls Claude claude-sonnet-4-6 via the Anthropic SDK with a SOAP system prompt, (4) returns { transcript, soap: { subjective, objective, assessment, plan } }. Update ClinicalScribe.tsx to POST to this endpoint instead of setTimeout. Also create packages/ai-orchestrator/src/chains/scribe-live.ts with the actual chain logic. Requires ANTHROPIC_API_KEY env var — add to apps/web/.env.local.example.",
    "S-AI-COPILOT-RAG": "Set up pgvector RAG for the Clinical Copilot. Create supabase/migrations/20261005000000_pgvector_embeddings.sql: enable vector extension, add content_embedding vector(1536) column to doctor_notes table, create ivfflat index. Create apps/web/app/api/ai/copilot/route.ts: (1) embed the user question with OpenAI text-embedding-3-small, (2) run pgvector similarity search on doctor_notes filtered by patient_id, (3) pass retrieved chunks + question to Claude claude-sonnet-4-6, (4) return { answer, citations: [{encounter_id, excerpt}] }. Update apps/web/components/ai/CopilotPanel.tsx to POST to /api/ai/copilot and render citations as clickable links to /emr/patients/[id].",
    "S-AUTH-FLOW": "Build the empty apps/web/app/auth/ folder into working flows. Create: (1) apps/web/app/auth/login/page.tsx — email+password form + 'Sign in with phone' OTP tab, calls supabase.auth.signInWithPassword / signInWithOtp, redirects to /dashboard on success. (2) apps/web/app/auth/register/page.tsx — reads ?invite_token from URL, shows name+email+password form, calls a server action that creates auth user + profiles row with the invited role. (3) apps/web/app/auth/callback/route.ts — Supabase OAuth callback handler using supabaseServer(). (4) apps/web/middleware.ts — protect (hospital) routes, redirect unauthenticated to /auth/login. Reuse existing apps/web/components/auth/PatientLogin.tsx and TenantOnboarding.tsx where applicable.",

    // Sprint 13 — Missing pages + Realtime
    "S-IPD-NURSE": "Create apps/web/app/(hospital)/ipd/nurse-station/page.tsx backed by apps/web/components/ipd/NurseStation.tsx. The component has two panels: LEFT — patient selector (dropdown of admitted patients from beds+admissions), then vitals form with inputs: Systolic BP, Diastolic BP, HR (bpm), SpO2 (%), Temp (°C), Pain (0–10). On Save, insert into observations table with LOINC codes (85354-9 BP, 8867-4 HR, 59408-5 SpO2, 8310-5 Temp). RIGHT — nursing task board with three columns: Pending / In-Progress / Done. Tasks are fetched from a nursing_tasks table (create migration if needed). Drag-to-column or click-to-advance status. Wire Supabase Realtime subscription on observations for live refresh.",
    "S-REPORT-MIS": "Create apps/web/app/(hospital)/analytics/mis/page.tsx backed by apps/web/components/analytics/MISReport.tsx. Show a date range picker (this week / this month / custom). Metrics table: New Admissions (count admissions where created_at in range), Discharges (status=discharged), OPD Visits (encounters class=opd), Lab Tests (lab_samples count), Total Revenue (sum bills.total_amount). Department breakdown for each metric. 'Export CSV' button: generate a Blob from the table data and trigger download. Server action in apps/web/app/(hospital)/analytics/mis/actions.ts queries Supabase with tenant_id filter via jwt_tenant().",
    "S-OPD-REALTIME": "Replace the polling interval in apps/web/components/opd/LiveQueueBoard.tsx with Supabase Realtime. Use supabase.channel('queue').on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tokens', filter: `tenant_id=eq.${tenantId}` }, handler).subscribe(). Remove any setInterval/polling code. The handler should merge the changed row into local React state using a functional setState update. Add a green pulsing dot to the board header labelled 'Live' when the channel status is SUBSCRIBED.",

    // Sprint 14 — Razorpay + Patient Portal + Discharge
    "S-PAY-RAZORPAY": "Replace Stripe with Razorpay. (1) Delete apps/web/app/api/webhooks/stripe/route.ts. (2) Add razorpay package to apps/web/package.json. (3) Create apps/web/app/api/webhooks/razorpay/route.ts — verify Razorpay webhook signature using X-Razorpay-Signature header + RAZORPAY_WEBHOOK_SECRET, handle events: payment.captured → set tenant active, subscription.charged.failed → set past_due. (4) Create supabase/migrations/20261019000000_razorpay_billing.sql — add razorpay_subscription_id text, razorpay_customer_id text columns to tenant_subscriptions (ALTER TABLE ... ADD COLUMN IF NOT EXISTS). (5) Update apps/web/app/(marketing)/pricing/page.tsx to use Razorpay Checkout JS instead of Stripe — load script from checkout.razorpay.com/v1/checkout.js, call a server action that creates a Razorpay order. Add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET to .env.local.example.",
    "S-PATIENT-PORTAL": "Create the patient-facing portal under apps/web/app/(patient)/. (1) apps/web/app/(patient)/layout.tsx — check auth, ensure role=patient, show mobile-friendly bottom nav: Records | Prescriptions | Labs | Appointments. (2) apps/web/app/(patient)/records/page.tsx — encounter timeline (date, class, doctor, chief complaint) from encounters table. (3) apps/web/app/(patient)/prescriptions/page.tsx — list medication_requests (drug, dose, frequency, prescribing doctor, status). 'Download PDF' button stubs a server action that returns a signed URL. (4) apps/web/app/(patient)/labs/page.tsx — list diagnostic_reports, highlight rows where any result is flagged abnormal. (5) All pages use RLS (patient sees only their own data via jwt_tenant + auth.uid()).",
    "S-DISCHARGE": "Create the discharge workflow. (1) apps/web/app/(hospital)/ipd/discharge/[admissionId]/page.tsx backed by apps/web/components/ipd/DischargeWorkflow.tsx. Show a 5-item checklist: Discharge summary signed ✓, Final bill approved ✓, Medicines dispensed ✓, Patient instructions printed ✓, Transport arranged ✓. Each item is a checkbox. 'Confirm Discharge' button is enabled only when all 5 are checked. On confirm: server action sets admissions.status='discharged' and beds.status='cleaning'. (2) 'Export FHIR Bundle' button: server action in actions.ts assembles a FHIR R4 Bundle JSON (Encounter + Condition + MedicationRequest[] + DiagnosticReport[]) for the admission, uploads to Supabase Storage at fhir-exports/{tenant_id}/{admissionId}.json, returns a signed URL valid for 24 hours.",

    // Sprint 15 — Production readiness
    "S-INFRA-SENTRY": "Wire Sentry to web and mobile. (1) Add @sentry/nextjs to apps/web/package.json. Run npx @sentry/wizard@latest -i nextjs --saas (or manually): create apps/web/sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts with Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, tracesSampleRate: 0.2, environment: process.env.NODE_ENV }). Wrap apps/web/app/global-error.tsx as a Sentry error boundary. (2) Add @sentry/react-native to apps/mobile/package.json. Init in apps/mobile/app/_layout.tsx before the root provider. (3) Add NEXT_PUBLIC_SENTRY_DSN and SENTRY_AUTH_TOKEN to both apps' .env.local.example files. (4) Create apps/web/app/global-error.tsx with a user-friendly error page that calls Sentry.captureException.",
    "S-INFRA-CICD": "Create GitHub Actions CI/CD. (1) .github/workflows/ci.yml — triggers on pull_request to main: jobs: lint (pnpm lint), typecheck (pnpm --filter web exec tsc --noEmit), build (pnpm --filter web build). Uses pnpm/action-setup@v4 and node 20. (2) .github/workflows/cd.yml — triggers on push to main: calls Vercel Deploy Hook via curl (VERCEL_DEPLOY_HOOK_URL secret). Posts deploy URL to a Slack webhook (SLACK_WEBHOOK_URL secret) on success. (3) .github/workflows/nightly-backup.yml already exists — verify it has correct cron syntax. (4) Create .github/pull_request_template.md with: Summary, Test plan, Checklist (lint passes, types pass, Vercel preview checked).",
    "S-OT-BACKEND": "Create the OT scheduling backend. (1) Create supabase/migrations/20261102000000_ot_scheduling.sql — tables ot_rooms (id, tenant_id, name, floor, status) and ot_bookings (id, tenant_id, room_id, surgeon_id, patient_id, start_time, end_time, procedure_name, status). Add IF NOT EXISTS — these tables may already exist. (2) Create apps/web/app/api/ot/availability/route.ts — POST {room_id, start_time, end_time}: queries ot_bookings for overlapping rows (start < req.end AND end > req.start), returns { available: bool, conflict?: booking }. (3) Create apps/web/app/api/ot/surgeon-check/route.ts — POST {surgeon_id, start_time, end_time}: same overlap query filtered by surgeon_id. (4) Update apps/web/components/hospital/OTScheduler.tsx to call these endpoints before saving a booking.",
    "S-COMPLIANCE-ABDM": "Create the ABDM compliance checklist page. (1) apps/web/app/(hospital)/settings/compliance/page.tsx — static checklist with 5 sections: ABHA Linking Flow (status: done), Consent Manager Integration (status: in-progress), FHIR R4 Profile Conformance (status: pending), PHI Encryption at Rest (status: done — Supabase AES-256), Audit Log Completeness (status: done). Each row shows: requirement, status badge, and the relevant file path as a code link. (2) Create apps/web/app/api/fhir/validate/route.ts — POST a FHIR resource JSON, validate required fields (resourceType, id, meta.profile) against ABDM profile rules (hardcoded checks), return { valid: bool, errors: [{field, message}] }. Add compliance link to the Settings section of the hospital sidebar.",
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
