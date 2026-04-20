"use client";

import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Clock, XCircle, ShieldCheck, ExternalLink,
  FileCode2, Lock, ClipboardList, Heart, UserCheck,
} from "lucide-react";

type CheckStatus = "done" | "in-progress" | "pending";

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  status: CheckStatus;
  codeFile: string;
  docUrl: string;
  icon: React.ElementType;
}

const CHECKLIST: ComplianceItem[] = [
  {
    id: "abha-linking",
    title: "ABHA Linking Flow",
    description:
      "Patient ABHA (Ayushman Bharat Health Account) ID creation and linking via ABDM gateway. Supports OTP-based verification and demographic auth.",
    status: "done",
    codeFile: "app/api/auth/abha/route.ts",
    docUrl: "https://sandbox.abdm.gov.in/docs/abha_number",
    icon: UserCheck,
  },
  {
    id: "consent-manager",
    title: "Consent Manager Integration",
    description:
      "Health Information Provider (HIP) consent artefact handling — receive, store, and honour patient consent grants/revocations from the ABDM consent manager.",
    status: "in-progress",
    codeFile: "app/api/consent/route.ts",
    docUrl: "https://sandbox.abdm.gov.in/docs/consent_manager",
    icon: ClipboardList,
  },
  {
    id: "fhir-conformance",
    title: "FHIR R4 Profile Conformance",
    description:
      "All clinical resources (Patient, Encounter, Observation, DiagnosticReport) conform to ABDM FHIR R4 Implementation Guide profiles. Validated via /api/fhir/validate.",
    status: "in-progress",
    codeFile: "app/api/fhir/validate/route.ts",
    docUrl: "https://nrces.in/ndhm/fhir/r4/index.html",
    icon: Heart,
  },
  {
    id: "phi-encryption",
    title: "PHI Encryption at Rest",
    description:
      "All Protected Health Information stored in Supabase is encrypted at rest via AES-256 (managed keys). Row-Level Security via jwt_tenant() prevents cross-tenant access.",
    status: "done",
    codeFile: "supabase/migrations/20260101000000_rls.sql",
    docUrl: "https://abdm.gov.in/publications/policies_regulations/digital_health_data_management_policy",
    icon: Lock,
  },
  {
    id: "audit-log",
    title: "Audit Log Completeness",
    description:
      "HMAC-chained immutable audit trail for all PHI access, consent events, and administrative actions. Retention ≥ 7 years per DPDP Act requirements.",
    status: "done",
    codeFile: "app/api/audit/route.ts",
    docUrl: "https://abdm.gov.in/publications/policies_regulations",
    icon: ShieldCheck,
  },
];

const STATUS_CFG: Record<CheckStatus, { label: string; color: string; icon: React.ElementType }> = {
  done:        { label: "Done",        color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/30", icon: CheckCircle2 },
  "in-progress": { label: "In Progress", color: "text-amber-400 bg-amber-500/10 border-amber-500/30",  icon: Clock        },
  pending:     { label: "Pending",     color: "text-red-400 bg-red-500/10 border-red-500/30",        icon: XCircle      },
};

export default function CompliancePage() {
  const done       = CHECKLIST.filter((i) => i.status === "done").length;
  const inProgress = CHECKLIST.filter((i) => i.status === "in-progress").length;
  const total      = CHECKLIST.length;
  const pct        = Math.round((done / total) * 100);

  return (
    <>
      <TopBar title="ABDM HIP Compliance" />
      <main className="p-8 space-y-6">

        {/* Summary score */}
        <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Certification Readiness</p>
                <p className="text-4xl font-bold text-slate-100">
                  {done}
                  <span className="text-xl text-slate-500 font-normal"> / {total} requirements met</span>
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {inProgress > 0 ? `${inProgress} item${inProgress > 1 ? "s" : ""} in progress · ` : ""}
                  {total - done - inProgress} pending
                </p>
              </div>
              <div className="relative shrink-0 h-20 w-20">
                <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="#0F766E"
                    strokeWidth="3"
                    strokeDasharray={`${pct} ${100 - pct}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-200">
                  {pct}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0F766E] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <div className="space-y-3">
          {CHECKLIST.map((item) => {
            const cfg     = STATUS_CFG[item.status];
            const Icon    = item.icon;
            const CfgIcon = cfg.icon;
            return (
              <Card key={item.id} className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/8 shrink-0">
                      <Icon className="h-5 w-5 text-[#0F766E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-semibold text-slate-100">{item.title}</p>
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                          cfg.color
                        )}>
                          <CfgIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <FileCode2 className="h-3.5 w-3.5" />
                          <code className="font-mono text-slate-400">{item.codeFile}</code>
                        </span>
                        <a
                          href={item.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[#0F766E] hover:text-teal-300 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          ABDM Docs
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-slate-600 text-center pb-2">
          NHA audit readiness tracker · ABDM HIP/HRP · FHIR R4 · DPDP Act 2023
        </p>
      </main>
    </>
  );
}
