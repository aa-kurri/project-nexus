"use client";

import { useState } from "react";
import { Heart, Calendar, UserCheck, AlertCircle, Plus, ChevronRight, Activity } from "lucide-react";

const PROGRAMS = [
  { id: "HIV", name: "HIV Care Program", code: "HIV-CARE", patients: 34, due: 8, followup: 30 },
  { id: "TB", name: "TB DOTS Program", code: "TB-DOTS", patients: 21, due: 3, followup: 14 },
  { id: "DM", name: "Diabetes Management", code: "DM-MGMT", patients: 87, due: 15, followup: 60 },
  { id: "HTN", name: "Hypertension Control", code: "HTN-CTRL", patients: 52, due: 6, followup: 45 },
  { id: "ANC", name: "Antenatal Care", code: "ANC-PRG", patients: 29, due: 11, followup: 21 },
];

const ENROLLED_PATIENTS = [
  { id: "1", name: "Sunita Devi", program: "Diabetes Management", enrolled: "2025-11-10", nextVisit: "2026-04-21", status: "active", visits: 5 },
  { id: "2", name: "Rajan Mehta", program: "HIV Care Program", enrolled: "2025-08-03", nextVisit: "2026-04-19", status: "due", visits: 9 },
  { id: "3", name: "Lakshmi Bai", program: "Antenatal Care", enrolled: "2026-02-14", nextVisit: "2026-04-25", status: "active", visits: 3 },
  { id: "4", name: "Mohan Kumar", program: "TB DOTS Program", enrolled: "2025-12-01", nextVisit: "2026-04-17", status: "overdue", visits: 7 },
];

const STATUS_STYLE: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  due: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  overdue: "text-red-400 bg-red-500/15 border-red-500/30",
};

export default function ProgramsPage() {
  const [view, setView] = useState<"programs" | "patients">("programs");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Longitudinal Care Programs</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track patients across chronic & public health programs</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
            {(["programs", "patients"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${view === v ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Enroll Patient
          </button>
        </div>
      </div>

      {/* Due Today Alert */}
      <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
        <p className="text-sm text-amber-300">
          <span className="font-semibold">43 patients</span> are due for follow-up visits today across all programs.
        </p>
        <button className="ml-auto text-xs text-amber-400 hover:text-amber-300 font-medium">View All</button>
      </div>

      {view === "programs" ? (
        <div className="grid grid-cols-3 gap-4">
          {PROGRAMS.map((prog) => (
            <div key={prog.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-5 hover:border-violet-500/40 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-violet-400" />
                </div>
                <span className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded font-mono">{prog.code}</span>
              </div>
              <h3 className="font-semibold text-white mb-1">{prog.name}</h3>
              <p className="text-xs text-gray-500 mb-4">Follow-up every {prog.followup} days</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-gray-300">
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span>{prog.patients} enrolled</span>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${prog.due > 5 ? "text-red-400 bg-red-500/10 border-red-500/30" : "text-amber-400 bg-amber-500/10 border-amber-500/30"}`}>
                  <Calendar className="w-3 h-3" />
                  {prog.due} due
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="w-full bg-white/10 rounded-full h-1.5 mr-3">
                  <div
                    className="bg-violet-500 h-1.5 rounded-full"
                    style={{ width: `${100 - (prog.due / prog.patients) * 100}%` }}
                  />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-violet-400 transition-colors shrink-0" />
              </div>
            </div>
          ))}

          {/* Add Program Card */}
          <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-violet-500/40 hover:bg-white/[0.04] transition-colors min-h-[200px]">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400">Create New Program</p>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {["Patient", "Program", "Enrolled", "Next Visit", "Visits", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ENROLLED_PATIENTS.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 font-medium text-sm text-white">{p.name}</td>
                  <td className="px-5 py-4 text-sm text-gray-300">{p.program}</td>
                  <td className="px-5 py-4 text-sm text-gray-400 font-mono">{p.enrolled}</td>
                  <td className="px-5 py-4 text-sm font-mono text-gray-300">{p.nextVisit}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-sm text-gray-300">{p.visits}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs border px-2 py-1 rounded-full font-medium ${STATUS_STYLE[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button className="text-xs bg-violet-600/20 text-violet-400 hover:bg-violet-600/40 border border-violet-500/30 px-3 py-1 rounded-lg transition-colors">
                      Record Visit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
