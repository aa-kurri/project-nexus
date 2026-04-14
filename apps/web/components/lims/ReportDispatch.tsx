"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send, FileText, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type DispatchStatus = "pending" | "signing" | "dispatched";

interface Report {
  id: string;
  test: string;
  patient: string;
  status: DispatchStatus;
  signedUrl?: string;
}

const REPORTS: Report[] = [
  { id: "DR-441", test: "CBC + LFT Panel",     patient: "Ramesh Kumar · P-1234", status: "pending" },
  { id: "DR-440", test: "HbA1c",               patient: "Priya Sharma · P-1002",  status: "dispatched", signedUrl: "#" },
  { id: "DR-439", test: "Lipid Profile",        patient: "Arjun Patel · P-1003",   status: "pending" },
];

export default function ReportDispatch() {
  const [reports, setReports] = useState(REPORTS);
  const [dispatching, setDispatching] = useState<string | null>(null);

  const dispatch = (id: string) => {
    setDispatching(id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: "signing" } : r));
    setTimeout(() => {
      setReports(prev => prev.map(r =>
        r.id === id ? { ...r, status: "dispatched", signedUrl: "#" } : r
      ));
      setDispatching(null);
    }, 1800);
  };

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-fg flex items-center gap-2">
          <Send className="h-4 w-4 text-[#0F766E]" /> Report Dispatch
        </h3>
        <p className="text-[11px] text-muted mt-0.5">Sign &amp; send signed-URL to patient WhatsApp/SMS</p>
      </div>

      <div className="space-y-3">
        {reports.map(r => (
          <div key={r.id}
            className={cn("flex items-center justify-between rounded-xl border p-3 gap-3 transition-colors",
              r.status === "dispatched" ? "border-[#0F766E]/30 bg-[#0F766E]/5" : "border-border bg-surface/50"
            )}>
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <FileText className={cn("h-4 w-4 mt-0.5 shrink-0",
                r.status === "dispatched" ? "text-[#0F766E]" : "text-muted")} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg truncate">{r.test}</p>
                <p className="text-[11px] text-muted truncate">{r.patient}</p>
                <span className="text-[10px] font-mono text-muted">{r.id}</span>
              </div>
            </div>
            <div className="shrink-0">
              {r.status === "pending" && (
                <Button size="sm" onClick={() => dispatch(r.id)}
                  className="bg-[#0F766E] hover:bg-[#115E59] text-white text-xs">
                  Sign &amp; Send
                </Button>
              )}
              {r.status === "signing" && (
                <Button size="sm" disabled variant="outline">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </Button>
              )}
              {r.status === "dispatched" && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0F766E]" />
                  <a href={r.signedUrl} className="text-[11px] text-[#0F766E] flex items-center gap-0.5 hover:underline">
                    URL <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
