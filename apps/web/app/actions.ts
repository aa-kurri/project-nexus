"use server";

export interface LeadPayload {
  hospitalName: string;
  contactName: string;
  email: string;
  phone?: string;
  bedCount?: string;
  message?: string;
}

export interface LeadResult {
  ok: boolean;
  error?: string;
}

/**
 * submitLead — persist a marketing lead from the landing page.
 *
 * TODO: Import createServerClient from @supabase/ssr and build a service-role
 *       client (bypass RLS for public submissions).
 * TODO: Insert into public.marketing_leads with validated fields.
 * TODO: Trigger a welcome email via Resend / SendGrid.
 * TODO: Post a Slack webhook notification to #sales channel.
 */
export async function submitLead(payload: LeadPayload): Promise<LeadResult> {
  // TODO: validate payload with zod schema
  const { hospitalName, contactName, email } = payload;

  if (!hospitalName || !contactName || !email) {
    return { ok: false, error: "Required fields missing." };
  }

  // TODO: const supabase = createServiceClient();
  // TODO: const { error } = await supabase.from("marketing_leads").insert({ ... });
  // TODO: if (error) return { ok: false, error: error.message };

  console.log("[submitLead] stub — payload received", { hospitalName, email });

  return { ok: true };
}

/**
 * requestDemo — book a personalised product demo slot.
 *
 * TODO: Integrate with Calendly / Cal.com API to create an event.
 * TODO: Send confirmation email with meeting link.
 * TODO: Insert record into public.marketing_leads with source = 'demo_request'.
 */
export async function requestDemo(payload: Pick<LeadPayload, "email" | "hospitalName" | "contactName">): Promise<LeadResult> {
  // TODO: validate, call Calendly API, store lead
  console.log("[requestDemo] stub — payload received", payload);
  return { ok: true };
}
