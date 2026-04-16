"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, User, Clock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function OTScheduler() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOT() {
      const { data } = await supabase
        .from("ot_bookings")
        .select(`
          *,
          patient:patient_id(full_name, mrn),
          surgeon:surgeon_id(full_name),
          room:ot_id(name)
        `)
        .order("scheduled_at", { ascending: true });
      
      setBookings(data || []);
      setIsLoading(false);
    }
    loadOT();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Operation Theatre</h1>
          <p className="text-slate-500 font-medium">Surgical schedules and resource allocation</p>
        </div>
        <Button className="bg-[#0F766E] hover:bg-[#115E59] gap-2">
          <Plus className="w-4 h-4" /> Schedule Surgery
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#0F766E] mb-4">Today's Procedures</h2>
          
          {bookings.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2 bg-slate-50/50">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No surgeries scheduled</p>
            </Card>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.id} className="p-5 hover:shadow-xl transition-all border-l-4 border-[#0F766E] flex justify-between items-center group">
                <div className="flex gap-6">
                  <div className="text-center min-w-[60px] border-r pr-6">
                    <p className="text-lg font-black text-slate-800">
                      {new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">{booking.duration_mins}m</p>
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-slate-900 group-hover:text-[#0F766E] transition-colors">{booking.procedure_name}</h3>
                    <div className="flex gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <User className="w-3 h-3 text-slate-400" /> {booking.patient?.full_name} ({booking.patient?.mrn})
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <CheckCircle2 className="w-3 h-3 text-[#0F766E]" /> {booking.surgeon?.full_name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-600 border border-slate-200">
                    {booking.room?.name}
                  </span>
                  <p className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${
                    booking.status === 'scheduled' ? 'text-blue-500' : 'text-emerald-500'
                  }`}>
                    {booking.status}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* OT Resources / Rooms */}
        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Resource Status</h2>
          <Card className="p-6 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Clock className="w-24 h-24" />
            </div>
            <p className="text-[10px] font-bold text-[#0F766E] uppercase tracking-widest mb-1">Live Occupancy</p>
            <h3 className="text-4xl font-black mb-2">2 / 4</h3>
            <p className="text-xs text-slate-400">OT Rooms currently active</p>
            <div className="mt-6 flex flex-col gap-3">
              {['OT-1 (Main)', 'OT-2 (Cardiac)', 'OT-3 (Minor)', 'OT-4 (Emergency)'].map((room, i) => (
                <div key={room} className="flex justify-between items-center p-2 bg-slate-800 rounded border border-slate-700">
                  <span className="text-xs font-bold">{room}</span>
                  <span className={`w-2 h-2 rounded-full ${i < 2 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white border-slate-200">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
               <Plus className="w-4 h-4 text-[#0F766E]" /> Surgical Checklist
            </h3>
            <div className="space-y-3">
              {['Consent Form Signed', 'Anesthesia Clearance', 'Pre-op Vitals Checked', 'Instrument Sterilization'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded border-2 border-slate-200"></div>
                  <span className="text-xs text-slate-600 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
