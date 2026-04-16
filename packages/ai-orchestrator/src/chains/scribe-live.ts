import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Stable system prompt — cached with ephemeral cache_control to save tokens on repeated calls
const SOAP_SYSTEM_PROMPT = `You are a clinical AI scribe for Ayura OS, a hospital management platform.
Your task is to convert a raw doctor-patient consultation transcript into a structured SOAP note.

Output ONLY valid JSON in this exact format — no markdown, no code fences, no preamble:
{
  "subjective": "Patient symptoms, chief complaint, history, and concerns as reported",
  "objective": "Physical examination findings, vital signs, and observable clinical data mentioned",
  "assessment": "Clinical impression, possible diagnoses, and differential diagnoses",
  "plan": "Treatment plan: medications prescribed, tests ordered, referrals, and follow-up instructions"
}

Guidelines:
- Output must always be in English for clinical record consistency
- Use professional medical terminology throughout
- Be concise but clinically complete
- If a SOAP section has no data in the transcript, write "Not documented"
- Never wrap output in markdown code blocks — return raw JSON only`;

export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface ScribeLiveResult {
  soap: SoapNote;
}

export async function processScribeLive(
  transcript: string
): Promise<ScribeLiveResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // TODO: stub fallback when ANTHROPIC_API_KEY is not set
    return {
      soap: {
        subjective: transcript,
        objective: "Not documented",
        assessment: "Pending AI analysis — ANTHROPIC_API_KEY not configured",
        plan: "Not documented",
      },
    };
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: SOAP_SYSTEM_PROMPT,
        // Cache the system prompt — it's identical across all scribe requests
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Consultation transcript:\n\n${transcript}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content for SOAP generation");
  }

  // Strip markdown code fences if the model adds them despite instructions
  const rawText = textBlock.text
    .replace(/^```(?:json)?\r?\n?/, "")
    .replace(/\r?\n?```$/, "")
    .trim();

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`Claude SOAP response was not valid JSON: ${rawText.slice(0, 200)}`);
  }

  return {
    soap: {
      subjective: parsed.subjective ?? "Not documented",
      objective: parsed.objective ?? "Not documented",
      assessment: parsed.assessment ?? "Not documented",
      plan: parsed.plan ?? "Not documented",
    },
  };
}
