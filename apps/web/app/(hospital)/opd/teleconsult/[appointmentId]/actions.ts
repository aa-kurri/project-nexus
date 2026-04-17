"use server";

import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

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

  const supabase = await createClient();

  // 1. Verify the appointment booking belongs to this tenant
  const { data: booking, error: bookingErr } = await supabase
    .from("appointment_bookings")
    .select("id, patient_id, practitioner_id, encounter_id")
    .eq("id", appointmentId)
    .single();

  if (bookingErr || !booking) {
    return { ok: false as const, error: "Appointment not found" };
  }

  const b = booking as {
    id: string;
    patient_id: string;
    practitioner_id: string;
    encounter_id: string | null;
  };

  // 2. Generate a room name (Daily.co / LiveKit room URL when credentials are configured)
  const roomName = `ayura-${appointmentId.slice(0, 8)}`;
  const roomUrl  = `https://ayura.daily.co/${roomName}`;

  // 3. Insert teleconsult_sessions row
  const { data: session, error: sessionErr } = await supabase
    .from("teleconsult_sessions")
    .insert({
      appointment_booking_id: b.id,
      patient_id:             b.patient_id,
      practitioner_id:        b.practitioner_id,
      encounter_id:           b.encounter_id,
      room_name:              roomName,
      room_url:               roomUrl,
      status:                 "in-progress",
      started_at:             new Date().toISOString(),
    })
    .select("id")
    .single();

  if (sessionErr || !session) {
    return { ok: false as const, error: sessionErr?.message ?? "Failed to create session" };
  }

  return {
    ok:        true as const,
    sessionId: (session as { id: string }).id,
    roomUrl,
  };
}

// ── endSession ───────────────────────────────────────────────────────────────

export async function endSession(
  sessionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!sessionId) return { ok: false as const, error: "Missing session ID" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("teleconsult_sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) return { ok: false as const, error: error.message };
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

  const supabase = await createClient();
  const d = parsed.data;

  // 1. Resolve session context
  const { data: session, error: sessErr } = await supabase
    .from("teleconsult_sessions")
    .select("tenant_id, patient_id, encounter_id, practitioner_id")
    .eq("id", d.sessionId)
    .single();

  if (sessErr || !session) {
    return { ok: false as const, error: "Session not found" };
  }

  const s = session as {
    tenant_id: string;
    patient_id: string;
    encounter_id: string | null;
    practitioner_id: string;
  };

  // 2. Bulk-insert medication_requests (one row per drug)
  if (d.medications.length > 0) {
    const { error: rxErr } = await supabase.from("medication_requests").insert(
      d.medications.map((m) => ({
        tenant_id:        s.tenant_id,
        patient_id:       s.patient_id,
        encounter_id:     s.encounter_id,
        requester_id:     s.practitioner_id,
        medication_code:  m.drug,
        display:          m.drug,
        dosage_instruction: [m.dose, m.freq, m.duration ? `for ${m.duration}` : "", m.instructions]
          .filter(Boolean)
          .join(" — ")
          .trim(),
        status:           "active",
      }))
    );

    if (rxErr) return { ok: false as const, error: rxErr.message };
  }

  // 3. Stamp session with diagnosis + notes
  await supabase
    .from("teleconsult_sessions")
    .update({
      diagnosis:  d.diagnosis,
      notes:      d.notes,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("id", d.sessionId);

  return { ok: true as const, rxId: `Rx-${Date.now()}` };
}
