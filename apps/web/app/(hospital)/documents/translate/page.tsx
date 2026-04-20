"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Languages, ArrowRight, Loader2, Copy, CheckCircle2, AlertCircle,
  RotateCcw, Save, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { translateText, saveTranslation, LANGUAGE_OPTIONS, type LangCode } from "../actions";

const MAX_CHARS = 5000;

type TranslateState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "done"; translatedText: string; targetLang: string };

// Common clinical quick-phrases for testing
const QUICK_PHRASES = [
  { label: "Discharge instructions",  text: "Take the medicines as prescribed. Rest for 5 days. Return to hospital if fever exceeds 101°F or pain worsens. Follow up with your doctor after 1 week." },
  { label: "Prescription note",       text: "Tab. Metformin 500 mg — twice daily after meals for 3 months. Tab. Amlodipine 5 mg — once daily in the morning. Avoid alcohol." },
  { label: "Dietary advice",          text: "Avoid oily, spicy food. Eat small frequent meals. Drink at least 2 litres of water daily. Avoid salt if you have high blood pressure." },
  { label: "Pre-surgery instructions", text: "Do not eat or drink anything for 6 hours before the surgery. Come with a relative or attendant. Bring all previous reports and X-rays." },
];

export default function TranslatePage() {
  const params                           = useSearchParams();
  const [sourceText, setSourceText]      = useState(params.get("text") ?? "");
  const [sourceLang, setSourceLang]      = useState<LangCode>(
    (params.get("src") as LangCode | null) ?? "en-IN"
  );
  const [targetLang, setTargetLang]      = useState<LangCode>("hi-IN");
  const [gender, setGender]             = useState<"Male" | "Female">("Female");
  const [state, setState]               = useState<TranslateState>({ phase: "idle" });
  const [copied, setCopied]             = useState(false);
  const [saved, setSaved]               = useState(false);

  // Auto-translate when arriving from OCR page with pre-filled text
  useEffect(() => {
    const prefill = params.get("text");
    if (prefill && prefill.length > 10) {
      setSourceText(decodeURIComponent(prefill));
    }
  }, [params]);

  const swapLangs = () => {
    const prev = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(prev);
    if (state.phase === "done") {
      setSourceText(state.translatedText);
      setState({ phase: "idle" });
    }
  };

  const run = useCallback(async () => {
    if (!sourceText.trim()) return;
    setState({ phase: "loading" });

    const res = await translateText(sourceText, sourceLang, targetLang, gender);
    if (!res.ok) {
      setState({ phase: "error", message: res.error });
      return;
    }
    setState({ phase: "done", translatedText: res.translatedText, targetLang });
  }, [sourceText, sourceLang, targetLang, gender]);

  const copy = () => {
    if (state.phase !== "done") return;
    navigator.clipboard.writeText(state.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = async () => {
    if (state.phase !== "done") return;
    const res = await saveTranslation({
      sourceText,
      translatedText: state.translatedText,
      sourceLang,
      targetLang,
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const langLabel = (code: string) =>
    LANGUAGE_OPTIONS.find((l) => l.code === code)?.label ?? code;

  return (
    <>
      <TopBar title="Clinical Translator" />
      <main className="p-8 space-y-6 max-w-6xl mx-auto">

        {/* Language bar */}
        <Card className="border-border/40 bg-surface/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Source language */}
              <div className="flex-1 min-w-40">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 block mb-1">Source Language</label>
                <div className="relative">
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value as LangCode)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 appearance-none cursor-pointer focus:outline-none focus:border-[#0F766E]/50"
                  >
                    {LANGUAGE_OPTIONS.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Swap */}
              <button
                onClick={swapLangs}
                className="mt-4 rounded-full p-2 border border-white/10 hover:border-[#0F766E]/40 hover:bg-[#0F766E]/5 transition-colors text-slate-400 hover:text-[#0F766E]"
                title="Swap languages"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {/* Target language */}
              <div className="flex-1 min-w-40">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 block mb-1">Target Language</label>
                <div className="relative">
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value as LangCode)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 appearance-none cursor-pointer focus:outline-none focus:border-[#0F766E]/50"
                  >
                    {LANGUAGE_OPTIONS.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Speaker gender (affects TTS tone if used downstream) */}
              <div className="min-w-32">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 block mb-1">Speaker Gender</label>
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                  {(["Female", "Male"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={cn(
                        "flex-1 py-2 text-xs font-medium transition-colors",
                        gender === g
                          ? "bg-[#0F766E]/20 text-[#0F766E]"
                          : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Translate */}
              <button
                onClick={run}
                disabled={!sourceText.trim() || state.phase === "loading" || sourceLang === targetLang}
                className="mt-4 rounded-xl bg-[#0F766E] hover:bg-[#0F766E]/90 disabled:opacity-40 px-5 py-2.5 text-sm font-semibold text-white transition-colors flex items-center gap-2"
              >
                {state.phase === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Languages className="h-4 w-4" />
                )}
                Translate
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Quick phrases */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Quick Clinical Phrases</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PHRASES.map((q) => (
              <button
                key={q.label}
                onClick={() => { setSourceText(q.text); setState({ phase: "idle" }); }}
                className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-slate-400 hover:text-slate-200 hover:border-white/20 transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Translation panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Source */}
          <Card className="border-border/40 bg-surface/50">
            <CardHeader className="pb-2 border-b border-border/20">
              <CardTitle className="text-xs text-slate-400 flex items-center justify-between">
                <span>{langLabel(sourceLang)}</span>
                <span className={cn("text-[10px]", sourceText.length > MAX_CHARS * 0.9 ? "text-orange-400" : "text-slate-600")}>
                  {sourceText.length}/{MAX_CHARS}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <textarea
                value={sourceText}
                onChange={(e) => { setSourceText(e.target.value); setState({ phase: "idle" }); }}
                maxLength={MAX_CHARS}
                placeholder="Paste or type clinical text here — discharge summary, prescription, patient instructions…"
                className="w-full h-72 bg-transparent text-sm text-slate-300 placeholder:text-slate-600 resize-none focus:outline-none leading-relaxed"
              />
            </CardContent>
          </Card>

          {/* Target */}
          <Card className={cn(
            "border-border/40 bg-surface/50 relative",
            state.phase === "done" && "border-[#0F766E]/20"
          )}>
            <CardHeader className="pb-2 border-b border-border/20">
              <CardTitle className="text-xs text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  {state.phase === "done" && <CheckCircle2 className="h-3 w-3 text-[#0F766E]" />}
                  {langLabel(targetLang)}
                </span>
                {state.phase === "done" && (
                  <div className="flex gap-2">
                    <button
                      onClick={copy}
                      className="flex items-center gap-1 text-[10px] hover:text-[#0F766E] transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={save}
                      className="flex items-center gap-1 text-[10px] hover:text-[#0F766E] transition-colors"
                    >
                      <Save className="h-3 w-3" />
                      {saved ? "Saved!" : "Save"}
                    </button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              {state.phase === "idle" && (
                <div className="h-72 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <ArrowRight className="h-8 w-8 text-slate-700 mx-auto" />
                    <p className="text-xs text-slate-600">Translation will appear here</p>
                  </div>
                </div>
              )}
              {state.phase === "loading" && (
                <div className="h-72 flex items-center justify-center gap-2 text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Translating via Sarvam AI…</span>
                </div>
              )}
              {state.phase === "error" && (
                <div className="h-72 flex items-start p-2">
                  <div className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 w-full">
                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-red-400">Translation failed</p>
                      <p className="text-xs text-slate-400 mt-1">{state.message}</p>
                    </div>
                  </div>
                </div>
              )}
              {state.phase === "done" && (
                <div className="h-72 overflow-y-auto text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {state.translatedText}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info footer */}
        <p className="text-center text-[11px] text-slate-600">
          Powered by Sarvam AI · Formal mode · Data stays within India · Not a substitute for certified medical translation
        </p>
      </main>
    </>
  );
}
