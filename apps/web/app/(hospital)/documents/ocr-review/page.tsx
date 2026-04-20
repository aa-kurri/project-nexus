"use client";

import { useState, useRef, useCallback } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  CheckSquare, Upload, Scan, Loader2, CheckCircle2, AlertCircle,
  Edit3, Save, RotateCcw, Tag, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ocrDocument, saveOcrResult, LANGUAGE_OPTIONS } from "../actions";

// ── Prescription field extractor (heuristic, client-side) ─────────────────────
// Parses common prescription patterns from raw OCR text.

function extractPrescriptionFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Patient name — look for "Name:" or "Patient:" prefix
  const nameLine = lines.find((l) => /^(patient\s*name|name)\s*[:：]/i.test(l));
  if (nameLine) fields["Patient Name"] = nameLine.split(/[:：]/)[1]?.trim() ?? "";

  // Date — look for DD/MM/YYYY or YYYY-MM-DD
  const dateMatch = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
  if (dateMatch) fields["Date"] = dateMatch[1];

  // Doctor name — look for "Dr." prefix
  const drLine = lines.find((l) => /\bDr\.?\s+[A-Z]/i.test(l));
  if (drLine) fields["Doctor"] = drLine.replace(/^.*?Dr\.?\s*/i, "Dr. ").split(/[,\n]/)[0].trim();

  // Medicine lines — Tab./Cap./Inj./Syp. prefix
  const drugs = lines
    .filter((l) => /^(tab|cap|inj|syp|oint|drops|gel|cream)\b/i.test(l))
    .slice(0, 5);
  if (drugs.length > 0) fields["Medications"] = drugs.join(" | ");

  // Diagnosis — look for "Dx:" or "Diagnosis:"
  const dxLine = lines.find((l) => /^(dx|diagnosis|impression)\s*[:：]/i.test(l));
  if (dxLine) fields["Diagnosis"] = dxLine.split(/[:：]/)[1]?.trim() ?? "";

  return fields;
}

type ReviewState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | {
      phase:        "review";
      rawText:      string;
      editedText:   string;
      confidence:   number;
      language:     string;
      docType:      string | null;
      fields:       Record<string, string>;
      prescription: Record<string, string>;
      saved:        boolean;
    };

const ACCEPT = "image/jpeg,image/png,image/webp,image/tiff,application/pdf";

export default function OcrReviewPage() {
  const fileInput                 = useRef<HTMLInputElement>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [hintLang, setHintLang]   = useState("auto");
  const [state, setState]         = useState<ReviewState>({ phase: "idle" });

  const handleFile = useCallback(async (f: File) => {
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
    setState({ phase: "loading" });

    const fd = new FormData();
    fd.append("file", f);
    if (hintLang !== "auto") fd.append("language_code", hintLang);

    const res = await ocrDocument(fd);
    if (!res.ok) {
      setState({ phase: "error", message: res.error });
      return;
    }

    setState({
      phase:        "review",
      rawText:      res.text,
      editedText:   res.text,
      confidence:   res.confidence,
      language:     res.language,
      docType:      res.structured.docType,
      fields:       res.structured.fields,
      prescription: extractPrescriptionFields(res.text),
      saved:        false,
    });
  }, [hintLang]);

  const updateText = (v: string) => {
    if (state.phase !== "review") return;
    setState({ ...state, editedText: v, saved: false });
  };

  const resetToRaw = () => {
    if (state.phase !== "review") return;
    setState({ ...state, editedText: state.rawText, saved: false });
  };

  const save = async () => {
    if (state.phase !== "review") return;
    const res = await saveOcrResult("", state.editedText); // documentId from context in real flow
    if (res.ok) setState({ ...state, saved: true });
  };

  const hasEdits = state.phase === "review" && state.editedText !== state.rawText;

  return (
    <>
      <TopBar title="OCR Review" />
      <main className="p-8 space-y-6 max-w-7xl mx-auto">

        {/* Upload strip */}
        <Card className="border-border/40 bg-surface/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-52">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 block mb-1">Document Language Hint</label>
                <div className="relative">
                  <select
                    value={hintLang}
                    onChange={(e) => setHintLang(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 appearance-none cursor-pointer focus:outline-none"
                  >
                    <option value="auto">Auto-detect</option>
                    {LANGUAGE_OPTIONS.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <button
                onClick={() => fileInput.current?.click()}
                disabled={state.phase === "loading"}
                className="mt-4 rounded-xl bg-[#0F766E] hover:bg-[#0F766E]/90 disabled:opacity-40 px-5 py-2.5 text-sm font-semibold text-white transition-colors flex items-center gap-2"
              >
                {state.phase === "loading" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Scanning…</>
                ) : (
                  <><Upload className="h-4 w-4" /> Upload for Review</>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {state.phase === "idle" && (
          <div className="rounded-xl border border-dashed border-white/8 py-20 text-center">
            <Scan className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-600">Upload a document to begin OCR review</p>
            <p className="text-xs text-slate-700 mt-1">Prescriptions, lab reports, referral letters, consent forms</p>
          </div>
        )}

        {state.phase === "error" && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-400">OCR Failed</p>
              <p className="text-xs text-slate-400 mt-1">{state.message}</p>
            </div>
          </div>
        )}

        {state.phase === "review" && (
          <>
            {/* Meta bar */}
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className={cn("font-semibold",
                state.confidence >= 0.85 ? "text-[#0F766E]" :
                state.confidence >= 0.65 ? "text-orange-400" : "text-red-400"
              )}>
                {Math.round(state.confidence * 100)}% confidence
              </span>
              <span>·</span>
              <span>{LANGUAGE_OPTIONS.find(l => l.code === state.language)?.label ?? state.language}</span>
              {state.docType && <><span>·</span><span className="text-purple-400">{state.docType}</span></>}
              {hasEdits && <span className="text-yellow-400 font-medium">· Unsaved edits</span>}
              {state.saved && (
                <span className="flex items-center gap-1 text-[#0F766E]">
                  <CheckCircle2 className="h-3 w-3" /> Saved
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Original image (col 1) */}
              <Card className="border-border/40 bg-surface/50">
                <CardHeader className="pb-2 border-b border-border/20">
                  <CardTitle className="text-xs text-slate-400">Original Document</CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Original" className="w-full rounded-lg object-contain max-h-[500px]" />
                  ) : (
                    <div className="h-48 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center">
                      <p className="text-xs text-slate-600">PDF — no visual preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Editable OCR text (col 2) */}
              <Card className="border-border/40 bg-surface/50">
                <CardHeader className="pb-2 border-b border-border/20">
                  <CardTitle className="text-xs text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Edit3 className="h-3 w-3" /> Extracted Text (editable)
                    </span>
                    <div className="flex gap-2">
                      {hasEdits && (
                        <button onClick={resetToRaw} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300">
                          <RotateCcw className="h-3 w-3" /> Reset
                        </button>
                      )}
                      <button onClick={save} className="flex items-center gap-1 text-[10px] text-[#0F766E] hover:text-[#0F766E]/80">
                        <Save className="h-3 w-3" /> Save
                      </button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3">
                  <textarea
                    value={state.editedText}
                    onChange={(e) => updateText(e.target.value)}
                    className="w-full h-[460px] bg-black/20 rounded-lg p-3 text-xs text-slate-300 resize-none focus:outline-none leading-relaxed border border-white/5 focus:border-[#0F766E]/30 transition-colors font-mono"
                    placeholder="OCR text will appear here…"
                  />
                </CardContent>
              </Card>

              {/* Structured fields (col 3) */}
              <Card className="border-border/40 bg-surface/50">
                <CardHeader className="pb-2 border-b border-border/20">
                  <CardTitle className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Tag className="h-3 w-3 text-purple-400" /> Structured Extract
                    <span className="ml-auto text-[10px] font-normal text-slate-600">heuristic model</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-5">

                  {/* Sarvam structured fields */}
                  {Object.keys(state.fields).length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">API Extracted</p>
                      <div className="space-y-2">
                        {Object.entries(state.fields).map(([k, v]) => (
                          <div key={k} className="rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2">
                            <p className="text-[10px] uppercase text-slate-600">{k}</p>
                            <p className="text-xs text-slate-200 mt-0.5">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prescription heuristic extract */}
                  {Object.keys(state.prescription).length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">Prescription Fields</p>
                      <div className="space-y-2">
                        {Object.entries(state.prescription).map(([k, v]) => (
                          <div key={k} className="rounded-lg bg-purple-500/5 border border-purple-500/10 px-3 py-2">
                            <p className="text-[10px] uppercase text-purple-500">{k}</p>
                            <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(state.fields).length === 0 && Object.keys(state.prescription).length === 0 && (
                    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-5 text-center">
                      <CheckSquare className="h-6 w-6 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-600">No structured fields detected.</p>
                      <p className="text-[11px] text-slate-700 mt-1">For prescriptions, ensure drug names follow standard abbreviations (Tab./Cap./Inj.).</p>
                    </div>
                  )}

                  {/* Confidence legend */}
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 space-y-1.5">
                    <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">Confidence Guide</p>
                    {[
                      { range: "≥ 85%", label: "High — accept as-is",            color: "text-[#0F766E]" },
                      { range: "65–84%", label: "Medium — spot-check key fields", color: "text-orange-400" },
                      { range: "< 65%",  label: "Low — full manual review needed", color: "text-red-400"    },
                    ].map((c) => (
                      <div key={c.range} className="flex items-center gap-2 text-[11px]">
                        <span className={cn("font-mono font-bold w-14", c.color)}>{c.range}</span>
                        <span className="text-slate-500">{c.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </>
  );
}
