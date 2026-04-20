"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TenantOnboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    hospitalName: '',
    brandColor: '#0F766E',
    modules: {
      opd: true,
      ipd: true,
      lims: false,
      pharmacy: false,
    },
    adminEmail: ''
  });

  const toggleModule = (mod: keyof typeof formData.modules) => {
    setFormData(prev => ({
      ...prev,
      modules: { ...prev.modules, [mod]: !prev.modules[mod] }
    }));
  };

  const finalizeTenant = () => {
    setLoading(true);
    // Simulate Supabase edge-function provisioning RLS
    setTimeout(() => {
      setStep(4);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="flex items-center justify-center p-8 bg-slate-100 min-h-[600px]">
      <Card className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left pane: Wizard Progress */}
        <div className="md:w-1/3 bg-slate-900 p-8 text-white flex flex-col items-start justify-center border-r-4" style={{ borderColor: formData.brandColor }}>
           <h2 className="text-xl font-bold tracking-tight mb-8 drop-shadow-md">Ayura Provisioning</h2>
           
           <div className="space-y-6">
              {[1, 2, 3].map(num => (
                 <div key={num} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                       step === num ? 'bg-white text-slate-900 shadow-lg scale-110' : 
                       step > num ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'
                    }`}>
                       {step > num ? '✓' : num}
                    </div>
                    <span className={`text-sm font-medium ${step === num ? 'text-white' : 'text-slate-500'}`}>
                       {num === 1 ? 'Hospital Brand' : num === 2 ? 'Active Modules' : 'Admin Setup'}
                    </span>
                 </div>
              ))}
           </div>
        </div>

        {/* Right pane: Forms */}
        <div className="md:w-2/3 p-10 bg-white relative min-h-[400px] flex flex-col justify-center">
           {step === 1 && (
             <div className="animate-in fade-in slide-in-from-right-4">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">Hospital Identity</h3>
                <div className="space-y-4">
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Hospital Name</label>
                      <Input 
                        value={formData.hospitalName} 
                        onChange={e => setFormData({...formData, hospitalName: e.target.value})} 
                        placeholder="City General Clinics"
                        className="text-lg py-6"
                      />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Primary Hex Color</label>
                      <div className="flex gap-2">
                         <div className="w-12 h-12 rounded border" style={{ backgroundColor: formData.brandColor }}></div>
                         <Input 
                           value={formData.brandColor} 
                           onChange={e => setFormData({...formData, brandColor: e.target.value})} 
                           className="flex-1 font-mono text-lg py-6 uppercase tracking-widest"
                         />
                      </div>
                   </div>
                </div>
                <Button onClick={() => setStep(2)} disabled={!formData.hospitalName} className="mt-8 w-full bg-slate-900 text-white py-6">Next Step</Button>
             </div>
           )}

           {step === 2 && (
             <div className="animate-in fade-in slide-in-from-right-4">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">Enable Modules</h3>
                <div className="grid grid-cols-2 gap-4">
                   {Object.keys(formData.modules).map(mod => (
                      <div 
                        key={mod} 
                        onClick={() => toggleModule(mod as any)}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                           formData.modules[mod as keyof typeof formData.modules] 
                             ? 'border-emerald-500 bg-emerald-50' 
                             : 'border-slate-200 bg-slate-50 opacity-60'
                        }`}
                      >
                         <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-800 uppercase tracking-widest text-xs">{mod}</span>
                            {formData.modules[mod as keyof typeof formData.modules] && (
                               <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
                <div className="flex gap-3 mt-8">
                   <Button variant="outline" onClick={() => setStep(1)} className="w-1/3 py-6">Back</Button>
                   <Button onClick={() => setStep(3)} className="w-2/3 bg-slate-900 text-white py-6">Configure Tenant</Button>
                </div>
             </div>
           )}

           {step === 3 && (
             <div className="animate-in fade-in slide-in-from-right-4">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">Root Admin User</h3>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Super Admin Email</label>
                   <Input 
                     type="email"
                     value={formData.adminEmail} 
                     onChange={e => setFormData({...formData, adminEmail: e.target.value})} 
                     placeholder="admin@citygeneral.com"
                     className="text-lg py-6"
                   />
                   <p className="text-xs text-slate-400 mt-2">A master password and FIDO2 setup link will be dispatched to this email immediately.</p>
                </div>
                
                <div className="flex gap-3 mt-8">
                   <Button variant="outline" onClick={() => setStep(2)} disabled={loading} className="w-1/3 py-6">Back</Button>
                   <Button 
                     onClick={finalizeTenant} 
                     disabled={!formData.adminEmail || loading} 
                     className="w-2/3 py-6 text-white border-none transition-all shadow-xl"
                     style={{ backgroundColor: formData.brandColor }}
                   >
                     {loading ? "Provisioning RLS Policies..." : "Create Tenant"}
                   </Button>
                </div>
             </div>
           )}

           {step === 4 && (
             <div className="animate-in zoom-in flex flex-col items-center justify-center text-center h-full">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                   <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-3xl font-black text-slate-800 mb-2">Tenant Created</h3>
                <p className="text-sm text-slate-500 px-4">Database tables have strictly scoped RLS. You will be redirected to the secure portal.</p>
             </div>
           )}

        </div>
      </Card>
    </div>
  );
}
