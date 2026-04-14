"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function BarcodeTracker() {
  const [scanned, setScanned] = useState(false);

  const handleScan = () => {
    // 2026: Hardware barcode scanner integration via HID simulation
    setScanned(true);
  };

  return (
    <Card className="max-w-2xl mx-auto p-8 shadow-xl bg-slate-900 text-white border-t-8 border-t-blue-500 relative overflow-hidden">
      {/* Decorative background grid */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="relative z-10 flex justify-between items-start mb-8 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-blue-400">LIMS Barcode Matrix</h2>
          <p className="text-slate-400 mt-1">Zero-Error Tube Tracking Protocol</p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <Badge variant="outline" className={`px-4 py-1 text-xs font-bold uppercase tracking-wider ${scanned ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' : 'border-amber-500 text-amber-400 bg-amber-500/10'}`}>
              {scanned ? 'S-88231 Linked' : 'Awaiting Scan'}
           </Badge>
           {scanned && <span className="text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">Order O-441 Active</span>}
        </div>
      </div>

      <div className="relative z-10 space-y-8">
        {/* Mock Scanner input / output */}
        <div className={`p-6 rounded-xl border flex flex-col items-center justify-center transition-all duration-700 ${scanned ? 'bg-slate-800 border-emerald-500/50' : 'bg-slate-950 border-slate-800'}`}>
           {!scanned ? (
             <div className="text-center py-6">
                <div className="w-64 h-24 border-2 border-dashed border-slate-600 mb-4 mx-auto flex items-center justify-center relative">
                   <div className="absolute w-full h-[2px] bg-red-500/50 animate-[scan_2s_ease-in-out_infinite_alternate]"></div>
                </div>
                <p className="text-slate-500 font-mono text-sm uppercase tracking-[0.2em]">Ready for 1D/2D Input</p>
             </div>
           ) : (
             <div className="text-center py-6 animate-in zoom-in duration-500">
                <div className="text-6xl mb-4">🧬</div>
                <h3 className="text-2xl font-black text-white font-mono tracking-widest">S-88231</h3>
                <p className="text-emerald-400 font-bold mt-2">Sample Registered: CBC + LFT</p>
             </div>
           )}
        </div>

        {scanned && (
          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4">
             <div className="bg-slate-800 p-4 rounded-lg">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Patient Mapping</h4>
                <p className="font-bold text-lg text-blue-300">P-1234 (Ramesh Kumar)</p>
             </div>
             <div className="bg-slate-800 p-4 rounded-lg">
                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Pre-Analytical Step</h4>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                   <p className="font-bold text-sm text-slate-300">Received at Bench A</p>
                </div>
             </div>
          </div>
        )}

        <div className="flex justify-center pt-4">
           <Button 
             onClick={handleScan}
             disabled={scanned}
             className={`px-8 py-6 rounded-full font-bold transition-all ${
                scanned 
                  ? 'bg-slate-800 text-slate-600 border border-slate-700' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
             }`}
           >
              {scanned ? 'Scanner Locked to Order' : 'Simulate Hardware Scan'}
           </Button>
        </div>
      </div>
    </Card>
  );
}
