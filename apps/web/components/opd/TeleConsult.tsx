"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, PhoneCall,
  Plus, Trash2, FileText, Clock, CheckCircle2,
  Loader2, Stethoscope, Pill, ClipboardList,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Types ────────────────────────────────────────────────────────────────────

type CallState = "idle" | "connecting" | "in-call" | "ended";

export interface MedEntry {
  id:           string;
  drug:         string;
  dose:         string;
  freq:         string;
  duration:     string;
  instructions: string;
}

export interface TeleConsultProps {
  appointmentId:      string;
  patientName?:       string;
  patientAge?:        number;
  patientMrn?:        string;
  chiefComplaint?:    string;
  onStartSession: (
    appointmentId: string,
  ) => Promise<{ ok: true; sessionId: string; roomUrl: string } | { ok: false; error: string }>;
  onEndSession: (
    sessionId: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  onSavePrescription: (input: {
    sessionId:   string;
    diagnosis:   string;
    medications: MedEntry[];
    notes:       string;
  }) => Promise<{ ok: true; rxId: string } | { ok: false; error: string }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function newMed(): MedEntry {
  return {
    id:           Math.random().toString(36).slice(2),
    drug:         "",
    dose:         "",
    freq:         "",
    duration:     "",
    instructions: "",
  };
}

function formatTimer(s: number): string {
  const m   = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const FREQ_OPTIONS = ["OD", "BD", "TDS", "QID", "SOS", "HS", "OW", "BW"];

// Simulated waveform heights for the "patient talking" animation
const WAVE_HEIGHTS = [3, 6, 9, 5, 8, 4, 7, 3, 6, 8, 5, 4];

// ── Component ────────────────────────────────────────────────────────────────

export default function TeleConsult({
  appointmentId,
  patientName    = "Priya Desai",
  patientAge     = 34,
  patientMrn     = "AYU-2024-0847",
  chiefComplaint = "Follow-up: Hypertension",
  onStartSession,
  onEndSession,
  onSavePrescription,
}: TeleConsultProps) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [pending, startTx]        = useTransition();

  // Call controls
  const [muted,     setMuted]     = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  // Timer
  const [elapsed, setElapsed] = useState(0);

  // Rx state
  const [diagnosis, setDiagnosis] = useState("");
  const [meds,      setMeds]      = useState<MedEntry[]>([newMed()]);
  const [rxNotes,   setRxNotes]   = useState("");
  const [rxSaved,   setRxSaved]   = useState(false);
  const [rxId,      setRxId]      = useState<string | null>(null);

  useEffect(() => {
    if (callState !== "in-call") return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [callState]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleJoin = () => {
    setError(null);
    startTx(async () => {
      const res = await onStartSession(appointmentId);
      if (!res.ok) { setError(res.error); return; }
      setSessionId(res.sessionId);
      setCallState("connecting");
      await new Promise((r) => setTimeout(r, 1500));
      setCallState("in-call");
    });
  };

  const handleEnd = () => {
    if (!sessionId) return;
    startTx(async () => {
      await onEndSession(sessionId);
      setCallState("ended");
    });
  };

  const handleSaveRx = () => {
    if (!sessionId) return;
    const filledMeds = meds.filter((m) => m.drug.trim().length > 0);
    startTx(async () => {
      const res = await onSavePrescription({
        sessionId,
        diagnosis,
        medications: filledMeds,
        notes: rxNotes,
      });
      if (res.ok) { setRxSaved(true); setRxId(res.rxId); }
      else        { setError(res.error); }
    });
  };

  const resetConsult = () => {
    setCallState("idle");
    setSessionId(null);
    setElapsed(0);
    setMeds([newMed()]);
    setDiagnosis("");
    setRxNotes("");
    setRxSaved(false);
    setRxId(null);
    setError(null);
  };

  const updateMed = (id: string, field: keyof MedEntry, value: string) =>
    setMeds((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const removeMed = (id: string) =>
    setMeds((prev) => prev.filter((m) => m.id !== id));

  // ── Idle ─────────────────────────────────────────────────────────────────

  if (callState === "idle") {
    return (
      <div className="flex h-full items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-5">
          <Card className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0F766E]/15 text-[#0F766E] font-bold text-lg">
                {initials(patientName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-fg">{patientName}</h3>
                  <Badge variant="outline" className="font-mono text-xs">{patientMrn}</Badge>
                </div>
                <p className="text-sm text-muted mt-0.5">
                  Age {patientAge} · {chiefComplaint}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0F766E]/10 ring-2 ring-[#0F766E]/20">
              <Video className="h-7 w-7 text-[#0F766E]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-fg">Ready to consult?</h2>
              <p className="text-sm text-muted mt-1">
                Secure end-to-end encrypted video · Appt #{appointmentId.slice(-6).toUpperCase()}
              </p>
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 text-left">
                {error}
              </p>
            )}

            <Button
              className="w-full bg-[#0F766E] hover:bg-[#115E59]"
              disabled={pending}
              onClick={handleJoin}
            >
              {pending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting call…</>
                : <><PhoneCall className="h-4 w-4" /> Join Video Call</>}
            </Button>

            <div className="flex items-center justify-center gap-6 text-xs text-muted pt-1">
              <span className="flex items-center gap-1"><Video className="h-3 w-3" /> Camera on</span>
              <span className="flex items-center gap-1"><Mic   className="h-3 w-3" /> Mic on</span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── Connecting ───────────────────────────────────────────────────────────

  if (callState === "connecting") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#0F766E]/20 animate-ping" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#0F766E]/15">
            <PhoneCall className="h-7 w-7 text-[#0F766E]" />
          </div>
        </div>
        <p className="text-lg font-semibold text-fg">Connecting…</p>
        <p className="text-sm text-muted">Establishing secure video link with {patientName}</p>
      </div>
    );
  }

  // ── Ended ────────────────────────────────────────────────────────────────

  if (callState === "ended") {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="w-full max-w-md space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0F766E]/10 ring-2 ring-[#0F766E]/20">
            <CheckCircle2 className="h-8 w-8 text-[#0F766E]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-fg">Consultation Ended</h2>
            <p className="text-sm text-muted mt-1">Duration: {formatTimer(elapsed)}</p>
          </div>

          {rxId ? (
            <Card className="p-4 text-left space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0F766E]" />
                <span className="text-sm font-semibold text-fg">Prescription Signed</span>
                <Badge variant="secondary" className="ml-auto font-mono text-xs">{rxId}</Badge>
              </div>
              <p className="text-xs text-muted">
                {meds.filter((m) => m.drug).length} medication(s) · dispatched to pharmacy queue
              </p>
            </Card>
          ) : (
            <Card className="p-4 text-left">
              <p className="text-sm text-muted">No prescription was saved for this session.</p>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={resetConsult}>
              New Consult
            </Button>
            <Button
              className="flex-1 bg-[#0F766E] hover:bg-[#115E59]"
              onClick={() => window.history.back()}
            >
              Back to Queue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── In-call ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Video panel (left 60%) ─────────────────────────────────────────── */}
      <div className="relative flex flex-[3] flex-col bg-[hsl(220_15%_6%)] overflow-hidden">

        {/* Mock remote stream */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220_15%_8%)] to-[hsl(220_15%_4%)]" />

          {/* Patient avatar + simulated audio waveform */}
          <div className="relative z-10 flex flex-col items-center gap-3 text-center select-none">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#0F766E]/20 ring-2 ring-[#0F766E]/30 text-[#0F766E] text-3xl font-bold">
              {initials(patientName)}
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{patientName}</p>
              <p className="text-white/50 text-sm">Video stream active</p>
            </div>
            <div className="flex items-end gap-0.5 h-6 mt-1">
              {WAVE_HEIGHTS.map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-[#0F766E]/60 animate-pulse"
                  style={{ height: `${h * 2}px`, animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          </div>

          {/* Doctor PiP — bottom-right */}
          <div className="absolute bottom-4 right-4 z-20 flex h-28 w-44 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[hsl(220_15%_10%)] shadow-xl">
            {cameraOff ? (
              <div className="flex flex-col items-center gap-1.5 text-white/40">
                <VideoOff className="h-5 w-5" />
                <span className="text-xs">Camera off</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-white/60">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F766E]/20 text-[#0F766E] text-sm font-bold">
                  Dr
                </div>
                <span className="text-xs">You</span>
              </div>
            )}
          </div>

          {/* Status bar — top */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#0F766E] animate-pulse" />
              <span className="text-sm font-medium text-white/80">Live</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm">
              <Clock className="h-3.5 w-3.5 text-white/60" />
              <span className="font-mono text-sm text-white/80">{formatTimer(elapsed)}</span>
            </div>
          </div>
        </div>

        {/* Controls bar */}
        <div className="flex shrink-0 items-center justify-center gap-6 border-t border-white/10 bg-[hsl(220_15%_8%)] px-6 py-5">
          {/* Mute */}
          <ControlBtn
            active={muted}
            label={muted ? "Unmute" : "Mute"}
            onClick={() => setMuted((v) => !v)}
          >
            {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </ControlBtn>

          {/* Camera */}
          <ControlBtn
            active={cameraOff}
            label={cameraOff ? "Start Vid" : "Stop Vid"}
            onClick={() => setCameraOff((v) => !v)}
          >
            {cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </ControlBtn>

          {/* End call */}
          <button
            onClick={handleEnd}
            disabled={pending}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30 transition-colors hover:bg-red-600 disabled:opacity-60">
              {pending
                ? <Loader2 className="h-6 w-6 text-white animate-spin" />
                : <PhoneOff className="h-6 w-6 text-white" />}
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-red-400">
              End Call
            </span>
          </button>
        </div>
      </div>

      {/* ── Rx rail (right 40%) ───────────────────────────────────────────── */}
      <div className="flex flex-[2] min-w-0 flex-col border-l border-border bg-[hsl(220_13%_9%)]">

        {/* Rail header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#0F766E]" />
            <span className="text-sm font-semibold text-fg">In-Call Prescription (Rx)</span>
          </div>
          {rxSaved && (
            <Badge className="border-[#0F766E]/30 bg-[#0F766E]/20 text-[#0F766E] text-xs">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Saved
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1 px-5 py-4">
          <div className="space-y-5">

            {/* Patient chip */}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface/50 px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0F766E]/15 text-[#0F766E] text-xs font-bold">
                {initials(patientName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{patientName}</p>
                <p className="text-xs text-muted">{patientMrn} · Age {patientAge}</p>
              </div>
              <Badge variant="outline" className="ml-auto shrink-0 text-xs">{chiefComplaint}</Badge>
            </div>

            {/* Diagnosis */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
                <Stethoscope className="h-3 w-3" /> Diagnosis / Chief Finding
              </label>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                disabled={rxSaved}
                placeholder="e.g., Stage 1 Hypertension (ICD-10: I10)"
                rows={2}
                className="flex w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/50 disabled:opacity-60"
              />
            </div>

            {/* Medications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
                  <Pill className="h-3 w-3" /> Medications
                </label>
                {!rxSaved && (
                  <button
                    onClick={() => setMeds((prev) => [...prev, newMed()])}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#0F766E] transition-colors hover:text-[#0F766E]/80"
                  >
                    <Plus className="h-3 w-3" /> Add Drug
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {meds.map((med, idx) => (
                  <div key={med.id} className="space-y-2.5 rounded-lg border border-border bg-surface/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted">Drug #{idx + 1}</span>
                      {meds.length > 1 && !rxSaved && (
                        <button
                          onClick={() => removeMed(med.id)}
                          className="text-muted transition-colors hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <Input
                      placeholder="Drug name / generic"
                      value={med.drug}
                      onChange={(e) => updateMed(med.id, "drug", e.target.value)}
                      disabled={rxSaved}
                      className="h-8 text-sm"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Dose (e.g., 500 mg)"
                        value={med.dose}
                        onChange={(e) => updateMed(med.id, "dose", e.target.value)}
                        disabled={rxSaved}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="Frequency"
                        value={med.freq}
                        onChange={(e) => updateMed(med.id, "freq", e.target.value)}
                        disabled={rxSaved}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Frequency quick-picks */}
                    {!rxSaved && (
                      <div className="flex flex-wrap gap-1">
                        {FREQ_OPTIONS.map((f) => (
                          <button
                            key={f}
                            onClick={() => updateMed(med.id, "freq", f)}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium border transition-colors ${
                              med.freq === f
                                ? "border-[#0F766E]/50 bg-[#0F766E]/15 text-[#0F766E]"
                                : "border-border bg-surface/60 text-muted hover:border-[#0F766E]/30 hover:text-fg"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Duration (e.g., 7 days)"
                        value={med.duration}
                        onChange={(e) => updateMed(med.id, "duration", e.target.value)}
                        disabled={rxSaved}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="Special instructions"
                        value={med.instructions}
                        onChange={(e) => updateMed(med.id, "instructions", e.target.value)}
                        disabled={rxSaved}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical notes */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
                <FileText className="h-3 w-3" /> Clinical Notes
              </label>
              <textarea
                value={rxNotes}
                onChange={(e) => setRxNotes(e.target.value)}
                disabled={rxSaved}
                placeholder="Advice, follow-up date, lifestyle changes…"
                rows={3}
                className="flex w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/50 disabled:opacity-60"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Sign & Save footer */}
        <div className="shrink-0 border-t border-border px-5 py-4">
          {rxSaved ? (
            <div className="flex items-center gap-2 text-sm font-medium text-[#0F766E]">
              <CheckCircle2 className="h-4 w-4" />
              <span>Prescription signed · {rxId}</span>
            </div>
          ) : (
            <Button
              className="w-full bg-[#0F766E] hover:bg-[#115E59]"
              disabled={pending || (!diagnosis.trim() && meds.every((m) => !m.drug.trim()))}
              onClick={handleSaveRx}
            >
              {pending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : <><FileText className="h-4 w-4" /> Sign &amp; Save Prescription</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ControlBtn ───────────────────────────────────────────────────────────────

function ControlBtn({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 transition-colors ${
        active ? "text-red-400" : "text-white/70 hover:text-white"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
          active ? "bg-red-500/20" : "bg-white/10 hover:bg-white/20"
        }`}
      >
        {children}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}
