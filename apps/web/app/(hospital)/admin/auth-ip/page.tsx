"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ClipboardCheck, Clock, CheckCircle2, XCircle, AlertTriangle, Search, FileText } from "lucide-react";

type AuthStatus = "pending" | "approved" | "rejected" | "query";

const STATUS_CFG: Record<AuthStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:  { label: "Pending Auth",  color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Clock },
  approved: { label: "Approved",      color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",   icon: CheckCircle2 },
  rejected: { label: "Rejected",      color: "text-red-400 bg-red-500/10 border-red-500/20",           icon: XCircle },
  query:    { label: "Query Raised",  color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: AlertTriangle },
};

const AUTHORIZATIONS = [
  { id: "AUTH-001", patient: "Ramesh Kumar",    uhid: "AY-00412", insurer: "Star Health",    tpa: "Vidal Health",  ward: "General Ward",  estAmt: "₹28,500", status: "pending"  as AuthStatus, admitDate: "2026-04-16", diagnosis: "Acute Appendicitis" },
  { id: "AUTH-002", patient: "Sunita Sharma",   uhid: "AY-00389", insurer: "Niva Bupa",      tpa: "Paramount TPA", ward: "ICU",           estAmt: "₹1,20,000",status: "approved" as AuthStatus, admitDate: "2026-04-15", diagnosis: "STEMI – Post-PCI" },
  { id: "AUTH-003", patient: "George Mathew",   uhid: "AY-00345", insurer: "New India",      tpa: "Health India",  ward: "Private Room",  estAmt: "₹55,000", status: "query"    as AuthStatus, admitDate: "2026-04-14", diagnosis: "Knee Replacement" },
  { id: "AUTH-004", patient: "Priya Venkatesh", uhid: "AY-00298", insurer: "CGHS",           tpa: "—",             ward: "Semi-Private",  estAmt: "₹18,000", status: "approved" as AuthStatus, admitDate: "2026-04-13", diagnosis: "Normal Delivery" },
  { id: "AUTH-005", patient: "Arun Nair",       uhid: "AY-00267", insurer: "United India",   tpa: "Raksha TPA",   ward: "General Ward",  estAmt: "₹32,000", status: "rejected" as AuthStatus, admitDate: "2026-04-12", diagnosis: "Elective Hernia Repair" },
];

export default function AuthoriseInpatientPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AuthStatus | "ALL">("ALL");

  const filtered = AUTHORIZATIONS.filter(
    (a) =>
      (filter === "ALL" || a.status === filter) &&
      (a.patient.toLowerCase().includes(search.toLowerCase()) ||
        a.uhid.toLowerCase().includes(search.toLowerCase()) ||
        a.insurer.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = (Object.keys(STATUS_CFG) as AuthStatus[]).map((s) => ({
    status: s,
    count: AUTHORIZATIONS.filter((a) => a.status === s).length,
  }));

  return (
    <>
      <TopBar title="Authorise Inpatient" action={{ label: "New Pre-Auth", href: "#" }} />
      <main className="p-8 space-y-6">
        {/* Status summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {counts.map(({ status, count }) => {
            const cfg = STATUS_CFG[status];
            return (
              <button
                key={status}
                onClick={() => setFilter(filter === status ? "ALL" : status)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all hover:scale-[1.01]",
                  filter === status ? cfg.color : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                )}
              >
                <p className="text-[10px] uppercase tracking-widest text-slate-500">{cfg.label}</p>
                <p className="text-3xl font-bold mt-1">{count}</p>
              </button>
            );
          })}
        </div>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4">
            <CardTitle className="text-sm">Pre-Auth Requests</CardTitle>
            <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Patient, UHID or insurer…"
                className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-52"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 pt-4">
              {filtered.map((a) => {
                const cfg = STATUS_CFG[a.status];
                const Icon = cfg.icon;
                return (
                  <div key={a.id} className="flex items-center gap-6 p-4 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-all cursor-pointer">
                    <div className="h-10 w-10 rounded-xl bg-[#0F766E]/10 flex items-center justify-center shrink-0">
                      <ClipboardCheck className="h-5 w-5 text-[#0F766E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-100">{a.patient}</span>
                        <span className="font-mono text-xs text-slate-500">{a.uhid}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {a.diagnosis} · {a.ward} · Admit: {a.admitDate}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {a.insurer} via {a.tpa}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-[#0F766E] text-base">{a.estAmt}</p>
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider">Est. Cost</p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0", cfg.color)}>
                      <Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </span>
                    <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-200 transition-colors">
                      <FileText className="h-4 w-4" />
                    </button>
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
