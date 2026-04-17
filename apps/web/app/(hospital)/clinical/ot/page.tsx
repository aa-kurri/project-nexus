"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Scissors, Clock, CheckCircle2, XCircle, Search,
  ChevronLeft, ChevronRight, Timer, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OTStatus = "Scheduled" | "Prep" | "In Progress" | "Completed" | "Cancelled";
type OTRoom   = "OT-1" | "OT-2" | "OT-3" | "OT-4";
type Urgency  = "Elective" | "Emergency" | "Semi-Urgent";

interface Surgery {
  id: string; patient: string; uhid: string; age: number; gender: string; blood: string;
  procedure: string; surgeon: string; anaesthetist: string;
  room: OTRoom; startTime: string; durationMins: number;
  status: OTStatus; urgency: Urgency; diagnosis: string; notes: string; date: string;
}

const TODAY   = "2026-04-16";
const DATES   = ["2026-04-15", "2026-04-16", "2026-04-17", "2026-04-18"];

const SURGERIES: Surgery[] = [
  { id:"OT-0901", patient:"George Mathew",     uhid:"AY-00007", age:67, gender:"M", blood:"B+",  procedure:"Total Knee Replacement (Right)",    surgeon:"Dr. Arjun Pillai",      anaesthetist:"Dr. Shalini Varma", room:"OT-1", startTime:"08:00", durationMins:150, status:"Completed",   urgency:"Elective",   diagnosis:"Knee Osteoarthritis",         notes:"No complications. Prosthesis placed.",         date:TODAY },
  { id:"OT-0902", patient:"Ramesh Kumar",      uhid:"AY-00005", age:45, gender:"M", blood:"O-",  procedure:"Laparoscopic Appendectomy",          surgeon:"Dr. Priya Subramaniam", anaesthetist:"Dr. Kiran Das",     room:"OT-2", startTime:"09:30", durationMins:60,  status:"Completed",   urgency:"Emergency",  diagnosis:"Acute Appendicitis",          notes:"Peritoneal wash done.",                        date:TODAY },
  { id:"OT-0903", patient:"Deepa Reddy",       uhid:"AY-00009", age:31, gender:"F", blood:"A+",  procedure:"Diagnostic Laparoscopy",             surgeon:"Dr. Meera Krishnan",    anaesthetist:"Dr. Shalini Varma", room:"OT-3", startTime:"11:00", durationMins:75,  status:"In Progress", urgency:"Elective",   diagnosis:"PCOS with DUB",               notes:"Ongoing — patient under GA.",                  date:TODAY },
  { id:"OT-0904", patient:"Arun Krishnamurthy",uhid:"AY-00008", age:38, gender:"M", blood:"O+",  procedure:"Epidural Steroid Injection (L4-L5)", surgeon:"Dr. Suresh Nambiar",    anaesthetist:"Dr. Kiran Das",     room:"OT-4", startTime:"13:00", durationMins:45,  status:"Scheduled",   urgency:"Elective",   diagnosis:"Lumbar Spondylosis",          notes:"Post-procedure monitoring 2h.",                date:TODAY },
  { id:"OT-0905", patient:"Mohammed Farhan",   uhid:"AY-00010", age:55, gender:"M", blood:"AB-", procedure:"AV Fistula Creation (Left Arm)",     surgeon:"Dr. Arjun Pillai",      anaesthetist:"Dr. Shalini Varma", room:"OT-1", startTime:"15:00", durationMins:90,  status:"Scheduled",   urgency:"Semi-Urgent",diagnosis:"CKD Stage 3 — Pre-Dialysis",  notes:"LA procedure, no GA required.",                date:TODAY },
  { id:"OT-0906", patient:"Priya Nair",        uhid:"AY-00004", age:28, gender:"F", blood:"AB+", procedure:"ERCP + Stenting",                    surgeon:"Dr. Priya Subramaniam", anaesthetist:"Dr. Kiran Das",     room:"OT-2", startTime:"16:30", durationMins:60,  status:"Prep",        urgency:"Semi-Urgent",diagnosis:"CBD Stone",                   notes:"Patient in pre-op holding area.",              date:TODAY },
  { id:"OT-0898", patient:"Sunita Sharma",     uhid:"AY-00006", age:60, gender:"F", blood:"A-",  procedure:"Primary PCI",                        surgeon:"Dr. Vinod Nair",        anaesthetist:"Dr. Shalini Varma", room:"OT-2", startTime:"02:15", durationMins:120, status:"Completed",   urgency:"Emergency",  diagnosis:"STEMI",                       notes:"Stent placed in LAD. TIMI 3 flow achieved.",   date:"2026-04-15" },
  { id:"OT-0899", patient:"Kavitha Iyer",      uhid:"AY-00011", age:42, gender:"F", blood:"O+",  procedure:"Thyroidectomy (Total)",               surgeon:"Dr. Suresh Nambiar",    anaesthetist:"Dr. Kiran Das",     room:"OT-1", startTime:"10:00", durationMins:120, status:"Completed",   urgency:"Elective",   diagnosis:"Multi-nodular Goitre",        notes:"Parathyroids preserved. Drain in situ.",       date:"2026-04-15" },
  { id:"OT-0900", patient:"Sarah Malik",       uhid:"AY-00002", age:34, gender:"F", blood:"A+",  procedure:"Wound Debridement",                  surgeon:"Dr. Priya Subramaniam", anaesthetist:"Dr. Shalini Varma", room:"OT-3", startTime:"14:00", durationMins:45,  status:"Cancelled",   urgency:"Elective",   diagnosis:"Infected wound",              notes:"Cancelled — patient febrile. Rescheduled.",    date:"2026-04-15" },
  { id:"OT-0907", patient:"Rajiv Tiwari",      uhid:"AY-00012", age:73, gender:"M", blood:"B+",  procedure:"Hip Replacement (Left)",              surgeon:"Dr. Arjun Pillai",      anaesthetist:"Dr. Shalini Varma", room:"OT-1", startTime:"07:30", durationMins:180, status:"Scheduled",   urgency:"Elective",   diagnosis:"Hip Fracture NOF",            notes:"High-risk — cardiology clearance obtained.",   date:"2026-04-17" },
  { id:"OT-0908", patient:"Anish Kurri",       uhid:"AY-00001", age:29, gender:"M", blood:"O+",  procedure:"Renal Biopsy",                        surgeon:"Dr. Vinod Nair",        anaesthetist:"Dr. Kiran Das",     room:"OT-3", startTime:"09:00", durationMins:45,  status:"Scheduled",   urgency:"Semi-Urgent",diagnosis:"Hypertensive Nephropathy",    notes:"US-guided, conscious sedation.",               date:"2026-04-17" },
];

const STATUS_STYLE: Record<OTStatus, string> = {
  "Scheduled":   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Prep":        "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "In Progress": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Completed":   "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20",
  "Cancelled":   "bg-red-500/10 text-red-400 border-red-500/20",
};

const URGENCY_STYLE: Record<Urgency, string> = {
  "Elective":    "text-slate-500 bg-white/5 border-white/8",
  "Semi-Urgent": "text-yellow-400 bg-yellow-500/5 border-yellow-500/20",
  "Emergency":   "text-red-400 bg-red-500/5 border-red-500/20",
};

const STATUS_ICON: Record<OTStatus, React.ReactNode> = {
  "Scheduled":   <Clock className="h-3 w-3" />,
  "Prep":        <Activity className="h-3 w-3" />,
  "In Progress": <Scissors className="h-3 w-3" />,
  "Completed":   <CheckCircle2 className="h-3 w-3" />,
  "Cancelled":   <XCircle className="h-3 w-3" />,
};

const OT_ROOMS: OTRoom[] = ["OT-1", "OT-2", "OT-3", "OT-4"];

function endTime(start: string, mins: number) {
  const [h, m] = start.split(":").map(Number);
  const t = h * 60 + m + mins;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export default function OTSchedulerPage() {
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [statusFilter, setStatusFilter] = useState<OTStatus | "All">("All");
  const [search, setSearch]             = useState("");
  const [expanded, setExpanded]         = useState<string | null>(null);

  const daySurgeries = SURGERIES.filter((s) => s.date === selectedDate);

  const filtered = daySurgeries.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = s.patient.toLowerCase().includes(q) || s.procedure.toLowerCase().includes(q) ||
      s.surgeon.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
    return matchSearch && (statusFilter === "All" || s.status === statusFilter);
  });

  const roomTimeline = OT_ROOMS.map((room) => ({
    room,
    cases: daySurgeries.filter((s) => s.room === room).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  const counts = {
    total:      daySurgeries.length,
    completed:  daySurgeries.filter((s) => s.status === "Completed").length,
    active:     daySurgeries.filter((s) => s.status === "In Progress" || s.status === "Prep").length,
    emergency:  daySurgeries.filter((s) => s.urgency === "Emergency").length,
  };

  return (
    <>
      <TopBar title="OT Scheduler" action={{ label: "+ Schedule Surgery", href: "#" }} />
      <main className="p-8 space-y-6">

        {/* KPI */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Today's Cases",  value: counts.total,     color: "default" as const },
            { label: "Completed",      value: counts.completed, color: "teal"    as const },
            { label: "Active / Prep",  value: counts.active,    color: "purple"  as const },
            { label: "Emergency",      value: counts.emergency, color: "red"     as const },
          ].map(({ label, value, color }) => (
            <div key={label} className={cn("rounded-xl border px-5 py-4", {
              "border-white/8 bg-white/[0.02] text-slate-200":     color === "default",
              "border-[#0F766E]/20 bg-[#0F766E]/5 text-[#0F766E]": color === "teal",
              "border-purple-500/20 bg-purple-500/5 text-purple-400": color === "purple",
              "border-red-500/20 bg-red-500/5 text-red-400":       color === "red",
            })}>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* Date selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { const i = DATES.indexOf(selectedDate); if (i > 0) setSelectedDate(DATES[i-1]); }}
            className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 text-slate-500 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-1">
            {DATES.map((d) => (
              <button key={d} onClick={() => setSelectedDate(d)}
                className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all border",
                  d === selectedDate
                    ? "bg-[#0F766E] text-white border-[#0F766E]"
                    : "border-white/8 text-slate-500 hover:text-slate-300 hover:bg-white/5"
                )}>
                {d === TODAY ? "Today" : d === "2026-04-15" ? "Yesterday" : d}
              </button>
            ))}
          </div>
          <button
            onClick={() => { const i = DATES.indexOf(selectedDate); if (i < DATES.length-1) setSelectedDate(DATES[i+1]); }}
            className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 text-slate-500 transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Room timeline Gantt */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="border-b border-border/10 bg-black/10 pb-4">
            <CardTitle className="text-sm">Room Utilisation — {selectedDate}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {roomTimeline.map(({ room, cases }) => (
              <div key={room} className="flex items-center gap-4">
                <div className="w-10 text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">{room}</div>
                <div className="flex-1 h-10 bg-black/20 border border-white/5 rounded-lg relative overflow-hidden">
                  {cases.map((s) => {
                    const [sh, sm] = s.startTime.split(":").map(Number);
                    const startMins = sh * 60 + sm;
                    const dayStart = 7 * 60; const dayLen = 14 * 60;
                    const left  = ((startMins - dayStart) / dayLen) * 100;
                    const width = (s.durationMins / dayLen) * 100;
                    const bg =
                      s.status === "Completed"   ? "bg-[#0F766E]/40 border-[#0F766E]/50" :
                      s.status === "In Progress" ? "bg-purple-500/40 border-purple-500/50 animate-pulse" :
                      s.status === "Prep"        ? "bg-yellow-500/30 border-yellow-500/40" :
                      s.status === "Cancelled"   ? "bg-red-500/20 border-red-500/30 opacity-50" :
                                                   "bg-blue-500/30 border-blue-500/40";
                    return (
                      <div key={s.id} title={`${s.procedure} · ${s.startTime}–${endTime(s.startTime, s.durationMins)}`}
                        className={cn("absolute top-1 bottom-1 rounded border text-[8px] font-bold text-white flex items-center justify-center overflow-hidden cursor-pointer", bg)}
                        style={{ left: `${Math.max(0, left)}%`, width: `${Math.min(100 - Math.max(0, left), width)}%` }}
                      >
                        <span className="truncate px-1">{s.patient.split(" ")[0]}</span>
                      </div>
                    );
                  })}
                  {cases.length === 0 && <div className="h-full flex items-center justify-center text-[10px] text-slate-700 italic">Available</div>}
                </div>
              </div>
            ))}
            <div className="flex justify-between text-[9px] text-slate-700 pl-14">
              {["07:00","09:00","11:00","13:00","15:00","17:00","19:00","21:00"].map((t) => <span key={t}>{t}</span>)}
            </div>
          </CardContent>
        </Card>

        {/* Filter toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-xl px-4 py-2.5 flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Patient, procedure or surgeon…"
              className="bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none flex-1" />
          </div>
          <div className="flex gap-1 bg-surface/40 p-1 rounded-xl border border-border/40">
            {(["All","Scheduled","Prep","In Progress","Completed","Cancelled"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all",
                  statusFilter === s ? "bg-[#0F766E] text-white" : "text-muted hover:text-fg hover:bg-white/5")}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Surgery cards */}
        <div className="space-y-3">
          {filtered.map((s) => {
            const isExpanded = expanded === s.id;
            return (
              <Card key={s.id} className={cn(
                "border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden transition-all",
                s.urgency === "Emergency" && "ring-1 ring-red-500/30",
                s.status === "In Progress" && "ring-1 ring-purple-500/30",
              )}>
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
                  onClick={() => setExpanded(isExpanded ? null : s.id)}>
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border shrink-0", STATUS_STYLE[s.status])}>
                    {STATUS_ICON[s.status]}
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-1 md:gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{s.patient}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{s.uhid} · {s.age}y {s.gender} · {s.blood}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-300 font-medium truncate">{s.procedure}</p>
                      <p className="text-[10px] text-slate-600 truncate">{s.diagnosis}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{s.surgeon}</p>
                      <p className="text-[10px] text-slate-600">{s.anaesthetist}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="h-3 w-3 text-slate-600 shrink-0" />
                      <span className="text-xs font-mono text-slate-300">{s.startTime}–{endTime(s.startTime, s.durationMins)}</span>
                      <span className="text-[10px] text-slate-600">({s.durationMins}m)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", URGENCY_STYLE[s.urgency])}>{s.urgency}</span>
                    <span className="text-[10px] font-bold text-slate-600 border border-white/8 bg-white/5 px-2 py-0.5 rounded-full">{s.room}</span>
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", STATUS_STYLE[s.status])}>
                      {STATUS_ICON[s.status]} {s.status}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="border-t border-white/5 px-5 pt-4 pb-5 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "OT Room",      value: s.room },
                        { label: "Start",        value: s.startTime,                     mono: true },
                        { label: "End",          value: endTime(s.startTime, s.durationMins), mono: true },
                        { label: "Duration",     value: `${s.durationMins} min` },
                        { label: "Surgeon",      value: s.surgeon },
                        { label: "Anaesthetist", value: s.anaesthetist },
                        { label: "Blood Group",  value: s.blood },
                        { label: "OT Ref",       value: s.id,                            mono: true },
                      ].map(({ label, value, mono }) => (
                        <div key={label}>
                          <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">{label}</p>
                          <p className={cn("text-xs text-slate-300 mt-0.5", mono && "font-mono")}>{value}</p>
                        </div>
                      ))}
                    </div>
                    {s.notes && (
                      <div className="bg-black/20 border border-white/5 rounded-lg px-4 py-2.5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold mb-1">Notes</p>
                        <p className="text-xs text-slate-300">{s.notes}</p>
                      </div>
                    )}
                    {(s.status === "Scheduled" || s.status === "Prep") && (
                      <div className="flex gap-2">
                        <button className="px-4 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold transition-all">
                          {s.status === "Scheduled" ? "Mark Prep" : "Start Surgery"}
                        </button>
                        <button className="px-4 py-1.5 rounded-lg border border-white/8 hover:bg-white/5 text-slate-400 text-xs font-bold transition-all">Reschedule</button>
                        <button className="px-4 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all">Cancel</button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-600">
              <Scissors className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No surgeries for this date / filter</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
