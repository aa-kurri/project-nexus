"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit, Send, Loader2, User, Bot, AlertCircle, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  text: string;
  sources?: number;
}

const SUGGESTED = [
  "What medications was the patient taking during the last visit?",
  "Summarise the last 3 SOAP notes for this patient",
  "What was the assessment in the most recent consultation?",
  "Are there any drug allergy mentions in the notes?",
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [patientId, setPatientId] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [, startTx]             = useTransition();
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    setError(null);
    setInput("");

    const userMsg: Message = { role: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    startTx(async () => {
      try {
        const res = await fetch("/api/ai/copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            patientId: patientId.trim() || undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: json.answer, sources: json.sourceCount },
        ]);
      } catch (e: any) {
        setError(e.message ?? "Failed to get a response.");
        // Remove the optimistic user message on error
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setLoading(false);
      }
    });
  }

  return (
    <>
      <TopBar title="AI Copilot" action={{ label: "Scribe", href: "/ai/scribe" }} />
      <main className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto p-6 gap-4">

        {/* Patient context filter */}
        <Card className="border-border/40 bg-surface/50 shrink-0">
          <CardContent className="py-3 flex items-center gap-4">
            <BrainCircuit className="h-4 w-4 text-[#0F766E] shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">
                Patient ID (optional — leave blank to search all notes)
              </label>
              <input
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter patient UUID to scope the query…"
                className="w-full bg-transparent text-sm text-fg placeholder:text-muted/40 outline-none"
              />
            </div>
            {patientId && (
              <button onClick={() => setPatientId("")} className="text-xs text-muted hover:text-fg">
                Clear
              </button>
            )}
          </CardContent>
        </Card>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="h-20 w-20 rounded-2xl bg-[#0F766E]/10 border border-[#0F766E]/20 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-[#0F766E]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-fg">Ayura Copilot</h2>
                <p className="text-sm text-muted max-w-sm">
                  Ask clinical questions grounded in real EMR notes — SOAP, transcripts, medications, labs.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mt-2">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-left rounded-xl border border-border/40 bg-surface/50 px-4 py-3 text-xs text-muted hover:border-[#0F766E]/40 hover:text-fg transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <div className={cn(
                "h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold",
                m.role === "user"
                  ? "bg-gradient-to-br from-[#0F766E] to-teal-400 text-white"
                  : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
              )}>
                {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div className={cn(
                "flex-1 max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-[#0F766E]/10 border border-[#0F766E]/20 text-slate-200 rounded-tr-sm"
                  : "bg-surface border border-border/40 text-slate-300 rounded-tl-sm"
              )}>
                <div
                  className="prose prose-sm prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: m.text
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em>$1</em>")
                      .replace(/^- (.+)$/gm, "<li>$1</li>")
                      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
                      .replace(/\n/g, "<br/>"),
                  }}
                />
                {m.role === "assistant" && m.sources != null && (
                  <p className="mt-2 text-[10px] text-muted border-t border-border/20 pt-2">
                    Grounded in {m.sources} EMR note{m.sources !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
                <Bot className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-border/40 bg-surface px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#0F766E]" />
                <span className="text-xs text-muted">Searching EMR and reasoning…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <Card className="border-border/40 bg-surface/80 shrink-0">
          <CardContent className="py-3 flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask a clinical question… (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 resize-none bg-transparent text-sm text-fg placeholder:text-muted/40 outline-none leading-relaxed"
            />
            <Button
              size="sm"
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="bg-[#0F766E] hover:bg-[#115E59] h-9 w-9 p-0 rounded-xl shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
