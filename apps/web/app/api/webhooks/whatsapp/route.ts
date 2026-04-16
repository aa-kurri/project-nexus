import { NextRequest, NextResponse } from "next/server";
import { processWhatsAppMessage } from "@nexus/ai-orchestrator";
import { createClient } from "@/utils/supabase/server";

/**
 * WhatsApp Meta Webhook Handler
 * Endpoint: POST /api/webhooks/whatsapp
 */
export async function POST(req: NextRequest) {
  const payload = await req.json();

  // 1. Validate Meta HMAC signature (Production prerequisite)
  // const signature = req.headers.get("x-hub-signature-256");
  // if (!validateSignature(payload, signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  // 2. Extract message context
  // WhatsApp JSON structure is nested: entry -> changes -> value -> messages
  const messageObj = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!messageObj) return NextResponse.json({ ok: true }); // Acknowledge status pings

  const from = messageObj.from; // Phone number
  const text = messageObj.text?.body;
  
  if (!text) return NextResponse.json({ ok: true });

  const supabase = createClient();

  // 3. Resolve Patient context from phone number
  const { data: patient } = await supabase
    .from("patients")
    .select("id, tenant_id, full_name")
    .eq("phone", `+${from}`)
    .single();

  if (!patient) {
    // Unknown patient flow - possibly start onboarding
    return NextResponse.json({ ok: true });
  }

  // 4. Resolve Tenant Context (e.g. Hospital Name)
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", patient.tenant_id)
    .single();

  // 5. Call AI Concierge Chain
  const aiResult = await processWhatsAppMessage(
    patient.id,
    text,
    tenant?.name || "Ayura Hospital"
  );

  // 6. Send Reply via Meta Cloud API
  // await sendWhatsAppMessage(from, aiResult.reply);

  // 7. Process structured actions (e.g. log intent for clinic staff)
  if (aiResult.actions.length > 0) {
    await supabase.from("concierge_audit_logs").insert([{
      tenant_id: patient.tenant_id,
      patient_id: patient.id,
      raw_message: text,
      ai_reply: aiResult.reply,
      detected_actions: aiResult.actions
    }]);
  }

  return NextResponse.json({ ok: true });
}

/**
 * Meta Webhook Verification (GET)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}
