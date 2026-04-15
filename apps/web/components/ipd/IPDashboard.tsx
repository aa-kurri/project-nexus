"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  UserRoundCheck,
  UserRoundX,
  BedDouble,
  Clock4,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Types ─────────────────────────────────────────────────────────────────────

interface KpiData {
  admissionsToday: number;
  dischargesToday: number;
  totalBeds: number;
  occupiedBeds: number;
  avgLosHours: number;
}

interface WardRow {
  ward: string;
  total: number;
  occupied: number;
  vacant: number;
  cleaning: number;
  occupancy: number;
}

// ── Mock data (seed until Supabase rows exist) ────────────────────────────────

const MOCK_WARDS: WardRow[] = [
  { ward: "General (GW)",    total: 40, occupied: 32, vacant: 6,  cleaning: 2, occupancy: 80 },
  { ward: "ICU",             total: 12, occupied: 10, vacant: 1,  cleaning: 1, occupancy: 83 },
  { ward: "Paediatrics (PW)",total: 20, occupied: 14, vacant: 5,  cleaning: 1, occupancy: 70 },
  { ward: "Maternity (MW)",  total: 16, occupied: 11, vacant: 4,  cleaning: 1, occupancy: 69 },
  { ward: "Surgical (SW)",   total: 24, occupied: 19, vacant: 4,  cleaning: 1, occupancy: 79 },
  { ward: "Orthopaedics",    total: 18, occupied: 12, vacant: 5,  cleaning: 1, occupancy: 67 },
];

const MOCK_KPI: KpiData = {
  admissionsToday: 14,
  dischargesToday: 9,
  totalBeds: 130,
  occupiedBeds: 98,
  avgLosHours: 68.4,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtLos(hours: number): string {
  const d = Math.floor(hours / 24);
  const h = Math.round(hours % 24);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

function OccupancyBar({ pct }: { pct: number }) {
  const colour =
    pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-400" : "bg-[#0F766E]";
  return (
    <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all ${colour}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  accent?: string;
}

function KpiCard({ icon, label, value, sub, trend, accent = "#0F766E" }: KpiCardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColour =
    trend === "up"
      ? "text-[#0F766E]"
      : trend === "down"
      ? "text-amber-400"
      : "text-muted";

  return (
    <Card className="relative flex flex-col gap-3 overflow-hidden p-5">
      {/* accent stripe */}
      <div
        className="absolute inset-y-0 left-0 w-0.5 rounded-full"
        style={{ backgroundColor: accent }}
      />

      <div className="flex items-start justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accent}22` }}
        >
          {icon}
        </div>
        {trend && (
          <TrendIcon className={`h-3.5 w-3.5 ${trendColour}`} />
        )}
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-fg">{value}</p>
        {sub && <p className="mt-0.5 text-[11px] text-muted">{sub}</p>}
      </div>
    </Card>
  );
}

// ── Ward table ────────────────────────────────────────────────────────────────

function WardTable({ rows }: { rows: WardRow[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <BedDouble className="h-4 w-4 text-[#0F766E]" />
          Ward-wise Breakdown
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-white/[0.03] text-[10px] uppercase tracking-widest text-muted">
              <th className="px-5 py-2.5 text-left font-semibold">Ward</th>
              <th className="px-4 py-2.5 text-right font-semibold">Total</th>
              <th className="px-4 py-2.5 text-right font-semibold">Occupied</th>
              <th className="px-4 py-2.5 text-right font-semibold">Vacant</th>
              <th className="px-4 py-2.5 text-right font-semibold">Cleaning</th>
              <th className="px-5 py-2.5 text-right font-semibold">Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const statusColour =
                row.occupancy >= 90
                  ? "border-red-500/50 text-red-400 bg-red-500/10"
                  : row.occupancy >= 75
                  ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                  : "border-[#0F766E]/50 text-[#0F766E] bg-[#0F766E]/10";

              return (
                <tr
                  key={row.ward}
                  className={`border-b border-border transition-colors hover:bg-white/[0.02] ${
                    i % 2 === 0 ? "" : "bg-white/[0.015]"
                  }`}
                >
                  <td className="px-5 py-3 font-medium text-fg">{row.ward}</td>
                  <td className="px-4 py-3 text-right text-muted">{row.total}</td>
                  <td className="px-4 py-3 text-right font-semibold text-fg">{row.occupied}</td>
                  <td className="px-4 py-3 text-right text-[#0F766E]">{row.vacant}</td>
                  <td className="px-4 py-3 text-right text-amber-400">{row.cleaning}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <OccupancyBar pct={row.occupancy} />
                      <Badge
                        variant="outline"
                        className={`min-w-[52px] justify-center border text-[10px] font-bold ${statusColour}`}
                      >
                        {row.occupancy}%
                      </Badge>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Summary row */}
          <tfoot>
            <tr className="border-t-2 border-border bg-white/[0.03] text-[11px] font-bold">
              <td className="px-5 py-3 text-muted uppercase tracking-widest">Total</td>
              <td className="px-4 py-3 text-right text-fg">
                {rows.reduce((s, r) => s + r.total, 0)}
              </td>
              <td className="px-4 py-3 text-right text-fg">
                {rows.reduce((s, r) => s + r.occupied, 0)}
              </td>
              <td className="px-4 py-3 text-right text-[#0F766E]">
                {rows.reduce((s, r) => s + r.vacant, 0)}
              </td>
              <td className="px-4 py-3 text-right text-amber-400">
                {rows.reduce((s, r) => s + r.cleaning, 0)}
              </td>
              <td className="px-5 py-3 text-right text-muted">—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function IPDashboard() {
  const supabase = createClient();

  const [kpi, setKpi] = useState<KpiData>(MOCK_KPI);
  const [wards, setWards] = useState<WardRow[]>(MOCK_WARDS);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // ── Derive live KPIs from Supabase (falls back to mock if no data) ─────────
  const fetchKpi = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      const [admRes, disRes, bedRes] = await Promise.all([
        supabase
          .from("admissions")
          .select("id", { count: "exact", head: true })
          .gte("admitted_at", `${today}T00:00:00Z`),
        supabase
          .from("admissions")
          .select("id", { count: "exact", head: true })
          .gte("discharged_at", `${today}T00:00:00Z`),
        supabase.from("beds").select("ward, status"),
      ]);

      // Average LOS: hours between admitted_at and now (active) or discharged_at
      const { data: losRows } = await supabase
        .from("admissions")
        .select("admitted_at, discharged_at")
        .eq("status", "admitted")
        .limit(200);

      const avgLos =
        losRows && losRows.length > 0
          ? losRows.reduce((sum, r) => {
              const end = r.discharged_at ? new Date(r.discharged_at) : new Date();
              return (
                sum +
                (end.getTime() - new Date(r.admitted_at).getTime()) / 3_600_000
              );
            }, 0) / losRows.length
          : MOCK_KPI.avgLosHours;

      if (bedRes.data && bedRes.data.length > 0) {
        // Build ward rows from live bed data
        const wardMap = new Map<string, WardRow>();
        for (const b of bedRes.data as { ward: string; status: string }[]) {
          if (!wardMap.has(b.ward)) {
            wardMap.set(b.ward, {
              ward: b.ward,
              total: 0,
              occupied: 0,
              vacant: 0,
              cleaning: 0,
              occupancy: 0,
            });
          }
          const row = wardMap.get(b.ward)!;
          row.total++;
          if (b.status === "occupied") row.occupied++;
          else if (b.status === "vacant") row.vacant++;
          else if (b.status === "cleaning") row.cleaning++;
        }
        for (const row of wardMap.values()) {
          row.occupancy = row.total > 0 ? Math.round((row.occupied / row.total) * 100) : 0;
        }
        setWards(Array.from(wardMap.values()));

        const totalBeds = bedRes.data.length;
        const occupiedBeds = bedRes.data.filter(
          (b: { status: string }) => b.status === "occupied"
        ).length;

        setKpi({
          admissionsToday: admRes.count ?? MOCK_KPI.admissionsToday,
          dischargesToday: disRes.count ?? MOCK_KPI.dischargesToday,
          totalBeds,
          occupiedBeds,
          avgLosHours: avgLos,
        });
      } else {
        // No bed rows yet — keep mock ward breakdown, update counts only
        setKpi((prev) => ({
          ...prev,
          admissionsToday: admRes.count ?? prev.admissionsToday,
          dischargesToday: disRes.count ?? prev.dischargesToday,
          avgLosHours: avgLos,
        }));
      }
    } catch {
      // silently fall back to mock data
    } finally {
      setLoading(false);
      setLastSync(new Date());
    }
  }, [supabase]);

  // Initial fetch
  useEffect(() => {
    fetchKpi();
  }, [fetchKpi]);

  // ── Realtime subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("ipd-dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admissions" },
        () => { fetchKpi(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "beds" },
        () => { fetchKpi(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchKpi]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const occupancyPct =
    kpi.totalBeds > 0 ? Math.round((kpi.occupiedBeds / kpi.totalBeds) * 100) : 0;

  const occupancyAccent =
    occupancyPct >= 90 ? "#ef4444" : occupancyPct >= 75 ? "#f59e0b" : "#0F766E";

  return (
    <ScrollArea className="flex-1">
      <main className="space-y-5 p-6 pb-10">

        {/* ── Last sync bar ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted">
            Live data via Supabase Realtime &mdash; last sync{" "}
            <span className="font-mono text-fg">
              {lastSync.toLocaleTimeString()}
            </span>
          </p>
          <button
            onClick={fetchKpi}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-muted transition-colors hover:border-[#0F766E]/50 hover:text-fg disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── KPI cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard
            icon={<UserRoundCheck className="h-4.5 w-4.5" style={{ color: "#0F766E" }} />}
            label="Admissions Today"
            value={String(kpi.admissionsToday)}
            sub="Since 00:00"
            trend="up"
            accent="#0F766E"
          />
          <KpiCard
            icon={<UserRoundX className="h-4.5 w-4.5" style={{ color: "#f59e0b" }} />}
            label="Discharges Today"
            value={String(kpi.dischargesToday)}
            sub="Since 00:00"
            trend="down"
            accent="#f59e0b"
          />
          <KpiCard
            icon={<BedDouble className="h-4.5 w-4.5" style={{ color: occupancyAccent }} />}
            label="Bed Occupancy"
            value={`${occupancyPct}%`}
            sub={`${kpi.occupiedBeds} / ${kpi.totalBeds} beds`}
            trend={occupancyPct >= 90 ? "up" : "neutral"}
            accent={occupancyAccent}
          />
          <KpiCard
            icon={<Clock4 className="h-4.5 w-4.5" style={{ color: "#818cf8" }} />}
            label="Avg Length of Stay"
            value={fmtLos(kpi.avgLosHours)}
            sub="Active admissions"
            trend="neutral"
            accent="#818cf8"
          />
        </div>

        {/* ── Ward breakdown table ─────────────────────────────────────── */}
        <WardTable rows={wards} />

      </main>
    </ScrollArea>
  );
}
