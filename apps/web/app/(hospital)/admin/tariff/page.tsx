"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BadgeDollarSign, Search, PencilLine } from "lucide-react";

const PAYEES = ["General", "CGHS", "ESI", "Insurance – Star Health", "Insurance – Niva Bupa", "Corporate – TCS"];
const WARDS  = ["General Ward", "Semi-Private", "Private Room", "Deluxe Suite", "ICU", "NICU", "HDU"];

const TARIFF_MATRIX: Record<string, Record<string, string>> = {
  "General Ward":  { "General": "₹1,200", "CGHS": "₹900",  "ESI": "₹800",  "Insurance – Star Health": "₹1,100", "Insurance – Niva Bupa": "₹1,050", "Corporate – TCS": "₹1,150" },
  "Semi-Private":  { "General": "₹2,000", "CGHS": "₹1,500","ESI": "₹1,200","Insurance – Star Health": "₹1,800", "Insurance – Niva Bupa": "₹1,750", "Corporate – TCS": "₹1,900" },
  "Private Room":  { "General": "₹3,500", "CGHS": "₹2,800","ESI": "₹2,500","Insurance – Star Health": "₹3,200", "Insurance – Niva Bupa": "₹3,100", "Corporate – TCS": "₹3,400" },
  "Deluxe Suite":  { "General": "₹6,000", "CGHS": "—",     "ESI": "—",     "Insurance – Star Health": "₹5,500", "Insurance – Niva Bupa": "₹5,500", "Corporate – TCS": "₹5,800" },
  "ICU":           { "General": "₹5,500", "CGHS": "₹4,500","ESI": "₹4,000","Insurance – Star Health": "₹5,200", "Insurance – Niva Bupa": "₹5,000", "Corporate – TCS": "₹5,400" },
  "NICU":          { "General": "₹4,800", "CGHS": "₹4,000","ESI": "₹3,500","Insurance – Star Health": "₹4,500", "Insurance – Niva Bupa": "₹4,300", "Corporate – TCS": "₹4,700" },
  "HDU":           { "General": "₹3,200", "CGHS": "₹2,700","ESI": "₹2,400","Insurance – Star Health": "₹3,000", "Insurance – Niva Bupa": "₹2,900", "Corporate – TCS": "₹3,100" },
};

export default function TariffMasterPage() {
  const [selectedPayee, setSelectedPayee] = useState("General");

  return (
    <>
      <TopBar title="Tariff Master" action={{ label: "Edit Tariffs", href: "#" }} />
      <main className="p-8 space-y-6">
        <div className="flex flex-wrap gap-2">
          {PAYEES.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPayee(p)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-all border",
                selectedPayee === p
                  ? "bg-[#0F766E] text-white border-[#0F766E]"
                  : "border-white/8 text-muted hover:text-fg hover:bg-white/5"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="border-b border-border/20 pb-4">
            <CardTitle className="text-sm">
              Bed / Ward Tariffs — <span className="text-[#0F766E]">{selectedPayee}</span> Payee
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 pl-0 pr-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Ward / Room Type</th>
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Tariff (per day)</th>
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {WARDS.map((w) => {
                  const rate = TARIFF_MATRIX[w]?.[selectedPayee] ?? "—";
                  return (
                    <tr key={w} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pl-0 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-[#0F766E]" />
                          <span className="font-medium text-slate-200">{w}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "font-mono font-bold text-base",
                          rate === "—" ? "text-slate-600" : "text-[#0F766E]"
                        )}>
                          {rate}
                        </span>
                        {rate !== "—" && <span className="text-xs text-slate-500 ml-1">/ day</span>}
                      </td>
                      <td className="py-3 px-4">
                        <button className="p-1.5 rounded-lg hover:bg-[#0F766E]/10 text-slate-500 hover:text-[#0F766E] transition-colors">
                          <PencilLine className="h-3.5 w-3.5" />
                        </button>
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
