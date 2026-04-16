"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Fingerprint,
  KeyRound,
  ShieldCheck,
  ShieldOff,
  Clock,
  Smartphone,
  Trash2,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  getLockSettings,
  saveBiometricSettings,
  getEnrolledDevices,
  revokeDevice,
} from "./actions";
import { type LockSettings, type EnrolledDevice } from "@/app/(patient)/lock/types";

// ── Demo patient ID (replace with real auth session) ──────────────────────────
const STUB_PATIENT_ID = "00000000-0000-0000-0000-000000000099";

// ── Timeout options ───────────────────────────────────────────────────────────

const TIMEOUT_OPTIONS = [
  { value: 1  as const, label: "1 minute"  },
  { value: 5  as const, label: "5 minutes" },
  { value: 15 as const, label: "15 minutes"},
  { value: 30 as const, label: "30 minutes"},
];

// ── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  icon: Icon,
}: {
  label:       string;
  description: string;
  checked:     boolean;
  onChange:    (v: boolean) => void;
  disabled?:   boolean;
  icon:        React.ElementType;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" />
        <div>
          <p className="text-sm font-medium text-fg">{label}</p>
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border-2 transition-colors duration-200",
          checked
            ? "border-[#0F766E] bg-[#0F766E]"
            : "border-border bg-surface",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "left-4" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
      {label}
    </p>
  );
}

// ── SecuritySettingsPage ──────────────────────────────────────────────────────

export default function SecuritySettingsPage() {
  const [settings, setSettings]   = useState<LockSettings | null>(null);
  const [devices, setDevices]     = useState<EnrolledDevice[]>([]);
  const [pending, startTx]        = useTransition();
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Local editable state
  const [lockEnabled, setLockEnabled]       = useState(false);
  const [lockTimeout, setLockTimeout]       = useState<1 | 5 | 15 | 30>(5);

  useEffect(() => {
    void Promise.all([
      getLockSettings(),
      getEnrolledDevices(STUB_PATIENT_ID),
    ]).then(([s, devs]) => {
      setSettings(s);
      setLockEnabled(s.lockEnabled);
      setLockTimeout(s.lockTimeoutMin as 1 | 5 | 15 | 30);
      setDevices(devs);
    });
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────────

  function save() {
    setError(null);
    setSaved(false);
    startTx(async () => {
      const res = await saveBiometricSettings({
        patientId:      STUB_PATIENT_ID,
        lockEnabled,
        lockTimeoutMin: lockTimeout,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed to save settings.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  // ── Revoke device ──────────────────────────────────────────────────────────

  function handleRevoke(credentialId: string) {
    setRevokingId(credentialId);
    startTx(async () => {
      const res = await revokeDevice(STUB_PATIENT_ID, credentialId);
      if (res.ok) {
        setDevices(prev => prev.filter(d => d.id !== credentialId));
      } else {
        setError(res.error ?? "Failed to remove device.");
      }
      setRevokingId(null);
    });
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (!settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(220_15%_6%)]">
        <Loader2 className="h-6 w-6 animate-spin text-[#0F766E]" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[hsl(220_15%_6%)]">
      {/* Header */}
      <header className="flex h-16 items-center gap-3 border-b border-border bg-[hsl(220_13%_9%)]/80 px-6 backdrop-blur-sm">
        <ShieldCheck className="h-5 w-5 text-[#0F766E]" />
        <h1 className="font-display text-xl font-semibold tracking-tight text-fg">
          App Lock &amp; Security
        </h1>
        <Badge
          variant="outline"
          className="ml-auto border-[#0F766E]/40 bg-[#0F766E]/10 text-[10px] text-[#0F766E]"
        >
          S-APP-3
        </Badge>
      </header>

      <ScrollArea className="flex-1">
        <main className="mx-auto max-w-lg space-y-5 p-6 pb-12">

          {/* ── Lock on launch ──────────────────────────────────────────── */}
          <div>
            <SectionHeader label="App Lock" />
            <Card className="divide-y divide-border px-4">
              <ToggleRow
                icon={ShieldCheck}
                label="Lock on launch"
                description="Require biometrics or PIN every time the app opens."
                checked={lockEnabled}
                onChange={setLockEnabled}
              />
              <ToggleRow
                icon={ShieldOff}
                label="Lock after inactivity"
                description={`Auto-lock when the app is backgrounded for ${lockTimeout} min.`}
                checked={lockEnabled}
                onChange={setLockEnabled}
                disabled={!lockEnabled}
              />
            </Card>
          </div>

          {/* ── Auto-lock timeout ────────────────────────────────────────── */}
          <div>
            <SectionHeader label="Auto-lock timeout" />
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted mb-3">
                <Clock className="h-4 w-4" />
                Lock the app after this much inactivity
              </div>
              <div className="grid grid-cols-4 gap-2">
                {TIMEOUT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setLockTimeout(opt.value)}
                    disabled={!lockEnabled}
                    className={cn(
                      "rounded-xl border py-2.5 text-xs font-semibold transition-all",
                      lockTimeout === opt.value
                        ? "border-[#0F766E] bg-[#0F766E]/10 text-[#0F766E]"
                        : "border-border bg-surface/50 text-muted hover:border-[#0F766E]/40 hover:text-fg",
                      !lockEnabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Unlock methods ───────────────────────────────────────────── */}
          <div>
            <SectionHeader label="Unlock methods" />
            <Card className="divide-y divide-border px-4">
              {/* Biometric */}
              <div className="flex items-center gap-3 py-4">
                <Fingerprint className="h-4 w-4 shrink-0 text-[#0F766E]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-fg">Biometrics</p>
                  <p className="text-xs text-muted">Face ID, fingerprint, or Windows Hello</p>
                </div>
                {settings.hasBiometric ? (
                  <Badge
                    variant="outline"
                    className="border-[#0F766E]/40 bg-[#0F766E]/10 text-[10px] text-[#0F766E]"
                  >
                    Active
                  </Badge>
                ) : (
                  <button className="flex items-center gap-1 text-xs text-[#0F766E] hover:underline">
                    Set up <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* PIN */}
              <div className="flex items-center gap-3 py-4">
                <KeyRound className="h-4 w-4 shrink-0 text-[#0F766E]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-fg">6-Digit PIN</p>
                  <p className="text-xs text-muted">Fallback when biometrics are unavailable</p>
                </div>
                {settings.hasPin ? (
                  <button className="flex items-center gap-1 text-xs text-muted hover:text-fg transition-colors">
                    Change <ChevronRight className="h-3 w-3" />
                  </button>
                ) : (
                  <button className="flex items-center gap-1 text-xs text-[#0F766E] hover:underline">
                    Set up <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </Card>
          </div>

          {/* ── Enrolled devices ─────────────────────────────────────────── */}
          <div>
            <SectionHeader label="Enrolled devices" />
            <Card className="divide-y divide-border px-4">
              {devices.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">
                  No biometric devices registered yet.
                </p>
              ) : (
                devices.map(device => (
                  <div key={device.id} className="flex items-center gap-3 py-4">
                    <Smartphone className="h-4 w-4 shrink-0 text-muted" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-fg">
                        {device.deviceName ?? "Unknown device"}
                      </p>
                      <p className="text-xs text-muted">
                        Added {new Date(device.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {device.lastUsedAt && (
                          <>
                            {" · Last used "}
                            {new Date(device.lastUsedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevoke(device.id)}
                      disabled={revokingId === device.id || pending}
                      className="rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-40"
                      title="Remove device"
                    >
                      {revokingId === device.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />
                      }
                    </button>
                  </div>
                ))
              )}
            </Card>
          </div>

          {/* ── Error / Save ─────────────────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] py-3 text-sm font-semibold text-white hover:bg-[#115E59] transition-colors active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : null}
            {pending ? "Saving…" : saved ? "Saved" : "Save settings"}
          </button>

          {/* ── HIPAA note ───────────────────────────────────────────────── */}
          <p className="text-center text-[10px] text-muted">
            All lock events are logged for HIPAA audit compliance. Removing a device does not
            invalidate existing sessions.
          </p>

        </main>
      </ScrollArea>
    </div>
  );
}
