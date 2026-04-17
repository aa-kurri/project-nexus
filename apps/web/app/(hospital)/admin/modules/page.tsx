"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ToggleLeft, ToggleRight, Settings2, ChevronRight,
  ShieldCheck, Stethoscope, BadgeDollarSign, Smartphone, Wrench,
  CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ModuleStatus = "active" | "inactive" | "setup_required";
type ModuleCategory = "Compliance" | "Clinical" | "Financial" | "Patient Engagement" | "Operations";

interface ModuleConfig {
  id: string;
  label: string;
  desc: string;
  category: ModuleCategory;
  status: ModuleStatus;
  enabled: boolean;
  fields: ConfigField[];
}

interface ConfigField {
  key: string;
  label: string;
  type: "text" | "toggle" | "select" | "number" | "textarea";
  value: string | boolean;
  placeholder?: string;
  options?: string[];
  hint?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORY_META: Record<ModuleCategory, { icon: React.ElementType; color: string }> = {
  "Compliance":         { icon: ShieldCheck,       color: "text-purple-400" },
  "Clinical":           { icon: Stethoscope,        color: "text-blue-400"   },
  "Financial":          { icon: BadgeDollarSign,    color: "text-yellow-400" },
  "Patient Engagement": { icon: Smartphone,         color: "text-cyan-400"   },
  "Operations":         { icon: Wrench,             color: "text-orange-400" },
};

const CATEGORIES: ModuleCategory[] = [
  "Compliance", "Clinical", "Financial", "Patient Engagement", "Operations",
];

const INITIAL_MODULES: ModuleConfig[] = [
  // ── Compliance ──────────────────────────────────────────────────────────────
  {
    id: "abha", label: "ABHA / ABDM Integration", category: "Compliance",
    desc: "Link Ayushman Bharat Health Accounts, share PHR via ABDM gateway. Mandatory for PMJAY empanelment.",
    status: "setup_required", enabled: false,
    fields: [
      { key: "hip_id",       label: "HIP ID (NHA assigned)",     type: "text",   value: "", placeholder: "e.g. IN0410000123" },
      { key: "gateway_url",  label: "HIE-CM Gateway URL",        type: "text",   value: "", placeholder: "https://dev.abdm.gov.in/gateway" },
      { key: "client_id",    label: "Client ID",                 type: "text",   value: "", placeholder: "ABDM client ID" },
      { key: "client_secret",label: "Client Secret",             type: "text",   value: "", placeholder: "••••••••••••" },
      { key: "sandbox",      label: "Use Sandbox (testing)",     type: "toggle", value: true },
      { key: "abha_at_reg",  label: "Generate ABHA at Registration", type: "toggle", value: true },
      { key: "phr_consent",  label: "Require PHR Consent before share", type: "toggle", value: true },
    ],
  },
  {
    id: "pcpndt", label: "PCPNDT Digital Register", category: "Compliance",
    desc: "Form F digital entry for ultrasound facilities. Prevents ₹10L fines and machine sealing during PCPNDT inspections.",
    status: "inactive", enabled: false,
    fields: [
      { key: "machine_serial",  label: "USG Machine Serial No.",    type: "text",   value: "", placeholder: "Serial number on PCPNDT certificate" },
      { key: "machine_make",    label: "Machine Make & Model",      type: "text",   value: "", placeholder: "e.g. GE Voluson E8" },
      { key: "operators",       label: "Authorised Operators",      type: "textarea",value: "", placeholder: "One name per line (NMC reg. numbers)" },
      { key: "dist_authority",  label: "District Authority Email",  type: "text",   value: "", placeholder: "For monthly report auto-email" },
      { key: "reminder_day",    label: "Monthly Report Reminder (day of month)", type: "number", value: "1" },
      { key: "tamper_sign",     label: "Require digital signature on Form F", type: "toggle", value: true },
    ],
  },
  {
    id: "pmjay", label: "PMJAY / Ayushman Bharat Claims", category: "Compliance",
    desc: "Beneficiary eligibility check, pre-auth XML, ICD-10 procedure coding, claim submission to NHA portal.",
    status: "inactive", enabled: false,
    fields: [
      { key: "rohini_id",     label: "Hospital ROHINI ID",          type: "text",   value: "", placeholder: "e.g. 1.3.6.1.4.1.21367.100.1" },
      { key: "scheme_code",   label: "Ayushman Scheme Code",        type: "text",   value: "", placeholder: "State scheme code from NHA" },
      { key: "state",         label: "State",                       type: "select", value: "Telangana", options: ["Telangana","Andhra Pradesh","Maharashtra","Karnataka","Tamil Nadu","Kerala","Delhi","Rajasthan","UP","Other"] },
      { key: "nha_api_key",   label: "NHA API Key",                 type: "text",   value: "", placeholder: "From NHA partner portal" },
      { key: "auto_eligibility",label: "Auto-check eligibility at IPD Admit", type: "toggle", value: true },
      { key: "auto_preauth",  label: "Auto-draft pre-auth for admit diagnoses", type: "toggle", value: false },
      { key: "claim_icd_strict",label: "Block claim without ICD-10 code", type: "toggle", value: true },
    ],
  },
  {
    id: "drug_schedule", label: "Drug Schedule H/H1/X Enforcement", category: "Compliance",
    desc: "CDSCO-mandated triplicate logging for Schedule X (narcotics), register for H1 antibiotics. Prevents criminal liability.",
    status: "inactive", enabled: false,
    fields: [
      { key: "enforce_h",     label: "Enforce Schedule H (require Rx)", type: "toggle", value: true },
      { key: "enforce_h1",    label: "Enforce Schedule H1 (antibiotics register)", type: "toggle", value: true },
      { key: "enforce_x",     label: "Enforce Schedule X (triplicate + NMC ID)", type: "toggle", value: true },
      { key: "block_no_rx",   label: "Block dispense if no linked Rx for H/H1", type: "toggle", value: false },
      { key: "x_register_email", label: "Schedule X Register Email (monthly)", type: "text", value: "", placeholder: "Pharmacist in charge email" },
      { key: "drug_db",       label: "Drug Classification Database", type: "select", value: "MIMS India", options: ["MIMS India", "CIMS India", "Manual (in-house)"] },
    ],
  },
  {
    id: "nabh", label: "NABH Compliance Module", category: "Compliance",
    desc: "800+ checklist items, SOP repository, mock audit workflow, non-conformance tracking. Required for insurance empanelments.",
    status: "inactive", enabled: false,
    fields: [
      { key: "accreditation_no",  label: "NABH Accreditation No.",    type: "text",   value: "", placeholder: "Leave blank if not yet accredited" },
      { key: "accreditation_body",label: "Accreditation Body",        type: "select", value: "NABH", options: ["NABH","NABL","JCI","ISO 15189","Other"] },
      { key: "survey_due",        label: "Next Survey Due Date",      type: "text",   value: "", placeholder: "DD-MM-YYYY" },
      { key: "quality_head",      label: "Quality / NABH Coordinator Email", type: "text", value: "", placeholder: "For checklist reminders" },
      { key: "auto_indicator",    label: "Auto-capture clinical indicators from EMR/LIMS", type: "toggle", value: true },
      { key: "mock_audit_freq",   label: "Mock Audit Frequency",      type: "select", value: "Quarterly", options: ["Monthly","Quarterly","Half-yearly","Annual"] },
    ],
  },

  // ── Clinical ─────────────────────────────────────────────────────────────────
  {
    id: "cpoe", label: "CPOE — Computerised Physician Orders", category: "Clinical",
    desc: "Doctor orders (meds, labs, imaging, diet) routed electronically to pharmacy/LIMS/radiology. AI Scribe → CPOE auto-fill.",
    status: "inactive", enabled: false,
    fields: [
      { key: "order_types",   label: "Enabled Order Types",         type: "select", value: "All", options: ["All","Medications only","Medications + Labs","Medications + Labs + Radiology"] },
      { key: "cosign",        label: "Co-sign required (Resident → Attending)", type: "toggle", value: true },
      { key: "scribe_autofill",label: "AI Scribe auto-populates CPOE",          type: "toggle", value: true },
      { key: "verbal_order",  label: "Allow verbal order entry (with mandatory sign-off in 24h)", type: "toggle", value: false },
      { key: "duplicate_alert",label: "Alert on duplicate active orders",        type: "toggle", value: true },
      { key: "freq_default",  label: "Default medication frequency",             type: "select", value: "OD", options: ["OD","BD","TDS","QID","SOS","STAT"] },
    ],
  },
  {
    id: "mar", label: "MAR / eMAR — Medication Administration", category: "Clinical",
    desc: "Closed-loop medication: order → dispense → nurse scan-to-administer. Missed dose alerts. NABH patient safety requirement.",
    status: "inactive", enabled: false,
    fields: [
      { key: "barcode_required",  label: "Require barcode scan (drug + wristband)", type: "toggle", value: true },
      { key: "missed_alert_hrs",  label: "Missed dose alert after (hours)",          type: "number", value: "2" },
      { key: "prn_confirm",       label: "PRN dose requires nurse note",             type: "toggle", value: true },
      { key: "shift_handover",    label: "MAR shown in shift handover checklist",    type: "toggle", value: true },
      { key: "witness_required",  label: "High-alert drugs require witness co-sign", type: "toggle", value: true },
      { key: "high_alert_list",   label: "High-Alert Drug List",                     type: "textarea", value: "Insulin\nHeparin\nMorphine\nPotassium Chloride", hint: "One drug per line" },
    ],
  },
  {
    id: "icu_flowsheet", label: "ICU Flowsheet", category: "Clinical",
    desc: "Vitals trending, ventilator parameters, fluid balance, APACHE II/SOFA scoring, shift handover notes.",
    status: "inactive", enabled: false,
    fields: [
      { key: "icu_units",      label: "ICU Unit Names",        type: "textarea", value: "ICU\nCCU\nNICU", hint: "One unit per line" },
      { key: "hl7_monitor",    label: "HL7 Bedside Monitor Feed", type: "toggle", value: false, hint: "Auto-captures vitals from Philips/GE monitors" },
      { key: "apache_ii",      label: "APACHE II Scoring",        type: "toggle", value: true },
      { key: "sofa",           label: "SOFA Scoring",             type: "toggle", value: true },
      { key: "gcs",            label: "Glasgow Coma Scale",        type: "toggle", value: true },
      { key: "news2",          label: "NEWS2 Early Warning",       type: "toggle", value: true },
      { key: "vent_params",    label: "Ventilator Parameters",     type: "toggle", value: true },
      { key: "fluid_balance",  label: "Fluid Balance (I&O)",       type: "toggle", value: true },
      { key: "critical_alert_threshold", label: "Critical alert: SpO2 below (%)", type: "number", value: "90" },
    ],
  },
  {
    id: "drug_cds", label: "Drug Interaction + Allergy CDS", category: "Clinical",
    desc: "Real-time drug-drug and drug-allergy alerts at CPOE and pharmacy dispense. Reduces adverse drug events.",
    status: "inactive", enabled: false,
    fields: [
      { key: "cds_db",          label: "Drug Database",              type: "select", value: "MIMS India", options: ["MIMS India","CIMS India","RxNorm (Open)","Manual"] },
      { key: "alert_level",     label: "Minimum alert severity",     type: "select", value: "Moderate", options: ["Minor","Moderate","Major","Contraindicated only"] },
      { key: "allergy_capture", label: "Capture allergy at registration", type: "toggle", value: true },
      { key: "hard_stop_contra",label: "Hard-stop for contraindicated pairs", type: "toggle", value: true },
      { key: "override_reason", label: "Require override reason for Major alerts", type: "toggle", value: true },
      { key: "dispense_check",  label: "Alert at pharmacy dispense (not just order)", type: "toggle", value: true },
    ],
  },
  {
    id: "ot_management", label: "OT / Surgical Case Management", category: "Clinical",
    desc: "OT scheduling board, WHO surgical safety checklist, anaesthesia notes, implant/prosthesis batch tracking.",
    status: "inactive", enabled: false,
    fields: [
      { key: "ot_count",        label: "Number of Operating Theatres", type: "number", value: "2" },
      { key: "who_checklist",   label: "Enforce WHO Surgical Safety Checklist", type: "toggle", value: true },
      { key: "implant_tracking",label: "Implant/prosthesis batch number tracking", type: "toggle", value: true },
      { key: "anaes_notes",     label: "Anaesthesia notes module",      type: "toggle", value: true },
      { key: "pack_tracking",   label: "Surgical pack tracking (CSSD link)", type: "toggle", value: false },
      { key: "ot_utilisation",  label: "OT utilisation analytics",     type: "toggle", value: true },
      { key: "surgeon_sms",     label: "SMS surgeon when OT slot confirmed", type: "toggle", value: true },
    ],
  },

  // ── Financial ────────────────────────────────────────────────────────────────
  {
    id: "package_billing", label: "Package Billing Engine", category: "Financial",
    desc: "Fixed-price surgery and procedure packages with inclusions/exclusions, partial consumption refunds, insurance mapping.",
    status: "inactive", enabled: false,
    fields: [
      { key: "pkg_categories",  label: "Package Categories",           type: "textarea", value: "Surgical\nMaternity\nCardiac\nOrthopedic\nGeneral", hint: "One per line" },
      { key: "gst_on_pkg",      label: "GST applicable on packages",   type: "toggle", value: false },
      { key: "partial_refund",  label: "Allow partial consumption refund", type: "toggle", value: true },
      { key: "insurance_map",   label: "Map packages to insurance procedure codes", type: "toggle", value: true },
      { key: "pkg_expire_days", label: "Package validity (days from admission)", type: "number", value: "30" },
      { key: "addon_billing",   label: "Allow add-on billing over package amount", type: "toggle", value: true },
    ],
  },
  {
    id: "tpa_cycle", label: "TPA Cashless Full Cycle", category: "Financial",
    desc: "Policy verification → pre-auth → enhancement requests → final bill submission → settlement reconciliation.",
    status: "inactive", enabled: false,
    fields: [
      { key: "tpa_list",        label: "Empanelled TPAs",              type: "textarea", value: "Vidal Health\nParamount TPA\nRaksha TPA\nHealth India\nMD India", hint: "One per line" },
      { key: "nha_api_verify",  label: "NHA API policy verification",  type: "toggle", value: false },
      { key: "enhancement_alert",label: "Alert when 80% of approved amount utilised", type: "toggle", value: true },
      { key: "auto_final_bill", label: "Auto-generate final bill at discharge", type: "toggle", value: true },
      { key: "reconcile_cycle", label: "Settlement reconciliation cycle", type: "select", value: "Weekly", options: ["Daily","Weekly","Fortnightly","Monthly"] },
      { key: "tpa_portal_link", label: "TPA portal URL (for direct login)", type: "text", value: "", placeholder: "https://tpa-portal.com/hospital-login" },
    ],
  },
  {
    id: "revenue_audit", label: "Revenue Leakage / Charge Capture Audit", category: "Financial",
    desc: "Compares orders issued vs charges billed. Flags unbilled services. Typically recovers 15–20% revenue.",
    status: "inactive", enabled: false,
    fields: [
      { key: "check_interval_hrs", label: "Audit scan every (hours)",    type: "number", value: "4" },
      { key: "leak_threshold_pct", label: "Flag if unbilled orders exceed (% of bill)", type: "number", value: "5" },
      { key: "alert_billing_staff",label: "Email billing staff on flag",  type: "toggle", value: true },
      { key: "auto_add_charge",    label: "Auto-add missed charges (with approval)", type: "toggle", value: false },
      { key: "audit_modules",      label: "Modules to audit",            type: "select", value: "All", options: ["All","Pharmacy only","LIMS only","OT only","Pharmacy + LIMS"] },
    ],
  },

  // ── Patient Engagement ───────────────────────────────────────────────────────
  {
    id: "patient_app", label: "Patient Mobile App / PHR", category: "Patient Engagement",
    desc: "Patient-facing app: appointments, queue status, lab reports, prescriptions, ABHA PHR, teleconsult, bill payment.",
    status: "inactive", enabled: false,
    fields: [
      { key: "app_name",        label: "App Display Name",             type: "text",   value: "", placeholder: "e.g. Chenna Reddy Health" },
      { key: "app_logo_url",    label: "App Logo URL",                 type: "text",   value: "", placeholder: "https://..." },
      { key: "enable_teleconsult",label: "Enable teleconsult in app",  type: "toggle", value: true },
      { key: "enable_reports",  label: "Lab/radiology report download", type: "toggle", value: true },
      { key: "enable_rx",       label: "Prescription history view",    type: "toggle", value: true },
      { key: "enable_bill_pay", label: "Online bill payment",          type: "toggle", value: false },
      { key: "enable_abha",     label: "ABHA health ID integration",   type: "toggle", value: true },
      { key: "report_delay_hrs",label: "Release lab reports after (hours)", type: "number", value: "0", hint: "0 = immediate on validation" },
    ],
  },
  {
    id: "whatsapp", label: "WhatsApp Business API Notifications", category: "Patient Engagement",
    desc: "Automated clinical notifications: token call, lab ready, discharge summary, appointment reminders, OTP.",
    status: "inactive", enabled: false,
    fields: [
      { key: "wati_api_key",    label: "WATI / Interakt API Key",      type: "text",   value: "", placeholder: "Bearer token from WATI dashboard" },
      { key: "wa_number",       label: "WhatsApp Business Number",     type: "text",   value: "", placeholder: "+919100000000" },
      { key: "appt_reminder",   label: "Appointment reminder (24h before)", type: "toggle", value: true },
      { key: "token_call",      label: "Token call notification",      type: "toggle", value: true },
      { key: "lab_ready",       label: "Lab report ready",             type: "toggle", value: true },
      { key: "discharge_summary",label: "Discharge summary delivery",  type: "toggle", value: true },
      { key: "bill_receipt",    label: "Bill receipt on payment",      type: "toggle", value: true },
      { key: "admit_family",    label: "IPD admission alert to family number", type: "toggle", value: true },
      { key: "otp_channel",     label: "Send OTP via WhatsApp (fallback SMS)", type: "toggle", value: false },
    ],
  },
  {
    id: "surveys", label: "Patient Satisfaction Survey", category: "Patient Engagement",
    desc: "Post-discharge NPS survey via WhatsApp/SMS. Department-wise sentiment analysis. Required for NABH.",
    status: "inactive", enabled: false,
    fields: [
      { key: "trigger",         label: "Survey trigger",               type: "select", value: "On discharge", options: ["On discharge","2 hours after discharge","Next day","3 days after discharge"] },
      { key: "channel",         label: "Delivery channel",             type: "select", value: "WhatsApp", options: ["WhatsApp","SMS","Both"] },
      { key: "scale",           label: "Rating scale",                 type: "select", value: "NPS (0–10)", options: ["NPS (0–10)","Star (1–5)","Smiley (1–3)"] },
      { key: "dept_breakdown",  label: "Department-wise scoring",      type: "toggle", value: true },
      { key: "alert_low_score", label: "Alert quality head if NPS < 6",type: "toggle", value: true },
      { key: "anonymize",       label: "Anonymise responses in reports",type: "toggle", value: false },
    ],
  },

  // ── Operations ───────────────────────────────────────────────────────────────
  {
    id: "infection_control", label: "Infection Control + Antibiogram", category: "Operations",
    desc: "HAI surveillance (CAUTI, SSI, VAP), organism resistance patterns from LIMS culture data, antibiogram dashboard.",
    status: "inactive", enabled: false,
    fields: [
      { key: "hai_types",       label: "HAI Types to track",           type: "select", value: "All", options: ["All","CAUTI only","SSI only","VAP only","CAUTI + SSI + VAP"] },
      { key: "alert_threshold", label: "Alert infection control team if HAI rate exceeds (%)", type: "number", value: "2" },
      { key: "antibiogram_auto",label: "Auto-generate monthly antibiogram from LIMS", type: "toggle", value: true },
      { key: "idsp_report",     label: "IDSP disease surveillance export", type: "toggle", value: false },
      { key: "antibiotic_stewardship",label: "Antibiotic stewardship alerts (>7 days broad-spectrum)", type: "toggle", value: true },
      { key: "report_email",    label: "Monthly report to (email)",    type: "text",   value: "", placeholder: "Infection control nurse email" },
    ],
  },
  {
    id: "biomedical", label: "Biomedical Equipment Register", category: "Operations",
    desc: "Equipment registry, PM schedules, calibration certificates, breakdown tickets. NABH Facility Management standard.",
    status: "inactive", enabled: false,
    fields: [
      { key: "pm_alert_days",   label: "PM due alert (days before due date)", type: "number", value: "14" },
      { key: "calibration_alert",label: "Calibration expiry alert (days before)", type: "number", value: "30" },
      { key: "amc_alert",       label: "AMC expiry alert (days before)", type: "number", value: "45" },
      { key: "breakdown_sla_hrs",label: "Breakdown resolution SLA (hours)", type: "number", value: "24" },
      { key: "alert_biomedical_eng",label: "Email biomedical engineer on PM due", type: "toggle", value: true },
      { key: "qr_label",        label: "Print QR label for each equipment", type: "toggle", value: true },
    ],
  },
];

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<ModuleStatus, { label: string; color: string; icon: React.ElementType }> = {
  active:          { label: "Active",         color: "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20",   icon: CheckCircle2 },
  inactive:        { label: "Inactive",       color: "text-slate-500 bg-white/5 border-white/8",             icon: XCircle      },
  setup_required:  { label: "Setup Required", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: AlertCircle  },
};

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ModulesPage() {
  const [modules, setModules]           = useState<ModuleConfig[]>(INITIAL_MODULES);
  const [activeId, setActiveId]         = useState<string>(INITIAL_MODULES[0].id);
  const [filterCat, setFilterCat]       = useState<ModuleCategory | "All">("All");
  const [saved, setSaved]               = useState<Record<string, boolean>>({});

  const active = modules.find((m) => m.id === activeId)!;

  const filtered = filterCat === "All"
    ? modules
    : modules.filter((m) => m.category === filterCat);

  function toggleModule(id: string) {
    setModules((prev) => prev.map((m) =>
      m.id === id
        ? { ...m, enabled: !m.enabled, status: !m.enabled ? "active" : "inactive" }
        : m
    ));
  }

  function updateField(moduleId: string, fieldKey: string, value: string | boolean) {
    setModules((prev) => prev.map((m) =>
      m.id === moduleId
        ? { ...m, fields: m.fields.map((f) => f.key === fieldKey ? { ...f, value } : f) }
        : m
    ));
    setSaved((p) => ({ ...p, [moduleId]: false }));
  }

  function saveModule(id: string) {
    setSaved((p) => ({ ...p, [id]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [id]: false })), 2500);
  }

  const enabledCount = modules.filter((m) => m.enabled).length;

  return (
    <>
      <TopBar title="Hospital Modules" />
      <main className="p-8 flex gap-6 h-[calc(100vh-64px)] overflow-hidden">

        {/* ── Left panel: module list ── */}
        <aside className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">

          {/* Summary */}
          <div className="rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">Modules active</span>
            <span className="font-bold text-[#0F766E] text-lg">{enabledCount} / {modules.length}</span>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            {(["All", ...CATEGORIES] as const).map((c) => (
              <button key={c} onClick={() => setFilterCat(c)}
                className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                  filterCat === c
                    ? "bg-[#0F766E] text-white border-[#0F766E]"
                    : "border-white/8 text-muted hover:text-fg hover:bg-white/5"
                )}>
                {c === "Patient Engagement" ? "Engagement" : c}
              </button>
            ))}
          </div>

          {/* Module cards */}
          {CATEGORIES.filter((c) => filterCat === "All" || c === filterCat).map((cat) => {
            const catModules = filtered.filter((m) => m.category === cat);
            if (!catModules.length) return null;
            const { icon: CatIcon, color } = CATEGORY_META[cat];
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 px-1 mb-1.5">
                  <CatIcon className={cn("h-3.5 w-3.5", color)} />
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{cat}</span>
                </div>
                <div className="space-y-1">
                  {catModules.map((m) => {
                    const stCfg = STATUS_CFG[m.status];
                    const isSelected = m.id === activeId;
                    return (
                      <button key={m.id} onClick={() => setActiveId(m.id)}
                        className={cn(
                          "w-full text-left rounded-xl border p-3 transition-all group",
                          isSelected
                            ? "border-[#0F766E]/30 bg-[#0F766E]/10"
                            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                        )}>
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-xs font-semibold leading-tight",
                            isSelected ? "text-[#0F766E]" : "text-slate-300")}>
                            {m.label}
                          </p>
                          <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 mt-0.5 transition-transform",
                            isSelected ? "text-[#0F766E] rotate-90" : "text-slate-600")} />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider", stCfg.color)}>
                            <stCfg.icon className="h-2.5 w-2.5" />
                            {stCfg.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </aside>

        {/* ── Right panel: module config ── */}
        <div className="flex-1 overflow-y-auto">
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl h-full">
            <CardContent className="p-6 space-y-6">

              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    {(() => {
                      const { icon: CatIcon, color } = CATEGORY_META[active.category];
                      return <CatIcon className={cn("h-5 w-5", color)} />;
                    })()}
                    <h2 className="text-lg font-bold text-slate-100">{active.label}</h2>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{active.desc}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500">{active.enabled ? "Enabled" : "Disabled"}</span>
                  <button onClick={() => toggleModule(active.id)} className="transition-transform hover:scale-105">
                    {active.enabled
                      ? <ToggleRight className="h-9 w-9 text-[#0F766E]" />
                      : <ToggleLeft  className="h-9 w-9 text-slate-600" />}
                  </button>
                </div>
              </div>

              {/* Config fields */}
              {active.enabled ? (
                <>
                  <div className="space-y-4">
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                      <Settings2 className="h-3.5 w-3.5" /> Configuration
                    </p>
                    {active.fields.map((f) => (
                      <div key={f.key} className={cn("flex gap-6", f.type === "toggle" ? "items-center justify-between" : "flex-col gap-1.5")}>
                        <div className={f.type === "toggle" ? "flex-1" : ""}>
                          <p className="text-sm font-medium text-slate-300">{f.label}</p>
                          {f.hint && <p className="text-[11px] text-slate-600 mt-0.5">{f.hint}</p>}
                        </div>
                        {f.type === "toggle" && (
                          <button onClick={() => updateField(active.id, f.key, !(f.value as boolean))}
                            className="shrink-0 transition-transform hover:scale-105">
                            {f.value
                              ? <ToggleRight className="h-7 w-7 text-[#0F766E]" />
                              : <ToggleLeft  className="h-7 w-7 text-slate-600" />}
                          </button>
                        )}
                        {f.type === "text" && (
                          <input
                            value={f.value as string}
                            placeholder={f.placeholder}
                            onChange={(e) => updateField(active.id, f.key, e.target.value)}
                            className="w-full bg-black/20 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#0F766E]/50 transition-colors placeholder:text-slate-600"
                          />
                        )}
                        {f.type === "number" && (
                          <input
                            type="number"
                            value={f.value as string}
                            placeholder={f.placeholder}
                            onChange={(e) => updateField(active.id, f.key, e.target.value)}
                            className="w-32 bg-black/20 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#0F766E]/50 transition-colors"
                          />
                        )}
                        {f.type === "textarea" && (
                          <textarea
                            value={f.value as string}
                            placeholder={f.placeholder}
                            rows={4}
                            onChange={(e) => updateField(active.id, f.key, e.target.value)}
                            className="w-full bg-black/20 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#0F766E]/50 transition-colors placeholder:text-slate-600 resize-none font-mono"
                          />
                        )}
                        {f.type === "select" && (
                          <select
                            value={f.value as string}
                            onChange={(e) => updateField(active.id, f.key, e.target.value)}
                            className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-[#0F766E]/50 transition-colors">
                            {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-white/5">
                    <button onClick={() => saveModule(active.id)}
                      className={cn(
                        "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all",
                        saved[active.id]
                          ? "bg-[#0F766E]/20 text-[#0F766E] border border-[#0F766E]/30"
                          : "bg-[#0F766E] text-white hover:bg-[#0F766E]/90"
                      )}>
                      {saved[active.id] ? "Saved!" : "Save Configuration"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center">
                    {(() => {
                      const { icon: CatIcon, color } = CATEGORY_META[active.category];
                      return <CatIcon className={cn("h-7 w-7 opacity-40", color)} />;
                    })()}
                  </div>
                  <div>
                    <p className="text-slate-300 font-semibold">{active.label} is disabled</p>
                    <p className="text-sm text-slate-600 mt-1 max-w-xs">
                      Toggle the switch above to enable this module for your hospital. You can configure settings once enabled.
                    </p>
                  </div>
                  <button onClick={() => toggleModule(active.id)}
                    className="mt-2 px-5 py-2 rounded-lg bg-[#0F766E] text-white text-sm font-bold hover:bg-[#0F766E]/90 transition-all">
                    Enable Module
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
