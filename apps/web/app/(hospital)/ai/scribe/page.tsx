"use client";
import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  Settings, 
  History, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Radio, 
  FileText,
  Volume2,
  BrainCircuit,
  Maximize2,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AiScribePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [pulse, setPulse] = useState(0);

  // Fake Pulse Animation
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setPulse(p => (p + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <>
      <TopBar 
        title="AI Medical Scribe" 
        action={{ label: "History", href: "#" }}
      />
      <main className="p-8 max-w-6xl mx-auto space-y-8">
        
        {/* Futiristic Recording Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
           
           {/* Live Transcription Interface */}
           <Card className="border-[#0F766E]/30 bg-black/40 backdrop-blur-3xl shadow-[0_0_50px_-12px_rgba(15,118,110,0.3)] min-h-[500px] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
                 <div className="flex items-center gap-3">
                    <div className={cn("h-2.5 w-2.5 rounded-full bg-red-500", isRecording && "animate-pulse")} />
                    <CardTitle className="text-sm tracking-widest uppercase font-bold text-muted-foreground">Neural Transcription Live</CardTitle>
                 </div>
                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/5 text-muted hover:text-fg">
                    <Settings className="h-4 w-4" />
                 </Button>
              </CardHeader>
              <CardContent className="flex-1 p-8 overflow-y-auto space-y-6">
                 {isRecording ? (
                    <div className="space-y-4 animate-in fade-in duration-1000">
                       <TranscriptLine speaker="Doctor" text="Hello Mr. Sharma, how are you feeling today?" time="10:02" />
                       <TranscriptLine speaker="Patient" text="I've been having some chest pain since last evening, doc." time="10:04" />
                       <TranscriptLine speaker="Doctor" text="On a scale of 1 to 10, how intense is the pain? And is it radiating?" time="10:05" />
                       <div className="h-24 w-full border-l-2 border-[#0F766E]/40 pl-6 flex items-center">
                          <div className="flex gap-1 items-end h-10 w-full overflow-hidden">
                             {Array.from({ length: 40 }).map((_, i) => (
                               <div 
                                 key={i} 
                                 className="w-1.5 bg-[#0F766E]/60 rounded-full transition-all duration-300"
                                 style={{ height: `${Math.random() * 80 + 20}%` }}
                               />
                             ))}
                          </div>
                       </div>
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-40">
                       <div className="h-24 w-24 rounded-full border border-white/10 flex items-center justify-center relative">
                          <div className="absolute inset-0 rounded-full border-t-[#0F766E] border-2 rotate-45" />
                          <Mic className="h-10 w-10 text-muted" />
                       </div>
                       <div className="space-y-2">
                          <p className="text-xl font-bold tracking-tight">System Ready</p>
                          <p className="text-xs max-w-xs mx-auto text-muted-foreground leading-relaxed">
                             Ayura AI is calibrated and listening. Start recording to generate real-time clinical documentation.
                          </p>
                       </div>
                    </div>
                 )}
              </CardContent>
              <div className="p-8 border-t border-white/5 bg-black/20 flex items-center justify-between gap-6">
                 <div className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center px-6 gap-3">
                    <Radio className={cn("h-4 w-4 text-[#0F766E]", isRecording && "animate-pulse")} />
                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{isRecording ? "Capturing Audio Engine v4.2" : "Microphone: Deckard 7000 Premium"}</span>
                 </div>
                 <button 
                  onClick={() => setIsRecording(!isRecording)}
                  className={cn(
                    "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl",
                    isRecording 
                      ? "bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/20" 
                      : "bg-[#0F766E] hover:bg-[#115E59] shadow-[#0F766E]/20"
                  )}
                 >
                    {isRecording ? <div className="h-6 w-6 rounded-sm bg-white" /> : <Mic className="h-8 w-8 text-white" />}
                 </button>
              </div>
           </Card>

           {/* AI Structured Output Sidebar */}
           <div className="space-y-6">
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl group cursor-pointer hover:border-[#0F766E]/40 transition-all">
                 <CardHeader className="flex flex-row items-center gap-3">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-sm font-bold uppercase tracking-widest pt-0.5">Instant Medical Note (SOAP)</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl bg-black/20 border border-border/10 space-y-3">
                       <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#0F766E]" />
                          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Subjective</span>
                       </div>
                       <p className="text-xs text-muted-foreground leading-relaxed italic">
                          "Patient complains of progressive epigastric discomfort radiating to the back for 48 hours..."
                       </p>
                    </div>
                    <Button className="w-full bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] hover:bg-[#0F766E]/20 gap-2 font-bold text-[10px] uppercase tracking-widest">
                       Push to EMR Profile <ArrowUpRight className="h-4 w-4" />
                    </Button>
                 </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                 <HelperCard title="Auto Diagnosis" value="Pending..." icon={BrainCircuit} />
                 <HelperCard title="Drug Interactions" value="Clear" icon={CheckCircle2} positive />
              </div>
           </div>

        </div>

      </main>
    </>
  );
}

function TranscriptLine({ speaker, text, time }: any) {
  return (
    <div className="flex gap-4">
       <span className="text-[10px] font-mono text-muted/30 pt-1">{time}</span>
       <div className="space-y-1">
          <p className="text-[10px] font-bold text-[#0F766E] uppercase tracking-tighter leading-none">{speaker}</p>
          <p className="text-sm text-fg/90 leading-relaxed">{text}</p>
       </div>
    </div>
  );
}

function HelperCard({ title, value, icon: Icon, positive }: any) {
  return (
     <Card className="border-border/40 bg-surface/50 p-4 flex flex-col items-center text-center gap-2">
        <Icon className={cn("h-5 w-5", positive ? "text-[#0F766E]" : "text-muted")} />
        <div>
           <p className="text-[8px] font-bold uppercase tracking-widest text-muted">{title}</p>
           <p className="text-xs font-bold text-fg">{value}</p>
        </div>
     </Card>
  );
}
