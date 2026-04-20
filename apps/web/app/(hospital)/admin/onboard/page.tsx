"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Building2, CheckCircle2, ChevronRight, Palette, ToggleLeft, ToggleRight,
  Users, Rocket, Copy, Check, Globe, Hash, MapPin, Phone, Mail,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4;

interface HospitalProfile {
  name: string; displayName: string; logoUrl: string; primaryColor: string;
  gstin: string; licenseNo: string; address: string; city: string;
  state: string; phone: string; email: string; customDomain: string;
}
interface ModuleMap { [key: string]: boolean }
interface AdminUser { name: string; email: string; role: string; }

// ─── Data ────────────────────────────────────────────────────────────────────
const MODULES = [
  { key: "opd",        label: "OPD",             desc: "Outpatient queue & consultations",    defaultOn: true },
  { key: "ipd",        label: "IPD",             desc: "Inpatient beds, admissions, wards",   defaultOn: true },
  { key: "pharmacy",   label: "Pharmacy",        desc: "Dispensing, stock, auto-PO",           defaultOn: true },
  { key: "lims",       label: "LIMS",            desc: "Lab worklist, reports, HL7 feed",     defaultOn: true },
  { key: "billing",    label: "Billing",         desc: "Claims, payments, pre-auth",           defaultOn: true },
  { key: "radiology",  label: "Radiology",       desc: "Imaging orders & worklist",            defaultOn: true },
  { key: "ot",         label: "OT Scheduler",    desc: "Operation theater planning",           defaultOn: true },
  { key: "stores",     label: "Stores",          desc: "Central store, POs, suppliers",        defaultOn: false },
  { key: "blood_bank", label: "Blood Bank",      desc: "Blood requests & crossmatch",          defaultOn: false },
  { key: "dietary",    label: "Dietary Orders",  desc: "Patient meal planning",                defaultOn: false },
  { key: "ai_scribe",  label: "AI Scribe",       desc: "Voice-to-prescription AI assistant",  defaultOn: true },
  { key: "analytics",  label: "Analytics / MIS", desc: "Reports, dashboards, MIS exports",    defaultOn: true },
];

const ROLES = ["Hospital Admin", "Doctor", "Nurse", "Billing", "Pharmacist", "Lab Tech", "Receptionist", "Super Admin"];
const STATES = ["Andhra Pradesh","Telangana","Karnataka","Tamil Nadu","Maharashtra","Kerala","Delhi","Gujarat","Rajasthan","Madhya Pradesh","Uttar Pradesh","West Bengal","Punjab","Haryana"];

const inputCls = "w-full bg-black/20 border border-white/8 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-[#0F766E]/50 transition-colors";
const labelCls = "block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5";

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: "Hospital Profile" },
  { n: 2, label: "Modules" },
  { n: 3, label: "Admin User" },
  { n: 4, label: "Activate" },
];

function StepBar({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            s.n === current ? "bg-[#0F766E]/15 text-[#0F766E]" :
            s.n < current  ? "text-slate-400" : "text-slate-600"
          )}>
            <span className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border",
              s.n === current ? "bg-[#0F766E] text-white border-[#0F766E]" :
              s.n < current  ? "bg-[#0F766E]/20 text-[#0F766E] border-[#0F766E]/30" :
                               "bg-white/5 text-slate-500 border-white/10"
            )}>
              {s.n < current ? <Check className="h-3 w-3" /> : s.n}
            </span>
            {s.label}
          </div>
          {i < STEPS.length - 1 && (
            <ChevronRight className={cn("h-4 w-4 mx-1", s.n < current ? "text-[#0F766E]/40" : "text-white/10")} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OnboardPage() {
  const [step, setStep] = useState<Step>(1);
  const [copied, setCopied] = useState(false);

  // Step 1 state
  const [profile, setProfile] = useState<HospitalProfile>({
    name: "", displayName: "", logoUrl: "", primaryColor: "#0F766E",
    gstin: "", licenseNo: "", address: "", city: "", state: "Telangana",
    phone: "", email: "", customDomain: "",
  });

  // Step 2 state
  const [modules, setModules] = useState<ModuleMap>(
    Object.fromEntries(MODULES.map((m) => [m.key, m.defaultOn]))
  );

  // Step 3 state
  const [adminUser, setAdminUser] = useState<AdminUser>({ name: "", email: "", role: "Hospital Admin" });

  // Step 4 — generated invite link
  const inviteToken = "INV-" + Math.random().toString(36).slice(2, 10).toUpperCase();
  const inviteLink = `https://app.ayura.health/register?token=${inviteToken}`;

  const enabledCount = Object.values(modules).filter(Boolean).length;

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <TopBar title="Hospital Onboarding" />
      <main className="p-8 max-w-4xl">
        <StepBar current={step} />

        {/* ── Step 1: Hospital Profile ────────────────────────────── */}
        {step === 1 && (
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
            <CardHeader className="border-b border-border/20 pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#0F766E]" />
                Hospital Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Legal Hospital Name *</label>
                  <input className={inputCls} placeholder="e.g. City General Hospitals Pvt. Ltd."
                    value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Display Name</label>
                  <input className={inputCls} placeholder="Short name shown in app"
                    value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Logo URL</label>
                  <input className={inputCls} placeholder="https://cdn.yourhospital.com/logo.png"
                    value={profile.logoUrl} onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={profile.primaryColor}
                      onChange={(e) => setProfile({ ...profile, primaryColor: e.target.value })}
                      className="h-9 w-16 rounded-lg border border-white/8 bg-black/20 cursor-pointer p-1" />
                    <span className="font-mono text-sm text-slate-400">{profile.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>GSTIN</label>
                  <input className={inputCls} placeholder="29AAACH1234F1ZP"
                    value={profile.gstin} onChange={(e) => setProfile({ ...profile, gstin: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>License Number</label>
                  <input className={inputCls} placeholder="HOS-TS-2024-00123"
                    value={profile.licenseNo} onChange={(e) => setProfile({ ...profile, licenseNo: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Address</label>
                  <input className={inputCls} placeholder="Street address"
                    value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>City</label>
                  <input className={inputCls} placeholder="Hyderabad"
                    value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <select className={inputCls} value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input className={inputCls} placeholder="+91 40 1234 5678"
                    value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Admin Email</label>
                  <input className={inputCls} placeholder="admin@hospital.com"
                    value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Custom Domain (optional)</label>
                  <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-2 focus-within:border-[#0F766E]/50 transition-colors">
                    <Globe className="h-4 w-4 text-slate-500 shrink-0" />
                    <input className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none"
                      placeholder="emr.yourhospital.com"
                      value={profile.customDomain} onChange={(e) => setProfile({ ...profile, customDomain: e.target.value })} />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5">Point CNAME to app.ayura.health. Leave blank to use subdomain.ayura.health</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setStep(2)}
                  disabled={!profile.name}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next: Modules <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Modules ─────────────────────────────────────── */}
        {step === 2 && (
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
            <CardHeader className="border-b border-border/20 pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Hash className="h-4 w-4 text-[#0F766E]" />
                Enable Modules — <span className="text-[#0F766E]">{enabledCount} of {MODULES.length}</span> selected
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-3">
                {MODULES.map((m) => {
                  const on = modules[m.key];
                  return (
                    <button
                      key={m.key}
                      onClick={() => setModules({ ...modules, [m.key]: !on })}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:scale-[1.01]",
                        on ? "border-[#0F766E]/30 bg-[#0F766E]/8" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                      )}
                    >
                      {on
                        ? <ToggleRight className="h-5 w-5 text-[#0F766E] shrink-0" />
                        : <ToggleLeft className="h-5 w-5 text-slate-600 shrink-0" />}
                      <div>
                        <p className={cn("text-sm font-bold", on ? "text-slate-100" : "text-slate-400")}>{m.label}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{m.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between pt-6">
                <button onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-white/8 text-sm text-slate-400 hover:text-fg hover:bg-white/5 transition-all">
                  Back
                </button>
                <button onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-medium hover:bg-[#0F766E]/90 transition-all">
                  Next: Admin User <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: Admin User ───────────────────────────────────── */}
        {step === 3 && (
          <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
            <CardHeader className="border-b border-border/20 pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0F766E]" />
                Create First Admin User
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <p className="text-xs text-slate-500">
                This user will receive an invite link to set their password. They get full admin access to manage staff, configuration, and modules.
              </p>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input className={inputCls} placeholder="Dr. Ramesh Babu"
                    value={adminUser.name} onChange={(e) => setAdminUser({ ...adminUser, name: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Role *</label>
                  <select className={inputCls} value={adminUser.role}
                    onChange={(e) => setAdminUser({ ...adminUser, role: e.target.value })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Email Address *</label>
                  <div className="flex items-center gap-2 bg-black/20 border border-white/8 rounded-lg px-3 py-2 focus-within:border-[#0F766E]/50 transition-colors">
                    <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                    <input className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none"
                      placeholder="admin@hospital.com" type="email"
                      value={adminUser.email} onChange={(e) => setAdminUser({ ...adminUser, email: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5 p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-[#0F766E] font-bold">Invite Token System</p>
                <p className="text-xs text-slate-400">
                  A 72-hour single-use invite link will be generated and sent to the admin email.
                  The link carries the tenant_id + role so they land in the correct hospital on first login.
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-white/8 text-sm text-slate-400 hover:text-fg hover:bg-white/5 transition-all">
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!adminUser.name || !adminUser.email}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Review & Activate <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 4: Review & Activate ───────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            {/* Summary card */}
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/20 pb-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-[#0F766E]" />
                  Review & Activate
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Hospital summary */}
                <div>
                  <p className={labelCls}>Hospital</p>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: profile.primaryColor + "20", border: `1px solid ${profile.primaryColor}30` }}>
                      <Building2 className="h-6 w-6" style={{ color: profile.primaryColor }} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-100">{profile.name || "—"}</p>
                      <p className="text-xs text-slate-500">{profile.city}{profile.state ? `, ${profile.state}` : ""} · {profile.email}</p>
                      {profile.customDomain && (
                        <p className="text-xs font-mono text-[#0F766E] mt-0.5">{profile.customDomain}</p>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: profile.primaryColor }} />
                      <span className="font-mono text-xs text-slate-500">{profile.primaryColor}</span>
                    </div>
                  </div>
                </div>

                {/* Modules summary */}
                <div>
                  <p className={labelCls}>Modules enabled ({enabledCount})</p>
                  <div className="flex flex-wrap gap-2">
                    {MODULES.filter((m) => modules[m.key]).map((m) => (
                      <span key={m.key} className="px-3 py-1 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/20 text-[11px] font-bold text-[#0F766E]">
                        {m.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Admin user summary */}
                <div>
                  <p className={labelCls}>First Admin User</p>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="h-9 w-9 rounded-full bg-[#0F766E]/20 flex items-center justify-center text-sm font-bold text-[#0F766E]">
                      {adminUser.name.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-100">{adminUser.name}</p>
                      <p className="text-xs text-slate-500">{adminUser.email} · {adminUser.role}</p>
                    </div>
                  </div>
                </div>

                {/* Invite link */}
                <div>
                  <p className={labelCls}>Invite Link (72hr, single-use)</p>
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5">
                    <code className="flex-1 text-xs text-[#0F766E] font-mono truncate">{inviteLink}</code>
                    <button onClick={copyLink}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-[#0F766E]/20 transition-colors">
                      {copied ? <Check className="h-4 w-4 text-[#0F766E]" /> : <Copy className="h-4 w-4 text-[#0F766E]" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button onClick={() => setStep(3)}
                    className="px-5 py-2.5 rounded-xl border border-white/8 text-sm text-slate-400 hover:text-fg hover:bg-white/5 transition-all">
                    Back
                  </button>
                  <button
                    onClick={() => alert("Hospital activated! Invite email sent to " + adminUser.email)}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-bold hover:bg-[#0F766E]/90 shadow-lg shadow-[#0F766E]/20 transition-all">
                    <Rocket className="h-4 w-4" />
                    Activate Hospital
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
