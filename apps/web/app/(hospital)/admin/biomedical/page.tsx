"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Wrench, Calendar, AlertTriangle, CheckCircle2, Clock, Plus, Search, QrCode, FileText,
} from "lucide-react";

type EquipStatus = "operational" | "due_pm" | "overdue_pm" | "breakdown" | "calibration_due";

const STATUS_CFG: Record<EquipStatus, { label: string; color: string; icon: React.ElementType }> = {
  operational:     { label: "Operational",    color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",   icon: CheckCircle2 },
  due_pm:          { label: "PM Due",         color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: Clock        },
  overdue_pm:      { label: "PM Overdue",     color: "text-red-400 bg-red-500/10 border-red-500/20",          icon: AlertTriangle},
  breakdown:       { label: "Breakdown",      color: "text-red-400 bg-red-500/10 border-red-500/20",          icon: AlertTriangle},
  calibration_due: { label: "Calib. Due",     color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: Clock        },
};

interface Equipment {
  id: string; name: string; make: string; model: string;
  serial: string; dept: string; amc: string;
  lastPM: string; nextPM: string;
  lastCalib: string; nextCalib: string;
  status: EquipStatus;
}

const EQUIPMENT: Equipment[] = [
  { id: "BIO-001", name: "Ventilator",               make: "Hamilton",   model: "C3",          serial: "HAM-2022-0312", dept: "ICU",         amc: "2026-12-31", lastPM: "2026-01-10", nextPM: "2026-07-10", lastCalib: "2026-01-10", nextCalib: "2026-07-10", status: "operational"     },
  { id: "BIO-002", name: "Patient Monitor (Bedside)",make: "Philips",    model: "IntelliVue MX450", serial: "PHI-2020-1045", dept: "ICU",    amc: "2026-10-15", lastPM: "2025-10-15", nextPM: "2026-04-15", lastCalib: "2025-10-15", nextCalib: "2026-04-30", status: "due_pm"          },
  { id: "BIO-003", name: "ECG Machine",              make: "GE",         model: "MAC 5500 HD",  serial: "GE-2019-7788",  dept: "Cardiology", amc: "2026-08-30", lastPM: "2025-08-30", nextPM: "2026-02-28", lastCalib: "2025-08-30", nextCalib: "2026-02-28", status: "overdue_pm"      },
  { id: "BIO-004", name: "Ultrasound Machine",       make: "GE",         model: "Voluson E8",   serial: "GE-2021-0023",  dept: "Radiology",  amc: "2026-11-20", lastPM: "2026-02-20", nextPM: "2026-08-20", lastCalib: "2026-02-20", nextCalib: "2026-08-20", status: "operational"     },
  { id: "BIO-005", name: "Infusion Pump",            make: "Fresenius",  model: "Agilia",       serial: "FRE-2023-4455", dept: "ICU",         amc: "2027-03-01", lastPM: "2026-03-01", nextPM: "2026-09-01", lastCalib: "2026-03-01", nextCalib: "2026-09-01", status: "breakdown"       },
  { id: "BIO-006", name: "Defibrillator",            make: "Zoll",       model: "R Series",     serial: "ZOL-2020-2211", dept: "ER",          amc: "2026-09-14", lastPM: "2026-03-14", nextPM: "2026-09-14", lastCalib: "2025-09-14", nextCalib: "2026-04-20", status: "calibration_due" },
  { id: "BIO-007", name: "Anaesthesia Workstation",  make: "Dräger",     model: "Primus IE",    serial: "DRA-2018-0099", dept: "OT",          amc: "2026-12-31", lastPM: "2025-12-15", nextPM: "2026-06-15", lastCalib: "2025-12-15", nextCalib: "2026-06-15", status: "due_pm"          },
  { id: "BIO-008", name: "Autoclave",                make: "Tuttnauer",  model: "2540E",        serial: "TUT-2017-5566", dept: "CSSD",        amc: "2026-07-01", lastPM: "2026-01-05", nextPM: "2026-07-05", lastCalib: "2026-01-05", nextCalib: "2026-07-05", status: "operational"     },
];

const DEPT_FILTER = ["All","ICU","Cardiology","Radiology","ER","OT","CSSD"];

export default function BiomedicalPage() {
  const [search,  setSearch]  = useState("");
  const [dept,    setDept]    = useState("All");
  const [filter,  setFilter]  = useState<EquipStatus | "ALL">("ALL");

  const filtered = EQUIPMENT.filter(
    (e) =>
      (dept === "All" || e.dept === dept) &&
      (filter === "ALL" || e.status === filter) &&
      (e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.make.toLowerCase().includes(search.toLowerCase()) ||
        e.serial.toLowerCase().includes(search.toLowerCase()))
  );

  const statusCounts = (Object.keys(STATUS_CFG) as EquipStatus[]).map((s) => ({
    status: s, count: EQUIPMENT.filter((e) => e.status === s).length,
  })).filter((s) => s.count > 0);

  return (
    <>
      <TopBar title="Biomedical Equipment Register" action={{ label: "Add Equipment", href: "#" }} />
      <main className="p-8 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Total Equipment</p>
            <p className="text-3xl font-bold mt-1 text-[#0F766E]">{EQUIPMENT.length}</p>
          </div>
          {statusCounts.map(({ status, count }) => {
            const cfg = STATUS_CFG[status];
            return (
              <button key={status} onClick={() => setFilter(filter === status ? "ALL" : status)}
                className={cn("rounded-xl border p-4 text-left transition-all hover:scale-[1.01]",
                  filter === status ? cfg.color : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]")}>
                <p className="text-[10px] uppercase tracking-widest opacity-70">{cfg.label}</p>
                <p className="text-3xl font-bold mt-1">{count}</p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap gap-2">
            {DEPT_FILTER.map((d) => (
              <button key={d} onClick={() => setDept(d)}
                className={cn("px-3 py-1 rounded-lg text-xs font-medium border transition-all",
                  dept === d ? "bg-[#0F766E] text-white border-[#0F766E]" : "border-white/8 text-muted hover:text-fg hover:bg-white/5")}>
                {d}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Equipment, make or serial…"
              className="bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none w-44" />
          </div>
        </div>

        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardContent className="pt-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Equipment","Make / Model","Serial","Dept","AMC Expiry","Last PM","Next PM","Status",""].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-0 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const cfg = STATUS_CFG[e.status];
                  return (
                    <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 pl-0 pr-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", cfg.color)}>
                            <Wrench className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-medium text-slate-200 text-xs">{e.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-400">{e.make} {e.model}</td>
                      <td className="py-3 px-3 font-mono text-[10px] text-slate-500">{e.serial}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/8 text-slate-400 text-[10px] font-bold">{e.dept}</span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{e.amc}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500">{e.lastPM}</td>
                      <td className="py-3 px-3 text-xs font-bold"
                        style={{ color: e.status === "overdue_pm" || e.status === "due_pm" ? "#facc15" : "#94a3b8" }}>
                        {e.nextPM}
                      </td>
                      <td className="py-3 px-3">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider", cfg.color)}>
                          <cfg.icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <button title="QR Label" className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors">
                            <QrCode className="h-3.5 w-3.5" />
                          </button>
                          <button title="Service History" className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors">
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          {(e.status === "breakdown" || e.status === "due_pm" || e.status === "overdue_pm") && (
                            <button className="flex items-center gap-1 px-2 py-1 rounded bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] text-[9px] font-bold hover:bg-[#0F766E]/20 transition-all">
                              <Plus className="h-2.5 w-2.5" /> Ticket
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
