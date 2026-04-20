"use client";

import Link from "next/link";
import { TopBar } from "@/components/hospital/TopBar";
import { FileText, Scan, Languages, CheckSquare, Zap, Globe, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    title:       "Upload & OCR",
    description: "Scan prescriptions, lab reports, and referral letters in any Indian script. AI extracts structured text instantly.",
    href:        "/documents/upload",
    icon:        Scan,
    color:       "text-[#0F766E]",
    bg:          "bg-[#0F766E]/10",
    border:      "border-[#0F766E]/20 hover:border-[#0F766E]/50",
    badge:       "Sarvam OCR",
    badgeColor:  "bg-[#0F766E]/15 text-[#0F766E]",
  },
  {
    title:       "Clinical Translator",
    description: "Translate discharge summaries, prescriptions, and consent forms to the patient's preferred language in real time.",
    href:        "/documents/translate",
    icon:        Languages,
    color:       "text-blue-400",
    bg:          "bg-blue-500/10",
    border:      "border-blue-500/20 hover:border-blue-500/50",
    badge:       "22 Indian Languages",
    badgeColor:  "bg-blue-500/15 text-blue-400",
  },
  {
    title:       "OCR Review",
    description: "Human-in-the-loop correction of AI-extracted text. Side-by-side original image + editable text with structured field extraction.",
    href:        "/documents/ocr-review",
    icon:        CheckSquare,
    color:       "text-purple-400",
    bg:          "bg-purple-500/10",
    border:      "border-purple-500/20 hover:border-purple-500/50",
    badge:       "Human-in-Loop",
    badgeColor:  "bg-purple-500/15 text-purple-400",
  },
];

const WHY_SARVAM = [
  { icon: Globe,   label: "22 Official Indian Languages",  desc: "Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Marathi, Punjabi, Odia + more" },
  { icon: FileText,label: "Indian Script Handwriting OCR", desc: "Trained on Indian medical records — superior accuracy on handwritten prescriptions in regional scripts" },
  { icon: Shield,  label: "India-Hosted · DPDPA Ready",    desc: "Data residency in India — no cross-border transfer. Compliant with DPDPA 2023 requirements" },
  { icon: Zap,     label: "Sub-second Translation",         desc: "Real-time API — translate a full discharge summary in < 1 second" },
];

export default function DocumentsHubPage() {
  return (
    <>
      <TopBar title="Document Intelligence" />
      <main className="p-8 space-y-10">

        {/* Hero */}
        <div className="rounded-2xl border border-[#0F766E]/20 bg-[#0F766E]/5 px-8 py-6 flex items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-[#0F766E]/15 flex items-center justify-center shrink-0">
            <FileText className="h-7 w-7 text-[#0F766E]" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-100">Powered by Sarvam AI</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              India's leading multilingual AI — OCR, translation, and document understanding across all 22 official Indian languages.
              Set <code className="bg-white/5 px-1 rounded text-[#0F766E] text-xs font-mono">SARVAM_API_KEY</code> in{" "}
              <code className="bg-white/5 px-1 rounded text-slate-400 text-xs font-mono">.env.local</code> to activate.
            </p>
          </div>
          <a
            href="https://docs.sarvam.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-[#0F766E]/30 px-4 py-2 text-xs font-medium text-[#0F766E] hover:bg-[#0F766E]/10 transition-colors"
          >
            View Docs →
          </a>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href}
              className={cn(
                "group rounded-2xl border bg-surface/40 p-6 transition-all hover:bg-surface/70",
                f.border
              )}
            >
              <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center mb-4", f.bg)}>
                <f.icon className={cn("h-5 w-5", f.color)} />
              </div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-semibold text-slate-100 group-hover:text-white transition-colors">
                  {f.title}
                </h3>
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0", f.badgeColor)}>
                  {f.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
              <div className={cn("mt-4 text-xs font-medium flex items-center gap-1 transition-all group-hover:gap-2", f.color)}>
                Open <span>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Why Sarvam AI */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-4">Why Sarvam AI for Indian Hospitals</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WHY_SARVAM.map((w) => (
              <div key={w.label} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <w.icon className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">{w.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration note */}
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-yellow-400">Setup Required</p>
          <p>1. Sign up at <strong className="text-slate-300">console.sarvam.ai</strong> and copy your API subscription key.</p>
          <p>2. Add to <code className="bg-white/5 px-1 rounded font-mono">apps/web/.env.local</code>:</p>
          <pre className="mt-1 bg-black/30 rounded-lg p-3 font-mono text-[#0F766E] overflow-x-auto">
            SARVAM_API_KEY=your_subscription_key_here
          </pre>
          <p>3. Restart the dev server. OCR and translation will activate automatically.</p>
        </div>

      </main>
    </>
  );
}
