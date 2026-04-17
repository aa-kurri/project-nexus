"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ShieldAlert, Calendar, User, Baby, FileDown, Plus, CheckCircle2,
} from "lucide-react";

// ─── Types & Data ──────────────────────────────────────────────────────────────
type PurposeType = "Foetal anomaly scan" | "Dating scan" | "Growth scan" | "Doppler" | "Gynaecology";

interface FormFEntry {
  id: string;
  date: string;
  patientName: string;
  uhid: string;
  age: number;
  referringDoctor: string;
  operator: string;
  purpose: PurposeType;
  indication: string;
  result: string;
  signed: boolean;
}

const ENTRIES: FormFEntry[] = [
  { id: "PCPNDT-001", date: "2026-04-16", patientName: "Meena Reddy",   uhid: "AY-00501", age: 28, referringDoctor: "Dr. Lakshmi", operator: "Dr. Shwetha Rao",  purpose: "Foetal anomaly scan", indication: "20-week anomaly scan",   result: "No abnormality detected", signed: true  },
  { id: "PCPNDT-002", date: "2026-04-16", patientName: "Anita Sharma",  uhid: "AY-00489", age: 32, referringDoctor: "Dr. Prasad",  operator: "Dr. Shwetha Rao",  purpose: "Growth scan",         indication: "IUGR follow-up",         result: "EFW 1.8kg — appropriate", signed: true  },
  { id: "PCPNDT-003", date: "2026-04-15", patientName: "Kavitha Nair",  uhid: "AY-00456", age: 25, referringDoctor: "Dr. Ramesh",  operator: "Dr. Shwetha Rao",  purpose: "Dating scan",         indication: "First trimester dating", result: "GA 9w+3d, CRL 26mm",      signed: false },
  { id: "PCPNDT-004", date: "2026-04-15", patientName: "Fatima Begum",  uhid: "AY-00432", age: 30, referringDoctor: "Dr. Sajid",   operator: "Dr. Suresh Kumar", purpose: "Doppler",             indication: "Placenta praevia",       result: "Normal umbilical Doppler", signed: true  },
  { id: "PCPNDT-005", date: "2026-04-14", patientName: "Sridevi Murthy",uhid: "AY-00418", age: 27, referringDoctor: "Dr. Venkat",  operator: "Dr. Suresh Kumar", purpose: "Gynaecology",         indication: "Fibroid assessment",     result: "Intramural fibroid 4cm",   signed: true  },
];

const MONTHLY_STATS = [
  { label: "Scans This Month", value: "42" },
  { label: "Unsigned Forms",   value: "1"  },
  { label: "Operators on Record", value: "2" },
  { label: "Next Report Due",  value: "01 May" },
];

// ─── Component ─────────────────────────────────────────────────────────────────
export default function PcpndtPage() {
  const [entries, setEntries] = useState<FormFEntry[]>(ENTRIES);
  const [showForm, setShowForm] = useState(false);

  function signEntry(id: string) {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, signed: true } : e));
  }

  return (
    <>
      <TopBar title="PCPNDT Register (Form F)" action={{ label: "New Form F Entry", href: "#" }} />
      <main className="p-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {MONTHLY_STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
              <p className="text-3xl font-bold mt-1 text-[#0F766E]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Legal banner */}
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <ShieldAlert className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">
            Under the <strong className="text-slate-300">PCPNDT Act</strong>, Form F must be completed before every ultrasound.
            Missing or incomplete records attract <strong className="text-slate-300">₹10 lakh fines</strong> and machine sealing.
            All entries are <strong className="text-slate-300">tamper-evident</strong> via the audit ledger.
          </p>
        </div>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4">
            <CardTitle className="text-sm">Form F Register — April 2026</CardTitle>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 text-slate-400 hover:text-fg hover:bg-white/5 transition-all text-xs">
                <FileDown className="h-3.5 w-3.5" /> Export Monthly Report
              </button>
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F766E] text-white text-xs font-bold hover:bg-[#0F766E]/90 transition-all">
                <Plus className="h-3.5 w-3.5" /> New Entry
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Form No.", "Date", "Patient", "Age", "Operator", "Purpose", "Result", "Signed"].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 pl-0 pr-3 font-mono text-xs text-slate-400">{e.id}</td>
                    <td className="py-3 px-3 text-xs text-slate-400 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />{e.date}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-slate-200 text-xs">{e.patientName}</p>
                      <p className="text-[10px] text-slate-600">{e.uhid}</p>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400">{e.age}y</td>
                    <td className="py-3 px-3 text-xs text-slate-400 flex items-center gap-1">
                      <User className="h-3 w-3" /> {e.operator}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold">
                        {e.purpose}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400 max-w-[160px] truncate">{e.result}</td>
                    <td className="py-3 px-3">
                      {e.signed
                        ? <CheckCircle2 className="h-4 w-4 text-[#0F766E]" />
                        : <button onClick={() => signEntry(e.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold hover:bg-yellow-500/20 transition-all">
                            <Baby className="h-3 w-3" /> Sign
                          </button>
                      }
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
