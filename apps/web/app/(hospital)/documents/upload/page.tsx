"use client";

import { useState, useRef, useCallback } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Upload, Scan, FileText, Image, AlertCircle, CheckCircle2,
  Loader2, Copy, Languages, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ocrDocument, LANGUAGE_OPTIONS } from "../actions";
import { useRouter } from "next/navigation";

type OcrState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | {
      phase:      "done";
      text:       string;
      confidence: number;
      language:   string;
      pageCount:  number;
      structured: { docType: string | null; fields: Record<string, string> };
    };

const ACCEPT = "image/jpeg,image/png,image/webp,image/tiff,application/pdf";

function confidenceColor(c: number) {
  if (c >= 0.85) return "text-[#0F766E]";
  if (c >= 0.65) return "text-orange-400";
  return "text-red-400";
}

function confidenceLabel(c: number) {
  if (c >= 0.85) return "High confidence";
  if (c >= 0.65) return "Medium confidence";
  return "Low confidence — review carefully";
}

export default function UploadOcrPage() {
  const router                        = useRouter();
  const fileInput                     = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]       = useState(false);
  const [file, setFile]               = useState<File | null>(null);
  const [preview, setPreview]         = useState<string | null>(null);
  const [hintLang, setHintLang]       = useState("auto");
  const [state, setState]             = useState<OcrState>({ phase: "idle" });
  const [copied, setCopied]           = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setState({ phase: "idle" });
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile],
  );

  const runOcr = async () => {
    if (!file) return;
    setState({ phase: "loading" });
    const fd = new FormData();
    fd.append("file", file);
    if (hintLang !== "auto") fd.append("language_code", hintLang);

    const res = await ocrDocument(fd);
    if (!res.ok) {
      setState({ phase: "error", message: res.error });
      return;
    }
    setState({
      phase:      "done",
      text:       res.text,
      confidence: res.confidence,
      language:   res.language,
      pageCount:  res.pageCount,
      structured: res.structured,
    });
  };

  const copyText = () => {
    if (state.phase !== "done") return;
    navigator.clipboard.writeText(state.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goTranslate = () => {
    if (state.phase !== "done") return;
    const encoded = encodeURIComponent(state.text.slice(0, 4000));
    router.push(`/documents/translate?text=${encoded}&src=${state.language}`);
  };

  return (
    <>
      <TopBar title="Upload & OCR" />
      <main className="p-8 space-y-6 max-w-5xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Upload panel */}
          <div className="space-y-4">
            <Card className="border-border/40 bg-surface/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#0F766E]" /> Upload Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Dropzone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInput.current?.click()}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all",
                    dragging
                      ? "border-[#0F766E] bg-[#0F766E]/10"
                      : "border-white/10 hover:border-[#0F766E]/50 hover:bg-[#0F766E]/5"
                  )}
                >
                  <input
                    ref={fileInput}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      {file.type.startsWith("image/")
                        ? <Image className="h-8 w-8 text-[#0F766E]" />
                        : <FileText className="h-8 w-8 text-[#0F766E]" />}
                      <p className="text-sm font-medium text-slate-200 truncate max-w-full px-4">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB · click to change</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Scan className="h-10 w-10 text-slate-600" />
                      <p className="text-sm text-slate-400">Drag & drop or click to upload</p>
                      <p className="text-[11px] text-slate-600">JPEG · PNG · WebP · TIFF · PDF · Max 20 MB</p>
                    </div>
                  )}
                </div>

                {/* Language hint */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 block mb-1.5">
                    Document Language (optional hint)
                  </label>
                  <div className="relative">
                    <select
                      value={hintLang}
                      onChange={(e) => setHintLang(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 appearance-none cursor-pointer focus:outline-none focus:border-[#0F766E]/50"
                    >
                      <option value="auto">Auto-detect</option>
                      {LANGUAGE_OPTIONS.map((l) => (
                        <option key={l.code} value={l.code}>{l.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">Providing a language hint improves accuracy for handwritten regional scripts.</p>
                </div>

                <button
                  onClick={runOcr}
                  disabled={!file || state.phase === "loading"}
                  className="w-full rounded-xl bg-[#0F766E] hover:bg-[#0F766E]/90 disabled:opacity-40 py-2.5 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
                >
                  {state.phase === "loading" ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Extracting text…</>
                  ) : (
                    <><Scan className="h-4 w-4" /> Run OCR</>
                  )}
                </button>
              </CardContent>
            </Card>

            {/* Preview */}
            {preview && (
              <Card className="border-border/40 bg-surface/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-slate-400">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Document preview" className="w-full rounded-lg object-contain max-h-64" />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results panel */}
          <div>
            {state.phase === "idle" && (
              <div className="h-full min-h-64 rounded-xl border border-dashed border-white/8 flex items-center justify-center">
                <p className="text-sm text-slate-600">OCR results will appear here</p>
              </div>
            )}

            {state.phase === "error" && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400">OCR Failed</p>
                  <p className="text-xs text-slate-400 mt-1">{state.message}</p>
                </div>
              </div>
            )}

            {state.phase === "done" && (
              <Card className="border-border/40 bg-surface/50 h-full">
                <CardHeader className="pb-3 border-b border-border/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#0F766E]" /> Extracted Text
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-semibold", confidenceColor(state.confidence))}>
                        {Math.round(state.confidence * 100)}% · {confidenceLabel(state.confidence)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 text-[10px] text-slate-500">
                    <span>{state.pageCount} page{state.pageCount !== 1 ? "s" : ""}</span>
                    <span>·</span>
                    <span>{LANGUAGE_OPTIONS.find(l => l.code === state.language)?.label ?? state.language}</span>
                    {state.structured.docType && (
                      <><span>·</span><span className="text-[#0F766E]">{state.structured.docType}</span></>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">

                  {/* Structured fields (prescription, lab report, etc.) */}
                  {Object.keys(state.structured.fields).length > 0 && (
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-1.5">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Structured Fields</p>
                      {Object.entries(state.structured.fields).map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-xs">
                          <span className="text-slate-500 min-w-24 capitalize">{k.replace(/_/g, " ")}</span>
                          <span className="text-slate-200">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Raw OCR text */}
                  <div className="relative">
                    <pre className="rounded-lg bg-black/30 p-4 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto font-sans">
                      {state.text || "(No text extracted — try a clearer image)"}
                    </pre>
                    <button
                      onClick={copyText}
                      className="absolute top-2 right-2 rounded-md p-1.5 bg-white/5 hover:bg-white/10 transition-colors"
                      title="Copy text"
                    >
                      <Copy className={cn("h-3.5 w-3.5", copied ? "text-[#0F766E]" : "text-slate-500")} />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={goTranslate}
                      className="flex-1 rounded-lg border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 py-2 text-xs font-medium text-blue-400 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Languages className="h-3.5 w-3.5" /> Translate this text
                    </button>
                    <a
                      href={`/documents/ocr-review`}
                      className="flex-1 rounded-lg border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 py-2 text-xs font-medium text-purple-400 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5" /> Review & Correct
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
