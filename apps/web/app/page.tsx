"use client";

import React, { useState } from 'react';

// Import all the autonomous modules we just built
import PatientLogin from '@/components/auth/PatientLogin';
import PatientTimeline from '@/components/emr/PatientTimeline';
import LiveQueueBoard from '@/components/opd/LiveQueueBoard';
import BedBoard from '@/components/ipd/BedBoard';
import ClinicalScribe from '@/components/ai/ClinicalScribe';
import CopilotPanel from '@/components/ai/CopilotPanel';
import PharmacyDashboard from '@/components/analytics/PharmacyDashboard';
import ChargeAggregator from '@/components/billing/ChargeAggregator';
import AgenticClaimDrafter from '@/components/billing/AgenticClaimDrafter';
import BarcodeTracker from '@/components/lims/BarcodeTracker';
import HL7Analyzer from '@/components/lims/HL7Analyzer';
import WhatsAppConcierge from '@/components/app/WhatsAppConcierge';
import BlindStockSync from '@/components/pharmacy/BlindStockSync';
import TenantOnboarding from '@/components/auth/TenantOnboarding';
import PatientRegistration from '@/components/emr/PatientRegistration';

const MODULES = [
  { id: 'timeline', label: 'EMR Timeline', component: <div className="p-8 flex justify-center"><PatientTimeline /></div> },
  { id: 'opd-tv', label: 'Live OPD Queue', component: <LiveQueueBoard /> },
  { id: 'ipd', label: 'IPD Ward BedBoard', component: <div className="p-8"><BedBoard /></div> },
  { id: 'scribe', label: 'Ambient Scribe', component: <div className="p-8"><ClinicalScribe /></div> },
  { id: 'copilot', label: 'Clinical Copilot', component: <div className="p-8 h-[80vh] max-w-xl mx-auto"><CopilotPanel /></div> },
  { id: 'lims-barcode', label: 'LIMS Barcoding', component: <div className="p-8"><BarcodeTracker /></div> },
  { id: 'lims-tcp', label: 'HL7 Ingestion', component: <div className="p-8"><HL7Analyzer /></div> },
  { id: 'billing', label: 'Checkout & Ledger', component: <div className="p-8"><ChargeAggregator /></div> },
  { id: 'claims', label: 'AI Claim Drafter', component: <div className="p-8"><AgenticClaimDrafter /></div> },
  { id: 'pharm-dash', label: 'Pharmacy Dashboard', component: <div className="p-8"><PharmacyDashboard /></div> },
  { id: 'pharm-sync', label: 'Zero-Trust Stock Sync', component: <div className="p-8"><BlindStockSync /></div> },
  { id: 'tenant', label: 'Tenant Provisioning', component: <TenantOnboarding /> },
  { id: 'patient-reg', label: 'Fast EMR Registration', component: <div className="p-8"><PatientRegistration /></div> },
  { id: 'patient-login', label: 'Patient OTP Auth', component: <PatientLogin /> },
  { id: 'patient-app', label: 'Mobile AI Concierge', component: <WhatsAppConcierge /> },
];

export default function AyuraWorkspace() {
  const [activeId, setActiveId] = useState('lims-tcp');

  const ActiveComponent = MODULES.find(m => m.id === activeId)?.component;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 border-t-4 border-[#0F766E] font-sans">
      
      {/* Top Navbar */}
      <header className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0F766E] rounded flex items-center justify-center font-bold text-white tracking-tighter">
            Ay
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-md">
            Ayura OS <span className="text-slate-500 font-light ml-1 text-sm">v4.0.0-alpha</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Supabase TCP Active
          </span>
          <span className="text-slate-400">Dr. A. Rao</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Autonomously Generated Modules</h2>
            <div className="space-y-1">
              {MODULES.map(md => (
                <button
                  key={md.id}
                  onClick={() => setActiveId(md.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between ${
                    activeId === md.id 
                      ? 'bg-[#0F766E]/20 text-[#0F766E] font-bold shadow-sm border border-[#0F766E]/30' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {md.label}
                  {activeId === md.id && (
                    <svg className="w-4 h-4 text-[#0F766E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100 relative">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          
          <div className="relative z-10 w-full h-full">
            {ActiveComponent}
          </div>
        </main>
        
      </div>
    </div>
  );
}
