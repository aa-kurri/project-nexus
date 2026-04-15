"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BiometricLockScreen, { type UnlockMethod } from "@/components/app/BiometricLockScreen";
import BiometricSetup from "@/components/app/BiometricSetup";
import { getLockSettings, type LockSettings } from "./actions";

// ── Lock screen states ────────────────────────────────────────────────────────

type PageState = "loading" | "setup" | "locked";

// ── LockPage ──────────────────────────────────────────────────────────────────

export default function LockPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [settings, setSettings]   = useState<LockSettings>({
    lockEnabled:    false,
    hasBiometric:   false,
    hasPin:         false,
    lockTimeoutMin: 5,
    patientName:    "Patient",
  });

  useEffect(() => {
    void getLockSettings().then(s => {
      setSettings(s);
      // First launch (lock not yet configured) → show setup wizard
      // Returning visit with lock enabled             → show lock screen
      setPageState(s.lockEnabled ? "locked" : "setup");
    });
  }, []);

  // After setup completes, mark lock as configured and proceed
  function handleSetupComplete() {
    router.push("/dashboard");
  }

  // After successful unlock (biometric or PIN), continue to dashboard
  function handleUnlocked(_method: UnlockMethod) {
    // TODO: write an unlock event to patient_lock_events via server action
    // await logUnlockEvent(patientId, _method)
    router.push("/dashboard");
  }

  // ── Loading splash ────────────────────────────────────────────────────────

  if (pageState === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[hsl(220_15%_6%)]">
        <span className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-[#0F766E] font-bold text-lg text-white">
          A
        </span>
      </div>
    );
  }

  // ── First-time setup ──────────────────────────────────────────────────────

  if (pageState === "setup") {
    return (
      <BiometricSetup
        onComplete={handleSetupComplete}
        onSkip={handleSetupComplete}
      />
    );
  }

  // ── Lock screen ───────────────────────────────────────────────────────────

  return (
    <BiometricLockScreen
      patientName={settings.patientName}
      hasBiometric={settings.hasBiometric}
      hasPin={settings.hasPin}
      onUnlocked={handleUnlocked}
      onSetupRequired={() => setPageState("setup")}
    />
  );
}
