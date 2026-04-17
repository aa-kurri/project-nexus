"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, CheckCircle2, Clock, XCircle } from "lucide-react";

type Status = "pending" | "approved" | "rejected";

const TRANSFERS = [
  { id: "TRF-2026-001", from: "Central Pharmacy", to: "Ward 2 Pantry",   items: 3, date: "2026-04-16", status: "pending"  as Status, requestedBy: "Sr. Nurse Rekha" },
  { id: "TRF-2026-002", from: "Stores",            to: "OT Pharmacy",    items: 8, date: "2026-04-16", status: "approved" as Status, requestedBy: "OT Incharge" },
  { id: "TRF-2026-003", from: "Central Pharmacy",  to: "ICU",            items: 2, date: "2026-04-15", status: "approved" as Status, requestedBy: "Dr. Kapoor" },
  { id: "TRF-2026-004", from: "Stores",            to: "Emergency Dept", items: 5, date: "2026-04-14", status: "rejected" as Status, requestedBy: "ER Nurse" },
];

const STATUS_CFG: Record<Status, { label: string; color: string; icon: React.ElementType }> = {
  pending:  { label: "Pending",  color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Clock },
  approved: { label: "Approved", color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",   icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-400 bg-red-500/10 border-red-500/20",           icon: XCircle },
};

export default function StockTransferPage() {
  const [filter, setFilter] = useState<Status | "ALL">("ALL");

  const filtered = filter === "ALL" ? TRANSFERS : TRANSFERS.filter((t) => t.status === filter);

  return (
    <>
      <TopBar title="Stock Transfer" action={{ label: "Raise Transfer", href: "#" }} />
      <main className="p-8 space-y-6">
        {/* Filter tabs */}
        <div className="flex gap-2 bg-surface/40 p-1 rounded-xl border border-border/40 w-fit">
          {(["ALL", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                filter === s
                  ? "bg-[#0F766E] text-white shadow-lg shadow-[#0F766E]/20"
                  : "text-muted hover:text-fg hover:bg-white/5"
              )}
            >
              {s === "ALL" ? "All" : STATUS_CFG[s].label}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {filtered.map((t) => {
            const cfg = STATUS_CFG[t.status];
            const Icon = cfg.icon;
            return (
              <Card key={t.id} className="border-border/40 bg-surface/50 backdrop-blur-xl hover:bg-white/5 transition-all cursor-pointer">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="h-10 w-10 rounded-xl bg-[#0F766E]/10 flex items-center justify-center shrink-0">
                        <ArrowLeftRight className="h-5 w-5 text-[#0F766E]" />
                      </div>
                      <div>
                        <p className="font-mono text-xs text-slate-500">{t.id}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-sm text-slate-200">{t.from}</span>
                          <ArrowLeftRight className="h-3 w-3 text-slate-500" />
                          <span className="font-bold text-sm text-[#0F766E]">{t.to}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t.items} item{t.items > 1 ? "s" : ""} · Requested by {t.requestedBy} · {t.date}
                        </p>
                      </div>
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider", cfg.color)}>
                      <Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </>
  );
}
