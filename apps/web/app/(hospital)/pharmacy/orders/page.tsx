"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ShoppingCart, AlertCircle, CheckCircle2, Clock, Truck,
  Package, Search, ChevronLeft, ChevronRight, FileText,
  Building2, TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type POStatus = "Draft" | "Sent" | "Partial" | "Received" | "Cancelled";

const PURCHASE_ORDERS: {
  id: string; supplier: string; items: number; value: number;
  raisedBy: string; date: string; expectedBy: string; status: POStatus;
  trigger: "Auto" | "Manual";
}[] = [
  { id: "PO-2026-0085", supplier: "MedPlus Pharma Supplies",     items: 6,  value: 24300, raisedBy: "Auto-System",       date: "2026-04-16", expectedBy: "2026-04-19", status: "Draft",     trigger: "Auto"   },
  { id: "PO-2026-0084", supplier: "Cipla Healthcare Ltd",         items: 3,  value: 8750,  raisedBy: "Pharm. Amith",      date: "2026-04-15", expectedBy: "2026-04-17", status: "Sent",      trigger: "Manual" },
  { id: "PO-2026-0083", supplier: "Sun Pharmaceutical Ind.",      items: 8,  value: 41200, raisedBy: "Auto-System",       date: "2026-04-14", expectedBy: "2026-04-16", status: "Partial",   trigger: "Auto"   },
  { id: "PO-2026-0082", supplier: "Abbott Healthcare Ltd",        items: 4,  value: 15600, raisedBy: "Pharm. Renu",       date: "2026-04-13", expectedBy: "2026-04-15", status: "Received",  trigger: "Manual" },
  { id: "PO-2026-0081", supplier: "Lupin Pharmaceuticals",        items: 5,  value: 9800,  raisedBy: "Auto-System",       date: "2026-04-12", expectedBy: "2026-04-14", status: "Received",  trigger: "Auto"   },
  { id: "PO-2026-0080", supplier: "Wockhardt Ltd",                items: 2,  value: 6400,  raisedBy: "Pharm. Amith",      date: "2026-04-11", expectedBy: "2026-04-13", status: "Received",  trigger: "Manual" },
  { id: "PO-2026-0079", supplier: "Baxter India Pvt Ltd",         items: 7,  value: 32800, raisedBy: "Auto-System",       date: "2026-04-10", expectedBy: "2026-04-12", status: "Received",  trigger: "Auto"   },
  { id: "PO-2026-0078", supplier: "Dr. Reddy's Laboratories",     items: 9,  value: 19500, raisedBy: "Pharm. Renu",       date: "2026-04-09", expectedBy: "2026-04-11", status: "Received",  trigger: "Manual" },
  { id: "PO-2026-0077", supplier: "Zydus Healthcare",             items: 3,  value: 7200,  raisedBy: "Auto-System",       date: "2026-04-08", expectedBy: "2026-04-10", status: "Cancelled", trigger: "Auto"   },
  { id: "PO-2026-0076", supplier: "Mankind Pharma Ltd",           items: 5,  value: 11400, raisedBy: "Pharm. Amith",      date: "2026-04-07", expectedBy: "2026-04-09", status: "Received",  trigger: "Manual" },
];

// Low-stock items that triggered auto-PO
const LOW_STOCK_TRIGGERS = [
  { name: "Amoxicillin 250mg Cap",    stock: 45,  reorder: 150, supplier: "Cipla Healthcare Ltd" },
  { name: "Ciprofloxacin 500mg",      stock: 88,  reorder: 100, supplier: "Dr. Reddy's Laboratories" },
  { name: "Insulin Glargine 300U/ml", stock: 18,  reorder: 30,  supplier: "Baxter India Pvt Ltd" },
  { name: "Ondansetron 4mg",          stock: 0,   reorder: 80,  supplier: "Sun Pharmaceutical Ind." },
  { name: "Pantoprazole 40mg",        stock: 0,   reorder: 100, supplier: "MedPlus Pharma Supplies" },
  { name: "Normal Saline 500ml",      stock: 72,  reorder: 50,  supplier: "Baxter India Pvt Ltd" },
];

const STATUS_STYLE: Record<POStatus, string> = {
  Draft:     "bg-slate-500/10 text-slate-400 border-slate-500/20",
  Sent:      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Partial:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Received:  "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20",
  Cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_ICON: Record<POStatus, React.ReactNode> = {
  Draft:     <FileText className="h-3 w-3" />,
  Sent:      <Truck className="h-3 w-3" />,
  Partial:   <Package className="h-3 w-3" />,
  Received:  <CheckCircle2 className="h-3 w-3" />,
  Cancelled: <AlertCircle className="h-3 w-3" />,
};

const PAGE_SIZE = 8;

export default function PurchaseOrdersPage() {
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<POStatus | "All">("All");
  const [page, setPage]               = useState(1);

  const filtered = PURCHASE_ORDERS.filter((po) => {
    const q = search.toLowerCase();
    const matchSearch = po.id.toLowerCase().includes(q) || po.supplier.toLowerCase().includes(q) ||
      po.raisedBy.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || po.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalValue   = PURCHASE_ORDERS.reduce((s, po) => s + po.value, 0);
  const pendingCount = PURCHASE_ORDERS.filter((po) => po.status === "Draft" || po.status === "Sent").length;
  const autoCount    = PURCHASE_ORDERS.filter((po) => po.trigger === "Auto").length;

  return (
    <>
      <TopBar title="Purchase Orders" action={{ label: "Raise Manual PO", href: "/pharmacy/orders" }} />
      <main className="p-8 space-y-6">

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total POs (MTD)"    value={PURCHASE_ORDERS.length.toString()} sub="this month"        color="default" />
          <StatCard label="Open / Pending"     value={pendingCount.toString()}            sub="awaiting delivery" color="yellow"  />
          <StatCard label="Auto-Triggered"     value={autoCount.toString()}               sub="by low-stock rule" color="teal"    />
          <StatCard label="Total PO Value"     value={`₹${(totalValue / 1000).toFixed(0)}k`} sub="MTD spend"    color="purple"  />
        </div>

        {/* Low-stock alert banner */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-red-400 mb-2">Low-Stock Triggers — Action Required</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {LOW_STOCK_TRIGGERS.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-2 bg-black/20 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-200 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-600">{item.supplier}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("font-mono font-bold text-xs", item.stock === 0 ? "text-red-400" : "text-orange-400")}>
                        {item.stock}
                      </p>
                      <p className="text-[9px] text-slate-600">/ {item.reorder}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-xl px-4 py-2.5 flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="PO number, supplier, or raised by…"
              className="bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none flex-1"
            />
          </div>
          <div className="flex gap-1 bg-surface/40 p-1 rounded-xl border border-border/40">
            {(["All", "Draft", "Sent", "Partial", "Received", "Cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                  statusFilter === s ? "bg-[#0F766E] text-white" : "text-muted hover:text-fg hover:bg-white/5"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* PO table */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/10 bg-black/10 pb-4">
            <CardTitle className="text-sm">
              {filtered.length} <span className="text-slate-600 font-normal">purchase orders</span>
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <TrendingDown className="h-3.5 w-3.5" />
              Procurement Log
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-black/10">
                  {["PO Number", "Supplier", "Items", "Value", "Raised By", "Date", "Exp. By", "Trigger", "Status"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paged.map((po) => (
                  <tr key={po.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 pl-6 font-mono text-xs text-[#0F766E] font-bold">{po.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                        <span className="text-xs text-slate-300 font-medium">{po.supplier}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-200">{po.items}</span>
                      <span className="text-slate-600 text-xs ml-1">SKU</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#0F766E] font-bold">
                      ₹{po.value.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{po.raisedBy}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{po.date}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{po.expectedBy}</td>
                    <td className="py-3.5 px-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border",
                        po.trigger === "Auto"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "bg-white/5 text-slate-500 border-white/8"
                      )}>
                        {po.trigger}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", STATUS_STYLE[po.status])}>
                        {STATUS_ICON[po.status]}
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-600 text-xs italic">No purchase orders match the current filter</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {totalPages} · {filtered.length} records</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string;
  color: "default" | "yellow" | "teal" | "purple";
}) {
  const styles = {
    default: "border-white/8 bg-white/[0.02] text-slate-200",
    yellow:  "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
    teal:    "border-[#0F766E]/20 bg-[#0F766E]/5 text-[#0F766E]",
    purple:  "border-purple-500/20 bg-purple-500/5 text-purple-400",
  };
  return (
    <div className={cn("rounded-xl border px-5 py-4", styles[color])}>
      <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>
    </div>
  );
}
