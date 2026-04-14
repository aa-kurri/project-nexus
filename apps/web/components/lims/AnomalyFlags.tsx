"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Result {
  test: string;
  value: number;
  unit: string;
  refLow: number;
  refHigh: number;
  rule?: string;        // Westgard rule violation
}

const RESULTS: Result[] = [
  { test: "WBC",        value: 15.2,  unit: "10³/µL", refLow: 4.0,   refHigh: 11.0,  rule: "13s — 3SD above mean" },
  { test: "Haemoglobin",value: 9.1,   unit: "g/dL",   refLow: 12.0,  refHigh: 17.5,  rule: "22s — 2 consecutive below -2SD" },
  { test: "Platelets",  value: 220,   unit: "10³/µL", refLow: 150,   refHigh: 400 },
  { test: "Creatinine", value: 1.9,   unit: "mg/dL",  refLow: 0.6,   refHigh: 1.2,   rule: "13s — critical high" },
  { test: "ALT",        value: 38,    unit: "U/L",    refLow: 7,     refHigh: 56 },
];

function flagResult(r: Result): "critical" | "abnormal" | "normal" {
  if (r.rule && (r.value > r.refHigh * 1.5 || r.value < r.refLow * 0.5)) return "critical";
  if (r.value < r.refLow || r.value > r.refHigh) return "abnormal";
  return "normal";
}

export default function AnomalyFlags() {
  const flagged = RESULTS.filter(r => flagResult(r) !== "normal");

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-fg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" /> AI Anomaly Detection
        </h3>
        <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10 text-[10px]">
          {flagged.length} flags
        </Badge>
      </div>
      <p className="text-[11px] text-muted">Westgard rules · Sample S-88231 · Patient P-1234</p>

      <div className="divide-y divide-border">
        {RESULTS.map(r => {
          const flag = flagResult(r);
          const high = r.value > r.refHigh;
          const low  = r.value < r.refLow;
          return (
            <div key={r.test} className="flex items-center justify-between py-2.5 gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg">{r.test}</p>
                {r.rule && flag !== "normal" && (
                  <p className="text-[10px] text-amber-400 mt-0.5">{r.rule}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("font-mono text-sm font-bold",
                  flag === "critical" ? "text-red-400" :
                  flag === "abnormal" ? "text-amber-400" : "text-[#0F766E]")}>
                  {r.value} {r.unit}
                </span>
                <span className="text-[10px] text-muted hidden sm:block">
                  [{r.refLow}–{r.refHigh}]
                </span>
                {high ? <TrendingUp className="h-3.5 w-3.5 text-red-400" /> :
                 low  ? <TrendingDown className="h-3.5 w-3.5 text-amber-400" /> :
                        <Minus className="h-3.5 w-3.5 text-[#0F766E]" />}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
