"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp, AlertTriangle, CheckCircle2, IndianRupee, Search, Plus,
} from "lucide-react";

type LeakStatus = "flagged" | "resolved" | "ignored";

const STATUS_CFG: Record<LeakStatus, { label: string; color: string; icon: React.ElementType }> = {
  flagged:  { label: "Flagged",  color: "text-red-400 bg-red-500/10 border-red-500/20",         icon: AlertTriangle },
  resolved: { label: "Resolved", color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",  icon: CheckCircle2  },
  ignored:  { label: "Ignored",  color: "text-slate-500 bg-white/5 border-white/8",             icon: AlertTriangle },
};

interface LeakItem {
  id: string; date: string; patient: string; uhid: string; bed: string;
  ordered: string; billed: boolean; module: string; estRevenue: string; status: LeakStatus;
}

const LEAKS: LeakItem[] = [
  { id: "LK-001", date: "2026-04-16 08:15", patient: "Ramesh Kumar",   uhid: "AY-00412", bed: "IPD-204",  ordered: "Inj. Ceftriaxone 1g IV BD × 3 doses",       billed: false, module: "Pharmacy",  estRevenue: "₹1,350", status: "flagged"  },
  { id: "LK-002", date: "2026-04-16 10:00", patient: "Sunita Sharma",  uhid: "AY-00389", bed: "ICU-2",    ordered: "ABG (STAT × 2)",                              billed: false, module: "LIMS",      estRevenue: "₹1,400", status: "flagged"  },
  { id: "LK-003", date: "2026-04-16 11:30", patient: "George Mathew",  uhid: "AY-00345", bed: "IPD-112",  ordered: "Physiotherapy session (2× today)",            billed: false, module: "Services",  estRevenue: "₹800",   status: "flagged"  },
  { id: "LK-004", date: "2026-04-15 14:00", patient: "Arun Nair",      uhid: "AY-00267", bed: "IPD-215",  ordered: "OT pack — Lap Chole disposables",             billed: true,  module: "OT",        estRevenue: "₹4,500", status: "resolved" },
  { id: "LK-005", date: "2026-04-15 09:30", patient: "Priya Venkatesh",uhid: "AY-00298", bed: "WARD-301", ordered: "Diet — Diabetic ANC 3 days",                  billed: false, module: "Diet",      estRevenue: "₹600",   status: "ignored"  },
  { id: "LK-006", date: "2026-04-14 16:00", patient: "Krishnamurti Rao",uhid:"AY-00501", bed: "ICU-4",    ordered: "Ventilator support Day 2 (additional charge)",billed: false, module: "ICU",       estRevenue: "₹3,000", status: "flagged"  },
];

const STATS = [
  { label: "Flagged Today",     value: LEAKS.filter(l => l.status === "flagged").length.toString(),   color: "text-red-400"    },
  { label: "Resolved (MTD)",    value: LEAKS.filter(l => l.status === "resolved").length.toString(),  color: "text-[#0F766E]"  },
  { label: "Est. Revenue at Risk", value: "₹6,750",  color: "text-yellow-400" },
  { label: "Recovery Rate (MTD)", value: "78%",       color: "text-[#0F766E]"  },
];

export default function RevenueAuditPage() {
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<LeakStatus | "ALL">("ALL");
  const [leaks, setLeaks]       = useState<LeakItem[]>(LEAKS);

  const filtered = leaks.filter(
    (l) =>
      (filter === "ALL" || l.status === filter) &&
      (l.patient.toLowerCase().includes(search.toLowerCase()) ||
        l.ordered.toLowerCase().includes(search.toLowerCase()) ||
        l.module.toLowerCase().includes(search.toLowerCase()))
  );

  function resolve(id: string) {
    setLeaks((prev) => prev.map((l) => l.id === id ? { ...l, status: "resolved" as LeakStatus, billed: true } : l));
  }

  return (
    <>
      <TopBar title="Revenue Leakage Audit" />
      <main className="p-8 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
              <p className={cn("text-3xl font-bold mt-1", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <TrendingUp className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">
            Compares <strong className="text-slate-300">orders issued</strong> (CPOE, LIMS, pharmacy, OT) against
            <strong className="text-slate-300"> charges billed</strong> every 4 hours. Unbilled services are flagged for billing staff review.
            Average Indian hospital recovers <strong className="text-yellow-400">15–20% additional revenue</strong> after enabling this.
          </p>
        </div>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4">
            <CardTitle className="text-sm">Unbilled Service Alerts</CardTitle>
            <div className="flex items-center gap-3">
              {(["ALL","flagged","resolved","ignored"] as const).map((s) => (
                <button key={s} onClick={() => setFilter(s)}
                  className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                    filter === s
                      ? s === "ALL" ? "bg-[#0F766E] text-white border-[#0F766E]" : STATUS_CFG[s].color
                      : "border-white/8 text-muted hover:text-fg hover:bg-white/5"
                  )}>
                  {s === "ALL" ? "All" : STATUS_CFG[s].label}
                </button>
              ))}
              <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Patient or service…"
                  className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-36" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-white/5">
              {filtered.map((l) => {
                const cfg = STATUS_CFG[l.status];
                return (
                  <div key={l.id} className="flex items-center gap-5 py-3.5 hover:bg-white/[0.01] transition-colors">
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", cfg.color)}>
                      <cfg.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 font-medium truncate">{l.ordered}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{l.patient} · {l.uhid} · {l.bed} · {l.date}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/8 text-slate-400 text-[10px] font-bold">{l.module}</span>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-[#0F766E]">{l.estRevenue}</p>
                      <p className="text-[10px] text-slate-600">Est. charge</p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0", cfg.color)}>
                      <cfg.icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                    {l.status === "flagged" && (
                      <button onClick={() => resolve(l.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0F766E] text-white text-[10px] font-bold hover:bg-[#0F766E]/90 transition-all shrink-0">
                        <Plus className="h-3 w-3" /> Add to Bill
                      </button>
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
