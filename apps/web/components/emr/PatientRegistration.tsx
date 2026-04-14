"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PatientRegistration() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [searching, setSearching] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handlePhoneLookup = (val: string) => {
    setPhone(val);
    if (val.length === 10) {
      setSearching(true);
      // Simulate real-time dedup search
      setTimeout(() => setSearching(false), 800);
    } else {
      setSearching(false);
    }
  };

  const submitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate Supabase insert + add to today's queue
    setTimeout(() => {
      setRegistered(true);
    }, 500);
  };

  if (registered) {
    return (
      <Card className="max-w-xl mx-auto p-12 flex flex-col items-center justify-center text-center shadow-xl border-t-8 border-t-emerald-500 bg-white min-h-[400px]">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm border border-emerald-200">
           ✓
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Patient Registered</h2>
        <p className="text-slate-500 mt-2 text-lg">Added to OPD Queue with Token <span className="font-bold text-emerald-600">#34</span></p>
        
        <div className="flex gap-4 mt-8">
           <Button variant="outline" onClick={() => {
              setRegistered(false);
              setPhone(''); setName(''); setDob(''); setGender('');
           }}>Register Another</Button>
           <Button className="bg-[#0F766E] hover:bg-[#115E59] text-white">Print Barcode / Card</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl mx-auto p-8 shadow-xl border-t-8 border-t-[#0F766E] bg-white text-slate-800 relative overflow-hidden">
       {/* Background graphic */}
       <svg className="absolute top-0 right-0 p-4 opacity-[0.02] w-64 h-64 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
       </svg>

       <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[#0F766E]">Fast Registration</h2>
            <p className="text-sm text-slate-500 mt-1">Goal: &lt; 45 seconds</p>
          </div>
          <Badge variant="outline" className="border-amber-300 text-amber-600 bg-amber-50 uppercase tracking-widest text-[10px] font-bold">ABDM Sync Active</Badge>
       </div>

       <form onSubmit={submitRegistration} className="space-y-6 relative z-10">
          
          <div>
             <div className="flex justify-between mb-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Phone Number</label>
                {searching && <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span> Searching DB...</span>}
                {phone.length === 10 && !searching && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">No Existing Record Found</span>}
             </div>
             <div className="flex">
                <span className="flex items-center justify-center bg-slate-100 border border-r-0 border-slate-300 px-4 text-slate-500 font-bold rounded-l-md">+91</span>
                <Input 
                   autoFocus
                   type="tel" 
                   maxLength={10}
                   value={phone}
                   onChange={(e) => handlePhoneLookup(e.target.value)}
                   className="rounded-l-none text-xl py-6 tracking-widest font-mono"
                   placeholder="9876543210"
                   required
                />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 opacity-100 transition-opacity">
             <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="text-lg py-6"
                  placeholder="Ramesh Kumar" 
                  required 
                />
             </div>

             <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Date of Birth</label>
                <Input 
                  type="date"
                  value={dob} 
                  onChange={(e) => setDob(e.target.value)} 
                  className="text-lg py-6 text-slate-600"
                  required 
                />
             </div>

             <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Gender</label>
                <div className="flex gap-2">
                   {['M', 'F', 'O'].map(g => (
                      <button 
                         key={g} 
                         type="button"
                         onClick={() => setGender(g)}
                         className={`flex-1 py-3 text-lg font-bold rounded border transition-all ${
                            gender === g 
                              ? 'bg-[#0F766E] border-[#0F766E] text-white shadow-md' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-600'
                         }`}
                      >
                         {g}
                      </button>
                   ))}
                </div>
             </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
             <Button 
                type="submit" 
                className="w-full py-7 text-xl font-bold tracking-tight bg-[#0F766E] hover:bg-[#115E59] text-white shadow-xl shadow-[#0F766E]/20"
                disabled={!(name && phone.length === 10 && dob && gender)}
             >
                Register & Add to OPD
             </Button>
          </div>

       </form>
    </Card>
  );
}
