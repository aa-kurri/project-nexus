"use client";

import Script from "next/script";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createRazorpayOrder } from "./actions";

// ── Plan definitions ─────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "₹999",
    period: "/month",
    description: "For small clinics and single-doctor practices.",
    badge: null,
    features: [
      "Up to 50 patients/day OPD",
      "Basic FHIR records",
      "WhatsApp appointment reminders",
      "1 doctor account",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "₹2,999",
    period: "/month",
    description: "For multi-specialty hospitals scaling operations.",
    badge: "Most Popular",
    features: [
      "Unlimited OPD tokens",
      "Full LIMS + IPD module",
      "ABDM ABHA integration",
      "Teleconsult + Wearable ingest",
      "Up to 20 staff accounts",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large hospital chains and government networks.",
    badge: null,
    features: [
      "Unlimited everything",
      "Dedicated Supabase project",
      "SLA 99.9% uptime",
      "On-premise deployment option",
      "24/7 priority support",
    ],
  },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

// ── Component ────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [loading, setLoading] = useState<PlanId | null>(null);

  async function handleSubscribe(planId: PlanId) {
    if (planId === "enterprise") {
      // TODO: route to a contact-sales page or open an inquiry modal
      window.location.href = "mailto:sales@ayuraos.in?subject=Enterprise+Inquiry";
      return;
    }

    setLoading(planId);
    try {
      // TODO: Pass real tenantId from auth session
      const { orderId, amount, currency, keyId } = await createRazorpayOrder(
        planId,
        "tenant_placeholder",
      );

      const rzp = new (window as RazorpayWindow).Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "Ayura OS",
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
        image: "/logo.png",
        theme: { color: "#0F766E" },
        handler(response: RazorpayResponse) {
          // TODO: Call a server action to verify payment_signature and activate tenant
          console.info("[razorpay] payment success", response);
          window.location.href = "/dashboard?billing=success";
        },
        modal: {
          ondismiss() {
            setLoading(null);
          },
        },
        notes: {
          // Passed through to webhook payload.payment.entity.notes
          tenant_id: "tenant_placeholder", // TODO: replace with real tenant ID
        },
      });

      rzp.on("payment.failed", (res: { error: { description: string } }) => {
        console.error("[razorpay] payment failed", res.error);
        setLoading(null);
      });

      rzp.open();
    } catch (err) {
      console.error("[razorpay] order creation failed", err);
      setLoading(null);
    }
  }

  return (
    <>
      {/* Load Razorpay Checkout JS */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <main className="mx-auto max-w-6xl px-4 py-20">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-base" style={{ color: "hsl(220 13% 60%)" }}>
            One subscription per hospital. No per-seat fees. Cancel anytime.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isPopular = plan.badge === "Most Popular";
            return (
              <Card
                key={plan.id}
                className="relative flex flex-col border transition-colors"
                style={{
                  background: "hsl(220 13% 9%)",
                  borderColor: isPopular ? "#0F766E" : "hsl(220 13% 16%)",
                }}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge
                      className="px-3 py-1 text-xs font-semibold text-white"
                      style={{ background: "#0F766E" }}
                    >
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4 pt-8">
                  <CardTitle className="text-lg text-white">{plan.name}</CardTitle>
                  <p className="text-sm" style={{ color: "hsl(220 13% 60%)" }}>
                    {plan.description}
                  </p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.period && (
                      <span className="mb-1 text-sm" style={{ color: "hsl(220 13% 60%)" }}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-6">
                  {/* Feature list */}
                  <ul className="space-y-2 text-sm" style={{ color: "hsl(220 13% 75%)" }}>
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <span className="text-[#0F766E]">✓</span>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="mt-auto">
                    <Button
                      className="w-full font-semibold text-white"
                      style={{
                        background: isPopular ? "#0F766E" : "hsl(220 13% 16%)",
                        borderColor: isPopular ? "#0F766E" : "hsl(220 13% 25%)",
                      }}
                      disabled={loading === plan.id}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {loading === plan.id
                        ? "Opening checkout…"
                        : plan.id === "enterprise"
                          ? "Contact Sales"
                          : "Get Started"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="mt-10 text-center text-xs" style={{ color: "hsl(220 13% 40%)" }}>
          All prices in INR. GST applicable as per Indian tax law. Payments processed securely
          via Razorpay. PCI-DSS compliant.
        </p>
      </main>
    </>
  );
}

// ── Razorpay window type augmentation ────────────────────────────────────────

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  image?: string;
  theme?: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
  notes?: Record<string, string>;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: (res: { error: { description: string } }) => void): void;
}

interface RazorpayWindow extends Window {
  Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
}
