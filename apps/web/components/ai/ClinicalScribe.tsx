"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

const SOAP_LABELS: { key: keyof SoapNote; label: string }[] = [
  { key: "subjective", label: "Subjective" },
  { key: "objective", label: "Objective" },
  { key: "assessment", label: "Assessment" },
  { key: "plan", label: "Plan" },
];

export default function ClinicalScribe() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [soapNote, setSoapNote] = useState<SoapNote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bars, setBars] = useState<number[]>(Array(10).fill(10));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const barsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Animate waveform bars while recording
  useEffect(() => {
    if (isRecording) {
      barsTimerRef.current = setInterval(() => {
        setBars(Array(10).fill(0).map(() => Math.floor(Math.random() * 38) + 6));
      }, 120);
    } else {
      if (barsTimerRef.current) clearInterval(barsTimerRef.current);
      setBars(Array(10).fill(10));
    }
    return () => {
      if (barsTimerRef.current) clearInterval(barsTimerRef.current);
    };
  }, [isRecording]);

  const submitRecording = useCallback(async (audioBlob: Blob) => {
    try {
      const form = new FormData();
      form.append("audio", audioBlob, "recording.webm");

      const res = await fetch("/api/ai/scribe", { method: "POST", body: form });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Server error ${res.status}`);
      }

      const data = await res.json() as { transcript: string; soap: SoapNote };
      setTranscript(data.transcript);
      setSoapNote(data.soap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  async function startRecording() {
    setError(null);
    setSoapNote(null);
    setTranscript("");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        submitRecording(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
    } catch {
      setError("Microphone access denied. Please allow microphone permissions and try again.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function handleDiscard() {
    setSoapNote(null);
    setTranscript("");
    setError(null);
  }

  return (
    <Card
      className="max-w-2xl mx-auto p-6 shadow-xl border-t-4"
      style={{
        borderTopColor: "#0F766E",
        background: "hsl(220 13% 9%)",
        borderColor: "hsl(220 15% 14%)",
      }}
    >
      {/* Header */}
      <div
        className="flex justify-between items-center mb-6 border-b pb-4"
        style={{ borderColor: "hsl(220 15% 14%)" }}
      >
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#0F766E" }}>
            Ambient Clinical Scribe
          </h2>
          <p className="text-sm text-slate-400">AI-native speech-to-SOAP generation</p>
        </div>
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="animate-pulse w-3 h-3 bg-red-500 rounded-full" />
          )}
          <Badge
            variant="outline"
            className={
              isRecording
                ? "text-red-400 border-red-800"
                : isProcessing
                ? "border-teal-800"
                : "text-slate-500 border-slate-700"
            }
            style={isProcessing ? { color: "#0F766E" } : undefined}
          >
            {isRecording ? "LISTENING" : isProcessing ? "PROCESSING" : "IDLE"}
          </Badge>
        </div>
      </div>

      {/* Visualization */}
      <div
        className="rounded-xl p-8 mb-6 flex flex-col items-center justify-center min-h-[160px] border transition-all"
        style={{
          background: "hsl(220 15% 6%)",
          borderColor: "hsl(220 15% 12%)",
        }}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-9 h-9 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "#0F766E", borderTopColor: "transparent" }}
            />
            <p className="text-sm font-medium" style={{ color: "#0F766E" }}>
              Generating SOAP note via Claude…
            </p>
          </div>
        ) : isRecording ? (
          <div className="flex items-end gap-[3px] h-12">
            {bars.map((h, i) => (
              <div
                key={i}
                className="w-2 rounded-t-sm transition-all duration-100"
                style={{ height: `${h}px`, background: "#0F766E" }}
              />
            ))}
          </div>
        ) : soapNote ? (
          <div
            className="font-medium text-lg flex items-center gap-2"
            style={{ color: "#0F766E" }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            SOAP Note Drafted
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm text-center max-w-sm">{error}</p>
        ) : (
          <p className="text-slate-500 font-medium">Ready when you are, Doctor.</p>
        )}
      </div>

      {/* Transcript preview */}
      {transcript && !isProcessing && (
        <div
          className="mb-4 p-3 rounded-lg text-xs border italic text-slate-400"
          style={{
            background: "hsl(220 15% 6%)",
            borderColor: "hsl(220 15% 12%)",
          }}
        >
          <span className="not-italic font-semibold text-slate-500">
            Transcript:{" "}
          </span>
          {transcript}
        </div>
      )}

      {/* Record button */}
      <div className="flex justify-center mb-6">
        <Button
          onClick={toggleRecording}
          disabled={isProcessing}
          size="lg"
          className={`w-48 text-white shadow-md transition-all font-semibold ${
            isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse" : ""
          }`}
          style={!isRecording ? { background: "#0F766E" } : undefined}
        >
          {isRecording ? "End Consult" : "Start Scribe"}
        </Button>
      </div>

      {/* SOAP Output */}
      {soapNote && (
        <div
          className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 p-5 rounded-xl border"
          style={{
            background: "hsl(220 15% 6%)",
            borderColor: "hsl(220 15% 12%)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOAP_LABELS.map(({ key, label }) => (
              <div key={key}>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-1 text-slate-500">
                  {label}
                </h4>
                <p
                  className="text-sm p-3 rounded border"
                  style={{
                    background: "hsl(220 13% 9%)",
                    borderColor: "hsl(220 15% 14%)",
                    color: key === "plan" ? "#0F766E" : "#cbd5e1",
                  }}
                >
                  {soapNote[key]}
                </p>
              </div>
            ))}
          </div>

          <div
            className="pt-4 flex justify-end gap-3 mt-4 border-t"
            style={{ borderColor: "hsl(220 15% 14%)" }}
          >
            <Button
              variant="outline"
              className="text-slate-400 border-slate-700 hover:bg-slate-800"
              onClick={handleDiscard}
            >
              Discard
            </Button>
            <Button
              className="text-white font-semibold"
              style={{ background: "#0F766E" }}
            >
              Sign &amp; Push to Vault
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
