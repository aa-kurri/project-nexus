"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AgenticClaimDrafter() {
  const [drafting, setDrafting] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [formFields, setFormFields] = useState({
    diagnosis: '',
    procedure: '',
    justification: '',
    estimatedCost: ''
  });

  const handleDraftClaim = () => {
    setDrafting(true);
    setDraftReady(false);
    
    // Simulate Orchestrator mapping Clinical Text to TPA Schema
    setTimeout(() => {
      setDrafting(false);
      setDraftReady(true);
      setFormFields({
        diagnosis: "Osteoarthritis of Right Knee (ICD-10: M19.011)",
        procedure: "Total Knee Replacement Arthroplasty (CPT: 27447)",
        justification: "Patient presented with severe right knee pain, unresponsive to conservative management (physiotherapy + NSAIDs) for 6 months. X-ray confirms severe joint space narrowing.",
        estimatedCost: "₹ 2,45,000"
      });
    }, 2800);
  };

  return (
    <Card className="w-full max-w-5xl mx-auto flex flex-col md:flex-row shadow-2xl border-0 overflow-hidden bg-white">
      
      {/* Left Panel: Clinical Context */}
      <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
        <div className="mb-6">
          <Badge className="mb-2 bg-indigo-100 text-indigo-800 hover:bg-indigo-200">Encounter Context</Badge>
          <h2 className="text-xl font-bold text-slate-800">Finalized Discharge Summary</h2>
          <p className="text-xs text-slate-500 mt-1">Patient: Ramesh K. | P-1234</p>
        </div>
        
        <ScrollArea className="flex-1 bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-600 leading-relaxed shadow-inner">
          <p className="font-semibold text-slate-800 mb-1">Chief Complaint:</p>
          <p className="mb-4">Severe pain in right knee, difficulty walking for 2 years.</p>
          
          <p className="font-semibold text-slate-800 mb-1">History of Present Illness:</p>
          <p className="mb-4">Patient has been on Celecoxib. Physiotherapy tried for 6 months with no relief. Medial joint line tenderness present. Knee flexion limited to 90 degrees.</p>
          
          <p className="font-semibold text-slate-800 mb-1">Course in Hospital:</p>
          <p>Patient underwent TKR right knee under spinal anesthesia. Implant used: Depuy Synthes Sigma. Procedure uneventful.</p>
        </ScrollArea>
      </div>

      {/* Right Panel: Agentic Drafter */}
      <div className="w-full md:w-2/3 p-8 flex flex-col h-full justify-center">
        <div className="flex justify-between items-end mb-8 border-b pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0F766E] tracking-tight flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              Agentic Claim Drafter
            </h1>
            <p className="text-slate-500 mt-1 font-medium">TPA Schema Target: Apollo Munich Pre-Auth</p>
          </div>
          
          <Button 
            onClick={handleDraftClaim} 
            disabled={drafting || draftReady}
            className={`px-6 py-2 transition-all ${
              drafting ? 'bg-indigo-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {drafting ? "AI is Extracting Schema..." : "Draft Claim via AI"}
          </Button>
        </div>

        {/* Dynamic Form Area */}
        {draftReady ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diagnosis (ICD-10)</label>
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-md text-sm font-semibold text-indigo-900 shadow-sm">
                  {formFields.diagnosis}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Procedure Planned</label>
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-md text-sm font-semibold text-indigo-900 shadow-sm">
                  {formFields.procedure}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                Clinical Justification
                <Badge variant="outline" className="text-[9px] h-4 border-emerald-300 text-emerald-600 bg-emerald-50">Passed TPA Rule Engine</Badge>
              </label>
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-md text-sm text-slate-700 shadow-sm leading-relaxed">
                {formFields.justification}
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-100 p-4 rounded-lg border border-slate-200 mt-8">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Estimated Cost</span>
                <span className="text-2xl font-black text-slate-800">{formFields.estimatedCost}</span>
              </div>
              <Button className="bg-[#0F766E] hover:bg-[#115E59] text-white px-8">Submit to TPA Portal</Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
            <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <h3 className="text-lg font-bold text-slate-500">Awaiting Extraction</h3>
            <p className="text-sm text-slate-400 max-w-xs mt-1">Click the AI Draft button to automatically map the clinical text to the TPA insurance schema.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
