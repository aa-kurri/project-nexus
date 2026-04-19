"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BedDouble, TrendingUp, AlertTriangle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Static forecast model (production: replace with ML model or time-series API) ──

const WARDS = [
  { id: "gen-m",   name: "General (Male)",  total: 20, color: "bg-blue-500" },
  { id: "gen-f",   name: "General (Female)",total: 16, color: "bg-pink-500" },
  { id: "icu",     name: "ICU",             total: 8,  color: "bg-red-500" },
  { id: "hdu",     name: "HDU",             total: 6,  color: "bg-orange-500" },
  { id: "private", name: "Private",         total: 5,  color: "bg-purple-500" },
  { id: "paed",    name: "Paediatric",      total: 10, color: "bg-emerald-500" },
];

// 7-day occupancy forecast per ward (% of capacity)
const FORECAST: Record<string, number[]> = {
  "gen-m":   [68, 72, 75, 80, 85, 78, 70],
  "gen-f":   [55, 60, 65, 70, 68, 62, 58],
  "icu":     [87, 90, 92, 95, 88, 85, 82],
  "hdu":     [60, 65, 70, 75, 72, 68, 64],
  "private": [40, 45, 50, 55, 52, 48, 44],
  "paed":    [30, 35, 40, 42, 38, 35, 30],
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface BedStat {
  wardId:    string;
  name:      string;
  total:     number;
  occupied:  number;
  available: number;
  pct:       number;
  color:     string;
}

interface Alert {
  ward:    string;
  day:     string;
  pct:     number;
  msg:     string;
}

export default function BedflowPage() {
  const supabase = createClient();
  const [stats, setStats]     = useState<BedStat[]>([]);
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("gen-m");

  const load = useCallback(async () => {
    setLoading(true);

    // Fetch actual bed assignments from ipd_admissions where discharge_date is null
    const { data: admData } = await supabase
      .from("ipd_admissions")
      .select("bed_id, ward_id, status")
      .eq("status", "admitted");

    const occupancyByWard: Record<string, number> = {};
    for (const adm of admData ?? []) {
      const r = adm as { ward_id?: string | null };
      if (r.ward_id) {
        occupancyByWard[r.ward_id] = (occupancyByWard[r.ward_id] ?? 0) + 1;
      }
    }

    // Build bed stats — use real count if available, else use forecast day 0
    const bedStats: BedStat[] = WARDS.map((w) => {
      const realOccupied = occupancyByWard[w.id];
      const pctForecast  = FORECAST[w.id]?.[0] ?? 50;
      const occupied     = realOccupied ?? Math.round((pctForecast / 100) * w.total);
      const pct          = Math.round((occupied / w.total) * 100);
      return {
        wardId:    w.id,
        name:      w.name,
        total:     w.total,
        occupied,
        available: w.total - occupied,
        pct,
        color:     w.color,
      };
    });

    // Generate alerts for wards with >85% forecast in next 3 days
    const generatedAlerts: Alert[] = [];
    for (const w of WARDS) {
      const forecast = FORECAST[w.id] ?? [];
      for (let i = 0; i < Math.min(3, forecast.length); i++) {
        if ((forecast[i] ?? 0) >= 85) {
          generatedAlerts.push({
            ward: w.name,
            day:  DAYS[i] ?? `Day ${i + 1}`,
            pct:  forecast[i],
            msg:  `${w.name} projected at ${forecast[i]}% capacity — initiate early discharge planning`,
          });
        }
      }
    }

    setStats(bedStats);
    setAlerts(generatedAlerts);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const selectedWard = WARDS.find((w) => w.id === selected);
  const selectedForecast = FORECAST[selected] ?? [];
  const maxForecast = Math.max(...selectedForecast, 1);

  return (
    <>
      <TopBar title="AI Bed Flow Prediction" />
      <main className="p-8 space-y-8">

        {/* Alerts banner */}
        {alerts.length > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
              <span className="text-sm font-bold text-red-400">Capacity Alerts — Next 72 Hours</span>
            </div>
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <Badge variant="outline" className="border-red-500/30 text-red-400 text-[10px] shrink-0">{a.day}</Badge>
                <p className="text-xs text-slate-400">{a.msg}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading bed utilisation data…</span>
          </div>
        ) : (
          <>
            {/* Ward snapshot grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats.map((s) => (
                <button
                  key={s.wardId}
                  onClick={() => setSelected(s.wardId)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all hover:bg-white/5",
                    selected === s.wardId
                      ? "border-[#0F766E]/60 bg-[#0F766E]/5"
                      : "border-border/40 bg-surface/50"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className={cn("h-2 w-2 rounded-full", s.color)} />
                    <span className="text-[11px] text-muted font-medium">{s.name}</span>
                  </div>
                  <p className="text-2xl font-bold text-fg">{s.available}</p>
                  <p className="text-[10px] text-muted mt-0.5">beds free of {s.total}</p>
                  <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-1000", s.color)}
                      style={{ width: `${s.pct}%`, opacity: 0.8 }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-muted">{s.pct}% occupied</span>
                    {s.pct >= 85 && (
                      <span className="text-[9px] font-bold text-red-400 uppercase">High</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* 7-Day forecast chart */}
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#0F766E]" />
                  <CardTitle className="text-sm">
                    7-Day Occupancy Forecast — {selectedWard?.name}
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  {WARDS.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setSelected(w.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all",
                        selected === w.id
                          ? "bg-[#0F766E] text-white border-[#0F766E]"
                          : "border-border/40 text-muted hover:text-fg hover:bg-white/5"
                      )}
                    >
                      {w.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-6 pb-4">
                <div className="flex items-end gap-4 h-56">
                  {selectedForecast.map((pct, i) => {
                    const isHigh = pct >= 85;
                    const isCrit = pct >= 95;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <span className={cn(
                          "text-[11px] font-bold",
                          isCrit ? "text-red-400" : isHigh ? "text-orange-400" : "text-muted"
                        )}>
                          {pct}%
                        </span>
                        <div className="w-full flex-1 flex items-end relative group">
                          <div
                            className={cn(
                              "w-full rounded-t-md transition-all duration-700 cursor-pointer",
                              isCrit ? "bg-red-500" : isHigh ? "bg-orange-500" : "bg-[#0F766E]/70",
                              "hover:opacity-90"
                            )}
                            style={{ height: `${(pct / maxForecast) * 100}%` }}
                            title={`${DAYS[i]}: ${pct}% — ${Math.round(((selectedWard?.total ?? 10) * pct) / 100)} / ${selectedWard?.total} beds`}
                          />
                          {isHigh && (
                            <ArrowUpRight className="absolute -top-5 left-1/2 -translate-x-1/2 h-3 w-3 text-orange-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{DAYS[i]}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/20">
                  <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-sm bg-[#0F766E]/70" /><span className="text-xs text-muted">Normal (&lt;85%)</span></div>
                  <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-sm bg-orange-500" /><span className="text-xs text-muted">High (85–94%)</span></div>
                  <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-sm bg-red-500" /><span className="text-xs text-muted">Critical (≥95%)</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Discharge planning recommendations */}
            <Card className="border-border/40 bg-surface/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-blue-400" /> AI Discharge Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats
                    .filter((s) => (FORECAST[s.wardId]?.[2] ?? 0) >= 75)
                    .map((s) => {
                      const peak = Math.max(...(FORECAST[s.wardId] ?? []));
                      const peakDay = DAYS[(FORECAST[s.wardId] ?? []).indexOf(peak)];
                      return (
                        <div key={s.wardId} className="flex items-start gap-4 rounded-xl border border-border/40 bg-surface/40 px-4 py-3">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", s.color, "bg-opacity-20")}>
                            <BedDouble className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-fg">{s.name}</p>
                            <p className="text-xs text-muted mt-0.5">
                              Peak forecast: <strong className="text-orange-400">{peak}%</strong> on <strong className="text-slate-300">{peakDay}</strong>.
                              Recommend reviewing {Math.max(1, Math.round((peak - 80) / 10))} eligible patient(s) for early discharge or inter-ward transfer.
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] shrink-0",
                              peak >= 90 ? "border-red-500/30 text-red-400" : "border-orange-500/30 text-orange-400"
                            )}
                          >
                            {peak >= 90 ? "Urgent" : "Plan"}
                          </Badge>
                        </div>
                      );
                    })}
                  {stats.every((s) => (FORECAST[s.wardId]?.[2] ?? 0) < 75) && (
                    <p className="text-sm text-muted text-center py-4">No discharge planning actions required for the next 3 days.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </>
  );
}
