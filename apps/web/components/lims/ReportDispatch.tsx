"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Send, FileText, CheckCircle2, Loader2, ExternalLink, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  code: string;
  display: string;
  patient: string;
  status: "registered" | "partial" | "final" | "amended";
  issuedAt: string | null;
  storagePath: string | null;
  signedUrl: string | null;
  dispatching: boolean;
}

export default function ReportDispatch() {
  const supabase = createClient();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    const { data } = await supabase
      .from("diagnostic_reports")
      .select(`
        id, code, display, status, issued_at, storage_path,
        patients ( full_name )
      `)
      .order("issued_at", { ascending: false })
      .limit(20);

    if (data) {
      setReports(
        (data as Record<string, unknown>[]).map((r) => ({
          id:          r.id as string,
          code:        r.code as string,
          display:     r.display as string,
          patient:     (r.patients as { full_name?: string } | null)?.full_name ?? "Unknown",
          status:      r.status as Report["status"],
          issuedAt:    r.issued_at as string | null,
          storagePath: r.storage_path as string | null,
          signedUrl:   null,
          dispatching: false,
        }))
      );
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const dispatch = async (id: string) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, dispatching: true } : r));

    const report = reports.find((r) => r.id === id);
    let url: string | null = null;

    if (report?.storagePath) {
      const { data } = await supabase.storage
        .from("patient-documents")
        .createSignedUrl(report.storagePath, 300); // 5-min TTL
      url = data?.signedUrl ?? null;
    }

    // Mark as amended/dispatched: update status to 'amended' as "sent"
    await supabase
      .from("diagnostic_reports")
      .update({ status: "amended", issued_at: new Date().toISOString() })
      .eq("id", id);

    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, dispatching: false, status: "amended", signedUrl: url } : r
      )
    );
  };

  if (loading) {
    return (
      <Card className="p-4 flex items-center justify-center py-12 text-muted text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading reports…
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card className="p-4 flex flex-col items-center justify-center py-12 gap-2">
        <FileText className="h-7 w-7 opacity-30 text-muted" />
        <p className="text-sm text-muted">No diagnostic reports yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-fg flex items-center gap-2">
            <Send className="h-4 w-4 text-[#0F766E]" /> Report Dispatch
          </h3>
          <p className="text-[11px] text-muted mt-0.5">Sign &amp; send signed-URL to patient WhatsApp/SMS</p>
        </div>
        <Button size="sm" variant="ghost" onClick={fetchReports}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-3">
        {reports.map((r) => {
          const dispatched = r.status === "amended";
          return (
            <div
              key={r.id}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 gap-3 transition-colors",
                dispatched ? "border-[#0F766E]/30 bg-[#0F766E]/5" : "border-border bg-surface/50"
              )}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <FileText className={cn("h-4 w-4 mt-0.5 shrink-0",
                  dispatched ? "text-[#0F766E]" : "text-muted")} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">{r.display}</p>
                  <p className="text-[11px] text-muted truncate">{r.patient}</p>
                  <span className="text-[10px] font-mono text-muted">{r.code}</span>
                  {r.issuedAt && (
                    <span className="text-[10px] text-muted ml-2">
                      · {new Date(r.issuedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                {r.status === "final" && !dispatched && (
                  <Button
                    size="sm"
                    onClick={() => dispatch(r.id)}
                    disabled={r.dispatching}
                    className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs"
                  >
                    {r.dispatching
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : "Sign & Send"}
                  </Button>
                )}
                {dispatched && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0F766E]" />
                    {r.signedUrl && (
                      <a
                        href={r.signedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#0F766E] flex items-center gap-0.5 hover:underline"
                      >
                        URL <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                )}
                {r.status !== "final" && !dispatched && (
                  <span className="text-[10px] text-muted uppercase tracking-widest">{r.status}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
