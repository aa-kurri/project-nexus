"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ShieldCheck, Clock, CheckCircle2, AlertCircle, XCircle,
  HelpCircle, Search, ChevronLeft, ChevronRight, Plus, X,
  Building2, FileText, User, IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PAStatus = "Draft" | "Submitted" | "Approved" | "Query" | "Rejected";

interface PreAuth {
  id: string; patient: string; uhid: string; ward: string;
  tpa: string; policyNo: string; diagnosis: string; icd10: string;
  procedure: string; estimatedCost: number; approvedAmt: number | null;
  submittedOn: string; status: PAStatus; queryNote: string;
}

const PREAUTHS: PreAuth[] = [
  { id: "PA-0041", patient: "Ramesh Kumar",       uhid: "AY-00005", ward: "Ward 3B",    tpa: "Star Health",        policyNo: "STR-882341",   diagnosis: "Acute Appendicitis",    icd10: "K35.8",  procedure: "Laparoscopic Appendectomy", estimatedCost: 45000,  approvedAmt: 42000, submittedOn: "2026-04-15", status: "Approved",   queryNote: "" },
  { id: "PA-0040", patient: "Sunita Sharma",       uhid: "AY-00006", ward: "ICU",        tpa: "New India Assurance", policyNo: "NIA-554321",   diagnosis: "STEMI Post-PCI",         icd10: "I21.0",  procedure: "Primary PCI + ICU Care",    estimatedCost: 180000, approvedAmt: null,  submittedOn: "2026-04-15", status: "Query",      queryNote: "Request cath lab report and LVEF value" },
  { id: "PA-0039", patient: "Mohammed Farhan",     uhid: "AY-00010", ward: "Ward 4C",    tpa: "Medi-Classic",       policyNo: "MDC-112234",   diagnosis: "CKD Stage 3",            icd10: "N18.3",  procedure: "Haemodialysis x4 sessions", estimatedCost: 32000,  approvedAmt: null,  submittedOn: "2026-04-14", status: "Submitted",  queryNote: "" },
  { id: "PA-0038", patient: "George Mathew",       uhid: "AY-00007", ward: "OT",         tpa: "United India",       policyNo: "UIL-667788",   diagnosis: "Knee Osteoarthritis",    icd10: "M17.1",  procedure: "Total Knee Replacement",    estimatedCost: 120000, approvedAmt: 115000,submittedOn: "2026-04-12", status: "Approved",   queryNote: "" },
  { id: "PA-0037", patient: "Sarah Malik",         uhid: "AY-00002", ward: "Ward 2A",    tpa: "HDFC ERGO",          policyNo: "HE-990022",    diagnosis: "Type 2 Diabetes",        icd10: "E11.9",  procedure: "Insulin stabilization",     estimatedCost: 18000,  approvedAmt: null,  submittedOn: "2026-04-13", status: "Rejected",   queryNote: "Condition is OPD-manageable; IPD not justified" },
  { id: "PA-0036", patient: "Kavitha Iyer",        uhid: "AY-00011", ward: "Ward 3B",    tpa: "PM-JAY",             policyNo: "PMJAY-456789", diagnosis: "Hypothyroidism w/ Comp.", icd10: "E03.9",  procedure: "Medical management",        estimatedCost: 12000,  approvedAmt: 12000, submittedOn: "2026-04-11", status: "Approved",   queryNote: "" },
  { id: "PA-0035", patient: "Arun Krishnamurthy",  uhid: "AY-00008", ward: "Ward 4C",    tpa: "Star Health",        policyNo: "STR-220088",   diagnosis: "Lumbar Spondylosis",     icd10: "M47.816",procedure: "Epidural steroid injection",estimatedCost: 22000,  approvedAmt: null,  submittedOn: "2026-04-16", status: "Draft",      queryNote: "" },
  { id: "PA-0034", patient: "Deepa Reddy",         uhid: "AY-00009", ward: "Ward 2A",    tpa: "Bajaj Allianz",      policyNo: "BA-334455",    diagnosis: "PCOS with DUB",          icd10: "N93.8",  procedure: "Diagnostic Laparoscopy",    estimatedCost: 38000,  approvedAmt: null,  submittedOn: "2026-04-10", status: "Submitted",  queryNote: "" },
];

const ICD10_CODES = [
  { code: "K35.8", label: "Acute Appendicitis" },
  { code: "I21.0", label: "STEMI — Anterior" },
  { code: "N18.3", label: "CKD Stage 3" },
  { code: "M17.1", label: "Primary Osteoarthritis, Knee" },
  { code: "E11.9", label: "Type 2 Diabetes Mellitus" },
  { code: "E03.9", label: "Hypothyroidism, Unspecified" },
  { code: "M47.816", label: "Spondylosis, Lumbar" },
  { code: "N93.8", label: "Abnormal Uterine Bleeding" },
  { code: "J44.1", label: "COPD with Exacerbation" },
  { code: "I10",   label: "Essential Hypertension" },
];

const TPAS = ["PM-JAY", "Star Health", "New India Assurance", "Medi-Classic", "United India", "HDFC ERGO", "Bajaj Allianz", "ICICI Lombard", "Oriental Insurance", "Corporate — Self Pay"];

const STATUS_STYLE: Record<PAStatus, string> = {
  Draft:     "bg-slate-500/10 text-slate-400 border-slate-500/20",
  Submitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Approved:  "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20",
  Query:     "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Rejected:  "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_ICON: Record<PAStatus, React.ReactNode> = {
  Draft:     <FileText className="h-3 w-3" />,
  Submitted: <Clock className="h-3 w-3" />,
  Approved:  <CheckCircle2 className="h-3 w-3" />,
  Query:     <HelpCircle className="h-3 w-3" />,
  Rejected:  <XCircle className="h-3 w-3" />,
};

const PAGE_SIZE = 6;

type FormState = {
  patient: string; uhid: string; ward: string; tpa: string; policyNo: string;
  diagnosis: string; icd10: string; procedure: string; estimatedCost: string;
};

const EMPTY_FORM: FormState = {
  patient: "", uhid: "", ward: "", tpa: "PM-JAY", policyNo: "",
  diagnosis: "", icd10: "", procedure: "", estimatedCost: "",
};

export default function PreAuthPage() {
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<PAStatus | "All">("All");
  const [page, setPage]                 = useState(1);
  const [showModal, setShowModal]       = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [form, setForm]                 = useState<FormState>(EMPTY_FORM);
  const [expanded, setExpanded]         = useState<string | null>(null);

  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const filtered = PREAUTHS.filter((pa) => {
    const q = search.toLowerCase();
    const matchSearch =
      pa.id.toLowerCase().includes(q) || pa.patient.toLowerCase().includes(q) ||
      pa.uhid.toLowerCase().includes(q) || pa.tpa.toLowerCase().includes(q) ||
      pa.icd10.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || pa.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    draft:     PREAUTHS.filter((p) => p.status === "Draft").length,
    submitted: PREAUTHS.filter((p) => p.status === "Submitted").length,
    approved:  PREAUTHS.filter((p) => p.status === "Approved").length,
    query:     PREAUTHS.filter((p) => p.status === "Query").length,
    rejected:  PREAUTHS.filter((p) => p.status === "Rejected").length,
  };

  const totalApproved = PREAUTHS
    .filter((p) => p.status === "Approved" && p.approvedAmt)
    .reduce((s, p) => s + (p.approvedAmt ?? 0), 0);

  function handleSubmit() {
    if (!form.patient || !form.icd10 || !form.tpa || !form.estimatedCost) return;
    setSubmitted(true);
  }

  function closeModal() {
    setShowModal(false);
    setSubmitted(false);
    setForm(EMPTY_FORM);
  }

  return (
    <>
      <TopBar title="Insurance Pre-Auth" action={{ label: "New Pre-Auth", href: "#" }} />
      <main className="p-8 space-y-6">

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiCard label="Draft"     value={counts.draft}     color="slate"  onClick={() => setStatusFilter("Draft")} />
          <KpiCard label="Submitted" value={counts.submitted} color="blue"   onClick={() => setStatusFilter("Submitted")} />
          <KpiCard label="Query"     value={counts.query}     color="yellow" onClick={() => setStatusFilter("Query")} />
          <KpiCard label="Approved"  value={counts.approved}  color="teal"   onClick={() => setStatusFilter("Approved")} />
          <KpiCard label="Rejected"  value={counts.rejected}  color="red"    onClick={() => setStatusFilter("Rejected")} />
        </div>

        {/* Approved value banner */}
        <div className="flex items-center gap-4 bg-[#0F766E]/5 border border-[#0F766E]/20 rounded-xl px-5 py-3">
          <ShieldCheck className="h-5 w-5 text-[#0F766E] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400">Total approved amount this month</p>
            <p className="text-xl font-bold text-[#0F766E] font-mono">₹{totalApproved.toLocaleString("en-IN")}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-600 uppercase tracking-wider">Pending review</p>
            <p className="text-sm font-bold text-yellow-400">{counts.query} queries outstanding</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-xl px-4 py-2.5 flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="PA number, patient, TPA or ICD-10…"
              className="bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-surface/40 p-1 rounded-xl border border-border/40">
              {(["All", "Draft", "Submitted", "Query", "Approved", "Rejected"] as const).map((s) => (
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
              <Plus className="h-4 w-4" /> New PA
            </button>
          </div>
        </div>

        {/* Pre-auth cards */}
        <div className="space-y-3">
          {paged.map((pa) => {
            const isExpanded = expanded === pa.id;
            return (
              <Card key={pa.id} className={cn(
                "border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden transition-all",
                pa.status === "Query" && "ring-1 ring-yellow-500/30",
                pa.status === "Rejected" && "opacity-60"
              )}>
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
                  onClick={() => setExpanded(isExpanded ? null : pa.id)}
                >
                  {/* Status icon */}
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border shrink-0", STATUS_STYLE[pa.status])}>
                    {STATUS_ICON[pa.status]}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-1 md:gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{pa.patient}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{pa.uhid} · {pa.ward}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 truncate">{pa.diagnosis}</p>
                      <p className="text-[10px] font-mono text-slate-600">{pa.icd10}</p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-600 shrink-0" />
                        <p className="text-xs text-slate-400 truncate">{pa.tpa}</p>
                      </div>
                      <p className="text-[10px] font-mono text-slate-600">{pa.policyNo}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-bold text-slate-200">₹{pa.estimatedCost.toLocaleString("en-IN")}</p>
                      {pa.approvedAmt && (
                        <p className="text-[10px] text-[#0F766E] font-mono">✓ ₹{pa.approvedAmt.toLocaleString("en-IN")} approved</p>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border", STATUS_STYLE[pa.status])}>
                      {STATUS_ICON[pa.status]}
                      {pa.status}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">{pa.id}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <CardContent className="border-t border-white/5 pt-4 pb-5 px-5 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DetailRow label="Procedure"      value={pa.procedure} />
                      <DetailRow label="Submitted On"   value={pa.submittedOn} mono />
                      <DetailRow label="Est. Cost"      value={`₹${pa.estimatedCost.toLocaleString("en-IN")}`} mono />
                      <DetailRow label="Approved Amt"   value={pa.approvedAmt ? `₹${pa.approvedAmt.toLocaleString("en-IN")}` : "—"} mono />
                    </div>

                    {pa.status === "Query" && pa.queryNote && (
                      <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                        <HelpCircle className="h-3.5 w-3.5 text-yellow-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-yellow-400 font-bold mb-1">TPA Query</p>
                          <p className="text-xs text-slate-300">{pa.queryNote}</p>
                        </div>
                      </div>
                    )}

                    {pa.status === "Rejected" && pa.queryNote && (
                      <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                        <XCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-red-400 font-bold mb-1">Rejection Reason</p>
                          <p className="text-xs text-slate-300">{pa.queryNote}</p>
                        </div>
                      </div>
                    )}

                    {(pa.status === "Draft" || pa.status === "Query") && (
                      <div className="flex gap-2">
                        <button className="px-4 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold transition-all">
                          {pa.status === "Draft" ? "Submit to TPA" : "Respond to Query"}
                        </button>
                        <button className="px-4 py-1.5 rounded-lg border border-white/8 hover:bg-white/5 text-slate-400 text-xs font-bold transition-all">
                          Upload Documents
                        </button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {paged.length === 0 && (
            <div className="text-center py-16 text-slate-600">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No pre-auth requests match the current filter</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {totalPages} · {filtered.length} records</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-30 transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-30 transition-all">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* New Pre-Auth Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[hsl(220_15%_9%)] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            {!submitted ? (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 sticky top-0 bg-[hsl(220_15%_9%)] z-10">
                  <h2 className="text-sm font-bold text-slate-200">New Pre-Authorization Request</h2>
                  <button onClick={closeModal} className="text-slate-600 hover:text-slate-300 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {/* Patient */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Patient Name *" placeholder="Full name">
                      <input value={form.patient} onChange={set("patient")} placeholder="Full name"
                        className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-[#0F766E]/50" />
                    </FormField>
                    <FormField label="UHID">
                      <input value={form.uhid} onChange={set("uhid")} placeholder="AY-XXXXX"
                        className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono outline-none focus:border-[#0F766E]/50" />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Ward / Unit">
                      <input value={form.ward} onChange={set("ward")} placeholder="e.g. Ward 3B"
                        className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-[#0F766E]/50" />
                    </FormField>
                    <FormField label="TPA / Insurer *">
                      <select value={form.tpa} onChange={set("tpa")}
                        className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-[#0F766E]/50">
                        {TPAS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </FormField>
                  </div>

                  <FormField label="Policy / Aadhaar / PMJAY ID">
                    <input value={form.policyNo} onChange={set("policyNo")} placeholder="e.g. PMJAY-456789"
                      className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono outline-none focus:border-[#0F766E]/50" />
                  </FormField>

                  <FormField label="Diagnosis *">
                    <input value={form.diagnosis} onChange={set("diagnosis")} placeholder="Primary diagnosis"
                      className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-[#0F766E]/50" />
                  </FormField>

                  <FormField label="ICD-10 Code *">
                    <select value={form.icd10} onChange={set("icd10")}
                      className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-[#0F766E]/50">
                      <option value="">— Select ICD-10 —</option>
                      {ICD10_CODES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.label}</option>)}
                    </select>
                  </FormField>

                  <FormField label="Planned Procedure">
                    <input value={form.procedure} onChange={set("procedure")} placeholder="e.g. Laparoscopic Cholecystectomy"
                      className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-[#0F766E]/50" />
                  </FormField>

                  <FormField label="Estimated Cost (₹) *">
                    <input type="number" value={form.estimatedCost} onChange={set("estimatedCost")} placeholder="e.g. 45000"
                      className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono outline-none focus:border-[#0F766E]/50" />
                  </FormField>

                  <button
                    onClick={handleSubmit}
                    disabled={!form.patient || !form.icd10 || !form.tpa || !form.estimatedCost}
                    className="w-full py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-40 text-white text-sm font-bold transition-all"
                  >
                    Submit Pre-Authorization
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-[#0F766E]/15 border border-[#0F766E]/30 flex items-center justify-center mx-auto">
                  <ShieldCheck className="h-7 w-7 text-[#0F766E]" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-200">Pre-Auth Submitted</p>
                  <p className="text-xs text-slate-500 mt-1">{form.patient} · {form.tpa}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Estimated: ₹{Number(form.estimatedCost).toLocaleString("en-IN")} · ICD {form.icd10}</p>
                  <p className="text-[10px] text-slate-700 mt-2">Expected TPA response within 4–6 hours</p>
                </div>
                <button onClick={closeModal}
                  className="px-6 py-2 rounded-xl bg-[#0F766E]/20 hover:bg-[#0F766E]/30 text-[#0F766E] text-sm font-bold transition-all">
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

function KpiCard({ label, value, color, onClick }: {
  label: string; value: number; color: "slate" | "blue" | "yellow" | "teal" | "red"; onClick: () => void;
}) {
  const styles = {
    slate:  "border-white/8 bg-white/[0.02] text-slate-400",
    blue:   "border-blue-500/20 bg-blue-500/5 text-blue-400",
    yellow: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
    teal:   "border-[#0F766E]/20 bg-[#0F766E]/5 text-[#0F766E]",
    red:    "border-red-500/20 bg-red-500/5 text-red-400",
  };
  return (
    <button onClick={onClick} className={cn("rounded-xl border p-4 text-left transition-all hover:brightness-110 hover:scale-[1.01] w-full", styles[color])}>
      <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </button>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</label>
      {children}
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">{label}</p>
      <p className={cn("text-xs text-slate-300 mt-0.5", mono && "font-mono")}>{value}</p>
    </div>
  );
}
