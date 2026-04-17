"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FlaskConical, AlertTriangle, TrendingUp, BarChart3, ShieldCheck } from "lucide-react";

type Susceptibility = "S" | "I" | "R" | "ND";

const SUC_CFG: Record<Susceptibility, { label: string; color: string }> = {
  S:  { label: "S",  color: "bg-[#0F766E]/80 text-white" },
  I:  { label: "I",  color: "bg-yellow-500/70 text-white" },
  R:  { label: "R",  color: "bg-red-500/80 text-white"    },
  ND: { label: "ND", color: "bg-white/10 text-slate-600"  },
};

const ANTIBIOTICS = [
  "Amikacin", "Amoxicillin-Clav", "Ampicillin", "Azithromycin",
  "Cefazolin", "Cefepime", "Ceftriaxone", "Ciprofloxacin",
  "Clindamycin", "Colistin", "Ertapenem", "Imipenem",
  "Levofloxacin", "Meropenem", "Metronidazole", "Piperacillin-Tazo",
  "Trimethoprim-Sulfa", "Vancomycin",
];

interface OrganismRow {
  organism: string;
  n: number;
  susceptibility: Record<string, Susceptibility>;
}

const ORGANISMS: OrganismRow[] = [
  { organism: "E. coli", n: 34,
    susceptibility: { Amikacin:"S", "Amoxicillin-Clav":"R", Ampicillin:"R", Azithromycin:"ND", Cefazolin:"I", Cefepime:"S", Ceftriaxone:"R", Ciprofloxacin:"R", Clindamycin:"ND", Colistin:"S", Ertapenem:"S", Imipenem:"S", Levofloxacin:"R", Meropenem:"S", Metronidazole:"ND", "Piperacillin-Tazo":"I", "Trimethoprim-Sulfa":"R", Vancomycin:"ND" }},
  { organism: "Klebsiella pneumoniae", n: 22,
    susceptibility: { Amikacin:"S", "Amoxicillin-Clav":"R", Ampicillin:"R", Azithromycin:"ND", Cefazolin:"R", Cefepime:"I", Ceftriaxone:"R", Ciprofloxacin:"I", Clindamycin:"ND", Colistin:"S", Ertapenem:"I", Imipenem:"I", Levofloxacin:"I", Meropenem:"I", Metronidazole:"ND", "Piperacillin-Tazo":"R", "Trimethoprim-Sulfa":"R", Vancomycin:"ND" }},
  { organism: "Staphylococcus aureus (MRSA)", n: 18,
    susceptibility: { Amikacin:"R", "Amoxicillin-Clav":"R", Ampicillin:"R", Azithromycin:"R", Cefazolin:"R", Cefepime:"R", Ceftriaxone:"R", Ciprofloxacin:"R", Clindamycin:"I", Colistin:"ND", Ertapenem:"ND", Imipenem:"ND", Levofloxacin:"R", Meropenem:"ND", Metronidazole:"ND", "Piperacillin-Tazo":"R", "Trimethoprim-Sulfa":"I", Vancomycin:"S" }},
  { organism: "Pseudomonas aeruginosa", n: 15,
    susceptibility: { Amikacin:"S", "Amoxicillin-Clav":"R", Ampicillin:"R", Azithromycin:"ND", Cefazolin:"R", Cefepime:"I", Ceftriaxone:"R", Ciprofloxacin:"I", Clindamycin:"ND", Colistin:"S", Ertapenem:"I", Imipenem:"I", Levofloxacin:"I", Meropenem:"S", Metronidazole:"ND", "Piperacillin-Tazo":"S", "Trimethoprim-Sulfa":"R", Vancomycin:"ND" }},
  { organism: "Acinetobacter baumannii", n: 11,
    susceptibility: { Amikacin:"R", "Amoxicillin-Clav":"R", Ampicillin:"R", Azithromycin:"ND", Cefazolin:"R", Cefepime:"R", Ceftriaxone:"R", Ciprofloxacin:"R", Clindamycin:"ND", Colistin:"S", Ertapenem:"R", Imipenem:"R", Levofloxacin:"R", Meropenem:"R", Metronidazole:"ND", "Piperacillin-Tazo":"R", "Trimethoprim-Sulfa":"R", Vancomycin:"ND" }},
  { organism: "Enterococcus faecalis", n: 9,
    susceptibility: { Amikacin:"ND", "Amoxicillin-Clav":"S", Ampicillin:"S", Azithromycin:"R", Cefazolin:"ND", Cefepime:"ND", Ceftriaxone:"ND", Ciprofloxacin:"R", Clindamycin:"R", Colistin:"ND", Ertapenem:"ND", Imipenem:"ND", Levofloxacin:"I", Meropenem:"ND", Metronidazole:"ND", "Piperacillin-Tazo":"ND", "Trimethoprim-Sulfa":"R", Vancomycin:"S" }},
];

const HAI_RATES = [
  { label: "CAUTI (catheter UTI)",         value: "2.1%", benchmark: "< 2%",  flag: true  },
  { label: "SSI (surgical site infection)", value: "1.8%", benchmark: "< 1.5%",flag: true  },
  { label: "VAP (ventilator-assoc. pneumonia)", value: "1.2%", benchmark: "< 2%",flag: false },
  { label: "CLABSI (central line BSI)",    value: "0.8%", benchmark: "< 1%",  flag: false },
];

export default function AntibiogramPage() {
  const [activeTab, setActiveTab] = useState<"antibiogram" | "hai">("antibiogram");
  const [highlightR, setHighlightR] = useState(false);

  return (
    <>
      <TopBar title="Infection Control + Antibiogram" />
      <main className="p-8 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Total Cultures (Apr)</p>
            <p className="text-3xl font-bold mt-1 text-[#0F766E]">109</p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Organisms Isolated</p>
            <p className="text-3xl font-bold mt-1 text-[#0F766E]">{ORGANISMS.length}</p>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">HAI Events (Apr)</p>
            <p className="text-3xl font-bold mt-1 text-red-400">3</p>
          </div>
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Carbapenem Resistance</p>
            <p className="text-3xl font-bold mt-1 text-yellow-400">18%</p>
          </div>
        </div>

        <div className="flex gap-2">
          {(["antibiogram","hai"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all",
                activeTab === t ? "bg-[#0F766E] text-white border-[#0F766E]" : "border-white/8 text-muted hover:text-fg hover:bg-white/5"
              )}>
              {t === "antibiogram" ? "Antibiogram Matrix" : "HAI Surveillance"}
            </button>
          ))}
          {activeTab === "antibiogram" && (
            <button onClick={() => setHighlightR(!highlightR)}
              className={cn("ml-auto px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                highlightR ? "bg-red-500/20 border-red-500/30 text-red-400" : "border-white/8 text-muted hover:bg-white/5")}>
              {highlightR ? "Showing R only" : "Highlight Resistant"}
            </button>
          )}
        </div>

        {activeTab === "antibiogram" && (
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl overflow-x-auto">
            <CardHeader className="border-b border-border/20 pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-[#0F766E]" /> Cumulative Antibiogram — April 2026 (CLSI breakpoints)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="text-xs border-separate border-spacing-0.5">
                  <thead>
                    <tr>
                      <th className="sticky left-0 text-left py-2 pr-4 bg-[hsl(220,15%,6%)] text-[10px] uppercase tracking-widest text-slate-500 font-bold min-w-[200px]">Organism (n)</th>
                      {ANTIBIOTICS.map((ab) => (
                        <th key={ab} className="py-2 px-1 text-[9px] text-slate-500 font-bold whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", maxHeight: "80px" }}>
                          {ab}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ORGANISMS.map((row) => (
                      <tr key={row.organism}>
                        <td className="sticky left-0 py-2 pr-4 bg-[hsl(220,15%,6%)] font-medium text-slate-200 whitespace-nowrap">
                          {row.organism} <span className="text-slate-600 font-normal">(n={row.n})</span>
                        </td>
                        {ANTIBIOTICS.map((ab) => {
                          const suc = row.susceptibility[ab] as Susceptibility || "ND";
                          const cfg = SUC_CFG[suc];
                          const dim = highlightR && suc !== "R";
                          return (
                            <td key={ab} className="p-0.5">
                              <div className={cn("h-7 w-7 rounded flex items-center justify-center text-[10px] font-bold transition-opacity", cfg.color, dim && "opacity-20")}>
                                {cfg.label}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                {(["S","I","R","ND"] as Susceptibility[]).map((s) => (
                  <div key={s} className="flex items-center gap-1.5 text-xs">
                    <div className={cn("h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold", SUC_CFG[s].color)}>{s}</div>
                    <span className="text-slate-500">{s === "S" ? "Susceptible" : s === "I" ? "Intermediate" : s === "R" ? "Resistant" : "Not Determined"}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "hai" && (
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
            <CardHeader className="border-b border-border/20 pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#0F766E]" /> HAI Surveillance Rates — April 2026
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {HAI_RATES.map((h) => (
                  <div key={h.label} className={cn("flex items-center gap-6 p-4 rounded-xl border", h.flag ? "border-red-500/20 bg-red-500/5" : "border-white/5 bg-white/[0.02]")}>
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", h.flag ? "bg-red-500/10" : "bg-[#0F766E]/10")}>
                      {h.flag ? <AlertTriangle className="h-4 w-4 text-red-400" /> : <ShieldCheck className="h-4 w-4 text-[#0F766E]" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-200">{h.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Benchmark: {h.benchmark}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-2xl font-bold font-mono", h.flag ? "text-red-400" : "text-[#0F766E]")}>{h.value}</p>
                      {h.flag && <p className="text-[10px] text-red-400 font-bold">ABOVE THRESHOLD</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
