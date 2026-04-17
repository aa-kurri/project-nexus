"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Pill, CheckCircle2, XCircle, Clock, AlertTriangle, Scan, User, ChevronDown,
} from "lucide-react";

type AdminStatus = "given" | "missed" | "due" | "held" | "prn";

const STATUS_CFG: Record<AdminStatus, { label: string; color: string; icon: React.ElementType }> = {
  given:  { label: "Given",   color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",   icon: CheckCircle2 },
  missed: { label: "Missed",  color: "text-red-400 bg-red-500/10 border-red-500/20",          icon: XCircle      },
  due:    { label: "Due Now", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Clock        },
  held:   { label: "Held",    color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: AlertTriangle},
  prn:    { label: "PRN",     color: "text-blue-400 bg-blue-500/10 border-blue-500/20",       icon: Pill         },
};

interface MarRow {
  drug: string;
  dose: string;
  route: string;
  frequency: string;
  slots: { time: string; status: AdminStatus; givenBy?: string; note?: string }[];
  highAlert: boolean;
  schedule?: "H" | "H1" | "X";
}

interface PatientMAR {
  name: string;
  uhid: string;
  bed: string;
  age: number;
  allergies: string[];
  medications: MarRow[];
}

const PATIENTS: PatientMAR[] = [
  {
    name: "Ramesh Kumar", uhid: "AY-00412", bed: "IPD-204", age: 46,
    allergies: ["Penicillin", "Sulfa"],
    medications: [
      { drug: "Inj. Ceftriaxone", dose: "1g",   route: "IV",  frequency: "BD",  highAlert: false, schedule: "H",
        slots: [
          { time: "08:00", status: "given", givenBy: "Nurse Priya" },
          { time: "20:00", status: "due" },
        ]},
      { drug: "Tab. Pantoprazole", dose: "40mg", route: "PO",  frequency: "OD",  highAlert: false,
        slots: [
          { time: "07:00", status: "given", givenBy: "Nurse Rekha" },
        ]},
      { drug: "Inj. Morphine",    dose: "4mg",  route: "IV",  frequency: "PRN", highAlert: true,  schedule: "X",
        slots: [
          { time: "PRN", status: "prn", note: "Pain score > 6" },
        ]},
    ],
  },
  {
    name: "Sunita Sharma", uhid: "AY-00389", bed: "ICU-2", age: 41,
    allergies: [],
    medications: [
      { drug: "Inj. Noradrenaline", dose: "0.1 mcg/kg/min", route: "IV infusion", frequency: "Continuous", highAlert: true,
        slots: [
          { time: "Running", status: "given", givenBy: "ICU Nurse", note: "Titrate to MAP > 65" },
        ]},
      { drug: "Tab. Aspirin",       dose: "75mg",  route: "PO", frequency: "OD",   highAlert: false,
        slots: [
          { time: "08:00", status: "given",  givenBy: "Nurse Deepa" },
        ]},
      { drug: "Inj. Enoxaparin",    dose: "40mg",  route: "SC", frequency: "OD",   highAlert: true,
        slots: [
          { time: "22:00", status: "missed", note: "Patient was off unit for echo" },
        ]},
    ],
  },
  {
    name: "George Mathew", uhid: "AY-00345", bed: "IPD-112", age: 65,
    allergies: ["NSAIDs"],
    medications: [
      { drug: "Tab. Metformin",   dose: "500mg", route: "PO", frequency: "BD",  highAlert: false,
        slots: [
          { time: "08:00", status: "given",  givenBy: "Nurse Sunita" },
          { time: "20:00", status: "due" },
        ]},
      { drug: "Cap. Atorvastatin",dose: "40mg",  route: "PO", frequency: "HS",  highAlert: false,
        slots: [
          { time: "22:00", status: "due" },
        ]},
    ],
  },
];

export default function MarPage() {
  const [selected, setSelected] = useState(0);
  const patient = PATIENTS[selected];

  return (
    <>
      <TopBar title="Medication Administration Record (MAR)" />
      <main className="p-8 space-y-6">

        {/* Patient selector */}
        <div className="flex flex-wrap gap-2">
          {PATIENTS.map((p, i) => (
            <button key={p.uhid} onClick={() => setSelected(i)}
              className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                selected === i
                  ? "bg-[#0F766E]/15 border-[#0F766E]/30 text-[#0F766E]"
                  : "border-white/8 text-muted hover:bg-white/5")}>
              <User className="h-3.5 w-3.5" />
              <span>{p.name}</span>
              <span className="text-xs opacity-60">{p.bed}</span>
              {p.medications.some(m => m.slots.some(s => s.status === "missed")) && (
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              )}
            </button>
          ))}
        </div>

        {/* Patient header */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-8">
              <div>
                <p className="font-bold text-slate-100">{patient.name}</p>
                <p className="text-xs text-slate-500">{patient.uhid} · {patient.bed} · Age {patient.age}y</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Allergies:</span>
                {patient.allergies.length
                  ? patient.allergies.map((a) => (
                      <span key={a} className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold">{a}</span>
                    ))
                  : <span className="text-[10px] text-slate-600">NKDA</span>}
              </div>
              <div className="ml-auto flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#0F766E]/20 bg-[#0F766E]/10 text-[#0F766E] text-xs font-bold hover:bg-[#0F766E]/20 transition-all">
                  <Scan className="h-3.5 w-3.5" /> Scan to Administer
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MAR table */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="border-b border-border/20 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Medication Administration — {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</CardTitle>
              <span className="text-xs text-slate-500">{patient.medications.length} active medications</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-white/5">
              {patient.medications.map((med, i) => (
                <div key={i} className={cn("py-4", med.highAlert && "bg-red-500/[0.02]")}>
                  <div className="flex items-start gap-4">
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                      med.highAlert ? "bg-red-500/10" : "bg-[#0F766E]/10")}>
                      <Pill className={cn("h-4 w-4", med.highAlert ? "text-red-400" : "text-[#0F766E]")} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-slate-100 text-sm">{med.drug} {med.dose}</span>
                        <span className="text-xs text-slate-500">{med.route} · {med.frequency}</span>
                        {med.highAlert && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase">HIGH ALERT</span>
                        )}
                        {med.schedule && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-bold uppercase">Sch. {med.schedule}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {med.slots.map((slot, j) => {
                          const cfg = STATUS_CFG[slot.status];
                          return (
                            <div key={j} className={cn("flex flex-col items-center gap-1 px-3 py-2 rounded-xl border min-w-[80px]", cfg.color)}>
                              <span className="text-[10px] font-bold">{slot.time}</span>
                              <cfg.icon className="h-3.5 w-3.5" />
                              <span className="text-[9px] uppercase tracking-wider">{cfg.label}</span>
                              {slot.givenBy && <span className="text-[9px] opacity-60">{slot.givenBy}</span>}
                              {slot.note && <span className="text-[9px] opacity-60 text-center leading-tight">{slot.note}</span>}
                            </div>
                          );
                        })}
                        {med.slots.some(s => s.status === "due") && (
                          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#0F766E]/30 bg-[#0F766E]/10 text-[#0F766E] text-xs font-bold hover:bg-[#0F766E]/20 transition-all self-center">
                            <Scan className="h-3.5 w-3.5" /> Record Administration
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
