"use client";

import { useState } from "react";
import { Sparkles, CheckCircle, Clock, AlertTriangle, Wrench } from "lucide-react";

const WARDS = ["All", "W1", "W2", "W3", "ICU", "NICU", "OT"];

const MOCK_TASKS = [
  { id: "1", bed: "W2-04", ward: "W2", task: "terminal_clean", status: "pending", requestedAt: "09:15", assignedTo: "Ramesh K.", priority: "high" },
  { id: "2", bed: "ICU-02", ward: "ICU", task: "disinfection", status: "in_progress", requestedAt: "08:45", assignedTo: "Sunita M.", priority: "critical" },
  { id: "3", bed: "W1-08", ward: "W1", task: "routine_clean", status: "done", requestedAt: "07:30", assignedTo: "Kiran P.", priority: "normal" },
  { id: "4", bed: "W3-01", ward: "W3", task: "linen_change", status: "pending", requestedAt: "09:50", assignedTo: null, priority: "normal" },
  { id: "5", bed: "W2-11", ward: "W2", task: "terminal_clean", status: "inspected", requestedAt: "06:00", assignedTo: "Ramesh K.", priority: "high" },
  { id: "6", bed: "NICU-01", ward: "NICU", task: "disinfection", status: "pending", requestedAt: "10:00", assignedTo: null, priority: "critical" },
];

const TASK_LABELS: Record<string, string> = { terminal_clean: "Terminal Clean", routine_clean: "Routine Clean", linen_change: "Linen Change", disinfection: "Disinfection" };
const PRIORITY_STYLE: Record<string, string> = { normal: "text-gray-400", high: "text-amber-400", critical: "text-red-400" };
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  inspected: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

export default function HousekeepingPage() {
  const [activeWard, setActiveWard] = useState("All");
  const filtered = MOCK_TASKS.filter((t) => activeWard === "All" || t.ward === activeWard);

  const counts = { pending: MOCK_TASKS.filter(t => t.status === "pending").length, in_progress: MOCK_TASKS.filter(t => t.status === "in_progress").length, done: MOCK_TASKS.filter(t => t.status === "done").length, inspected: MOCK_TASKS.filter(t => t.status === "inspected").length };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Housekeeping & Bed Turnover</h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time cleaning assignments & bed readiness</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pending", count: counts.pending, color: "text-amber-400 bg-amber-500/15 border-amber-500/30" },
          { label: "In Progress", count: counts.in_progress, color: "text-blue-400 bg-blue-500/15 border-blue-500/30" },
          { label: "Done", count: counts.done, color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" },
          { label: "Inspected", count: counts.inspected, color: "text-violet-400 bg-violet-500/15 border-violet-500/30" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1 opacity-70">{s.label}</p>
            <p className="text-3xl font-bold">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Ward tabs */}
      <div className="flex gap-2 flex-wrap">
        {WARDS.map((w) => (
          <button
            key={w}
            onClick={() => setActiveWard(w)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeWard === w ? "bg-violet-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((task) => (
          <div key={task.id} className="bg-white/[0.03] border border-white/10 rounded-xl p-5 hover:border-violet-500/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-lg">{task.bed}</p>
                  <span className={`text-xs font-bold ${PRIORITY_STYLE[task.priority]}`}>
                    {task.priority === "critical" ? "⚡ CRITICAL" : task.priority === "high" ? "⚠ HIGH" : ""}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Requested at {task.requestedAt}</p>
              </div>
              <span className={`text-xs border px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[task.status]}`}>
                {task.status.replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-gray-300">{TASK_LABELS[task.task]}</span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {task.assignedTo ? `👤 ${task.assignedTo}` : "⚠ Unassigned"}
              </p>
              <div className="flex gap-2">
                {task.status === "pending" && (
                  <button className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-500/30 px-3 py-1 rounded-lg">Start</button>
                )}
                {task.status === "in_progress" && (
                  <button className="text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 border border-emerald-500/30 px-3 py-1 rounded-lg">Mark Done</button>
                )}
                {task.status === "done" && (
                  <button className="text-xs bg-violet-600/20 text-violet-400 hover:bg-violet-600/40 border border-violet-500/30 px-3 py-1 rounded-lg">Inspect</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
