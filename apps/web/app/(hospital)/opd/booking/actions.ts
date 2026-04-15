"use server";

import { z } from "zod";

const BookSlotSchema = z.object({
  slotId:         z.string().min(1),
  practitionerId: z.string().min(1),
  slotDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "slotDate must be YYYY-MM-DD"),
  startTime:      z.string().min(1),
  patientName:    z.string().min(2, "Name too short"),
  patientPhone:   z.string().min(7, "Invalid phone"),
  reason:         z.string().optional(),
});

export async function bookSlot(input: z.infer<typeof BookSlotSchema>) {
  const parsed = BookSlotSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // TODO: implement with Supabase (see pattern in app/(hospital)/opd/new-patient/actions.ts)
  //
  // 1. Row-lock and verify slot is still available:
  //    const { data: slot } = await sb
  //      .from("appointment_slots")
  //      .select("id, status")
  //      .eq("id", parsed.data.slotId)
  //      .eq("tenant_id", tenantId)
  //      .single()
  //    if (slot?.status !== "available") return { ok: false, error: "Slot no longer available" }
  //
  // 2. Find or create patient by phone (tenant-scoped):
  //    let { data: patient } = await sb.from("patients")
  //      .select("id").eq("phone", parsed.data.patientPhone).maybeSingle()
  //    if (!patient) {
  //      const { data: p } = await sb.from("patients").insert({
  //        tenant_id: tenantId, phone: parsed.data.patientPhone,
  //        full_name: parsed.data.patientName, mrn: generateMRN(), gender: "unknown",
  //      }).select("id").single()
  //      patient = p
  //    }
  //
  // 3. Atomically mark slot booked and create booking record:
  //    await sb.from("appointment_slots").update({ status: "booked" }).eq("id", parsed.data.slotId)
  //    const { data: booking } = await sb.from("appointment_bookings").insert({
  //      tenant_id: tenantId,
  //      slot_id: parsed.data.slotId,
  //      patient_id: patient?.id,
  //      patient_name: parsed.data.patientName,
  //      patient_phone: parsed.data.patientPhone,
  //      practitioner_id: parsed.data.practitionerId,
  //      slot_date: parsed.data.slotDate,
  //      start_time: parsed.data.startTime,
  //      reason: parsed.data.reason,
  //      booked_by: currentUserId,   // null for patient self-bookings
  //    }).select("id").single()
  //
  // 4. Append audit_log "appointment.booked" with HMAC chain
  // 5. Trigger WhatsApp confirmation via WhatsApp Concierge service

  await new Promise(r => setTimeout(r, 700));
  return { ok: true as const, bookingId: `BK-${Date.now().toString(36).toUpperCase()}` };
}
