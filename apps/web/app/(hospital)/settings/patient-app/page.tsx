"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Smartphone, CheckCircle2, Users, Download, Link2,
  ToggleLeft, ToggleRight, QrCode, Settings2,
} from "lucide-react";

interface AppSection {
  key: string;
  label: string;
  desc: string;
  enabled: boolean;
  abhaRequired: boolean;
}

const INITIAL_SECTIONS: AppSection[] = [
  { key: "appointments",  label: "Appointments",          desc: "Book, reschedule, cancel appointments online",              enabled: true,  abhaRequired: false },
  { key: "queue_status",  label: "Queue Status",           desc: "Live OPD token tracking & wait time estimate",              enabled: true,  abhaRequired: false },
  { key: "lab_reports",   label: "Lab Reports",            desc: "Download validated lab and radiology reports",              enabled: true,  abhaRequired: false },
  { key: "rx_history",    label: "Prescription History",   desc: "View all digital prescriptions issued",                    enabled: true,  abhaRequired: false },
  { key: "phr_abha",      label: "Health Records (ABHA)",  desc: "ABHA-linked Personal Health Record with consent flow",     enabled: true,  abhaRequired: true  },
  { key: "teleconsult",   label: "Teleconsult",            desc: "Book and join video consultation with doctor",              enabled: true,  abhaRequired: false },
  { key: "bill_payment",  label: "Bill Payment",           desc: "Pay hospital bills via UPI, cards, net banking",           enabled: false, abhaRequired: false },
  { key: "discharge_docs",label: "Discharge Documents",    desc: "Download discharge summary and certificates",               enabled: true,  abhaRequired: false },
  { key: "family_access", label: "Family Access",          desc: "Grant family member access to patient records",            enabled: false, abhaRequired: true  },
];

const APP_STATS = [
  { label: "App Downloads",    value: "1,284" },
  { label: "Active Users (7d)",value: "342"   },
  { label: "ABHA Linked",      value: "204"   },
  { label: "Reports Downloaded",value: "892"  },
];

export default function PatientAppPage() {
  const [sections, setSections] = useState<AppSection[]>(INITIAL_SECTIONS);
  const [saved, setSaved]       = useState(false);

  function toggle(key: string) {
    setSections((prev) => prev.map((s) => s.key === key ? { ...s, enabled: !s.enabled } : s));
    setSaved(false);
  }

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <TopBar title="Patient Mobile App" />
      <main className="p-8 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {APP_STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
              <p className="text-3xl font-bold mt-1 text-[#0F766E]">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sections config */}
          <div className="lg:col-span-2">
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-[#0F766E]" /> App Sections
                </CardTitle>
                <button onClick={save}
                  className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    saved ? "bg-[#0F766E]/20 text-[#0F766E] border border-[#0F766E]/30" : "bg-[#0F766E] text-white hover:bg-[#0F766E]/90")}>
                  {saved ? "Saved!" : "Save"}
                </button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-white/5">
                  {sections.map((s) => (
                    <div key={s.key} className="flex items-center gap-5 py-3.5">
                      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                        s.enabled ? "bg-[#0F766E]/10" : "bg-white/5")}>
                        <Smartphone className={cn("h-4 w-4", s.enabled ? "text-[#0F766E]" : "text-slate-600")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm font-medium", s.enabled ? "text-slate-200" : "text-slate-500")}>{s.label}</p>
                          {s.abhaRequired && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold">ABHA</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{s.desc}</p>
                      </div>
                      <button onClick={() => toggle(s.key)} className="shrink-0 transition-transform hover:scale-105">
                        {s.enabled
                          ? <ToggleRight className="h-7 w-7 text-[#0F766E]" />
                          : <ToggleLeft  className="h-7 w-7 text-slate-600" />}
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* App QR + links */}
          <div className="space-y-4">
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/20 pb-3">
                <CardTitle className="text-sm">App Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="h-32 w-32 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-500 text-center">Scan to download<br/>City General Health app</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Google Play",  icon: Download, href: "#" },
                    { label: "App Store",    icon: Download, href: "#" },
                    { label: "Patient Portal (Web)", icon: Link2, href: "#" },
                  ].map((link) => (
                    <a key={link.label} href={link.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/8 text-slate-300 hover:text-fg hover:bg-white/5 transition-all text-sm">
                      <link.icon className="h-4 w-4 text-[#0F766E] shrink-0" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardContent className="pt-4 space-y-3">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Active Sections</p>
                <p className="text-3xl font-bold text-[#0F766E]">{sections.filter(s => s.enabled).length}<span className="text-sm text-slate-500 font-normal"> / {sections.length}</span></p>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0F766E] rounded-full"
                    style={{ width: `${(sections.filter(s => s.enabled).length / sections.length) * 100}%` }} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
