"use server";

import { z } from "zod";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const MedicationSchema = z.object({
  id:           z.string().min(1),
  drug:         z.string().min(1),
  dose:         z.string().default(""),
  freq:         z.string().default(""),
  duration:     z.string().default(""),
  instructions: z.string().default(""),
});

const SaveRxSchema = z.object({
  sessionId:   z.string().min(1),
  diagnosis:   z.string().default(""),
  medications: z.array(MedicationSchema),
  notes:       z.string().default(""),
});

// ── startSession ─────────────────────────────────────────────────────────────

export async function startSession(
  appointmentId: string,
): Promise<{ ok: true; sessionId: string; roomUrl: string } | { ok: false; error: string }> {
  if (!appointmentId) return { ok: false as const, error: "Missing appointment ID" };

  // TODO: implement with real Supabase + Daily.co / LiveKit
  // 1. Verify the appointment_bookings row belongs to this tenant:
  //    const { data: booking } = await sb
  //      .from("appointment_bookings")
  //      .select("id, patient_id, practitioner_id")
  //      .eq("id", appointmentId)
  //      .single();
  //    if (!booking) return { ok: false, error: "Appointment not found" };
  //
  // 2. Create a Daily.co room via REST API:
  //    POST https://api.daily.co/v1/rooms
  //    body: { name: `ayura-${appointmentId}`, privacy: "private", exp: Date.now()/1000 + 3600 }
  //
  // 3. Insert teleconsult_sessions row:
  //    const { data: session } = await sb.from("teleconsult_sessions").insert({
  //      tenant_id: ...,
  //      appointment_booking_id: appointmentId,
  //      patient_id: booking.patient_id,
  //      practitioner_id: booking.practitioner_id,
  //      room_name: room.name,
  //      room_url: room.url,
  //      status: "in-progress",
  //      started_at: new Date().toISOString(),
  //    }).select("id").single();
  //
  // 4. Append audit_log entry: "teleconsult.started"

  await new Promise((r) => setTimeout(r, 800));
  const sessionId = `ses_${Math.random().toString(36).slice(2, 10)}`;
  return {
    ok: true as const,
    sessionId,
    roomUrl: `https://ayura.daily.co/room-${appointmentId}`,
  };
}

// ── endSession ───────────────────────────────────────────────────────────────

export async function endSession(
  sessionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!sessionId) return { ok: false as const, error: "Missing session ID" };

  // TODO: implement with real Supabase
  // 1. Update teleconsult_sessions:
  //    await sb.from("teleconsult_sessions")
  //      .update({ status: "ended", ended_at: new Date().toISOString() })
  //      .eq("id", sessionId);
  //
  // 2. Optionally delete the Daily.co room to free capacity:
  //    DELETE https://api.daily.co/v1/rooms/:room_name
  //
  // 3. Append audit_log entry: "teleconsult.ended"

  await new Promise((r) => setTimeout(r, 400));
  return { ok: true as const };
}

// ── savePrescription ─────────────────────────────────────────────────────────

export async function savePrescription(input: {
  sessionId:   string;
  diagnosis:   string;
  medications: { id: string; drug: string; dose: string; freq: string; duration: string; instructions: string }[];
  notes:       string;
}): Promise<{ ok: true; rxId: string } | { ok: false; error: string }> {
  const parsed = SaveRxSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok:    false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid prescription data",
    };
  }

  // TODO: implement with real Supabase
  // Validated payload available as parsed.data: { sessionId, diagnosis, medications, notes }
  //
  // 1. Resolve session context:
  //    const { data: session } = await sb.from("teleconsult_sessions")
  //      .select("tenant_id, patient_id, encounter_id, practitioner_id")
  //      .eq("id", parsed.data.sessionId)
  //      .single();
  //
  // 2. Bulk-insert medication_requests (one row per drug):
  //    await sb.from("medication_requests").insert(
  //      parsed.data.medications.map((m) => ({
  //        tenant_id:               session.tenant_id,
  //        patient_id:              session.patient_id,
  //        encounter_id:            session.encounter_id,
  //        requester_id:            session.practitioner_id,
  //        teleconsult_session_id:  parsed.data.sessionId,
  //        medication_code:         m.drug,
  //        display:                 m.drug,
  //        dosage_instruction:      `${m.dose} — ${m.freq} for ${m.duration}. ${m.instructions}`.trim(),
  //        status:                  "active",
  //      }))
  //    );
  //
  // 3. Stamp session with diagnosis + notes:
  //    await sb.from("teleconsult_sessions")
  //      .update({ diagnosis: parsed.data.diagnosis, notes: parsed.data.notes, updated_at: new Date().toISOString() })
  //      .eq("id", parsed.data.sessionId);
  //
  // 4. Append audit_log entry: "prescription.signed"

  await new Promise((r) => setTimeout(r, 700));
  return { ok: true as const, rxId: `Rx-${Date.now()}` };
}
