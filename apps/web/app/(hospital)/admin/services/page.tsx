"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ListChecks, Search, PencilLine, Trash2, CheckCircle2, XCircle } from "lucide-react";

const DEPARTMENTS = ["All", "OPD", "IPD", "OT", "Lab", "Radiology", "Pharmacy", "Emergency"];

const SERVICES = [
  { id: "SVC-001", name: "Consultation – General Physician", dept: "OPD",       code: "OPD-GP-001", rate: "₹500",   active: true },
  { id: "SVC-002", name: "Consultation – Specialist",        dept: "OPD",       code: "OPD-SP-001", rate: "₹800",   active: true },
  { id: "SVC-003", name: "Bed Charges – General Ward",       dept: "IPD",       code: "IPD-BED-G",  rate: "₹1,200/day", active: true },
  { id: "SVC-004", name: "Bed Charges – ICU",                dept: "IPD",       code: "IPD-BED-I",  rate: "₹5,500/day", active: true },
  { id: "SVC-005", name: "CBC (Complete Blood Count)",       dept: "Lab",       code: "LAB-CBC-01", rate: "₹350",   active: true },
  { id: "SVC-006", name: "X-Ray Chest (PA View)",            dept: "Radiology", code: "RAD-XR-001", rate: "₹450",   active: true },
  { id: "SVC-007", name: "Minor OT Procedure",               dept: "OT",        code: "OT-MIN-001", rate: "₹2,500", active: true },
  { id: "SVC-008", name: "IV Cannulation",                   dept: "IPD",       code: "IPD-IV-001", rate: "₹150",   active: false },
  { id: "SVC-009", name: "ECG – 12 Lead",                    dept: "Emergency", code: "ER-ECG-001", rate: "₹300",   active: true },
  { id: "SVC-010", name: "Discharge Summary",                dept: "IPD",       code: "IPD-DC-001", rate: "₹0",     active: true },
];

export default function ServicesMasterPage() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");

  const filtered = SERVICES.filter(
    (s) =>
      (dept === "All" || s.dept === dept) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <TopBar title="Services Master" action={{ label: "Add Service", href: "#" }} />
      <main className="p-8 space-y-6">
        {/* Dept filter tabs */}
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((d) => (
            <button
              key={d}
              onClick={() => setDept(d)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
                dept === d
                  ? "bg-[#0F766E] text-white border-[#0F766E] shadow-lg shadow-[#0F766E]/20"
                  : "border-white/8 text-muted hover:text-fg hover:bg-white/5"
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4">
            <CardTitle className="text-sm">
              {filtered.length} services in <span className="text-[#0F766E]">{dept}</span>
            </CardTitle>
            <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or code…"
                className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-48"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Code", "Service Name", "Dept", "Rate", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 pl-0 font-mono text-xs text-slate-500">{s.code}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{s.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-slate-400 border border-white/5">{s.dept}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">{s.rate}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                        s.active
                          ? "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20"
                          : "text-red-400 bg-red-500/10 border-red-500/20"
                      )}>
                        {s.active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-lg hover:bg-[#0F766E]/10 text-slate-500 hover:text-[#0F766E] transition-colors">
                          <PencilLine className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
