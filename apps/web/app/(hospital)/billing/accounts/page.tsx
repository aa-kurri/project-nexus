"use client";

import { useState } from "react";
import { Download, RefreshCw, CheckCircle, AlertCircle, FileText, Building2, BarChart3 } from "lucide-react";

const EXPORT_FORMATS = [
  { id: "tally_xml", label: "Tally Prime XML", desc: "Voucher-based export for Tally ERP 9 / Prime", icon: "📊" },
  { id: "sap", label: "SAP Journal Entry", desc: "CSV-based import for SAP FI module", icon: "🏢" },
  { id: "csv", label: "Generic CSV Ledger", desc: "Universal spreadsheet export", icon: "📋" },
  { id: "json", label: "JSON API Payload", desc: "For custom accounting system integration", icon: "⚡" },
];

const EXPORT_HISTORY = [
  { id: "1", format: "tally_xml", period: "Mar 2026", records: 1284, status: "reconciled", exported: "2026-04-01T09:15:00Z", by: "Admin" },
  { id: "2", format: "tally_xml", period: "Feb 2026", records: 1102, status: "reconciled", exported: "2026-03-01T08:30:00Z", by: "Admin" },
  { id: "3", format: "csv", period: "Apr 1–15 2026", records: 643, status: "exported", exported: "2026-04-15T17:00:00Z", by: "Finance Mgr" },
];

const LEDGER_SUMMARY = [
  { category: "OPD Revenue", credit: 284000, debit: 0 },
  { category: "IPD Revenue", credit: 520000, debit: 0 },
  { category: "Lab Revenue", credit: 89500, debit: 0 },
  { category: "Pharmacy Revenue", credit: 156000, debit: 0 },
  { category: "Doctor Payouts", credit: 0, debit: 184200 },
  { category: "Sundry Creditors", credit: 0, debit: 43000 },
  { category: "TDS", credit: 0, debit: 18420 },
];

export default function AccountsPage() {
  const [selectedFormat, setSelectedFormat] = useState("tally_xml");
  const [period, setPeriod] = useState({ from: "2026-04-01", to: "2026-04-19" });
  const [generating, setGenerating] = useState(false);

  const totalCredit = LEDGER_SUMMARY.reduce((s, r) => s + r.credit, 0);
  const totalDebit = LEDGER_SUMMARY.reduce((s, r) => s + r.debit, 0);

  const handleExport = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Accounts & Financial Export</h1>
          <p className="text-sm text-gray-400 mt-0.5">Export to Tally, SAP, or custom ERP systems</p>
        </div>
      </div>

      {/* Config panel */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          {/* Period */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">Export Configuration</h2>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {["from", "to"].map((key) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Period {key === "from" ? "From" : "To"}</label>
                  <input
                    type="date"
                    value={period[key as "from" | "to"]}
                    onChange={(e) => setPeriod((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              ))}
            </div>

            {/* Format selection */}
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-3">Export Format</label>
            <div className="grid grid-cols-2 gap-3">
              {EXPORT_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`text-left p-4 rounded-xl border transition-colors ${selectedFormat === fmt.id ? "border-violet-500/60 bg-violet-500/10" : "border-white/10 bg-white/[0.03] hover:border-violet-500/30"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{fmt.icon}</span>
                    <p className="font-medium text-white text-sm">{fmt.label}</p>
                  </div>
                  <p className="text-xs text-gray-400">{fmt.desc}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleExport}
              disabled={generating}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {generating ? "Generating export…" : `Export to ${EXPORT_FORMATS.find(f => f.id === selectedFormat)?.label}`}
            </button>
          </div>

          {/* Export History */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="font-semibold text-white">Export History</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {["Period", "Format", "Records", "Exported By", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EXPORT_HISTORY.map((ex) => (
                  <tr key={ex.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-sm text-white">{ex.period}</td>
                    <td className="px-5 py-3 text-xs text-gray-400 font-mono">{ex.format}</td>
                    <td className="px-5 py-3 text-sm text-gray-300">{ex.records.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-gray-400">{ex.by}</td>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-1.5 text-xs w-fit border px-2 py-0.5 rounded-full ${ex.status === "reconciled" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-blue-500/15 text-blue-400 border-blue-500/30"}`}>
                        {ex.status === "reconciled" ? <CheckCircle className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        {ex.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ledger summary */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <h2 className="font-semibold text-white">Period Ledger Preview</h2>
          </div>
          <div className="space-y-2 mb-4">
            {LEDGER_SUMMARY.map((row) => (
              <div key={row.category} className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-gray-300">{row.category}</span>
                <div className="text-right">
                  {row.credit > 0 && <span className="text-xs font-mono text-emerald-400">₹{row.credit.toLocaleString("en-IN")}</span>}
                  {row.debit > 0 && <span className="text-xs font-mono text-red-400">₹{row.debit.toLocaleString("en-IN")}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Total Credits</span>
              <span className="text-xs font-bold font-mono text-emerald-400">₹{totalCredit.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Total Debits</span>
              <span className="text-xs font-bold font-mono text-red-400">₹{totalDebit.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2">
              <span className="text-sm font-semibold text-white">Net</span>
              <span className="text-sm font-bold font-mono text-violet-300">₹{(totalCredit - totalDebit).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
