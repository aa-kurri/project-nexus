"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Bed {
  id: string;
  bed_number: string;
  ward: string;
  status: 'vacant' | 'occupied' | 'cleaning';
}

export default function BedBoard() {
  const supabase = createClient();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initBeds() {
      const { data } = await supabase.from('beds').select('*');
      if (data) setBeds(data as Bed[]);
      setLoading(false);
    }
    initBeds();

    // Listen for drag-drop real-time updates across the ward
    const channel = supabase.channel('beds-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'beds' }, (payload) => {
        setBeds(current => current.map(bed => bed.id === payload.new.id ? payload.new as Bed : bed));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSimulateAdmission = async (bedId: string) => {
    // Simulate drop: Changing bed status live
    await supabase.from('beds').update({ status: 'occupied' }).eq('id', bedId);
  };

  const handleSimulateDischarge = async (bedId: string) => {
    await supabase.from('beds').update({ status: 'cleaning' }).eq('id', bedId);
    setTimeout(async () => {
       await supabase.from('beds').update({ status: 'vacant' }).eq('id', bedId);
    }, 4000);
  };

  return (
    <div className="bg-slate-100 min-h-[600px] rounded-3xl p-8 border border-slate-200 shadow-inner">
      <div className="flex justify-between items-center mb-8">
         <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">IPD Floor Plan</h2>
            <p className="text-slate-500 mt-1 font-medium">Real-time Ward State & Admission Routing</p>
         </div>
         <div className="flex gap-4">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500"><span className="w-3 h-3 bg-white border-2 border-slate-300 rounded-full"></span> Vacant</span>
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600"><span className="w-3 h-3 bg-emerald-500 rounded-full"></span> Occupied</span>
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-500"><span className="w-3 h-3 bg-amber-400 rounded-full"></span> Cleaning</span>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm p-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Pending Admissions</h3>
            <div className="space-y-3">
               <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md transition-all">
                  <p className="font-bold text-indigo-900 text-sm">P-9912 (Sunita R.)</p>
                  <p className="text-xs text-indigo-500 mt-1 uppercase font-bold tracking-wider">Requested: General Ward</p>
               </div>
               <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md transition-all">
                  <p className="font-bold text-rose-900 text-sm">P-7811 (Arjun K.)</p>
                  <p className="text-xs text-rose-500 mt-1 uppercase font-bold tracking-wider">Requested: ICU (Priority!)</p>
               </div>
               <p className="text-xs text-slate-400 italic text-center p-4">Drag cards to assign beds</p>
            </div>
         </div>

         <div className="lg:col-span-3">
            {loading ? (
               <div className="flex justify-center items-center h-full opacity-50">Loading Physical Beds from Database...</div>
            ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {beds.map(bed => (
                     <div key={bed.id} className={`h-32 rounded-2xl border-2 transition-all flex flex-col justify-between p-4 ${
                        bed.status === 'vacant' ? 'bg-white border-slate-200 hover:border-indigo-400 border-dashed' :
                        bed.status === 'occupied' ? 'bg-emerald-50 border-emerald-500 shadow-sm' :
                        'bg-amber-50 border-amber-400 opacity-80'
                     }`}>
                        <div className="flex justify-between items-start">
                           <span className={`font-black text-xl tracking-tight ${bed.status === 'vacant' ? 'text-slate-400' : bed.status === 'occupied' ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {bed.bed_number}
                           </span>
                           <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${
                              bed.status === 'vacant' ? 'bg-slate-100 text-slate-500' : 
                              bed.status === 'occupied' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                           }`}>{bed.ward}</span>
                        </div>
                        
                        <div className="flex justify-between items-end">
                           <p className={`text-xs font-bold uppercase tracking-widest ${bed.status === 'vacant' ? 'text-slate-400' : bed.status === 'occupied' ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {bed.status}
                           </p>

                           {bed.status === 'vacant' && (
                              <button onClick={() => handleSimulateAdmission(bed.id)} className="text-[10px] bg-slate-800 text-white px-2 py-1 rounded hover:bg-slate-700">Simulate Drop</button>
                           )}
                           {bed.status === 'occupied' && (
                              <button onClick={() => handleSimulateDischarge(bed.id)} className="text-[10px] bg-rose-100 text-rose-600 font-bold px-2 py-1 rounded hover:bg-rose-200">Discharge</button>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
