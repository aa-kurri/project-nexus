"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Pill, ShieldAlert, Search, FileDown, AlertTriangle, CheckCircle2, Clock,
} from "lucide-react";

type Schedule = "H" | "H1" | "X";

interface DispenseLog {
  id: string;
  date: string;
  drug: string;
  schedule: Schedule;
  qty: string;
  unit: string;
  prescribedBy: string;
  nmcId: string;
  patientName: string;
  uhid: string;
  rxId: string;
  witnessBy?: string;
  compliant: boolean;
}

const SCHEDULE_CFG: Record<Schedule, { label: string; color: string; desc: string }> = {
  H:  { label: "Schedule H",  color: "text-orange-400 bg-orange-500/10 border-orange-500/20", desc: "Prescription required" },
  H1: { label: "Schedule H1", color: "text-red-400 bg-red-500/10 border-red-500/20",           desc: "Antibiotic — register mandatory" },
  X:  { label: "Schedule X",  color: "text-purple-400 bg-purple-500/10 border-purple-500/20", desc: "Narcotic/Psychotropic — triplicate" },
};

const LOGS: DispenseLog[] = [
  { id: "DSP-001", date: "2026-04-16 10:12", drug: "Alprazolam 0.5mg",    schedule: "X",  qty: "10",  unit: "tabs", prescribedBy: "Dr. Ramesh",  nmcId: "NMC-12345", patientName: "Suresh Rao",      uhid: "AY-00412", rxId: "RX-20264112", witnessBy: "Pharm. Kavitha", compliant: true  },
  { id: "DSP-002", date: "2026-04-16 11:30", drug: "Azithromycin 500mg",  schedule: "H1", qty: "6",   unit: "tabs", prescribedBy: "Dr. Priya",   nmcId: "NMC-23456", patientName: "Meena Devi",      uhid: "AY-00389", rxId: "RX-20264113", compliant: true  },
  { id: "DSP-003", date: "2026-04-16 12:05", drug: "Morphine 10mg/ml",    schedule: "X",  qty: "2",   unit: "amps", prescribedBy: "Dr. Venkat",  nmcId: "NMC-34567", patientName: "Raju Kumar",      uhid: "AY-00345", rxId: "RX-20264114", witnessBy: "Pharm. Suresh",  compliant: true  },
  { id: "DSP-004", date: "2026-04-16 14:22", drug: "Moxifloxacin 400mg",  schedule: "H1", qty: "10",  unit: "tabs", prescribedBy: "Dr. Sridhar", nmcId: "",          patientName: "Anita Sharma",    uhid: "AY-00298", rxId: "",             compliant: false },
  { id: "DSP-005", date: "2026-04-16 15:45", drug: "Tramadol 50mg",       schedule: "H",  qty: "30",  unit: "caps", prescribedBy: "Dr. Lakshmi", nmcId: "NMC-56789", patientName: "George Mathew",   uhid: "AY-00267", rxId: "RX-20264116", compliant: true  },
  { id: "DSP-006", date: "2026-04-15 09:00", drug: "Diazepam 5mg",        schedule: "X",  qty: "15",  unit: "tabs", prescribedBy: "Dr. Anjali",  nmcId: "NMC-67890", patientName: "Priya Venkatesh", uhid: "AY-00244", rxId: "RX-20264117", witnessBy: "Pharm. Kavitha", compliant: true  },
];

const STATS = [
  { label: "Today — Schedule H",  value: "12", schedule: "H"  as Schedule },
  { label: "Today — Schedule H1", value: "4",  schedule: "H1" as Schedule },
  { label: "Today — Schedule X",  value: "3",  schedule: "X"  as Schedule },
  { label: "Non-Compliant",       value: "1",  schedule: null },
];

export default function DrugSchedulesPage() {
  const [search,    setSearch]    = useState("");
  const [schedule,  setSchedule]  = useState<Schedule | "ALL">("ALL");

  const filtered = LOGS.filter(
    (l) =>
      (schedule === "ALL" || l.schedule === schedule) &&
      (l.drug.toLowerCase().includes(search.toLowerCase()) ||
        l.patientName.toLowerCase().includes(search.toLowerCase()) ||
        l.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <TopBar title="Drug Schedule H / H1 / X Register" action={{ label: "Export Monthly Register", href: "#" }} />
      <main className="p-8 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => {
            const cfg = s.schedule ? SCHEDULE_CFG[s.schedule] : null;
            return (
              <div key={s.label} className={cn("rounded-xl border p-4", cfg ? cfg.color : "border-red-500/20 bg-red-500/5 text-red-400")}>
                <p className="text-[10px] uppercase tracking-widest opacity-70">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* CDSCO banner */}
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <ShieldAlert className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">
            <strong className="text-slate-300">CDSCO Regulation:</strong> Schedule X drugs require prescriber NMC number, patient UHID, and pharmacist witness signature.
            Schedule H1 (antibiotics) require register maintenance. Non-compliance is a <strong className="text-red-400">criminal offence</strong> under the Drugs & Cosmetics Act.
          </p>
        </div>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4">
            <CardTitle className="text-sm">Dispensing Register</CardTitle>
            <div className="flex items-center gap-3">
              {(["ALL","H","H1","X"] as const).map((s) => (
                <button key={s} onClick={() => setSchedule(s)}
                  className={cn("px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                    schedule === s
                      ? s === "ALL" ? "bg-[#0F766E] text-white border-[#0F766E]"
                        : SCHEDULE_CFG[s as Schedule].color + " font-black"
                      : "border-white/8 text-muted hover:text-fg hover:bg-white/5"
                  )}>
                  {s === "ALL" ? "All Schedules" : `Sch. ${s}`}
                </button>
              ))}
              <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Drug or patient…"
                  className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-36" />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 text-slate-400 hover:text-fg hover:bg-white/5 transition-all text-xs">
                <FileDown className="h-3.5 w-3.5" /> Export
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Log ID","Date/Time","Drug","Schedule","Qty","Patient","Prescribed By","NMC ID","Rx ID","Witness","Status"].map((h) => (
                    <th key={h} className="text-left py-3 px-2 text-[9px] uppercase tracking-widest text-slate-500 font-bold first:pl-0 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const cfg = SCHEDULE_CFG[l.schedule];
                  return (
                    <tr key={l.id} className={cn("border-b border-white/5 hover:bg-white/[0.02]", !l.compliant && "bg-red-500/[0.03]")}>
                      <td className="py-2.5 pl-0 pr-2 font-mono text-[10px] text-slate-500">{l.id}</td>
                      <td className="py-2.5 px-2 text-[10px] text-slate-500 whitespace-nowrap">{l.date}</td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <Pill className="h-3 w-3 text-slate-500" />
                          <span className="text-xs text-slate-200">{l.drug}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={cn("px-2 py-0.5 rounded-full border text-[9px] font-black uppercase", cfg.color)}>{cfg.label}</span>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-xs text-slate-400">{l.qty} {l.unit}</td>
                      <td className="py-2.5 px-2">
                        <p className="text-xs text-slate-200">{l.patientName}</p>
                        <p className="text-[10px] text-slate-600">{l.uhid}</p>
                      </td>
                      <td className="py-2.5 px-2 text-xs text-slate-400">{l.prescribedBy}</td>
                      <td className="py-2.5 px-2 font-mono text-[10px] text-slate-500">{l.nmcId || <span className="text-red-400">MISSING</span>}</td>
                      <td className="py-2.5 px-2 font-mono text-[10px] text-slate-500">{l.rxId || <span className="text-red-400">MISSING</span>}</td>
                      <td className="py-2.5 px-2 text-[10px] text-slate-500">{l.witnessBy || (l.schedule === "X" ? <span className="text-red-400">REQUIRED</span> : "—")}</td>
                      <td className="py-2.5 px-2">
                        {l.compliant
                          ? <CheckCircle2 className="h-4 w-4 text-[#0F766E]" />
                          : <AlertTriangle className="h-4 w-4 text-red-400" />}
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
