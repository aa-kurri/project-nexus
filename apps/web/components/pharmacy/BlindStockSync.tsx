"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BlindStockSync() {
  const [synced, setSynced] = useState(false);

  const handleSync = () => {
    // 2026 E-Pharmacy blind-physical-stock reconciliation simulation
    console.log("Hashing ledger records via Merkle-tree for Tamper-Evident log...");
    setTimeout(() => setSynced(true), 1500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#0F766E]">Ayura Pharmacy Ledger</h2>
          <p className="text-muted-foreground mt-2">Zero-Trust Blind Physical Stock Reconciliation (SPRINT 0)</p>
        </div>
        <Button 
          onClick={handleSync} 
          disabled={synced}
          className="mt-4 md:mt-0 bg-[#0F766E] hover:bg-[#115E59] text-white"
        >
          {synced ? "Ledger Synced & Hashed" : "Initialize Blind Sync"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="p-6 border-l-4 border-l-[#0F766E]">
          <h3 className="text-sm font-medium text-gray-500 uppercase">System Stock Count</h3>
          <p className="text-4xl font-extrabold mt-2 filter blur-sm hover:blur-none transition-all cursor-crosshair" title="Hover to reveal system baseline">
            14,240
          </p>
        </Card>

        <Card className="p-6 border-l-4 border-emerald-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Scanned Inventory</h3>
          <p className="text-4xl font-extrabold mt-2">
            14,238
          </p>
        </Card>

        <Card className="p-6 border-l-4 border-rose-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Variance Detected</h3>
          <p className="text-4xl font-extrabold mt-2 text-rose-500">
            -2 Units
          </p>
        </Card>
      </div>

      {synced && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 animate-in fade-in slide-in-from-bottom-4">
          <p className="font-medium">✅ Reconciliation hash committed to tamper-evident Supabase layer block 0xAF32...</p>
        </div>
      )}
    </div>
  );
}
