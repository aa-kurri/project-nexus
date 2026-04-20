"use client";

import { useState } from "react";
import { Package, Truck, CheckCircle, Clock, MapPin, BarChart3 } from "lucide-react";

const HUBS = [
  { id: "1", name: "City General Central Lab", address: "Hyderabad HQ", isPrimary: true },
  { id: "2", name: "North Zone Lab", address: "Secunderabad", isPrimary: false },
];

const DISPATCHES = [
  { id: "D001", sample: "S-2026-0445", patient: "Rajan Mehta", test: "Culture & Sensitivity", hub: "City General Central Lab", batch: "BATCH-042", status: "in_transit", dispatched: "06:30", courier: "LabXpress", tracking: "LX-9988" },
  { id: "D002", sample: "S-2026-0446", patient: "Sunita Devi", test: "HbA1c", hub: "City General Central Lab", batch: "BATCH-042", status: "received_at_hub", dispatched: "06:30", courier: "LabXpress", tracking: "LX-9989" },
  { id: "D003", sample: "S-2026-0447", patient: "Priya Nair", test: "Thyroid Panel", hub: "North Zone Lab", batch: "BATCH-041", status: "resulted", dispatched: "Yesterday", courier: "MedCourier", tracking: "MC-1121" },
  { id: "D004", sample: "S-2026-0441", patient: "Kartik Bose", test: "CSF Analysis", hub: "City General Central Lab", batch: "BATCH-040", status: "dispatched", dispatched: "09:15", courier: "LabXpress", tracking: "LX-9991" },
];

const STATUS_STYLE: Record<string, string> = {
  dispatched: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  in_transit: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  received_at_hub: "text-violet-400 bg-violet-500/15 border-violet-500/30",
  resulted: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
};

const STATUS_STEPS = ["dispatched", "in_transit", "received_at_hub", "resulted"];

export default function HubSpokePage() {
  const [activeHub, setActiveHub] = useState("all");

  const filtered = DISPATCHES.filter((d) => activeHub === "all" || d.hub === activeHub);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hub & Spoke Lab Network</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track samples dispatched to centralised processing labs</p>
        </div>
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Truck className="w-4 h-4" /> New Dispatch
        </button>
      </div>

      {/* Hubs */}
      <div className="grid grid-cols-2 gap-4">
        {HUBS.map((hub) => {
          const hubSamples = DISPATCHES.filter((d) => d.hub === hub.name);
          return (
            <div key={hub.id} className={`bg-white/[0.03] border rounded-xl p-5 cursor-pointer transition-colors ${activeHub === hub.name ? "border-violet-500/50 bg-violet-500/5" : "border-white/10 hover:border-violet-500/30"}`}
              onClick={() => setActiveHub(activeHub === hub.name ? "all" : hub.name)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-violet-400" />
                  <div>
                    <p className="font-semibold text-white text-sm">{hub.name}</p>
                    <p className="text-xs text-gray-400">{hub.address}</p>
                  </div>
                </div>
                {hub.isPrimary && <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded">Primary Hub</span>}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {["in_transit", "received_at_hub", "resulted"].map((s) => (
                  <div key={s} className="text-center">
                    <p className="text-lg font-bold text-white">{hubSamples.filter((d) => d.status === s).length}</p>
                    <p className="text-xs text-gray-500 capitalize">{s.replace(/_/g, " ")}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispatch table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Active Dispatches</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["Batch / Sample", "Patient", "Test", "Hub", "Courier", "Status"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4">
                  <p className="text-xs text-gray-500 font-mono">{d.batch}</p>
                  <p className="text-sm font-semibold text-white font-mono">{d.sample}</p>
                </td>
                <td className="px-5 py-4 text-sm text-gray-300">{d.patient}</td>
                <td className="px-5 py-4 text-sm text-gray-300">{d.test}</td>
                <td className="px-5 py-4 text-xs text-gray-400">{d.hub}</td>
                <td className="px-5 py-4">
                  <p className="text-xs text-gray-300">{d.courier}</p>
                  <p className="text-xs font-mono text-violet-400">{d.tracking}</p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1.5">
                    <span className={`text-xs border px-2 py-0.5 rounded-full font-medium w-fit ${STATUS_STYLE[d.status]}`}>
                      {d.status.replace(/_/g, " ")}
                    </span>
                    {/* Progress dots */}
                    <div className="flex items-center gap-1 mt-1">
                      {STATUS_STEPS.map((step, i) => (
                        <div key={step} className={`w-1.5 h-1.5 rounded-full ${STATUS_STEPS.indexOf(d.status) >= i ? "bg-violet-500" : "bg-white/10"}`} />
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
