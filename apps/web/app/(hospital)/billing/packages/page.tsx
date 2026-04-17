"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Package, Search, Plus, ChevronDown, ChevronRight, Tag, CheckCircle2, XCircle,
} from "lucide-react";

interface BillingPackage {
  id: string;
  name: string;
  category: string;
  inclusions: string[];
  exclusions: string[];
  price: string;
  gstApplicable: boolean;
  validity: string;
  insuranceMappings: string[];
  active: boolean;
}

const PACKAGES: BillingPackage[] = [
  {
    id: "PKG-001", name: "Total Knee Replacement (Bilateral)", category: "Orthopedic",
    price: "₹3,50,000", gstApplicable: false, validity: "30 days post-admit", active: true,
    inclusions: ["Surgeon fee", "Anaesthetist fee", "OT charges", "5-day ward stay (semi-private)", "Physiotherapy (5 sessions)", "Implants (DePuy standard)", "Standard post-op medications", "Routine labs (CBC, LFT, RFT)"],
    exclusions: ["ICU charges", "Blood transfusion", "Specialist consults beyond ortho", "Premium implants (charged at cost + 10%)"],
    insuranceMappings: ["PMJAY Code: O01.01", "Star Health: KR-BILATERAL", "Niva Bupa: SUR-KNEE-01"],
  },
  {
    id: "PKG-002", name: "Normal Delivery Package", category: "Maternity",
    price: "₹28,000", gstApplicable: false, validity: "From admission to discharge", active: true,
    inclusions: ["Labour room charges", "Delivery charges", "Gynae fee", "Paediatrician attendance", "3-day ward stay (general)", "New-born care (routine)", "Routine antenatal labs"],
    exclusions: ["LSCS (separate package)", "NICU admission", "Epidural anaesthesia", "Additional medicines"],
    insuranceMappings: ["PMJAY Code: O02.01", "CGHS: MAT-NVD-001"],
  },
  {
    id: "PKG-003", name: "Coronary Angiography + Stenting (Single Vessel)", category: "Cardiac",
    price: "₹1,80,000", gstApplicable: false, validity: "From cath lab admission", active: true,
    inclusions: ["Cardiologist fee", "Cath lab charges", "DES stent (standard)", "2-day CCU stay", "1-day ward stay", "Post-procedure medications (5 days)", "Echo before discharge"],
    exclusions: ["Multi-vessel stenting (add-on ₹40K per vessel)", "IABP", "Emergency CABG conversion"],
    insuranceMappings: ["PMJAY Code: C01.02", "Star Health: CARD-STENT-01", "Niva Bupa: CAR-ANGIO-STENT"],
  },
  {
    id: "PKG-004", name: "Laparoscopic Cholecystectomy", category: "Surgical",
    price: "₹55,000", gstApplicable: false, validity: "From surgical admission", active: true,
    inclusions: ["Surgeon fee", "Anaesthetist fee", "OT charges", "Lap chole disposables", "2-day ward stay", "Routine post-op medications", "USG abdomen pre-op"],
    exclusions: ["Open conversion (additional OT time charged)", "Bile duct injury repair", "Overnight ICU"],
    insuranceMappings: ["PMJAY Code: G02.01", "Niva Bupa: SUR-LAP-CHOLE"],
  },
  {
    id: "PKG-005", name: "Cataract Surgery (Both Eyes)", category: "Ophthalmology",
    price: "₹22,000", gstApplicable: true, validity: "Day surgery (same-day discharge)", active: false,
    inclusions: ["Surgeon fee", "OT charges", "IOL (monofocal standard)", "Day care charges", "Post-op drops for 4 weeks"],
    exclusions: ["Premium IOL (toric/multifocal) — charged separately", "Retinal complications"],
    insuranceMappings: ["PMJAY Code: E01.01", "CGHS: OPH-CATARACT"],
  },
];

const CATEGORIES = ["All", "Orthopedic", "Maternity", "Cardiac", "Surgical", "Ophthalmology"];

export default function PackageBillingPage() {
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("All");
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [activeOnly,setActiveOnly]= useState(false);

  const filtered = PACKAGES.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      (!activeOnly || p.active) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <TopBar title="Package Billing" action={{ label: "New Package", href: "#" }} />
      <main className="p-8 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Packages",  value: PACKAGES.length.toString() },
            { label: "Active",          value: PACKAGES.filter(p => p.active).length.toString() },
            { label: "Categories",      value: (CATEGORIES.length - 1).toString() },
            { label: "Insurance Mapped",value: PACKAGES.filter(p => p.insuranceMappings.length > 0).length.toString() },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
              <p className="text-3xl font-bold mt-1 text-[#0F766E]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={cn("px-3 py-1 rounded-lg text-xs font-medium border transition-all",
                  category === c ? "bg-[#0F766E] text-white border-[#0F766E]" : "border-white/8 text-muted hover:text-fg hover:bg-white/5")}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveOnly(!activeOnly)}
              className={cn("px-3 py-1 rounded-lg text-xs font-medium border transition-all",
                activeOnly ? "bg-[#0F766E]/15 border-[#0F766E]/30 text-[#0F766E]" : "border-white/8 text-muted hover:bg-white/5")}>
              Active Only
            </button>
            <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search packages…"
                className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-40" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((pkg) => {
            const isOpen = expanded === pkg.id;
            return (
              <Card key={pkg.id} className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <button className="w-full" onClick={() => setExpanded(isOpen ? null : pkg.id)}>
                  <CardHeader className={cn("pb-4", isOpen && "border-b border-border/20")}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-[#0F766E]/10 flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-[#0F766E]" />
                        </div>
                        <div className="text-left min-w-0">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-sm">{pkg.name}</CardTitle>
                            {!pkg.active && (
                              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-slate-500 text-[9px] font-bold uppercase">Inactive</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500">{pkg.category}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-[10px] text-slate-500">{pkg.validity}</span>
                            {pkg.gstApplicable && (
                              <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-1.5 rounded font-bold">+GST</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <p className="font-bold text-[#0F766E] text-lg font-mono">{pkg.price}</p>
                        <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", isOpen && "rotate-180")} />
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {isOpen && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#0F766E]" /> Inclusions
                        </p>
                        <ul className="space-y-1.5">
                          {pkg.inclusions.map((inc) => (
                            <li key={inc} className="flex items-start gap-2 text-xs text-slate-300">
                              <span className="text-[#0F766E] mt-0.5 shrink-0">✓</span>{inc}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5 text-red-400" /> Exclusions
                        </p>
                        <ul className="space-y-1.5">
                          {pkg.exclusions.map((exc) => (
                            <li key={exc} className="flex items-start gap-2 text-xs text-slate-400">
                              <span className="text-red-400 mt-0.5 shrink-0">✗</span>{exc}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-yellow-400" /> Insurance Codes
                        </p>
                        <ul className="space-y-1.5">
                          {pkg.insuranceMappings.map((m) => (
                            <li key={m} className="text-xs font-mono text-slate-400">{m}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                      <button className="px-4 py-1.5 rounded-lg border border-white/8 text-slate-400 text-xs font-medium hover:bg-white/5 transition-all">Edit Package</button>
                      <button className="px-4 py-1.5 rounded-lg bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] text-xs font-bold hover:bg-[#0F766E]/20 transition-all">Apply to Admission</button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </main>
    </>
  );
}
