"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Send, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface POLine {
  id: string;
  drug: string;
  currentStock: number;
  rol: number;
  orderQty: number;
  supplier: string;
  status: "draft" | "sent" | "acknowledged";
}

const INITIAL: POLine[] = [
  { id: "PO-2260", drug: "Amoxicillin 500mg",  currentStock: 49,  rol: 50,  orderQty: 200, supplier: "Cipla Direct",    status: "draft" },
  { id: "PO-2261", drug: "Metformin 500mg",    currentStock: 28,  rol: 30,  orderQty: 150, supplier: "Sun Pharma",       status: "draft" },
  { id: "PO-2259", drug: "Omeprazole 20mg",    currentStock: 10,  rol: 40,  orderQty: 300, supplier: "Dr. Reddy's",      status: "sent" },
];

export default function AutoPO() {
  const [lines, setLines] = useState<POLine[]>(INITIAL);

  const sendPO = (id: string) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, status: "sent" } : l));
  };

  const stockPct = (l: POLine) => Math.round((l.currentStock / l.rol) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#0F766E]" /> Auto-Generated POs
          </h2>
          <p className="text-sm text-muted mt-0.5">Triggered when stock drops below Re-Order Level</p>
        </div>
        <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10">
          {lines.filter(l => l.status === "draft").length} awaiting review
        </Badge>
      </div>

      <div className="space-y-3">
        {lines.map(l => {
          const pct = stockPct(l);
          const critical = pct < 60;
          return (
            <Card key={l.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted">{l.id}</span>
                    {critical && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                  </div>
                  <p className="font-semibold text-fg">{l.drug}</p>
                  <p className="text-xs text-muted mt-0.5">{l.supplier} · {l.orderQty} units</p>
                </div>
                <div className="text-right shrink-0">
                  {l.status === "draft" ? (
                    <Button size="sm" onClick={() => sendPO(l.id)}
                      className="bg-[#0F766E] hover:bg-[#115E59] text-white">
                      <Send className="h-3.5 w-3.5" /> Send PO
                    </Button>
                  ) : (
                    <Badge variant="outline" className="border-[#0F766E]/50 text-[#0F766E] bg-[#0F766E]/10">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Sent
                    </Badge>
                  )}
                </div>
              </div>
              {/* Stock gauge */}
              <div>
                <div className="flex justify-between text-[10px] text-muted mb-1 uppercase tracking-wider">
                  <span>Current stock vs ROL</span>
                  <span className={cn(critical ? "text-amber-400" : "text-[#0F766E]")}>
                    {l.currentStock} / {l.rol}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all",
                    critical ? "bg-amber-400" : "bg-[#0F766E]")}
                    style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
