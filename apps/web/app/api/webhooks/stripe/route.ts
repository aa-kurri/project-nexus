import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Stripe SaaS Webhook Handler
 * Processes subscription lifecycle events to update tenant status.
 */
export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = createClient();

  // 1. Handle Subscription Events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenantId;
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      if (tenantId) {
        await supabase.from("tenant_subscriptions").upsert({
          tenant_id: tenantId,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          status: "active",
          tier: "pro", // Default upgrade
          updated_at: new Date().toISOString(),
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("tenant_subscriptions")
        .update({ status: "cancelled", tier: "free" })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await supabase
        .from("tenant_subscriptions")
        .update({ status: "past_due" })
        .eq("stripe_customer_id", invoice.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
