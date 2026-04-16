"use server";
// Server actions for tasks (nursing worklist) tab.
// All queries and mutations are tenant-scoped — jwt_tenant() enforced by RLS.

import { supabase } from "../../../lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

export type Priority = "urgent" | "normal" | "low";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  patientId: string;
  patientName: string;
  patientWard: string;
  assignedTo: string;
  priority: Priority;
  status: TaskStatus;
  dueAt: string;
  createdAt: string;
}

export interface TaskCompletePayload {
  taskId: string;
  notes?: string;
}

export interface TaskListPayload {
  status?: TaskStatus;
  priority?: Priority;
}

// ── Actions ────────────────────────────────────────────────────────────────

/**
 * Mark a task as completed.
 * Updates task status to 'completed' and records completion timestamp.
 *
 * TODO: implement with Supabase:
 *   UPDATE tasks (or service_requests with category='nursing_task')
 *   SET status = 'completed', completed_at = now(), completion_notes = $notes
 *   WHERE id = $taskId AND tenant_id = jwt_tenant()
 *   RETURNING *
 */
export async function completeTask(payload: TaskCompletePayload): Promise<Task> {
  // TODO: replace with real Supabase update
  console.log("[TASKS] Complete task stub called:", payload);

  await new Promise((r) => setTimeout(r, 800));

  return {
    id: payload.taskId,
    title: "Task Title",
    description: null,
    patientId: "p-1",
    patientName: "Patient Name",
    patientWard: "GA-01",
    assignedTo: "current-user",
    priority: "normal",
    status: "completed",
    dueAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Fetch all tasks assigned to the current staff member.
 * Filter by status and priority.
 *
 * TODO: implement with Supabase:
 *   SELECT t.id, t.title, t.description,
 *          p.id, p.full_name, a.bed_number,
 *          t.assigned_to, t.priority, t.status,
 *          t.due_at, t.created_at
 *   FROM tasks t (or service_requests with category='nursing_task')
 *   JOIN patients p ON p.id = t.patient_id
 *   JOIN admissions a ON a.patient_id = p.id AND a.status = 'admitted'
 *   WHERE t.tenant_id = jwt_tenant()
 *         AND t.assigned_to = auth.uid()
 *         AND ($status IS NULL OR t.status = $status)
 *         AND ($priority IS NULL OR t.priority = $priority)
 *   ORDER BY t.priority DESC, t.due_at ASC
 */
export async function fetchTaskList(payload?: TaskListPayload): Promise<Task[]> {
  // TODO: replace with real Supabase query
  console.log("[TASKS] Fetch task list stub called:", payload);
  return [];
}

/**
 * Fetch a single task with full details.
 *
 * TODO: implement with Supabase:
 *   SELECT t.*, p.full_name, a.bed_number
 *   FROM tasks t
 *   JOIN patients p ON p.id = t.patient_id
 *   LEFT JOIN admissions a ON a.patient_id = p.id AND a.status = 'admitted'
 *   WHERE t.id = $taskId AND t.tenant_id = jwt_tenant()
 */
export async function fetchTaskDetail(taskId: string): Promise<Task | null> {
  // TODO: replace with real Supabase query
  console.log("[TASKS] Fetch task detail stub called:", taskId);
  return null;
}

/**
 * Create a new task assigned to a staff member.
 * Used by doctors or admins to delegate work.
 *
 * TODO: implement with Supabase:
 *   INSERT INTO tasks (title, description, patient_id, assigned_to,
 *                      priority, due_at, status)
 *   VALUES ($title, $description, $patientId, $assignedTo,
 *           $priority, $dueAt, 'pending')
 *   WHERE tenant_id = jwt_tenant()
 */
export async function createTask(task: Omit<Task, "id" | "status" | "createdAt">): Promise<Task> {
  // TODO: replace with real Supabase insert
  console.log("[TASKS] Create task stub called:", task);
  return {
    ...task,
    id: `task-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Update task priority or due time.
 *
 * TODO: implement with Supabase:
 *   UPDATE tasks
 *   SET priority = COALESCE($priority, priority),
 *       due_at = COALESCE($dueAt, due_at)
 *   WHERE id = $taskId AND tenant_id = jwt_tenant()
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Pick<Task, "priority" | "dueAt">>,
): Promise<Task> {
  // TODO: replace with real Supabase update
  console.log("[TASKS] Update task stub called:", taskId, updates);
  throw new Error("updateTask: not yet implemented");
}
