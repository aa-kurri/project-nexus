"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ArrowRightLeft, Package, CheckCircle2, Clock, Truck,
  XCircle, Search, ChevronLeft, ChevronRight, Plus, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TransferStatus = "Pending" | "Approved" | "Dispatched" | "Received" | "Rejected";

const TRANSFERS: {
  id: string; from: string; to: string; items: number;
  requestedBy: string; date: string; status: TransferStatus; note: string;
}[] = [
  { id: "IND-0041", from: "Central Pharmacy", to: "ICU Ward",         items: 5,  requestedBy: "Sr. Nurse Rekha",   date: "2026-04-16", status: "Pending",    note: "Urgent — dopamine low"         },
  { id: "IND-0040", from: "Central Pharmacy", to: "OT Store",          items: 3,  requestedBy: "OT Supervisor",      date: "2026-04-15", status: "Approved",   note: "Scheduled OT replenishment"    },
  { id: "IND-0039", from: "Store A",          to: "Central Pharmacy",  items: 8,  requestedBy: "Pharmacist Amith",   date: "2026-04-15", status: "Dispatched", note: "Weekly top-up"                 },
  { id: "IND-0038", from: "Central Pharmacy", to: "Ward 3B",           items: 2,  requestedBy: "Sr. Nurse Anjali",   date: "2026-04-14", status: "Received",   note: "IV fluids restock"             },
  { id: "IND-0037", from: "Store A",          to: "Emergency",         items: 6,  requestedBy: "Dr. Raju",           date: "2026-04-14", status: "Received",   note: "Emergency kit refill"          },
  { id: "IND-0036", from: "Central Pharmacy", to: "Cardiology Ward",   items: 4,  requestedBy: "Sr. Nurse Parveen",  date: "2026-04-13", status: "Dispatched", note: "Cardiac medications"           },
  { id: "IND-0035", from: "Central Pharmacy", to: "Pediatrics Ward",   items: 7,  requestedBy: "Sr. Nurse Kavitha",  date: "2026-04-13", status: "Approved",   note: "Paediatric IV antibiotics"     },
  { id: "IND-0034", from: "Store B",          to: "Central Pharmacy",  items: 12, requestedBy: "Pharmacist Renu",    date: "2026-04-12", status: "Received",   note: "Monthly indent from store"     },
  { id: "IND-0033", from: "Central Pharmacy", to: "Dialysis Unit",     items: 3,  requestedBy: "Dialysis Tech",      date: "2026-04-12", status: "Rejected",   note: "Out of approved formulary"     },
  { id: "IND-0032", from: "Central Pharmacy", to: "Ward 2A",           items: 5,  requestedBy: "Sr. Nurse Meena",    date: "2026-04-11", status: "Received",   note: "Routine morning indent"        },
  { id: "IND-0031", from: "Store A",          to: "Central Pharmacy",  items: 9,  requestedBy: "Pharmacist Amith",   date: "2026-04-10", status: "Received",   note: "Low-stock trigger replenishment"},
  { id: "IND-0030", from: "Central Pharmacy", to: "Labour Room",       items: 4,  requestedBy: "Sr. Nurse Sudha",    date: "2026-04-09", status: "Received",   note: "Oxytocin + sutures"            },
];

const STATUS_STYLE: Record<TransferStatus, string> = {
  Pending:    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Approved:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Dispatched: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Received:   "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20",
  Rejected:   "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_ICON: Record<TransferStatus, React.ReactNode> = {
  Pending:    <Clock className="h-3 w-3" />,
  Approved:   <CheckCircle2 className="h-3 w-3" />,
  Dispatched: <Truck className="h-3 w-3" />,
  Received:   <CheckCircle2 className="h-3 w-3" />,
  Rejected:   <XCircle className="h-3 w-3" />,
};

const WARDS = ["ICU Ward", "OT Store", "Ward 3B", "Emergency", "Cardiology Ward", "Pediatrics Ward", "Dialysis Unit", "Ward 2A", "Labour Room"];
const SOURCES = ["Central Pharmacy", "Store A", "Store B"];
const PAGE_SIZE = 8;

type FormState = { from: string; to: string; items: string; note: string };

export default function TransfersPage() {
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState<TransferStatus | "All">("All");
  const [page, setPage]             = useState(1);
  const [showModal, setShowModal]   = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [form, setForm]             = useState<FormState>({ from: "Central Pharmacy", to: "", items: "", note: "" });

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const filtered = TRANSFERS.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = t.id.toLowerCase().includes(q) || t.from.toLowerCase().includes(q) ||
      t.to.toLowerCase().includes(q) || t.requestedBy.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    pending:    TRANSFERS.filter((t) => t.status === "Pending").length,
    approved:   TRANSFERS.filter((t) => t.status === "Approved").length,
    dispatched: TRANSFERS.filter((t) => t.status === "Dispatched").length,
  };

  function handleSubmit() {
    if (!form.to || !form.items) return;
    setSubmitted(true);
  }

  function closeModal() {
    setShowModal(false);
    setSubmitted(false);
    setForm({ from: "Central Pharmacy", to: "", items: "", note: "" });
  }

  return (
    <>
      <TopBar title="Stock Transfers" />
      <main className="p-8 space-y-6">

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-4">
          <KpiCard label="Pending Approval" value={counts.pending}    color="yellow"  />
          <KpiCard label="Approved / Ready" value={counts.approved}   color="blue"    />
          <KpiCard label="In Transit"        value={counts.dispatched} color="purple"  />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-xl px-4 py-2.5 flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Indent no., ward, or requester…"
              className="bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-surface/40 p-1 rounded-xl border border-border/40">
              {(["All", "Pending", "Approved", "Dispatched", "Received", "Rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                    statusFilter === s ? "bg-[#0F766E] text-white" : "text-muted hover:text-fg hover:bg-white/5"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-bold transition-all"
            >
              <Plus className="h-4 w-4" /> New Indent
            </button>
          </div>
        </div>

        {/* Table */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/10 bg-black/10 pb-4">
            <CardTitle className="text-sm">
              {filtered.length} <span className="text-slate-600 font-normal">indent requests</span>
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Transfer Log
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-black/10">
                  {["Indent No.", "From → To", "Items", "Requested By", "Date", "Note", "Status"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paged.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 pl-6 font-mono text-xs text-[#0F766E] font-bold">{t.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400">{t.from}</span>
                        <ArrowRightLeft className="h-3 w-3 text-slate-600 shrink-0" />
                        <span className="text-slate-200 font-bold">{t.to}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-slate-600" />
                        <span className="font-mono font-bold text-slate-200">{t.items}</span>
                        <span className="text-slate-600 text-xs">SKUs</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{t.requestedBy}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{t.date}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[160px] truncate">{t.note}</td>
                    <td className="py-3.5 px-4">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", STATUS_STYLE[t.status])}>
                        {STATUS_ICON[t.status]}
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-600 text-xs italic">No transfers match the current filter</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {totalPages} · {filtered.length} records</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* New Indent Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[hsl(220_15%_9%)] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            {!submitted ? (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                  <h2 className="text-sm font-bold text-slate-200">New Indent Request</h2>
                  <button onClick={closeModal} className="text-slate-600 hover:text-slate-300 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Requesting From</label>
                    <select
                      value={form.from}
                      onChange={set("from")}
                      className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-[#0F766E]/50"
                    >
                      {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Delivering To <span className="text-red-400">*</span></label>
                    <select
                      value={form.to}
                      onChange={set("to")}
                      className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-[#0F766E]/50"
                    >
                      <option value="">— Select Ward / Unit —</option>
                      {WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">No. of SKUs <span className="text-red-400">*</span></label>
                    <input
                      type="number"
                      min={1}
                      value={form.items}
                      onChange={set("items")}
                      placeholder="e.g. 4"
                      className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-[#0F766E]/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Note / Reason</label>
                    <textarea
                      value={form.note}
                      onChange={set("note")}
                      rows={2}
                      placeholder="Add clinical note or urgency…"
                      className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-[#0F766E]/50 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!form.to || !form.items}
                    className="w-full py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-40 text-white text-sm font-bold transition-all"
                  >
                    Raise Indent
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-[#0F766E]/15 border border-[#0F766E]/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7 text-[#0F766E]" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-200">Indent Raised</p>
                  <p className="text-xs text-slate-500 mt-1">{form.from} → {form.to} · {form.items} SKU{Number(form.items) !== 1 ? "s" : ""}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Pending pharmacist approval</p>
                </div>
                <button onClick={closeModal} className="px-6 py-2 rounded-xl bg-[#0F766E]/20 hover:bg-[#0F766E]/30 text-[#0F766E] text-sm font-bold transition-all">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function KpiCard({ label, value, color }: { label: string; value: number; color: "yellow" | "blue" | "purple" }) {
  const styles = {
    yellow: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
    blue:   "border-blue-500/20 bg-blue-500/5 text-blue-400",
    purple: "border-purple-500/20 bg-purple-500/5 text-purple-400",
  };
  return (
    <div className={cn("rounded-xl border px-5 py-4 flex items-center justify-between", styles[color])}>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-3xl font-bold mt-0.5">{value}</p>
      </div>
      <ArrowRightLeft className="h-8 w-8 opacity-20" />
    </div>
  );
}
