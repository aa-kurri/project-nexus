"use server";

import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface RegisterPayload {
  invite_token: string;
  full_name: string;
  email: string;
  password: string;
}

/**
 * registerWithInvite
 *
 * 1. Validates the invite_token against public.invite_tokens (tenant_id + role resolved here)
 * 2. Creates the auth user via supabaseAdmin (service role, bypasses email confirmation)
 * 3. Inserts a profiles row with the invited role + tenant_id
 * 4. Marks the invite token as used
 * 5. Signs the new user in via supabaseServer so the session cookie is set
 */
export async function registerWithInvite(
  payload: RegisterPayload
): Promise<{ error: string | null }> {
  const { invite_token, full_name, email, password } = payload;

  // TODO: Step 1 — validate invite token
  // const admin = supabaseAdmin();
  // const { data: invite, error: inviteErr } = await admin
  //   .from("invite_tokens")
  //   .select("id, tenant_id, role, used_at, expires_at")
  //   .eq("token", invite_token)
  //   .single();
  //
  // if (inviteErr || !invite) return { error: "Invalid or expired invite link." };
  // if (invite.used_at) return { error: "This invite has already been used." };
  // if (new Date(invite.expires_at) < new Date()) return { error: "Invite link has expired." };

  // TODO: Step 2 — create auth user
  // const { data: authData, error: authErr } = await admin.auth.admin.createUser({
  //   email,
  //   password,
  //   email_confirm: true,  // skip email confirmation for invited staff
  // });
  // if (authErr) return { error: authErr.message };
  // const userId = authData.user.id;

  // TODO: Step 3 — insert profiles row
  // const { error: profileErr } = await admin.from("profiles").insert({
  //   id: userId,
  //   tenant_id: invite.tenant_id,
  //   role: invite.role,
  //   full_name,
  // });
  // if (profileErr) return { error: profileErr.message };

  // TODO: Step 4 — mark token used
  // await admin.from("invite_tokens").update({ used_at: new Date().toISOString() }).eq("id", invite.id);

  // TODO: Step 5 — sign in so the session cookie is established
  // const server = supabaseServer();
  // const { error: signInErr } = await server.auth.signInWithPassword({ email, password });
  // if (signInErr) return { error: signInErr.message };

  // redirect("/dashboard") — called from client after success
  return { error: null };
}

/**
 * generateInviteToken
 *
 * Admin-only action: creates a new invite_tokens row for a given tenant + role.
 * Called from the settings/staff page (future story).
 *
 * TODO: verify calling user has role IN ('su', 'admin') via JWT claims before inserting.
 */
export async function generateInviteToken(params: {
  tenant_id: string;
  role: string;
  expires_in_hours?: number;
}): Promise<{ token: string | null; error: string | null }> {
  // TODO: const admin = supabaseAdmin();
  // const token = crypto.randomUUID();
  // const expiresAt = new Date(Date.now() + (params.expires_in_hours ?? 72) * 3_600_000).toISOString();
  // const { error } = await admin.from("invite_tokens").insert({
  //   token,
  //   tenant_id: params.tenant_id,
  //   role: params.role,
  //   expires_at: expiresAt,
  // });
  // if (error) return { token: null, error: error.message };
  // return { token, error: null };
  return { token: null, error: "Not yet implemented" };
}
