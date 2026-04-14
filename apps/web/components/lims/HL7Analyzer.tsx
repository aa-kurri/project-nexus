"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function HL7Analyzer() {
  const [logs, setLogs] = useState<string[]>([]);
  const [obxData, setObxData] = useState<any[]>([]);
  const [listening, setListening] = useState(false);

  const startListener = () => {
    setListening(true);
    let step = 0;
    
    const simInterval = setInterval(() => {
      step++;
      const time = new Date().toLocaleTimeString();
      
      if (step === 1) {
        setLogs(prev => [...prev, `[${time}] TCP LISTENER: Connection accepted from 192.168.1.50 (Sysmex-XN)`]);
      } else if (step === 2) {
        setLogs(prev => [...prev, `[${time}] HL7 Parser: Receiving ORU^R01 Message (UID: 8847291)`]);
      } else if (step === 3) {
        setLogs(prev => [...prev, `[${time}] MSH|^~\\&|SYSMEX|LAB|AYURA|HIS|...`]);
        setLogs(prev => [...prev, `[${time}] PID|1||P-1234||Ramesh^Kumar||...`]);
      } else if (step === 4) {
        setLogs(prev => [...prev, `[${time}] OBR|1||S-88231|CBC^Complete Blood Count|...`]);
        setLogs(prev => [...prev, `[${time}] OBX|1|NM|WBC^White Blood Cell|1|8.5|10*3/uL|4.0-11.0|N|||F`]);
        setLogs(prev => [...prev, `[${time}] OBX|2|NM|HGB^Hemoglobin|1|11.2|g/dL|13.0-17.0|L|||F`]);
      } else if (step === 5) {
        setLogs(prev => [...prev, `[${time}] Engine: Mapping OBX segments to standard terminologies...`]);
      } else if (step === 6) {
        setLogs(prev => [...prev, `[${time}] Success: 2 Results committed to database. Returning ACK.`]);
        setObxData([
          { test: 'WBC', value: '8.5', unit: '10*3/uL', ref: '4.0-11.0', flag: 'N' },
          { test: 'Hemoglobin', value: '11.2', unit: 'g/dL', ref: '13.0-17.0', flag: 'L' }
        ]);
        clearInterval(simInterval);
        setListening(false);
      }
    }, 1500);
  };

  return (
    <Card className="max-w-4xl mx-auto p-0 shadow-2xl bg-slate-950 text-emerald-400 font-mono border border-slate-800 overflow-hidden flex flex-col md:flex-row h-[600px]">
      
      {/* Left: Raw Terminal */}
      <div className="w-full md:w-2/3 flex flex-col border-r border-slate-800">
        <div className="bg-slate-900 px-4 py-2 flex justify-between items-center border-b border-slate-800">
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          </div>
          <span className="text-xs text-slate-500 uppercase tracking-widest font-sans font-bold">Ayura TCP // HL7 Listener</span>
        </div>
        
        <ScrollArea className="flex-1 p-4 bg-black/50">
          <div className="space-y-2 text-sm">
            <p className="text-slate-500 mb-4">Ayura Engine v4.2.1 initialized. Binding to port 4444...</p>
            {logs.map((log, i) => (
              <p key={i} className={`${log.includes('OBX') || log.includes('MSH') ? 'text-blue-400' : log.includes('Success') ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                {log}
              </p>
            ))}
            {listening && <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse mt-2"></span>}
          </div>
        </ScrollArea>
        
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-500">Status: {listening ? 'Ingesting stream...' : 'Awaiting traffic'}</span>
          <button 
            onClick={startListener}
            disabled={listening || logs.length > 0}
            className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded hover:bg-emerald-500/30 transition-colors disabled:opacity-50 text-xs uppercase tracking-widest font-bold"
          >
            Force Machine Push
          </button>
        </div>
      </div>

      {/* Right: Parsed Output UI */}
      <div className="w-full md:w-1/3 bg-slate-900 p-6 flex flex-col">
        <h3 className="text-slate-300 font-sans font-bold uppercase tracking-widest text-xs mb-6 pb-2 border-b border-slate-800">Parsed Clinical Data</h3>
        
        {obxData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center opacity-50">
            <div className="text-slate-500 text-sm">No structured data extracted yet.</div>
          </div>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <div className="bg-slate-800/50 p-3 rounded border border-slate-700 mb-6">
               <p className="text-[10px] text-slate-500 uppercase tracking-widest">Target Entity</p>
               <p className="text-sm font-bold text-white font-sans mt-0.5">S-88231 (Ramesh Kumar)</p>
            </div>
          
            {obxData.map((res, i) => (
              <div key={i} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-bold text-slate-200">{res.test}</span>
                  <Badge variant="outline" className={`text-[10px] uppercase font-bold border-none ${res.flag === 'N' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {res.flag === 'N' ? 'Normal' : 'Flagged (Low)'}
                  </Badge>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black text-white">{res.value}</span>
                  <span className="text-xs text-slate-500 mb-1">{res.unit}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 p-1.5 bg-slate-800 rounded">
                  Ref: {res.ref}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </Card>
  );
}
