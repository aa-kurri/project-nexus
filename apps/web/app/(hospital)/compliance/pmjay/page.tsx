"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BadgeIndianRupee, CheckCircle2, Clock, XCircle, AlertTriangle,
  Search, Send, FileText, RefreshCw,
} from "lucide-react";

type ClaimStatus = "pre_auth_pending" | "pre_auth_approved" | "submitted" | "settled" | "rejected" | "query";

const STATUS_CFG: Record<ClaimStatus, { label: string; color: string; icon: React.ElementType }> = {
  pre_auth_pending:  { label: "Pre-Auth Pending",  color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",  icon: Clock          },
  pre_auth_approved: { label: "Pre-Auth Approved", color: "text-blue-400 bg-blue-500/10 border-blue-500/20",        icon: CheckCircle2   },
  submitted:         { label: "Submitted",          color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",        icon: Send           },
  settled:           { label: "Settled",            color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",    icon: CheckCircle2   },
  rejected:          { label: "Rejected",           color: "text-red-400 bg-red-500/10 border-red-500/20",           icon: XCircle        },
  query:             { label: "Query Raised",       color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: AlertTriangle  },
};

const CLAIMS = [
  { id: "PMJAY-2026-001", patient: "Lalitha Devi",    uhid: "AY-00612", benefId: "PMJAY-TS-12345", procedure: "Knee Replacement (Bilateral)", icd: "M17.11", approvedAmt: "₹80,000", claimedAmt: "₹80,000", status: "settled"           as ClaimStatus, admitDate: "2026-04-01", dischargeDate: "2026-04-08" },
  { id: "PMJAY-2026-002", patient: "Ramu Yadav",      uhid: "AY-00589", benefId: "PMJAY-TS-67890", procedure: "CABG — Coronary Bypass",       icd: "I25.10", approvedAmt: "₹1,50,000",claimedAmt: "₹1,50,000",status: "submitted"          as ClaimStatus, admitDate: "2026-04-10", dischargeDate: "2026-04-17" },
  { id: "PMJAY-2026-003", patient: "Savitri Bai",     uhid: "AY-00567", benefId: "PMJAY-TS-11223", procedure: "Cataract Surgery (L+R)",       icd: "H26.9",  approvedAmt: "₹18,000",  claimedAmt: "₹18,000", status: "pre_auth_approved" as ClaimStatus, admitDate: "2026-04-16", dischargeDate: "—"          },
  { id: "PMJAY-2026-004", patient: "Govind Prasad",   uhid: "AY-00543", benefId: "PMJAY-TS-44556", procedure: "TURP — Prostate",              icd: "N40.1",  approvedAmt: "—",         claimedAmt: "₹35,000", status: "pre_auth_pending"  as ClaimStatus, admitDate: "2026-04-16", dischargeDate: "—"          },
  { id: "PMJAY-2026-005", patient: "Rukmini Devi",    uhid: "AY-00521", benefId: "PMJAY-AP-78901", procedure: "Normal Delivery",              icd: "O80",    approvedAmt: "₹9,000",   claimedAmt: "₹9,000",  status: "query"             as ClaimStatus, admitDate: "2026-04-12", dischargeDate: "2026-04-14" },
  { id: "PMJAY-2026-006", patient: "Shankar Naidu",   uhid: "AY-00498", benefId: "PMJAY-TS-99001", procedure: "Cholecystectomy (Lap)",        icd: "K80.20", approvedAmt: "—",         claimedAmt: "₹25,000", status: "rejected"          as ClaimStatus, admitDate: "2026-04-08", dischargeDate: "2026-04-10" },
];

const SUMMARY_STATS = [
  { label: "Total Claims",     value: CLAIMS.length.toString() },
  { label: "Settled (MTD)",    value: "₹80K",  green: true  },
  { label: "Pending Auth",     value: "1",     green: false },
  { label: "Rejected / Query", value: "2",     green: false },
];

export default function PmjayPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ClaimStatus | "ALL">("ALL");
  const [verifying, setVerifying] = useState<string | null>(null);

  const filtered = CLAIMS.filter(
    (c) =>
      (filter === "ALL" || c.status === filter) &&
      (c.patient.toLowerCase().includes(search.toLowerCase()) ||
        c.benefId.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase()))
  );

  function verifyBenef(id: string) {
    setVerifying(id);
    setTimeout(() => setVerifying(null), 1800);
  }

  return (
    <>
      <TopBar title="PMJAY / Ayushman Bharat Claims" action={{ label: "New Pre-Auth Request", href: "#" }} />
      <main className="p-8 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SUMMARY_STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
              <p className={cn("text-3xl font-bold mt-1", (s as { green?: boolean }).green ? "text-[#0F766E]" : "text-yellow-400")}>{s.value}</p>
            </div>
          ))}
        </div>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4 flex-wrap gap-4">
            <CardTitle className="text-sm">Claim Tracker</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              {(["ALL","pre_auth_pending","pre_auth_approved","submitted","settled","rejected","query"] as const).map((s) => (
                <button key={s} onClick={() => setFilter(s)}
                  className={cn("px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all",
                    filter === s
                      ? "bg-[#0F766E] text-white border-[#0F766E]"
                      : "border-white/8 text-muted hover:text-fg hover:bg-white/5"
                  )}>
                  {s === "ALL" ? "All" : STATUS_CFG[s].label}
                </button>
              ))}
              <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Claim ID, patient, beneficiary…"
                  className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-44" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 pt-4">
              {filtered.map((c) => {
                const cfg = STATUS_CFG[c.status];
                return (
                  <div key={c.id} className="flex items-center gap-5 p-4 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-all">
                    <div className="h-10 w-10 rounded-xl bg-[#0F766E]/10 flex items-center justify-center shrink-0">
                      <BadgeIndianRupee className="h-5 w-5 text-[#0F766E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-100 text-sm">{c.patient}</span>
                        <span className="font-mono text-xs text-slate-500">{c.uhid}</span>
                        <span className="font-mono text-[10px] text-slate-600">{c.benefId}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{c.procedure}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">ICD-10: {c.icd} · Admit: {c.admitDate} · Discharge: {c.dischargeDate}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-[#0F766E] text-sm">{c.claimedAmt}</p>
                      <p className="text-[10px] text-slate-600">Approved: {c.approvedAmt}</p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0", cfg.color)}>
                      <cfg.icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {(c.status === "pre_auth_pending" || c.status === "rejected") && (
                        <button onClick={() => verifyBenef(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] text-[10px] font-bold hover:bg-[#0F766E]/20 transition-all">
                          {verifying === c.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Verify
                        </button>
                      )}
                      {c.status === "pre_auth_approved" && (
                        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 transition-all">
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
