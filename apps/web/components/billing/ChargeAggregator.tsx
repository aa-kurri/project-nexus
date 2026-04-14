"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChargeItem {
  id: string;
  source: 'OPD' | 'LIMS' | 'PHARMACY' | 'IPD';
  description: string;
  amount: number;
  hsnCode: string;
  gstPercent: number;
}

export default function ChargeAggregator() {
  const [items, setItems] = useState<ChargeItem[]>([
    { id: '1', source: 'OPD', description: 'Consultation - Dr. Rao', amount: 500, hsnCode: '999312', gstPercent: 0 },
    { id: '2', source: 'LIMS', description: 'CBC (Complete Blood Count)', amount: 350, hsnCode: '999316', gstPercent: 0 },
    { id: '3', source: 'PHARMACY', description: 'Paracetamol 500mg Strip', amount: 20, hsnCode: '30049099', gstPercent: 12 },
  ]);

  const [settled, setSettled] = useState(false);

  const calculateSubtotal = () => items.reduce((acc, item) => acc + item.amount, 0);
  const calculateTotalGST = () => items.reduce((acc, item) => acc + (item.amount * item.gstPercent / 100), 0);
  const calculateGrandTotal = () => calculateSubtotal() + calculateTotalGST();

  const handleSettle = () => {
    setSettled(true);
    // Simulate Supabase RPC trigger for auto-reconciliation
  };

  const getSourceColor = (source: string) => {
    switch(source) {
      case 'OPD': return 'bg-indigo-100 text-indigo-700';
      case 'LIMS': return 'bg-rose-100 text-rose-700';
      case 'PHARMACY': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Card className="max-w-4xl mx-auto p-8 shadow-xl bg-white border-t-8 border-t-[#0F766E]">
      <div className="flex justify-between items-start border-b pb-6 mb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Encounter Billing</h2>
          <p className="text-slate-500 mt-1">Encounter ID: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">E-77</span> | Patient: <span className="font-semibold text-[#0F766E]">P-1234 (Ramesh Kumar)</span></p>
        </div>
        <Badge variant="outline" className={`px-4 py-1 text-sm font-bold uppercase tracking-wider border-2 ${settled ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-amber-500 text-amber-600 bg-amber-50'}`}>
          {settled ? 'Reconciled' : 'Draft'}
        </Badge>
      </div>

      <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-8">
        <table className="w-full text-left">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Source</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description / HSN</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">GST</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => {
              const gstValue = item.amount * item.gstPercent / 100;
              return (
                <tr key={item.id} className="hover:bg-white transition-colors">
                  <td className="py-4 px-4">
                    <Badge variant="secondary" className={`text-[10px] font-bold tracking-widest ${getSourceColor(item.source)}`}>
                      {item.source}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-slate-800">{item.description}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">HSN: {item.hsnCode}</p>
                  </td>
                  <td className="py-4 px-4 text-right font-medium text-slate-600">₹ {item.amount.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-xs text-slate-400 mr-2">{item.gstPercent > 0 ? `${item.gstPercent}%` : 'NIL'}</span>
                    <span className="font-medium text-slate-600">₹ {gstValue.toFixed(2)}</span>
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-[#0F766E]">₹ {(item.amount + gstValue).toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="w-full md:w-1/2">
          {settled && (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 animate-in fade-in slide-in-from-left-4">
              <p className="font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Auto-Captured & Reconciled
              </p>
              <p className="text-sm mt-1">Payment processed via zero-trust checkout. Ledger hash committed.</p>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-1/3 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm font-medium text-slate-600">
              <span>Subtotal</span>
              <span>₹ {calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-slate-600">
              <span>GST Total</span>
              <span>₹ {calculateTotalGST().toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between text-xl font-bold text-slate-900">
              <span>Grand Total</span>
              <span>₹ {calculateGrandTotal().toFixed(2)}</span>
            </div>
          </div>
          
          <Button 
            onClick={handleSettle} 
            disabled={settled}
            className="w-full bg-[#0F766E] hover:bg-[#115E59] text-white py-6"
          >
            {settled ? "Generate Receipt" : "Settle Bill"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
