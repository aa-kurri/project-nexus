"use client";

import { useState, useTransition } from "react";
import {
  Fingerprint,
  KeyRound,
  ShieldCheck,
  Check,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  onComplete: () => void;
  onSkip?: () => void;
}

type Step = "intro" | "biometric" | "pin" | "confirm" | "done";

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

function NumPad({ onKey, disabled }: { onKey: (key: string) => void; disabled: boolean }) {
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

// ── BiometricSetup ────────────────────────────────────────────────────────────

export default function BiometricSetup({ onComplete, onSkip }: Props) {
  const [step, setStep]             = useState<Step>("intro");
  const [bioRegistered, setBioReg]  = useState(false);
  const [bioActive, setBioActive]   = useState(false);
  const [pin, setPin]               = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError]     = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [pending, startTx]          = useTransition();

  // ── Biometric registration ─────────────────────────────────────────────────

  async function registerBiometric() {
    setError(null);
    setBioActive(true);
    try {
      // TODO: replace with real WebAuthn registration
      // 1. const opts = await getBiometricRegistrationOptions(patientId)
      // 2. const credential = await navigator.credentials.create({
      //      publicKey: {
      //        ...opts,
      //        challenge:    base64url.decode(opts.challenge),
      //        user:         { id: base64url.decode(opts.user.id), name: opts.user.name, displayName: opts.user.displayName },
      //        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      //        authenticatorSelection: { userVerification: "required", residentKey: "preferred" },
      //        timeout: 60_000,
      //      },
      //    })
      // 3. await registerWebAuthnCredential({ patientId, credential, deviceName: navigator.userAgent })
      await new Promise<void>(res => setTimeout(res, 1500)); // simulated platform prompt
      setBioReg(true);
      setStep("pin");
    } catch {
      setError("Could not register biometrics. You can still continue with PIN only.");
    } finally {
      setBioActive(false);
    }
  }

  // ── PIN entry ──────────────────────────────────────────────────────────────

  function handlePinKey(key: string) {
    setError(null);

    if (step === "pin") {
      if (key === "⌫") { setPin(p => p.slice(0, -1)); return; }
      const next = pin + key;
      if (next.length > PIN_LENGTH) return;
      setPin(next);
      if (next.length === PIN_LENGTH) setTimeout(() => setStep("confirm"), 200);
      return;
    }

    if (step === "confirm") {
      setPinError(false);
      if (key === "⌫") { setConfirmPin(p => p.slice(0, -1)); return; }
      const next = confirmPin + key;
      if (next.length > PIN_LENGTH) return;
      setConfirmPin(next);

      if (next.length === PIN_LENGTH) {
        if (next === pin) {
          startTx(async () => {
            // TODO: persist via server action
            // await saveBiometricSettings({
            //   patientId,
            //   lockEnabled:    true,
            //   lockTimeoutMin: 5,
            //   pinHash:        hashPin(pin),   // hashing must happen server-side
            // })
            await new Promise(r => setTimeout(r, 600));
            setStep("done");
          });
        } else {
          setPinError(true);
          setError("PINs don't match. Try again.");
          setTimeout(() => {
            setConfirmPin("");
            setPinError(false);
            setError(null);
          }, 700);
        }
      }
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(220_15%_6%)] p-6">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F766E] font-bold text-lg text-white">
          A
        </span>
        <span className="font-display text-2xl font-bold text-fg">Ayura</span>
      </div>

      <div className="w-full max-w-xs space-y-6">

        {/* ── Intro ─────────────────────────────────────────────────────── */}
        {step === "intro" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#0F766E]/40 bg-[#0F766E]/10">
              <ShieldCheck className="h-9 w-9 text-[#0F766E]" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-fg">Secure your health data</h2>
              <p className="mt-2 text-sm text-muted">
                Add biometric lock or a PIN so only you can access your medical records.
              </p>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-surface/60 p-3">
                <Fingerprint className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" />
                <div>
                  <p className="text-sm font-medium text-fg">Face ID / Fingerprint</p>
                  <p className="text-xs text-muted">Instant unlock using your device's secure enclave.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-surface/60 p-3">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" />
                <div>
                  <p className="text-sm font-medium text-fg">6-Digit PIN fallback</p>
                  <p className="text-xs text-muted">Always required, even when biometrics are active.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("biometric")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] py-3 text-sm font-semibold text-white hover:bg-[#115E59] transition-colors active:scale-95"
            >
              Get started <ChevronRight className="h-4 w-4" />
            </button>

            {onSkip && (
              <button
                onClick={onSkip}
                className="text-xs text-muted underline underline-offset-2 hover:text-fg transition-colors"
              >
                Skip for now (not recommended)
              </button>
            )}
          </div>
        )}

        {/* ── Biometric registration ─────────────────────────────────────── */}
        {step === "biometric" && (
          <div className="space-y-6 text-center">
            <div>
              <h2 className="text-xl font-semibold text-fg">Register biometrics</h2>
              <p className="mt-2 text-sm text-muted">
                Tap below and follow your device's prompt to register Face ID or your fingerprint.
              </p>
            </div>

            <button
              onClick={registerBiometric}
              disabled={bioActive}
              className={cn(
                "group mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 transition-all duration-200",
                bioActive
                  ? "animate-pulse border-[#0F766E] bg-[#0F766E]/20"
                  : "border-border bg-surface/60 hover:border-[#0F766E] hover:bg-[#0F766E]/10 active:scale-95"
              )}
            >
              {bioActive
                ? <Loader2 className="h-9 w-9 animate-spin text-[#0F766E]" />
                : <Fingerprint className="h-9 w-9 text-[#0F766E] transition-transform group-hover:scale-110" />
              }
            </button>

            <p className="text-sm text-muted">
              {bioActive ? "Waiting for biometric…" : "Tap to begin"}
            </p>

            {error && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5" /> {error}
              </p>
            )}

            <button
              onClick={() => { setError(null); setStep("pin"); }}
              disabled={bioActive}
              className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted hover:border-[#0F766E]/40 hover:text-fg transition-colors disabled:opacity-40"
            >
              Skip biometrics — use PIN only
            </button>
          </div>
        )}

        {/* ── Set PIN ───────────────────────────────────────────────────── */}
        {step === "pin" && (
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              {bioRegistered && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#0F766E]">
                  <Check className="h-3.5 w-3.5" /> Biometrics registered
                </div>
              )}
              <h2 className="text-xl font-semibold text-fg">Set your PIN</h2>
              <p className="text-sm text-muted">Choose a 6-digit PIN as your fallback.</p>
              <PinDots filled={pin.length} error={false} />
            </div>

            <NumPad onKey={handlePinKey} disabled={pin.length === PIN_LENGTH} />
          </div>
        )}

        {/* ── Confirm PIN ───────────────────────────────────────────────── */}
        {step === "confirm" && (
          <div className="space-y-6">
            <div className="space-y-3 text-center">
              <h2 className="text-xl font-semibold text-fg">Confirm your PIN</h2>
              <p className="text-sm text-muted">Enter the same PIN again to confirm.</p>
              <PinDots filled={confirmPin.length} error={pinError} />
              {error && (
                <p className="flex items-center justify-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" /> {error}
                </p>
              )}
            </div>

            <NumPad
              onKey={handlePinKey}
              disabled={pending || confirmPin.length === PIN_LENGTH}
            />

            {pending && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </div>
            )}
          </div>
        )}

        {/* ── Done ──────────────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#0F766E] bg-[#0F766E]/10">
              <ShieldCheck className="h-9 w-9 text-[#0F766E]" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-fg">You're protected</h2>
              <p className="mt-2 text-sm text-muted">
                {bioRegistered
                  ? "Use Face ID / fingerprint or your PIN to unlock Ayura."
                  : "Use your PIN to unlock Ayura."}
              </p>
            </div>

            <div className="space-y-2 text-left">
              {bioRegistered && (
                <div className="flex items-center gap-3 rounded-xl border border-[#0F766E]/30 bg-[#0F766E]/10 p-3">
                  <Fingerprint className="h-4 w-4 shrink-0 text-[#0F766E]" />
                  <span className="text-sm text-fg">Biometrics enabled</span>
                  <Check className="ml-auto h-4 w-4 text-[#0F766E]" />
                </div>
              )}
              <div className="flex items-center gap-3 rounded-xl border border-[#0F766E]/30 bg-[#0F766E]/10 p-3">
                <KeyRound className="h-4 w-4 shrink-0 text-[#0F766E]" />
                <span className="text-sm text-fg">PIN set</span>
                <Check className="ml-auto h-4 w-4 text-[#0F766E]" />
              </div>
            </div>

            <button
              onClick={onComplete}
              className="w-full rounded-xl bg-[#0F766E] py-3 text-sm font-semibold text-white hover:bg-[#115E59] transition-colors active:scale-95"
            >
              Open Ayura
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
