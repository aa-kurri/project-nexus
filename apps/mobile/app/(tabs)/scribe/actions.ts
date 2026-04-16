"use server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SOAPNote {
  Subjective: string;
  Objective:  string;
  Assessment: string;
  Plan:       string;
}

export interface SaveNotePayload {
  patientId:   string;
  transcript:  string;
  soap:        SOAPNote;
  encounterId?: string; // if already open, attach to existing encounter
}

export interface SaveNoteResult {
  encounterId: string;
  noteId:      string;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Generate a SOAP note from a raw transcript using an AI model.
 *
 * TODO: implement:
 *   - Call Anthropic Messages API (claude-sonnet-4-6) with system prompt:
 *       "You are a clinical documentation assistant. Parse the transcript
 *        and extract Subjective, Objective, Assessment, Plan sections."
 *   - Stream the response back to the client using Server-Sent Events or
 *     React Server Actions streaming.
 *   - Apply prompt caching on the system prompt for repeated calls.
 *
 * Example prompt caching header:
 *   { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }
 */
export async function generateSOAP(transcript: string): Promise<SOAPNote> {
  // TODO: replace with real Anthropic API call
  throw new Error("generateSOAP: not yet implemented");
}

/**
 * Save a completed SOAP note to the encounters table.
 *
 * TODO: implement:
 *   1. If encounterId provided, update encounters SET reason = soap.Assessment,
 *      metadata = jsonb_set(metadata, '{soap}', ...) WHERE id = encounterId
 *   2. If no encounterId, INSERT into encounters:
 *      { patient_id, practitioner_id: auth.uid(), class: 'opd', status: 'finished',
 *        reason: soap.Assessment, metadata: { soap, transcript } }
 *   3. Insert audit_log entry (HMAC chain):
 *      { actor_id: auth.uid(), action: 'scribe.save_note', resource_id: encounterId }
 *   All ops scoped by tenant_id = jwt_tenant().
 */
export async function saveNote(payload: SaveNotePayload): Promise<SaveNoteResult> {
  // TODO: replace with real Supabase mutations
  throw new Error("saveNote: not yet implemented");
}

/**
 * Upload a raw audio blob to Supabase Storage for archival / re-processing.
 *
 * TODO: implement:
 *   supabase.storage.from("scribe-audio")
 *     .upload(`${jwtTenant()}/${encounterId}/${Date.now()}.webm`, audioBlob, {
 *       contentType: "audio/webm;codecs=opus",
 *       upsert: false,
 *     })
 */
export async function uploadAudio(encounterId: string, audioBase64: string): Promise<string> {
  // TODO: replace with real Supabase Storage upload
  throw new Error("uploadAudio: not yet implemented");
}
