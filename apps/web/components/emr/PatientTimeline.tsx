"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Encounter {
  id: string;
  date: string;
  module: 'OPD' | 'LAB' | 'IPD';
  details: string;
  flag?: 'normal' | 'abnormal' | 'critical';
}

const mockEncounters: Encounter[] = [
  { id: '1', date: '2026-04-14 10:30 AM', module: 'LAB', details: 'Comprehensive Metabolic Panel', flag: 'abnormal' },
  { id: '2', date: '2026-03-22 09:15 AM', module: 'OPD', details: 'Follow-up Consult - Dr. Rao' },
  { id: '3', date: '2026-03-10 14:00 PM', module: 'IPD', details: 'Discharge Summary Finalized' },
  { id: '4', date: '2026-03-08 23:45 PM', module: 'IPD', details: 'Emergency Admission - Acute Appendicitis', flag: 'critical' },
];

export default function PatientTimeline() {
  return (
    <Card className="w-full max-w-lg h-[600px] flex flex-col shadow-lg border-t-4 border-t-[#0F766E]">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-[#0F766E]">Clinical Timeline</h2>
          <p className="text-xs text-muted-foreground mt-1">Aggregated 360° View</p>
        </div>
        <Badge variant="outline" className="text-xs border-[#0F766E] text-[#0F766E]">Real-time</Badge>
      </div>
      
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
          {mockEncounters.map((event, idx) => (
            <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#0F766E] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform duration-300 group-hover:scale-110">
                <span className="text-xs font-bold">{event.module}</span>
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#0F766E]/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-400">{event.date}</span>
                  {event.flag && (
                    <Badge variant={event.flag === 'abnormal' ? 'destructive' : 'default'} className="uppercase text-[10px] tracking-widest px-2 py-0.5">
                      {event.flag}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800">{event.details}</p>
                <div className="mt-3 flex gap-2">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded cursor-pointer hover:bg-slate-200 transition-colors">
                    View Record
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
