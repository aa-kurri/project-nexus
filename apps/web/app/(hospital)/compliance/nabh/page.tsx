"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Award, CheckCircle2, XCircle, AlertCircle, TrendingUp,
  ChevronDown, FileText, Calendar, BarChart3,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type ConformanceStatus = "compliant" | "partial" | "non_compliant" | "not_assessed";

const STATUS_CFG: Record<ConformanceStatus, { label: string; color: string; icon: React.ElementType }> = {
  compliant:     { label: "Compliant",     color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",   icon: CheckCircle2 },
  partial:       { label: "Partial",       color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: AlertCircle  },
  non_compliant: { label: "Non-Compliant", color: "text-red-400 bg-red-500/10 border-red-500/20",          icon: XCircle      },
  not_assessed:  { label: "Not Assessed",  color: "text-slate-500 bg-white/5 border-white/8",              icon: AlertCircle  },
};

interface NabhChapter {
  id: string;
  code: string;
  title: string;
  totalOE: number;
  compliant: number;
  partial: number;
  nonCompliant: number;
  items: { oe: string; description: string; status: ConformanceStatus; notes: string }[];
}

const CHAPTERS: NabhChapter[] = [
  { id: "asc", code: "AAC", title: "Access, Assessment and Continuity of Care", totalOE: 30, compliant: 24, partial: 4, nonCompliant: 2,
    items: [
      { oe: "AAC.1", description: "Hospital has defined and implemented a process for registration of patients", status: "compliant",     notes: "OPD registration SOP in place" },
      { oe: "AAC.2", description: "Initial assessment of patients is carried out by qualified personnel",        status: "compliant",     notes: "Nurse triage protocol active" },
      { oe: "AAC.3", description: "Reassessment of patients is done at defined intervals",                      status: "partial",       notes: "IPD 4-hourly not consistently documented" },
      { oe: "AAC.4", description: "A discharge summary is prepared for all inpatients",                         status: "non_compliant", notes: "Gap: 23% of IP discharges lack summary" },
    ],
  },
  { id: "cop", code: "COP", title: "Care of Patients", totalOE: 45, compliant: 38, partial: 5, nonCompliant: 2,
    items: [
      { oe: "COP.1", description: "Uniform care is provided to all patients",                                   status: "compliant",     notes: "" },
      { oe: "COP.2", description: "Care of high-risk patients is guided by defined policies",                  status: "partial",       notes: "ICU policy needs update" },
      { oe: "COP.3", description: "Resuscitation is available 24/7",                                           status: "compliant",     notes: "Crash cart audit last done 2026-04-10" },
    ],
  },
  { id: "mmc", code: "MMC", title: "Medication Management and Usage", totalOE: 25, compliant: 20, partial: 3, nonCompliant: 2,
    items: [
      { oe: "MMC.1", description: "Drug formulary is maintained and reviewed annually",                        status: "compliant",     notes: "Reviewed Jan 2026" },
      { oe: "MMC.2", description: "High-alert medications are identified and protocols defined",               status: "partial",       notes: "Storage protocol present; labelling gaps in OT" },
      { oe: "MMC.3", description: "Medication errors are reported and analysed",                               status: "non_compliant", notes: "No formal med error reporting system yet" },
    ],
  },
  { id: "pfo", code: "PFR", title: "Patient and Family Rights", totalOE: 20, compliant: 18, partial: 2, nonCompliant: 0,
    items: [
      { oe: "PFR.1", description: "The hospital respects and protects patient rights",                         status: "compliant",     notes: "Consent process documented" },
      { oe: "PFR.2", description: "Informed consent is obtained before procedures",                            status: "partial",       notes: "OPD minor procedures missing printed consent form" },
    ],
  },
  { id: "qip", code: "QPS", title: "Quality & Patient Safety", totalOE: 35, compliant: 25, partial: 7, nonCompliant: 3,
    items: [
      { oe: "QPS.1", description: "The hospital has a quality improvement programme",                          status: "compliant",     notes: "QI committee meets monthly" },
      { oe: "QPS.2", description: "Sentinel events are identified and root-cause analysis done",               status: "non_compliant", notes: "RCA process not formalised" },
      { oe: "QPS.3", description: "Patient safety indicators are monitored",                                   status: "partial",       notes: "3 of 7 indicators tracked" },
    ],
  },
];

const CLINICAL_INDICATORS = [
  { indicator: "Re-admission within 48h",       value: "1.2%", benchmark: "< 2%",  status: "compliant" as ConformanceStatus },
  { indicator: "Surgical site infection rate",   value: "1.8%", benchmark: "< 1.5%",status: "partial"   as ConformanceStatus },
  { indicator: "Medication error rate",          value: "0.4%", benchmark: "< 0.5%",status: "compliant" as ConformanceStatus },
  { indicator: "Anaesthesia complication rate",  value: "0.0%", benchmark: "< 0.3%",status: "compliant" as ConformanceStatus },
  { indicator: "Patient fall rate",              value: "0.9%", benchmark: "< 0.5%",status: "non_compliant" as ConformanceStatus },
  { indicator: "Blood transfusion reaction rate",value: "0.0%", benchmark: "< 0.2%",status: "compliant" as ConformanceStatus },
  { indicator: "LSCS rate",                      value: "42%",  benchmark: "< 40%", status: "partial"   as ConformanceStatus },
];

// ─── Component ─────────────────────────────────────────────────────────────────
export default function NabhPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"checklist" | "indicators">("checklist");

  const totalOE       = CHAPTERS.reduce((s, c) => s + c.totalOE, 0);
  const totalCompliant= CHAPTERS.reduce((s, c) => s + c.compliant, 0);
  const score         = Math.round((totalCompliant / totalOE) * 100);

  return (
    <>
      <TopBar title="NABH Compliance" action={{ label: "Schedule Mock Audit", href: "#" }} />
      <main className="p-8 space-y-6">

        {/* Score cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-2 lg:col-span-1 rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-[#0F766E]" /> Overall Score
            </p>
            <p className="text-5xl font-extrabold mt-1 text-[#0F766E]">{score}%</p>
            <p className="text-xs text-slate-500 mt-1">{totalCompliant} / {totalOE} objective elements</p>
          </div>
          {[
            { label: "Compliant OEs",    value: CHAPTERS.reduce((s,c)=>s+c.compliant,0),    color: "text-[#0F766E]" },
            { label: "Partial",          value: CHAPTERS.reduce((s,c)=>s+c.partial,0),      color: "text-yellow-400" },
            { label: "Non-Compliant",    value: CHAPTERS.reduce((s,c)=>s+c.nonCompliant,0), color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
              <p className={cn("text-4xl font-bold mt-1", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["checklist","indicators"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all",
                activeTab === t ? "bg-[#0F766E] text-white border-[#0F766E]" : "border-white/8 text-muted hover:text-fg hover:bg-white/5"
              )}>
              {t === "checklist" ? "Chapter Checklist" : "Clinical Indicators"}
            </button>
          ))}
        </div>

        {activeTab === "checklist" && (
          <div className="space-y-3">
            {CHAPTERS.map((ch) => {
              const pct = Math.round((ch.compliant / ch.totalOE) * 100);
              const isOpen = expanded === ch.id;
              return (
                <Card key={ch.id} className="border-border/40 bg-surface/50 backdrop-blur-xl">
                  <button className="w-full" onClick={() => setExpanded(isOpen ? null : ch.id)}>
                    <CardHeader className={cn("pb-4", isOpen ? "border-b border-border/20" : "")}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <span className="font-mono text-xs text-[#0F766E] bg-[#0F766E]/10 px-2 py-0.5 rounded font-bold shrink-0">{ch.code}</span>
                          <CardTitle className="text-sm text-left truncate">{ch.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-[#0F766E] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-bold text-[#0F766E]">{pct}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-[#0F766E]">✓ {ch.compliant}</span>
                            <span className="text-yellow-400">~ {ch.partial}</span>
                            <span className="text-red-400">✗ {ch.nonCompliant}</span>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", isOpen && "rotate-180")} />
                        </div>
                      </div>
                    </CardHeader>
                  </button>
                  {isOpen && (
                    <CardContent className="pt-0">
                      <div className="space-y-2 pt-2">
                        {ch.items.map((item) => {
                          const cfg = STATUS_CFG[item.status];
                          return (
                            <div key={item.oe} className="flex items-start gap-4 py-2.5 border-b border-white/5 last:border-0">
                              <span className="font-mono text-xs text-slate-500 w-16 shrink-0 mt-0.5">{item.oe}</span>
                              <p className="flex-1 text-sm text-slate-300">{item.description}</p>
                              {item.notes && (
                                <p className="text-xs text-slate-600 w-48 shrink-0">{item.notes}</p>
                              )}
                              <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0", cfg.color)}>
                                <cfg.icon className="h-3 w-3" />
                                {cfg.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === "indicators" && (
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
            <CardHeader className="border-b border-border/20 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#0F766E]" /> Clinical Quality Indicators — April 2026
                </CardTitle>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 text-slate-400 hover:text-fg hover:bg-white/5 transition-all text-xs">
                  <FileText className="h-3.5 w-3.5" /> Export Report
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Indicator", "Current", "Benchmark", "Status"].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CLINICAL_INDICATORS.map((ind) => {
                    const cfg = STATUS_CFG[ind.status];
                    return (
                      <tr key={ind.indicator} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-3 pl-0 pr-4 text-slate-300">{ind.indicator}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-100">{ind.value}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-xs">{ind.benchmark}</td>
                        <td className="py-3 px-4">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider", cfg.color)}>
                            <cfg.icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
