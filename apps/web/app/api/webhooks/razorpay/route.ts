import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";

/**
 * Razorpay Webhook Handler
 * Verifies X-Razorpay-Signature and processes subscription billing events.
 *
 * Configured events (Razorpay Dashboard → Webhooks):
 *   payment.captured          → tenant active
 *   subscription.charged.failed → tenant past_due
 */
export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing X-Razorpay-Signature" }, { status: 400 });
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Verify HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex"),
    )
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(payload) as RazorpayWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const supabase = createClient();

  switch (event.event) {
    // ── payment.captured ─────────────────────────────────────────────────────
    // Fires when a subscription payment or one-time payment is successfully
    // captured. We set the tenant active and record the Razorpay IDs.
    case "payment.captured": {
      const payment = event.payload.payment?.entity;
      if (!payment) break;

      const tenantId: string | undefined = payment.notes?.tenant_id;
      const subscriptionId: string | undefined = payment.invoice_id ?? payment.subscription_id;
      const customerId: string | undefined = payment.customer_id;

      if (tenantId) {
        await supabase.from("tenant_subscriptions").upsert(
          {
            tenant_id: tenantId,
            razorpay_customer_id: customerId ?? null,
            razorpay_subscription_id: subscriptionId ?? null,
            status: "active",
            tier: "pro",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id" },
        );
      }
      break;
    }

    // ── subscription.charged.failed ──────────────────────────────────────────
    // Fires when a scheduled subscription charge fails (e.g. card declined).
    // We mark the tenant past_due so the UI can prompt re-payment.
    case "subscription.charged.failed": {
      const subscription = event.payload.subscription?.entity;
      if (!subscription?.id) break;

      await supabase
        .from("tenant_subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("razorpay_subscription_id", subscription.id);
      break;
    }

    default:
      // Unhandled event — return 200 so Razorpay doesn't retry
      break;
  }

  return NextResponse.json({ received: true });
}

// ── Type definitions ─────────────────────────────────────────────────────────

interface RazorpayPaymentEntity {
  id: string;
  customer_id?: string;
  invoice_id?: string;
  subscription_id?: string;
  notes?: Record<string, string>;
}

interface RazorpaySubscriptionEntity {
  id: string;
  customer_id?: string;
}

interface RazorpayWebhookEvent {
  event: string;
  payload: {
    payment?: { entity: RazorpayPaymentEntity };
    subscription?: { entity: RazorpaySubscriptionEntity };
  };
}
