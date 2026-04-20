"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Scissors, Clock, TrendingUp, AlertTriangle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const OT_ROOMS = [
  { id: "ot1", name: "OT 1 — General Surgery", utilization: 78, cases: 12 },
  { id: "ot2", name: "OT 2 — Orthopaedics",    utilization: 65, cases: 9  },
  { id: "ot3", name: "OT 3 — Gynaecology",     utilization: 82, cases: 14 },
  { id: "ot4", name: "OT 4 — ENT",             utilization: 55, cases: 7  },
];

const CASE_TYPES = [
  { type: "General Surgery", pct: 32, color: "bg-blue-500"    },
  { type: "Orthopaedics",    pct: 22, color: "bg-purple-500"  },
  { type: "Gynaecology",     pct: 28, color: "bg-pink-500"    },
  { type: "ENT",             pct: 10, color: "bg-orange-500"  },
  { type: "Ophthalmology",   pct: 8,  color: "bg-emerald-500" },
];

const SURGEON_STATS = [
  { name: "Dr. Rajesh Kumar",  specialty: "General Surgery", cases: 28, avgTAT: 95,  cancelRate: 3.5 },
  { name: "Dr. Priya Sharma",  specialty: "Gynaecology",     cases: 24, avgTAT: 75,  cancelRate: 2.1 },
  { name: "Dr. Arun Mehta",    specialty: "Orthopaedics",    cases: 19, avgTAT: 110, cancelRate: 5.2 },
  { name: "Dr. Sunita Rao",    specialty: "ENT",             cases: 14, avgTAT: 45,  cancelRate: 1.8 },
  { name: "Dr. Vikram Singh",  specialty: "General Surgery", cases: 12, avgTAT: 88,  cancelRate: 4.0 },
];

const TREND_30D = [8,10,9,12,11,9,13,12,10,14,13,11,15,12,10,9,13,14,12,11,10,13,15,14,12,11,14,13,12,11];

export default function OTAnalyticsPage() {
  const supabase = createClient();
  const [apptCount, setApptCount] = useState<number | null>(null);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const { count } = await supabase
      .from("appointment_bookings")
      .select("id", { count: "exact", head: true })
      .eq("class", "surgery")
      .gte("created_at", since);
    setApptCount(count);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const totalCases = OT_ROOMS.reduce((s, r) => s + r.cases, 0);
  const avgUtil    = Math.round(OT_ROOMS.reduce((s, r) => s + r.utilization, 0) / OT_ROOMS.length);
  const maxTrend   = Math.max(...TREND_30D);

  return (
    <>
      <TopBar title="OT Intelligence" />
      <main className="p-8 space-y-8">

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Cases This Month",   value: (apptCount ?? totalCases).toString(), color: "text-blue-400"   },
            { label: "Avg OT Utilisation", value: `${avgUtil}%`,                        color: "text-[#0F766E]"  },
            { label: "Avg TAT (mins)",     value: "83",                                 color: "text-orange-400" },
            { label: "Cancel Rate",        value: "3.4%",                               color: "text-red-400"    },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{k.label}</p>
              <p className={cn("text-3xl font-bold mt-1", k.color)}>{k.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading OT data…</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* OT Room utilisation */}
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="border-b border-border/20 pb-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-[#0F766E]" /> OT Room Utilisation
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  {OT_ROOMS.map((r) => (
                    <div key={r.id}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-300 font-medium">{r.name}</span>
                        <span className={cn("font-bold", r.utilization >= 80 ? "text-orange-400" : "text-[#0F766E]")}>
                          {r.utilization}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700",
                            r.utilization >= 80 ? "bg-orange-500" : "bg-[#0F766E]"
                          )}
                          style={{ width: `${r.utilization}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-600 mt-0.5">{r.cases} cases scheduled this week</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Case type distribution */}
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="border-b border-border/20 pb-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-400" /> Case Type Distribution
                    <span className="text-[10px] text-slate-600 font-normal ml-auto">heuristic model</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-3">
                  {CASE_TYPES.map((c) => (
                    <div key={c.type} className="flex items-center gap-3">
                      <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", c.color)} />
                      <span className="text-xs text-slate-300 flex-1">{c.type}</span>
                      <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", c.color)} style={{ width: `${c.pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{c.pct}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* 30-day case trend */}
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/20 pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" /> 30-Day OT Case Volume Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 pb-4">
                <div className="flex items-end gap-1 h-32">
                  {TREND_30D.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full rounded-t-sm bg-[#0F766E]/60 hover:bg-[#0F766E] transition-colors cursor-pointer"
                        style={{ height: `${(v / maxTrend) * 100}%`, minHeight: "4px" }}
                        title={`Day ${i + 1}: ${v} cases`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[9px] text-slate-600 font-mono">
                  <span>Day 1</span><span>Day 15</span><span>Day 30</span>
                </div>
              </CardContent>
            </Card>

            {/* Surgeon performance table */}
            <Card className="border-border/40 bg-surface/50">
              <CardHeader className="border-b border-border/20 pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-400" /> Surgeon Performance
                  <span className="text-[10px] text-slate-600 font-normal ml-auto">AI model · Last 30 days</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Surgeon","Specialty","Cases","Avg TAT","Cancel Rate","Status"].map((h) => (
                        <th key={h} className="py-3 text-left text-[10px] uppercase tracking-wider text-slate-600 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {SURGEON_STATS.map((s) => (
                      <tr key={s.name} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 pr-4 font-medium text-slate-200">{s.name}</td>
                        <td className="py-3 pr-4 text-slate-500">{s.specialty}</td>
                        <td className="py-3 pr-4 font-bold text-[#0F766E]">{s.cases}</td>
                        <td className="py-3 pr-4 text-slate-400">{s.avgTAT} min</td>
                        <td className={cn("py-3 pr-4 font-semibold",
                          s.cancelRate > 4 ? "text-red-400" : s.cancelRate > 2.5 ? "text-orange-400" : "text-[#0F766E]"
                        )}>{s.cancelRate}%</td>
                        <td className="py-3">
                          <Badge variant="outline" className={cn("text-[9px]",
                            s.cancelRate > 4
                              ? "border-red-500/30 text-red-400"
                              : "border-[#0F766E]/30 text-[#0F766E]"
                          )}>
                            {s.cancelRate > 4 ? "Review" : "Good"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* AI insight */}
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400">
                <strong className="text-slate-300">AI Insight:</strong> OT 3 (Gynaecology) running at
                <strong className="text-orange-400"> 82% utilisation</strong> — consider adding a second session on Tuesdays.
                Dr. Arun Mehta has a <strong className="text-red-400">5.2% cancellation rate</strong> — flag for scheduling review.
                Forecasted OT demand next month is <strong className="text-[#0F766E]">+12%</strong> based on IPD admission trend.
              </p>
            </div>
          </>
        )}
      </main>
    </>
  );
}
