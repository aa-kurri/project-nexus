"use client";

import { useState } from "react";

/* ── Shared shell for all three specialty modules ─────────────────
   Route: /hospital/specialty/[type]
   Handles: dialysis | dental | ivf
   ──────────────────────────────────────────────────────────────── */

import { Droplets, Smile, Baby, Activity, Plus, ChevronLeft } from "lucide-react";
import Link from "next/link";

// ── DIALYSIS ────────────────────────────────────────────────────

const DIALYSIS_SESSIONS = [
  { id: "1", patient: "Rajan Mehta", machine: "HD-03", session: 48, access: "av_fistula", preWt: 72.4, postWt: 70.1, ufGoal: 2300, ufAchieved: 2150, duration: 240, nurse: "Anita Roy", started: "07:00", status: "completed" },
  { id: "2", patient: "Sunita Devi", machine: "HD-01", session: 23, access: "catheter", preWt: 58.2, postWt: null, ufGoal: 1800, ufAchieved: null, duration: null, nurse: "Kiran P.", started: "08:30", status: "in_progress" },
];

function DialysisModule() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-white">Today's Dialysis Sessions</h2>
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Session
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {DIALYSIS_SESSIONS.map((s) => (
          <div key={s.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-semibold text-white">{s.patient}</p>
                <p className="text-xs text-gray-400 mt-0.5">Session #{s.session} · {s.machine} · {s.access.replace("_", " ")}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${s.status === "completed" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-blue-500/15 text-blue-400 border-blue-500/30"}`}>
                {s.status.replace("_", " ")}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Pre Weight", value: `${s.preWt} kg` },
                { label: "Post Weight", value: s.postWt ? `${s.postWt} kg` : "—" },
                { label: "UF Achieved", value: s.ufAchieved ? `${s.ufAchieved} mL` : "—" },
              ].map((item) => (
                <div key={item.label} className="bg-white/[0.03] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Nurse: {s.nurse} · Started: {s.started}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DENTAL ──────────────────────────────────────────────────────

const TOOTH_CONDITIONS: Record<number, { condition: string; color: string }> = {
  11: { condition: "caries", color: "bg-red-500" },
  21: { condition: "crown", color: "bg-amber-500" },
  36: { condition: "missing", color: "bg-gray-600" },
  46: { condition: "filling", color: "bg-blue-500" },
};

const UPPER_TEETH = [18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28];
const LOWER_TEETH = [48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38];

function DentalModule() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-white">Dental Chart</h2>
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <p className="text-xs text-gray-400 text-center mb-4">UPPER JAW</p>
        <div className="flex justify-center gap-1.5 mb-6">
          {UPPER_TEETH.map((t) => {
            const cond = TOOTH_CONDITIONS[t];
            return (
              <button
                key={t}
                onClick={() => setSelected(t)}
                title={`Tooth ${t}${cond ? ` — ${cond.condition}` : ""}`}
                className={`w-9 h-10 rounded-t-2xl border-2 text-xs font-bold transition-all ${selected === t ? "border-violet-400 scale-110" : "border-white/20 hover:border-white/40"} ${cond ? cond.color : "bg-white/10"} text-white`}
              >
                {t}
              </button>
            );
          })}
        </div>
        <div className="flex justify-center gap-1.5">
          {LOWER_TEETH.map((t) => {
            const cond = TOOTH_CONDITIONS[t];
            return (
              <button
                key={t}
                onClick={() => setSelected(t)}
                className={`w-9 h-10 rounded-b-2xl border-2 text-xs font-bold transition-all ${selected === t ? "border-violet-400 scale-110" : "border-white/20 hover:border-white/40"} ${cond ? cond.color : "bg-white/10"} text-white`}
              >
                {t}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">LOWER JAW</p>
        <div className="flex gap-3 mt-5 justify-center flex-wrap">
          {[["bg-red-500", "Caries"], ["bg-amber-500", "Crown"], ["bg-gray-600", "Missing"], ["bg-blue-500", "Filling"], ["bg-white/10", "Healthy"]].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${color}`} />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
      {selected && (
        <div className="bg-white/[0.03] border border-violet-500/30 rounded-xl p-5">
          <p className="font-medium text-violet-300 mb-3">Tooth {selected} — Record Treatment</p>
          <div className="grid grid-cols-3 gap-3">
            {["Extraction", "RCT", "Filling", "Crown", "Scaling", "Bleaching"].map((t) => (
              <button key={t} className="bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/40 text-sm text-gray-300 hover:text-violet-300 py-2 rounded-lg transition-colors">{t}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── IVF ─────────────────────────────────────────────────────────

const IVF_CYCLES = [
  { id: "1", patient: "Lakshmi Bai", cycle: 2, protocol: "Antagonist", stage: "embryo_transfer", eggs: 12, fertilized: 8, frozen: 5, transferred: 2, started: "2026-04-10" },
  { id: "2", patient: "Roopa Singh", cycle: 1, protocol: "Long Agonist", stage: "stimulation", eggs: null, fertilized: null, frozen: null, transferred: null, started: "2026-04-15" },
];

const IVF_STAGES = ["stimulation", "egg_retrieval", "fertilization", "embryo_transfer", "outcome"];

function IVFModule() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <h2 className="font-semibold text-white">IVF Cycle Tracker</h2>
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Cycle
        </button>
      </div>
      {IVF_CYCLES.map((cycle) => (
        <div key={cycle.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-semibold text-white">{cycle.patient}</p>
              <p className="text-xs text-gray-400">Cycle #{cycle.cycle} · {cycle.protocol} Protocol · Started {cycle.started}</p>
            </div>
          </div>
          {/* Stage stepper */}
          <div className="flex items-center gap-0 mb-5">
            {IVF_STAGES.map((stage, i) => {
              const active = stage === cycle.stage;
              const done = IVF_STAGES.indexOf(cycle.stage) > i;
              return (
                <div key={stage} className="flex items-center flex-1">
                  <div className={`flex-1 text-center py-2 text-xs font-medium rounded-lg transition-colors ${active ? "bg-violet-600 text-white" : done ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-500"}`}>
                    {stage.replace("_", " ")}
                  </div>
                  {i < IVF_STAGES.length - 1 && <div className={`w-4 h-0.5 ${done ? "bg-emerald-500" : "bg-white/10"}`} />}
                </div>
              );
            })}
          </div>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Eggs Retrieved", value: cycle.eggs },
              { label: "Fertilized", value: cycle.fertilized },
              { label: "Frozen", value: cycle.frozen },
              { label: "Transferred", value: cycle.transferred },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/[0.03] rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value ?? "—"}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────

const SPECIALTY_CONFIG = {
  dialysis: { label: "Dialysis Unit", icon: Droplets, color: "text-blue-400", component: DialysisModule },
  dental: { label: "Dental Clinic", icon: Smile, color: "text-amber-400", component: DentalModule },
  ivf: { label: "IVF & Fertility", icon: Baby, color: "text-pink-400", component: IVFModule },
};

export default function SpecialtyPage({ params }: { params: { type: string } }) {
  const spec = SPECIALTY_CONFIG[params.type as keyof typeof SPECIALTY_CONFIG];
  if (!spec) return <div className="p-10 text-gray-400">Specialty not found</div>;

  const Icon = spec.icon;
  const Component = spec.component;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </Link>
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${spec.color}`} />
          <h1 className="text-2xl font-bold text-white">{spec.label}</h1>
        </div>
      </div>
      <Component />
    </div>
  );
}
