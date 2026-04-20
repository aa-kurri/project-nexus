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

export interface WardStat {
  ward: string;
  total: number;
  occupied: number;
  available: number;
  pct: number;
  // 7-day projected occupancy % (Mon→Sun from today)
  forecast: number[];
}

// Day-of-week demand multipliers (Mon=0 … Sun=6)
// Hospitals typically see higher occupancy mid-week, lower weekends
const DOW_FACTOR = [1.03, 1.05, 1.06, 1.05, 1.02, 0.96, 0.93];

export async function getBedStats(): Promise<WardStat[]> {
  const supabase = makeSupabase();

  const { data: bedsRaw } = await supabase
    .from("beds")
    .select("ward, status");

  const wardMap: Record<string, { total: number; occupied: number }> = {};
  for (const bed of bedsRaw ?? []) {
    const w = (bed as { ward: string; status: string }).ward ?? "Unknown";
    const s = (bed as { ward: string; status: string }).status ?? "";
    if (!wardMap[w]) wardMap[w] = { total: 0, occupied: 0 };
    wardMap[w].total++;
    if (s === "occupied") wardMap[w].occupied++;
  }

  const today = new Date().getDay(); // 0=Sun … 6=Sat, but we want Mon=0
  const monBasedToday = (today + 6) % 7;

  return Object.entries(wardMap).map(([ward, { total, occupied }]) => {
    const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;

    // Project 7 days from today using day-of-week multipliers
    const forecast: number[] = [];
    for (let i = 0; i < 7; i++) {
      const dow = (monBasedToday + i) % 7;
      const factor = DOW_FACTOR[dow] ?? 1;
      const projected = Math.min(100, Math.round(pct * factor));
      forecast.push(projected);
    }

    return {
      ward,
      total,
      occupied,
      available: total - occupied,
      pct,
      forecast,
    };
  });
}
