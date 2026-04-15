// Supabase Edge Function — S-WEARABLE-1
// Accepts a POST body of wearable metric arrays and inserts them into the
// public.observations table as FHIR Observations (LOINC coded).
//
// Deploy: supabase functions deploy wearable-ingest
// Auth:   Bearer token (patient's Supabase JWT) required; tenant_id is
//         extracted from the JWT claim via public.jwt_tenant().
//
// POST /functions/v1/wearable-ingest
// Body:
// {
//   "patient_id": "<uuid>",       // required
//   "encounter_id": "<uuid>",     // optional
//   "metrics": [
//     {
//       "code":         "55423-8",                     // LOINC code
//       "code_system":  "http://loinc.org",
//       "display":      "Number of steps ...",
//       "value_num":    8750,
//       "value_unit":   "steps/day",
//       "effective_at": "2026-04-14T08:00:00Z",        // ISO-8601
//       "source":       "apple_health" | "google_fit"  // stored in metadata
//     },
//     ...
//   ]
// }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WearableMetric {
  code: string;
  code_system?: string;
  display: string;
  value_num: number;
  value_unit?: string;
  effective_at?: string;
  source?: string;
}

interface IngestRequest {
  patient_id: string;
  encounter_id?: string;
  metrics: WearableMetric[];
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function isValidUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  );
}

function validateBody(body: unknown): IngestRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }
  const b = body as Record<string, unknown>;

  if (!isValidUuid(b.patient_id)) {
    throw new Error("`patient_id` must be a valid UUID.");
  }
  if (b.encounter_id !== undefined && !isValidUuid(b.encounter_id)) {
    throw new Error("`encounter_id` must be a valid UUID when provided.");
  }
  if (!Array.isArray(b.metrics) || b.metrics.length === 0) {
    throw new Error("`metrics` must be a non-empty array.");
  }

  for (const [i, m] of (b.metrics as unknown[]).entries()) {
    if (!m || typeof m !== "object") throw new Error(`metrics[${i}] must be an object.`);
    const metric = m as Record<string, unknown>;
    if (typeof metric.code !== "string" || !metric.code.trim()) {
      throw new Error(`metrics[${i}].code is required.`);
    }
    if (typeof metric.display !== "string" || !metric.display.trim()) {
      throw new Error(`metrics[${i}].display is required.`);
    }
    if (typeof metric.value_num !== "number" || !isFinite(metric.value_num)) {
      throw new Error(`metrics[${i}].value_num must be a finite number.`);
    }
  }

  return b as unknown as IngestRequest;
}

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
} as const;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // Build Supabase client with the caller's JWT so RLS applies
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  // Parse + validate body
  let body: IngestRequest;
  try {
    body = validateBody(await req.json());
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  // Resolve tenant_id from the JWT claim (mirrors public.jwt_tenant())
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized — valid JWT required." }),
      { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  const tenantId: string | undefined =
    (user.app_metadata?.tenant_id as string | undefined) ??
    (user.user_metadata?.tenant_id as string | undefined);

  if (!isValidUuid(tenantId)) {
    return new Response(
      JSON.stringify({ error: "JWT is missing a valid tenant_id claim." }),
      { status: 403, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  // Map each metric to an observations row
  const rows = body.metrics.map((m: WearableMetric) => ({
    tenant_id: tenantId,
    patient_id: body.patient_id,
    encounter_id: body.encounter_id ?? null,
    code: m.code,
    code_system: m.code_system ?? "http://loinc.org",
    display: m.display,
    value_num: m.value_num,
    value_unit: m.value_unit ?? null,
    value_text: null,
    status: "final" as const,
    effective_at: m.effective_at ?? new Date().toISOString(),
    // source + wearable flag stored in a metadata column added by migration
    // 20260414140000_wearable_ingest.sql
    metadata: {
      source: m.source ?? "wearable",
      ingested_at: new Date().toISOString(),
    },
  }));

  const { data, error: insertErr } = await supabase
    .from("observations")
    .insert(rows)
    .select("id");

  if (insertErr) {
    console.error("wearable-ingest insert error:", insertErr);
    return new Response(
      JSON.stringify({ error: "Failed to insert observations.", detail: insertErr.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      inserted: data?.length ?? rows.length,
      ids: data?.map((r: { id: string }) => r.id),
    }),
    { status: 201, headers: { ...CORS, "Content-Type": "application/json" } }
  );
});
