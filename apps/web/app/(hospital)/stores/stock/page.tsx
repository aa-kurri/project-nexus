"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Package, ArrowUp, ArrowDown, FileText, Search } from "lucide-react";

type AdjType = "IN" | "OUT" | "WRITE_OFF" | "OPENING";

const ADJUSTMENTS: { id: string; date: string; item: string; batch: string; qty: number; type: AdjType; reason: string; user: string }[] = [
  { id: "ADJ-001", date: "2026-04-16", item: "Paracetamol 500mg", batch: "PCM-0124", qty: 200, type: "IN",       reason: "Purchase receipt",      user: "Admin" },
  { id: "ADJ-002", date: "2026-04-16", item: "Normal Saline 500ml", batch: "NS-0324", qty: -5,  type: "WRITE_OFF", reason: "Expiry / damage",        user: "Pharmacist" },
  { id: "ADJ-003", date: "2026-04-15", item: "Amoxicillin 250mg", batch: "AMX-0224", qty: -30, type: "OUT",       reason: "Correction — over-issue", user: "Nurse" },
  { id: "ADJ-004", date: "2026-04-15", item: "Betadine 100ml",    batch: "BET-0124", qty: 50,  type: "IN",        reason: "Inter-branch transfer",   user: "Admin" },
  { id: "ADJ-005", date: "2026-04-14", item: "Disposable Syringe 5ml", batch: "DS-0424", qty: 500, type: "OPENING", reason: "Opening stock entry", user: "Admin" },
];

const TYPE_CONFIG: Record<AdjType, { label: string; color: string; icon: React.ElementType }> = {
  IN:        { label: "Stock In",   color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20", icon: ArrowDown },
  OUT:       { label: "Stock Out",  color: "text-red-400 bg-red-500/10 border-red-500/20",         icon: ArrowUp },
  WRITE_OFF: { label: "Write-Off",  color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: FileText },
  OPENING:   { label: "Opening",    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",       icon: Package },
};

export default function StockAdjustmentPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AdjType | "ALL">("ALL");

  const filtered = ADJUSTMENTS.filter(
    (a) =>
      (filter === "ALL" || a.type === filter) &&
      (a.item.toLowerCase().includes(search.toLowerCase()) ||
        a.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <TopBar
        title="Stock Adjustment"
        action={{ label: "New Adjustment", href: "#" }}
      />
      <main className="p-8 space-y-6">
        {/* Summary row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(["IN", "OUT", "WRITE_OFF", "OPENING"] as AdjType[]).map((t) => {
            const cfg = TYPE_CONFIG[t];
            const count = ADJUSTMENTS.filter((a) => a.type === t).length;
            return (
              <button
                key={t}
                onClick={() => setFilter(filter === t ? "ALL" : t)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all hover:scale-[1.01]",
                  filter === t ? cfg.color : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                )}
              >
                <p className="text-[10px] uppercase tracking-widest text-slate-500">{cfg.label}</p>
                <p className="text-2xl font-bold mt-1">{count}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">entries this week</p>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4">
            <CardTitle className="text-sm">Adjustment Ledger</CardTitle>
            <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item or ID…"
                className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-48"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Adj. ID", "Date", "Item", "Batch", "Qty", "Type", "Reason", "By"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const cfg = TYPE_CONFIG[a.type];
                  const Icon = cfg.icon;
                  return (
                    <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 pl-0 font-mono text-xs text-slate-400">{a.id}</td>
                      <td className="py-3 px-4 text-xs text-slate-400">{a.date}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{a.item}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">{a.batch}</td>
                      <td className={cn("py-3 px-4 font-bold font-mono", a.qty > 0 ? "text-[#0F766E]" : "text-red-400")}>
                        {a.qty > 0 ? "+" : ""}{a.qty}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider", cfg.color)}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">{a.reason}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{a.user}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-600 text-xs italic">
                      No adjustments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
