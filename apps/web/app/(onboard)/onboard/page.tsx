"use client";

import { useState, useTransition } from "react";
import { Check, Building2, LayoutGrid, UserPlus, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createTenant } from "./actions";

const STEPS = [
  { id: 1, label: "Hospital details", icon: Building2 },
  { id: 2, label: "Enable modules",   icon: LayoutGrid },
  { id: 3, label: "Admin account",    icon: UserPlus },
] as const;

const MODULES = [
  { id: "opd",      label: "OPD & Appointments" },
  { id: "ipd",      label: "IPD & Bed Management" },
  { id: "pharmacy", label: "Pharmacy & Inventory" },
  { id: "lims",     label: "LIMS & Lab Reports" },
  { id: "billing",  label: "Billing & Claims" },
  { id: "ai",       label: "AI Scribe & Copilot" },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];

export default function OnboardPage() {
  const [step, setStep]       = useState(1);
  const [pending, startTx]    = useTransition();
  const [error, setError]     = useState<string | null>(null);

  // Step 1 fields
  const [hospitalName, setHospitalName]   = useState("");
  const [subdomain, setSubdomain]         = useState("");
  const [primaryColor, setPrimaryColor]   = useState("#0F766E");

  // Step 2 fields
  const [modules, setModules] = useState<Set<ModuleId>>(
    new Set(["opd", "ipd", "pharmacy"])
  );

  // Step 3 fields
  const [adminEmail, setAdminEmail]       = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminName, setAdminName]         = useState("");

  const toggleModule = (id: ModuleId) =>
    setModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const submit = () => {
    setError(null);
    startTx(async () => {
      const res = await createTenant({
        hospitalName, subdomain, primaryColor,
        modules: Array.from(modules),
        adminEmail, adminPassword, adminName,
      });
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F766E] text-white font-bold text-lg">A</span>
          <span className="font-display text-2xl font-bold text-fg">Ayura OS</span>
        </div>

        {/* Stepper */}
        <ol className="mb-8 flex items-center gap-0">
          {STEPS.map((s, i) => {
            const done   = step > s.id;
            const active = step === s.id;
            return (
              <li key={s.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all",
                    done   && "border-[#0F766E] bg-[#0F766E] text-white",
                    active && "border-[#0F766E] text-[#0F766E]",
                    !done && !active && "border-border text-muted"
                  )}>
                    {done ? <Check className="h-4 w-4" /> : s.id}
                  </span>
                  <span className={cn("text-sm font-medium hidden sm:block",
                    active ? "text-fg" : "text-muted"
                  )}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="mx-3 h-px w-8 bg-border shrink-0" />
                )}
              </li>
            );
          })}
        </ol>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface/60 p-8 shadow-2xl shadow-black/30 backdrop-blur-sm">

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-fg">Hospital details</h2>
                <p className="mt-1 text-sm text-muted">Tell us about your hospital so we can set up your environment.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">Hospital name</label>
                <Input placeholder="Ayura Demo Hospital" value={hospitalName} onChange={e => setHospitalName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">Subdomain</label>
                <div className="flex items-center gap-0 rounded-md border border-border focus-within:ring-2 focus-within:ring-accent/50 overflow-hidden">
                  <input
                    className="flex-1 bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted outline-none min-w-0"
                    placeholder="ayura-demo"
                    value={subdomain}
                    onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  />
                  <span className="shrink-0 bg-surface/80 px-3 py-2 text-sm text-muted border-l border-border">.ayura.health</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">Primary colour</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-border bg-surface p-1"
                  />
                  <span className="font-mono text-sm text-muted">{primaryColor}</span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!hospitalName || !subdomain}
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-fg">Enable modules</h2>
                <p className="mt-1 text-sm text-muted">You can change this later from Settings.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {MODULES.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleModule(m.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left text-sm font-medium transition-all",
                      modules.has(m.id)
                        ? "border-[#0F766E] bg-[#0F766E]/10 text-[#0F766E]"
                        : "border-border bg-surface/50 text-muted hover:border-border/80 hover:text-fg"
                    )}
                  >
                    {modules.has(m.id) && <Check className="mb-1 h-3.5 w-3.5" />}
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)} disabled={modules.size === 0}>
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-fg">Create admin account</h2>
                <p className="mt-1 text-sm text-muted">This account will manage staff, departments and billing.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">Full name</label>
                <Input placeholder="Dr. Arun Kumar" value={adminName} onChange={e => setAdminName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">Email</label>
                <Input type="email" placeholder="admin@hospital.com" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted">Password</label>
                <Input type="password" placeholder="••••••••" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button
                  className="flex-1"
                  disabled={pending || !adminName || !adminEmail || !adminPassword}
                  onClick={submit}
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {pending ? "Creating…" : "Create workspace"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
