"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Scissors, Clock, CheckCircle2, AlertTriangle, User, Calendar,
  ClipboardList, Package, ChevronRight,
} from "lucide-react";

type OtStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "prep";

const STATUS_CFG: Record<OtStatus, { label: string; color: string; icon: React.ElementType }> = {
  scheduled:   { label: "Scheduled",   color: "text-blue-400 bg-blue-500/10 border-blue-500/20",       icon: Calendar      },
  prep:        { label: "Prep",         color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Clock         },
  in_progress: { label: "In Progress", color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",    icon: Scissors      },
  completed:   { label: "Completed",   color: "text-slate-400 bg-white/5 border-white/8",               icon: CheckCircle2  },
  cancelled:   { label: "Cancelled",   color: "text-red-400 bg-red-500/10 border-red-500/20",           icon: AlertTriangle },
};

interface OtCase {
  id: string;
  ot: string;
  startTime: string;
  endTime: string;
  patient: string;
  uhid: string;
  age: number;
  procedure: string;
  surgeon: string;
  anaesthetist: string;
  status: OtStatus;
  who: { timeout: boolean; signIn: boolean; signOut: boolean };
  implants?: string[];
  packUsed?: string[];
}

const CASES: OtCase[] = [
  {
    id: "OT-2026-041601", ot: "OT-1", startTime: "08:00", endTime: "10:30", patient: "George Mathew", uhid: "AY-00345", age: 65,
    procedure: "Total Knee Replacement (Right)", surgeon: "Dr. Suresh Ortho", anaesthetist: "Dr. Anand",
    status: "completed",
    who: { timeout: true, signIn: true, signOut: true },
    implants: ["DePuy Attune Femur CR Size 5 — Lot: DEP23456", "DePuy Attune Tibia CR Size 4 — Lot: DEP23457"],
    packUsed: ["Basic Ortho Set", "Pulse Lavage", "Tourniquet Set"],
  },
  {
    id: "OT-2026-041602", ot: "OT-2", startTime: "09:30", endTime: "11:00", patient: "Ramu Yadav", uhid: "AY-00589", age: 52,
    procedure: "Laparoscopic Cholecystectomy", surgeon: "Dr. Venkat Surgical", anaesthetist: "Dr. Rekha",
    status: "in_progress",
    who: { timeout: true, signIn: true, signOut: false },
    packUsed: ["Lap Chole Pack", "Energy Device Set"],
  },
  {
    id: "OT-2026-041603", ot: "OT-1", startTime: "11:30", endTime: "13:00", patient: "Kavitha Devi", uhid: "AY-00612", age: 38,
    procedure: "LSCS — Emergency", surgeon: "Dr. Priya Gynae", anaesthetist: "Dr. Anand",
    status: "prep",
    who: { timeout: false, signIn: false, signOut: false },
  },
  {
    id: "OT-2026-041604", ot: "OT-2", startTime: "13:00", endTime: "14:30", patient: "Harish Kumar", uhid: "AY-00445", age: 44,
    procedure: "TURP — Transurethral Resection", surgeon: "Dr. Rajesh Uro", anaesthetist: "Dr. Rekha",
    status: "scheduled",
    who: { timeout: false, signIn: false, signOut: false },
  },
  {
    id: "OT-2026-041605", ot: "OT-1", startTime: "15:00", endTime: "16:30", patient: "Srinivas Rao", uhid: "AY-00398", age: 60,
    procedure: "Inguinal Hernia Repair (Open)", surgeon: "Dr. Venkat Surgical", anaesthetist: "Dr. Anand",
    status: "scheduled",
    who: { timeout: false, signIn: false, signOut: false },
  },
];

function WhoChecklist({ who }: { who: OtCase["who"] }) {
  const steps = [
    { key: "signIn",  label: "Sign In"  },
    { key: "timeout", label: "Time Out" },
    { key: "signOut", label: "Sign Out" },
  ];
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s) => {
        const done = who[s.key as keyof typeof who];
        return (
          <div key={s.key} className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold",
            done ? "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20" : "text-slate-600 bg-white/5 border-white/8")}>
            {done ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
            {s.label}
          </div>
        );
      })}
    </div>
  );
}

export default function OtPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedCase = CASES.find((c) => c.id === selected);

  const byOt = ["OT-1","OT-2"].map((ot) => ({
    ot, cases: CASES.filter((c) => c.ot === ot),
  }));

  const inProgress = CASES.filter(c => c.status === "in_progress").length;
  const today = CASES.length;
  const completed = CASES.filter(c => c.status === "completed").length;
  const whoIssues = CASES.filter(c => c.status === "in_progress" && !c.who.timeout).length;

  return (
    <>
      <TopBar title="OT Scheduling & Surgical Cases" action={{ label: "Add Case", href: "#" }} />
      <main className="p-8 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Today's Cases",   value: today.toString(),        color: "text-slate-200" },
            { label: "In Progress",     value: inProgress.toString(),   color: "text-[#0F766E]" },
            { label: "Completed",       value: completed.toString(),    color: "text-slate-400" },
            { label: "WHO Checklist Issues", value: whoIssues.toString(), color: whoIssues > 0 ? "text-red-400" : "text-[#0F766E]" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
              <p className={cn("text-3xl font-bold mt-1", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* OT board */}
          <div className="lg:col-span-2 space-y-4">
            {byOt.map(({ ot, cases }) => (
              <Card key={ot} className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="border-b border-border/20 pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-[#0F766E]" /> {ot}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-white/5">
                    {cases.map((c) => {
                      const cfg = STATUS_CFG[c.status];
                      return (
                        <button key={c.id} onClick={() => setSelected(selected === c.id ? null : c.id)}
                          className={cn("w-full flex items-center gap-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors",
                            selected === c.id && "bg-white/[0.02]")}>
                          <div className="text-center shrink-0 w-16">
                            <p className="text-xs font-bold text-slate-300">{c.startTime}</p>
                            <p className="text-[10px] text-slate-600">{c.endTime}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-100 truncate">{c.procedure}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{c.patient} · {c.uhid} · {c.surgeon}</p>
                            <div className="mt-1.5">
                              <WhoChecklist who={c.who} />
                            </div>
                          </div>
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0", cfg.color)}>
                            <cfg.icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                          <ChevronRight className={cn("h-4 w-4 text-slate-600 transition-transform shrink-0", selected === c.id && "rotate-90")} />
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detail panel */}
          <div>
            {selectedCase ? (
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl sticky top-4">
                <CardHeader className="border-b border-border/20 pb-3">
                  <CardTitle className="text-sm">Case Detail</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <p className="font-bold text-slate-100">{selectedCase.patient}</p>
                    <p className="text-xs text-slate-500">{selectedCase.uhid} · Age {selectedCase.age}y</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Procedure</p>
                    <p className="text-sm text-slate-200">{selectedCase.procedure}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500 uppercase tracking-widest mb-0.5">Surgeon</p>
                      <p className="text-slate-300 flex items-center gap-1"><User className="h-3 w-3" />{selectedCase.surgeon}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 uppercase tracking-widest mb-0.5">Anaesthetist</p>
                      <p className="text-slate-300 flex items-center gap-1"><User className="h-3 w-3" />{selectedCase.anaesthetist}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5" /> WHO Checklist
                    </p>
                    <WhoChecklist who={selectedCase.who} />
                  </div>
                  {selectedCase.implants && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" /> Implants Used
                      </p>
                      {selectedCase.implants.map((imp) => (
                        <p key={imp} className="text-xs text-slate-400 mb-1 font-mono">{imp}</p>
                      ))}
                    </div>
                  )}
                  {selectedCase.packUsed && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Packs / Instruments</p>
                      {selectedCase.packUsed.map((pk) => (
                        <p key={pk} className="text-xs text-slate-400 mb-0.5">{pk}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 rounded-2xl border border-white/8 bg-white/[0.02] text-slate-600 gap-2">
                <Scissors className="h-8 w-8 opacity-30" />
                <p className="text-sm">Select a case to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
