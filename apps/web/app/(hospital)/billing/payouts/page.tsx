"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, CheckCircle, Clock, Download, Filter } from "lucide-react";

const MOCK_DOCTORS = [
  { id: "1", name: "Dr. Vikram Patel", dept: "General Medicine", basis: "revenue_pct", pct: 35, revenue: 284000, payout: 99400, status: "approved" },
  { id: "2", name: "Dr. Meera Singh", dept: "Pediatrics", basis: "flat_per_patient", flat: 500, revenue: 156000, payout: 78000, status: "draft" },
  { id: "3", name: "Dr. Arjun Kapoor", dept: "Cardiology", basis: "tiered", pct: 40, revenue: 520000, payout: 208000, status: "disbursed" },
  { id: "4", name: "Dr. Priya Sharma", dept: "Gynecology", basis: "revenue_pct", pct: 38, revenue: 310000, payout: 117800, status: "approved" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  approved: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  disbursed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export default function PayoutsPage() {
  const [period, setPeriod] = useState("2026-03");
  const [selectedBasis, setSelectedBasis] = useState("all");

  const totalPayout = MOCK_DOCTORS.reduce((s, d) => s + d.payout, 0);
  const totalRevenue = MOCK_DOCTORS.reduce((s, d) => s + d.revenue, 0);
  const disbursed = MOCK_DOCTORS.filter((d) => d.status === "disbursed").length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Doctor Payout Engine</h1>
          <p className="text-sm text-gray-400 mt-0.5">Automated revenue-based payout calculation</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="2026-04">April 2026</option>
            <option value="2026-03">March 2026</option>
            <option value="2026-02">February 2026</option>
          </select>
          <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            Export to Tally
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `₹${(totalRevenue / 100000).toFixed(1)}L`, icon: TrendingUp, color: "text-blue-400" },
          { label: "Total Payouts", value: `₹${(totalPayout / 100000).toFixed(1)}L`, icon: DollarSign, color: "text-violet-400" },
          { label: "Avg Payout %", value: `${((totalPayout / totalRevenue) * 100).toFixed(1)}%`, icon: Filter, color: "text-amber-400" },
          { label: "Disbursed", value: `${disbursed}/${MOCK_DOCTORS.length}`, icon: CheckCircle, color: "text-emerald-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">{kpi.label}</p>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Payout Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold text-white">Payout Ledger</h2>
          <div className="flex gap-2">
            {["all", "revenue_pct", "flat_per_patient", "tiered"].map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBasis(b)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${selectedBasis === b ? "bg-violet-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
              >
                {b === "all" ? "All" : b.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {["Doctor", "Department", "Basis", "Revenue", "Payout", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_DOCTORS.filter((d) => selectedBasis === "all" || d.basis === selectedBasis).map((doc) => (
              <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4">
                  <p className="font-medium text-white text-sm">{doc.name}</p>
                </td>
                <td className="px-5 py-4 text-sm text-gray-300">{doc.dept}</td>
                <td className="px-5 py-4">
                  <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded">
                    {doc.basis === "revenue_pct" ? `${doc.pct}% rev` : doc.basis.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm font-mono text-blue-300">₹{doc.revenue.toLocaleString("en-IN")}</td>
                <td className="px-5 py-4 text-sm font-mono font-semibold text-violet-300">₹{doc.payout.toLocaleString("en-IN")}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs border px-2 py-1 rounded-full font-medium ${STATUS_COLORS[doc.status]}`}>
                    {doc.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    {doc.status === "draft" && (
                      <button className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-500/30 px-3 py-1 rounded-lg transition-colors">
                        Approve
                      </button>
                    )}
                    {doc.status === "approved" && (
                      <button className="text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 border border-emerald-500/30 px-3 py-1 rounded-lg transition-colors">
                        Disburse
                      </button>
                    )}
                    <button className="text-xs bg-white/5 text-gray-400 hover:bg-white/10 px-3 py-1 rounded-lg transition-colors">
                      Detail
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rules Config */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">Payout Rule Configuration</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { basis: "Revenue %", desc: "Doctor earns % of services billed under their name", example: "35% of OPD + 40% of procedures" },
            { basis: "Flat per Patient", desc: "Fixed amount per consultation/visit regardless of billing", example: "₹500 per OPD, ₹2000 per IPD" },
            { basis: "Tiered", desc: "Percentage changes based on revenue slabs (volume incentive)", example: "30% up to ₹1L, 40% above ₹1L" },
          ].map((r) => (
            <div key={r.basis} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <h3 className="font-medium text-violet-300 text-sm mb-2">{r.basis}</h3>
              <p className="text-xs text-gray-400 mb-3">{r.desc}</p>
              <p className="text-xs text-gray-500 italic">{r.example}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
