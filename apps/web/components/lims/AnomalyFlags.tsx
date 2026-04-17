"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ObsRow {
  id: string;
  test: string;
  patient: string;
  value: number;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
  flag: "normal" | "low" | "high" | "critical";
}

export default function AnomalyFlags() {
  const supabase = createClient();
  const [obs, setObs]     = useState<ObsRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    const { data } = await supabase
      .from("observations")
      .select(`
        id, display, value_num, value_unit, ref_low, ref_high, flag,
        patients ( full_name )
      `)
      .in("flag", ["low", "high", "critical"])
      .eq("status", "final")
      .order("flag", { ascending: false })   // critical first
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      setObs(
        (data as Record<string, unknown>[]).map((r) => ({
          id:      r.id as string,
          test:    r.display as string,
          patient: (r.patients as { full_name?: string } | null)?.full_name ?? "Unknown",
          value:   r.value_num as number,
          unit:    (r.value_unit as string) ?? "",
          refLow:  r.ref_low as number | null,
          refHigh: r.ref_high as number | null,
          flag:    (r.flag as ObsRow["flag"]) ?? "normal",
        }))
      );
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchFlags();
    const ch = supabase
      .channel("anomaly-flags-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "observations" }, () => fetchFlags())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchFlags, supabase]);

  if (loading) {
    return (
      <Card className="p-4 flex items-center justify-center py-12 text-muted text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading anomaly flags…
      </Card>
    );
  }

  if (obs.length === 0) {
    return (
      <Card className="p-4 flex flex-col items-center justify-center py-12 gap-2">
        <AlertTriangle className="h-7 w-7 text-[#0F766E] opacity-40" />
        <p className="text-sm text-muted">No abnormal results — all values within range</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-fg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" /> Anomaly Flags
        </h3>
        <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10 text-[10px]">
          {obs.length} flagged
        </Badge>
      </div>
      <p className="text-[11px] text-muted">Westgard-style rules · final observations only · live</p>

      <div className="divide-y divide-border">
        {obs.map((r) => {
          const isCritical = r.flag === "critical";
          const isHigh     = r.flag === "high";
          return (
            <div key={r.id} className="flex items-center justify-between py-2.5 gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg">{r.test}</p>
                <p className="text-[10px] text-muted truncate">{r.patient}</p>
                {isCritical && (
                  <p className="text-[10px] text-red-400 mt-0.5">Critical — immediate review required</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("font-mono text-sm font-bold",
                  isCritical ? "text-red-400" : "text-amber-400")}>
                  {r.value} {r.unit}
                </span>
                {(r.refLow != null || r.refHigh != null) && (
                  <span className="text-[10px] text-muted hidden sm:block">
                    [{r.refLow ?? "?"}–{r.refHigh ?? "?"}]
                  </span>
                )}
                <Badge variant="outline" className={cn("text-[10px]",
                  isCritical ? "border-red-500/40 text-red-400 bg-red-500/10" :
                  isHigh     ? "border-amber-500/40 text-amber-400 bg-amber-500/10" :
                               "border-blue-500/40 text-blue-400 bg-blue-500/10"
                )}>
                  {r.flag.toUpperCase()}
                </Badge>
                {isHigh
                  ? <TrendingUp className="h-3.5 w-3.5 text-red-400" />
                  : r.flag === "low"
                    ? <TrendingDown className="h-3.5 w-3.5 text-amber-400" />
                    : <Minus className="h-3.5 w-3.5 text-[#0F766E]" />
                }
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
