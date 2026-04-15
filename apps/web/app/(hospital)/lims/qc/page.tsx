"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, FlaskConical, Activity } from "lucide-react";
import { TopBar } from "@/components/hospital/TopBar";
import LeveyJenningsChart, {
  ANALYTES,
  ANALYSERS,
  getQcStats,
  type Analyte,
  type Analyser,
} from "@/components/lims/LeveyJenningsChart";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Legend item ───────────────────────────────────────────────────────────────

function LegendDot({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full border"
        style={{ backgroundColor: `${colour}33`, borderColor: colour }}
      />
      {label}
    </span>
  );
}

// ── Selector button ───────────────────────────────────────────────────────────

function SelectorBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
        active
          ? "bg-[#0F766E] text-white shadow-[0_0_0_1px_#0F766E]"
          : "bg-transparent border border-border text-muted hover:text-fg hover:border-[#0F766E]/50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function QcPage() {
  const [analyte, setAnalyte] = useState<Analyte>("Glucose");
  const [analyser, setAnalyser] = useState<Analyser>("Cobas c311");

  const stats = getQcStats(analyte, analyser);

  const passRate = ((stats.inControl / stats.total) * 100).toFixed(0);
  const overallStatus =
    stats.rejections > 0 ? "reject" : stats.warnings > 0 ? "warn" : "pass";

  return (
    <>
      <TopBar title="QC Charts — Levey–Jennings" />

      <ScrollArea className="flex-1">
        <main className="space-y-5 p-6 pb-10">

          {/* ── Selectors ─────────────────────────────────────────────── */}
          <Card className="p-4 space-y-4">
            <div className="flex flex-wrap gap-8">
              {/* Analyte selector */}
              <div className="space-y-2 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Analyte
                </p>
                <div className="flex flex-wrap gap-2">
                  {ANALYTES.map(a => (
                    <SelectorBtn
                      key={a}
                      active={analyte === a}
                      onClick={() => setAnalyte(a)}
                    >
                      {a}
                    </SelectorBtn>
                  ))}
                </div>
              </div>

              {/* Analyser selector */}
              <div className="space-y-2 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                  Analyser
                </p>
                <div className="flex flex-wrap gap-2">
                  {ANALYSERS.map(an => (
                    <SelectorBtn
                      key={an}
                      active={analyser === an}
                      onClick={() => setAnalyser(an)}
                    >
                      {an}
                    </SelectorBtn>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* ── Stats row ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Overall status */}
            <Card className="p-4 flex flex-col items-center justify-center text-center gap-1">
              <span
                className={[
                  "text-2xl font-bold",
                  overallStatus === "pass"
                    ? "text-[#0F766E]"
                    : overallStatus === "warn"
                    ? "text-amber-400"
                    : "text-red-400",
                ].join(" ")}
              >
                {passRate}%
              </span>
              <span className="text-[10px] text-muted">Pass Rate</span>
              <Badge
                variant="outline"
                className={[
                  "text-[10px] mt-1 border",
                  overallStatus === "pass"
                    ? "border-[#0F766E]/50 text-[#0F766E] bg-[#0F766E]/10"
                    : overallStatus === "warn"
                    ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                    : "border-red-500/50 text-red-400 bg-red-500/10",
                ].join(" ")}
              >
                {overallStatus === "pass"
                  ? "In Control"
                  : overallStatus === "warn"
                  ? "Warning"
                  : "Out of Control"}
              </Badge>
            </Card>

            {/* In control */}
            <Card className="p-4 flex flex-col items-center justify-center text-center gap-1">
              <span className="text-2xl font-bold text-[#0F766E]">{stats.inControl}</span>
              <span className="text-[10px] text-muted flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-[#0F766E]" />
                In Control
              </span>
              <span className="text-[10px] text-muted">/ {stats.total} runs</span>
            </Card>

            {/* Warnings */}
            <Card className="p-4 flex flex-col items-center justify-center text-center gap-1">
              <span className="text-2xl font-bold text-amber-400">{stats.warnings}</span>
              <span className="text-[10px] text-muted flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                1-2s Warnings
              </span>
              <span className="text-[10px] text-muted">≥ ±2 SD</span>
            </Card>

            {/* Rejections */}
            <Card className="p-4 flex flex-col items-center justify-center text-center gap-1">
              <span className="text-2xl font-bold text-red-400">{stats.rejections}</span>
              <span className="text-[10px] text-muted flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-400" />
                Rejections
              </span>
              <span className="text-[10px] text-muted">1-3s / 2-2s</span>
            </Card>
          </div>

          {/* ── Chart card ────────────────────────────────────────────── */}
          <Card className="p-5 space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
                  <FlaskConical className="h-4 w-4 text-[#0F766E]" />
                  Levey–Jennings Chart
                </h2>
                <p className="mt-0.5 text-[11px] text-muted">
                  Mean:&nbsp;
                  <span className="font-mono text-fg">
                    {stats.mean}&nbsp;{stats.unit}
                  </span>
                  &nbsp;·&nbsp;SD:&nbsp;
                  <span className="font-mono text-fg">{stats.sd}</span>
                  &nbsp;·&nbsp;CV:&nbsp;
                  <span className="font-mono text-fg">{stats.cv}%</span>
                  &nbsp;·&nbsp;20 runs shown
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4">
                <LegendDot colour="#0F766E" label="In control" />
                <LegendDot colour="#f59e0b" label="1-2s warning" />
                <LegendDot colour="#ef4444" label="1-3s / 2-2s rejection" />
              </div>
            </div>

            {/* Westgard rules reference */}
            <div className="flex flex-wrap gap-2">
              {[
                { rule: "1-2s", desc: "Warning: single result ≥ ±2 SD", colour: "amber" },
                { rule: "1-3s", desc: "Rejection: single result ≥ ±3 SD", colour: "red" },
                { rule: "2-2s", desc: "Rejection: 2 consecutive ≥ same-side 2 SD", colour: "red" },
              ].map(({ rule, desc, colour }) => (
                <span
                  key={rule}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                    colour === "amber"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      : "border-red-500/30 bg-red-500/10 text-red-400",
                  ].join(" ")}
                  title={desc}
                >
                  <Activity className="h-2.5 w-2.5" />
                  {rule}
                </span>
              ))}
            </div>

            {/* SVG chart */}
            <div className="rounded-lg border border-border bg-[hsl(220_15%_6%)] p-3">
              <LeveyJenningsChart analyte={analyte} analyser={analyser} />
            </div>

            <p className="text-center text-[10px] text-muted">
              Hover over a data point to see its run value and z-score.
            </p>
          </Card>

        </main>
      </ScrollArea>
    </>
  );
}
