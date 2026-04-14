"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Loader2, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";

type TransferStatus = "idle" | "pending" | "in-transit" | "acknowledged";

interface Transfer {
  id: string;
  item: string;
  qty: number;
  from: string;
  to: string;
  status: TransferStatus;
}

const INITIAL: Transfer[] = [
  { id: "T-001", item: "Paracetamol 500mg", qty: 100, from: "Main Pharmacy", to: "ICU Sub-store", status: "idle" },
  { id: "T-002", item: "Normal Saline 500ml", qty: 24,  from: "Main Pharmacy", to: "Ward 2",        status: "in-transit" },
  { id: "T-003", item: "Amoxicillin 500mg",  qty: 50,  from: "Main Pharmacy", to: "OPD Dispensary", status: "acknowledged" },
];

const STATUS_META: Record<TransferStatus, { label: string; cls: string }> = {
  "idle":         { label: "Draft",       cls: "border-border text-muted" },
  "pending":      { label: "Pending",     cls: "border-amber-500/50 text-amber-400 bg-amber-500/10" },
  "in-transit":   { label: "In Transit",  cls: "border-blue-500/50 text-blue-400 bg-blue-500/10" },
  "acknowledged": { label: "Received",    cls: "border-[#0F766E]/50 text-[#0F766E] bg-[#0F766E]/10" },
};

export default function StockTransfer() {
  const [transfers, setTransfers] = useState(INITIAL);
  const [approving, setApproving] = useState<string | null>(null);

  const approve = (id: string) => {
    setApproving(id);
    setTimeout(() => {
      setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: "in-transit" } : t));
      setApproving(null);
    }, 1200);
  };

  const acknowledge = (id: string) => {
    setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: "acknowledged" } : t));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-[#0F766E]" /> Multi-Store Transfers
          </h2>
          <p className="text-sm text-muted mt-0.5">Indent requests between stores</p>
        </div>
        <Button size="sm" variant="primary">New Indent</Button>
      </div>

      <div className="space-y-3">
        {transfers.map(t => {
          const meta = STATUS_META[t.status];
          return (
            <Card key={t.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted">{t.id}</span>
                  <Badge variant="outline" className={cn("text-[10px]", meta.cls)}>{meta.label}</Badge>
                </div>
                <p className="font-semibold text-fg truncate">{t.item}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <span>{t.from}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>{t.to}</span>
                  <span className="ml-auto font-mono text-fg">{t.qty} units</span>
                </div>
              </div>
              <div className="shrink-0">
                {t.status === "idle" && (
                  <Button size="sm" variant="outline" onClick={() => approve(t.id)} disabled={approving === t.id}>
                    {approving === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Approve"}
                  </Button>
                )}
                {t.status === "in-transit" && (
                  <Button size="sm" variant="outline" onClick={() => acknowledge(t.id)}
                    className="border-[#0F766E]/50 text-[#0F766E] hover:bg-[#0F766E]/10">
                    Acknowledge
                  </Button>
                )}
                {t.status === "acknowledged" && (
                  <CheckCircle2 className="h-5 w-5 text-[#0F766E]" />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
