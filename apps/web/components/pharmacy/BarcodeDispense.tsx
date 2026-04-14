"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scan, CheckCircle2, PackageCheck, AlertTriangle } from "lucide-react";

interface DispenseLine {
  drug: string;
  batch: string;
  expiry: string;
  qty: number;
  unit: string;
}

const RX: DispenseLine = {
  drug: "Paracetamol 500mg",
  batch: "BATCH-2024-11",
  expiry: "2026-11-30",
  qty: 10,
  unit: "tab",
};

type Step = "scan" | "confirm" | "done";

export default function BarcodeDispense() {
  const [step, setStep]     = useState<Step>("scan");
  const [barcode, setBarcode] = useState("");
  const [error, setError]   = useState("");

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode === "8901012345678") {
      setError("");
      setStep("confirm");
    } else {
      setError("Barcode not matched to any active Rx — check patient wristband.");
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h2 className="text-xl font-bold text-fg flex items-center gap-2">
          <Scan className="h-5 w-5 text-[#0F766E]" /> Barcode Dispense (FEFO)
        </h2>
        <p className="text-sm text-muted mt-0.5">Scan drug barcode to auto-select FEFO batch for Rx R-998</p>
      </div>

      {/* Active Rx */}
      <Card className="border-[#0F766E]/30 bg-[#0F766E]/5 p-4">
        <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Active Rx · R-998</p>
        <p className="font-semibold text-fg">{RX.drug} × {RX.qty} {RX.unit}</p>
        <p className="text-xs text-muted mt-0.5">Patient: Ramesh Kumar · Dr. Sharma</p>
      </Card>

      {step === "scan" && (
        <form onSubmit={handleScan} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase tracking-wider text-muted">Scan / enter barcode</label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. 8901012345678"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                autoFocus
                className="font-mono"
              />
              <Button type="submit" disabled={!barcode}
                className="bg-[#0F766E] hover:bg-[#115E59] text-white shrink-0">
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-sm text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> {error}
            </p>
          )}
          <p className="text-[11px] text-muted">Hint: try <span className="font-mono">8901012345678</span></p>
        </form>
      )}

      {step === "confirm" && (
        <Card className="p-4 space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-[#0F766E] font-semibold">
            <PackageCheck className="h-5 w-5" /> FEFO batch auto-selected
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted">Batch</p>
              <p className="font-mono font-semibold text-fg">{RX.batch}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted">Expiry</p>
              <p className="font-mono font-semibold text-fg">{RX.expiry}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted">Qty to dispense</p>
              <p className="font-semibold text-fg">{RX.qty} {RX.unit}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted">Status</p>
              <Badge variant="outline" className="border-[#0F766E]/50 text-[#0F766E] bg-[#0F766E]/10 mt-1">
                Ready
              </Badge>
            </div>
          </div>
          <Button className="w-full bg-[#0F766E] hover:bg-[#115E59] text-white"
            onClick={() => setStep("done")}>
            Confirm Dispense — decrement stock
          </Button>
        </Card>
      )}

      {step === "done" && (
        <Card className="p-6 flex flex-col items-center gap-3 animate-in zoom-in">
          <CheckCircle2 className="h-10 w-10 text-[#0F766E]" />
          <p className="font-bold text-fg">Dispensed successfully</p>
          <p className="text-sm text-muted text-center">
            Stock decremented · Rx R-998 marked complete · Audit log entry written
          </p>
          <Button variant="outline" size="sm" onClick={() => { setStep("scan"); setBarcode(""); }}>
            Next patient
          </Button>
        </Card>
      )}
    </div>
  );
}
