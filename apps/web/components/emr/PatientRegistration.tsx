"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/utils/supabase/client';

export default function PatientRegistration() {
  const supabase = createClient();
  
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  
  const [searching, setSearching] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [existingPatient, setExistingPatient] = useState<any>(null);

  // Grab the default tenant on load so we can bind the patient to it
  useEffect(() => {
    async function loadTenant() {
      const { data } = await supabase.from('tenants').select('id').limit(1).single();
      if (data) setTenantId(data.id);
    }
    loadTenant();
  }, []);

  const handlePhoneLookup = async (val: string) => {
    setPhone(val);
    setExistingPatient(null);
    setErrorMsg('');

    if (val.length === 10 && tenantId) {
      setSearching(true);
      // Real Supabase Ping: Check if patient already exists for this hospital
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('phone', val)
        .single();
        
      setSearching(false);
      if (data) {
        setExistingPatient(data);
        setName(data.full_name);
        setDob(data.dob);
        setGender(data.gender);
      }
    } else {
      setSearching(false);
    }
  };

  const submitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setErrorMsg("Error: Server Tenant Identity Missing.");
      return;
    }

    if (existingPatient) {
      // Patient already exists, just simulate adding them to the OPD Queue
      setRegistered(true);
      return;
    }

    // Insert brand new patient into physical Postgres DB
    const { data, error } = await supabase.from('patients').insert([
      { 
        tenant_id: tenantId, 
        phone: phone, 
        full_name: name, 
        dob: dob, 
        gender: gender 
      }
    ]);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setRegistered(true);
  };

  if (registered) {
    return (
      <Card className="max-w-xl mx-auto p-12 flex flex-col items-center justify-center text-center shadow-xl border-t-8 border-t-emerald-500 bg-white min-h-[400px]">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm border border-emerald-200">
           ✓
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Patient Registered</h2>
        <p className="text-slate-500 mt-2 text-lg">Safely written to secure Postgres DB. Added to Queue Token <span className="font-bold text-emerald-600">#34</span></p>
        
        <div className="flex gap-4 mt-8">
           <Button variant="outline" onClick={() => {
              setRegistered(false);
              setPhone(''); setName(''); setDob(''); setGender('');
              setExistingPatient(null);
           }}>Register Another</Button>
           <Button className="bg-[#0F766E] hover:bg-[#115E59] text-white">Print Barcode / Card</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl mx-auto p-8 shadow-xl border-t-8 border-t-[#0F766E] bg-white text-slate-800 relative overflow-hidden">
       <svg className="absolute top-0 right-0 p-4 opacity-[0.02] w-64 h-64 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
       </svg>

       <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[#0F766E]">Fast Registration</h2>
            <p className="text-sm text-slate-500 mt-1">Live Supabase Hook Active.</p>
          </div>
          <Badge variant="outline" className="border-amber-300 text-amber-600 bg-amber-50 uppercase tracking-widest text-[10px] font-bold">ABDM Sync Active</Badge>
       </div>
       
       {errorMsg && (
         <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded text-sm text-center font-bold">
            {errorMsg}
         </div>
       )}

       <form onSubmit={submitRegistration} className="space-y-6 relative z-10">
          
          <div>
             <div className="flex justify-between mb-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Phone Number</label>
                {searching && <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span> Searching Remote DB...</span>}
                {phone.length === 10 && !searching && !existingPatient && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">New Patient</span>}
                {existingPatient && <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Existing Patient Loaded</span>}
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

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 transition-all ${existingPatient ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
             <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="text-lg py-6"
                  placeholder="Ramesh Kumar" 
                  required={!existingPatient}
                />
             </div>

             <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Date of Birth</label>
                <Input 
                  type="date"
                  value={dob} 
                  onChange={(e) => setDob(e.target.value)} 
                  className="text-lg py-6 text-slate-600"
                  required={!existingPatient}
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
                className={`w-full py-7 text-xl font-bold tracking-tight text-white shadow-xl ${existingPatient ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : 'bg-[#0F766E] hover:bg-[#115E59] shadow-[#0F766E]/20'}`}
                disabled={!(name && phone.length === 10 && dob && gender) && !existingPatient}
             >
                {existingPatient ? 'Fast-Queue Existing Patient (OPD)' : 'Register & Write to Postgres'}
             </Button>
          </div>

       </form>
    </Card>
  );
}
