"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, Send,
  RefreshCw, Search, FileText, IndianRupee,
} from "lucide-react";

type CashlessStep = "eligibility" | "pre_auth" | "enhancement" | "final_bill" | "submitted" | "settled" | "rejected";

const STEP_ORDER: CashlessStep[] = ["eligibility","pre_auth","enhancement","final_bill","submitted","settled"];

const STEP_CFG: Record<CashlessStep, { label: string; color: string; icon: React.ElementType }> = {
  eligibility:  { label: "Eligibility",   color: "text-blue-400 bg-blue-500/10 border-blue-500/20",      icon: CheckCircle2 },
  pre_auth:     { label: "Pre-Auth",      color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Clock        },
  enhancement:  { label: "Enhancement",  color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: AlertTriangle},
  final_bill:   { label: "Final Bill",   color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",        icon: FileText     },
  submitted:    { label: "Submitted",    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",  icon: Send         },
  settled:      { label: "Settled",      color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",    icon: CheckCircle2 },
  rejected:     { label: "Rejected",     color: "text-red-400 bg-red-500/10 border-red-500/20",           icon: AlertTriangle},
};

interface TpaCase {
  id: string; patient: string; uhid: string; tpa: string; insurer: string;
  policy: string; diagnosis: string; ward: string;
  approvedAmt: number; utilised: number;
  step: CashlessStep; admitDate: string;
}

const CASES: TpaCase[] = [
  { id: "CS-001", patient: "Ramesh Kumar",   uhid: "AY-00412", tpa: "Vidal Health",   insurer: "Star Health",  policy: "FHO-TS-2023-112233", diagnosis: "Acute Appendicitis",    ward: "General",      approvedAmt: 45000,  utilised: 38200, step: "final_bill",  admitDate: "2026-04-13" },
  { id: "CS-002", patient: "Sunita Sharma",  uhid: "AY-00389", tpa: "Paramount TPA",  insurer: "Niva Bupa",    policy: "NB-2024-556677",     diagnosis: "STEMI Post-PCI",        ward: "ICU",          approvedAmt: 180000, utilised: 162000,step: "enhancement", admitDate: "2026-04-15" },
  { id: "CS-003", patient: "George Mathew",  uhid: "AY-00345", tpa: "Health India",   insurer: "New India",    policy: "NIA-2022-889900",    diagnosis: "Knee Replacement",      ward: "Semi-Private", approvedAmt: 350000, utilised: 180000,step: "pre_auth",    admitDate: "2026-04-16" },
  { id: "CS-004", patient: "Priya Venkatesh",uhid: "AY-00298", tpa: "—",             insurer: "CGHS",         policy: "CGHS-HYD-0042",      diagnosis: "Normal Delivery",       ward: "Semi-Private", approvedAmt: 28000,  utilised: 28000, step: "settled",     admitDate: "2026-04-12" },
  { id: "CS-005", patient: "Arun Nair",      uhid: "AY-00267", tpa: "Raksha TPA",    insurer: "United India", policy: "UII-2021-334455",    diagnosis: "Hernia Repair",         ward: "General",      approvedAmt: 0,      utilised: 32000, step: "rejected",    admitDate: "2026-04-12" },
];

function StepTracker({ current }: { current: CashlessStep }) {
  const idx = STEP_ORDER.indexOf(current);
  return (
    <div className="flex items-center gap-1">
      {STEP_ORDER.map((step, i) => {
        const done    = i < idx;
        const active  = i === idx;
        const cfg     = STEP_CFG[step];
        return (
          <div key={step} className="flex items-center gap-1">
            <div className={cn("h-1.5 w-6 rounded-full transition-all",
              done ? "bg-[#0F766E]" : active ? cfg.color.split(" ")[0] + " opacity-80" : "bg-white/10",
              active && "bg-yellow-400"
            )} />
          </div>
        );
      })}
    </div>
  );
}

export default function TpaCyclePage() {
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<CashlessStep | "ALL">("ALL");
  const [verifying, setVer]   = useState<string | null>(null);

  const filtered = CASES.filter(
    (c) =>
      (filter === "ALL" || c.step === filter) &&
      (c.patient.toLowerCase().includes(search.toLowerCase()) ||
        c.tpa.toLowerCase().includes(search.toLowerCase()) ||
        c.insurer.toLowerCase().includes(search.toLowerCase()))
  );

  const settledRevenue = CASES.filter(c => c.step === "settled").reduce((s,c) => s + c.approvedAmt, 0);

  return (
    <>
      <TopBar title="TPA Cashless Cycle" action={{ label: "New Cashless Case", href: "#" }} />
      <main className="p-8 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Cases",     value: CASES.filter(c => !["settled","rejected"].includes(c.step)).length.toString(), color: "text-[#0F766E]" },
            { label: "Enhancement Alert",value: CASES.filter(c => c.step === "enhancement").length.toString(),                 color: "text-orange-400" },
            { label: "Settled (MTD)",    value: `₹${(settledRevenue/1000).toFixed(0)}K`,                                       color: "text-[#0F766E]" },
            { label: "Rejected",         value: CASES.filter(c => c.step === "rejected").length.toString(),                   color: "text-red-400"    },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
              <p className={cn("text-3xl font-bold mt-1", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4 flex-wrap gap-4">
            <CardTitle className="text-sm">Cashless Case Tracker</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              {(["ALL","pre_auth","enhancement","final_bill","submitted","settled","rejected"] as const).map((s) => (
                <button key={s} onClick={() => setFilter(s)}
                  className={cn("px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all",
                    filter === s
                      ? s === "ALL" ? "bg-[#0F766E] text-white border-[#0F766E]" : STEP_CFG[s].color
                      : "border-white/8 text-muted hover:text-fg hover:bg-white/5"
                  )}>
                  {s === "ALL" ? "All" : STEP_CFG[s].label}
                </button>
              ))}
              <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Patient, TPA or insurer…"
                  className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-44" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 pt-4">
              {filtered.map((c) => {
                const cfg    = STEP_CFG[c.step];
                const pctUsed= c.approvedAmt > 0 ? Math.round((c.utilised / c.approvedAmt) * 100) : 0;
                return (
                  <div key={c.id} className="flex items-center gap-5 p-4 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-all">
                    <div className="h-10 w-10 rounded-xl bg-[#0F766E]/10 flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5 text-[#0F766E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-slate-100 text-sm">{c.patient}</span>
                        <span className="font-mono text-xs text-slate-500">{c.uhid}</span>
                        <span className="text-xs text-slate-600">{c.insurer} via {c.tpa}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{c.diagnosis} · {c.ward} · Admit: {c.admitDate}</p>
                      <div className="mt-2">
                        <StepTracker current={c.step} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {c.approvedAmt > 0 ? (
                        <>
                          <p className="font-mono text-sm font-bold text-[#0F766E]">₹{c.approvedAmt.toLocaleString("en-IN")}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">Approved</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="h-1 w-20 bg-white/10 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", pctUsed >= 80 ? "bg-orange-400" : "bg-[#0F766E]")}
                                style={{ width: `${Math.min(pctUsed, 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-500">{pctUsed}%</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500">Pending approval</p>
                      )}
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0", cfg.color)}>
                      <cfg.icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.step === "pre_auth" && (
                        <button onClick={() => { setVer(c.id); setTimeout(() => setVer(null), 1500); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 transition-all">
                          {verifying === c.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Verify Policy
                        </button>
                      )}
                      {c.step === "enhancement" && (
                        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold hover:bg-orange-500/20 transition-all">
                          <Send className="h-3 w-3" /> Request Enhancement
                        </button>
                      )}
                      {c.step === "final_bill" && (
                        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0F766E] text-white text-[10px] font-bold hover:bg-[#0F766E]/90 transition-all">
                          <Send className="h-3 w-3" /> Submit Claim
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-200 transition-colors">
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
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
