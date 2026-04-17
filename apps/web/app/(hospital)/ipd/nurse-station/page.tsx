"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Activity, Thermometer, Wind, User, Clock, CheckCircle2,
  Bell, AlertTriangle, Heart, ChevronDown, ChevronUp,
  Stethoscope, Brain, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── NEWS2 Scoring ────────────────────────────────────────────────────────────
function scoreRR(rr: number)    { if (rr <= 8) return 3; if (rr <= 11) return 1; if (rr <= 20) return 0; if (rr <= 24) return 2; return 3; }
function scoreSpO2(s: number)   { if (s <= 91) return 3; if (s <= 93) return 2; if (s <= 95) return 1; return 0; }
function scoreSBP(sbp: number)  { if (sbp <= 90) return 3; if (sbp <= 100) return 2; if (sbp <= 110) return 1; if (sbp <= 219) return 0; return 3; }
function scoreHR(hr: number)    { if (hr <= 40) return 3; if (hr <= 50) return 1; if (hr <= 90) return 0; if (hr <= 110) return 1; if (hr <= 130) return 2; return 3; }
function scoreTemp(t: number)   { if (t <= 35.0) return 3; if (t <= 36.0) return 1; if (t <= 38.0) return 0; if (t <= 39.0) return 1; return 2; }
function scoreAVPU(a: string)   { return a === "A" ? 0 : 3; }
function scoreO2(on: boolean)   { return on ? 2 : 0; }

function calcNEWS2(v: PatientVitals) {
  const scores = {
    rr:   scoreRR(v.rr),
    spo2: scoreSpO2(v.spo2),
    sbp:  scoreSBP(v.sbp),
    hr:   scoreHR(v.hr),
    temp: scoreTemp(v.temp),
    avpu: scoreAVPU(v.avpu),
    o2:   scoreO2(v.onO2),
  };
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const anyRed = Object.values(scores).some((s) => s === 3);
  const risk: "low" | "medium" | "high" =
    total >= 7 ? "high" : total >= 5 || anyRed ? "medium" : "low";
  return { scores, total, risk };
}

// ─── Types ────────────────────────────────────────────────────────────────────
type AVPU = "A" | "V" | "P" | "U";
interface PatientVitals { rr: number; spo2: number; sbp: number; dbp: number; hr: number; temp: number; avpu: AVPU; onO2: boolean; }

interface Patient {
  id: string; name: string; age: number; diagnosis: string;
  ward: string; admitDate: string;
  vitals: PatientVitals;
  tasks: string[];
  acknowledged: boolean;
}

const INITIAL_PATIENTS: Patient[] = [
  {
    id: "B-201", name: "Rajesh Kumar",       age: 58, diagnosis: "COPD Exacerbation",  ward: "Ward 3B", admitDate: "2026-04-14",
    vitals: { rr: 22, spo2: 93, sbp: 142, dbp: 88, hr: 104, temp: 37.8, avpu: "A", onO2: true  },
    tasks: ["Nebulization due", "Check O2 flow", "IV fluids"],
    acknowledged: false,
  },
  {
    id: "B-205", name: "Meena Sharma",       age: 45, diagnosis: "Hypertensive Crisis", ward: "Ward 3B", admitDate: "2026-04-15",
    vitals: { rr: 26, spo2: 91, sbp: 188, dbp: 110, hr: 118, temp: 38.6, avpu: "A", onO2: true  },
    tasks: ["IV antihypertensive", "Urine output monitoring"],
    acknowledged: false,
  },
  {
    id: "B-208", name: "Sam Arthur",         age: 34, diagnosis: "Post-appendectomy",   ward: "Ward 2A", admitDate: "2026-04-16",
    vitals: { rr: 16, spo2: 98, sbp: 118, dbp: 76, hr: 74, temp: 36.8, avpu: "A", onO2: false },
    tasks: ["Wound dressing", "Oral medications"],
    acknowledged: false,
  },
  {
    id: "ICU-3", name: "Sunita Sharma",      age: 60, diagnosis: "STEMI Post-PCI",      ward: "ICU",    admitDate: "2026-04-15",
    vitals: { rr: 18, spo2: 96, sbp: 108, dbp: 68, hr: 86, temp: 37.2, avpu: "A", onO2: true  },
    tasks: ["ECG monitoring", "Heparin infusion", "Cardiac enzymes @ 18:00"],
    acknowledged: true,
  },
  {
    id: "B-312", name: "Mohammed Farhan",    age: 55, diagnosis: "CKD Stage 3",          ward: "Ward 4C", admitDate: "2026-04-13",
    vitals: { rr: 14, spo2: 97, sbp: 132, dbp: 82, hr: 68, temp: 36.9, avpu: "A", onO2: false },
    tasks: ["Dialysis prep", "Fluid restriction reminder"],
    acknowledged: false,
  },
];

const RISK_STYLE = {
  low:    { card: "",                              badge: "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20",   label: "Low Risk",    ring: "" },
  medium: { card: "ring-1 ring-yellow-500/40",     badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", label: "Medium Risk", ring: "ring-yellow-500/40" },
  high:   { card: "ring-2 ring-red-500/50",        badge: "bg-red-500/10 text-red-400 border-red-500/20",         label: "HIGH RISK",   ring: "ring-red-500/50" },
};

export default function NurseStationPage() {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editId, setEditId]     = useState<string | null>(null);
  const [draft, setDraft]       = useState<PatientVitals | null>(null);

  const alerts = patients.filter((p) => {
    const { risk } = calcNEWS2(p.vitals);
    return (risk === "high" || risk === "medium") && !p.acknowledged;
  });

  function startEdit(p: Patient) {
    setEditId(p.id);
    setDraft({ ...p.vitals });
    setExpanded(p.id);
  }

  function saveVitals(id: string) {
    if (!draft) return;
    setPatients((ps) => ps.map((p) => p.id === id ? { ...p, vitals: draft } : p));
    setEditId(null);
    setDraft(null);
  }

  function acknowledge(id: string) {
    setPatients((ps) => ps.map((p) => p.id === id ? { ...p, acknowledged: true } : p));
  }

  function completeTask(patientId: string, task: string) {
    setPatients((ps) => ps.map((p) =>
      p.id === patientId ? { ...p, tasks: p.tasks.filter((t) => t !== task) } : p
    ));
  }

  const setD = (k: keyof PatientVitals) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : k === "avpu" ? e.target.value
      : Number(e.target.value);
    setDraft((d) => d ? { ...d, [k]: val } : d);
  };

  // Sort: high risk first
  const sorted = [...patients].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[calcNEWS2(a.vitals).risk] - order[calcNEWS2(b.vitals).risk];
  });

  return (
    <>
      <TopBar title="Nurse Station — NEWS2" action={{ label: "Call Duty Doctor", href: "#" }} />
      <main className="p-8 space-y-6">

        {/* Alert banner */}
        {alerts.length > 0 && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
            <div className="bg-red-500 p-2 rounded-lg animate-pulse shrink-0">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-300 mb-1">
                {alerts.length} patient{alerts.length > 1 ? "s" : ""} need{alerts.length === 1 ? "s" : ""} attention
              </p>
              <div className="flex flex-wrap gap-2">
                {alerts.map((p) => {
                  const { total, risk } = calcNEWS2(p.vitals);
                  return (
                    <span key={p.id} className="text-xs bg-red-500/20 border border-red-500/30 text-red-300 px-2 py-0.5 rounded-full font-bold">
                      {p.name} — NEWS2 {total} ({risk === "high" ? "HIGH" : "MEDIUM"})
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Patient cards */}
        <div className="space-y-4">
          {sorted.map((p) => {
            const { scores, total, risk } = calcNEWS2(p.vitals);
            const isExpanded = expanded === p.id;
            const isEditing  = editId === p.id;
            const v = isEditing && draft ? draft : p.vitals;

            return (
              <Card key={p.id} className={cn("border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden transition-all", RISK_STYLE[risk].card)}>
                {/* Header row */}
                <CardHeader
                  className="flex flex-row items-center gap-4 space-y-0 pb-3 cursor-pointer select-none"
                  onClick={() => setExpanded(isExpanded ? null : p.id)}
                >
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center border shrink-0",
                    risk === "high" ? "bg-red-500/10 border-red-500/30" :
                    risk === "medium" ? "bg-yellow-500/10 border-yellow-500/30" :
                    "bg-[#0F766E]/10 border-[#0F766E]/20")}>
                    <User className={cn("h-5 w-5",
                      risk === "high" ? "text-red-400" : risk === "medium" ? "text-yellow-400" : "text-[#0F766E]")} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-sm">{p.name}</CardTitle>
                      <span className="text-[10px] font-mono text-slate-500">{p.id}</span>
                      <span className="text-[10px] text-slate-600">· {p.ward} · {p.diagnosis}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5">Admitted {p.admitDate} · Age {p.age}</p>
                  </div>

                  {/* NEWS2 score badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    {p.tasks.length > 0 && (
                      <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                        {p.tasks.length} task{p.tasks.length > 1 ? "s" : ""}
                      </span>
                    )}
                    <div className={cn("flex flex-col items-center justify-center h-12 w-12 rounded-xl border font-bold", RISK_STYLE[risk].badge)}>
                      <span className="text-xl leading-none">{total}</span>
                      <span className="text-[8px] uppercase tracking-wider">NEWS2</span>
                    </div>
                    {risk !== "low" && !p.acknowledged && (
                      <AlertTriangle className={cn("h-4 w-4 shrink-0", risk === "high" ? "text-red-400" : "text-yellow-400")} />
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-600" /> : <ChevronDown className="h-4 w-4 text-slate-600" />}
                  </div>
                </CardHeader>

                {/* Vitals summary strip (always visible) */}
                <div className="px-6 pb-3 grid grid-cols-4 lg:grid-cols-7 gap-2">
                  <VitalChip label="RR"   value={`${v.rr}`}        unit="/min" score={scores.rr}   icon={<Wind className="h-3 w-3" />} />
                  <VitalChip label="SpO2" value={`${v.spo2}`}      unit="%"   score={scores.spo2} icon={<Activity className="h-3 w-3" />} />
                  <VitalChip label="SBP"  value={`${v.sbp}`}       unit="mmHg" score={scores.sbp}  icon={<Heart className="h-3 w-3" />} />
                  <VitalChip label="HR"   value={`${v.hr}`}        unit="bpm" score={scores.hr}   icon={<Stethoscope className="h-3 w-3" />} />
                  <VitalChip label="Temp" value={`${v.temp}`}      unit="°C"  score={scores.temp} icon={<Thermometer className="h-3 w-3" />} />
                  <VitalChip label="AVPU" value={v.avpu}           unit=""    score={scores.avpu} icon={<Brain className="h-3 w-3" />} />
                  <VitalChip label="O2"   value={v.onO2 ? "On" : "Off"} unit="" score={scores.o2} icon={<Flame className="h-3 w-3" />} />
                </div>

                {/* Expanded section */}
                {isExpanded && (
                  <CardContent className="border-t border-white/5 pt-4 pb-5 px-6 space-y-5">

                    {/* NEWS2 risk bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">NEWS2 Score Breakdown</span>
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", RISK_STYLE[risk].badge)}>
                          {total} — {RISK_STYLE[risk].label}
                        </span>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {[
                          { label: "RR", score: scores.rr },
                          { label: "SpO2", score: scores.spo2 },
                          { label: "SBP", score: scores.sbp },
                          { label: "HR", score: scores.hr },
                          { label: "Temp", score: scores.temp },
                          { label: "AVPU", score: scores.avpu },
                          { label: "O2", score: scores.o2 },
                        ].map((item) => (
                          <div key={item.label} className="text-center">
                            <div className={cn("rounded-lg py-2 text-sm font-bold border",
                              item.score === 0 ? "bg-[#0F766E]/10 border-[#0F766E]/20 text-[#0F766E]" :
                              item.score === 1 ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                              item.score === 2 ? "bg-orange-500/10 border-orange-500/20 text-orange-400" :
                              "bg-red-500/10 border-red-500/20 text-red-400"
                            )}>
                              {item.score}
                            </div>
                            <p className="text-[9px] text-slate-600 mt-1 uppercase tracking-wider">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Vitals entry form */}
                    {isEditing && draft ? (
                      <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-wider text-[#0F766E] font-bold">Update Vitals</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <VitalInput label="Resp. Rate (/min)" value={draft.rr}   onChange={setD("rr")}   min={4}  max={60} />
                          <VitalInput label="SpO2 (%)"          value={draft.spo2} onChange={setD("spo2")} min={60} max={100} />
                          <VitalInput label="Systolic BP"        value={draft.sbp}  onChange={setD("sbp")}  min={60} max={260} />
                          <VitalInput label="Diastolic BP"       value={draft.dbp}  onChange={setD("dbp")}  min={40} max={150} />
                          <VitalInput label="Heart Rate (bpm)"   value={draft.hr}   onChange={setD("hr")}   min={30} max={200} />
                          <VitalInput label="Temperature (°C)"   value={draft.temp} onChange={setD("temp")} min={34} max={42} step={0.1} />
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">AVPU</label>
                            <select
                              value={draft.avpu}
                              onChange={setD("avpu")}
                              className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-[#0F766E]/50"
                            >
                              <option value="A">A — Alert</option>
                              <option value="V">V — Voice</option>
                              <option value="P">P — Pain</option>
                              <option value="U">U — Unresponsive</option>
                            </select>
                          </div>
                          <div className="space-y-1.5 flex flex-col justify-end">
                            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">On O2 Therapy</label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={draft.onO2}
                                onChange={setD("onO2")}
                                className="h-4 w-4 rounded accent-[#0F766E]"
                              />
                              <span className="text-sm text-slate-300">{draft.onO2 ? "Yes" : "No"}</span>
                            </label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveVitals(p.id)}
                            className="px-4 py-2 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold transition-all"
                          >
                            Save Vitals
                          </button>
                          <button
                            onClick={() => { setEditId(null); setDraft(null); }}
                            className="px-4 py-2 rounded-lg border border-white/8 hover:bg-white/5 text-slate-400 text-xs font-bold transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(p)}
                        className="text-xs text-[#0F766E] border border-[#0F766E]/20 bg-[#0F766E]/5 hover:bg-[#0F766E]/10 px-3 py-1.5 rounded-lg font-bold transition-all"
                      >
                        + Enter New Vitals
                      </button>
                    )}

                    {/* Tasks */}
                    {p.tasks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Pending Care Actions</p>
                        <div className="space-y-1.5">
                          {p.tasks.map((t) => (
                            <div key={t} className="flex items-center gap-2 p-2.5 rounded-lg bg-black/20 border border-white/5 group">
                              <Clock className="h-3 w-3 text-slate-600 shrink-0" />
                              <span className="text-xs text-slate-400 flex-1">{t}</span>
                              <button
                                onClick={() => completeTask(p.id, t)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#0F766E] font-bold"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Done
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Acknowledge / escalate */}
                    {(risk === "high" || risk === "medium") && !p.acknowledged && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => acknowledge(p.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F766E]/10 hover:bg-[#0F766E]/20 text-[#0F766E] border border-[#0F766E]/20 text-xs font-bold transition-all"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Acknowledge
                        </button>
                        <button className={cn(
                          "flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-bold transition-all",
                          risk === "high"
                            ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                            : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20"
                        )}>
                          <Bell className="h-3.5 w-3.5" /> Escalate to Doctor
                        </button>
                      </div>
                    )}
                    {p.acknowledged && (
                      <p className="text-[10px] text-slate-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-[#0F766E]" /> Acknowledged by nurse
                      </p>
                    )}
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

function VitalChip({ label, value, unit, score, icon }: {
  label: string; value: string; unit: string; score: number; icon: React.ReactNode;
}) {
  const color =
    score === 0 ? "text-slate-300 bg-black/20 border-white/5" :
    score === 1 ? "text-yellow-400 bg-yellow-500/5 border-yellow-500/15" :
    score === 2 ? "text-orange-400 bg-orange-500/5 border-orange-500/15" :
    "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <div className={cn("rounded-lg px-2 py-1.5 border text-center", color)}>
      <div className="flex items-center justify-center gap-1 mb-0.5 opacity-60">{icon}<span className="text-[8px] uppercase tracking-wider font-bold">{label}</span></div>
      <p className="text-xs font-bold font-mono">{value}<span className="text-[8px] opacity-60 ml-0.5">{unit}</span></p>
    </div>
  );
}

function VitalInput({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min: number; max: number; step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</label>
      <input
        type="number"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step ?? 1}
        className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono outline-none focus:border-[#0F766E]/50 transition-colors"
      />
    </div>
  );
}
