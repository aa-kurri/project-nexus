"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScanLine, Loader2, RefreshCw, CheckCircle2, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

type SampleStatus = "planned" | "collected" | "received" | "in-progress" | "resulted" | "rejected";

interface Sample {
  id: string;
  barcode: string;
  patient: string;
  container: string | null;
  status: SampleStatus;
  collectedAt: string | null;
  receivedAt: string | null;
}

const STATUS_CFG: Record<SampleStatus, { label: string; color: string }> = {
  "planned":     { label: "Planned",     color: "border-slate-400/40 text-slate-400 bg-slate-400/10" },
  "collected":   { label: "Collected",   color: "border-yellow-400/40 text-yellow-400 bg-yellow-400/10" },
  "received":    { label: "Received",    color: "border-blue-400/40 text-blue-400 bg-blue-400/10" },
  "in-progress": { label: "In Progress", color: "border-purple-400/40 text-purple-400 bg-purple-400/10" },
  "resulted":    { label: "Resulted",    color: "border-[#0F766E]/40 text-[#0F766E] bg-[#0F766E]/10" },
  "rejected":    { label: "Rejected",    color: "border-red-400/40 text-red-400 bg-red-400/10" },
};

export default function BarcodeTracker() {
  const supabase = createClient();
  const [samples, setSamples]   = useState<Sample[]>([]);
  const [loading, setLoading]   = useState(true);
  const [receiving, setReceiving] = useState<string | null>(null);

  const fetchSamples = useCallback(async () => {
    const { data } = await supabase
      .from("lab_samples")
      .select(`
        id, barcode, container, status, collected_at, received_at,
        patients ( full_name )
      `)
      .not("status", "in", '("resulted","rejected")')
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setSamples(
        (data as Record<string, unknown>[]).map((r) => ({
          id:          r.id as string,
          barcode:     r.barcode as string,
          patient:     (r.patients as { full_name?: string } | null)?.full_name ?? "Unknown",
          container:   r.container as string | null,
          status:      r.status as SampleStatus,
          collectedAt: r.collected_at as string | null,
          receivedAt:  r.received_at as string | null,
        }))
      );
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSamples();
    const ch = supabase
      .channel("barcode-tracker-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "lab_samples" }, () => fetchSamples())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchSamples, supabase]);

  const markReceived = async (id: string) => {
    setReceiving(id);
    await supabase
      .from("lab_samples")
      .update({ status: "received", received_at: new Date().toISOString() })
      .eq("id", id);
    setReceiving(null);
    fetchSamples();
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-blue-400" />
          <h3 className="font-semibold text-fg">Barcode Tracker</h3>
        </div>
        <Button size="sm" variant="ghost" onClick={fetchSamples} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </Button>
      </div>
      <p className="text-[11px] text-muted">Active lab samples · realtime · click to mark received</p>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading samples…
        </div>
      ) : samples.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted">
          <FlaskConical className="h-7 w-7 opacity-30" />
          <p className="text-sm">No active samples in queue</p>
        </div>
      ) : (
        <div className="space-y-2">
          {samples.map((s) => {
            const cfg = STATUS_CFG[s.status];
            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface/40 px-4 py-3 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                    <ScanLine className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold font-mono text-fg">{s.barcode}</p>
                    <p className="text-[11px] text-muted truncate">{s.patient}</p>
                    {s.container && (
                      <p className="text-[10px] text-muted">{s.container}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={cn("text-[10px]", cfg.color)}>
                    {cfg.label}
                  </Badge>
                  {s.status === "collected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markReceived(s.id)}
                      disabled={receiving === s.id}
                      className="text-xs h-7"
                    >
                      {receiving === s.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <><CheckCircle2 className="h-3 w-3 mr-1" />Receive</>
                      }
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
