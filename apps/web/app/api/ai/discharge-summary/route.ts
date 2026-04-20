import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { apiLimiter } from "@/lib/rate-limit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a clinical documentation AI for Ayura OS hospital management system.
Generate a structured hospital discharge summary from the clinical data provided.

Output ONLY valid JSON in this exact format — no markdown, no code fences:
{
  "diagnosis": "Primary and secondary diagnoses",
  "hospitalCourse": "Summary of inpatient stay: presenting complaint, treatment given, response to treatment",
  "proceduresDone": "Procedures, surgeries, or interventions performed during admission",
  "labHighlights": "Significant laboratory or imaging findings",
  "medicationsOnDischarge": "Medications prescribed at discharge with doses",
  "followUpInstructions": "Follow-up appointments, activity restrictions, and warning signs",
  "condition": "Condition at discharge: stable / improved / guarded / etc."
}

If any section has no data, write "Not documented" for that field. Return raw JSON only — never wrap in markdown.`;

/**
 * POST /api/ai/discharge-summary
 *
 * Body: { encounterId: string }
 *
 * Fetches SOAP notes + medications + lab samples for the encounter,
 * then generates a structured discharge summary via Claude.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = apiLimiter.check(`discharge:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { encounterId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { encounterId } = body;
  if (!encounterId) {
    return NextResponse.json({ error: "encounterId is required" }, { status: 400 });
  }

  // ── Fetch all clinical data for this encounter ───────────────────────────
  const [notesRes, rxRes, labsRes, encounterRes] = await Promise.all([
    supabase
      .from("doctor_notes")
      .select("soap, transcript, created_at")
      .eq("encounter_id", encounterId)
      .order("created_at", { ascending: true }),

    supabase
      .from("medication_requests")
      .select("drug_name, dose, frequency, duration_days, status")
      .eq("encounter_id", encounterId),

    supabase
      .from("lab_samples")
      .select("sample_type, status")
      .eq("encounter_id", encounterId),

    supabase
      .from("encounters")
      .select("class, reason, status, started_at, patient_id")
      .eq("id", encounterId)
      .single(),
  ]);

  const notes   = notesRes.data   ?? [];
  const meds    = rxRes.data      ?? [];
  const labs    = labsRes.data    ?? [];
  const encounter = encounterRes.data;

  // ── Build clinical context string ────────────────────────────────────────
  const lines: string[] = [];

  if (encounter) {
    lines.push(`ENCOUNTER: Class=${encounter.class}, Reason=${encounter.reason ?? "Not documented"}, Status=${encounter.status}`);
    lines.push(`Admission date: ${encounter.started_at ? new Date(encounter.started_at).toLocaleDateString("en-IN") : "Unknown"}`);
  }

  if (notes.length > 0) {
    lines.push("\nCLINICAL NOTES (SOAP):");
    for (const n of notes as Array<{ soap: Record<string, string> | null; transcript: string | null; created_at: string }>) {
      const date = new Date(n.created_at).toLocaleDateString("en-IN");
      if (n.soap) {
        lines.push(`[${date}] S: ${n.soap.subjective ?? ""} | O: ${n.soap.objective ?? ""} | A: ${n.soap.assessment ?? ""} | P: ${n.soap.plan ?? ""}`);
      } else if (n.transcript) {
        lines.push(`[${date}] Transcript: ${n.transcript.slice(0, 500)}`);
      }
    }
  }

  if (meds.length > 0) {
    lines.push("\nMEDICATIONS DURING STAY:");
    for (const m of meds as Array<{ drug_name: string; dose: string; frequency: string; duration_days: number; status: string }>) {
      lines.push(`- ${m.drug_name} ${m.dose ?? ""} ${m.frequency ?? ""} for ${m.duration_days ?? "?"} days (${m.status})`);
    }
  }

  if (labs.length > 0) {
    lines.push("\nLAB SAMPLES COLLECTED:");
    for (const l of labs as Array<{ sample_type: string; status: string }>) {
      lines.push(`- ${l.sample_type} (${l.status})`);
    }
  }

  const clinicalContext = lines.join("\n") || "No clinical data available for this encounter.";

  // ── Generate discharge summary via Claude ────────────────────────────────
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Generate a discharge summary for this encounter:\n\n${clinicalContext}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No response from Claude" }, { status: 502 });
  }

  const rawText = textBlock.text
    .replace(/^```(?:json)?\r?\n?/, "")
    .replace(/\r?\n?```$/, "")
    .trim();

  let summary: Record<string, string>;
  try {
    summary = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: "Claude returned invalid JSON", raw: rawText.slice(0, 300) }, { status: 502 });
  }

  return NextResponse.json({ summary });
}
