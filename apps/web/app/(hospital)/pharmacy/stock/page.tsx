"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Pill, Package, AlertCircle, ShoppingCart, RefreshCw, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StockStatus = "In Stock" | "Low Stock" | "Near Expiry" | "Out of Stock";

const STOCK: {
  name: string; generic: string; category: string; batch: string;
  stock: number; reorderAt: number; expiry: string; mrp: number; status: StockStatus;
}[] = [
  { name: "Paracetamol 500mg",        generic: "Paracetamol",       category: "Analgesic",      batch: "PCM-2024-01", stock: 1240, reorderAt: 200,  expiry: "2026-12", mrp: 2.50,    status: "In Stock"     },
  { name: "Amoxicillin 250mg Cap",    generic: "Amoxicillin",       category: "Antibiotic",     batch: "AMX-2024-02", stock: 45,   reorderAt: 150,  expiry: "2026-08", mrp: 8.00,    status: "Low Stock"    },
  { name: "Metformin 500mg",          generic: "Metformin HCl",     category: "Anti-Diabetic",  batch: "MET-2025-01", stock: 890,  reorderAt: 200,  expiry: "2026-05", mrp: 1.20,    status: "Near Expiry"  },
  { name: "Pantoprazole 40mg",        generic: "Pantoprazole",      category: "PPI",            batch: "—",           stock: 0,    reorderAt: 100,  expiry: "—",       mrp: 6.00,    status: "Out of Stock" },
  { name: "Amlodipine 5mg",           generic: "Amlodipine",        category: "Anti-HTN",       batch: "AML-2025-02", stock: 320,  reorderAt: 100,  expiry: "2027-03", mrp: 3.50,    status: "In Stock"     },
  { name: "Ciprofloxacin 500mg",      generic: "Ciprofloxacin",     category: "Antibiotic",     batch: "CIP-2024-03", stock: 88,   reorderAt: 100,  expiry: "2026-06", mrp: 12.00,   status: "Low Stock"    },
  { name: "Atorvastatin 10mg",        generic: "Atorvastatin",      category: "Statin",         batch: "ATO-2025-01", stock: 560,  reorderAt: 150,  expiry: "2027-01", mrp: 4.00,    status: "In Stock"     },
  { name: "Normal Saline 500ml",      generic: "NaCl 0.9%",         category: "IV Fluid",       batch: "NS-2025-03",  stock: 72,   reorderAt: 50,   expiry: "2026-04", mrp: 38.00,   status: "Near Expiry"  },
  { name: "Dextrose 5% 500ml",        generic: "D5W",               category: "IV Fluid",       batch: "D5-2025-02",  stock: 150,  reorderAt: 50,   expiry: "2026-09", mrp: 40.00,   status: "In Stock"     },
  { name: "Insulin Glargine 300U/ml", generic: "Insulin Glargine",  category: "Insulin",        batch: "INS-2025-01", stock: 18,   reorderAt: 30,   expiry: "2026-07", mrp: 850.00,  status: "Low Stock"    },
  { name: "Ceftriaxone 1g Inj",       generic: "Ceftriaxone",       category: "Antibiotic",     batch: "CEF-2025-02", stock: 240,  reorderAt: 60,   expiry: "2026-11", mrp: 65.00,   status: "In Stock"     },
  { name: "Ondansetron 4mg",          generic: "Ondansetron",       category: "Anti-Emetic",    batch: "OND-2024-04", stock: 0,    reorderAt: 80,   expiry: "—",       mrp: 7.50,    status: "Out of Stock" },
  { name: "Betadine 100ml",           generic: "Povidone Iodine",   category: "Antiseptic",     batch: "BET-2025-01", stock: 95,   reorderAt: 50,   expiry: "2027-05", mrp: 48.00,   status: "In Stock"     },
  { name: "Azithromycin 500mg",       generic: "Azithromycin",      category: "Antibiotic",     batch: "AZI-2025-01", stock: 420,  reorderAt: 100,  expiry: "2027-02", mrp: 18.00,   status: "In Stock"     },
];

const BADGE: Record<StockStatus, string> = {
  "In Stock":     "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20",
  "Low Stock":    "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Near Expiry":  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Out of Stock": "bg-red-500/10 text-red-400 border-red-500/20",
};

const CATEGORIES = ["All", ...Array.from(new Set(STOCK.map((s) => s.category))).sort()];

export default function PharmacyStockPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "All">("All");

  const alerts = {
    outOfStock: STOCK.filter((s) => s.status === "Out of Stock").length,
    lowStock:   STOCK.filter((s) => s.status === "Low Stock").length,
    nearExpiry: STOCK.filter((s) => s.status === "Near Expiry").length,
    total:      STOCK.length,
  };

  const filtered = STOCK.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.generic.toLowerCase().includes(search.toLowerCase()) ||
      s.batch.toLowerCase().includes(search.toLowerCase());
    const matchCat    = category === "All" || s.category === category;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <>
      <TopBar
        title="Pharmacy Stock"
        action={{ label: "Raise PO", href: "/stores/purchase-orders" }}
      />
      <main className="p-8 space-y-6">

        {/* Alert KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Total SKUs"    value={alerts.total}      sub="in formulary"      color="default"  icon={Pill}         onClick={() => setStatusFilter("All")} />
          <KpiCard title="Out of Stock"  value={alerts.outOfStock} sub="immediate action"  color="red"      icon={AlertCircle}  onClick={() => setStatusFilter("Out of Stock")} />
          <KpiCard title="Low Stock"     value={alerts.lowStock}   sub="below reorder pt"  color="orange"   icon={ShoppingCart} onClick={() => setStatusFilter("Low Stock")} />
          <KpiCard title="Near Expiry"   value={alerts.nearExpiry} sub="within 90 days"    color="yellow"   icon={RefreshCw}    onClick={() => setStatusFilter("Near Expiry")} />
        </div>

        {/* Category pill filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium border transition-all",
                category === c
                  ? "bg-[#0F766E] text-white border-[#0F766E]"
                  : "border-white/8 text-muted hover:text-fg hover:bg-white/5"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Table */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/10 bg-black/10 pb-4">
            <CardTitle className="text-sm">
              {filtered.length} <span className="text-slate-600 font-normal">items</span>
            </CardTitle>
            <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, generic or batch…"
                className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-52"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-black/10">
                  {["Item / Generic", "Category", "Batch", "Stock Qty", "Reorder At", "Expiry", "MRP", "Status"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((item) => {
                  const stockPct = item.reorderAt > 0
                    ? Math.min(100, Math.round((item.stock / (item.reorderAt * 5)) * 100))
                    : 100;
                  return (
                    <tr key={item.batch + item.name} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3.5 px-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-[#0F766E]/10 flex items-center justify-center border border-[#0F766E]/20 shrink-0">
                            <Package className="h-4 w-4 text-[#0F766E]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-200 truncate">{item.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{item.generic}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-500 bg-white/5 border border-white/8 px-2 py-0.5 rounded-md">{item.category}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{item.batch}</td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 min-w-[80px]">
                          <span className={cn("font-mono font-bold text-sm", item.stock === 0 ? "text-red-400" : item.stock <= item.reorderAt ? "text-orange-400" : "text-slate-200")}>
                            {item.stock.toLocaleString()}
                          </span>
                          <div className="h-1 w-16 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", stockPct < 20 ? "bg-red-500" : stockPct < 40 ? "bg-orange-500" : "bg-[#0F766E]")}
                              style={{ width: `${stockPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">{item.reorderAt.toLocaleString()}</td>
                      <td className={cn("py-3.5 px-4 text-xs font-mono", item.expiry === "—" ? "text-slate-700" : item.status === "Near Expiry" ? "text-yellow-400 font-bold" : "text-slate-500")}>
                        {item.expiry}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#0F766E]">₹{item.mrp.toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border", BADGE[item.status])}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-600 text-xs italic">
                      No items match the current filter
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

function KpiCard({
  title, value, sub, color, icon: Icon, onClick,
}: {
  title: string; value: number; sub: string;
  color: "default" | "red" | "orange" | "yellow";
  icon: React.ElementType;
  onClick: () => void;
}) {
  const colorMap = {
    default: "border-white/8 bg-white/[0.02] text-slate-200",
    red:     "border-red-500/20 bg-red-500/5 text-red-400",
    orange:  "border-orange-500/20 bg-orange-500/5 text-orange-400",
    yellow:  "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
  };
  return (
    <button
      onClick={onClick}
      className={cn("rounded-xl border p-4 text-left transition-all hover:scale-[1.01] hover:brightness-110 w-full", colorMap[color])}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">{title}</p>
        <Icon className="h-4 w-4 opacity-40" />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>
    </button>
  );
}
