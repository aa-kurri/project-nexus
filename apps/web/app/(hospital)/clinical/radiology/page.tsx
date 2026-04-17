"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ScanLine, Clock, CheckCircle2, Search,
  ChevronLeft, ChevronRight, Zap, FileText, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RadStatus  = "Ordered" | "In Progress" | "Reported" | "Dispatched";
type Modality   = "X-Ray" | "USG" | "CT" | "MRI" | "Echo" | "DEXA";
type Priority   = "Routine" | "Urgent" | "STAT";

interface RadOrder {
  id: string; patient: string; uhid: string; age: number; gender: string;
  modality: Modality; study: string; orderedBy: string; ward: string;
  orderedAt: string; reportedAt: string | null;
  status: RadStatus; priority: Priority;
  findings: string | null; impression: string | null;
  radiologist: string | null;
}

const ORDERS: RadOrder[] = [
  { id:"RD-4401", patient:"Sunita Sharma",      uhid:"AY-00006", age:60, gender:"F", modality:"Echo",  study:"2D Echo with Doppler",            orderedBy:"Dr. Vinod Nair",        ward:"ICU",      orderedAt:"08:15", reportedAt:"09:45", status:"Dispatched",   priority:"Urgent",  findings:"EF 42%. Mild LV dysfunction. No pericardial effusion.", impression:"Post-MI LV dysfunction — LVEF 42%.",      radiologist:"Dr. Amit Sharma"  },
  { id:"RD-4402", patient:"George Mathew",      uhid:"AY-00007", age:67, gender:"M", modality:"X-Ray", study:"Chest PA + Knee AP/Lateral",       orderedBy:"Dr. Arjun Pillai",      ward:"OT",       orderedAt:"08:30", reportedAt:"09:00", status:"Dispatched",   priority:"Routine", findings:"Prosthesis in situ. Good alignment. Lungs clear.",     impression:"Post TKR — satisfactory position.",        radiologist:"Dr. Preethi Rao"  },
  { id:"RD-4403", patient:"Ramesh Kumar",       uhid:"AY-00005", age:45, gender:"M", modality:"USG",   study:"USG Abdomen (Post-op check)",      orderedBy:"Dr. Priya Subramaniam", ward:"Ward 3B",  orderedAt:"09:00", reportedAt:"10:30", status:"Reported",     priority:"Routine", findings:"No free fluid. Operative site unremarkable.",          impression:"Normal post-op USG.",                      radiologist:"Dr. Preethi Rao"  },
  { id:"RD-4404", patient:"Deepa Reddy",        uhid:"AY-00009", age:31, gender:"F", modality:"USG",   study:"USG Pelvis (Transvaginal)",         orderedBy:"Dr. Meera Krishnan",    ward:"OT",       orderedAt:"10:45", reportedAt:null,    status:"In Progress",  priority:"Urgent",  findings:null,                                                   impression:null,                                       radiologist:"Dr. Amit Sharma"  },
  { id:"RD-4405", patient:"Mohammed Farhan",    uhid:"AY-00010", age:55, gender:"M", modality:"CT",    study:"CT KUB (Non-contrast)",            orderedBy:"Dr. Vinod Nair",        ward:"Ward 4C",  orderedAt:"11:00", reportedAt:null,    status:"Ordered",      priority:"Routine", findings:null,                                                   impression:null,                                       radiologist:null               },
  { id:"RD-4406", patient:"Priya Nair",         uhid:"AY-00004", age:28, gender:"F", modality:"CT",    study:"CECT Abdomen & Pelvis",            orderedBy:"Dr. Priya Subramaniam", ward:"OT",       orderedAt:"11:30", reportedAt:null,    status:"In Progress",  priority:"STAT",    findings:null,                                                   impression:null,                                       radiologist:"Dr. Amit Sharma"  },
  { id:"RD-4407", patient:"Arun Krishnamurthy", uhid:"AY-00008", age:38, gender:"M", modality:"MRI",   study:"MRI LS Spine (with contrast)",     orderedBy:"Dr. Suresh Nambiar",    ward:"Ward 4C",  orderedAt:"12:00", reportedAt:null,    status:"Ordered",      priority:"Routine", findings:null,                                                   impression:null,                                       radiologist:null               },
  { id:"RD-4408", patient:"Sarah Malik",        uhid:"AY-00002", age:34, gender:"F", modality:"X-Ray", study:"Chest PA",                         orderedBy:"Dr. Rajiv Menon",       ward:"Ward 2A",  orderedAt:"12:30", reportedAt:"13:15", status:"Reported",     priority:"Routine", findings:"Mild cardiomegaly. No consolidation.",                  impression:"Cardiomegaly — clinical correlation advised.", radiologist:"Dr. Preethi Rao"},
  { id:"RD-4409", patient:"Kavitha Iyer",       uhid:"AY-00011", age:42, gender:"F", modality:"USG",   study:"Neck USG (Post-thyroidectomy)",    orderedBy:"Dr. Suresh Nambiar",    ward:"Ward 3B",  orderedAt:"13:00", reportedAt:"14:00", status:"Dispatched",   priority:"Urgent",  findings:"No haematoma. Parathyroids visible.",                   impression:"Normal post-thyroidectomy neck.",           radiologist:"Dr. Preethi Rao"  },
  { id:"RD-4410", patient:"Anish Kurri",        uhid:"AY-00001", age:29, gender:"M", modality:"DEXA",  study:"Bone Densitometry (Lumbar/Hip)",   orderedBy:"Dr. Rajiv Menon",       ward:"OPD",      orderedAt:"14:30", reportedAt:null,    status:"Ordered",      priority:"Routine", findings:null,                                                   impression:null,                                       radiologist:null               },
  { id:"RD-4411", patient:"Vikram Seth",        uhid:"AY-00003", age:52, gender:"M", modality:"CT",    study:"HRCT Chest",                       orderedBy:"Dr. Vinod Nair",        ward:"OPD",      orderedAt:"15:00", reportedAt:null,    status:"Ordered",      priority:"Routine", findings:null,                                                   impression:null,                                       radiologist:null               },
  { id:"RD-4412", patient:"Sunita Sharma",      uhid:"AY-00006", age:60, gender:"F", modality:"X-Ray", study:"Portable CXR (Bedside)",           orderedBy:"Dr. Vinod Nair",        ward:"ICU",      orderedAt:"07:00", reportedAt:"07:45", status:"Dispatched",   priority:"STAT",    findings:"ETT in situ. Bilateral clear fields.",                 impression:"ETT position satisfactory.",               radiologist:"Dr. Amit Sharma"  },
];

const STATUS_STYLE: Record<RadStatus, string> = {
  "Ordered":     "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "In Progress": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Reported":    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Dispatched":  "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20",
};

const PRIORITY_STYLE: Record<Priority, string> = {
  "Routine": "text-slate-500 bg-white/5 border-white/8",
  "Urgent":  "text-yellow-400 bg-yellow-500/5 border-yellow-500/20",
  "STAT":    "text-red-400 bg-red-500/5 border-red-500/20",
};

const MODALITY_COLOR: Record<Modality, string> = {
  "X-Ray": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "USG":   "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20",
  "CT":    "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "MRI":   "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Echo":  "bg-red-500/10 text-red-400 border-red-500/20",
  "DEXA":  "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const STATUS_ICON: Record<RadStatus, React.ReactNode> = {
  "Ordered":     <Clock className="h-3 w-3" />,
  "In Progress": <Activity className="h-3 w-3" />,
  "Reported":    <FileText className="h-3 w-3" />,
  "Dispatched":  <CheckCircle2 className="h-3 w-3" />,
};

const MODALITIES: Modality[] = ["X-Ray", "USG", "CT", "MRI", "Echo", "DEXA"];
const PAGE_SIZE = 8;

export default function RadiologyWorklistPage() {
  const [statusFilter,   setStatusFilter]   = useState<RadStatus | "All">("All");
  const [modalityFilter, setModalityFilter] = useState<Modality | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const [search,         setSearch]         = useState("");
  const [page,           setPage]           = useState(1);
  const [expanded,       setExpanded]       = useState<string | null>(null);

  const filtered = ORDERS.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = o.patient.toLowerCase().includes(q) || o.study.toLowerCase().includes(q) ||
      o.uhid.toLowerCase().includes(q) || o.orderedBy.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
    return matchSearch &&
      (statusFilter   === "All" || o.status   === statusFilter) &&
      (modalityFilter === "All" || o.modality === modalityFilter) &&
      (priorityFilter === "All" || o.priority === priorityFilter);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    ordered:    ORDERS.filter((o) => o.status === "Ordered").length,
    inProgress: ORDERS.filter((o) => o.status === "In Progress").length,
    reported:   ORDERS.filter((o) => o.status === "Reported").length,
    stat:       ORDERS.filter((o) => o.priority === "STAT").length,
  };

  const modalityCounts = MODALITIES.map((m) => ({
    m,
    n: ORDERS.filter((o) => o.modality === m).length,
  }));

  return (
    <>
      <TopBar title="Radiology Worklist" action={{ label: "+ New Order", href: "#" }} />
      <main className="p-8 space-y-6">

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Pending / Queue", value: counts.ordered,    color: "slate"  as const },
            { label: "In Progress",      value: counts.inProgress, color: "purple" as const },
            { label: "Reported",         value: counts.reported,   color: "blue"   as const },
            { label: "STAT Orders",      value: counts.stat,       color: "red"    as const },
          ].map(({ label, value, color }) => (
            <div key={label} className={cn("rounded-xl border px-5 py-4", {
              "border-white/8 bg-white/[0.02] text-slate-200":        color === "slate",
              "border-purple-500/20 bg-purple-500/5 text-purple-400":  color === "purple",
              "border-blue-500/20 bg-blue-500/5 text-blue-400":        color === "blue",
              "border-red-500/20 bg-red-500/5 text-red-400":           color === "red",
            })}>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* Modality breakdown */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setModalityFilter("All"); setPage(1); }}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
              modalityFilter === "All" ? "bg-[#0F766E] text-white border-[#0F766E]" : "border-white/8 text-slate-500 hover:text-slate-300 hover:bg-white/5")}
          >
            All ({ORDERS.length})
          </button>
          {modalityCounts.map(({ m, n }) => (
            <button key={m} onClick={() => { setModalityFilter(m); setPage(1); }}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                modalityFilter === m
                  ? cn(MODALITY_COLOR[m], "ring-1 ring-offset-0")
                  : "border-white/8 text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}>
              {m} ({n})
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-xl px-4 py-2.5 flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Patient, study, UHID or referring doctor…"
              className="bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none flex-1" />
          </div>
          <div className="flex gap-2">
            <div className="flex gap-1 bg-surface/40 p-1 rounded-xl border border-border/40">
              {(["All","Ordered","In Progress","Reported","Dispatched"] as const).map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all",
                    statusFilter === s ? "bg-[#0F766E] text-white" : "text-muted hover:text-fg hover:bg-white/5")}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-surface/40 p-1 rounded-xl border border-border/40">
              {(["All","Routine","Urgent","STAT"] as const).map((p) => (
                <button key={p} onClick={() => { setPriorityFilter(p); setPage(1); }}
                  className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-all",
                    priorityFilter === p ? "bg-[#0F766E] text-white" : "text-muted hover:text-fg hover:bg-white/5")}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Worklist table */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/10 bg-black/10 pb-4">
            <CardTitle className="text-sm">
              {filtered.length} <span className="text-slate-600 font-normal">studies</span>
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <ScanLine className="h-3.5 w-3.5" /> Radiology Worklist
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-black/10">
                  {["ID", "Patient", "Modality / Study", "Ordered By", "Ward", "Time", "Priority", "Status"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paged.map((o) => (
                  <>
                    <tr key={o.id}
                      className={cn("hover:bg-white/[0.02] transition-colors cursor-pointer",
                        o.priority === "STAT" && "bg-red-500/[0.02]",
                        expanded === o.id && "bg-white/[0.02]"
                      )}
                      onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                    >
                      <td className="py-3.5 px-4 pl-6 font-mono text-xs text-[#0F766E] font-bold">{o.id}</td>
                      <td className="py-3.5 px-4">
                        <p className="text-xs font-bold text-slate-200">{o.patient}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{o.uhid} · {o.age}y {o.gender}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md border", MODALITY_COLOR[o.modality])}>{o.modality}</span>
                          <span className="text-xs text-slate-300 max-w-[180px] truncate">{o.study}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">{o.orderedBy}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">{o.ward}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{o.orderedAt}</td>
                      <td className="py-3.5 px-4">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", PRIORITY_STYLE[o.priority])}>
                          {o.priority === "STAT" && <Zap className="h-2.5 w-2.5" />}
                          {o.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", STATUS_STYLE[o.status])}>
                          {STATUS_ICON[o.status]} {o.status}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded report row */}
                    {expanded === o.id && (
                      <tr key={`${o.id}-exp`}>
                        <td colSpan={8} className="bg-black/20 border-b border-white/5 px-6 py-4">
                          {(o.status === "Reported" || o.status === "Dispatched") && o.findings ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Findings</p>
                                <p className="text-xs text-slate-300 leading-relaxed">{o.findings}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Impression</p>
                                <p className="text-xs text-[#0F766E] font-bold leading-relaxed">{o.impression}</p>
                                <p className="text-[10px] text-slate-600 mt-2">Reported by {o.radiologist} at {o.reportedAt}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className={cn("h-2 w-2 rounded-full", o.status === "In Progress" ? "bg-purple-400 animate-pulse" : "bg-slate-600")} />
                              <p className="text-xs text-slate-500 italic">
                                {o.status === "In Progress" ? `Scanning in progress — ${o.radiologist ?? "radiologist"} assigned` : "Awaiting allocation to radiologist"}
                              </p>
                              {o.status === "Ordered" && (
                                <button className="ml-auto px-3 py-1 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold transition-all">
                                  Assign Radiologist
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-600 text-xs italic">No orders match the current filter</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {totalPages} · {filtered.length} studies</span>
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
    </>
  );
}
