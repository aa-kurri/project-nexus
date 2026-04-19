// scribe/actions.ts — real Supabase + Anthropic implementation
import { supabase } from "../../../lib/supabase";

export interface SOAPNote {
  Subjective: string;
  Objective:  string;
  Assessment: string;
  Plan:       string;
}

export interface SaveNotePayload {
  patientId:    string;
  transcript:   string;
  soap:         SOAPNote;
  encounterId?: string;
}

export interface SaveNoteResult {
  encounterId: string;
  noteId:      string;
}

/**
 * Generate a SOAP note from a raw transcript.
 * Calls the web app's /api/ai/scribe endpoint (set EXPO_PUBLIC_WEB_URL).
 * Falls back to a mock structure if the endpoint is unreachable.
 */
export async function generateSOAP(transcript: string): Promise<SOAPNote> {
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL ?? "";

  if (!webUrl) {
    // No web URL configured — return structured placeholder
    return {
      Subjective: transcript.slice(0, 200),
      Objective:  "Vitals and physical exam findings pending.",
      Assessment: "Clinical assessment pending AI processing.",
      Plan:       "Set EXPO_PUBLIC_WEB_URL to enable AI SOAP generation.",
    };
  }

  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token ?? "";

  const formData = new FormData();
  // For mobile we send the transcript text directly (no audio blob)
  formData.append("transcript_text", transcript);

  const res = await fetch(`${webUrl}/api/ai/scribe`, {
    method:  "POST",
    headers: { Authorization: `Bearer ${token}` },
    body:    formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Scribe API error ${res.status}: ${errText}`);
  }

  const json: { soap?: SOAPNote } = await res.json();
  if (!json.soap) throw new Error("Scribe API returned no SOAP note");
  return json.soap;
}

/**
 * Save a completed SOAP note:
 * - If encounterId provided, update encounters.metadata with SOAP
 * - Otherwise insert a new finished encounter with reason = soap.Assessment
 * - Append an audit_log entry
 */
export async function saveNote(payload: SaveNotePayload): Promise<SaveNoteResult> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  let encounterId = payload.encounterId;

  if (encounterId) {
    // Update existing encounter
    const { error } = await supabase
      .from("encounters")
      .update({
        reason:    payload.soap.Assessment,
        metadata:  { soap: payload.soap, transcript: payload.transcript },
      } as any)
      .eq("id", encounterId);

    if (error) throw new Error(error.message);
  } else {
    // Create a new finished encounter
    const { data, error } = await supabase
      .from("encounters")
      .insert({
        patient_id:      payload.patientId,
        practitioner_id: userId,
        class:           "opd",
        status:          "finished",
        reason:          payload.soap.Assessment,
        metadata:        { soap: payload.soap, transcript: payload.transcript },
      } as any)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    encounterId = data.id;
  }

  // Best-effort audit log
  await supabase.from("audit_log").insert({
    actor_id:       userId,
    action:         "scribe.save_note",
    payload:        { patient_id: payload.patientId, encounter_id: encounterId },
    hash_signature: "mobile-scribe",
  } as any).then(() => null);

  return { encounterId: encounterId!, noteId: encounterId! };
}

/**
 * Upload raw audio (base64) to Supabase Storage for archival.
 * Returns the public path of the uploaded file.
 */
export async function uploadAudio(encounterId: string, audioBase64: string): Promise<string> {
  const bytes    = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
  const blob     = new Blob([bytes], { type: "audio/webm;codecs=opus" });
  const path     = `${encounterId}/${Date.now()}.webm`;

  const { error } = await supabase.storage
    .from("scribe-audio")
    .upload(path, blob, { contentType: "audio/webm;codecs=opus", upsert: false });

  if (error) throw new Error(error.message);
  return path;
}
