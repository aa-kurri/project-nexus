"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ClinicalScribe() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [soapNote, setSoapNote] = useState<any>(null);
  
  // Dummy waveform animation heights
  const [bars, setBars] = useState<number[]>([10, 20, 15, 30, 10, 40, 25, 10]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setBars(bars.map(() => Math.floor(Math.random() * 40) + 10));
        setTranscript(prev => prev + (prev.length % 2 === 0 ? " patient stated... " : " mild pain in LUQ... "));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      
      // Simulate orchestrator processing
      setTimeout(() => {
        setIsProcessing(false);
        setSoapNote({
          subjective: "Patient reporting mild pain in Left Upper Quadrant over the last 2 days.",
          objective: "Patient appears stable. Abdomen soft, non-tender externally.",
          assessment: "Suspected gastritis. Rule out peptic ulcer.",
          plan: "Prescribed Omeprazole 20mg OD for 14 days. Review if symptoms worsen."
        });
      }, 2500);
    } else {
      setTranscript("");
      setSoapNote(null);
      setIsRecording(true);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto p-6 shadow-xl border-t-4 border-t-purple-600 bg-white">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
            Ambient Clinical Scribe
          </h2>
          <p className="text-sm text-slate-500">AI-native speech-to-SOAP generation</p>
        </div>
        <div className="flex items-center gap-2">
          {isRecording && <span className="animate-pulse w-3 h-3 bg-red-500 rounded-full"></span>}
          <Badge variant="outline" className={isRecording ? "text-red-500 border-red-200" : "text-slate-400"}>
            {isRecording ? "LISTENING" : "IDLE"}
          </Badge>
        </div>
      </div>

      {/* Recording Visualization */}
      <div className="bg-slate-50 rounded-xl p-8 mb-6 flex flex-col items-center justify-center min-h-[160px] border border-slate-100 transition-all">
        {isProcessing ? (
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium text-purple-700">Orchestrator mapping medical ontologies...</p>
          </div>
        ) : isRecording ? (
          <div className="flex items-end gap-1 h-12">
            {bars.map((height, i) => (
              <div 
                key={i} 
                className="w-2 bg-gradient-to-t from-purple-500 to-blue-400 rounded-t-sm transition-all duration-100" 
                style={{ height: `${height}px` }} 
              />
            ))}
          </div>
        ) : soapNote ? (
          <div className="text-emerald-600 font-medium text-lg flex items-center gap-2">
            <svg className="w-6 h-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            SOAP Note Drafted
          </div>
        ) : (
          <p className="text-slate-400 font-medium">Ready when you are, Doctor.</p>
        )}
      </div>

      <div className="flex justify-center mb-6">
        <Button 
          onClick={toggleRecording}
          disabled={isProcessing}
          size="lg"
          className={`w-48 text-white shadow-md transition-all ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {isRecording ? "End Consult" : "Start Scribe"}
        </Button>
      </div>

      {/* Output Panel */}
      {soapNote && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Subjective</h4>
              <p className="text-sm text-slate-800 bg-white p-3 rounded border border-slate-150">{soapNote.subjective}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Objective</h4>
              <p className="text-sm text-slate-800 bg-white p-3 rounded border border-slate-150">{soapNote.objective}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Assessment</h4>
              <p className="text-sm text-slate-800 bg-white p-3 rounded border border-slate-150 font-medium">{soapNote.assessment}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Plan</h4>
              <p className="text-sm text-slate-800 bg-white p-3 rounded border border-slate-150 text-[#0F766E]">{soapNote.plan}</p>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-slate-200">
             <Button variant="outline" className="text-slate-600">Discard</Button>
             <Button className="bg-[#0F766E] hover:bg-[#115E59] text-white">Sign & Push to Vault</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
