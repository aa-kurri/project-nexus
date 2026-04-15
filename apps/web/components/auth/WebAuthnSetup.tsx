"use client";

import { useState, useTransition } from "react";
import {
  Key,
  ShieldCheck,
  Usb,
  Wifi,
  Bluetooth,
  Smartphone,
  ChevronRight,
  Loader2,
  AlertCircle,
  Check,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getRegistrationOptions,
  registerStaffCredential,
} from "@/app/(hospital)/settings/security/actions";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Props {
  staffId:    string;
  onComplete: (deviceName: string) => void;
  onCancel?:  () => void;
}

type Step = "intro" | "registering" | "naming" | "done";

// ── Helpers ───────────────────────────────────────────────────────────────────

function transportIcon(transport: string) {
  switch (transport) {
    case "usb":      return <Usb       className="h-3 w-3" />;
    case "nfc":      return <Wifi      className="h-3 w-3" />;
    case "ble":      return <Bluetooth className="h-3 w-3" />;
    case "internal": return <Smartphone className="h-3 w-3" />;
    default:         return null;
  }
}

/** Guess a friendly device name from the authenticator AAGUID or user-agent. */
function guessDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua))  return "iPhone · Face ID / Touch ID";
  if (/Mac/.test(ua))          return "Mac · Touch ID";
  if (/Android/.test(ua))      return "Android · Fingerprint";
  if (/Windows/.test(ua))      return "Windows · Hello";
  return "Hardware Security Key";
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i < current
              ? "w-4 bg-[#0F766E]"
              : i === current
              ? "w-4 bg-[#0F766E]/70"
              : "w-1.5 bg-border"
          )}
        />
      ))}
    </div>
  );
}

// ── WebAuthnSetup ─────────────────────────────────────────────────────────────

export default function WebAuthnSetup({ staffId, onComplete, onCancel }: Props) {
  const [step, setStep]           = useState<Step>("intro");
  const [error, setError]         = useState<string | null>(null);
  const [active, setActive]       = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [detectedName, setDetected] = useState("");
  const [transports, setTransports] = useState<string[]>([]);
  const [backedUp, setBackedUp]   = useState(false);

  // Staged credential data — held in state until user confirms device name
  const [staged, setStaged] = useState<{
    credentialId:  string;
    publicKeyCbor: string;
    counter:       number;
    attestationObject: string;
    clientDataJSON:    string;
  } | null>(null);

  const [pending, startTx] = useTransition();

  const stepIndex = step === "intro" ? 0 : step === "registering" ? 1 : 2;

  // ── Step 1 → 2: trigger browser FIDO2 prompt ────────────────────────────────

  async function startRegistration() {
    setError(null);
    setActive(true);
    setStep("registering");

    try {
      // 1. Fetch server challenge
      const { ok, options, error: optErr } = await getRegistrationOptions(staffId);
      if (!ok || !options) throw new Error(optErr ?? "Could not generate registration challenge");

      // 2. Build PublicKeyCredentialCreationOptions
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: Uint8Array.from(atob(options.challenge.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)),
        rp: {
          id:   options.rpId,
          name: options.rpName,
        },
        user: {
          id:          Uint8Array.from(atob(options.userId.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)),
          name:        options.userName,
          displayName: options.userDisplayName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7   },  // ES256 (preferred)
          { type: "public-key", alg: -257 },  // RS256 (Windows Hello fallback)
        ],
        authenticatorSelection: {
          userVerification: "required",   // PIN or biometric confirmation mandatory
          residentKey:      "preferred",  // passkey-first: discoverable credential
        },
        excludeCredentials: options.excludeCredentialIds.map(id => ({
          id:   Uint8Array.from(atob(id.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)),
          type: "public-key",
        })),
        attestation: "none",  // privacy-preserving — no device attestation stored
        timeout: options.timeout,
      };

      // 3. Invoke browser credential API (triggers authenticator UI)
      const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential | null;
      if (!credential) throw new Error("Registration was cancelled or timed out");

      const response = credential.response as AuthenticatorAttestationResponse;

      // 4. Extract values to send to server
      const credentialId    = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
                                .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      const publicKeyCbor   = btoa(String.fromCharCode(...new Uint8Array(response.getPublicKey?.() ?? new ArrayBuffer(0))))
                                .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      const attestObj       = btoa(String.fromCharCode(...new Uint8Array(response.attestationObject)))
                                .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      const clientData      = btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON)))
                                .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      const txTransports    = response.getTransports?.() ?? [];

      setStaged({ credentialId, publicKeyCbor, counter: 0, attestationObject: attestObj, clientDataJSON: clientData });
      setTransports(txTransports);
      // Passkey backup flag from authenticator data (bit 4 of flags byte)
      const authData = response.getAuthenticatorData?.();
      if (authData) {
        const flagsByte = new Uint8Array(authData)[32];
        setBackedUp(!!(flagsByte & 0x10));
      }
      const detected = guessDeviceName();
      setDetected(detected);
      setDeviceName(detected);
      setStep("naming");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      // DOMException: NotAllowedError → user dismissed the prompt
      if (msg.includes("NotAllowedError") || msg.includes("cancelled")) {
        setError("The browser prompt was dismissed. Click 'Register key' to try again.");
        setStep("intro");
      } else {
        setError(msg);
        setStep("intro");
      }
    } finally {
      setActive(false);
    }
  }

  // ── Step 3 → done: confirm name and persist ──────────────────────────────────

  function confirmRegistration() {
    if (!staged) return;
    setError(null);
    startTx(async () => {
      const res = await registerStaffCredential({
        staffId,
        credentialId:      staged.credentialId,
        publicKeyCbor:     staged.publicKeyCbor,
        counter:           staged.counter,
        deviceName:        deviceName.trim() || detectedName,
        transports,
        backedUp,
        attestationObject: staged.attestationObject,
        clientDataJSON:    staged.clientDataJSON,
      });
      if (!res.ok) {
        setError(res.error ?? "Server-side verification failed");
        setStep("intro");
      } else {
        setStep("done");
      }
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center">
      <StepDots current={stepIndex} />

      <div className="mt-6 w-full max-w-sm space-y-6">

        {/* ── Step 0: Intro ─────────────────────────────────────────── */}
        {step === "intro" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#0F766E]/40 bg-[#0F766E]/10">
              <Key className="h-9 w-9 text-[#0F766E]" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-fg">Pair a hardware key</h2>
              <p className="mt-2 text-sm text-muted">
                Register a FIDO2 passkey or security key so you can sign in without
                a password — phishing-resistant by design.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-2.5 text-left">
              {[
                {
                  icon: ShieldCheck,
                  title: "Zero-Trust authentication",
                  body:  "Each login requires a cryptographic proof from your device. Passwords cannot be stolen.",
                },
                {
                  icon: Key,
                  title: "Works with YubiKey, Touch ID & Windows Hello",
                  body:  "USB, NFC, BLE security keys and built-in platform authenticators.",
                },
                {
                  icon: Smartphone,
                  title: "Passkey cloud backup (optional)",
                  body:  "Passkeys can sync to iCloud or Google Password Manager if your device supports it.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-xl border border-border bg-[hsl(220_13%_9%)] p-3"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" />
                  <div>
                    <p className="text-sm font-medium text-fg">{title}</p>
                    <p className="text-xs text-muted">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={startRegistration}
              disabled={active}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] py-3 text-sm font-semibold text-white hover:bg-[#115E59] transition-colors active:scale-[0.98] disabled:opacity-60"
            >
              Register key <ChevronRight className="h-4 w-4" />
            </button>

            {onCancel && (
              <button
                onClick={onCancel}
                className="text-xs text-muted underline underline-offset-2 hover:text-fg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {/* ── Step 1: Registering (waiting for authenticator) ────────── */}
        {step === "registering" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#0F766E] bg-[#0F766E]/10 animate-pulse">
              <Loader2 className="h-9 w-9 animate-spin text-[#0F766E]" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-fg">Touch your key</h2>
              <p className="mt-2 text-sm text-muted">
                Insert your security key and tap it, or use Face ID / fingerprint when
                prompted by the browser.
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-[#0F766E]/20 bg-[#0F766E]/5 px-3 py-2.5 text-xs text-muted text-left">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F766E]" />
              The browser dialog will appear shortly. Do not close this tab.
            </div>
          </div>
        )}

        {/* ── Step 2: Name the key ────────────────────────────────────── */}
        {step === "naming" && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#0F766E] bg-[#0F766E]/10">
                <Check className="h-7 w-7 text-[#0F766E]" />
              </div>
              <h2 className="text-xl font-semibold text-fg">Key detected</h2>
              <p className="mt-2 text-sm text-muted">
                Give this key a name so you can identify it later.
              </p>
            </div>

            {/* Transport badges */}
            {transports.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {transports.map(t => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="flex items-center gap-1 border-[#0F766E]/30 bg-[#0F766E]/10 text-[10px] text-[#0F766E]"
                  >
                    {transportIcon(t)}
                    {t.toUpperCase()}
                  </Badge>
                ))}
                {backedUp && (
                  <Badge
                    variant="outline"
                    className="border-sky-500/30 bg-sky-500/10 text-[10px] text-sky-400"
                  >
                    Passkey (cloud synced)
                  </Badge>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted" htmlFor="key-name">
                Device name
              </label>
              <input
                id="key-name"
                value={deviceName}
                onChange={e => setDeviceName(e.target.value)}
                maxLength={120}
                placeholder={detectedName}
                className="w-full rounded-xl border border-border bg-[hsl(220_13%_9%)] px-3 py-2.5 text-sm text-fg placeholder:text-muted/40 outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]/40 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={confirmRegistration}
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] py-3 text-sm font-semibold text-white hover:bg-[#115E59] transition-colors active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {pending ? "Saving…" : "Save key"}
            </button>
          </div>
        )}

        {/* ── Done ──────────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#0F766E] bg-[#0F766E]/10">
              <ShieldCheck className="h-9 w-9 text-[#0F766E]" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-fg">Key registered</h2>
              <p className="mt-2 text-sm text-muted">
                <span className="font-medium text-fg">
                  {deviceName.trim() || detectedName}
                </span>{" "}
                is now paired. You can use it to sign in without a password.
              </p>
            </div>

            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 shrink-0 text-[#0F766E]" />
                <span className="text-sm text-fg flex-1 truncate">
                  {deviceName.trim() || detectedName}
                </span>
                <Check className="h-4 w-4 text-[#0F766E]" />
              </div>
              {transports.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-7">
                  {transports.map(t => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="flex items-center gap-1 border-[#0F766E]/30 bg-[#0F766E]/10 text-[10px] text-[#0F766E]"
                    >
                      {transportIcon(t)} {t.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            <button
              onClick={() => onComplete(deviceName.trim() || detectedName)}
              className="w-full rounded-xl bg-[#0F766E] py-3 text-sm font-semibold text-white hover:bg-[#115E59] transition-colors active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
