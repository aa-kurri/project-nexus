"use client";

import { useState } from "react";
import { TopBar } from "@/components/hospital/TopBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Building2, Users, FileText, Bell, Shield, ToggleLeft, ToggleRight } from "lucide-react";

type ConfigSection = "hospital" | "departments" | "billing" | "notifications" | "security";

const SECTIONS: { id: ConfigSection; label: string; icon: React.ElementType }[] = [
  { id: "hospital",      label: "Hospital Info",    icon: Building2 },
  { id: "departments",   label: "Departments",      icon: Users },
  { id: "billing",       label: "Billing",          icon: FileText },
  { id: "notifications", label: "Notifications",    icon: Bell },
  { id: "security",      label: "Security",         icon: Shield },
];

const HOSPITAL_CONFIG = [
  { label: "Hospital Name",     value: "Chenna Reddy Hospitals",   editable: true },
  { label: "License Number",    value: "HOS-TS-2019-00123",        editable: false },
  { label: "GSTIN",             value: "36AAACH1234F1ZP",          editable: true },
  { label: "Address",           value: "Himayatnagar, Hyderabad",  editable: true },
  { label: "State",             value: "Telangana",                editable: true },
  { label: "Timezone",          value: "Asia/Kolkata (IST)",       editable: true },
  { label: "Date Format",       value: "DD-MM-YYYY",               editable: true },
  { label: "Currency",          value: "INR (₹)",                  editable: false },
];

const DEPARTMENTS = [
  { name: "Out-Patient Dept (OPD)",  code: "OPD", beds: 0,  active: true },
  { name: "In-Patient Dept (IPD)",   code: "IPD", beds: 55, active: true },
  { name: "Intensive Care Unit",     code: "ICU", beds: 8,  active: true },
  { name: "Operation Theater",       code: "OT",  beds: 3,  active: true },
  { name: "Emergency / Casualty",    code: "ER",  beds: 6,  active: true },
  { name: "Radiology",               code: "RAD", beds: 0,  active: true },
  { name: "Laboratory (LIMS)",       code: "LAB", beds: 0,  active: true },
  { name: "Physiotherapy",           code: "PHY", beds: 0,  active: false },
];

// ─── Billing config ───────────────────────────────────────────────────────────
const BILLING_FIELDS = [
  { label: "Invoice Prefix",        value: "AY-INV",          editable: true },
  { label: "Receipt Prefix",        value: "AY-RCP",          editable: true },
  { label: "Starting Invoice No.",  value: "1001",            editable: true },
  { label: "Default Payment Terms", value: "Due on discharge",editable: true },
  { label: "Credit Days (TPA)",     value: "30",              editable: true },
  { label: "Late Payment Charge %", value: "1.5",             editable: true },
  { label: "GST Registration No.",  value: "36AAACH1234F1ZP", editable: false },
];

const BILLING_TOGGLES = [
  { key: "gst",      label: "GST Applicable",         default: true },
  { key: "tpa_disc", label: "TPA Auto-Discounting",   default: true },
  { key: "preauth",  label: "Mandatory Pre-Auth >₹50k",default: false },
  { key: "round_off",label: "Round-off (nearest ₹1)", default: true },
];

// ─── Notification config ──────────────────────────────────────────────────────
const NOTIF_TOGGLES = [
  { key: "sms",     label: "SMS Gateway (Textlocal)",    default: true,  sub: "Balance: 4,230 credits" },
  { key: "wa",      label: "WhatsApp (WATI)",            default: true,  sub: "Template approval: 6/8" },
  { key: "email",   label: "Email (SendGrid)",           default: false, sub: "Not configured" },
  { key: "push",    label: "Mobile Push (FCM)",          default: true,  sub: "Active — 3 devices" },
];

const NOTIF_EVENTS = [
  { key: "appt_reminder", label: "Appointment Reminder (24h)", channels: ["sms", "wa"] },
  { key: "lab_ready",     label: "Lab Report Ready",           channels: ["sms", "wa", "push"] },
  { key: "discharge",     label: "Discharge Summary",          channels: ["wa", "email"] },
  { key: "billing_stmt",  label: "Billing Statement",          channels: ["email", "wa"] },
  { key: "otk",           label: "OTP Verification",          channels: ["sms"] },
  { key: "opd_token",     label: "OPD Token Confirmation",    channels: ["sms", "wa"] },
];

// ─── Security config ──────────────────────────────────────────────────────────
const SECURITY_FIELDS = [
  { label: "Session Timeout",         value: "30 minutes",   editable: true },
  { label: "Min Password Length",     value: "10",           editable: true },
  { label: "Password Expiry Days",    value: "90",           editable: true },
  { label: "Max Login Attempts",      value: "5",            editable: true },
  { label: "Audit Log Retention",     value: "365 days",     editable: true },
  { label: "IP Whitelist (CSV)",      value: "",             editable: true, placeholder: "Leave blank to allow all" },
];

const SECURITY_TOGGLES = [
  { key: "2fa",         label: "Enforce 2FA for all staff",        default: false },
  { key: "2fa_doc",     label: "2FA for Doctors (mandatory)",      default: true  },
  { key: "strong_pw",   label: "Strong Password Policy",           default: true  },
  { key: "login_notif", label: "Login Notification Email",         default: true  },
  { key: "api_log",     label: "Log all API access",               default: true  },
  { key: "phi_mask",    label: "Mask PHI in audit logs",           default: false },
];

// ─── Component helpers ────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="shrink-0 transition-transform hover:scale-105">
      {on
        ? <ToggleRight className="h-7 w-7 text-[#0F766E]" />
        : <ToggleLeft  className="h-7 w-7 text-slate-600" />}
    </button>
  );
}

export default function ConfigMasterPage() {
  const [section, setSection] = useState<ConfigSection>("hospital");
  const [billingToggles, setBillingToggles]   = useState<Record<string, boolean>>(
    Object.fromEntries(BILLING_TOGGLES.map((t) => [t.key, t.default]))
  );
  const [notifToggles,   setNotifToggles]     = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_TOGGLES.map((t) => [t.key, t.default]))
  );
  const [securityToggles, setSecurityToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(SECURITY_TOGGLES.map((t) => [t.key, t.default]))
  );

  return (
    <>
      <TopBar title="Configuration Master" action={{ label: "Save Changes", href: "#" }} />
      <main className="p-8 flex gap-8">
        {/* Left nav */}
        <aside className="w-52 shrink-0">
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left",
                    section === s.id
                      ? "bg-[#0F766E]/15 text-[#0F766E]"
                      : "text-muted hover:bg-white/5 hover:text-fg"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content panel */}
        <div className="flex-1">
          {section === "hospital" && (
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/20 pb-4">
                <CardTitle className="text-sm">Hospital Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-0">
                {HOSPITAL_CONFIG.map((item) => (
                  <div key={item.label} className="flex items-center py-3.5 border-b border-white/5 last:border-0 gap-8">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 w-44 shrink-0">
                      {item.label}
                    </span>
                    {item.editable ? (
                      <input
                        defaultValue={item.value}
                        className="flex-1 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-[#0F766E]/50 transition-colors"
                      />
                    ) : (
                      <span className="text-sm text-slate-400 font-mono">{item.value}</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {section === "departments" && (
            <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
              <CardHeader className="border-b border-border/20 pb-4">
                <CardTitle className="text-sm">Departments & Units</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Dept Name", "Code", "Beds", "Status"].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold first:pl-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEPARTMENTS.map((d) => (
                      <tr key={d.code} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-3 pl-0 pr-4 font-medium text-slate-200">{d.name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">{d.code}</td>
                        <td className="py-3 px-4 text-slate-400">{d.beds || "—"}</td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            d.active
                              ? "text-[#0F766E] bg-[#0F766E]/10 border-[#0F766E]/20"
                              : "text-slate-500 bg-white/5 border-white/8"
                          )}>
                            {d.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {section === "billing" && (
            <div className="space-y-4">
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="border-b border-border/20 pb-4">
                  <CardTitle className="text-sm">Invoice & Receipt Settings</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-0">
                  {BILLING_FIELDS.map((item) => (
                    <div key={item.label} className="flex items-center py-3.5 border-b border-white/5 last:border-0 gap-8">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 w-52 shrink-0">
                        {item.label}
                      </span>
                      {item.editable ? (
                        <input
                          defaultValue={item.value}
                          placeholder={"placeholder" in item ? (item as { placeholder: string }).placeholder : undefined}
                          className="flex-1 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-[#0F766E]/50 transition-colors placeholder:text-slate-600"
                        />
                      ) : (
                        <span className="text-sm text-slate-400 font-mono">{item.value}</span>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="border-b border-border/20 pb-4">
                  <CardTitle className="text-sm">Billing Options</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 divide-y divide-white/5">
                  {BILLING_TOGGLES.map((t) => (
                    <div key={t.key} className="flex items-center justify-between py-3.5">
                      <p className="text-sm text-slate-300">{t.label}</p>
                      <Toggle on={billingToggles[t.key]} onToggle={() =>
                        setBillingToggles((p) => ({ ...p, [t.key]: !p[t.key] }))} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {section === "notifications" && (
            <div className="space-y-4">
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="border-b border-border/20 pb-4">
                  <CardTitle className="text-sm">Channels</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 divide-y divide-white/5">
                  {NOTIF_TOGGLES.map((t) => (
                    <div key={t.key} className="flex items-center justify-between py-3.5">
                      <div>
                        <p className="text-sm text-slate-300">{t.label}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{t.sub}</p>
                      </div>
                      <Toggle on={notifToggles[t.key]} onToggle={() =>
                        setNotifToggles((p) => ({ ...p, [t.key]: !p[t.key] }))} />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="border-b border-border/20 pb-4">
                  <CardTitle className="text-sm">Notification Events</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Event</th>
                        {["SMS", "WhatsApp", "Email", "Push"].map((h) => (
                          <th key={h} className="py-3 px-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold text-center">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {NOTIF_EVENTS.map((ev) => (
                        <tr key={ev.key} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="py-3 text-slate-300">{ev.label}</td>
                          {["sms", "wa", "email", "push"].map((ch) => (
                            <td key={ch} className="py-3 px-3 text-center">
                              <span className={cn("inline-block h-2 w-2 rounded-full",
                                ev.channels.includes(ch) ? "bg-[#0F766E]" : "bg-white/10")} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {section === "security" && (
            <div className="space-y-4">
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="border-b border-border/20 pb-4">
                  <CardTitle className="text-sm">Session & Password Policy</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-0">
                  {SECURITY_FIELDS.map((item) => (
                    <div key={item.label} className="flex items-center py-3.5 border-b border-white/5 last:border-0 gap-8">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 w-52 shrink-0">
                        {item.label}
                      </span>
                      <input
                        defaultValue={item.value}
                        placeholder={"placeholder" in item ? (item as { placeholder: string }).placeholder : undefined}
                        readOnly={!item.editable}
                        className={cn(
                          "flex-1 bg-black/20 border border-white/8 rounded-lg px-3 py-1.5 text-sm outline-none transition-colors placeholder:text-slate-600",
                          item.editable ? "text-slate-200 focus:border-[#0F766E]/50" : "text-slate-500 cursor-not-allowed"
                        )}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-border/40 bg-surface/50 backdrop-blur-xl">
                <CardHeader className="border-b border-border/20 pb-4">
                  <CardTitle className="text-sm">Security Controls</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 divide-y divide-white/5">
                  {SECURITY_TOGGLES.map((t) => (
                    <div key={t.key} className="flex items-center justify-between py-3.5">
                      <p className="text-sm text-slate-300">{t.label}</p>
                      <Toggle on={securityToggles[t.key]} onToggle={() =>
                        setSecurityToggles((p) => ({ ...p, [t.key]: !p[t.key] }))} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
