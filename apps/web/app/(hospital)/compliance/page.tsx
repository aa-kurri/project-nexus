"use client";

import Link from "next/link";
import { TopBar } from "@/components/hospital/TopBar";
import { cn } from "@/lib/utils";
import { ShieldCheck, Link2, Baby, BadgeIndianRupee, Award, Pill, ChevronRight, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

const MODULES = [
  { href: "/compliance/abha",     icon: Link2,             label: "ABHA / ABDM",         desc: "Health ID linking, PHR, FHIR gateway", status: "partial",  statusLabel: "2 / 6 patients linked" },
  { href: "/compliance/pcpndt",   icon: Baby,              label: "PCPNDT Register",      desc: "Form F digital entries, monthly export", status: "active",  statusLabel: "42 scans this month" },
  { href: "/compliance/pmjay",    icon: BadgeIndianRupee,  label: "PMJAY Claims",         desc: "Ayushman Bharat pre-auth & claim cycle", status: "partial", statusLabel: "1 pending auth" },
  { href: "/compliance/nabh",     icon: Award,             label: "NABH Compliance",      desc: "Checklist, indicators, mock audit", status: "partial",     statusLabel: "Score: 71%" },
  { href: "/pharmacy/schedules",  icon: Pill,              label: "Drug Schedule H/H1/X", desc: "CDSCO triplicate register & enforcement", status: "inactive", statusLabel: "Not configured" },
];

const STATUS = {
  active:  { color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",    icon: CheckCircle2, label: "Active" },
  partial: { color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",  icon: AlertCircle,  label: "Partial" },
  inactive:{ color: "text-slate-500 bg-white/5 border-white/8",              icon: XCircle,      label: "Inactive" },
};

export default function CompliancePage() {
  return (
    <>
      <TopBar title="Compliance" />
      <main className="p-8 space-y-6">
        <p className="text-sm text-slate-500 max-w-2xl">
          India-specific regulatory compliance modules. Each module is independently configurable under
          <strong className="text-slate-300"> Admin → Modules</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const st = STATUS[m.status as keyof typeof STATUS];
            return (
              <Link key={m.href} href={m.href}
                className="group flex flex-col gap-4 p-5 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#0F766E]/30 transition-all">
                <div className="flex items-start justify-between">
                  <div className="h-11 w-11 rounded-xl bg-[#0F766E]/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[#0F766E]" />
                  </div>
                  <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider", st.color)}>
                    <st.icon className="h-3 w-3" />
                    {st.label}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-200 group-hover:text-white transition-colors">{m.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                  <p className="text-xs text-[#0F766E] mt-2">{m.statusLabel}</p>
                </div>
                <div className="flex items-center justify-end">
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-[#0F766E] transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
