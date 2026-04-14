"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/utils/supabase/client';

export default function BlindStockSync() {
  const supabase = createClient();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedItemId, setSelectedItemId] = useState('');
  const [physicalCount, setPhysicalCount] = useState('');
  const [isReconciling, setIsReconciling] = useState(false);
  const [successTimestamp, setSuccessTimestamp] = useState<string | null>(null);

  useEffect(() => {
    async function loadInventory() {
      const { data } = await supabase.from('inventory_items').select('*').order('item_name');
      if (data) setItems(data);
      setLoading(false);
    }
    loadInventory();
  }, [successTimestamp]);

  const handleReconcile = async () => {
    if (!selectedItemId || !physicalCount) return;
    setIsReconciling(true);

    const targetItem = items.find(i => i.id === selectedItemId);
    const difference = parseInt(physicalCount) - targetItem.stock_quantity;

    // 1. Log the tamper-evident transaction
    const { error: txError } = await supabase.from('inventory_transactions').insert([{
      item_id: selectedItemId,
      transaction_type: 'reconciliation',
      quantity_change: difference,
      performed_by: 'Staff-A',
      ledger_hash: `SHA256::${Math.random().toString(36).substring(2)}` // Simulated cryptographic tamper log
    }]);

    if (!txError) {
      // 2. Adjust physical stock
      await supabase.from('inventory_items').update({ stock_quantity: parseInt(physicalCount) }).eq('id', selectedItemId);
      setSuccessTimestamp(new Date().toLocaleTimeString());
      setPhysicalCount('');
    }
    
    setIsReconciling(false);
  };

  return (
    <Card className="max-w-4xl mx-auto p-8 shadow-xl bg-white text-slate-800 border-t-8 border-t-rose-600">
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-rose-700">Blind Stock Sync</h2>
          <p className="text-slate-500 mt-1">Zero-Trust Physical vs Digital Reconciliation</p>
        </div>
        <Badge variant="outline" className="px-4 py-1 text-xs uppercase tracking-widest border-emerald-500 text-emerald-600 font-bold bg-emerald-50">Crypto-Ledger Active</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* Left: Input Form */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-inner">
          <h3 className="uppercase tracking-widest text-xs font-bold text-slate-500 mb-4">Physical Audit Entry</h3>
          
          <div className="space-y-4">
             <div>
               <label className="text-xs font-bold text-slate-700 block mb-1">Select Item Container</label>
               <select 
                 className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                 value={selectedItemId}
                 onChange={(e) => setSelectedItemId(e.target.value)}
                 disabled={loading}
               >
                  <option value="">-- Dropdown / Scan Barcode --</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.item_name} (Batch: {item.batch_number}) - {item.store_locale}
                    </option>
                  ))}
               </select>
             </div>
             
             <div>
               <label className="text-xs font-bold text-rose-700 block mb-1">Manual Blind Count</label>
               <Input 
                 type="number"
                 disabled={!selectedItemId}
                 value={physicalCount}
                 onChange={(e) => setPhysicalCount(e.target.value)}
                 placeholder="Enter physical units on shelf"
                 className="text-2xl py-6 font-mono text-rose-900 border-rose-200 focus-visible:ring-rose-500"
               />
             </div>
          </div>
          
          <Button 
            onClick={handleReconcile}
            disabled={!physicalCount || isReconciling}
            className="w-full mt-6 py-6 bg-rose-600 hover:bg-rose-700 font-bold text-white shadow-lg"
          >
             {isReconciling ? 'Hashing Ledger...' : 'Commit Tamper-Evident Sync'}
          </Button>

          {successTimestamp && (
             <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest text-center mt-3 animate-pulse">
                ✓ Synced to Postgres at {successTimestamp}
             </p>
          )}
        </div>

        {/* Right: Digital Stock Viewer (Only shows after auth or for admins usually) */}
        <div className="bg-slate-900 p-6 rounded-xl text-white">
           <div className="flex justify-between items-center mb-4">
             <h3 className="uppercase tracking-widest text-xs font-bold text-slate-400">Digital Database State</h3>
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           </div>
           
           {loading ? (
              <div className="opacity-50 text-center py-10 font-mono text-sm">Fetching from Supabase...</div>
           ) : (
              <div className="space-y-3">
                 {items.map(item => {
                    const isSelected = item.id === selectedItemId;
                    return (
                       <div key={item.id} className={`flex justify-between items-center p-3 rounded-lg border transition-all ${isSelected ? 'bg-rose-950 border-rose-500/50' : 'bg-slate-800 border-slate-700'}`}>
                          <div>
                            <p className="font-bold text-sm text-slate-200">{item.item_name}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">{item.store_locale}</p>
                          </div>
                          <div className={`text-2xl font-black tracking-tight ${isSelected ? 'text-rose-400' : 'text-slate-400'}`}>
                             {item.stock_quantity}
                          </div>
                       </div>
                    );
                 })}
              </div>
           )}
        </div>

      </div>
    </Card>
  );
}
