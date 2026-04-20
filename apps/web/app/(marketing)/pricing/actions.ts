"use server";

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

/**
 * createRazorpayOrder
 *
 * Creates a Razorpay order for a subscription plan.
 * The returned orderId is passed to Razorpay Checkout JS on the client.
 *
 * TODO: Import Razorpay SDK and replace stub with real API call:
 *   const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
 *   const order = await razorpay.orders.create({ amount, currency: "INR", receipt: tenantId });
 *   return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: RAZORPAY_KEY_ID };
 *
 * TODO: Persist pending subscription record in tenant_subscriptions before returning.
 * TODO: Accept tenantId from auth session instead of param once auth middleware is wired.
 */
export async function createRazorpayOrder(
  planId: string,
  tenantId: string,
): Promise<CreateOrderResult> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }

  // TODO: Replace with real Razorpay SDK call
  const PLAN_AMOUNTS: Record<string, number> = {
    starter: 99900,   // ₹999/mo in paise
    growth:  299900,  // ₹2999/mo in paise
    enterprise: 0,    // custom — handled via sales
  };

  const amount = PLAN_AMOUNTS[planId] ?? 99900;

  // Stub: return a synthetic order for UI wiring
  return {
    orderId: `order_stub_${Date.now()}`,
    amount,
    currency: "INR",
    keyId,
  };
}
