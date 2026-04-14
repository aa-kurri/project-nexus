"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

const Schema = z.object({
  hospitalName:  z.string().min(2),
  subdomain:     z.string().min(2).regex(/^[a-z0-9-]+$/),
  primaryColor:  z.string().regex(/^#[0-9a-fA-F]{6}$/),
  modules:       z.array(z.string()).min(1),
  adminEmail:    z.string().email(),
  adminPassword: z.string().min(8),
  adminName:     z.string().min(2),
});

export async function createTenant(input: z.infer<typeof Schema>) {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  // TODO: replace stub with real Supabase admin insert
  // 1. sb_admin.from("tenants").insert({ name, subdomain, modules })
  // 2. sb_admin.auth.admin.createUser({ email, password, user_metadata: { role: "admin", tenant_id } })
  // 3. sb_admin.from("profiles").insert({ id, tenant_id, role: "admin", full_name })
  // 4. write audit_log "tenant.created"

  // Simulate async work
  await new Promise(r => setTimeout(r, 800));

  redirect("/opd/queue");
}
