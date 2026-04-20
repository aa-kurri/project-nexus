"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function makeSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

export interface PharmacyStats {
  grossRevenue: number;
  lastMonthRevenue: number;
  revenueChange: number;
  totalPrescriptions: number;
  avgPrescriptionValue: number;
  topItems: { name: string; revenue: number; qty: number }[];
  monthlyRevenue: number[]; // last 12 months, index 0 = 11 months ago
  fastMoving: { name: string; count: number }[];
  slowMoving: { name: string; count: number }[];
}

export async function getPharmacyStats(): Promise<PharmacyStats> {
  const supabase = makeSupabase();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const yearAgo = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1).toISOString();

  // ── Bills joined to encounters for date ──────────────────────────────────
  const { data: billsRaw } = await supabase
    .from("bills")
    .select("total_amount, status, encounter:encounter_id(started_at)")
    .gte("encounter.started_at" as any, yearAgo);

  const bills = (billsRaw ?? []) as Array<{
    total_amount: number | null;
    status: string | null;
    encounter: { started_at: string } | null;
  }>;

  // Monthly revenue buckets (12 months)
  const monthlyRevenue = Array(12).fill(0) as number[];
  let grossRevenue = 0;
  let lastMonthRevenue = 0;

  for (const b of bills) {
    const startedAt = b.encounter?.started_at;
    if (!startedAt) continue;
    const d = new Date(startedAt);
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (monthsAgo < 0 || monthsAgo > 11) continue;
    const amount = Number(b.total_amount ?? 0);
    monthlyRevenue[11 - monthsAgo] = (monthlyRevenue[11 - monthsAgo] ?? 0) + amount;
    if (monthsAgo === 0) grossRevenue += amount;
    if (monthsAgo === 1) lastMonthRevenue += amount;
  }

  const revenueChange =
    lastMonthRevenue > 0
      ? Math.round(((grossRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000) / 10
      : 0;

  // ── Bill items for top revenue items ────────────────────────────────────
  const { data: itemsRaw } = await supabase
    .from("bill_items")
    .select("description, quantity, unit_price")
    .limit(2000);

  const itemMap: Record<string, { revenue: number; qty: number }> = {};
  for (const item of itemsRaw ?? []) {
    const key = (item.description as string) || "Other";
    if (!itemMap[key]) itemMap[key] = { revenue: 0, qty: 0 };
    itemMap[key].revenue += Number(item.unit_price ?? 0) * Number(item.quantity ?? 1);
    itemMap[key].qty += Number(item.quantity ?? 1);
  }

  const sortedItems = Object.entries(itemMap)
    .sort(([, a], [, b]) => b.revenue - a.revenue);

  const topItems = sortedItems.slice(0, 6).map(([name, { revenue, qty }]) => ({
    name,
    revenue: Math.round(revenue),
    qty: Math.round(qty),
  }));

  // ── Prescription counts for fast/slow movers ─────────────────────────────
  const { data: rxRaw } = await supabase
    .from("medication_requests")
    .select("drug_name")
    .limit(2000);

  const rxMap: Record<string, number> = {};
  for (const rx of rxRaw ?? []) {
    const key = (rx.drug_name as string) || "Unknown";
    rxMap[key] = (rxMap[key] ?? 0) + 1;
  }

  const sortedRx = Object.entries(rxMap).sort(([, a], [, b]) => b - a);
  const totalPrescriptions = sortedRx.reduce((s, [, c]) => s + c, 0);

  const fastMoving = sortedRx.slice(0, 5).map(([name, count]) => ({ name, count }));
  const slowMoving = sortedRx
    .slice(-5)
    .reverse()
    .map(([name, count]) => ({ name, count }));

  const avgPrescriptionValue =
    totalPrescriptions > 0 ? Math.round(grossRevenue / totalPrescriptions) : 0;

  return {
    grossRevenue: Math.round(grossRevenue),
    lastMonthRevenue: Math.round(lastMonthRevenue),
    revenueChange,
    totalPrescriptions,
    avgPrescriptionValue,
    topItems,
    monthlyRevenue,
    fastMoving,
    slowMoving,
  };
}
