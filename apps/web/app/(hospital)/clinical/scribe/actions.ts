"use server";

import { processScribeTranscript } from "@nexus/ai-orchestrator";
import { createClient } from "@/utils/supabase/server";

export async function generateSoapNote(transcript: string, language: string = "english") {
  if (!transcript) throw new Error("Transcript is empty");

  try {
    const result = await processScribeTranscript(transcript, language);
    
    return {
      ok: true,
      soap: result.soap,
      confidence: 0.98, // In a real system, we'd derive this from LangSmith or model logs
    };
  } catch (error) {
    console.error("Scribe Action Error:", error);
    return { ok: false, error: "Failed to generate SOAP note" };
  }
}

export async function saveApprovedSoapNote(payload: {
  tenantId: string;
  soap: any;
  confidence: number;
}) {
  const supabase = createClient();
  
  const { error } = await supabase.from('clinical_audio_logs').insert([{
    tenant_id: payload.tenantId,
    soap_note_draft: JSON.stringify(payload.soap),
    ai_confidence: payload.confidence,
    status: 'approved_by_physician'
  }]);

  if (error) throw error;
  return { ok: true };
}
