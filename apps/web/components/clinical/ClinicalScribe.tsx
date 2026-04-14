"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

export default function ClinicalScribe() {
  const supabase = createClient();
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [soapData, setSoapData] = useState<any>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [dbCommitStatus, setDbCommitStatus] = useState<string>('');

  useEffect(() => {
    async function loadTenant() {
      const { data } = await supabase.from('tenants').select('id').limit(1).single();
      if (data) setTenantId(data.id);
    }
    loadTenant();
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsAnalyzing(true);
      
      // Simulate Whisper / Claude processing time
      setTimeout(() => {
        setIsAnalyzing(false);
        setSoapData({
          subjective: "Patient presented with a 3-day history of acute lower back pain, radiating down the left leg. Notes difficulty sleeping.",
          objective: "Vitals stable. BP 120/80. Limited ROM in lumbar spine. Positive straight leg raise on left at 45 degrees.",
          assessment: "Acute sciatica, likely secondary to L4-L5 disc involvement.",
          plan: "1. Prescribed NSAIDs (Naproxen 500mg BID)\n2. Physical Therapy referral\n3. Follow up in 2 weeks. MRI if symptoms worsen.",
          ai_confidence: 0.96
        });
      }, 3000);
      
    } else {
      setIsRecording(true);
      setTranscription('');
      setSoapData(null);
      setDbCommitStatus('');
      // Simulate real-time streaming transcription
      let text = "Patient presents with acute lower back pain... radiating down the left leg... started 3 days ago...";
      let i = 0;
      const interval = setInterval(() => {
        setTranscription(prev => prev + text.charAt(i));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 50);
    }
  };

  const approveSoapNote = async () => {
    if (!tenantId || !soapData) return;
    
    // Convert to JSON text
    const draftText = JSON.stringify(soapData);

    const { error } = await supabase.from('clinical_audio_logs').insert([{
      tenant_id: tenantId,
      soap_note_draft: draftText,
      ai_confidence: soapData.ai_confidence,
      status: 'approved_by_physician'
    }]);

    if (!error) {
       setDbCommitStatus('Committed to PG Vector & Clinical Logs securely!');
    } else {
       setDbCommitStatus('Error: ' + error.message);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto p-1 shadow-2xl border-0 overflow-hidden bg-white text-slate-800">
       <div className="bg-slate-900 text-white p-6 rounded-t-xl border-b-4 border-[#0F766E] flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
               <svg className="w-6 h-6 text-[#0F766E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
               AI Clinical Scribe
            </h2>
            <p className="text-slate-400 text-sm mt-1">Ambient voice-to-SOAP generation with Postgres persistence.</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-slate-800 rounded text-xs font-mono text-emerald-400 border border-slate-700">Claude 3 Opus</span>
            <span className="px-3 py-1 bg-slate-800 rounded text-xs font-mono text-blue-400 border border-slate-700">Whisper-v3</span>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          
          {/* Audio Input Side */}
          <div className="p-8 border-r border-slate-100 bg-slate-50 relative">
             <div className="h-64 flex flex-col items-center justify-center">
                <button 
                  onClick={toggleRecording}
                  disabled={isAnalyzing}
                  className={`w-36 h-36 rounded-full flex items-center justify-center shadow-xl transition-all ${
                     isRecording 
                        ? 'bg-rose-500 animate-pulse scale-110 shadow-rose-500/50' 
                        : isAnalyzing 
                           ? 'bg-amber-400 animate-spin opacity-50'
                           : 'bg-[#0F766E] hover:bg-[#115E59] shadow-[#0F766E]/30 hover:scale-105'
                  }`}
                >
                  {isRecording ? (
                     <div className="flex gap-2">
                        <span className="w-2 h-8 bg-white rounded-full animate-bounce"></span>
                        <span className="w-2 h-12 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                        <span className="w-2 h-8 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                     </div>
                  ) : isAnalyzing ? (
                     <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  ) : (
                     <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                  )}
                </button>
                <h3 className="mt-8 font-black text-slate-700 tracking-wider uppercase text-sm">
                   {isRecording ? 'Listening to Encounter...' : isAnalyzing ? 'LLM Summarizing...' : 'Tap to start Scribe'}
                </h3>
             </div>

             <div className="mt-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b pb-2">Raw Audio Stream</p>
                <p className="font-mono text-sm text-slate-600 min-h-[60px] bg-white p-4 rounded border shadow-inner">
                   {transcription || <span className="text-slate-300 italic">Waiting for mic input...</span>}
                </p>
             </div>
          </div>

          {/* Generated Output Side */}
          <div className="p-8 bg-white">
             <div className="flex justify-between items-center mb-6">
               <h3 className="uppercase tracking-widest text-xs font-black text-slate-800 border-b-2 border-[#0F766E] pb-1 inline-block">Drafted SOAP Note</h3>
               {soapData && <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded">Confidence: {soapData.ai_confidence * 100}%</span>}
             </div>

             {soapData ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                   <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Subjective</p>
                      <p className="text-sm font-medium text-slate-700">{soapData.subjective}</p>
                   </div>
                   <div className="bg-slate-50 p-3 rounded border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Objective</p>
                      <p className="text-sm font-medium text-slate-700">{soapData.objective}</p>
                   </div>
                   <div className="bg-slate-50 p-3 rounded border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Assessment</p>
                      <p className="text-sm font-bold text-indigo-900">{soapData.assessment}</p>
                   </div>
                   <div className="bg-[#0F766E]/10 p-3 rounded border border-[#0F766E]/20">
                      <p className="text-[10px] font-bold text-[#0F766E] uppercase tracking-widest mb-1">Plan</p>
                      <p className="text-sm font-bold text-slate-800 whitespace-pre-line">{soapData.plan}</p>
                   </div>

                   <Button className="w-full mt-4 bg-[#0F766E] hover:bg-[#115E59]" onClick={approveSoapNote} disabled={!!dbCommitStatus}>
                      {dbCommitStatus ? '✓ Finalized' : 'Approve & Save to EMR'}
                   </Button>
                   
                   {dbCommitStatus && <p className="text-xs text-center text-emerald-600 mt-2 font-bold animate-pulse">{dbCommitStatus}</p>}
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                   <svg className="w-16 h-16 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                   <p className="text-sm font-bold text-slate-800 uppercase tracking-widest">No Note Drafted</p>
                </div>
             )}
          </div>

       </div>
    </Card>
  );
}
