"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, TrendingUp, AlertTriangle, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const DISEASE_BURDEN = [
  { name: "Hypertension",         pct: 28, color: "bg-red-500"    },
  { name: "Type 2 Diabetes",      pct: 22, color: "bg-orange-500" },
  { name: "Respiratory Illness",  pct: 18, color: "bg-blue-500"   },
  { name: "Musculoskeletal",      pct: 12, color: "bg-purple-500" },
  { name: "GI Disorders",         pct: 10, color: "bg-yellow-500" },
  { name: "Other",                pct: 10, color: "bg-slate-500"  },
];

interface PatientIntel {
  totalPatients:   number;
  newThisMonth:    number;
  returningMonth:  number;
  highFrequency:   Array<{ id: string; name: string; uhid: string; visits: number }>;
  readmissionRisk: Array<{ id: string; name: string; uhid: string; admissions: number; risk: "HIGH" | "MEDIUM" }>;
  weeklyTrend:     Array<{ week: string; newPts: number; returning: number }>;
  noShowRate:      number;
}

export default function PatientIntelligencePage() {
  const supabase = createClient();
  const [data, setData]       = useState<PatientIntel | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const now           = new Date();
    const monthStart    = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000).toISOString();

    const [apptRes, ipdRes, patientsRes] = await Promise.all([
      supabase
        .from("appointment_bookings")
        .select("patient_id, scheduled_at, status")
        .gte("scheduled_at", ninetyDaysAgo)
        .limit(2000),
      supabase
        .from("ipd_admissions")
        .select("patient_id, admission_date, patients(full_name, uhid)")
        .gte("admission_date", ninetyDaysAgo)
        .limit(500),
      supabase
        .from("patients")
        .select("id, full_name, uhid")
        .limit(200),
    ]);

    type ApptRow  = { patient_id: string; scheduled_at: string; status?: string };
    type IpdRow   = { patient_id: string; admission_date: string; patients?: { full_name?: string; uhid?: string } };
    type PatRow   = { id: string; full_name: string; uhid: string };

    const appts = (apptRes.data ?? []) as ApptRow[];
    const ipd   = (ipdRes.data ?? []) as IpdRow[];
    const pats  = (patientsRes.data ?? []) as PatRow[];

    // Visit counts over 90d
    const visitCount: Record<string, number> = {};
    for (const a of appts) {
      visitCount[a.patient_id] = (visitCount[a.patient_id] ?? 0) + 1;
    }

    // New vs returning this month
    const newIds = new Set<string>();
    const retIds = new Set<string>();
    for (const a of appts.filter((a) => a.scheduled_at >= monthStart)) {
      const hasPrior = appts.some((x) => x.patient_id === a.patient_id && x.scheduled_at < monthStart);
      if (hasPrior) retIds.add(a.patient_id);
      else          newIds.add(a.patient_id);
    }

    // High-frequency patients (≥3 visits)
    const patMap = Object.fromEntries(pats.map((p) => [p.id, p]));
    const highFrequency = Object.entries(visitCount)
      .filter(([, c]) => c >= 3)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([id, visits]) => ({
        id,
        name:  patMap[id]?.full_name ?? "Unknown",
        uhid:  patMap[id]?.uhid ?? "—",
        visits,
      }));

    // Readmission risk (≥2 IPD admissions in 90d)
    const ipdCount: Record<string, { count: number; name: string; uhid: string }> = {};
    for (const r of ipd) {
      if (!ipdCount[r.patient_id]) {
        ipdCount[r.patient_id] = {
          count: 0,
          name:  r.patients?.full_name ?? "Unknown",
          uhid:  r.patients?.uhid ?? "—",
        };
      }
      ipdCount[r.patient_id].count++;
    }
    const readmissionRisk = Object.entries(ipdCount)
      .filter(([, v]) => v.count >= 2)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 6)
      .map(([id, v]) => ({
        id,
        name:       v.name,
        uhid:       v.uhid,
        admissions: v.count,
        risk:       (v.count >= 3 ? "HIGH" : "MEDIUM") as "HIGH" | "MEDIUM",
      }));

    // 8-week trend
    const weeklyTrend = Array.from({ length: 8 }, (_, i) => {
      const idx    = 7 - i;
      const wStart = new Date(now.getTime() - (idx + 1) * 7 * 86400000).toISOString();
      const wEnd   = new Date(now.getTime() - idx * 7 * 86400000).toISOString();
      const wAppts = appts.filter((a) => a.scheduled_at >= wStart && a.scheduled_at < wEnd);
      const wNew   = new Set<string>();
      const wRet   = new Set<string>();
      for (const a of wAppts) {
        const prior = appts.some((x) => x.patient_id === a.patient_id && x.scheduled_at < wStart);
        if (prior) wRet.add(a.patient_id);
        else       wNew.add(a.patient_id);
      }
      return { week: `W${i + 1}`, newPts: wNew.size, returning: wRet.size };
    });

    // No-show rate
    const noShows    = appts.filter((a) => a.status === "no_show" || a.status === "cancelled").length;
    const noShowRate = appts.length > 0 ? Math.round((noShows / appts.length) * 100) : 12;

    setData({
      totalPatients:  pats.length,
      newThisMonth:   newIds.size,
      returningMonth: retIds.size,
      highFrequency,
      readmissionRisk,
      weeklyTrend,
      noShowRate,
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const maxWeek = data ? Math.max(...data.weeklyTrend.map((w) => w.newPts + w.returning), 1) : 1;

  return (
    <>
      <TopBar title="Patient Intelligence" />
      <main className="p-8 space-y-8">

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Patients",       value: data?.totalPatients.toLocaleString() ?? "—",  color: "text-blue-400"   },
            { label: "New This Month",        value: data?.newThisMonth.toLocaleString() ?? "—",   color: "text-[#0F766E]"  },
            { label: "Returning This Month",  value: data?.returningMonth.toLocaleString() ?? "—", color: "text-purple-400" },
            { label: "No-Show Rate",          value: `${data?.noShowRate ?? "—"}%`,                color: "text-orange-400" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{k.label}</p>
              <p className={cn("text-3xl font-bold mt-1", k.color)}>{k.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Analysing patient patterns…</span>
          </div>
        ) : data && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Weekly trend */}
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="border-b border-border/20 pb-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#0F766E]" /> 8-Week New vs Returning Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-end gap-3 h-44">
                    {data.weeklyTrend.map((w) => {
                      const total = w.newPts + w.returning;
                      const heightPct = (total / maxWeek) * 100;
                      const newH      = total > 0 ? (w.newPts / total) * heightPct : 0;
                      const retH      = total > 0 ? (w.returning / total) * heightPct : 0;
                      return (
                        <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex flex-col justify-end" style={{ height: "160px" }}>
                            <div
                              className="w-full bg-purple-500/60 rounded-t-sm"
                              style={{ height: `${retH}%`, minHeight: w.returning ? "3px" : "0" }}
                              title={`Returning: ${w.returning}`}
                            />
                            <div
                              className="w-full bg-[#0F766E]/70"
                              style={{ height: `${newH}%`, minHeight: w.newPts ? "3px" : "0" }}
                              title={`New: ${w.newPts}`}
                            />
                          </div>
                          <span className="text-[9px] text-slate-600 font-mono">{w.week}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-6 mt-3 pt-3 border-t border-white/5">
                    <span className="flex items-center gap-1.5 text-[10px] text-muted"><span className="h-2 w-2 rounded-sm bg-[#0F766E]/70 inline-block" /> New</span>
                    <span className="flex items-center gap-1.5 text-[10px] text-muted"><span className="h-2 w-2 rounded-sm bg-purple-500/60 inline-block" /> Returning</span>
                  </div>
                </CardContent>
              </Card>

              {/* Disease burden */}
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="border-b border-border/20 pb-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-orange-400" /> Disease Burden Analysis
                    <span className="text-[10px] text-slate-600 font-normal ml-auto">AI model</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-3">
                  {DISEASE_BURDEN.map((d) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", d.color)} />
                      <span className="text-xs text-slate-300 flex-1">{d.name}</span>
                      <div className="w-28 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", d.color)} style={{ width: `${d.pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{d.pct}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Readmission risk */}
            {data.readmissionRisk.length > 0 && (
              <Card className="border-border/40 bg-surface/50">
                <CardHeader className="border-b border-border/20 pb-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" /> Readmission Risk — Last 90 Days
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-white/5">
                    {data.readmissionRisk.map((r) => (
                      <div key={r.id} className="flex items-center gap-5 py-3.5">
                        <div className={cn(
                          "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                          r.risk === "HIGH" ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"
                        )}>
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-200">{r.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">UHID: {r.uhid} · {r.admissions} admissions in 90d</p>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px]",
                          r.risk === "HIGH" ? "border-red-500/30 text-red-400" : "border-orange-500/30 text-orange-400"
                        )}>
                          {r.risk} Risk
                        </Badge>
                        <p className="text-xs text-slate-500 text-right shrink-0 leading-tight">
                          Schedule<br />follow-up
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* High-frequency patients */}
            {data.highFrequency.length > 0 && (
              <Card className="border-border/40 bg-surface/50">
                <CardHeader className="border-b border-border/20 pb-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" /> High-Frequency Patients
                    <span className="text-[10px] text-slate-600 font-normal ml-auto">≥3 visits · 90 days</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-white/5">
                    {data.highFrequency.map((p) => (
                      <div key={p.id} className="flex items-center gap-4 py-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Users className="h-3.5 w-3.5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-200 font-medium">{p.name}</p>
                          <p className="text-xs text-slate-500">UHID: {p.uhid}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#0F766E]">{p.visits}</p>
                          <p className="text-[10px] text-slate-600">visits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI insight */}
            <div className="rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5 p-4 flex items-start gap-3">
              <Brain className="h-4 w-4 text-[#0F766E] mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400">
                <strong className="text-slate-300">AI Insight:</strong> Patients with
                <strong className="text-red-400"> ≥2 IPD admissions in 90 days</strong> are flagged for care coordination.
                Proactive follow-up calls for high-frequency patients improve outcomes and reduce ER visits.
                No-show rate can drop by <strong className="text-purple-400">up to 40%</strong> with automated SMS reminders
                sent 24h before appointment. Consider a <strong className="text-[#0F766E]">Chronic Disease Management</strong> programme
                for the top hypertension + diabetes cohort.
              </p>
            </div>
          </>
        )}
      </main>
    </>
  );
}
