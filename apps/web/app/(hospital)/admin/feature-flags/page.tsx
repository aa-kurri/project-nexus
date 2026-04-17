"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ToggleLeft, ToggleRight, Info, Save, RotateCcw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type MobileRole = "doctor" | "nurse" | "pharmacist" | "lab_tech" | "receptionist" | "patient";

interface Feature {
  key: string;
  label: string;
  desc: string;
  category: string;
}

type FlagMatrix = Record<string, Record<MobileRole, boolean>>;

// ─── Data ─────────────────────────────────────────────────────────────────────
const ROLES: { id: MobileRole; label: string; color: string }[] = [
  { id: "doctor",       label: "Doctor",       color: "text-blue-400" },
  { id: "nurse",        label: "Nurse",        color: "text-cyan-400" },
  { id: "pharmacist",   label: "Pharmacist",   color: "text-yellow-400" },
  { id: "lab_tech",     label: "Lab Tech",     color: "text-pink-400" },
  { id: "receptionist", label: "Receptionist", color: "text-slate-400" },
  { id: "patient",      label: "Patient",      color: "text-orange-400" },
];

const FEATURES: Feature[] = [
  // Clinical
  { key: "opd_queue",        label: "OPD Queue",           desc: "View & manage outpatient queue",         category: "Clinical" },
  { key: "ipd_view",         label: "IPD Ward View",       desc: "See admitted patient list & vitals",     category: "Clinical" },
  { key: "ai_scribe",        label: "AI Scribe",           desc: "Voice-to-prescription AI assistant",    category: "Clinical" },
  { key: "e_prescription",   label: "e-Prescription",      desc: "Create and send digital prescriptions",  category: "Clinical" },
  { key: "patient_timeline", label: "Patient Timeline",    desc: "Full clinical history view",             category: "Clinical" },
  { key: "vitals_capture",   label: "Vitals Capture",      desc: "Record BP, SpO2, temp, NEWS2 score",    category: "Clinical" },
  { key: "nursing_tasks",    label: "Nursing Tasks",       desc: "Task board: medications, procedures",   category: "Clinical" },
  // Lab & Pharmacy
  { key: "lab_orders",       label: "Lab Orders",          desc: "Order and view lab investigations",      category: "Lab & Pharmacy" },
  { key: "lab_results",      label: "Lab Results",         desc: "View test reports (staff + patient)",    category: "Lab & Pharmacy" },
  { key: "lab_collection",   label: "Sample Collection",   desc: "Mark samples as collected",             category: "Lab & Pharmacy" },
  { key: "dispense_drugs",   label: "Dispense Drugs",      desc: "Pharmacy dispensing workflow",          category: "Lab & Pharmacy" },
  { key: "stock_alerts",     label: "Stock Alerts",        desc: "Low-stock push notifications",          category: "Lab & Pharmacy" },
  // Billing & Admin
  { key: "billing_dashboard",label: "Billing Dashboard",   desc: "Revenue, collections, pre-auth",        category: "Billing & Admin" },
  { key: "bed_management",   label: "Bed Management",      desc: "Admit, transfer, discharge patients",   category: "Billing & Admin" },
  { key: "staff_directory",  label: "Staff Directory",     desc: "View all staff & on-duty status",       category: "Billing & Admin" },
  { key: "census_report",    label: "Census Report",       desc: "Daily bed census & occupancy stats",    category: "Billing & Admin" },
  // Patient App
  { key: "appointments",     label: "Appointments",        desc: "Book & manage appointments",            category: "Patient App" },
  { key: "rx_history",       label: "Rx History",          desc: "View past prescriptions",               category: "Patient App" },
  { key: "health_timeline",  label: "Health Timeline",     desc: "Personal health record timeline",       category: "Patient App" },
  { key: "teleconsult",      label: "Teleconsult",         desc: "Video consultation with doctor",        category: "Patient App" },
  { key: "abha_link",        label: "ABHA / ABDM Link",    desc: "Link Ayushman Bharat Health Account",   category: "Patient App" },
];

const CATEGORIES = ["Clinical", "Lab & Pharmacy", "Billing & Admin", "Patient App"];

// Default matrix — which roles get which features out-of-box
const DEFAULT_FLAGS: FlagMatrix = Object.fromEntries(
  FEATURES.map((f) => [
    f.key,
    {
      doctor:       ["opd_queue","ipd_view","ai_scribe","e_prescription","patient_timeline","lab_orders","lab_results","billing_dashboard","bed_management","census_report"].includes(f.key),
      nurse:        ["ipd_view","vitals_capture","nursing_tasks","lab_collection","lab_results","stock_alerts","bed_management"].includes(f.key),
      pharmacist:   ["dispense_drugs","stock_alerts","lab_results"].includes(f.key),
      lab_tech:     ["lab_orders","lab_results","lab_collection","stock_alerts"].includes(f.key),
      receptionist: ["opd_queue","bed_management","staff_directory","appointments"].includes(f.key),
      patient:      ["appointments","rx_history","health_timeline","teleconsult","lab_results","abha_link"].includes(f.key),
    },
  ])
);

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function FeatureFlagsPage() {
  const [flags, setFlags]         = useState<FlagMatrix>(DEFAULT_FLAGS);
  const [activeRole, setActiveRole] = useState<MobileRole>("doctor");
  const [saved, setSaved]         = useState(false);
  const [category, setCategory]   = useState("All");

  const filtered = category === "All" ? FEATURES : FEATURES.filter((f) => f.category === category);

  function toggle(featureKey: string, role: MobileRole) {
    setFlags((prev) => ({
      ...prev,
      [featureKey]: { ...prev[featureKey], [role]: !prev[featureKey][role] },
    }));
    setSaved(false);
  }

  function toggleAll(role: MobileRole) {
    const allOn = filtered.every((f) => flags[f.key][role]);
    setFlags((prev) => {
      const next = { ...prev };
      filtered.forEach((f) => {
        next[f.key] = { ...next[f.key], [role]: !allOn };
      });
      return next;
    });
    setSaved(false);
  }

  function reset() {
    setFlags(DEFAULT_FLAGS);
    setSaved(false);
  }

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const activeRoleCfg = ROLES.find((r) => r.id === activeRole)!;
  const enabledCount = FEATURES.filter((f) => flags[f.key][activeRole]).length;

  return (
    <>
      <TopBar title="Feature Flags" />
      <main className="p-8 space-y-6">

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5 p-4">
          <Info className="h-4 w-4 text-[#0F766E] mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">
            Control which features each staff role and patients can access in the mobile app.
            Changes take effect on next login. Use the <strong className="text-slate-300">role tabs</strong> to
            switch between roles, or the <strong className="text-slate-300">matrix view</strong> to compare all roles at once.
          </p>
        </div>

        {/* Role tabs */}
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => {
            const on = FEATURES.filter((f) => flags[f.key][r.id]).length;
            return (
              <button key={r.id} onClick={() => setActiveRole(r.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                  activeRole === r.id
                    ? "bg-[#0F766E]/15 border-[#0F766E]/30 text-[#0F766E]"
                    : "border-white/8 text-muted hover:bg-white/5 hover:text-fg"
                )}>
                <span className={cn("text-xs", activeRole === r.id ? "text-[#0F766E]" : r.color)}>{r.label}</span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  activeRole === r.id ? "bg-[#0F766E]/20 text-[#0F766E]" : "bg-white/5 text-slate-500")}>
                  {on}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category filter + action bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap gap-2">
            {["All", ...CATEGORIES].map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium border transition-all",
                  category === c
                    ? "bg-[#0F766E] text-white border-[#0F766E]"
                    : "border-white/8 text-muted hover:text-fg hover:bg-white/5"
                )}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span><span className={activeRoleCfg.color}>{activeRoleCfg.label}</span> — {enabledCount}/{FEATURES.length} features enabled</span>
            <button onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 text-slate-400 hover:text-fg hover:bg-white/5 transition-all">
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
            <button onClick={save}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                saved ? "bg-[#0F766E]/20 text-[#0F766E] border border-[#0F766E]/30" : "bg-[#0F766E] text-white hover:bg-[#0F766E]/90"
              )}>
              <Save className="h-3.5 w-3.5" />
              {saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Feature flag matrix */}
        {CATEGORIES.filter((c) => category === "All" || c === category).map((cat) => {
          const catFeatures = FEATURES.filter((f) => f.category === cat);
          return (
            <Card key={cat} className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/20 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs uppercase tracking-widest text-slate-500">{cat}</CardTitle>
                  <button onClick={() => toggleAll(activeRole)}
                    className="text-[11px] text-[#0F766E] hover:underline">
                    {catFeatures.every((f) => flags[f.key][activeRole]) ? "Disable all" : "Enable all"}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-white/5">
                  {catFeatures.map((f) => {
                    const on = flags[f.key][activeRole];
                    return (
                      <div key={f.key}
                        className="flex items-center justify-between py-3.5 hover:bg-white/[0.01] transition-colors">
                        <div className="flex-1 min-w-0 mr-8">
                          <p className={cn("text-sm font-medium", on ? "text-slate-100" : "text-slate-500")}>
                            {f.label}
                          </p>
                          <p className="text-[11px] text-slate-600 mt-0.5">{f.desc}</p>
                        </div>

                        {/* Per-role mini dots (all roles) */}
                        <div className="flex items-center gap-3 mr-6">
                          {ROLES.filter((r) => r.id !== activeRole).map((r) => (
                            <div key={r.id} title={r.label}
                              className={cn("h-2 w-2 rounded-full",
                                flags[f.key][r.id] ? "bg-white/20" : "bg-white/5")} />
                          ))}
                        </div>

                        {/* Toggle for active role */}
                        <button onClick={() => toggle(f.key, activeRole)}
                          className="shrink-0 transition-transform hover:scale-105">
                          {on
                            ? <ToggleRight className="h-7 w-7 text-[#0F766E]" />
                            : <ToggleLeft className="h-7 w-7 text-slate-600" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </main>
    </>
  );
}
