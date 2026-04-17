"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, XCircle, AlertCircle, CheckCircle2, ShieldCheck, Search, ChevronDown } from "lucide-react";

type AlertSeverity = "contraindicated" | "major" | "moderate" | "minor";
type AlertType     = "drug_drug" | "drug_allergy" | "drug_disease" | "duplicate";

const SEV_CFG: Record<AlertSeverity, { label: string; color: string; icon: React.ElementType }> = {
  contraindicated: { label: "Contraindicated", color: "text-red-400 bg-red-500/10 border-red-500/20",         icon: XCircle      },
  major:           { label: "Major",           color: "text-orange-400 bg-orange-500/10 border-orange-500/20",icon: AlertTriangle },
  moderate:        { label: "Moderate",        color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",icon: AlertCircle  },
  minor:           { label: "Minor",           color: "text-slate-400 bg-white/5 border-white/8",             icon: AlertCircle  },
};

const TYPE_CFG: Record<AlertType, { label: string; color: string }> = {
  drug_drug:     { label: "Drug–Drug",     color: "text-red-400 bg-red-500/10 border-red-500/20"       },
  drug_allergy:  { label: "Drug–Allergy",  color: "text-purple-400 bg-purple-500/10 border-purple-500/20"},
  drug_disease:  { label: "Drug–Disease",  color: "text-orange-400 bg-orange-500/10 border-orange-500/20"},
  duplicate:     { label: "Duplicate",     color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"},
};

interface CdsAlert {
  id: string;
  date: string;
  patient: string;
  uhid: string;
  drug1: string;
  drug2: string;
  alertType: AlertType;
  severity: AlertSeverity;
  mechanism: string;
  recommendation: string;
  action: "overridden" | "stopped" | "pending";
  overrideReason?: string;
}

const ALERTS: CdsAlert[] = [
  { id: "CDS-001", date: "2026-04-16 10:15", patient: "Ramesh Kumar",   uhid: "AY-00412", drug1: "Warfarin 5mg",        drug2: "Aspirin 75mg",       alertType: "drug_drug",    severity: "major",           mechanism: "Additive anticoagulant effect; increased bleeding risk",                recommendation: "Monitor INR closely; reduce dose or switch aspirin to clopidogrel",           action: "overridden",  overrideReason: "Cardiologist review: benefit > risk for ACS" },
  { id: "CDS-002", date: "2026-04-16 10:22", patient: "Sunita Sharma",  uhid: "AY-00389", drug1: "Inj. Ceftriaxone 1g", drug2: "ALLERGY: Penicillin", alertType: "drug_allergy", severity: "contraindicated", mechanism: "Cross-reactivity between cephalosporins and penicillins (~1–2%)",               recommendation: "STOP — switch to Azithromycin or Levofloxacin. Inform prescriber immediately.", action: "stopped"  },
  { id: "CDS-003", date: "2026-04-16 11:05", patient: "George Mathew",  uhid: "AY-00345", drug1: "Tab. Metformin",     drug2: "IV Contrast agent",  alertType: "drug_disease", severity: "major",           mechanism: "Contrast-induced nephropathy + metformin: lactic acidosis risk",                recommendation: "Hold metformin 48h before contrast, restart after renal function check",      action: "pending"  },
  { id: "CDS-004", date: "2026-04-16 13:30", patient: "Priya Venkatesh",uhid: "AY-00298", drug1: "Tab. Amoxicillin",   drug2: "Tab. Doxycycline",   alertType: "duplicate",    severity: "moderate",        mechanism: "Both are broad-spectrum antibiotics for same indication; therapeutic duplication",  recommendation: "Review indication; retain one agent based on culture sensitivity",              action: "pending"  },
  { id: "CDS-005", date: "2026-04-15 14:00", patient: "Arun Nair",      uhid: "AY-00267", drug1: "Inj. Metoclopramide",drug2: "Tab. Haloperidol",   alertType: "drug_drug",    severity: "moderate",        mechanism: "Additive dopamine antagonism; risk of extrapyramidal symptoms",                   recommendation: "Monitor for EPS; consider ondansetron instead for nausea",                     action: "overridden", overrideReason: "Both required for acute agitation + PONV" },
];

const SUMMARY = [
  { label: "Alerts Today",       value: "4",  color: "text-yellow-400" },
  { label: "Contraindicated",    value: "1",  color: "text-red-400"    },
  { label: "Overridden",         value: "2",  color: "text-orange-400" },
  { label: "Auto-Stopped",       value: "1",  color: "text-[#0F766E]"  },
];

export default function CdsPage() {
  const [search,  setSearch]  = useState("");
  const [sev,     setSev]     = useState<AlertSeverity | "ALL">("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = ALERTS.filter(
    (a) =>
      (sev === "ALL" || a.severity === sev) &&
      (a.patient.toLowerCase().includes(search.toLowerCase()) ||
        a.drug1.toLowerCase().includes(search.toLowerCase()) ||
        a.drug2.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <TopBar title="Clinical Decision Support — Drug Alerts" />
      <main className="p-8 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SUMMARY.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
              <p className={cn("text-3xl font-bold mt-1", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5 p-4">
          <ShieldCheck className="h-4 w-4 text-[#0F766E] mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">
            Drug interaction and allergy alerts fire at <strong className="text-slate-300">order entry (CPOE)</strong> and
            <strong className="text-slate-300"> pharmacy dispense</strong>. Contraindicated pairs are hard-stopped.
            Major and moderate alerts require a documented override reason. Database: <strong className="text-slate-300">MIMS India</strong>.
          </p>
        </div>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4">
            <CardTitle className="text-sm">Alert Log</CardTitle>
            <div className="flex items-center gap-3">
              {(["ALL","contraindicated","major","moderate","minor"] as const).map((s) => (
                <button key={s} onClick={() => setSev(s)}
                  className={cn("px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all",
                    sev === s
                      ? s === "ALL" ? "bg-[#0F766E] text-white border-[#0F766E]" : SEV_CFG[s].color
                      : "border-white/8 text-muted hover:text-fg hover:bg-white/5"
                  )}>
                  {s === "ALL" ? "All" : SEV_CFG[s].label}
                </button>
              ))}
              <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Patient or drug…"
                  className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-36" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-white/5">
              {filtered.map((a) => {
                const sevCfg  = SEV_CFG[a.severity];
                const typeCfg = TYPE_CFG[a.alertType];
                const isOpen  = expanded === a.id;
                const actionColor = a.action === "stopped" ? "text-[#0F766E]" : a.action === "overridden" ? "text-orange-400" : "text-yellow-400";
                const actionLabel = a.action === "stopped" ? "Stopped" : a.action === "overridden" ? "Overridden" : "Pending";
                return (
                  <div key={a.id}>
                    <button className="w-full flex items-center gap-4 py-4 hover:bg-white/[0.01] transition-colors text-left"
                      onClick={() => setExpanded(isOpen ? null : a.id)}>
                      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", sevCfg.color)}>
                        <sevCfg.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-semibold text-slate-100 text-sm">{a.drug1}</span>
                          <span className="text-slate-500 text-xs">+</span>
                          <span className="font-semibold text-slate-100 text-sm">{a.drug2}</span>
                          <span className={cn("px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase", typeCfg.color)}>{typeCfg.label}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{a.patient} · {a.uhid} · {a.date}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider", sevCfg.color)}>
                          <sevCfg.icon className="h-3 w-3" />
                          {sevCfg.label}
                        </span>
                        <span className={cn("text-xs font-bold", actionColor)}>{actionLabel}</span>
                        <ChevronDown className={cn("h-4 w-4 text-slate-600 transition-transform", isOpen && "rotate-180")} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="ml-13 pb-4 pl-12 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Mechanism</p>
                            <p className="text-xs text-slate-300">{a.mechanism}</p>
                          </div>
                          <div className="rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-[#0F766E] mb-1">Recommendation</p>
                            <p className="text-xs text-slate-300">{a.recommendation}</p>
                          </div>
                        </div>
                        {a.overrideReason && (
                          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-orange-400 mb-1">Override Reason</p>
                            <p className="text-xs text-slate-300">{a.overrideReason}</p>
                          </div>
                        )}
                        {a.action === "pending" && (
                          <div className="flex gap-3">
                            <button className="px-4 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">
                              Stop Order
                            </button>
                            <button className="px-4 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold hover:bg-orange-500/20 transition-all">
                              Override with Reason
                            </button>
                            <button className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/8 text-slate-400 text-xs font-bold hover:bg-white/10 transition-all">
                              Acknowledge
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
