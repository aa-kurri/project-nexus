"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Search, Download, FileSpreadsheet, Printer,
  ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PayStatus = "Paid" | "Pending" | "Failed" | "Waived";

const BILLS: {
  billNo: number; billDate: string; billTime: string; amount: number;
  mrNo: string; opdNo: string; patientName: string; method: string; status: PayStatus;
}[] = [
  { billNo: 1468, billDate: "2026-04-16", billTime: "09:18 AM", amount: 0,    mrNo: "4330/25-26", opdNo: "000911/26-27", patientName: "M Mangamma",          method: "Cash",       status: "Waived"  },
  { billNo: 1469, billDate: "2026-04-16", billTime: "09:22 AM", amount: 0,    mrNo: "160/26-27",  opdNo: "000912/26-27", patientName: "T Pavani",              method: "Cash",       status: "Waived"  },
  { billNo: 1470, billDate: "2026-04-16", billTime: "09:59 AM", amount: 250,  mrNo: "3164/25-26", opdNo: "000913/26-27", patientName: "S Alivelu",             method: "Cash",       status: "Paid"    },
  { billNo: 1471, billDate: "2026-04-16", billTime: "10:02 AM", amount: 0,    mrNo: "3017/25-26", opdNo: "000914/26-27", patientName: "K Sai Shanker",         method: "Cash",       status: "Waived"  },
  { billNo: 1472, billDate: "2026-04-16", billTime: "10:06 AM", amount: 250,  mrNo: "405/26-27",  opdNo: "000915/26-27", patientName: "K Deepthi",             method: "Card",       status: "Paid"    },
  { billNo: 1474, billDate: "2026-04-16", billTime: "10:17 AM", amount: 0,    mrNo: "41/26-27",   opdNo: "000916/26-27", patientName: "V Krupamma",            method: "Cash",       status: "Waived"  },
  { billNo: 1476, billDate: "2026-04-16", billTime: "10:25 AM", amount: 250,  mrNo: "406/26-27",  opdNo: "000918/26-27", patientName: "J Venkateswara Reddy",  method: "UPI",        status: "Paid"    },
  { billNo: 1477, billDate: "2026-04-16", billTime: "10:28 AM", amount: 200,  mrNo: "10308/25-26",opdNo: "000919/26-27", patientName: "S Lakshmi",             method: "Cash",       status: "Paid"    },
  { billNo: 1478, billDate: "2026-04-16", billTime: "10:38 AM", amount: 250,  mrNo: "407/26-27",  opdNo: "000920/26-27", patientName: "M Ananthamma",          method: "Cash",       status: "Paid"    },
  { billNo: 1479, billDate: "2026-04-16", billTime: "10:45 AM", amount: 0,    mrNo: "10315/25-26",opdNo: "000921/26-27", patientName: "SK Nusratjahan",        method: "Cash",       status: "Waived"  },
  { billNo: 1480, billDate: "2026-04-16", billTime: "10:48 AM", amount: 250,  mrNo: "408/26-27",  opdNo: "000922/26-27", patientName: "SK Jamal Moulali",      method: "UPI",        status: "Paid"    },
  { billNo: 1481, billDate: "2026-04-16", billTime: "10:51 AM", amount: 200,  mrNo: "5655/25-26", opdNo: "000923/26-27", patientName: "K Krishna Reddy",       method: "Card",       status: "Paid"    },
  { billNo: 1482, billDate: "2026-04-16", billTime: "10:54 AM", amount: 250,  mrNo: "2232/25-26", opdNo: "000924/26-27", patientName: "P Venkata Rathnam",     method: "Cash",       status: "Paid"    },
  { billNo: 1483, billDate: "2026-04-16", billTime: "11:00 AM", amount: 200,  mrNo: "10325/25-26",opdNo: "000925/26-27", patientName: "J Durga Rao",           method: "Cash",       status: "Paid"    },
  { billNo: 1485, billDate: "2026-04-16", billTime: "11:09 AM", amount: 0,    mrNo: "54/26-27",   opdNo: "000926/26-27", patientName: "M Venkateswarlu",       method: "Cash",       status: "Waived"  },
  { billNo: 1486, billDate: "2026-04-16", billTime: "11:14 AM", amount: 0,    mrNo: "393/26-27",  opdNo: "000927/26-27", patientName: "G Ramanamma",           method: "Cash",       status: "Waived"  },
  { billNo: 1488, billDate: "2026-04-16", billTime: "11:19 AM", amount: 250,  mrNo: "74/26-27",   opdNo: "000928/26-27", patientName: "B Eshwari Bai",         method: "UPI",        status: "Paid"    },
  { billNo: 1489, billDate: "2026-04-16", billTime: "11:24 AM", amount: 400,  mrNo: "401/26-27",  opdNo: "000929/26-27", patientName: "Subbamma P",            method: "Card",       status: "Paid"    },
  { billNo: 1491, billDate: "2026-04-15", billTime: "04:12 PM", amount: 500,  mrNo: "312/26-27",  opdNo: "000901/26-27", patientName: "Arjun Mehra",           method: "UPI",        status: "Paid"    },
  { billNo: 1492, billDate: "2026-04-15", billTime: "05:30 PM", amount: 250,  mrNo: "289/26-27",  opdNo: "000902/26-27", patientName: "Sunita Verma",          method: "Cash",       status: "Pending" },
  { billNo: 1493, billDate: "2026-04-15", billTime: "06:00 PM", amount: 300,  mrNo: "10681/25-26",opdNo: "000903/26-27", patientName: "SK Asha",               method: "Cash",       status: "Paid"    },
  { billNo: 1494, billDate: "2026-04-14", billTime: "10:15 AM", amount: 150,  mrNo: "77/26-27",   opdNo: "000881/26-27", patientName: "Ramadevi Kotari",       method: "Cash",       status: "Failed"  },
];

const STATUS_STYLE: Record<PayStatus, string> = {
  Paid:    "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20",
  Pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Failed:  "bg-red-500/10 text-red-400 border-red-500/20",
  Waived:  "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

const STATUS_ICON: Record<PayStatus, React.ReactNode> = {
  Paid:    <CheckCircle2 className="h-3 w-3" />,
  Pending: <Clock className="h-3 w-3" />,
  Failed:  <AlertCircle className="h-3 w-3" />,
  Waived:  <XCircle className="h-3 w-3" />,
};

const PAGE_SIZE = 10;

export default function BillingClaimsPage() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("2026-04-14");
  const [dateTo, setDateTo] = useState("2026-04-16");
  const [statusFilter, setStatusFilter] = useState<PayStatus | "All">("All");
  const [page, setPage] = useState(1);

  const filtered = BILLS.filter((b) => {
    const matchSearch =
      b.patientName.toLowerCase().includes(search.toLowerCase()) ||
      b.mrNo.includes(search) ||
      String(b.billNo).includes(search);
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    const matchDate = b.billDate >= dateFrom && b.billDate <= dateTo;
    return matchSearch && matchStatus && matchDate;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalCollected = filtered.filter(b => b.status === "Paid").reduce((s, b) => s + b.amount, 0);
  const totalPending   = filtered.filter(b => b.status === "Pending").reduce((s, b) => s + b.amount, 0);
  const totalWaived    = filtered.filter(b => b.status === "Waived").length;

  return (
    <>
      <TopBar title="OP Billing Report" action={{ label: "Collect Payment", href: "/billing/payments" }} />
      <main className="p-8 space-y-6">

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Bills"     value={String(filtered.length)}           sub="in period"       color="default" />
          <KpiCard label="Collected"       value={`₹${totalCollected.toLocaleString()}`} sub="cash + UPI + card" color="teal"  />
          <KpiCard label="Pending"         value={`₹${totalPending.toLocaleString()}`}   sub="awaiting payment" color="yellow" />
          <KpiCard label="Waived / Free"   value={String(totalWaived)}               sub="concessions"     color="slate" />
        </div>

        {/* Filters */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardContent className="pt-5 pb-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">From Date</label>
                <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                  className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#0F766E] transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">To Date</label>
                <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                  className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#0F766E] transition-colors" />
              </div>
              <div className="flex gap-1 bg-surface/40 p-1 rounded-xl border border-border/40 self-end">
                {(["All", "Paid", "Pending", "Waived", "Failed"] as const).map((s) => (
                  <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                    className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all",
                      statusFilter === s ? "bg-[#0F766E] text-white" : "text-muted hover:text-fg hover:bg-white/5")}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-2 self-end ml-auto">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Bill no, MR no, patient…"
                  className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-44" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/10 bg-black/10 pb-4">
            <CardTitle className="text-sm">
              {filtered.length} <span className="text-slate-500 font-normal">bills</span>
            </CardTitle>
            <div className="flex gap-1">
              <button className="p-2 text-slate-500 hover:text-fg hover:bg-white/5 rounded-lg transition-colors" title="Export CSV">
                <FileSpreadsheet className="h-4 w-4" />
              </button>
              <button className="p-2 text-slate-500 hover:text-fg hover:bg-white/5 rounded-lg transition-colors" title="Print">
                <Printer className="h-4 w-4" />
              </button>
              <button className="p-2 text-slate-500 hover:text-fg hover:bg-white/5 rounded-lg transition-colors" title="Download">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-black/10">
                  {["Bill No", "Bill Date", "Time", "Patient Name", "MR No.", "OPD No.", "Method", "Amount", "Status"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pageData.map((b) => (
                  <tr key={b.billNo} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3 px-4 pl-6 font-mono text-xs font-bold text-slate-300">{b.billNo}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">{b.billDate}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono">{b.billTime}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{b.patientName}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{b.mrNo}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">{b.opdNo}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-white/5 border border-white/8 px-2 py-0.5 rounded-md text-slate-400">{b.method}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-[#0F766E]">
                      {b.amount === 0 ? <span className="text-slate-600 font-normal text-xs">—</span> : `₹${b.amount.toLocaleString()}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", STATUS_STYLE[b.status])}>
                        {STATUS_ICON[b.status]}{b.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {pageData.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-600 text-xs italic">
                      No bills match the current filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>

          {/* Pagination */}
          <div className="border-t border-border/10 bg-black/5 px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="h-7 w-7 flex items-center justify-center rounded border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-30 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={cn("h-7 w-7 flex items-center justify-center rounded text-xs font-bold transition-colors",
                    page === p ? "bg-[#0F766E] text-white" : "border border-white/10 text-slate-400 hover:bg-white/5")}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="h-7 w-7 flex items-center justify-center rounded border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-30 transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>

      </main>
    </>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: "default" | "teal" | "yellow" | "slate" }) {
  const cls = {
    default: "border-white/8 bg-white/[0.02] text-slate-200",
    teal:    "border-[#0F766E]/20 bg-[#0F766E]/5 text-[#0F766E]",
    yellow:  "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
    slate:   "border-slate-500/20 bg-slate-500/5 text-slate-400",
  }[color];
  return (
    <div className={cn("rounded-xl border p-4", cls)}>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>
    </div>
  );
}
