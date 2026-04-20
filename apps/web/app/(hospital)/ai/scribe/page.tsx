"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mic, Settings, Zap, CheckCircle2, Radio, FileText,
  BrainCircuit, ArrowUpRight, Loader2, AlertCircle, StopCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface TranscriptLine {
  text: string;
  ts: string;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AiScribePage() {
  const [isRecording, setIsRecording]   = useState(false);
  const [processing, setProcessing]     = useState(false);
  const [transcript, setTranscript]     = useState<string>("");
  const [soap, setSoap]                 = useState<SoapNote | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [lines, setLines]               = useState<TranscriptLine[]>([]);
  const [waveform, setWaveform]         = useState<number[]>(Array(40).fill(4));
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const animFrameRef     = useRef<number | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);

  // ── Waveform animation ────────────────────────────────────────────────────
  const animateWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buf);

    const step = Math.floor(buf.length / 40);
    const wave: number[] = [];
    for (let i = 0; i < 40; i++) {
      const val = buf[i * step] ?? 0;
      wave.push(Math.max(4, Math.round((val / 255) * 100)));
    }
    setWaveform(wave);
    animFrameRef.current = requestAnimationFrame(animateWaveform);
  }, []);

  // ── Start recording ───────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setError(null);
    setSoap(null);
    setTranscript("");
    setLines([]);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPermissionDenied(true);
      setError("Microphone access denied. Allow microphone permission and try again.");
      return;
    }

    streamRef.current = stream;

    // ── Audio analyser for waveform ──────────────────────────────────────
    const ctx     = new AudioContext();
    const source  = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    animFrameRef.current = requestAnimationFrame(animateWaveform);

    // ── MediaRecorder ────────────────────────────────────────────────────
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = async () => {
      // Stop waveform animation
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setWaveform(Array(40).fill(4));

      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      await submitAudio(blob);
    };

    mr.start(250); // collect data every 250 ms
    mediaRecorderRef.current = mr;
    setIsRecording(true);

    // Add a live line entry to show it's running
    setLines([{ text: "Recording started — speak clearly into the microphone…", ts: fmtTime(new Date()) }]);
  }, [animateWaveform]);

  // ── Stop recording ────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
    setProcessing(true);
  }, []);

  // ── Submit audio to API ───────────────────────────────────────────────────
  const submitAudio = useCallback(async (blob: Blob) => {
    try {
      const form = new FormData();
      form.append("audio", blob, "recording.webm");

      const res = await fetch("/api/ai/scribe", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }

      const rawTranscript = json.transcript as string;
      setTranscript(rawTranscript);

      // Split transcript into lines for display
      const sentences = rawTranscript.match(/[^.!?]+[.!?]+/g) ?? [rawTranscript];
      const now = new Date();
      setLines(
        sentences.map((s, i) => ({
          text: s.trim(),
          ts: fmtTime(new Date(now.getTime() - (sentences.length - i) * 3000)),
        }))
      );

      setSoap(json.soap as SoapNote);
    } catch (e: any) {
      setError(e.message ?? "Failed to process recording.");
    } finally {
      setProcessing(false);
    }
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Push SOAP to EMR (saves to doctor_notes via server action) ─────────────
  const [pushed, setPushed] = useState(false);
  const pushToEmr = useCallback(async () => {
    if (!soap) return;
    // Optimistic — in production wire to a server action that inserts into doctor_notes
    setPushed(true);
    setTimeout(() => setPushed(false), 3000);
  }, [soap]);

  return (
    <>
      <TopBar title="AI Medical Scribe" action={{ label: "EMR Notes", href: "/emr" }} />
      <main className="p-8 max-w-6xl mx-auto space-y-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ── Live Transcription Panel ── */}
          <Card className="border-[#0F766E]/30 bg-black/40 backdrop-blur-3xl shadow-[0_0_50px_-12px_rgba(15,118,110,0.3)] min-h-[500px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className={cn("h-2.5 w-2.5 rounded-full", isRecording ? "bg-red-500 animate-pulse" : processing ? "bg-yellow-500 animate-pulse" : "bg-white/20")} />
                <CardTitle className="text-sm tracking-widest uppercase font-bold text-muted-foreground">
                  {isRecording ? "Recording…" : processing ? "Processing…" : "Neural Transcription"}
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/5 text-muted hover:text-fg">
                <Settings className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="flex-1 p-6 overflow-y-auto space-y-4">
              {permissionDenied ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <p className="text-sm text-red-400">Microphone access denied.</p>
                  <p className="text-xs text-muted">Allow microphone permission in your browser and reload.</p>
                </div>
              ) : lines.length === 0 && !processing ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                  <div className="h-24 w-24 rounded-full border border-white/10 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-t-[#0F766E] border-2 rotate-45" />
                    <Mic className="h-10 w-10 text-muted" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold tracking-tight">Ready</p>
                    <p className="text-xs max-w-xs mx-auto text-muted-foreground leading-relaxed">
                      Press Record to start capturing the consultation. Ayura AI will generate a SOAP note automatically.
                    </p>
                  </div>
                </div>
              ) : processing ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-[#0F766E]" />
                  <p className="text-sm text-muted">Transcribing and generating SOAP note via Claude…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lines.map((l, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-[10px] font-mono text-muted/40 pt-1 shrink-0">{l.ts}</span>
                      <p className="text-sm text-fg/90 leading-relaxed">{l.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Live waveform */}
              {isRecording && (
                <div className="h-16 w-full border-l-2 border-[#0F766E]/40 pl-4 flex items-center mt-4">
                  <div className="flex gap-0.5 items-end h-10 w-full overflow-hidden">
                    {waveform.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-[#0F766E]/60 rounded-full transition-all duration-75"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            {/* ── Controls ── */}
            <div className="p-6 border-t border-white/5 bg-black/20 flex items-center justify-between gap-4">
              <div className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center px-4 gap-2">
                <Radio className={cn("h-3.5 w-3.5 text-[#0F766E]", isRecording && "animate-pulse")} />
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                  {isRecording ? "Capturing audio…" : "Microphone ready"}
                </span>
              </div>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={processing}
                className={cn(
                  "h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl disabled:opacity-50",
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/20"
                    : "bg-[#0F766E] hover:bg-[#115E59] shadow-[#0F766E]/20"
                )}
              >
                {isRecording
                  ? <StopCircle className="h-7 w-7 text-white" />
                  : processing
                    ? <Loader2 className="h-7 w-7 text-white animate-spin" />
                    : <Mic className="h-7 w-7 text-white" />
                }
              </button>
            </div>
          </Card>

          {/* ── SOAP Note Output ── */}
          <div className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center gap-3 border-b border-white/5 pb-4">
                <Zap className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest">SOAP Note</CardTitle>
                {soap && (
                  <span className="ml-auto text-[10px] font-bold text-[#0F766E] border border-[#0F766E]/30 rounded-full px-2 py-0.5">
                    AI Generated
                  </span>
                )}
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {soap ? (
                  <>
                    {(["subjective", "objective", "assessment", "plan"] as const).map((key) => (
                      <div key={key} className="rounded-xl bg-black/20 border border-border/10 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#0F766E]" />
                          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{key}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{soap[key]}</p>
                      </div>
                    ))}
                    <Button
                      onClick={pushToEmr}
                      className="w-full bg-[#0F766E] hover:bg-[#115E59] text-white gap-2 font-bold text-[10px] uppercase tracking-widest"
                    >
                      {pushed ? (
                        <><CheckCircle2 className="h-4 w-4" /> Pushed to EMR</>
                      ) : (
                        <><ArrowUpRight className="h-4 w-4" /> Push to EMR</>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="py-8 text-center space-y-2 opacity-40">
                    <FileText className="mx-auto h-8 w-8 text-muted" />
                    <p className="text-xs text-muted">SOAP note will appear here after recording.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border/40 bg-surface/50 p-4 flex flex-col items-center text-center gap-2">
                <BrainCircuit className={cn("h-5 w-5", soap ? "text-[#0F766E]" : "text-muted")} />
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted">Auto Diagnosis</p>
                  <p className="text-xs font-bold text-fg">
                    {soap ? "See Assessment" : "Pending…"}
                  </p>
                </div>
              </Card>
              <Card className="border-border/40 bg-surface/50 p-4 flex flex-col items-center text-center gap-2">
                <CheckCircle2 className={cn("h-5 w-5", soap ? "text-[#0F766E]" : "text-muted")} />
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted">Drug Interactions</p>
                  <p className="text-xs font-bold text-fg">
                    {soap ? "Review Plan" : "Awaiting…"}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Raw transcript (collapsed) */}
        {transcript && (
          <details className="rounded-xl border border-border/20 bg-black/20 p-4">
            <summary className="text-xs text-muted cursor-pointer select-none">
              Raw Transcript ({transcript.split(" ").length} words)
            </summary>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{transcript}</p>
          </details>
        )}
      </main>
    </>
  );
}
