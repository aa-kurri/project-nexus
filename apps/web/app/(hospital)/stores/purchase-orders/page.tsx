"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ShoppingCart, CheckCircle2, Clock, Truck, XCircle, Search } from "lucide-react";

type POStatus = "draft" | "sent" | "partial" | "received" | "cancelled";

const PO_STATUS: Record<POStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft:     { label: "Draft",     color: "text-slate-400 bg-slate-500/10 border-slate-500/20",   icon: Clock },
  sent:      { label: "Sent",      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",       icon: ShoppingCart },
  partial:   { label: "Partial",   color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Truck },
  received:  { label: "Received",  color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",   icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-400 bg-red-500/10 border-red-500/20",           icon: XCircle },
};

const POS = [
  { id: "PO-2026-041", supplier: "Girish Surgicals",     items: 12, amount: "₹48,200", date: "2026-04-16", status: "sent"      as POStatus, expected: "2026-04-18" },
  { id: "PO-2026-040", supplier: "JBS Rehab",             items: 5,  amount: "₹31,500", date: "2026-04-15", status: "received"  as POStatus, expected: "2026-04-16" },
  { id: "PO-2026-039", supplier: "MediSource India",      items: 8,  amount: "₹22,750", date: "2026-04-14", status: "partial"   as POStatus, expected: "2026-04-17" },
  { id: "PO-2026-038", supplier: "PharmaCo Distributors", items: 20, amount: "₹1,05,000", date: "2026-04-13", status: "received" as POStatus, expected: "2026-04-14" },
  { id: "PO-2026-037", supplier: "Girish Surgicals",     items: 3,  amount: "₹7,800",  date: "2026-04-12", status: "cancelled" as POStatus, expected: "—" },
  { id: "PO-2026-036", supplier: "HealthMart Supplies",  items: 15, amount: "₹55,300", date: "2026-04-11", status: "draft"     as POStatus, expected: "2026-04-20" },
];

export default function PurchaseOrdersPage() {
  const [search, setSearch] = useState("");

  const filtered = POS.filter(
    (p) =>
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = "₹2,70,550";

  return (
    <>
      <TopBar title="Purchase Orders" action={{ label: "Create PO", href: "#" }} />
      <main className="p-8 space-y-6">
        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {(Object.keys(PO_STATUS) as POStatus[]).map((s) => {
            const cfg = PO_STATUS[s];
            const count = POS.filter((p) => p.status === s).length;
            return (
              <div key={s} className={cn("rounded-xl border p-4", cfg.color)}>
                <p className="text-[10px] uppercase tracking-widest opacity-70">{cfg.label}</p>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </div>
            );
          })}
        </div>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4">
            <CardTitle className="text-sm">
              All POs · <span className="text-[#0F766E]">{totalValue}</span> total value
            </CardTitle>
            <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search PO or supplier…"
                className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-48"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["PO Number", "Supplier", "Items", "Amount", "Date", "Expected", "Status"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const cfg = PO_STATUS[p.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <td className="py-3 px-4 pl-0 font-mono text-xs text-slate-300 font-bold">{p.id}</td>
                      <td className="py-3 px-4 text-slate-200 font-medium">{p.supplier}</td>
                      <td className="py-3 px-4 text-slate-400">{p.items}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">{p.amount}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{p.date}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{p.expected}</td>
                      <td className="py-3 px-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider", cfg.color)}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
