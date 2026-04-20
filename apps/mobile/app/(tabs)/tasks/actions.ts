// tasks/actions.ts — real Supabase implementation
import { supabase } from "../../../lib/supabase";

export type Priority = "urgent" | "normal" | "low";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Task {
  id:           string;
  title:        string;
  patient_name: string;
  bed_label:    string | null;
  priority:     Priority;
  status:       TaskStatus;
  due_at:       string | null;
}

/** Fetch all tasks assigned to the current user today */
export async function fetchMyTasks(userId: string, tenantId: string): Promise<Task[]> {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("nursing_tasks")
    .select(`
      id, title, priority, status, due_at,
      patients ( full_name ),
      beds ( label )
    `)
    .eq("tenant_id", tenantId)
    .eq("assigned_to", userId)
    .neq("status", "completed")
    .gte("due_at", `${today}T00:00:00`)
    .lte("due_at", `${today}T23:59:59`)
    .order("priority", { ascending: false })
    .order("due_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id:           row.id,
    title:        row.title,
    patient_name: row.patients?.full_name ?? "Unknown",
    bed_label:    row.beds?.label ?? null,
    priority:     row.priority as Priority,
    status:       row.status as TaskStatus,
    due_at:       row.due_at,
  }));
}

/** Mark a task as completed */
export async function completeTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from("nursing_tasks")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) throw new Error(error.message);
}
