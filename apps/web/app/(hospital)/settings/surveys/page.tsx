"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Star, TrendingUp, TrendingDown, MessageCircle, BarChart3, AlertTriangle } from "lucide-react";

const MONTHLY_NPS = [
  { month: "Nov", score: 58 }, { month: "Dec", score: 62 }, { month: "Jan", score: 60 },
  { month: "Feb", score: 65 }, { month: "Mar", score: 68 }, { month: "Apr", score: 71 },
];

const DEPT_SCORES = [
  { dept: "OPD",        nps: 74, responses: 142, promoters: 68, passives: 12, detractors: 20 },
  { dept: "IPD",        nps: 68, responses: 89,  promoters: 62, passives: 14, detractors: 24 },
  { dept: "Pharmacy",   nps: 80, responses: 134, promoters: 75, passives: 12, detractors: 13 },
  { dept: "Laboratory", nps: 77, responses: 98,  promoters: 71, passives: 13, detractors: 16 },
  { dept: "Billing",    nps: 55, responses: 76,  promoters: 52, passives: 14, detractors: 34 },
  { dept: "Radiology",  nps: 72, responses: 44,  promoters: 66, passives: 14, detractors: 20 },
];

const RECENT_FEEDBACK = [
  { id: "SRV-001", dept: "OPD",      nps: 9,  comment: "Doctor was very thorough. Wait time was a bit long but overall satisfied.",    date: "2026-04-16" },
  { id: "SRV-002", dept: "Billing",  nps: 3,  comment: "The billing desk took too long to process my discharge. Staff were rude.",      date: "2026-04-16" },
  { id: "SRV-003", dept: "IPD",      nps: 10, comment: "Excellent nursing care. Felt very safe throughout my stay. Thank you!",         date: "2026-04-15" },
  { id: "SRV-004", dept: "Pharmacy", nps: 8,  comment: "Medicines were ready quickly. Good counselling on dosage.",                    date: "2026-04-15" },
  { id: "SRV-005", dept: "Billing",  nps: 2,  comment: "Insurance claim processing was very slow. Had to follow up multiple times.",    date: "2026-04-14" },
  { id: "SRV-006", dept: "OPD",      nps: 9,  comment: "AI consultation tool was impressive. Doctor used voice notes effectively.",    date: "2026-04-14" },
];

function NpsBar({ promoters, passives, detractors }: { promoters: number; passives: number; detractors: number }) {
  const total = promoters + passives + detractors;
  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
      <div className="bg-[#0F766E] rounded-l-full" style={{ width: `${(promoters/total)*100}%` }} />
      <div className="bg-yellow-400" style={{ width: `${(passives/total)*100}%` }} />
      <div className="bg-red-400 rounded-r-full" style={{ width: `${(detractors/total)*100}%` }} />
    </div>
  );
}

export default function SurveysPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "feedback">("overview");

  const overallNps = Math.round(DEPT_SCORES.reduce((s,d) => s + d.nps * d.responses, 0) / DEPT_SCORES.reduce((s,d) => s + d.responses, 0));
  const totalResponses = DEPT_SCORES.reduce((s,d) => s + d.responses, 0);
  const prevNps = MONTHLY_NPS[MONTHLY_NPS.length - 2].score;
  const trend = overallNps - prevNps;

  return (
    <>
      <TopBar title="Patient Satisfaction Surveys" />
      <main className="p-8 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-2 lg:col-span-1 rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-[#0F766E]" /> Overall NPS
            </p>
            <p className="text-5xl font-extrabold mt-1 text-[#0F766E]">{overallNps}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-[#0F766E]" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
              <span className={cn("text-xs", trend >= 0 ? "text-[#0F766E]" : "text-red-400")}>{trend >= 0 ? "+" : ""}{trend} vs last month</span>
            </div>
          </div>
          {[
            { label: "Total Responses",  value: totalResponses.toString() },
            { label: "Response Rate",    value: "68%" },
            { label: "Low Score Alerts", value: RECENT_FEEDBACK.filter(f => f.nps <= 4).length.toString() },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
              <p className="text-3xl font-bold mt-1 text-slate-200">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Trend chart (simple bar) */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardHeader className="border-b border-border/20 pb-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#0F766E]" /> NPS Trend (6 months)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-end gap-4 h-24">
              {MONTHLY_NPS.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-[#0F766E]">{m.score}</span>
                  <div className="w-full bg-[#0F766E]/20 rounded-t-md" style={{ height: `${(m.score / 100) * 80}px` }}>
                    <div className="w-full h-full bg-[#0F766E] rounded-t-md opacity-70" />
                  </div>
                  <span className="text-[10px] text-slate-500">{m.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          {(["overview","feedback"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all",
                activeTab === t ? "bg-[#0F766E] text-white border-[#0F766E]" : "border-white/8 text-muted hover:text-fg hover:bg-white/5")}>
              {t === "overview" ? "Department Scores" : "Recent Feedback"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-3">
            {DEPT_SCORES.sort((a,b) => b.nps - a.nps).map((d) => (
              <div key={d.dept} className="flex items-center gap-6 p-4 rounded-xl border border-white/5 hover:bg-white/[0.02] bg-surface/30">
                <p className="text-sm font-medium text-slate-200 w-24 shrink-0">{d.dept}</p>
                <div className="flex-1 space-y-1">
                  <NpsBar promoters={d.promoters} passives={d.passives} detractors={d.detractors} />
                  <div className="flex items-center gap-4 text-[10px]">
                    <span className="text-[#0F766E]">{d.promoters}% promoters</span>
                    <span className="text-yellow-400">{d.passives}% passive</span>
                    <span className="text-red-400">{d.detractors}% detractors</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("text-2xl font-bold font-mono", d.nps >= 70 ? "text-[#0F766E]" : d.nps >= 50 ? "text-yellow-400" : "text-red-400")}>{d.nps}</p>
                  <p className="text-[10px] text-slate-600">{d.responses} responses</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "feedback" && (
          <div className="space-y-3">
            {RECENT_FEEDBACK.map((f) => {
              const isLow = f.nps <= 4;
              return (
                <div key={f.id} className={cn("flex items-start gap-4 p-4 rounded-xl border", isLow ? "border-red-500/20 bg-red-500/5" : "border-white/5 bg-white/[0.02]")}>
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-extrabold",
                    f.nps >= 9 ? "bg-[#0F766E]/20 text-[#0F766E]" : f.nps >= 7 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")}>
                    {f.nps}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/8 text-slate-400 text-[10px] font-bold">{f.dept}</span>
                      <span className="text-[10px] text-slate-600">{f.date}</span>
                      {isLow && (
                        <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
                          <AlertTriangle className="h-3 w-3" /> Low score alert
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{f.comment}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
