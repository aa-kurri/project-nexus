"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Bed {
  id: string;
  name: string;
  status: 'vacant' | 'occupied';
  patientId?: string;
  patientName?: string;
}

export default function BedBoard() {
  const [beds, setBeds] = useState<Bed[]>([
    { id: 'b1', name: 'W2-01', status: 'occupied', patientId: 'P-100', patientName: 'Anita R.' },
    { id: 'b2', name: 'W2-02', status: 'vacant' },
    { id: 'b3', name: 'W2-03', status: 'vacant' },
    { id: 'b4', name: 'W2-04', status: 'occupied', patientId: 'P-104', patientName: 'Suresh V.' },
    { id: 'b5', name: 'W2-05', status: 'vacant' },
    { id: 'b6', name: 'W2-06', status: 'vacant' },
  ]);

  const [draggedPatient, setDraggedPatient] = useState<{ id: string, name: string } | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string, name: string) => {
    setDraggedPatient({ id, name });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, bedId: string) => {
    e.preventDefault();
    if (!draggedPatient) return;

    setBeds(beds.map(bed => {
      if (bed.id === bedId && bed.status === 'vacant') {
        return { ...bed, status: 'occupied', patientId: draggedPatient.id, patientName: draggedPatient.name };
      }
      return bed;
    }));
    setDraggedPatient(null);
  };

  return (
    <div className="flex bg-slate-50 min-h-[600px] border border-gray-200 shadow-xl rounded-xl overflow-hidden">
      
      {/* Sidebar: Unassigned Patients */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 shadow-sm z-10 flex flex-col">
        <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm mb-4">Pending Admissions</h3>
        <div className="space-y-3 flex-1 overflow-y-auto pr-2">
          
          <div 
            draggable 
            onDragStart={(e) => handleDragStart(e, 'P-5512', 'Rajesh K.')}
            className="p-3 bg-white border border-[#0F766E]/30 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-[#0F766E] transition-colors"
          >
            <div className="text-sm font-semibold text-[#0F766E]">P-5512</div>
            <div className="text-slate-800 font-medium">Rajesh K.</div>
            <Badge variant="outline" className="mt-2 text-[10px] bg-amber-50 text-amber-700 border-amber-200">ICU Step-down</Badge>
          </div>

          <div 
            draggable 
            onDragStart={(e) => handleDragStart(e, 'P-8899', 'Priya S.')}
            className="p-3 bg-white border border-[#0F766E]/30 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-[#0F766E] transition-colors"
          >
            <div className="text-sm font-semibold text-[#0F766E]">P-8899</div>
            <div className="text-slate-800 font-medium">Priya S.</div>
            <Badge variant="outline" className="mt-2 text-[10px] bg-rose-50 text-rose-700 border-rose-200">Emergency OPD</Badge>
          </div>

        </div>
      </div>

      {/* Main Board: Beds */}
      <div className="flex-1 p-8 bg-slate-50">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Ward 2 Layout</h2>
            <p className="text-sm text-slate-500 mt-1">Drag and drop patients to allocate beds</p>
          </div>
          <div className="flex gap-4 mb-1 text-sm">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300"></span> Vacant</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></span> Occupied</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {beds.map(bed => (
            <Card 
              key={bed.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, bed.id)}
              className={`p-4 h-32 flex flex-col justify-between transition-all duration-300 ${
                bed.status === 'vacant' 
                  ? 'bg-emerald-50/50 border-emerald-200 border-dashed border-2 hover:bg-emerald-100 hover:border-emerald-400' 
                  : 'bg-white shadow-sm border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-700 tracking-wide">{bed.name}</span>
                {bed.status === 'vacant' ? (
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-none text-[10px]">VACANT</Badge>
                ) : (
                  <Badge variant="outline" className="bg-slate-100 text-slate-600 border-none text-[10px]">OCCUPIED</Badge>
                )}
              </div>
              
              {bed.status === 'occupied' && (
                <div className="animate-in fade-in zoom-in duration-300">
                  <div className="text-xs font-semibold text-[#0F766E]">{bed.patientId}</div>
                  <div className="text-sm font-medium text-slate-900 truncate">{bed.patientName}</div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
