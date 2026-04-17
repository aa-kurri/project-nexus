"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Search, User, CreditCard, Smartphone, Wallet, Building2,
  CheckCircle2, Clock, Receipt, IndianRupee,
  FileText, Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PayMode = "Cash" | "Card" | "UPI" | "Insurance" | "NEFT";

const MOCK_PATIENTS = [
  { id: "AY-00001", name: "Anish Kurri",       phone: "+91 99000 88776", pending: 1200,  bill: "BL-1501" },
  { id: "AY-00002", name: "Sarah Malik",        phone: "+91 88776 66554", pending: 4750,  bill: "BL-1502" },
  { id: "AY-00004", name: "Priya Nair",         phone: "+91 94400 11223", pending: 850,   bill: "BL-1503" },
  { id: "AY-00005", name: "Ramesh Kumar",       phone: "+91 98400 22334", pending: 12400, bill: "BL-1504" },
  { id: "AY-00006", name: "Sunita Sharma",      phone: "+91 87654 32100", pending: 28600, bill: "BL-1505" },
  { id: "AY-00008", name: "Arun Krishnamurthy", phone: "+91 99887 76655", pending: 650,   bill: "BL-1506" },
  { id: "AY-00010", name: "Mohammed Farhan",    phone: "+91 98765 00987", pending: 9200,  bill: "BL-1507" },
];

type RecentPayment = {
  bill: string; patient: string; amount: number; mode: PayMode; time: string; receipt: string;
};

const RECENT_PAYMENTS: RecentPayment[] = [
  { bill: "BL-1500", patient: "K Sai Shanker",       amount: 1800,  mode: "UPI",       time: "11:42 AM", receipt: "RCP-7841" },
  { bill: "BL-1498", patient: "T Pavani",             amount: 650,   mode: "Cash",      time: "11:18 AM", receipt: "RCP-7840" },
  { bill: "BL-1496", patient: "Vikram Seth",          amount: 4200,  mode: "Card",      time: "10:55 AM", receipt: "RCP-7839" },
  { bill: "BL-1494", patient: "S Alivelu",            amount: 900,   mode: "Cash",      time: "10:30 AM", receipt: "RCP-7838" },
  { bill: "BL-1492", patient: "George Mathew",        amount: 38500, mode: "Insurance", time: "09:48 AM", receipt: "RCP-7837" },
  { bill: "BL-1490", patient: "Kavitha Iyer",         amount: 1200,  mode: "UPI",       time: "09:21 AM", receipt: "RCP-7836" },
  { bill: "BL-1488", patient: "Deepa Reddy",          amount: 750,   mode: "Cash",      time: "09:05 AM", receipt: "RCP-7835" },
];

const MODE_ICON: Record<PayMode, React.ReactNode> = {
  Cash:      <Wallet className="h-4 w-4" />,
  Card:      <CreditCard className="h-4 w-4" />,
  UPI:       <Smartphone className="h-4 w-4" />,
  Insurance: <Building2 className="h-4 w-4" />,
  NEFT:      <IndianRupee className="h-4 w-4" />,
};

const MODE_STYLE: Record<PayMode, string> = {
  Cash:      "border-[#0F766E]/30 bg-[#0F766E]/10 text-[#0F766E]",
  Card:      "border-blue-500/30 bg-blue-500/10 text-blue-400",
  UPI:       "border-purple-500/30 bg-purple-500/10 text-purple-400",
  Insurance: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  NEFT:      "border-slate-500/30 bg-white/5 text-slate-400",
};

const PAY_MODES: PayMode[] = ["Cash", "Card", "UPI", "Insurance", "NEFT"];

export default function PaymentsPage() {
  const [patientSearch, setPatientSearch] = useState("");
  const [showDropdown, setShowDropdown]   = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<typeof MOCK_PATIENTS[0] | null>(null);
  const [payMode, setPayMode]             = useState<PayMode>("Cash");
  const [amount, setAmount]               = useState("");
  const [ref, setRef]                     = useState("");
  const [concession, setConcession]       = useState("0");
  const [processed, setProcessed]         = useState(false);
  const [receiptNo, setReceiptNo]         = useState("");

  const suggestions = MOCK_PATIENTS.filter(
    (p) =>
      patientSearch.length > 1 &&
      (p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.phone.includes(patientSearch))
  );

  function selectPatient(p: typeof MOCK_PATIENTS[0]) {
    setSelectedPatient(p);
    setPatientSearch(p.name);
    setAmount(p.pending.toString());
    setShowDropdown(false);
  }

  const netPayable = Math.max(0, (Number(amount) || 0) - (Number(concession) || 0));

  const todayTotal = RECENT_PAYMENTS.reduce((s, p) => s + p.amount, 0);
  const pendingTotal = MOCK_PATIENTS.reduce((s, p) => s + p.pending, 0);

  function handleProcess() {
    if (!selectedPatient || !amount) return;
    const rno = `RCP-${Math.floor(7842 + Math.random() * 100)}`;
    setReceiptNo(rno);
    setProcessed(true);
  }

  function resetForm() {
    setSelectedPatient(null);
    setPatientSearch("");
    setAmount("");
    setRef("");
    setConcession("0");
    setProcessed(false);
    setReceiptNo("");
  }

  return (
    <>
      <TopBar title="Collect Payment" action={{ label: "View Reports", href: "/billing/claims" }} />
      <main className="p-8 space-y-6">

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Collected Today</p>
              <p className="text-2xl font-bold mt-0.5 text-[#0F766E]">₹{todayTotal.toLocaleString("en-IN")}</p>
            </div>
            <Receipt className="h-8 w-8 text-[#0F766E]/20" />
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Outstanding Dues</p>
              <p className="text-2xl font-bold mt-0.5 text-orange-400">₹{pendingTotal.toLocaleString("en-IN")}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500/20" />
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Txns Today</p>
              <p className="text-2xl font-bold mt-0.5">{RECENT_PAYMENTS.length}</p>
            </div>
            <CreditCard className="h-8 w-8 text-slate-700" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: Payment form */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden">
              <CardHeader className="border-b border-border/10 bg-black/10 pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-[#0F766E]" />
                  Collect Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">

                {processed ? (
                  /* Success state */
                  <div className="text-center py-8 space-y-4">
                    <div className="h-14 w-14 rounded-full bg-[#0F766E]/15 border border-[#0F766E]/30 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-7 w-7 text-[#0F766E]" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-200">Payment Received</p>
                      <p className="text-xs text-slate-500 mt-1">{selectedPatient?.name} · {selectedPatient?.bill}</p>
                    </div>
                    <div className="bg-black/30 border border-white/8 rounded-xl p-4 text-left space-y-2 max-w-xs mx-auto">
                      <Row label="Receipt No."  value={receiptNo}                             mono />
                      <Row label="Amount"        value={`₹${netPayable.toLocaleString("en-IN")}`} bold />
                      <Row label="Mode"          value={payMode}                              />
                      {ref && <Row label="Ref / UTR" value={ref} mono />}
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button onClick={resetForm}
                        className="px-5 py-2 rounded-xl bg-[#0F766E]/20 hover:bg-[#0F766E]/30 text-[#0F766E] text-sm font-bold transition-all"
                      >
                        New Payment
                      </button>
                      <button className="flex items-center gap-1.5 px-5 py-2 rounded-xl border border-white/8 hover:bg-white/5 text-slate-400 text-sm font-bold transition-all">
                        <Printer className="h-3.5 w-3.5" /> Print Receipt
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Patient search */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        Patient / UHID <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="flex items-center gap-2 bg-black/30 border border-white/8 rounded-lg px-3 py-2.5 focus-within:border-[#0F766E]/50 transition-colors">
                          <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <input
                            value={patientSearch}
                            onChange={(e) => {
                              setPatientSearch(e.target.value);
                              setShowDropdown(true);
                              if (!e.target.value) { setSelectedPatient(null); setAmount(""); }
                            }}
                            onFocus={() => patientSearch.length > 1 && setShowDropdown(true)}
                            placeholder="Name, UHID or phone…"
                            className="bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none flex-1"
                          />
                          {selectedPatient && <CheckCircle2 className="h-3.5 w-3.5 text-[#0F766E] shrink-0" />}
                        </div>
                        {showDropdown && suggestions.length > 0 && (
                          <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-[hsl(220_15%_9%)] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                            {suggestions.map((p) => (
                              <button
                                key={p.id}
                                onMouseDown={() => selectPatient(p)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                              >
                                <div className="h-8 w-8 rounded-full bg-[#0F766E]/10 flex items-center justify-center border border-[#0F766E]/20 shrink-0">
                                  <User className="h-4 w-4 text-[#0F766E]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-200">{p.name}</p>
                                  <p className="text-xs text-slate-500">{p.id} · {p.phone}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-bold text-orange-400">₹{p.pending.toLocaleString("en-IN")}</p>
                                  <p className="text-[10px] text-slate-600">pending</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedPatient && (
                        <div className="flex items-center gap-3 bg-[#0F766E]/5 border border-[#0F766E]/20 rounded-lg px-3 py-2">
                          <FileText className="h-3.5 w-3.5 text-[#0F766E] shrink-0" />
                          <span className="text-xs text-slate-400">Bill Ref: <span className="font-mono text-[#0F766E] font-bold">{selectedPatient.bill}</span></span>
                          <span className="ml-auto text-xs font-bold text-orange-400">₹{selectedPatient.pending.toLocaleString("en-IN")} due</span>
                        </div>
                      )}
                    </div>

                    {/* Payment mode */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Payment Mode</label>
                      <div className="grid grid-cols-5 gap-2">
                        {PAY_MODES.map((m) => (
                          <button
                            key={m}
                            onClick={() => setPayMode(m)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-bold transition-all",
                              payMode === m ? MODE_STYLE[m] : "border-white/8 bg-white/[0.02] text-slate-600 hover:text-slate-400 hover:bg-white/5"
                            )}
                          >
                            {MODE_ICON[m]}
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amount row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          Amount (₹) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2.5 text-sm text-slate-200 font-mono font-bold outline-none focus:border-[#0F766E]/50 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Concession (₹)</label>
                        <input
                          type="number"
                          min={0}
                          value={concession}
                          onChange={(e) => setConcession(e.target.value)}
                          className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2.5 text-sm text-slate-200 font-mono outline-none focus:border-[#0F766E]/50 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-[#0F766E] font-bold">Net Payable</label>
                        <div className="w-full border border-[#0F766E]/30 bg-[#0F766E]/5 rounded-lg px-3 py-2.5 text-sm font-mono font-bold text-[#0F766E]">
                          ₹{netPayable.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>

                    {/* Reference / UTR for non-cash */}
                    {(payMode === "UPI" || payMode === "Card" || payMode === "NEFT") && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          {payMode === "UPI" ? "UPI Ref / UTR" : payMode === "Card" ? "Card Last 4 / Approval Code" : "NEFT UTR Number"}
                        </label>
                        <input
                          value={ref}
                          onChange={(e) => setRef(e.target.value)}
                          placeholder={payMode === "Card" ? "e.g. 4242 / TXN8834" : "e.g. HDFC0020241600001"}
                          className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2.5 text-sm text-slate-300 font-mono outline-none focus:border-[#0F766E]/50 transition-colors"
                        />
                      </div>
                    )}

                    {payMode === "Insurance" && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">TPA / Policy No.</label>
                        <input
                          value={ref}
                          onChange={(e) => setRef(e.target.value)}
                          placeholder="e.g. Star Health / POL-987654"
                          className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2.5 text-sm text-slate-300 font-mono outline-none focus:border-[#0F766E]/50 transition-colors"
                        />
                      </div>
                    )}

                    <button
                      onClick={handleProcess}
                      disabled={!selectedPatient || !amount}
                      className="w-full py-3 rounded-xl bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-40 text-white text-sm font-bold transition-all"
                    >
                      Process Payment — ₹{netPayable.toLocaleString("en-IN")}
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Recent payments */}
          <div className="lg:col-span-2">
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl h-full">
              <CardHeader className="border-b border-border/10 bg-black/10 pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-600" />
                  Today's Receipts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {RECENT_PAYMENTS.map((p) => (
                    <div key={p.receipt} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border shrink-0", MODE_STYLE[p.mode])}>
                        {MODE_ICON[p.mode]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{p.patient}</p>
                        <p className="text-[10px] text-slate-600 font-mono">{p.receipt} · {p.time}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-[#0F766E] font-mono">₹{p.amount.toLocaleString("en-IN")}</p>
                        <p className="text-[10px] text-slate-600">{p.mode}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">Total</span>
                  <span className="text-sm font-bold text-[#0F766E] font-mono">₹{todayTotal.toLocaleString("en-IN")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </>
  );
}

function Row({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</span>
      <span className={cn("text-xs text-slate-300", mono && "font-mono", bold && "font-bold text-[#0F766E]")}>{value}</span>
    </div>
  );
}
