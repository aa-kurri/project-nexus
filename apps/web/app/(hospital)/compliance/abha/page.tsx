"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Link2, CheckCircle2, XCircle, Clock, RefreshCw,
  UserPlus, FileText, QrCode, Zap, AlertCircle,
} from "lucide-react";

// ─── Types & Data ──────────────────────────────────────────────────────────────
type LinkStatus = "linked" | "pending" | "failed" | "not_initiated";

const STATUS_CFG: Record<LinkStatus, { label: string; color: string; icon: React.ElementType }> = {
  linked:        { label: "Linked",        color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",   icon: CheckCircle2 },
  pending:       { label: "Pending",       color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Clock        },
  failed:        { label: "Failed",        color: "text-red-400 bg-red-500/10 border-red-500/20",           icon: XCircle      },
  not_initiated: { label: "Not Linked",    color: "text-slate-500 bg-white/5 border-white/8",              icon: AlertCircle  },
};

const PATIENTS = [
  { uhid: "AY-00412", name: "Ramesh Kumar",    dob: "1978-03-14", phone: "98XXXXXX01", abhaId: "43-1234-5678-0001", status: "linked"        as LinkStatus },
  { uhid: "AY-00389", name: "Sunita Sharma",   dob: "1985-07-22", phone: "97XXXXXX12", abhaId: "43-1234-5678-0002", status: "linked"        as LinkStatus },
  { uhid: "AY-00345", name: "George Mathew",   dob: "1960-11-05", phone: "96XXXXXX23", abhaId: "",                  status: "pending"       as LinkStatus },
  { uhid: "AY-00298", name: "Priya Venkatesh", dob: "1992-02-28", phone: "95XXXXXX34", abhaId: "",                  status: "not_initiated" as LinkStatus },
  { uhid: "AY-00267", name: "Arun Nair",       dob: "1975-09-17", phone: "94XXXXXX45", abhaId: "",                  status: "failed"        as LinkStatus },
  { uhid: "AY-00244", name: "Deepa Iyer",      dob: "1990-05-30", phone: "93XXXXXX56", abhaId: "43-1234-5678-0006", status: "linked"        as LinkStatus },
];

const GATEWAY_STATS = [
  { label: "HIP Status",        value: "Live",    sub: "Connected to NHA gateway", green: true  },
  { label: "ABHA Linked",       value: "2",       sub: "of 6 demo patients",       green: true  },
  { label: "Consent Requests",  value: "3",       sub: "Pending PHR consent",      green: false },
  { label: "Records Shared",    value: "18",      sub: "Via FHIR R4 this month",   green: true  },
];

// ─── Component ─────────────────────────────────────────────────────────────────
export default function AbhaPage() {
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<LinkStatus | "ALL">("ALL");
  const [generating, setGen]      = useState<string | null>(null);

  const filtered = PATIENTS.filter(
    (p) =>
      (filter === "ALL" || p.status === filter) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.uhid.toLowerCase().includes(search.toLowerCase()))
  );

  function triggerGenerate(uhid: string) {
    setGen(uhid);
    setTimeout(() => setGen(null), 2000);
  }

  return (
    <>
      <TopBar title="ABHA / ABDM Integration" action={{ label: "Sync Gateway", href: "#" }} />
      <main className="p-8 space-y-6">

        {/* Gateway stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {GATEWAY_STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
              <p className={cn("text-3xl font-bold mt-1", s.green ? "text-[#0F766E]" : "text-yellow-400")}>{s.value}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <Zap className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">
            ABDM gateway is connected. Patients can be linked to their ABHA Health ID at registration or from this panel.
            Linked patients can access their health records via the <strong className="text-slate-300">PHR App</strong> and consent to share records with other providers.
          </p>
        </div>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4">
            <CardTitle className="text-sm">Patient ABHA Linking</CardTitle>
            <div className="flex items-center gap-3">
              {/* Filter tabs */}
              {(["ALL","linked","pending","failed","not_initiated"] as const).map((s) => (
                <button key={s} onClick={() => setFilter(s)}
                  className={cn("px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                    filter === s
                      ? "bg-[#0F766E] text-white border-[#0F766E]"
                      : "border-white/8 text-muted hover:text-fg hover:bg-white/5"
                  )}>
                  {s === "not_initiated" ? "Not Linked" : s}
                </button>
              ))}
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient…"
                className="bg-black/20 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 outline-none w-40"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-white/5">
              {filtered.map((p) => {
                const cfg = STATUS_CFG[p.status];
                return (
                  <div key={p.uhid} className="flex items-center gap-6 py-4 hover:bg-white/[0.01] transition-colors">
                    <div className="h-9 w-9 rounded-xl bg-[#0F766E]/10 flex items-center justify-center shrink-0">
                      <UserPlus className="h-4 w-4 text-[#0F766E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-100 text-sm">{p.name}</span>
                        <span className="font-mono text-xs text-slate-500">{p.uhid}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">DOB: {p.dob} · {p.phone}</p>
                    </div>
                    {p.abhaId && (
                      <div className="flex items-center gap-2">
                        <QrCode className="h-3.5 w-3.5 text-slate-500" />
                        <span className="font-mono text-xs text-slate-400">{p.abhaId}</span>
                      </div>
                    )}
                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0", cfg.color)}>
                      <cfg.icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                    {p.status !== "linked" && (
                      <button onClick={() => triggerGenerate(p.uhid)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] text-xs font-bold hover:bg-[#0F766E]/20 transition-all">
                        {generating === p.uhid
                          ? <RefreshCw className="h-3 w-3 animate-spin" />
                          : <Link2 className="h-3 w-3" />}
                        {p.status === "failed" ? "Retry" : "Link ABHA"}
                      </button>
                    )}
                    {p.status === "linked" && (
                      <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-200 transition-colors">
                        <FileText className="h-4 w-4" />
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
