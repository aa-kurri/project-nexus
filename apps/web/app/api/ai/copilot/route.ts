import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { strictLimiter } from "@/lib/rate-limit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Ayura Copilot, an AI clinical assistant embedded in Ayura OS — a hospital management system.
You answer clinicians' questions using real patient notes retrieved from the hospital's EMR.

Guidelines:
- Answer concisely and in plain clinical English
- Always cite which note or encounter your information comes from when relevant (e.g., "From the 12 Apr SOAP note: …")
- If the context does not contain enough information to answer, say so clearly
- Never fabricate lab values, diagnoses, or medications
- You may suggest clinical considerations but always recommend the clinician verify with the full chart
- Format your answer with markdown for readability (bold key terms, use lists for multiple items)`;

/**
 * POST /api/ai/copilot
 *
 * Body: { question: string; patientId?: string }
 *
 * 1. Fetches the most recent doctor_notes for the patient (or globally) as RAG context.
 * 2. Passes context + question to Claude claude-sonnet-4-6 with a cached system prompt.
 * 3. Returns { answer: string; sourceCount: number }
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = strictLimiter.check(`copilot:${ip}`);
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

  let body: { question?: string; patientId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { question, patientId } = body;
  if (!question?.trim()) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  // ── Retrieve relevant doctor_notes as RAG context ─────────────────────────
  let notesQuery = supabase
    .from("doctor_notes")
    .select("id, patient_id, transcript, soap, created_at, encounter_id")
    .order("created_at", { ascending: false })
    .limit(patientId ? 15 : 10);

  if (patientId) {
    notesQuery = notesQuery.eq("patient_id", patientId);
  }

  const { data: notes } = await notesQuery;

  // Build context block from retrieved notes
  const contextChunks: string[] = [];
  for (const note of notes ?? []) {
    const n = note as {
      id: string;
      patient_id: string;
      transcript: string | null;
      soap: Record<string, string> | null;
      created_at: string;
      encounter_id: string;
    };

    const date = new Date(n.created_at).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });

    const chunks: string[] = [`[Note — ${date} | encounter: ${n.encounter_id.slice(0, 8)}]`];

    if (n.soap) {
      if (n.soap.subjective)  chunks.push(`S: ${n.soap.subjective}`);
      if (n.soap.objective)   chunks.push(`O: ${n.soap.objective}`);
      if (n.soap.assessment)  chunks.push(`A: ${n.soap.assessment}`);
      if (n.soap.plan)        chunks.push(`P: ${n.soap.plan}`);
    } else if (n.transcript) {
      chunks.push(`Transcript: ${n.transcript.slice(0, 800)}`);
    }

    contextChunks.push(chunks.join("\n"));
  }

  const contextBlock = contextChunks.length > 0
    ? contextChunks.join("\n\n---\n\n")
    : "No clinical notes found for this patient in the EMR.";

  // ── Call Claude with cached system prompt + context ───────────────────────
  const userMessage = `PATIENT EMR CONTEXT:\n${contextBlock}\n\n---\n\nCLINICIAN QUESTION:\n${question}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const answer = textBlock?.type === "text" ? textBlock.text : "No response generated.";

  return NextResponse.json({ answer, sourceCount: (notes ?? []).length });
}
