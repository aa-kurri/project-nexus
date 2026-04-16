import { NextRequest, NextResponse } from "next/server";
import { processScribeLive } from "@nexus/ai-orchestrator";

/**
 * Transcribes an audio Blob via Groq Whisper.
 * Falls back to a stub transcript when GROQ_API_KEY is not set.
 */
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    // TODO: configure GROQ_API_KEY in .env.local for real speech-to-text
    return (
      "Patient presented with mild pain in the left upper quadrant for the past two days. " +
      "Pain is described as intermittent and dull in nature. No associated fever, nausea, or vomiting reported. " +
      "Patient has a history of acid reflux and takes antacids occasionally. " +
      "On examination, abdomen is soft and non-tender. Bowel sounds present."
    );
  }

  const form = new FormData();
  form.append("file", audioBlob, "recording.webm");
  form.append("model", "whisper-large-v3");
  form.append("response_format", "json");
  form.append("language", "en");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groqApiKey}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq Whisper error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return (data.text as string) ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as Blob | null;

    if (!audio) {
      return NextResponse.json(
        { error: "Missing 'audio' field in FormData" },
        { status: 400 }
      );
    }

    // Step 1: speech-to-text
    const transcript = await transcribeAudio(audio);

    if (!transcript.trim()) {
      return NextResponse.json(
        { error: "Transcription produced empty text — nothing to process" },
        { status: 422 }
      );
    }

    // Step 2: generate SOAP note via Claude
    const { soap } = await processScribeLive(transcript);

    return NextResponse.json({ transcript, soap });
  } catch (err) {
    console.error("[/api/ai/scribe]", err);
    return NextResponse.json(
      { error: "Failed to process clinical recording" },
      { status: 500 }
    );
  }
}
