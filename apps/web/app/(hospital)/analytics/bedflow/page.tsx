"use client";

import { useState, useEffect, useTransition } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BedDouble, TrendingUp, AlertTriangle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getBedStats, type WardStat } from "./actions";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Colour cycling for wards (deterministic by index)
const WARD_COLORS = [
  "bg-blue-500", "bg-pink-500", "bg-red-500",
  "bg-orange-500", "bg-purple-500", "bg-emerald-500",
  "bg-sky-500", "bg-yellow-500",
];

export default function BedflowPage() {
  const [wards, setWards]     = useState<WardStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [, startTx] = useTransition();

  useEffect(() => {
    setLoading(true);
    startTx(async () => {
      const data = await getBedStats();
      setWards(data);
      if (data.length > 0) setSelected(data[0]?.ward ?? null);
      setLoading(false);
    });
  }, []);

  const today = new Date();
  const monBasedToday = (today.getDay() + 6) % 7;

  const selWard = wards.find((w) => w.ward === selected);
  const forecast = selWard?.forecast ?? [];
  const maxForecast = Math.max(...forecast, 1);

  // Alerts: wards projected >85% in next 72 h (first 3 days of forecast)
  const alerts: { ward: string; day: string; pct: number }[] = [];
  for (const w of wards) {
    for (let i = 0; i < 3; i++) {
      const pct = w.forecast[i] ?? 0;
      if (pct >= 85) {
        alerts.push({ ward: w.ward, day: DAYS[(monBasedToday + i) % 7] ?? `Day ${i + 1}`, pct });
      }
    }
  }

  return (
    <>
      <TopBar title="AI Bed Flow Prediction" />
      <main className="p-8 space-y-8">

        {alerts.length > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-400 animate-pulse" />
              <span className="text-sm font-bold text-red-400">Capacity Alerts — Next 72 Hours</span>
            </div>
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <Badge variant="outline" className="border-red-500/30 text-red-400 text-[10px] shrink-0">{a.day}</Badge>
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-300">{a.ward}</strong> projected at{" "}
                  <strong className="text-red-400">{a.pct}%</strong> capacity — initiate early discharge planning.
                </p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-[#0F766E]" />
            <span className="text-sm">Loading bed utilisation data…</span>
          </div>
        ) : wards.length === 0 ? (
          <div className="text-center py-20 text-muted text-sm">No bed data found.</div>
        ) : (
          <>
            {/* Ward snapshot grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {wards.map((w, idx) => {
                const color = WARD_COLORS[idx % WARD_COLORS.length] ?? "bg-blue-500";
                return (
                  <button
                    key={w.ward}
                    onClick={() => setSelected(w.ward)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all hover:bg-white/5",
                      selected === w.ward
                        ? "border-[#0F766E]/60 bg-[#0F766E]/5"
                        : "border-border/40 bg-surface/50"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className={cn("h-2 w-2 rounded-full", color)} />
                      <span className="text-[11px] text-muted font-medium truncate">{w.ward}</span>
                    </div>
                    <p className="text-2xl font-bold text-fg">{w.available}</p>
                    <p className="text-[10px] text-muted mt-0.5">beds free of {w.total}</p>
                    <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000", color)}
                        style={{ width: `${w.pct}%`, opacity: 0.8 }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-muted">{w.pct}% occupied</span>
                      {w.pct >= 85 && (
                        <span className="text-[9px] font-bold text-red-400 uppercase">High</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 7-Day forecast chart */}
            {selWard && (
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#0F766E]" />
                    <CardTitle className="text-sm">
                      7-Day Occupancy Forecast — {selWard.ward}
                    </CardTitle>
                  </div>
                  <span className="text-[10px] text-muted">Based on real occupancy + day-of-week pattern</span>
                </CardHeader>
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-end gap-4 h-56">
                    {forecast.map((pct, i) => {
                      const isHigh = pct >= 85;
                      const isCrit = pct >= 95;
                      const dayLabel = DAYS[(monBasedToday + i) % 7] ?? `D${i}`;
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
                                "w-full rounded-t-md transition-all duration-700 cursor-pointer hover:opacity-90",
                                isCrit ? "bg-red-500" : isHigh ? "bg-orange-500" : "bg-[#0F766E]/70"
                              )}
                              style={{ height: `${(pct / maxForecast) * 100}%` }}
                              title={`${dayLabel}: ${pct}% — ${Math.round((selWard.total * pct) / 100)} / ${selWard.total} beds`}
                            />
                            {isHigh && (
                              <ArrowUpRight className="absolute -top-5 left-1/2 -translate-x-1/2 h-3 w-3 text-orange-400" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{dayLabel}</span>
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
            )}

            {/* Discharge planning */}
            <Card className="border-border/40 bg-surface/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-blue-400" /> AI Discharge Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {wards
                    .filter((w) => (w.forecast[2] ?? 0) >= 75)
                    .map((w, idx) => {
                      const color = WARD_COLORS[wards.indexOf(w) % WARD_COLORS.length] ?? "bg-blue-500";
                      const peak = Math.max(...w.forecast);
                      const peakDayIdx = w.forecast.indexOf(peak);
                      const peakDay = DAYS[(monBasedToday + peakDayIdx) % 7] ?? "Soon";
                      return (
                        <div key={w.ward} className="flex items-start gap-4 rounded-xl border border-border/40 bg-surface/40 px-4 py-3">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-opacity-20", color)}>
                            <BedDouble className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-fg">{w.ward}</p>
                            <p className="text-xs text-muted mt-0.5">
                              Peak forecast: <strong className="text-orange-400">{peak}%</strong> on{" "}
                              <strong className="text-slate-300">{peakDay}</strong>.
                              Review {Math.max(1, Math.round((peak - 80) / 10))} eligible patient(s) for early discharge.
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] shrink-0", peak >= 90 ? "border-red-500/30 text-red-400" : "border-orange-500/30 text-orange-400")}
                          >
                            {peak >= 90 ? "Urgent" : "Plan"}
                          </Badge>
                        </div>
                      );
                    })}
                  {wards.every((w) => (w.forecast[2] ?? 0) < 75) && (
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
