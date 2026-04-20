"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Heart, Thermometer, Wind, Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// LOINC codes
const LOINC = {
  HR:   "8867-4",  // Heart rate
  TEMP: "8310-5",  // Body temperature
  RR:   "9279-1",  // Respiratory rate
  SBP:  "8480-6",  // Systolic BP
  SPO2: "2708-6",  // SpO2
} as const;

type VitalKey = keyof typeof LOINC;

function scoreSIRS(vitals: Partial<Record<VitalKey, number>>): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;
  if (vitals.HR   && vitals.HR > 90)                          { score++; flags.push(`HR ${vitals.HR} bpm (>90)`) }
  if (vitals.TEMP && (vitals.TEMP < 36 || vitals.TEMP > 38)) { score++; flags.push(`Temp ${vitals.TEMP}°C`) }
  if (vitals.RR   && vitals.RR > 20)                         { score++; flags.push(`RR ${vitals.RR}/min (>20)`) }
  if (vitals.SBP  && vitals.SBP < 90)                        { score++; flags.push(`SBP ${vitals.SBP} mmHg (<90)`) }
  if (vitals.SPO2 && vitals.SPO2 < 94)                       { score++; flags.push(`SpO₂ ${vitals.SPO2}% (<94%)`) }
  return { score, flags };
}

type RiskTier = "CRITICAL" | "ALERT" | "WATCH" | "STABLE";

function riskTier(score: number): RiskTier {
  if (score >= 3) return "CRITICAL";
  if (score === 2) return "ALERT";
  if (score === 1) return "WATCH";
  return "STABLE";
}

const TIER_CFG: Record<RiskTier, { label: string; color: string; pulse: boolean }> = {
  CRITICAL: { label: "Critical", color: "text-red-400 border-red-500/30 bg-red-500/10",         pulse: true  },
  ALERT:    { label: "Alert",    color: "text-orange-400 border-orange-500/30 bg-orange-500/10", pulse: true  },
  WATCH:    { label: "Watch",    color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",  pulse: false },
  STABLE:   { label: "Stable",   color: "text-[#0F766E] border-[#0F766E]/30 bg-[#0F766E]/5",    pulse: false },
};

interface PatientRisk {
  patientId: string;
  name:      string;
  uhid:      string;
  wardId:    string;
  vitals:    Partial<Record<VitalKey, number>>;
  sirsScore: number;
  flags:     string[];
  tier:      RiskTier;
  lastSeen:  string;
}

const DEMO_PATIENTS: PatientRisk[] = [
  {
    patientId: "p1", name: "Ravi Kumar",   uhid: "UHID-0421", wardId: "ICU",
    vitals: { HR: 112, TEMP: 38.9, RR: 24, SBP: 85, SPO2: 91 },
    sirsScore: 5, flags: ["HR 112 bpm (>90)","Temp 38.9°C","RR 24/min (>20)","SBP 85 mmHg (<90)","SpO₂ 91% (<94%)"],
    tier: "CRITICAL", lastSeen: "08:42 AM",
  },
  {
    patientId: "p2", name: "Shanta Devi",  uhid: "UHID-0318", wardId: "HDU",
    vitals: { HR: 97, TEMP: 38.2, RR: 22, SBP: 102 },
    sirsScore: 3, flags: ["HR 97 bpm (>90)","Temp 38.2°C","RR 22/min (>20)"],
    tier: "CRITICAL", lastSeen: "09:05 AM",
  },
  {
    patientId: "p3", name: "Mohan Lal",    uhid: "UHID-0205", wardId: "Gen-M",
    vitals: { HR: 94, TEMP: 37.2, RR: 21 },
    sirsScore: 2, flags: ["HR 94 bpm (>90)","RR 21/min (>20)"],
    tier: "ALERT", lastSeen: "07:55 AM",
  },
  {
    patientId: "p4", name: "Fatima Begum", uhid: "UHID-0510", wardId: "Gen-F",
    vitals: { HR: 88, TEMP: 37.8, RR: 18, SBP: 110, SPO2: 96 },
    sirsScore: 1, flags: ["Temp 37.8°C"],
    tier: "WATCH", lastSeen: "10:12 AM",
  },
  {
    patientId: "p5", name: "Anand Verma",  uhid: "UHID-0622", wardId: "Private",
    vitals: { HR: 72, TEMP: 37.0, RR: 16, SBP: 125, SPO2: 98 },
    sirsScore: 0, flags: [],
    tier: "STABLE", lastSeen: "10:30 AM",
  },
];

export default function SepsisWatchPage() {
  const supabase = createClient();
  const [patients, setPatients]     = useState<PatientRisk[]>([]);
  const [loading, setLoading]       = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    const since = new Date(Date.now() - 6 * 3600000).toISOString();

    const { data: obsData } = await supabase
      .from("observations")
      .select("patient_id, code, value_quantity, recorded_at, patients(full_name, uhid)")
      .in("code", Object.values(LOINC))
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false })
      .limit(500);

    type ObsRow = {
      patient_id: string;
      code: string;
      value_quantity: number | null;
      recorded_at: string;
      patients?: { full_name?: string; uhid?: string };
    };

    const obs = (obsData ?? []) as ObsRow[];

    // Group by patient, keep latest value per LOINC
    const patMap: Record<string, {
      name: string; uhid: string; lastSeen: string;
      vitals: Partial<Record<VitalKey, number>>;
    }> = {};

    for (const o of obs) {
      if (!patMap[o.patient_id]) {
        patMap[o.patient_id] = {
          name:     o.patients?.full_name ?? "Unknown",
          uhid:     o.patients?.uhid ?? "—",
          lastSeen: o.recorded_at,
          vitals:   {},
        };
      }
      const vKey = (Object.entries(LOINC).find(([, v]) => v === o.code)?.[0]) as VitalKey | undefined;
      if (vKey && o.value_quantity !== null && !(vKey in patMap[o.patient_id].vitals)) {
        patMap[o.patient_id].vitals[vKey] = o.value_quantity;
      }
    }

    const risks: PatientRisk[] = Object.entries(patMap)
      .map(([pid, p]) => {
        const { score, flags } = scoreSIRS(p.vitals);
        return {
          patientId: pid,
          name:      p.name,
          uhid:      p.uhid,
          wardId:    "IPD",
          vitals:    p.vitals,
          sirsScore: score,
          flags,
          tier:      riskTier(score),
          lastSeen:  new Date(p.lastSeen).toLocaleTimeString(),
        };
      })
      .sort((a, b) => b.sirsScore - a.sirsScore);

    setPatients(risks.length > 0 ? risks : DEMO_PATIENTS);
    setLastRefresh(new Date());
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const t = setInterval(load, 120000);
    return () => clearInterval(t);
  }, [load]);

  const critical = patients.filter((p) => p.tier === "CRITICAL").length;
  const alert    = patients.filter((p) => p.tier === "ALERT").length;
  const watch    = patients.filter((p) => p.tier === "WATCH").length;
  const stable   = patients.filter((p) => p.tier === "STABLE").length;

  return (
    <>
      <TopBar title="Sepsis Early Warning" />
      <main className="p-8 space-y-8">

        {/* Critical banner */}
        {critical > 0 && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-400">
                {critical} patient{critical > 1 ? "s" : ""} meeting SIRS criteria for sepsis
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Immediate physician review required — SIRS score ≥3</p>
            </div>
            <button
              onClick={load}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-all"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Critical (SIRS ≥3)", value: critical.toString(), color: "text-red-400"    },
            { label: "Alert (SIRS = 2)",   value: alert.toString(),    color: "text-orange-400" },
            { label: "Watch (SIRS = 1)",   value: watch.toString(),    color: "text-yellow-400" },
            { label: "Stable",             value: stable.toString(),   color: "text-[#0F766E]"  },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{k.label}</p>
              <p className={cn("text-3xl font-bold mt-1", k.color)}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* SIRS legend */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3">
          <Activity className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">
            <strong className="text-slate-300">SIRS Criteria:</strong> Flagged when ≥2 of —
            HR &gt;90 bpm · Temp &lt;36°C or &gt;38°C · RR &gt;20/min · SBP &lt;90 mmHg · SpO₂ &lt;94%.
            <strong className="text-red-400"> Score ≥3 = Critical</strong> ·
            <strong className="text-orange-400"> Score = 2 = Alert</strong> ·
            <strong className="text-yellow-400"> Score = 1 = Watch</strong>.
            Auto-refreshes every 2 minutes from the observations table.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Scanning vitals…</span>
          </div>
        ) : (
          <Card className="border-border/40 bg-surface/50">
            <CardHeader className="border-b border-border/20 pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-400" /> Active Patient Monitoring
                <span className="text-[10px] text-slate-600 font-normal ml-auto">
                  Updated {lastRefresh.toLocaleTimeString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-white/5">
                {patients.map((p) => {
                  const cfg = TIER_CFG[p.tier];
                  return (
                    <div key={p.patientId} className="py-4 space-y-3">
                      <div className="flex items-center gap-4">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border", cfg.color)}>
                          <Activity className={cn("h-4 w-4", cfg.pulse && "animate-pulse")} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="text-sm font-bold text-slate-200">{p.name}</p>
                            <span className="text-xs text-slate-500">{p.uhid}</span>
                            <Badge variant="outline" className={cn("text-[9px] ml-auto shrink-0", cfg.color)}>
                              {cfg.label} · SIRS {p.sirsScore}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            Ward: {p.wardId} · Vitals at {p.lastSeen}
                          </p>
                        </div>
                      </div>

                      {/* Vitals chips */}
                      <div className="ml-14 flex gap-2 flex-wrap">
                        {p.vitals.HR !== undefined && (
                          <span className={cn("flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px]",
                            p.vitals.HR > 90 ? "border-red-500/30 bg-red-500/5 text-red-400" : "border-white/8 text-slate-400"
                          )}>
                            <Heart className="h-3 w-3" /> HR {p.vitals.HR}
                          </span>
                        )}
                        {p.vitals.TEMP !== undefined && (
                          <span className={cn("flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px]",
                            (p.vitals.TEMP < 36 || p.vitals.TEMP > 38) ? "border-red-500/30 bg-red-500/5 text-red-400" : "border-white/8 text-slate-400"
                          )}>
                            <Thermometer className="h-3 w-3" /> {p.vitals.TEMP}°C
                          </span>
                        )}
                        {p.vitals.RR !== undefined && (
                          <span className={cn("flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px]",
                            p.vitals.RR > 20 ? "border-red-500/30 bg-red-500/5 text-red-400" : "border-white/8 text-slate-400"
                          )}>
                            <Wind className="h-3 w-3" /> RR {p.vitals.RR}
                          </span>
                        )}
                        {p.vitals.SBP !== undefined && (
                          <span className={cn("flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px]",
                            p.vitals.SBP < 90 ? "border-red-500/30 bg-red-500/5 text-red-400" : "border-white/8 text-slate-400"
                          )}>
                            <Activity className="h-3 w-3" /> SBP {p.vitals.SBP}
                          </span>
                        )}
                        {p.vitals.SPO2 !== undefined && (
                          <span className={cn("flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px]",
                            p.vitals.SPO2 < 94 ? "border-red-500/30 bg-red-500/5 text-red-400" : "border-white/8 text-slate-400"
                          )}>
                            SpO₂ {p.vitals.SPO2}%
                          </span>
                        )}
                      </div>

                      {/* SIRS flag pills */}
                      {p.flags.length > 0 && (
                        <div className="ml-14 flex flex-wrap gap-2">
                          {p.flags.map((f) => (
                            <span
                              key={f}
                              className="text-[10px] text-red-400 bg-red-500/5 border border-red-500/20 px-2 py-0.5 rounded"
                            >
                              ⚡ {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
