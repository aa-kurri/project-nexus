"use server";
// Server actions for admin tab screens.
// All mutations are tenant-scoped — jwt_tenant() enforced by RLS on the table.

import { supabase } from "../../../lib/supabase";

export type MobileRole = "patient" | "doctor" | "admin" | "staff";

export interface FeatureFlag {
  id:          string;
  feature_key: string;
  label:       string;
  mobile_role: MobileRole;
  enabled:     boolean;
}

/** Load all feature flags for the current tenant */
export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  // TODO: call from feature-flags screen on mount
  const { data, error } = await supabase
    .from("mobile_feature_flags")
    .select("id, feature_key, label, mobile_role, enabled")
    .order("mobile_role")
    .order("label");

  if (error) throw new Error(error.message);
  return (data ?? []) as FeatureFlag[];
}

/** Toggle a single feature flag */
export async function toggleFeatureFlag(id: string, enabled: boolean): Promise<void> {
  // TODO: add optimistic update on the client before calling this
  const { error } = await supabase
    .from("mobile_feature_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/** Bulk-enable or bulk-disable all flags for a given role */
export async function bulkSetRoleFlags(
  mobile_role: MobileRole,
  enabled: boolean,
  tenantId: string,
): Promise<void> {
  // TODO: call from "Enable All" / "Disable All" row actions in the matrix header
  const { error } = await supabase
    .from("mobile_feature_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("mobile_role", mobile_role)
    .eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);
}

/** KPI aggregates for admin dashboard */
export async function getDashboardKPIs() {
  // TODO: implement — fan out to admissions, bills, queue_tokens, beds
  return { bedsOccupied: 0, bedsTotal: 0, opdToday: 0, pendingBills: 0 };
}

/** Paginated staff list for the current tenant */
export async function getStaffList(page = 0, pageSize = 20) {
  // TODO: implement — query profiles ordered by role, full_name
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw new Error(error.message);
  return data ?? [];
}
