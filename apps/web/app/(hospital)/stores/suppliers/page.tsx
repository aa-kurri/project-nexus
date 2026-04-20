"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Truck, Search, Phone, Mail, MapPin, CheckCircle2, XCircle } from "lucide-react";

const SUPPLIERS = [
  { id: "SUP-001", name: "Girish Surgicals",      gstin: "29ABCDE1234F1Z5", city: "Hyderabad", phone: "+91 98400 11234", email: "orders@girishsurgicals.com",  terms: "Net 30", active: true,  categories: ["Consumables", "Surgical"] },
  { id: "SUP-002", name: "JBS Rehab",              gstin: "27FGHIJ5678K2L6", city: "Mumbai",    phone: "+91 98765 43210", email: "supply@jbsrehab.in",          terms: "Net 15", active: true,  categories: ["Orthopedic", "Rehab"] },
  { id: "SUP-003", name: "MediSource India",        gstin: "33KLMNO9012P3Q7", city: "Bengaluru",   phone: "+91 99001 23456", email: "info@medisource.co.in",       terms: "Advance",active: true,  categories: ["Pharmaceuticals"] },
  { id: "SUP-004", name: "PharmaCo Distributors",  gstin: "07RSTUV3456W4X8", city: "Delhi",     phone: "+91 98111 00000", email: "sales@pharmaco.in",           terms: "Net 45", active: false, categories: ["Pharmaceuticals", "OTC"] },
  { id: "SUP-005", name: "HealthMart Supplies",    gstin: "36YZABC7890D5E9", city: "Bengaluru", phone: "+91 80900 55500", email: "purchase@healthmart.in",      terms: "Net 30", active: true,  categories: ["Lab Reagents", "Consumables"] },
];

export default function SupplierMasterPage() {
  const [search, setSearch] = useState("");

  const filtered = SUPPLIERS.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.gstin.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TopBar title="Supplier Master" action={{ label: "Add Supplier", href: "#" }} />
      <main className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm text-slate-500">
            <span><span className="text-[#0F766E] font-bold">{SUPPLIERS.filter((s) => s.active).length}</span> Active</span>
            <span><span className="text-red-400 font-bold">{SUPPLIERS.filter((s) => !s.active).length}</span> Inactive</span>
          </div>
          <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supplier, city, GSTIN…"
              className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-56"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} className="border-border/40 bg-surface/50 backdrop-blur-xl hover:bg-white/5 transition-all cursor-pointer group">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-[#0F766E]/10 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-[#0F766E]" />
                  </div>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                    s.active
                      ? "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20"
                      : "text-red-400 bg-red-500/10 border-red-500/20"
                  )}>
                    {s.active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {s.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="font-bold text-slate-100 group-hover:text-[#0F766E] transition-colors">{s.name}</p>
                <p className="font-mono text-[11px] text-slate-500 mt-0.5">{s.gstin}</p>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {s.city}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="h-3.5 w-3.5 shrink-0" /> {s.phone}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="h-3.5 w-3.5 shrink-0" /> {s.email}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {s.categories.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-slate-500 border border-white/5">
                        {c}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-600 font-mono">{s.terms}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
