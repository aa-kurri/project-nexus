"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Search, User, FileText, Activity, LayoutList, LayoutGrid,
  Droplets, Phone, BadgeCheck, Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PATIENTS = [
  { id: "AY-00001", name: "Anish Kurri",       age: 29, gender: "M", blood: "O+",  phone: "+91 99000 88776", lastVisit: "2026-04-14", status: "Active",   dept: "OPD",  diagnosis: "Hypertension" },
  { id: "AY-00002", name: "Sarah Malik",        age: 34, gender: "F", blood: "A+",  phone: "+91 88776 66554", lastVisit: "2026-04-10", status: "Active",   dept: "IPD",  diagnosis: "Type 2 Diabetes" },
  { id: "AY-00003", name: "Vikram Seth",        age: 52, gender: "M", blood: "B-",  phone: "+91 77665 55443", lastVisit: "2026-04-01", status: "Archived", dept: "OPD",  diagnosis: "COPD" },
  { id: "AY-00004", name: "Priya Nair",         age: 28, gender: "F", blood: "AB+", phone: "+91 94400 11223", lastVisit: "2026-04-16", status: "Active",   dept: "OPD",  diagnosis: "Migraine" },
  { id: "AY-00005", name: "Ramesh Kumar",       age: 45, gender: "M", blood: "O-",  phone: "+91 98400 22334", lastVisit: "2026-04-16", status: "Active",   dept: "IPD",  diagnosis: "Acute Appendicitis" },
  { id: "AY-00006", name: "Sunita Sharma",      age: 60, gender: "F", blood: "A-",  phone: "+91 87654 32100", lastVisit: "2026-04-15", status: "Active",   dept: "ICU",  diagnosis: "STEMI Post-PCI" },
  { id: "AY-00007", name: "George Mathew",      age: 67, gender: "M", blood: "B+",  phone: "+91 91234 56789", lastVisit: "2026-04-14", status: "Active",   dept: "OT",   diagnosis: "Knee Replacement" },
  { id: "AY-00008", name: "Arun Krishnamurthy", age: 38, gender: "M", blood: "O+",  phone: "+91 99887 76655", lastVisit: "2026-04-13", status: "Active",   dept: "OPD",  diagnosis: "Lumber Spondylosis" },
  { id: "AY-00009", name: "Deepa Reddy",        age: 31, gender: "F", blood: "A+",  phone: "+91 96543 21000", lastVisit: "2026-04-12", status: "Active",   dept: "OPD",  diagnosis: "PCOS" },
  { id: "AY-00010", name: "Mohammed Farhan",    age: 55, gender: "M", blood: "AB-", phone: "+91 98765 00987", lastVisit: "2026-04-11", status: "Active",   dept: "IPD",  diagnosis: "CKD Stage 3" },
  { id: "AY-00011", name: "Kavitha Iyer",       age: 42, gender: "F", blood: "O+",  phone: "+91 93211 34567", lastVisit: "2026-04-08", status: "Active",   dept: "OPD",  diagnosis: "Hypothyroidism" },
  { id: "AY-00012", name: "Rajiv Tiwari",       age: 73, gender: "M", blood: "B+",  phone: "+91 94500 55678", lastVisit: "2026-03-28", status: "Archived", dept: "OPD",  diagnosis: "Parkinson's Disease" },
];

const DEPT_COLORS: Record<string, string> = {
  OPD: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  IPD: "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20",
  ICU: "bg-red-500/10 text-red-400 border-red-500/20",
  OT:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

type ViewMode = "grid" | "list";

export default function PatientsListPage() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Archived">("All");

  const filtered = PATIENTS.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.diagnosis.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount   = PATIENTS.filter((p) => p.status === "Active").length;
  const ipdCount      = PATIENTS.filter((p) => p.dept === "IPD" || p.dept === "ICU").length;

  return (
    <>
      <TopBar
        title="Electronic Medical Records"
        action={{ label: "New Patient", href: "/opd/new-patient" }}
      />
      <main className="p-8 space-y-6">

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/8 bg-white/[0.02] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Total Patients</p>
              <p className="text-2xl font-bold mt-0.5">{PATIENTS.length}</p>
            </div>
            <User className="h-8 w-8 text-slate-700" />
          </div>
          <div className="rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Active</p>
              <p className="text-2xl font-bold mt-0.5 text-[#0F766E]">{activeCount}</p>
            </div>
            <BadgeCheck className="h-8 w-8 text-[#0F766E]/30" />
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Currently Admitted</p>
              <p className="text-2xl font-bold mt-0.5 text-purple-400">{ipdCount}</p>
            </div>
            <Activity className="h-8 w-8 text-purple-500/30" />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-xl px-4 py-2.5 flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, UHID, phone or diagnosis…"
              className="bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Status filter */}
            <div className="flex gap-1 bg-surface/40 p-1 rounded-xl border border-border/40">
              {(["All", "Active", "Archived"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                    filterStatus === s
                      ? "bg-[#0F766E] text-white"
                      : "text-muted hover:text-fg hover:bg-white/5"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* View toggle */}
            <div className="flex gap-1 bg-surface/40 p-1 rounded-xl border border-border/40">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-lg transition-all", viewMode === "grid" ? "bg-[#0F766E] text-white" : "text-muted hover:text-fg")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-[#0F766E] text-white" : "text-muted hover:text-fg")}
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Patient records */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <PatientCard key={p.id} patient={p} />
            ))}
          </div>
        ) : (
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
            <CardContent className="pt-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {["UHID", "Name", "Age/Sex", "Blood", "Diagnosis", "Dept", "Last Visit", ""].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pl-0 pr-4 font-mono text-xs text-slate-500">{p.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-200">{p.name}</td>
                      <td className="py-3 px-4 text-slate-400">{p.age}y · {p.gender}</td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-xs">
                          <Droplets className="h-3 w-3 text-red-400" />{p.blood}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 max-w-[160px] truncate">{p.diagnosis}</td>
                      <td className="py-3 px-4">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", DEPT_COLORS[p.dept] ?? "bg-white/5 text-slate-500 border-white/8")}>
                          {p.dept}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">{p.lastVisit}</td>
                      <td className="py-3 px-4">
                        <Link href={`/emr/patients/${p.id}`} className="text-xs text-[#0F766E] hover:underline">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-600">
            <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No patients match your search</p>
          </div>
        )}

      </main>
    </>
  );
}

function PatientCard({ patient: p }: { patient: typeof PATIENTS[0] }) {
  return (
    <Link href={`/emr/patients/${p.id}`}>
      <Card className={cn(
        "border-border/40 bg-surface/50 backdrop-blur-xl hover:bg-surface/80 transition-all cursor-pointer group shadow-lg h-full",
        p.status === "Archived" && "opacity-60"
      )}>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-3">
          <div className="h-12 w-12 rounded-full bg-[#0F766E]/10 flex items-center justify-center border border-[#0F766E]/20 shrink-0">
            <User className="h-6 w-6 text-[#0F766E]" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-bold group-hover:text-[#0F766E] transition-colors truncate">{p.name}</CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">{p.id}</p>
          </div>
          {p.status === "Archived" ? (
            <Archive className="h-4 w-4 text-slate-600 shrink-0" />
          ) : (
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", DEPT_COLORS[p.dept] ?? "bg-white/5 text-slate-500 border-white/8")}>
              {p.dept}
            </span>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <InfoChip label="Age/Sex" value={`${p.age}y ${p.gender}`} />
            <InfoChip label="Blood" value={p.blood} icon={<Droplets className="h-3 w-3 text-red-400" />} />
            <InfoChip label="Last Visit" value={p.lastVisit.slice(5)} />
          </div>
          <div className="p-2.5 rounded-lg bg-black/20 border border-border/10 text-xs text-slate-400">
            <span className="text-slate-600 font-bold uppercase text-[10px] tracking-wider">Dx: </span>
            {p.diagnosis}
          </div>
          <div className="mt-3 flex gap-2">
            <span className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-white/5 text-[10px] font-bold text-slate-500 hover:text-[#0F766E] hover:border-[#0F766E]/20 transition-colors">
              <FileText className="h-3 w-3" /> Reports
            </span>
            <span className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-white/5 text-[10px] font-bold text-slate-500 hover:text-[#0F766E] hover:border-[#0F766E]/20 transition-colors">
              <Activity className="h-3 w-3" /> Vitals
            </span>
            <span className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-white/5 text-[10px] font-bold text-slate-500 hover:text-[#0F766E] hover:border-[#0F766E]/20 transition-colors">
              <Phone className="h-3 w-3" /> Call
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function InfoChip({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-black/20 border border-white/5 px-2 py-1.5 text-center">
      <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold mb-0.5">{label}</p>
      <div className="flex items-center justify-center gap-1">
        {icon}
        <p className="text-xs font-bold text-slate-300">{value}</p>
      </div>
    </div>
  );
}
