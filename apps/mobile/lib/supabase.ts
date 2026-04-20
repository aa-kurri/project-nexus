import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL      ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false,
  },
});

// ── Types ────────────────────────────────────────────────────────────────────

export type StaffRole =
  | "su" | "admin" | "doctor"
  | "nurse" | "pharmacist" | "lab_manager"
  | "patient" | "staff";

/** Four mobile navigation personas */
export type MobileRole = "patient" | "doctor" | "admin" | "staff";

export interface Profile {
  id:           string;
  tenant_id:    string;
  role:         StaffRole;
  full_name:    string;
  email?:       string;
  phone?:       string;
  avatar_url?:  string;
  patient_id?:  string;
  // joined from tenants table
  tenant_name?: string;
  tenant_logo?: string;
}

// Maps the 7-value staff_role enum to the 4 mobile UX personas
export function toMobileRole(role: StaffRole): MobileRole {
  if (role === "patient")              return "patient";
  if (role === "doctor")               return "doctor";
  if (role === "admin" || role === "su") return "admin";
  return "staff"; // nurse | pharmacist | lab_manager
}
