// queue/actions.ts — real Supabase implementation
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/authStore";

export type QueueStatus = "waiting" | "in_progress" | "done" | "skipped";

export interface QueueToken {
  id:           string;
  token_number: number;
  status:       QueueStatus;
  called_at:    string | null;
  patient_id:   string;
  patient_name: string;
  complaint:    string | null;
  created_at:   string;
}

/** Fetch today's queue for the logged-in practitioner */
export async function fetchTodayQueue(practitionerId: string, tenantId: string): Promise<QueueToken[]> {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("queue_tokens")
    .select(`
      id, token_number, status, called_at, created_at,
      patient_id,
      patients ( full_name ),
      encounters ( reason )
    `)
    .eq("tenant_id", tenantId)
    .eq("practitioner_id", practitionerId)
    .eq("token_date", today)
    .order("token_number", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id:           row.id,
    token_number: row.token_number,
    status:       row.status as QueueStatus,
    called_at:    row.called_at,
    patient_id:   row.patient_id,
    patient_name: row.patients?.full_name ?? "Unknown",
    complaint:    row.encounters?.reason ?? null,
    created_at:   row.created_at,
  }));
}

/** Advance: mark the next waiting token as in_progress */
export async function callNextPatient(practitionerId: string, tenantId: string): Promise<string | null> {
  const today = new Date().toISOString().slice(0, 10);

  // Find the next waiting token
  const { data: next } = await supabase
    .from("queue_tokens")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("practitioner_id", practitionerId)
    .eq("token_date", today)
    .eq("status", "waiting")
    .order("token_number", { ascending: true })
    .limit(1)
    .single();

  if (!next) return null;

  // Mark current in_progress as done
  await supabase
    .from("queue_tokens")
    .update({ status: "done" })
    .eq("tenant_id", tenantId)
    .eq("practitioner_id", practitionerId)
    .eq("token_date", today)
    .eq("status", "in_progress");

  // Advance next to in_progress
  await supabase
    .from("queue_tokens")
    .update({ status: "in_progress", called_at: new Date().toISOString() })
    .eq("id", next.id);

  return next.id;
}
