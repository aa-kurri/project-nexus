"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function LiveQueueBoard() {
  const supabase = createClient();
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    // 1. Initial Load of the Queue
    async function fetchQueue() {
      const { data } = await supabase.from('opd_queue').select('*').neq('status', 'completed');
      if (data) setQueue(data);
    }
    fetchQueue();

    // 2. Realtime WebSocket Hook!
    const channel = supabase.channel('opd-stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'opd_queue' },
        (payload) => {
          // Whenever the nurse saves a record, it instantly re-renders the wall TV safely.
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const pingMockData = async () => {
     const { data } = await supabase.from('tenants').select('id').limit(1).single();
     if(data) {
        await supabase.from('opd_queue').insert([
          { tenant_id: data.id, token_number: 'N-' + Math.floor(Math.random() * 999), room: 'Room ' + Math.ceil(Math.random() * 5), status: 'waiting' }
        ]);
     }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="relative z-10 flex justify-between items-center mb-12 border-b border-slate-800 pb-6">
        <div>
           <h1 className="text-4xl font-black text-emerald-400 tracking-tight flex items-center gap-4">
              OPD Token Queue
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
           </h1>
           <p className="text-slate-400 font-mono mt-2 tracking-widest text-sm uppercase">WebSocket Stream Active</p>
        </div>
        <div className="text-right">
           <p className="text-2xl font-bold text-white">{new Date().toLocaleTimeString()}</p>
           <button onClick={pingMockData} className="px-3 py-1 bg-slate-800 text-xs mt-2 text-slate-400 rounded hover:text-white transition-colors">Test WebSocket DB Push</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        
        {/* Currently Consulting */}
        <div className="bg-slate-800/50 rounded-3xl p-8 border border-emerald-500/30">
          <h2 className="text-2xl font-bold text-slate-300 mb-8 uppercase tracking-widest text-center">Inside Room</h2>
          <div className="space-y-6">
             {queue.filter(q => q.status === 'consulting').length === 0 ? (
               <div className="text-center py-10 opacity-50 font-mono tracking-widest text-slate-500">Awaiting Doctor</div>
             ) : (
               queue.filter(q => q.status === 'consulting').map(q => (
                 <div key={q.id} className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl animate-in zoom-in">
                    <span className="text-6xl font-black text-white">{q.token_number}</span>
                    <span className="text-3xl font-bold text-emerald-400 tracking-tighter">{q.room}</span>
                 </div>
               ))
             )}
          </div>
        </div>

        {/* Waiting List */}
        <div className="bg-slate-950/50 rounded-3xl p-8 border border-slate-800">
           <h2 className="text-2xl font-bold text-slate-500 mb-8 uppercase tracking-widest text-center">Please Wait</h2>
           <div className="grid grid-cols-2 gap-4">
              {queue.filter(q => q.status === 'waiting').length === 0 ? (
                 <div className="col-span-2 text-center py-10 opacity-50 font-mono tracking-widest text-slate-600">Queue is empty</div>
              ) : (
                 queue.filter(q => q.status === 'waiting').slice(0, 10).map(q => (
                    <div key={q.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center flex flex-col items-center justify-center animate-in slide-in-from-right-4 transition-all duration-300">
                       <span className="text-3xl font-bold text-slate-300">{q.token_number}</span>
                       <span className="text-xs text-slate-600 mt-1 uppercase font-bold tracking-widest">{q.room} / Queue</span>
                    </div>
                 ))
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
