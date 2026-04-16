"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import {
  Fingerprint,
  KeyRound,
  ShieldCheck,
  Lock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type UnlockMethod = "biometric" | "pin";

interface Props {
  patientName?: string;
  onUnlocked: (method: UnlockMethod) => void;
  onSetupRequired?: () => void;
  hasBiometric?: boolean;
  hasPin?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PIN_LENGTH = 6;
const NUMPAD_KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"] as const;

// ── PIN dots ──────────────────────────────────────────────────────────────────

function PinDots({ filled, error }: { filled: number; error: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-3.5 w-3.5 rounded-full border-2 transition-all duration-150",
            i < filled
              ? error
                ? "border-red-400 bg-red-400"
                : "border-[#0F766E] bg-[#0F766E]"
              : "border-border bg-transparent"
          )}
        />
      ))}
    </div>
  );
}

// ── Numpad ────────────────────────────────────────────────────────────────────

function NumPad({
  onKey,
  disabled,
}: {
  onKey: (key: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {NUMPAD_KEYS.map((k, i) => (
        <button
          key={i}
          onClick={() => k !== "" && onKey(k)}
          disabled={disabled || k === ""}
          className={cn(
            "h-14 w-full rounded-2xl border text-lg font-semibold transition-all select-none",
            k === ""
              ? "pointer-events-none border-transparent"
              : "border-border bg-surface/60 text-fg hover:bg-surface hover:border-[#0F766E]/40 active:scale-95",
            disabled && "opacity-40 cursor-not-allowed"
          )}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

// ── BiometricLockScreen ───────────────────────────────────────────────────────

export default function BiometricLockScreen({
  patientName = "Patient",
  onUnlocked,
  onSetupRequired,
  hasBiometric = true,
  hasPin = true,
}: Props) {
  const [mode, setMode] = useState<"biometric" | "pin">(
    hasBiometric ? "biometric" : "pin"
  );
  const [pin, setPin]           = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [pinError, setPinError] = useState(false);
  const [pending, startTx]      = useTransition();
  const [bioActive, setBioActive] = useState(false);

  const clearTimeout_ = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-trigger biometric prompt on mount when in biometric mode
  useEffect(() => {
    if (mode === "biometric" && hasBiometric) {
      void attemptBiometric();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Biometric ───────────────────────────────────────────────────────────────

  async function attemptBiometric() {
    setError(null);
    setBioActive(true);
    try {
      // TODO: replace with real WebAuthn assertion
      // 1. const { challenge, credentialIds } = await getBiometricChallenge(patientId)
      // 2. const assertion = await navigator.credentials.get({
      //      publicKey: {
      //        challenge:        base64url.decode(challenge),
      //        allowCredentials: credentialIds.map(id => ({ id: base64url.decode(id), type: "public-key" })),
      //        userVerification: "required",
      //        timeout:          60_000,
      //      },
      //    })
      // 3. const { ok } = await verifyBiometricAssertion(patientId, assertion)
      // 4. if (ok) onUnlocked("biometric")
      await new Promise<void>(res => setTimeout(res, 1200)); // simulated prompt
      onUnlocked("biometric");
    } catch {
      setError("Biometric failed. Enter your PIN instead.");
      setMode("pin");
    } finally {
      setBioActive(false);
    }
  }

  // ── PIN ─────────────────────────────────────────────────────────────────────

  function handlePinKey(key: string) {
    if (pending) return;
    setError(null);
    setPinError(false);

    if (key === "⌫") {
      setPin(p => p.slice(0, -1));
      return;
    }

    const next = pin + key;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      startTx(async () => {
        // TODO: replace with real verifyPin server action
        // import { verifyPin } from "@/app/(patient)/lock/actions"
        // const { ok } = await verifyPin(patientId, next)
        const ok = next === "123456"; // stub — accepts demo PIN 123456

        if (ok) {
          onUnlocked("pin");
        } else {
          setPinError(true);
          setError("Incorrect PIN. Try again.");
          if (clearTimeout_.current) clearTimeout(clearTimeout_.current);
          clearTimeout_.current = setTimeout(() => {
            setPin("");
            setPinError(false);
          }, 600);
        }
      });
    }
  }

  // ── Initials ─────────────────────────────────────────────────────────────────

  const initials = patientName
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[hsl(220_15%_6%)] p-6">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F766E] font-bold text-lg text-white">
          A
        </span>
        <span className="font-display text-2xl font-bold text-fg">Ayura</span>
      </div>

      {/* Patient avatar + name */}
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#0F766E] to-teal-400 text-xl font-bold text-white shadow-lg shadow-[#0F766E]/30">
        {initials}
      </div>
      <p className="mb-1 text-base font-semibold text-fg">{patientName}</p>
      <p className="mb-8 flex items-center gap-1.5 text-xs text-muted">
        <Lock className="h-3 w-3" />
        App is locked
      </p>

      {/* ── Biometric mode ───────────────────────────────────────────────── */}
      {mode === "biometric" && (
        <div className="w-full max-w-xs space-y-5 text-center">
          <button
            onClick={attemptBiometric}
            disabled={bioActive}
            className={cn(
              "group mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all duration-200",
              bioActive
                ? "animate-pulse border-[#0F766E] bg-[#0F766E]/20"
                : "border-border bg-surface/60 hover:border-[#0F766E] hover:bg-[#0F766E]/10 active:scale-95"
            )}
          >
            {bioActive ? (
              <Loader2 className="h-8 w-8 animate-spin text-[#0F766E]" />
            ) : (
              <Fingerprint className="h-8 w-8 text-[#0F766E] transition-transform group-hover:scale-110" />
            )}
          </button>

          <p className="text-sm text-muted">
            {bioActive ? "Verifying biometrics…" : "Touch to unlock"}
          </p>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </div>
          )}

          {hasPin && (
            <button
              onClick={() => { setError(null); setMode("pin"); }}
              className="text-xs text-muted underline underline-offset-2 hover:text-fg transition-colors"
            >
              Use PIN instead
            </button>
          )}
        </div>
      )}

      {/* ── PIN mode ─────────────────────────────────────────────────────── */}
      {mode === "pin" && (
        <div className="w-full max-w-xs space-y-6">
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted">
              <KeyRound className="h-4 w-4" />
              Enter your 6-digit PIN
            </div>
            <PinDots filled={pin.length} error={pinError} />
            {error && (
              <p className="flex items-center justify-center gap-1 text-xs text-red-400">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          <NumPad
            onKey={handlePinKey}
            disabled={pending || pin.length === PIN_LENGTH}
          />

          {hasBiometric && (
            <div className="text-center">
              <button
                onClick={() => {
                  setPin("");
                  setError(null);
                  setMode("biometric");
                  setTimeout(() => void attemptBiometric(), 100);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-muted underline underline-offset-2 hover:text-fg transition-colors"
              >
                <Fingerprint className="h-3.5 w-3.5" />
                Use biometrics
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── No credentials → prompt setup ────────────────────────────────── */}
      {!hasBiometric && !hasPin && onSetupRequired && (
        <div className="w-full max-w-xs space-y-4 text-center">
          <div className="rounded-xl border border-[#0F766E]/30 bg-[#0F766E]/10 p-4">
            <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-[#0F766E]" />
            <p className="text-sm font-medium text-fg">Set up app lock</p>
            <p className="mt-1 text-xs text-muted">
              Protect your health records with biometrics or a PIN.
            </p>
          </div>
          <button
            onClick={onSetupRequired}
            className="w-full rounded-xl bg-[#0F766E] py-3 text-sm font-semibold text-white hover:bg-[#115E59] transition-colors active:scale-95"
          >
            Set up now
          </button>
        </div>
      )}
    </div>
  );
}
