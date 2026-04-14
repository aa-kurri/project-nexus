"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditRow {
  id: number;
  actor: string;
  action: string;
  resource: string;
  at: string;
  hash: string;
  valid: boolean;
}

const ROWS: AuditRow[] = [
  { id: 1001, actor: "Dr. Sharma",    action: "patient.read",     resource: "P-1234", at: "14:22:01", hash: "a3f8e1...", valid: true  },
  { id: 1002, actor: "Nurse Priya",   action: "vitals.write",     resource: "P-1234", at: "14:23:45", hash: "b91cd2...", valid: true  },
  { id: 1003, actor: "Pharmacist Raj",action: "dispense.confirm", resource: "R-998",  at: "14:25:10", hash: "c44fa3...", valid: true  },
  { id: 1004, actor: "SYSTEM",        action: "report.dispatch",  resource: "DR-441", at: "14:26:33", hash: "!!TAMPERED!!", valid: false },
  { id: 1005, actor: "Dr. Sharma",    action: "soap.sign",        resource: "E-77",   at: "14:28:00", hash: "e72bc5...", valid: true  },
];

export default function AuditLedger() {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  const runVerification = () => {
    setVerifying(true);
    setVerified(null);
    setTimeout(() => {
      // Row 1004 is tampered — chain breaks there
      setVerified(false);
      setVerifying(false);
    }, 2000);
  };

  const brokenAt = ROWS.findIndex(r => !r.valid);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#0F766E]" /> PHI Audit Ledger
          </h2>
          <p className="text-sm text-muted mt-0.5">HMAC-SHA256 hash chain · tamper-evident</p>
        </div>
        <Button size="sm" variant="outline" onClick={runVerification} disabled={verifying}>
          {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Verify chain
        </Button>
      </div>

      {verified === false && (
        <Card className="flex items-center gap-3 border-red-500/40 bg-red-500/10 p-4">
          <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <p className="font-semibold text-red-400">Ledger Tampering Detected — Row #{ROWS[brokenAt].id}</p>
            <p className="text-xs text-muted mt-0.5">Hash chain breaks at entry ID {ROWS[brokenAt].id} · PagerDuty P1 triggered</p>
          </div>
        </Card>
      )}
      {verified === true && (
        <Card className="flex items-center gap-3 border-[#0F766E]/40 bg-[#0F766E]/10 p-4">
          <ShieldCheck className="h-5 w-5 text-[#0F766E] shrink-0" />
          <p className="font-semibold text-[#0F766E]">Chain intact — all {ROWS.length} entries verified</p>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/80">
              {["ID", "Actor", "Action", "Resource", "Time", "Hash", "Status"].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROWS.map((row, i) => (
              <tr key={row.id} className={cn(
                "transition-colors",
                !row.valid ? "bg-red-500/10" : i % 2 === 0 ? "bg-surface/20" : ""
              )}>
                <td className="px-3 py-2.5 font-mono text-xs text-muted">{row.id}</td>
                <td className="px-3 py-2.5 font-medium text-fg">{row.actor}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-muted">{row.action}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-[#0F766E]">{row.resource}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-muted">{row.at}</td>
                <td className="px-3 py-2.5 font-mono text-xs max-w-[80px] truncate" title={row.hash}>
                  <span className={cn(row.valid ? "text-muted" : "text-red-400 font-bold")}>{row.hash}</span>
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant="outline" className={cn("text-[10px]",
                    row.valid
                      ? "border-[#0F766E]/40 text-[#0F766E] bg-[#0F766E]/5"
                      : "border-red-500/40 text-red-400 bg-red-500/10"
                  )}>
                    {row.valid ? "✓ valid" : "✗ broken"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
